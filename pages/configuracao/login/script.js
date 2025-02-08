function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
}

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const senha = document.getElementById('senha').value;
    const senhaCorreta = await window.controle.verificarSenha(senha);
    if (senhaCorreta) {
        window.location.href = '../configuracao.html';
    } else {
        const msg = document.getElementById('msgErro');
        msg.textContent = 'Senha incorreta';
        resetFormAndUnlockInputs(event.target); // Resetar e desbloquear inputs
    }
});