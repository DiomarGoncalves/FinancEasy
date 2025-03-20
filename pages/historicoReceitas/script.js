let totalGasto = 0;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const historico = await fetchHistoricoReceitas();
    renderHistorico(historico);

    document.getElementById("filtrar").addEventListener("click", async () => {
      const mes = document.getElementById("mes").value;
      const filtros = { dataInicio: `${mes}-01`, dataFim: `${mes}-31` };
      const historicoFiltrado = await fetchHistoricoReceitasFiltradas(filtros);
      renderHistorico(historicoFiltrado);
    });

    document.getElementById("exportar").addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao carregar histórico de Receita: ${error.message}`);
  }
});

async function fetchHistoricoReceitas() {
  try {
    const response = await fetch("/api/historico-receitas");
    if (!response.ok) throw new Error("Erro ao buscar histórico de Receita");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar histórico de Receita: ${error.message}`);
    return [];
  }
}

async function fetchHistoricoReceitasFiltradas(filtros) {
  try {
    const response = await fetch("/api/historico-receita/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!response.ok) throw new Error("Erro ao filtrar histórico de Receita");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao filtrar histórico de Receita: ${error.message}`);
    return [];
  }
}

function renderHistorico(historico) {
  const tableBody = document.getElementById("historicoTableBody");
  tableBody.innerHTML = ""; // Limpar tabela
  totalGasto = 0;

  historico.forEach((receitas) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${receitas.data_recebimento}</td>
      <td>${receitas.data}</td>
      <td>${receitas.descricao}</td>
      <td>R$ ${receitas.valor.toFixed(2)}</td>
      <td>${receitas.categoria}</td>
      <td>${receitas.conta_bancaria}</td>
      <td>${receitas.forma_recebimento}</td>
    `;
    tableBody.appendChild(row); // Adicionar linha à tabela
    totalGasto += receitas.valor;
  });

  document.getElementById(
    "totalGasto"
  ).innerText = `Total Gasto: R$ ${totalGasto.toFixed(2)}`;
}

function exportarPDF() {
  console.log(totalGasto);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Histórico de Receita Pagas", 10, 10);
  doc.autoTable({
    html: "#historicoTable",
    didDrawPage: (data) => {
      // Adicionar o total gasto no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Total Gasto: R$ ${totalGasto.toFixed(2)}`, 10, pageHeight - 10);
    },
  });
  doc.save("historico_receitas.pdf");
}