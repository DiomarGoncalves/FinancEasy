let totalGasto = 0;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const historico = await fetchHistoricoDespesas();
    renderHistorico(historico);

    document.getElementById("filtrar").addEventListener("click", async () => {
      const mes = document.getElementById("mes").value;
      const filtros = { dataInicio: `${mes}-01`, dataFim: `${mes}-31` };
      const historicoFiltrado = await fetchHistoricoDespesasFiltradas(filtros);
      renderHistorico(historicoFiltrado);
    });

    document.getElementById("exportar").addEventListener("click", () => {
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
      <td>${despesa.data_pagamento}</td>
      <td>${despesa.data}</td>
      <td>${despesa.estabelecimento}</td>
      <td>R$ ${despesa.valor.toFixed(2)}</td>
      <td>${despesa.forma_pagamento}</td>
      <td>${despesa.numero_parcelas}</td>
      <td>${despesa.parcelas_restantes}</td>
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