const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

const version = "1.0.0";
const sourceDir = path.join(__dirname, "..", "release", "CodeQuest-win32-x64");
const outputDir = path.join(__dirname, "..", "release");
const zipName = `CodeQuest-v${version}-portable.zip`;

async function packagePortable() {
  console.log("📦 Criando pacote portátil...");

  // Verificar se o diretório de origem existe
  if (!fs.existsSync(sourceDir)) {
      console.error(`❌ Diretório fonte não encontrado: ${sourceDir}`);
      process.exit(1);
  }

  // Criar pasta data
  const dataDir = path.join(sourceDir, "data");
  await fs.ensureDir(dataDir);

  // Criar arquivo marcador de modo portátil
  await fs.writeFile(
    path.join(sourceDir, "resources", "portable.txt"),
    "This is a portable installation",
  );

  // Criar README.txt
  const readme = `
CodeQuest - Portable Edition
============================

Como usar:
1. Extraia esta pasta para qualquer local
2. Clique duas vezes em CodeQuest.exe
3. Pronto! O app vai abrir

Seus dados (quests, configurações) ficam salvos na pasta "data".

Para atualizar: substitua todos os arquivos, EXCETO a pasta "data".

Requisitos:
- Windows 10 ou superior
- Conexão com internet (para login Spotify)

Suporte: github.com/renilson-medeiros/codequest
  `.trim();

  await fs.writeFile(path.join(sourceDir, "README.txt"), readme);

  // Criar arquivo ZIP
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(outputDir, zipName));
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ Pacote criado: ${zipName}`);
      console.log(
        `📊 Tamanho: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`,
      );
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, `CodeQuest-v${version}`);
    archive.finalize();
  });
}

packagePortable()
  .then(() => console.log("Done!"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
