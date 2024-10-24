const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {
    adicionarConta,
    obterContas,
    removerConta,
    adicionarTransacao,
    obterUltimasTransacoes,
} = require('./db/database'); // Importa apenas as funções

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('src/index.html'); // ou o arquivo correto da interface
});

// Gerenciar Contas
ipcMain.handle('adicionarConta', async (event, nomeConta, tipo, saldo_inicial, saldo_atual) => {
    const id = await adicionarConta(nomeConta, tipo, saldo_inicial, saldo_atual);
    return { id, nome: nomeConta };
});

ipcMain.handle('listarContas', async () => {
    return await obterContas();
});

ipcMain.handle('deletarConta', async (event, id) => {
    await removerConta(id);
});

// Gerenciar Categorias
// ... (adicionarCategoria, listarCategorias, deletarCategoria, etc. também devem ser ajustados)
