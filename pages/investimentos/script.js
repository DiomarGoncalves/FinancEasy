document.addEventListener("DOMContentLoaded", async () => {
  const investmentForm = document.getElementById("investmentForm");
  const investmentTableBody = document.querySelector("#investmentTable tbody");
  const alertMessage = document.getElementById("alertMessage");
  const investimentosTable = document.querySelector("#investimentosTable");
  const investimentoForm = document.querySelector("#investmentForm");

  // Adicionar logs para verificar elementos
  console.log("Verificando elementos DOM...");
  console.log("investmentForm:", investmentForm);
  console.log("investmentTableBody:", investmentTableBody);
  console.log("alertMessage:", alertMessage);
  console.log("investimentosTable:", investimentosTable);
  console.log("investimentoForm:", investimentoForm);

  if (!investmentForm) {
    console.error("Elemento 'investmentForm' não encontrado.");
    return;
  }

  investmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = investmentForm.dataset.id; // Obter o ID do investimento (se existir)
    const investment = {
      nome_ativo: document.getElementById("nomeAtivo").value.trim(),
      quantidade: parseFloat(document.getElementById("quantidade").value),
      valor_investido: parseFloat(document.getElementById("valorInvestido").value),
      data_aquisicao: document.getElementById("dataAquisicao").value,
      tipo_investimento: document.getElementById("tipoInvestimento").value.trim(),
      conta_origem: document.getElementById("contaOrigem").value.trim(),
      observacoes: document.getElementById("observacoes").value.trim() || "",
    };

    try {
      if (id) {
        // Atualizar investimento existente
        investment.id = id;
        await updateInvestment(investment);
        showMessage("Investimento atualizado com sucesso!", "success");
        delete investmentForm.dataset.id; // Remover o ID após a edição
      } else {
        // Adicionar novo investimento
        await saveInvestment(investment);
        showMessage("Investimento salvo com sucesso!", "success");
      }

      investmentForm.reset(); // Limpar o formulário
      await loadInvestments(); // Recarregar a lista de investimentos
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      showMessage(`Erro ao salvar investimento: ${error.message}`, "error");
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
          <button class="editar-investimento bg-blue-500 text-white px-3 py-1 rounded" data-id="${investment.id}">Editar</button>
          <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="deleteInvestment(${investment.id})">Excluir</button>
        </td>
      `;
      investmentTableBody.appendChild(row);
    });

    // Adicionar eventos aos botões de editar
    document.querySelectorAll(".editar-investimento").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const id = event.target.dataset.id;
        try {
          const response = await fetch(`/api/investimentos/${id}`);
          if (!response.ok) throw new Error("Erro ao carregar investimento");
          const investment = await response.json();

          // Preencher o formulário com os dados do investimento
          document.getElementById("nomeAtivo").value = investment.nome_ativo;
          document.getElementById("quantidade").value = investment.quantidade;
          document.getElementById("valorInvestido").value = investment.valor_investido;
          document.getElementById("dataAquisicao").value = investment.data_aquisicao;
          document.getElementById("tipoInvestimento").value = investment.tipo_investimento;
          document.getElementById("contaOrigem").value = investment.conta_origem;
          document.getElementById("observacoes").value = investment.observacoes || "";

          // Armazenar o ID do investimento no formulário para edição
          investmentForm.dataset.id = id;
        } catch (error) {
          console.error("Erro ao carregar investimento:", error);
          showMessage("Erro ao carregar investimento.", "error");
        }
      });
    });
  }

  async function saveInvestment(investment) {
    try {
      const response = await fetch("/api/investimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(investment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar investimento");
      }
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      throw error;
    }
  }

  async function updateInvestment(investment) {
    try {
      const response = await fetch(`/api/investimentos/${investment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(investment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar investimento");
      }
    } catch (error) {
      console.error("Erro ao atualizar investimento:", error);
      throw error;
    }
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
