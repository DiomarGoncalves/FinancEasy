document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const senha = document.getElementById('senha').value;
    if (senha === 'admin') {
        window.location.href = '../configuracao.html';
    } else {
        alert('Senha incorreta!');
    }
});