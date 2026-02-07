const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

// SOLVE NO AUDIO IN ELECTRON
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

let mainWindow;
let playerWindow;
let tray;
let backendProcess;
let isDevMode = false;

// Detectar modo portátil
const isPortable =
  !app.isPackaged ||
  fs.existsSync(path.join(process.resourcesPath, "portable.txt"));

// Configurar caminhos para modo portátil
if (isPortable) {
  const portableDir = app.isPackaged
    ? path.dirname(process.execPath) // Pasta do .exe
    : __dirname;

  // Usar pasta local para dados
  app.setPath("userData", path.join(portableDir, "data"));
  app.setPath("logs", path.join(portableDir, "data", "logs"));
}

// Modificar DATABASE_PATH no backend (via variável de ambiente)
process.env.DATABASE_PATH = path.join(app.getPath("userData"), "codequest.db");

// Configurar logs em arquivo para debug em produção
const logFilePath = path.join(app.getPath("logs"), "electron.log");
function log(msg) {
  const timestamp = new Date().toISOString();
  const formattedMsg = `[${timestamp}] ${msg}\n`;
  console.log(msg);
  try {
    fs.appendFileSync(logFilePath, formattedMsg);
  } catch (e) {}
}

// Detectar se está em modo desenvolvimento
function detectDevMode() {
  // Se está empacotado, NUNCA é modo dev
  if (app.isPackaged) {
    isDevMode = false;
  } else {
    const hasDevFlag = process.argv.includes("--dev");
    const hasEnvVar = process.env.ELECTRON_IS_DEV === "true";
    isDevMode = hasDevFlag || hasEnvVar;
  }
  
  log(`Modo: ${isDevMode ? "DESENVOLVIMENTO" : "PRODUÇÃO"}`);
  log(`App Packaged: ${app.isPackaged}`);
  log(`__dirname: ${__dirname}`);
  log(`execPath: ${process.execPath}`);
  
  return isDevMode;
}

// Iniciar servidor Python
function startBackend() {
  let backendExe;

  if (app.isPackaged) {
    // Produção: backend está em resources/backend/
    backendExe = path.join(
      process.resourcesPath,
      "backend",
      "codequest-backend.exe",
    );
  } else {
    // Desenvolvimento
    const isWin = process.platform === "win32";
    const pythonCmd = isWin ? "python" : "python3";
    const backendPath = path.join(__dirname, "..", "backend");

    console.log("[CodeQuest] Iniciando backend Python (DEV)...");
    backendProcess = spawn(pythonCmd, ["main.py"], {
      cwd: backendPath,
      shell: true,
    });

    setupBackendListeners(backendProcess);
    return;
  }

  console.log("[CodeQuest] Iniciando backend portátil:", backendExe);

  backendProcess = spawn(backendExe, [], {
    env: {
      ...process.env,
      DATABASE_PATH: process.env.DATABASE_PATH,
    },
  });

  setupBackendListeners(backendProcess);
}

function setupBackendListeners(process) {
  process.stdout.on("data", (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  process.on("close", (code) => {
    console.log(`[Backend] Processo encerrado com código ${code}`);
  });

  process.on("error", (err) => {
    console.error(`[Backend] Erro ao iniciar: ${err.message}`);
  });
}

// Criar janela principal
function createWindow() {
  console.log("[CodeQuest] Criando janela principal...");

  // Configuração da janela
  const windowConfig = {
    width: 400,
    height: 550,
    minWidth: 100,
    minHeight: 100,
    backgroundColor: "#1E1E1E",
    title: "CodeQuest",
    frame: false,
    transparent: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  };

  // Adicionar ícone apenas se existir
  const iconPath = path.join(__dirname, "public", "icon.png");
  if (fs.existsSync(iconPath)) {
    windowConfig.icon = iconPath;
  } else {
    console.warn("[CodeQuest] Ícone não encontrado em:", iconPath);
  }

  mainWindow = new BrowserWindow(windowConfig);

  // Mostrar janela quando estiver pronta
  mainWindow.once("ready-to-show", () => {
    console.log("[CodeQuest] Janela pronta, exibindo...");
    mainWindow.show();
  });

  // Carregar app baseado no modo
  if (isDevMode) {
    log("Carregando de http://localhost:5173");
    mainWindow.loadURL("http://localhost:5173").catch((err) => {
      log(`Erro ao carregar URL de desenvolvimento: ${err.message}`);
    });
  } else {
    // IMPORTANTE: Em produção, dist está na mesma pasta que electron.js
    const indexPath = path.join(__dirname, "dist", "index.html");
    log(`Carregando de: ${indexPath}`);
    if (!fs.existsSync(indexPath)) {
      log(`ERRO CRÍTICO: Arquivo não encontrado: ${indexPath}`);
    }
    mainWindow.loadFile(indexPath).catch((err) => {
      log(`Erro ao carregar arquivo: ${err.message}`);
    });
  }

  // Minimizar para tray ao invés de fechar
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      console.log("[CodeQuest] Janela minimizada para bandeja");
    }
    return false;
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error(
        `[CodeQuest] Falha ao carregar: ${errorDescription} (código: ${errorCode})`,
      );
    },
  );

  // Abrir links externos no navegador padrão (ESSENCIAL PARA LOGIN SPOTIFY)
  const { shell } = require("electron");

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
      console.log(`[CodeQuest] Abrindo link externo: ${url}`);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Alternativa para navegação direta na mesma janela
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http") && !url.includes("localhost")) {
      event.preventDefault();
      require("electron").shell.openExternal(url);
    }
  });

  createPlayerWindow();
}

