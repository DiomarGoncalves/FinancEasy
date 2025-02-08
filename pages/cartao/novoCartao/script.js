function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    console.log(form);
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
};

document.getElementById('cartaoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const cartao = {
        nome: document.getElementById('nome').value,
        banco: document.getElementById('banco').value,
        limite: document.getElementById('limite').value,
        vencimento: document.getElementById('vencimento').value
    };

    await window.controle.invoke('add-cartao', cartao);
    resetFormAndUnlockInputs(event.target); // Resetar e desbloquear inputs
    event.target.reset(); // Resetar o formulário
});