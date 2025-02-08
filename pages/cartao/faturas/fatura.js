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
        loadFaturas(cartaoId); // Atualizar a lista de faturas
    } catch (error) {
        alert(error.message); // Mostrar mensagem de erro
    }
}

async function loadFaturas(cartaoId) {
    const faturas = await window.controle.invoke('obter-faturas', cartaoId);
    const faturaContainer = document.getElementById('faturaContainer');
    faturaContainer.innerHTML = '';

    for (const fatura of faturas) {
        const despesas = await window.controle.invoke('obter-despesas-fatura', fatura.id);
        const faturaDiv = document.createElement('div');
        faturaDiv.classList.add('fatura');
        faturaDiv.innerHTML = `
            <h3>Fatura de ${fatura.data_inicio} a ${fatura.data_fim}</h3>
            <p>Valor Total: R$ ${fatura.valor_total.toFixed(2)}</p>
            <p>Status: ${fatura.paga ? 'Paga' : 'Aberta'}</p>
            <ul>
                ${despesas.map(despesa => `<li>${despesa.estabelecimento}: R$ ${despesa.valor.toFixed(2)} em ${despesa.data}</li>`).join('')}
            </ul>
        `;
        faturaContainer.appendChild(faturaDiv);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cartaoId = urlParams.get('cartaoId');
    if (cartaoId) {
        loadFaturas(cartaoId);

        document.getElementById('addCompraForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const valor = document.getElementById('valor').value;
            const descricao = document.getElementById('descricao').value;
            const parcelas = document.getElementById('parcelas').value;
            await registrarCompra(cartaoId, valor, descricao, parcelas);
            const addCompraModal = bootstrap.Modal.getInstance(document.getElementById('addCompraModal'));
            addCompraModal.hide();
            event.target.reset();
        });
    }
});