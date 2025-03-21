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

// Funções para gerenciamento dos cartões
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
    loadCartoes();
  } catch (error) {
    showMessage(`Erro ao registrar compra: ${error.message}`, 'danger');
  }
}

async function loadCartoes() {
  try {
    const response = await fetch("/api/cartoes");
    const cartoes = await response.json();
    const tableBody = document.querySelector("#cartoesTable tbody");
    tableBody.innerHTML = "";

    cartoes.forEach((cartao) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="p-1 mobile">${cartao.nome}</td>
        <td class="p-1 mobile">${cartao.banco}</td>
        <td class="p-1 mobile">${cartao.limite}</td>
        <td class="p-1 mobile">${cartao.limite_gasto || 0}</td>
        <td class="p-1 mobile">${cartao.limite_disponivel || 0}</td>
        <td class="p-1 mobile">
          <button class="btn btn-warning btn-sm bg-green-600 hover:bg-green-700" onclick="showEditModal(${cartao.id}, '${cartao.nome}', '${cartao.banco}', ${cartao.limite})">Editar</button>
          <button class="btn btn-danger btn-sm bg-red-600 hover:bg-red-700" onclick="deleteCartao(${cartao.id})">Excluir</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error(`Erro ao carregar cartões: ${error.message}`);
    showMessage(`Erro ao carregar cartões: ${error.message}`, "danger");
  }
}

async function deleteCartao(id) {
  try {
    const response = await fetch(`/api/cartoes/${id}`, { method: "DELETE" });
    if (response.ok) {
      loadCartoes();
      showMessage("Cartão excluído com sucesso!", "success");
    } else {
      throw new Error("Erro ao excluir cartão");
    }
  } catch (error) {
    console.error(`Erro ao excluir cartão: ${error.message}`);
    showMessage(`Erro ao excluir cartão: ${error.message}`, "danger");
  }
}

function showEditModal(id, nome, banco, limite) {
  document.getElementById("editCartaoId").value = id;
  document.getElementById("editNome").value = nome;
  document.getElementById("editBanco").value = banco;
  document.getElementById("editLimite").value = limite;
  const editModal = new bootstrap.Modal(document.getElementById("editCartaoModal"));
  editModal.show();
}

document.getElementById("editCartaoForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.getElementById("editCartaoId").value;
  const nome = document.getElementById("editNome").value;
  const banco = document.getElementById("editBanco").value;
  const limite = document.getElementById("editLimite").value;

  try {
    const response = await fetch(`/api/cartoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, banco, limite: parseFloat(limite) }),
    });
    if (response.ok) {
      const editModal = bootstrap.Modal.getInstance(document.getElementById("editCartaoModal"));
      editModal.hide();
      loadCartoes();
      showMessage("Cartão atualizado com sucesso!", "warning");
    } else {
      throw new Error("Erro ao atualizar cartão");
    }
  } catch (error) {
    console.error(`Erro ao atualizar cartão: ${error.message}`);
    showMessage(`Erro ao atualizar cartão: ${error.message}`, "danger");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadCartoes();
});