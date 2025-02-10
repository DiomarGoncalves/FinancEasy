function showFatura(cartaoId) {
    window.location.href = `faturas/faturas.html?cartaoId=${cartaoId}`;
}

async function registrarCompra(cartaoId, valor, descricao, parcelas = 1) {
    const despesa = {
        estabelecimento: descricao,
        data: new Date().toISOString().split('T')[0],
        valor: parseFloat(valor),
        forma_pagamento: 'Crédito',
        numero_parcelas: parseInt(parcelas),
        cartao_id: cartaoId
    };
    try {
        await window.controle.invoke('add-despesa', despesa);
        loadCartoes(); // Atualizar a lista de cartões
    } catch (error) {
        console.error(`Erro ao registrar compra: ${error.message}`);
    }
}

async function pagarFatura(cartaoId) {
    try {
        await window.controle.invoke('pagar-fatura', cartaoId);
        loadCartoes(); // Atualizar a lista de cartões
    } catch (error) {
        console.error(`Erro ao pagar fatura: ${error.message}`);
    }
}

async function loadCartoes() {
    try {
        const cartoes = await window.controle.invoke('get-cartoes');
        const tableBody = document.querySelector("#cartoesTable tbody");
        tableBody.innerHTML = ''; // Limpar tabela

        cartoes.forEach((cartao) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${cartao.nome}</td>
                <td>${cartao.banco}</td>
                <td>${cartao.limite}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="showEditModal(${cartao.id}, '${cartao.nome}', '${cartao.banco}', ${cartao.limite})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCartao(${cartao.id})">Excluir</button>
                    <button class="btn btn-info btn-sm" onclick="showFatura(${cartao.id})">Fatura</button>
                </td>
            `;
            tableBody.appendChild(row); // Adicionar linha à tabela
        });
    } catch (error) {
        console.error(`Erro ao carregar cartões: ${error.message}`);
    }
}

async function deleteCartao(id) {
    try {
        await window.controle.invoke('delete-cartao', id);
        loadCartoes(); // Atualizar a lista de cartões
        showMessage('Cartão excluído com sucesso!', 'success');
    } catch (error) {
        console.error(`Erro ao excluir cartão: ${error.message}`);
        showMessage(`Erro ao excluir cartão: ${error.message}`, 'danger');
    }
}

function showEditModal(id, nome, banco, limite) {
    document.getElementById('editCartaoId').value = id;
    document.getElementById('editNome').value = nome;
    document.getElementById('editBanco').value = banco;
    document.getElementById('editLimite').value = limite;
    const editModal = new bootstrap.Modal(document.getElementById('editCartaoModal'));
    editModal.show();
}

document.getElementById('editCartaoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = document.getElementById('editCartaoId').value;
    const nome = document.getElementById('editNome').value;
    const banco = document.getElementById('editBanco').value;
    const limite = document.getElementById('editLimite').value;

    try {
        await window.controle.invoke('update-cartao', { id, nome, banco, limite: parseFloat(limite) });
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editCartaoModal'));
        editModal.hide();
        loadCartoes(); // Atualizar a lista de cartões
        event.target.reset(); // Resetar o formulário
        document.getElementById('editCartaoForm').querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
    } catch (error) {
        console.error(`Erro ao atualizar cartão: ${error.message}`);
    }
});

function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const messageContainer = document.createElement('div');
    messageContainer.id = 'messageContainer';
    document.body.prepend(messageContainer);
    loadCartoes();
});