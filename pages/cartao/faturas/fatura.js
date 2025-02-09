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
        console.error(`Erro ao registrar compra: ${error.message}`); // Mostrar mensagem de erro
    }
}

async function pagarFatura(cartaoId) {
    try {
        await window.controle.invoke('pagar-fatura', cartaoId);
        loadFaturas(cartaoId); // Atualizar a lista de faturas
        await atualizarLimiteCartao(cartaoId); // Atualizar o limite do cartão
    } catch (error) {
        console.error(`Erro ao pagar fatura: ${error.message}`); // Mostrar mensagem de erro
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
            <div class="table-responsive">
                <table class="table table-dark table-striped table-bordered w-100">
                    <thead>
                        <tr>
                            <th scope="col">Estabelecimento</th>
                            <th scope="col">Data</th>
                            <th scope="col">Valor</th>
                            <th scope="col">Forma de Pagamento</th>
                            <th scope="col">Número de Parcelas</th>
                            <th scope="col">Parcelas Restantes</th>
                            <th scope="col">Valor da Parcela</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${despesas.map(despesa => `
                            <tr>
                                <td>${despesa.estabelecimento}</td>
                                <td>${despesa.data}</td>
                                <td>R$ ${despesa.valor.toFixed(2)}</td>
                                <td>${despesa.forma_pagamento}</td>
                                <td>${despesa.numero_parcelas}</td>
                                <td>${despesa.parcelas_restantes}</td>
                                <td>R$ ${despesa.valor_parcela.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        faturaContainer.appendChild(faturaDiv);
    }
}

async function atualizarLimiteCartao(cartaoId) {
    try {
        await window.controle.invoke('update-limite-cartao', { id: cartaoId, valor: 0 });
    } catch (error) {
        console.log('erro');
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

        document.getElementById('pagarFaturaBtn').addEventListener('click', async () => {
            await pagarFatura(cartaoId);
        });
    }
});