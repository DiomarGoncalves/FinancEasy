function showMessage(message, type) {
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

  const colors = {
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FFC107",
    info: "#2196F3"
  };
  toast.style.backgroundColor = colors[type] || "#333";
  
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 100);
  
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

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error("Elemento 'loginForm' não encontrado.");
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const senha = document.getElementById("senha").value.trim();

    try {
      console.log("Verificando senha...");
      const response = await fetch("/api/config/verificar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar senha: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.autenticado) {
        window.location.href = "/pages/configuracoes/configuracoes.html";
      } else {
        alert("Senha incorreta. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao verificar senha:", error.message);
    }
  });
});