let totalGasto = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const filtroForm = document.querySelector("#filtroForm");
  const exportarButton = document.querySelector("#exportar");
  const historicoTable = document.querySelector("#historicoTableBody");

  // Verificar se os elementos necessários existem
  if (!filtroForm) {
    console.error("Elemento 'filtroForm' não encontrado.");
    return;
  }
  if (!exportarButton) {
    console.error("Elemento 'exportar' não encontrado.");
    return;
  }
  if (!historicoTable) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }

  try {
    const historico = await fetchHistoricoDespesas();
    renderHistorico(historico);

    filtroForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const dataInicioInput = document.querySelector("#dataInicio");
      const dataFimInput = document.querySelector("#dataFim");
      const mesInput = document.querySelector("#mes");

      // Verificar se os elementos de entrada existem
      if (!dataInicioInput || !dataFimInput || !mesInput) {
        console.error("Um ou mais elementos obrigatórios não foram encontrados.");
        showMessage("Erro interno: elementos obrigatórios não encontrados.", "error");
        return;
      }

      const dataInicio = dataInicioInput.value;
      const dataFim = dataFimInput.value;
      const mes = mesInput.value;

      const filtros = { dataInicio, dataFim, mes };
      const historicoFiltrado = await fetchHistoricoDespesasFiltradas(filtros);
      renderHistorico(historicoFiltrado);
    });

    exportarButton.addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao carregar histórico de despesas: ${error.message}`);
  }
});

async function fetchHistoricoDespesas() {
  try {
    const response = await fetch("/api/historico-despesas");
    if (!response.ok) throw new Error("Erro ao buscar histórico de despesas");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar histórico de despesas: ${error.message}`);
    return [];
  }
}

async function fetchHistoricoDespesasFiltradas(filtros) {
  if (!filtros.mes) {
    console.error("Parâmetro 'mes' ausente na requisição.");
    showMessage("Por favor, selecione um mês para filtrar.", "warning");
    return [];
  }

  try {
    const response = await fetch("/api/historico-despesas/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!response.ok) throw new Error("Erro ao filtrar histórico de despesas");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao filtrar histórico de despesas: ${error.message}`);
    return [];
  }
}

function renderHistorico(historico) {
  const tableBody = document.getElementById("historicoTableBody");
  tableBody.innerHTML = ""; // Limpar tabela
  totalGasto = 0;

  historico.forEach((despesa) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${despesa.estabelecimento}</td>
      <td>${despesa.data}</td>
      <td>R$ ${despesa.valor.toFixed(2)}</td>
      <td>${despesa.forma_pagamento}</td>
      <td>${despesa.numero_parcelas}</td>
      <td>${despesa.parcelas_restantes}</td>
      <td>${despesa.data_pagamento}</td>
    `;
    tableBody.appendChild(row); // Adicionar linha à tabela
    totalGasto += despesa.valor;
  });

  document.getElementById(
    "totalGasto"
  ).innerText = `Total Gasto: R$ ${totalGasto.toFixed(2)}`;
}

function exportarPDF() {
  console.log(totalGasto);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Histórico de Despesas Pagas", 10, 10);
  doc.autoTable({
    html: "#historicoTable",
    didDrawPage: (data) => {
      // Adicionar o total gasto no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Total Gasto: R$ ${totalGasto.toFixed(2)}`, 10, pageHeight - 10);
    },
  });
  doc.save("historico_despesas.pdf");
}