function createPlayerWindow() {
  if (!mainWindow) return;

  const mainBounds = mainWindow.getBounds();

  playerWindow = new BrowserWindow({
    width: mainBounds.width,
    height: 80,
    x: mainBounds.x,
    y: mainBounds.y + mainBounds.height + 8,
    frame: false,
    resizable: false,
    transparent: false,
    backgroundColor: "#1E1E1E",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
    parent: mainWindow, 
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });

  // Carregar a rota do player
  const playerUrl = isDevMode
    ? "http://localhost:5173/#/player"
    : `file://${path.join(__dirname, "dist", "index.html")}#/player`;

  playerWindow.loadURL(playerUrl);

  playerWindow.once("ready-to-show", () => {
    playerWindow.show();
  });

  // Sincronizar movimento e redimensionamento
  const updatePlayerPosition = () => {
    if (!mainWindow || !playerWindow) return;
    try {
      const bounds = mainWindow.getBounds();
      playerWindow.setBounds({
        x: bounds.x,
        y: bounds.y + bounds.height + 8,
        width: bounds.width,
        height: 80,
      });
    } catch (e) {
      // Ignora erro se janela destruída
    }
  };

  mainWindow.on("move", updatePlayerPosition);
  mainWindow.on("resize", updatePlayerPosition);

  // Minimizar/Restaurar juntos
  mainWindow.on("minimize", () => playerWindow.minimize());
  mainWindow.on("restore", () => playerWindow.restore());
  mainWindow.on("hide", () => playerWindow.hide());
  mainWindow.on("show", () => playerWindow.show());

  // Fechar juntas
  playerWindow.on("closed", () => {
    playerWindow = null;
  });
}

// Criar Tray Icon (bandeja do sistema)
function createTray() {
  const trayIconPath = path.join(__dirname, "public", "icon.png");
  console.log("[CodeQuest] Caminho do ícone da bandeja:", trayIconPath);

  if (!fs.existsSync(trayIconPath)) {
    console.warn("[CodeQuest] Ícone da bandeja não encontrado:", trayIconPath);
    console.warn("[CodeQuest] Pulando criação da bandeja do sistema");
    return;
  }

  try {
    const icon = nativeImage
      .createFromPath(trayIconPath)
      .resize({ width: 16, height: 16 });
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Abrir CodeQuest",
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: "Sair",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("CodeQuest");
    tray.setContextMenu(contextMenu);

    tray.on("double-click", () => {
      mainWindow.show();
    });

    console.log("[CodeQuest] Ícone da bandeja criado com sucesso");
  } catch (err) {
    console.error("[CodeQuest] Erro ao criar ícone da bandeja:", err.message);
  }
}

// Quando o Electron estiver pronto
app.whenReady().then(() => {
  detectDevMode();
  startBackend();

  console.log("[CodeQuest] Aguardando 3 segundos para o backend iniciar...");
  setTimeout(() => {
    createWindow();
    createTray();
  }, 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// IPC Handlers
ipcMain.on("theme-change", (event, color) => {
  // Broadcast to player window
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.webContents.send("theme-change", color);
  }
});

// Fechar tudo ao sair
app.on("before-quit", () => {
  app.isQuitting = true;
  console.log("[CodeQuest] Encerrando aplicação...");

  if (backendProcess) {
    console.log("[CodeQuest] Finalizando processo Python...");
    backendProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handlers para gerenciamento de janela

ipcMain.on("resize-window", (event, { width, height }) => {
  if (mainWindow) {
    console.log(`[CodeQuest] Redimensionando janela para: ${width}x${height}`);
    mainWindow.setSize(width, height, true);
  }
});

ipcMain.on("minimize-window", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("close-window", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on("quit-app", () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.on("set-player-visibility", (event, visible) => {
  if (playerWindow && !playerWindow.isDestroyed()) {
    if (visible) {
      playerWindow.show();
    } else {
      playerWindow.hide();
    }
  }
});
