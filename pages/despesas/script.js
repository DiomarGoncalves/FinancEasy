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

      const dataInput = document.getElementById("date");
      const estabelecimentoInput = document.getElementById("estabelecimento");
      const valorInput = document.getElementById("valor");
      const formaPagamentoInput = document.getElementById("forma_pagamento");

      if (!dataInput || !estabelecimentoInput || !valorInput || !formaPagamentoInput) {
        console.error("Um ou mais elementos obrigatórios não foram encontrados.");
        showMessage("Erro interno: elementos obrigatórios não encontrados.", "error");
        return;
      }

      const data = dataInput.value.trim();
      const estabelecimento = estabelecimentoInput.value.trim();
      const valor = parseFloat(valorInput.value);
      const formaPagamento = formaPagamentoInput.value.trim();

      if (!data || !estabelecimento || isNaN(valor) || valor <= 0) {
        showMessage("Por favor, preencha todos os campos obrigatórios corretamente.", "error");
        console.error("Dados inválidos:", { data, estabelecimento, valor });
        return;
      }

      // Normalizar o valor de forma_pagamento
      const formasPagamentoValidas = ["Crédito", "Débito", "Dinheiro", "Pix"];
      const formaPagamentoNormalizada = formaPagamento
        .replace("Cartão de Crédito", "Crédito")
        .replace("Cartão de Débito", "Débito");

      if (!formasPagamentoValidas.includes(formaPagamentoNormalizada)) {
        showMessage("Forma de pagamento inválida.", "error");
        console.error("Forma de pagamento inválida:", formaPagamentoNormalizada);
        return;
      }

      const numeroParcelasInput = document.getElementById("numero_parcelas");
      const valorParcelaInput = document.getElementById("valor_parcela");
      const cartaoInput = document.getElementById("cartao");

      const numeroParcelas =
        formaPagamentoNormalizada === "Crédito"
          ? parseInt(numeroParcelasInput?.value) || 1
          : 1;
      const valorParcela =
        formaPagamentoNormalizada === "Crédito"
          ? parseFloat(valorParcelaInput?.value) || valor
          : valor;
      const cartaoId =
        formaPagamentoNormalizada === "Crédito"
          ? parseInt(cartaoInput?.value)
          : null;

      const parcelas = [];
      let dataParcela = new Date(data);

      for (let i = 0; i < numeroParcelas; i++) {
        if (isNaN(dataParcela.getTime())) {
          showMessage("Erro ao processar a data da parcela. Data inválida.", "error");
          console.error("Data inválida ao gerar parcelas:", dataParcela);
          return;
        }

        parcelas.push({
          estabelecimento,
          data: dataParcela.toISOString().split("T")[0],
          valor: valorParcela,
          forma_pagamento: formaPagamentoNormalizada,
          numero_parcelas: numeroParcelas,
          parcelas_restantes: numeroParcelas - i,
          valor_parcela: valorParcela,
          cartao_id: cartaoId,
        });
        dataParcela.setMonth(dataParcela.getMonth() + 1);
      }

      console.log("Dados enviados ao servidor:", parcelas);

      try {
        const response = await fetch("/api/despesas/parceladas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parcelas),
        });

        if (response.ok) {
          showMessage("Despesa parcelada registrada com sucesso!", "success");
          loadDespesas();
        } else {
          const errorData = await response.json();
          console.error("Erro do servidor:", errorData);
          showMessage(`Erro ao registrar despesa: ${errorData.error || "Erro desconhecido"}`, "error");
        }
      } catch (error) {
        console.error("Erro ao registrar despesa parcelada:", error);
        showMessage(`Erro ao registrar despesa parcelada: ${error.message}`, "danger");
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
      renderDespesas(despesas); // Atualizar a tabela com os dados filtrados
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
  totalGasto = 0;

  despesas.forEach((despesa) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${despesa.estabelecimento}</td>
      <td>${despesa.data}</td>
      <td>R$ ${despesa.valor.toFixed(2)}</td>
      <td>${despesa.forma_pagamento}</td>
      <td>${despesa.numero_parcelas}</td>
      <td>${despesa.parcelas_restantes}</td>
      <td>R$ ${despesa.valor_parcela.toFixed(2)}</td>
      <td>${despesa.cartao_nome || "-"}</td>
      <td colspan="1" class="text-center">
        <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md mr-2" onclick="payDespesa(${despesa.id})">
          <i class="fas fa-dollar-sign icon"></i> Pagar
        </button>
        <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md" onclick="deleteDespesa(${despesa.id})">
          <i class="fas fa-trash-alt icon"></i> Excluir
        </button>
      </td>
    `;
    tableBody.appendChild(row); // Adicionar linha à tabela
    totalGasto += despesa.valor;
  });

  showMessage(`Total de despesas: R$ ${totalGasto.toFixed(2)}`, "info");
}

async function payDespesa(id) {
  try {
    const response = await fetch(`/api/despesas/${id}/pagar`, {
      method: "POST",
    });
    if (response.ok) {
      loadDespesas(); // Atualizar a lista de despesas
      showMessage("Despesa paga com sucesso!", "success");
    } else {
      throw new Error("Erro ao pagar despesa");
    }
  } catch (error) {
    console.error(`Erro ao pagar despesa: ${error.message}`);
    showMessage(`Erro ao pagar despesa: ${error.message}`, "danger");
  }
}

async function deleteDespesa(id) {
  try {
    const response = await fetch(`/api/despesas/${id}`, { method: "DELETE" });
    if (response.ok) {
      loadDespesas(); // Atualizar a lista de despesas
      showMessage("Despesa excluída com sucesso!", "error");
    } else {
      throw new Error("Erro ao excluir despesa");
    }
  } catch (error) {
    console.error(`Erro ao excluir despesa: ${error.message}`);
    showMessage(`Erro ao excluir despesa: ${error.message}`, "danger");
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
