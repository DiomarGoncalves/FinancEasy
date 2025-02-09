function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
}

async function inserirDespesasAnoCompleto() {
    try {
        const resultado = await window.controle.inserirDespesasAnoCompleto();
    } catch (error) {
        console.error('Erro ao inserir despesas:', error);
    }
}

document.addEventListener('DOMContentLoaded', async (event) => {
    try {
        const config = await window.controle.loadConfig();
        document.getElementById('tema').value = config.tema;
        document.getElementById('notificacoes').value = config.notificacoes;
        document.getElementById('limiteGastos').value = config.limiteGastos || 0;
        document.getElementById('dbPath').value = config.dbPath || 'C:\\Users\\User\\AppData\\Local\\FinancEasy';
        resetFormAndUnlockInputs(event.target);
    } catch (error) {
        console.error(`Erro ao carregar configurações: ${error.message}`);
    }
});

document.getElementById('selectDbPath').addEventListener('click', async (event) => {
    event.preventDefault();
    try {
        const dbPath = await window.controle.selectDbPath();
        if (dbPath) {
            document.getElementById('dbPath').value = dbPath;
        }
        resetFormAndUnlockInputs(event.target);
    } catch (error) {
        console.error(`Erro ao selecionar caminho do banco de dados: ${error.message}`);
    }
});

document.getElementById('configForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const config = {
        limiteGastos: document.getElementById('limiteGastos').value,
        dbPath: document.getElementById('dbPath').value,
        novaSenha: document.getElementById('novaSenha').value
    };

    try {
        await window.controle.invoke('save-config', config);
        console.log('Configurações salvas com sucesso!');
        event.target.reset(); // Resetar o formulário
        document.getElementById('configForm').querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
    } catch (error) {
        console.error(`Erro ao salvar configurações: ${error.message}`);
    }
});

document.getElementById('inserirTeste').addEventListener('click', async () => {
    try {
        await window.controle.inserirValoresTeste();
    } catch (error) {
        console.error(`Erro ao inserir valores de teste: ${error.message}`);
    }
});

document.getElementById('limparBanco').addEventListener('click', async () => {
    try {
        await window.controle.limparBanco();
        console.log('Banco de dados limpo com sucesso!');
    } catch (error) {
        console.error(`Erro ao limpar banco de dados: ${error.message}`);
    }
});