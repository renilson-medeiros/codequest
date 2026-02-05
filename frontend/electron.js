const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;
let tray;
let backendProcess;
let isDevMode = false;

// Detectar se está em modo desenvolvimento
// Detectar se está em modo desenvolvimento
function detectDevMode() {
  const distPath = path.join(__dirname, "dist");
  // Check for env var, missing dist, or --dev argument
  const hasDevFlag = process.argv.includes("--dev");
  const hasEnvVar = process.env.ELECTRON_IS_DEV === "true";
  const missingDist = !fs.existsSync(distPath);
  
  isDevMode = hasDevFlag || hasEnvVar || missingDist;
  
  console.log(`[CodeQuest] Dev Check: Flag=${hasDevFlag}, Env=${hasEnvVar}, NoDist=${missingDist}`);
  console.log(`[CodeQuest] Modo: ${isDevMode ? "DESENVOLVIMENTO" : "PRODUÇÃO"}`);
  return isDevMode;
}

// Iniciar servidor Python
function startBackend() {
  const isWin = process.platform === "win32";
  const pythonCmd = isWin ? "python" : "python3";
  const backendPath = path.join(__dirname, "..", "backend");

  console.log("[CodeQuest] Iniciando backend Python...");
  console.log(`[CodeQuest] Caminho do backend: ${backendPath}`);

  backendProcess = spawn(pythonCmd, ["main.py"], {
    cwd: backendPath,
    shell: true,
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`[Backend] Processo encerrado com código ${code}`);
  });

  backendProcess.on("error", (err) => {
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
    console.log("[CodeQuest] Carregando de http://localhost:5173");
    mainWindow.loadURL("http://localhost:5173").catch((err) => {
      console.error(
        "[CodeQuest] Erro ao carregar URL de desenvolvimento:",
        err.message,
      );
      console.log(
        "[CodeQuest] Certifique-se de que o Vite está rodando (npm run dev)",
      );
    });
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    console.log("[CodeQuest] Carregando de:", indexPath);
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error("[CodeQuest] Erro ao carregar arquivo:", err.message);
      console.log('[CodeQuest] Execute "npm run build" primeiro');
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
    if (url.startsWith("http") && !url.includes("localhost:5173") && !url.includes("127.0.0.1:5173")) {
      event.preventDefault();
      shell.openExternal(url);
      console.log(`[CodeQuest] Interceptado will-navigate: ${url}`);
    }
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
const { ipcMain } = require('electron');

ipcMain.on('resize-window', (event, { width, height }) => {
  if (mainWindow) {
    console.log(`[CodeQuest] Redimensionando janela para: ${width}x${height}`);
    mainWindow.setSize(width, height, true);
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});
