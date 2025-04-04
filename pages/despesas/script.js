let totalGasto = 0;

// Função para exibir notificações estilo toast
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

  // Verificar se a mensagem já está sendo exibida
  const existingToast = Array.from(toastContainer.children).find(
    (toast) => toast.textContent === message
  );
  if (existingToast) {
    return; // Não adicionar a mensagem novamente
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

function resetFormAndUnlockInputs(form) {
  form.reset(); // Resetar o formulário
  form.querySelectorAll("input").forEach((input) => (input.disabled = false)); // Desbloquear inputs
}

document.addEventListener("DOMContentLoaded", async () => {
  const filtroBanco = document.getElementById("filtroBanco");

  // Carregar opções de bancos no filtro
  async function loadBancos() {
    try {
      const response = await fetch("/api/cartoes");
      if (!response.ok) throw new Error("Erro ao carregar bancos");
      const cartoes = await response.json();
      const bancos = [...new Set(cartoes.map((cartao) => cartao.banco))];
      filtroBanco.innerHTML = '<option value="">Todos os Bancos</option>';
      bancos.forEach((banco) => {
        const option = document.createElement("option");
        option.value = banco;
        option.textContent = banco;
        filtroBanco.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
    }
  }

  try {
    const response = await fetch("/api/cartoes");
    const cartoes = await response.json();
    const cartaoSelect = document.getElementById("cartao");
    cartoes.forEach((cartao) => {
      const option = document.createElement("option");
      option.value = cartao.id;
      option.textContent = `${cartao.nome} - ${cartao.banco}`;
      cartaoSelect.appendChild(option);
    });
  } catch (error) {
    console.error(`Erro ao carregar cartões: ${error.message}`);
  }

  document.getElementById("exportar").addEventListener("click", () => {
    exportarPDF();
  });

  document
    .getElementById("forma_pagamento")
    .addEventListener("change", (event) => {
      const cartaoCreditoOptions = document.getElementById(
        "cartaoCreditoOptions"
      );
      if (event.target.value === "Cartão de Crédito") {
        cartaoCreditoOptions.classList.remove("hidden");
      } else {
        cartaoCreditoOptions.classList.add("hidden");
      }
    });

  document
    .getElementById("numero_parcelas")
    .addEventListener("input", (event) => {
      const valor = parseFloat(document.getElementById("valor").value) || 0;
      const numeroParcelas = parseInt(event.target.value) || 1;

      if (numeroParcelas > 0) {
        const valorParcela = valor / numeroParcelas;
        document.getElementById("valor_parcela").value =
          valorParcela.toFixed(2);
      } else {
        document.getElementById("valor_parcela").value = "0.00";
      }
    });

  document
    .getElementById("despesaForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const estabelecimento = document.getElementById("estabelecimento").value.trim();
      const data = document.getElementById("date").value.trim();
      const valor = parseFloat(document.getElementById("valor").value);
      const formaPagamento = document.getElementById("forma_pagamento").value.trim();
      const numeroParcelas = parseInt(document.getElementById("numero_parcelas").value) || 1;
      const valorParcela = parseFloat(document.getElementById("valor_parcela").value) || valor;
      const cartaoId = document.getElementById("cartao").value || null;

      if (!estabelecimento || !data || isNaN(valor) || valor <= 0) {
        showMessage("Por favor, preencha todos os campos obrigatórios corretamente.", "error");
        return;
      }

      // Normalizar o valor de forma_pagamento
      const formasPagamentoValidas = ["Crédito", "Débito", "Dinheiro", "Pix"];
      const formaPagamentoNormalizada = formaPagamento
        .replace("Cartão de Crédito", "Crédito")
        .replace("Cartão de Débito", "Débito");

      if (!formasPagamentoValidas.includes(formaPagamentoNormalizada)) {
        showMessage("Forma de pagamento inválida.", "error");
        return;
      }

      if (formaPagamentoNormalizada === "Crédito" && numeroParcelas > 1) {
        const despesaParcelada = {
          estabelecimento,
          data,
          valor,
          numero_parcelas: numeroParcelas,
          forma_pagamento: formaPagamentoNormalizada,
          cartao_id: cartaoId,
        };

        try {
          await registrarDespesaParcelada(despesaParcelada);
          showMessage("Despesa parcelada registrada com sucesso!", "success");
          loadDespesas();
        } catch (error) {
          console.error("Erro ao registrar despesa parcelada:", error.message);
          showMessage("Erro ao registrar despesa parcelada. Por favor, tente novamente.", "error");
        }
      } else {
        const despesaNormal = {
          estabelecimento,
          data,
          valor,
          forma_pagamento: formaPagamentoNormalizada,
          numero_parcelas: 1,
          parcelas_restantes: 1,
          valor_parcela: valor,
          cartao_id: cartaoId,
        };

        try {
          const response = await fetch("/api/despesas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(despesaNormal),
          });

          if (!response.ok) {
            throw new Error("Erro ao registrar despesa.");
          }

          showMessage("Despesa registrada com sucesso!", "success");
          loadDespesas();
        } catch (error) {
          console.error("Erro ao registrar despesa:", error.message);
          showMessage("Erro ao registrar despesa. Por favor, tente novamente.", "error");
        }
      }

      resetFormAndUnlockInputs(event.target);
    });

  document.getElementById("filtroForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const filtros = {
      dataInicio: document.getElementById("filtroDataInicio").value,
      dataFim: document.getElementById("filtroDataFim").value,
      nome: document.getElementById("filtroNome").value,
      banco: document.getElementById("filtroBanco").value,
    };

    try {
      const response = await fetch("/api/despesas/filtrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filtros),
      });

      if (!response.ok) {
        throw new Error("Erro ao filtrar despesas");
      }

      const despesas = await response.json();
      renderDespesas(despesas);
      showMessage("Filtro aplicado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao filtrar despesas:", error);
      showMessage(`Erro ao filtrar despesas: ${error.message}`, "error");
    }
  });

  await loadBancos();
  loadDespesas();
});

