function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
}

async function inserirDespesasAnoCompleto() {
    try {
        const resultado = await window.controle.inserirDespesasAnoCompleto();
        alert(resultado);
    } catch (error) {
        console.error('Erro ao inserir despesas:', error);
        alert('Erro ao inserir despesas. Verifique o console para mais detalhes.');
    }
}
document.addEventListener('DOMContentLoaded', async (event) => {
    event.preventDefault();
    const config = await window.controle.loadConfig();
    document.getElementById('tema').value = config.tema;
    document.getElementById('notificacoes').value = config.notificacoes;
    document.getElementById('limiteGastos').value = config.limiteGastos || 0;
    document.getElementById('dbPath').value = config.dbPath || 'C:\\Users\\User\\AppData\\Local\\FinancEasy';
    resetFormAndUnlockInputs(event.target);
});

document.getElementById('selectDbPath').addEventListener('click', async (event) => {
    event.preventDefault();
    const dbPath = await window.controle.selectDbPath();
    if (dbPath) {
        document.getElementById('dbPath').value = dbPath;
    }
    resetFormAndUnlockInputs(event.target);
});

document.getElementById('configForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const config = {
        limiteGastos: document.getElementById('limiteGastos').value,
        dbPath: document.getElementById('dbPath').value,
        novaSenha: document.getElementById('novaSenha').value
    };

    await window.controle.invoke('save-config', config);
    alert('Configurações salvas com sucesso!');
    event.target.reset(); // Resetar o formulário
    document.getElementById('configForm').querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
});

document.getElementById('inserirTeste').addEventListener('click', async () => {
    await window.controle.inserirValoresTeste();
    alert('Valores de teste inseridos com sucesso!');
});

document.getElementById('limparBanco').addEventListener('click', async () => {
    await window.controle.limparBanco();
    alert('Banco de dados limpo com sucesso!');
});