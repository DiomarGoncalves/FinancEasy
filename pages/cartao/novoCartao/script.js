document.getElementById('cartaoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const cartao = {
        nome: document.getElementById('nome').value,
        banco: document.getElementById('banco').value,
        limite: document.getElementById('limite').value
    };

    await window.controle.invoke('add-cartao', cartao);
    alert('Cartão adicionado com sucesso!');
    event.target.reset();
});