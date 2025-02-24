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
    invoke: (channel, data) => ipcRenderer.invoke(channel, data).catch(error => { console.error(error.message); }),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    loadConfig: () => ipcRenderer.invoke('load-config').catch(error => { console.error(error.message); }),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config).catch(error => { console.error(error.message); }),
    verificarSenha: (senha) => ipcRenderer.invoke('verificar-senha', senha).catch(error => { console.error(error.message); }),
    selectDbPath: () => ipcRenderer.invoke('select-db-path').catch(error => { console.error(error.message); }),
    inserirValoresTeste: () => ipcRenderer.invoke('inserir-valores-teste').catch(error => { console.error(error.message); }),
    limparBanco: () => ipcRenderer.invoke('limpar-banco').catch(error => { console.error(error.message); }),
    getDespesas: () => ipcRenderer.invoke('get-despesas').catch(error => { console.error(error.message); }),
    getCartoes: () => ipcRenderer.invoke('get-cartoes').catch(error => { console.error(error.message); }),
    addReceita: (receita) => ipcRenderer.invoke('add-receita', receita).catch(error => { console.error(error.message); }),
    getReceitas: () => ipcRenderer.invoke('get-receitas').catch(error => { console.error(error.message); }),
    deleteReceita: (id) => ipcRenderer.invoke('delete-receita', id).catch(error => { console.error(error.message); }),
    getHistoricoDespesasFiltradas: (filtros) => ipcRenderer.invoke('get-historicoDespesas-filtradas', filtros).catch(error => { console.error(error.message); }),
    getDespesasFiltradas: (filtros) => ipcRenderer.invoke('get-despesas-filtradas', filtros).catch(error => { console.error(error.message); }),
    getReceitasFiltradas: (filtros) => ipcRenderer.invoke('get-receitas-filtradas', filtros).catch(error => { console.error(error.message); }),
    calcularSaldo: () => ipcRenderer.invoke('calcular-saldo').catch(error => { console.error(error.message); }),
    exportarDados: (formato) => ipcRenderer.invoke('exportar-dados', formato).catch(error => { console.error(error.message); }),
    importarDados: (formato) => ipcRenderer.invoke('importar-dados', formato).catch(error => { console.error(error.message); }),
    selecionarFormato: () => ipcRenderer.invoke('selecionar-formato').catch(error => { console.error(error.message); }),
    inserirDespesasAnoCompleto: () => ipcRenderer.invoke('inserir-despesas-ano-completo').catch(error => { console.error(error.message); }),
    addInvestment: (investment) => ipcRenderer.invoke('add-investment', investment),
    deleteInvestment: (id) => ipcRenderer.invoke('delete-investment', id),
    getInvestments: () => ipcRenderer.invoke('get-investments').catch(error => { console.error(error.message); }),
    markReceitaAsReceived: (id) => ipcRenderer.invoke('mark-receita-as-received', id).catch(error => { console.error(error.message); }),
    getHistoricoReceitasFiltradas: (filtros) => ipcRenderer.invoke('get-historicoReceitas-filtradas', filtros).catch(error => { console.error(error.message); }),
    getReservas: () => ipcRenderer.invoke('get-reservas').catch(error => { console.error(error.message); }),
    addReserva: (reserva) => ipcRenderer.invoke('add-reserva', reserva).catch(error => { console.error(error.message); }),
    deleteReserva: (id) => ipcRenderer.invoke('delete-reserva', id).catch(error => { console.error(error.message); }),
    updateReserva: (reserva) => ipcRenderer.invoke('update-reserva', reserva).catch(error => { console.error(error.message); }),
    getObjetivo: () => ipcRenderer.invoke('get-objetivo').catch(error => { console.error(error.message); }),
    setObjetivo: (objetivo) => ipcRenderer.invoke('set-objetivo', objetivo).catch(error => { console.error(error.message); })
});
