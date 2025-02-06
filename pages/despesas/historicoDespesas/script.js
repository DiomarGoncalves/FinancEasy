let totalGasto = 0;
document.addEventListener("DOMContentLoaded", async () => {
  const historico = await window.controle.invoke("get-historico-despesas");
  renderHistorico(historico);

  document.getElementById("filtrar").addEventListener("click", () => {
    const mes = document.getElementById("mes").value;
    const historicoFiltrado = historico.filter((despesa) =>
      despesa.data_pagamento.startsWith(mes)
    );
    renderHistorico(historicoFiltrado);
  });

  document.getElementById("exportar").addEventListener("click", () => {
    exportarPDF();
  });
});

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
