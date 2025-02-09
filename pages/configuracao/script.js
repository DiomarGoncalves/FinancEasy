function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
}

function showMessage(message, type) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `alert alert-${type}`;
    messageContainer.textContent = message;
    document.body.prepend(messageContainer);
    setTimeout(() => {
        messageContainer.remove();
    }, 10000);
}

async function inserirDespesasAnoCompleto() {
    try {
        await window.controle.inserirDespesasAnoCompleto();
        showMessage('Despesas inseridas para todos os meses do ano de 2025!', 'success');
    } catch (error) {
        showMessage(`Erro ao inserir despesas: ${error.message}`, 'danger');
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
        showMessage(`Erro ao carregar configurações: ${error.message}`, 'danger');
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
        showMessage(`Erro ao selecionar caminho do banco de dados: ${error.message}`, 'danger');
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
        await window.controle.saveConfig(config);
        showMessage('Configurações salvas com sucesso!', 'success');
        event.target.reset(); // Resetar o formulário
        document.getElementById('configForm').querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
    } catch (error) {
        showMessage(`Erro ao salvar configurações: ${error.message}`, 'danger');
    }
});

document.getElementById('inserirTeste').addEventListener('click', async () => {
    try {
        await window.controle.inserirValoresTeste();
        showMessage('Valores de teste inseridos com sucesso!', 'success');
    } catch (error) {
        showMessage(`Erro ao inserir valores de teste: ${error.message}`, 'danger');
    }
});

document.getElementById('limparBanco').addEventListener('click', async () => {
    try {
        await window.controle.limparBanco();
        showMessage('Banco de dados limpo com sucesso!', 'success');
    } catch (error) {
        showMessage(`Erro ao limpar banco de dados: ${error.message}`, 'danger');
    }
});

document.getElementById('exportarDados').addEventListener('click', async () => {
    try {
        const formato = await window.controle.selecionarFormato();
        if (formato) {
            const resultado = await window.controle.exportarDados(formato);
            if (resultado.status === "success") {
                showMessage(resultado.message, 'success');
            } else {
                showMessage(resultado.message, 'warning');
            }
        }
    } catch (error) {
        showMessage(`Erro ao exportar dados: ${error.message}`, 'danger');
    }
});

document.getElementById('importarDados').addEventListener('click', async () => {
    try {
        const formato = await window.controle.selecionarFormato();
        if (formato) {
            const resultado = await window.controle.importarDados(formato);
            if (resultado.status === "success") {
                showMessage(resultado.message, 'success');
                loadReceitas(); // Atualizar a lista de receitas após a importação
            } else {
                showMessage(resultado.message, 'warning');
            }
        }
    } catch (error) {
        showMessage(`Erro ao importar dados: ${error.message}`, 'danger');
    }
});

async function loadReceitas() {
    try {
        const receitas = await window.controle.getReceitas();
        const tableBody = document.querySelector("#receitasTable tbody");
        if (tableBody) {
            tableBody.innerHTML = ""; // Limpar tabela

            receitas.forEach((receita) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${receita.descricao}</td>
                    <td>R$ ${receita.valor.toFixed(2)}</td>
                    <td>${receita.data}</td>
                    <td>${receita.categoria}</td>
                    <td>${receita.fonte}</td>
                    <td>${receita.forma_recebimento}</td>
                    <td>${receita.conta_bancaria}</td>
                    <td>${receita.recorrente ? 'Sim' : 'Não'}</td>
                    <td>${receita.intervalo_recorrencia || '-'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteReceita(${receita.id})">Excluir</button>
                    </td>
                `;
                tableBody.appendChild(row); // Adicionar linha à tabela
            });
        }
    } catch (error) {
        showMessage(`Erro ao carregar receitas: ${error.message}`, 'danger');
    }
}

async function deleteReceita(id) {
    try {
        await window.controle.deleteReceita(id);
        loadReceitas(); // Atualizar a lista de receitas
        showMessage('Receita excluída com sucesso!', 'success');
    } catch (error) {
        showMessage(`Erro ao excluir receita: ${error.message}`, 'danger');
    }
}