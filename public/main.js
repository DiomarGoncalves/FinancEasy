const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const server = require('./server'); // Importar o servidor Express
const db = require("./database/db");

const localAppDataPathConfig =
  process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "share");
const appFolderConfig = path.join(localAppDataPathConfig, "FinancEasyV2");
const configPath = path.join(appFolderConfig, "config.json");

console.log("Caminho do arquivo de configuração:", configPath);
console.log("Caminho do diretório de configuração:", appFolderConfig);
console.log(db)

let serverInstance;

function startServer() {
  const config = loadConfig();
  const ip = config.ipServidor || '127.0.0.1';
  const port = config.portaServidor || 3050;

  if (serverInstance) {
    serverInstance.close(() => {
      console.log("Servidor reiniciado.");
    });
  }

  serverInstance = server.listen(port, ip, () => {
    console.log(`Servidor rodando em http://${ip}:${port}`);
  });
}

// Iniciar o servidor com as configurações atuais
startServer();

function createWindow() {
  const config = loadConfig();
  const ip = config.ipServidor || '127.0.0.1';
  const port = config.portaServidor || 3050;

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.maximize();

  // Carregar a URL do servidor Express
  mainWindow.loadURL(`http://${ip}:${port}/pages/home/home.html`);
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(() => {
  // Verificar e criar o diretório de configuração se não existir
  if (!fs.existsSync(appFolderConfig)) {
    fs.mkdirSync(appFolderConfig, { recursive: true });
  }

  // Verificar e criar o arquivo de configuração se não existir
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      tema:"escuro",
      notificacoes:"ativadas",
      limiteGastos:"0",
      senha:"admin",
      ipServidor:"127.0.0.1",
      portaServidor:3050,
      novaSenha:"",
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig));
  }
});

// Função para carregar configurações
function loadConfig() {
  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data);
  } catch (error) {
    return {
      tema:"escuro",
      notificacoes:"ativadas",
      limiteGastos:"0",
      senha:"admin",
      ipServidor:"127.0.0.1",
      portaServidor:3050,
      novaSenha:"",
    }; // Configurações padrão
  }
}

// IPC Handlers para configurações
ipcMain.handle("load-config", async () => {
  return loadConfig();
});

ipcMain.handle("save-config", async (event, config) => {
  saveConfig(config);
  startServer(); // Reiniciar o servidor com as novas configurações
  return { status: 'success' };
});

// IPC Handler para selecionar o caminho do banco de dados
ipcMain.handle("select-db-path", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    return null; // Retorna null se o usuário cancelar a seleção
  }

  return result.filePaths[0]; // Retorna o caminho selecionado
});

// Função para salvar configurações
function saveConfig(config) {
  const currentConfig = loadConfig();
  const updatedConfig = { ...currentConfig, ...config };
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig));
<<<<<<< Updated upstream
}

// Verifique se o código está sendo executado no processo de renderização
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Aplicação inicializada com sucesso!");

    // Exemplo de ajuste responsivo
    const sidebarToggle = document.querySelector("#sidebarToggle");
    const sidebar = document.querySelector(".sidebar");

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("hidden");
      });
    }
  });
} else {
  console.log('Este código está sendo executado no processo principal ou fora do navegador.');
=======
>>>>>>> Stashed changes
}