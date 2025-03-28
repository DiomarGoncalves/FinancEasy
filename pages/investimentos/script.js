document.addEventListener("DOMContentLoaded", async () => {
  const investmentForm = document.getElementById("investmentForm");
  const investmentTableBody = document.querySelector("#investmentTable tbody");
  const alertMessage = document.getElementById("alertMessage");
  const investimentosTable = document.querySelector("#investimentosTable");
  const investimentoForm = document.querySelector("#investimentoForm");

  investmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const investment = getFormData();
    if (!investment) return;

    try {
      await saveInvestment(investment);
      showMessage("Investimento adicionado com sucesso!", "success");
      await loadInvestments();
      investmentForm.reset();
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      showMessage("Erro ao salvar investimento.", "error");
    }
  });

  investimentoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.querySelector("#nome").value;
    const valor = document.querySelector("#valor").value;
    const data = document.querySelector("#data").value;

    if (nome && valor && data) {
      const novaLinha = `
        <tr>
          <td>${nome}</td>
          <td>${valor}</td>
          <td>${data}</td>
        </tr>
      `;
      investimentosTable.querySelector("tbody").insertAdjacentHTML("beforeend", novaLinha);
      investimentoForm.reset();
    }
  });

  await loadInvestments();

  async function loadInvestments() {
    try {
      const response = await fetch("/api/investimentos");
      if (!response.ok) throw new Error("Erro ao carregar investimentos");

      const investments = await response.json();
      renderInvestments(investments);
    } catch (error) {
      console.error("Erro ao carregar investimentos:", error);
      showMessage("Erro ao carregar investimentos.", "error");
    }
  }

  function renderInvestments(investments) {
    investmentTableBody.innerHTML = "";
    if (investments.length === 0) {
      alertMessage.style.display = "block";
      return;
    }
    alertMessage.style.display = "none";

    investments.forEach((investment) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${investment.nome_ativo}</td>
        <td>${investment.quantidade}</td>
        <td>R$ ${investment.valor_investido.toFixed(2)}</td>
        <td>${investment.data_aquisicao}</td>
        <td>${investment.conta_origem}</td>
        <td>${investment.observacoes || "-"}</td>
        <td>
          <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="deleteInvestment(${investment.id})">Excluir</button>
        </td>
      `;
      investmentTableBody.appendChild(row);
    });
  }

  async function saveInvestment(investment) {
    const response = await fetch("/api/investimentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(investment),
    });
    if (!response.ok) throw new Error("Erro ao salvar investimento");
  }

  // Tornar deleteInvestment acessível globalmente
  window.deleteInvestment = async function (id) {
    try {
      const response = await fetch(`/api/investimentos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir investimento");

      showMessage("Investimento excluído com sucesso!", "success");
      await loadInvestments();
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      showMessage("Erro ao excluir investimento.", "error");
    }
  };

  function getFormData() {
    const nome_ativo = document.getElementById("assetName").value;
    const quantidade = parseFloat(document.getElementById("quantity").value);
    const valor_investido = parseFloat(document.getElementById("investmentValue").value);
    const data_aquisicao = document.getElementById("acquisitionDate").value;
    const conta_origem = document.getElementById("account").value;
    const observacoes = document.getElementById("observations").value;

    if (!nome_ativo || isNaN(quantidade) || isNaN(valor_investido) || !data_aquisicao || !conta_origem) {
      showMessage("Por favor, preencha todos os campos obrigatórios.", "warning");
      return null;
    }

    return { nome_ativo, quantidade, valor_investido, data_aquisicao, conta_origem, observacoes };
  }

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
      info: "#2196F3",
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
});
