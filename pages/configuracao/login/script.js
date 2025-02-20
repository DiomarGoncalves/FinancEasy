function showMessage(message, type) {
    // Cria o container do toast se não existir
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.style.position = "fixed";
        toastContainer.style.top = "20px";
        toastContainer.style.right = "20px";
        toastContainer.style.zIndex = "9999";
        toastContainer.style.display = "flex";
        toastContainer.style.flexDirection = "column";
        toastContainer.style.gap = "10px";
        document.body.appendChild(toastContainer);
    }

    // Cria o toast
    const toast = document.createElement("div");
    toast.className = `toast-message alert alert-${type}`;
    toast.textContent = message;
    toast.style.padding = "15px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
    toast.style.color = "#fff";
    toast.style.fontWeight = "bold";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    // Definindo cores para cada tipo
    const colors = {
        success: "#4CAF50",
        error: "#F44336",
        warning: "#FFC107",
        info: "#2196F3"
    };
    toast.style.backgroundColor = colors[type] || "#333";

    toastContainer.appendChild(toast);

    // Animação para aparecer
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 100);

    // Remover após 5 segundos
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}


function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
}

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const senha = document.getElementById('senha').value;
    try {
        const senhaCorreta = await window.controle.verificarSenha(senha);
        if (senhaCorreta) {
            window.location.href = '../configuracao.html';
        } else {
            showMessage("Senha incorreta!!", "error");
            resetFormAndUnlockInputs(event.target); // Resetar e desbloquear inputs
        }
    } catch (error) {
        console.error(`Erro ao verificar senha: ${error.message}`);
    }
});