async function loadDespesas() {
  try {
    const response = await fetch("/api/despesas");
    const despesas = await response.json();
    renderDespesas(despesas);
  } catch (error) {
    showMessage(`Erro ao carregar despesas: ${error.message}`, "danger");
  }
}

function renderDespesas(despesas) {
  const tableBody = document.querySelector("#despesasTable tbody");
  tableBody.innerHTML = ""; // Limpar tabela

  despesas.forEach((despesa) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${despesa.estabelecimento}</td>
      <td>${despesa.data}</td>
      <td>R$ ${despesa.valor.toFixed(2)}</td>
      <td class="hide-mobile">${despesa.forma_pagamento}</td>
      <td class="hide-mobile">${despesa.numero_parcelas || "-"}</td>
      <td class="hide-mobile">${despesa.parcelas_restantes || "-"}</td>
      <td class="hide-mobile">R$ ${despesa.valor_parcela.toFixed(2) || "-"}</td>
      <td class="hide-mobile">${despesa.cartao || "-"}</td>
      <td colspan="1" class="text-center">
        <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md mr-2" onclick="payDespesa(${despesa.id})">
          <i class="fas fa-dollar-sign icon"></i> Pagar
        </button>
        <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md" onclick="deleteDespesa(${despesa.id})">
          <i class="fas fa-trash-alt icon"></i> Excluir
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });


  showMessage(`Total de despesas: R$ ${totalGasto.toFixed(2)}`, "info");
}

async function payDespesa(id) {
  try {
    const response = await fetch(`/api/despesas/${id}/pagar`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro do servidor ao pagar despesa:", errorData);
      throw new Error(errorData.error || "Erro ao pagar despesa.");
    }

    showMessage("Despesa paga com sucesso!", "success");
    loadDespesas(); // Atualizar a lista de despesas
  } catch (error) {
    console.error(`Erro ao pagar despesa: ${error.message}`);
    showMessage(`Erro ao pagar despesa: ${error.message}`, "error");
  }
}

async function deleteDespesa(id) {
  try {
    const response = await fetch(`/api/despesas/${id}`, { method: "DELETE" });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro do servidor ao excluir despesa:", errorData);
      throw new Error(errorData.error || "Erro ao excluir despesa.");
    }

    showMessage("Despesa excluída com sucesso!", "success");
    loadDespesas(); // Atualizar a lista de despesas
  } catch (error) {
    console.error(`Erro ao excluir despesa: ${error.message}`);
    showMessage(`Erro ao excluir despesa: ${error.message}`, "error");
  }
}

async function filtrarDespesas(filtros) {
  try {
    const response = await fetch("/api/despesas/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!response.ok) throw new Error("Erro ao filtrar despesas");

    const despesas = await response.json();
    renderDespesas(despesas);
  } catch (error) {
    console.error("Erro ao filtrar despesas:", error);
    showMessage(`Erro ao filtrar despesas: ${error.message}`, "error");
  }
}

function exportarPDF() {
  console.log(totalGasto);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Relatorio de Despesas", 10, 10);
  doc.autoTable({
    html: "#despesasTable",
    didDrawPage: (data) => {
      // Adicionar o total gasto no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Total Gasto: R$ ${totalGasto.toFixed(2)}`, 10, pageHeight - 10);
    },
  });
  doc.save("Relatorio de despesas.pdf");
}

async function registrarDespesaParcelada(despesa) {
  try {
    // Validação de campos obrigatórios
    if (!despesa.estabelecimento || !despesa.data || !despesa.valor || !despesa.numero_parcelas || !despesa.forma_pagamento) {
      throw new Error("Todos os campos são obrigatórios.");
    }

    const response = await fetch("/api/despesas/parceladas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(despesa),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro do servidor ao registrar despesa parcelada:", errorData);
      throw new Error(errorData.error || "Erro ao registrar despesa parcelada.");
    }

    const data = await response.json();
    console.log("Despesa parcelada registrada com sucesso:", data);

    // Atualizar o total gasto
    totalGasto += despesa.valor;

    showMessage("Despesa parcelada registrada com sucesso!", "success");
    loadDespesas();
  } catch (error) {
    console.error("Erro ao registrar despesa parcelada:", error.message);
    showMessage(error.message, "error");
  }
}

// Exemplo de uso
document.getElementById("despesaForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const despesa = {
    estabelecimento: document.getElementById("estabelecimento").value,
    data: document.getElementById("date").value,
    valor: parseFloat(document.getElementById("valor").value),
    numero_parcelas: parseInt(document.getElementById("numero_parcelas").value),
    forma_pagamento: document.getElementById("forma_pagamento").value,
    cartao_id: document.getElementById("cartao").value || null,
  };

  await registrarDespesaParcelada(despesa);
});
