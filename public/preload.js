window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('controle', {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    verificarSenha: (senha) => ipcRenderer.invoke('verificar-senha', senha),
    selectDbPath: () => ipcRenderer.invoke('select-db-path'),
    inserirValoresTeste: () => ipcRenderer.invoke('inserir-valores-teste'),
    limparBanco: () => ipcRenderer.invoke('limpar-banco'),
    getDespesas: () => ipcRenderer.invoke('get-despesas'),
    getCartoes: () => ipcRenderer.invoke('get-cartoes'),
    addReceita: (receita) => ipcRenderer.invoke('add-receita', receita),
    getReceitas: () => ipcRenderer.invoke('get-receitas'),
    deleteReceita: (id) => ipcRenderer.invoke('delete-receita', id),
    getDespesasFiltradas: (filtros) => ipcRenderer.invoke('get-despesas-filtradas', filtros),
    getReceitasFiltradas: (filtros) => ipcRenderer.invoke('get-receitas-filtradas', filtros),
    calcularSaldo: () => ipcRenderer.invoke('calcular-saldo'),
    inserirDespesasAnoCompleto: () => ipcRenderer.invoke('inserir-despesas-ano-completo'),
});
