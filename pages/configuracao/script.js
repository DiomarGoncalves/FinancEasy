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
});

document.getElementById('configForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const tema = document.getElementById('tema').value;
    const notificacoes = document.getElementById('notificacoes').value;
    const limiteGastos = parseFloat(document.getElementById('limiteGastos').value);

    // Salvar as configurações usando IPC
    await window.controle.saveConfig({ tema, notificacoes, limiteGastos });
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