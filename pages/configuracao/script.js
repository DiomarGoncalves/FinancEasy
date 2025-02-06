async function inserirDespesasAnoCompleto() {
    try {
        const resultado = await window.controle.inserirDespesasAnoCompleto();
        alert(resultado);
    } catch (error) {
        console.error('Erro ao inserir despesas:', error);
        alert('Erro ao inserir despesas. Verifique o console para mais detalhes.');
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    const config = await window.controle.loadConfig();
    document.getElementById('tema').value = config.tema;
    document.getElementById('notificacoes').value = config.notificacoes;
    document.getElementById('limiteGastos').value = config.limiteGastos || 0;
    document.getElementById('dbPath').value = config.dbPath || 'C:\\Users\\User\\AppData\\Local\\DBcontroleFinanceiro';
});

document.getElementById('selectDbPath').addEventListener('click', async () => {
    const dbPath = await window.controle.selectDbPath();
    if (dbPath) {
        document.getElementById('dbPath').value = dbPath;
    }
});

document.getElementById('configForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const tema = document.getElementById('tema').value;
    const notificacoes = document.getElementById('notificacoes').value;
    const limiteGastos = parseFloat(document.getElementById('limiteGastos').value);
    const dbPath = document.getElementById('dbPath').value;
    const novaSenha = document.getElementById('novaSenha').value;

    // Salvar as configurações usando IPC
    await window.controle.saveConfig({ tema, notificacoes, limiteGastos, dbPath, novaSenha});
    alert('Configurações salvas com sucesso!');
});

document.getElementById('inserirTeste').addEventListener('click', async () => {
    await window.controle.inserirValoresTeste();
    alert('Valores de teste inseridos com sucesso!');
});

document.getElementById('limparBanco').addEventListener('click', async () => {
    await window.controle.limparBanco();
    alert('Banco de dados limpo com sucesso!');
});