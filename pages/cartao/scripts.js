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
    await window.controle.invoke('add-despesa', despesa);
    loadCartoes(); // Atualizar a lista de cartões
}

async function pagarFatura(cartaoId) {
    await window.controle.invoke('pagar-fatura', cartaoId);
    loadCartoes(); // Atualizar a lista de cartões
}

async function loadCartoes() {
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
                <button class="btn btn-success btn-sm" onclick="pagarFatura(${cartao.id})">Pagar Fatura</button>
            </td>
        `;
        tableBody.appendChild(row); // Adicionar linha à tabela
    });
}

async function deleteCartao(id) {
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
        await window.controle.invoke('delete-cartao', id);
        loadCartoes(); // Atualizar a lista de cartões
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

    await window.controle.invoke('update-cartao', { id, nome, banco, limite: parseFloat(limite) });
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editCartaoModal'));
    editModal.hide();
    loadCartoes(); // Atualizar a lista de cartões
    event.target.reset(); // Resetar o formulário
    document.getElementById('editCartaoForm').querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
});

loadCartoes();