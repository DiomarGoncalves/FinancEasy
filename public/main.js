const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const server = require('./server'); // Importar o servidor Express

const localAppDataPathConfig =
  process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "share");
const appFolderConfig = path.join(localAppDataPathConfig, "FinancEasyV2");
const configPath = path.join(appFolderConfig, "config.json");

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

// Função para salvar configurações
function saveConfig(config) {
  const currentConfig = loadConfig();
  const updatedConfig = { ...currentConfig, ...config };
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig));
}