document.addEventListener('DOMContentLoaded', function() {
    const content = document.getElementById('content');
    const navLinks = document.querySelectorAll('nav a');
    const resetButton = document.getElementById('reset-db');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const page = this.getAttribute('data-page');
            loadPage(page);
        });
    });

    resetButton.addEventListener('click', function() {
        if (confirm('Você tem certeza que deseja zerar o banco de dados?')) {
            // Lógica para zerar o banco de dados
            console.log('Banco de dados zerado');
        }
    });
});
