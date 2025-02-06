document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const senha = document.getElementById('senha').value;
    const senhaCorreta = await window.controle.verificarSenha(senha);
    if (senhaCorreta) {
        window.location.href = '../configuracao.html';
    } else {
        alert('Senha incorreta!');
    }
});