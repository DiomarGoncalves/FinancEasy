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
      dbPath: "C:\\databases",
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
      dbPath: "C:\\databases",
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
}

// IPC Handlers para inserir dados de teste e dados do ano completo
ipcMain.handle("add-test-data", async () => {
    try {
        const sqls = [
            `INSERT INTO receitas (descricao, valor, data, categoria, fonte) VALUES ('Salário', 3000.00, '2023-01-15', 'Salário', 'Empresa X');`,
            `INSERT INTO despesas (estabelecimento, valor, data, forma_pagamento) VALUES ('Supermercado', 150.00, '2023-01-10', 'Crédito');`,
            `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão A', 'Banco A', 1000.00, '2023-12-10');`,
            `INSERT INTO reservas (descricao, valor, data) VALUES ('Reserva de Emergência', 500.00, '2023-01-01');`,
            `INSERT INTO investimentos (nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem) VALUES ('Ação XYZ', 10, 1000.00, '2023-01-05', 'Ação', 'Conta Corrente');`
        ];

        for (const sql of sqls) {
            await db.runAsync(sql);
        }

        return { status: "success" };
    } catch (error) {
        console.error("Erro ao adicionar dados de teste:", error);
        return { status: "error", message: error.message };
    }
});

ipcMain.handle("add-year-data", async () => {
    try {
        const sqls = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, "0");
            sqls.push(
                `INSERT INTO receitas (descricao, valor, data, categoria, fonte) VALUES ('Salário ${monthStr}', 3000.00, '2023-${monthStr}-15', 'Salário', 'Empresa X');`,
                `INSERT INTO despesas (estabelecimento, valor, data, forma_pagamento) VALUES ('Supermercado ${monthStr}', 150.00, '2023-${monthStr}-10', 'Crédito');`,
                `INSERT INTO reservas (descricao, valor, data) VALUES ('Reserva ${monthStr}', 500.00, '2023-${monthStr}-01');`
            );
        }

        for (const sql of sqls) {
            await db.runAsync(sql);
        }

        return { status: "success" };
    } catch (error) {
        console.error("Erro ao adicionar dados do ano completo:", error);
        return { status: "error", message: error.message };
    }
});