let totalGasto = 0;

function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const cartoes = await window.controle.getCartoes();
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
      const valor = parseFloat(document.getElementById("valor").value);
      const numeroParcelas = parseInt(event.target.value);
      const valorParcela = valor / numeroParcelas;
      document.getElementById("valor_parcela").value = valorParcela.toFixed(2);
    });

  document
    .getElementById("despesaForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const estabelecimento = document.getElementById("estabelecimento").value;
      const data = document.getElementById("data").value;
      const valor = parseFloat(document.getElementById("valor").value);
      let formaPagamento = document.getElementById("forma_pagamento").value;
      if (formaPagamento === "Cartão de Crédito") {
        formaPagamento = "Crédito";
      }
      const numeroParcelas =
        formaPagamento === "Crédito"
          ? parseInt(document.getElementById("numero_parcelas").value)
          : 1;
      const cartaoId =
        formaPagamento === "Crédito"
          ? parseInt(document.getElementById("cartao").value)
          : null;

      const despesa = {
        estabelecimento,
        data,
        valor,
        forma_pagamento: formaPagamento,
        numero_parcelas: numeroParcelas,
        cartao_id: cartaoId,
      };

      try {
        await window.controle.invoke("add-despesa", despesa);
        document.getElementById("errorMessage").classList.add("d-none");
        loadDespesas();
      } catch (error) {
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("d-none");
      }

      resetFormAndUnlockInputs(event.target); // Resetar e desbloquear inputs
    });

  loadDespesas();
});

async function loadDespesas() {
  try {
    const despesas = await window.controle.invoke("get-despesas");
    const tableBody = document.querySelector("#despesasTable tbody");
    tableBody.innerHTML = ""; // Limpar tabela
    totalGasto = 0;

    despesas.forEach((despesa) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                    <td>${despesa.estabelecimento}</td>
                    <td>${despesa.data}</td>
                    <td>R$ ${despesa.valor}</td>
                    <td>${despesa.forma_pagamento}</td>
                    <td>${despesa.numero_parcelas}</td>
                    <td>${despesa.parcelas_restantes}</td>
                    <td>R$ ${despesa.valor_parcela}</td>
                    <td>${despesa.cartao_id}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="payDespesa(${despesa.id})">Pagar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteDespesa(${despesa.id})">Excluir</button>
                    </td>
                `;
      tableBody.appendChild(row); // Adicionar linha à tabela
      totalGasto += despesa.valor;
    });
  } catch (error) {
    console.error(`Erro ao carregar despesas: ${error.message}`);
  }
}

async function loadCartoes() {
  try {
    const cartoes = await window.controle.invoke("get-cartoes");
    const cartaoSelect = document.getElementById("cartao");
    cartaoSelect.innerHTML = ""; // Limpar opções

    cartoes.forEach((cartao) => {
      const option = document.createElement("option");
      option.value = cartao.id;
      option.textContent = `${cartao.nome} - Limite: R$${cartao.limite}`;
      cartaoSelect.appendChild(option); // Adicionar opção ao select
    });
  } catch (error) {
    console.error(`Erro ao carregar cartões: ${error.message}`);
  }
}

async function payDespesa(id) {
  try {
    const despesa = await window.controle.invoke("get-despesa", id);
    await window.controle.invoke("pay-despesa", id);
    if (despesa.forma_pagamento === "Crédito") {
      await window.controle.invoke("update-limite-cartao", {
        id: despesa.cartao_id,
        valor: despesa.valor_parcela,
      });
    }
    loadDespesas(); // Atualizar a lista de despesas
    showMessage("Despesa paga com sucesso!", "success");
  } catch (error) {
    console.error(`Erro ao pagar despesa: ${error.message}`);
    showMessage(`Erro ao pagar despesa: ${error.message}`, "danger");
  }
}

async function deleteDespesa(id) {
  try {
    const despesa = await window.controle.invoke("get-despesa", id);
    await window.controle.invoke("delete-despesa", id);
    if (despesa.forma_pagamento === "Crédito") {
      await window.controle.invoke("update-limite-cartao", {
        id: despesa.cartao_id,
        valor: despesa.valor_parcela * despesa.parcelas_restantes,
      });
    }
    loadDespesas(); // Atualizar a lista de despesas
    showMessage("Despesa excluída com sucesso!", "success");
  } catch (error) {
    console.error(`Erro ao excluir despesa: ${error.message}`);
    showMessage(`Erro ao excluir despesa: ${error.message}`, "danger");
  }
}

function showMessage(message, type) {
  const messageContainer = document.createElement("div");
  messageContainer.className = `alert alert-${type}`;
  messageContainer.textContent = message;
  document.body.prepend(messageContainer);
  setTimeout(() => {
    messageContainer.remove();
  }, 3000);
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
