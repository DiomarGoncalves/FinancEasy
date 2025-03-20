let totalReceita = 0;

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
    const response = await fetch("/api/historico-receitas/filtrar", {
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
  if (!tableBody) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }

  tableBody.innerHTML = ""; // Limpar tabela
  totalReceita = 0;

  historico.forEach((receita) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${receita.data_recebimento}</td>
      <td>${receita.data}</td>
      <td>${receita.descricao}</td>
      <td>R$ ${receita.valor.toFixed(2)}</td>
      <td>${receita.categoria}</td>
      <td>${receita.fonte}</td>
    `;
    tableBody.appendChild(row); // Adicionar linha à tabela
    totalReceita += receita.valor;
  });

  const totalReceitaElement = document.getElementById("totalReceita");
  if (totalReceitaElement) {
    totalReceitaElement.innerText = `Total Receita: R$ ${totalReceita.toFixed(2)}`;
  } else {
    console.error("Elemento 'totalReceita' não encontrado.");
  }
}

function exportarPDF() {
  console.log(totalReceita);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Histórico de Receitas Recebidas", 10, 10);
  doc.autoTable({
    html: "#historicoTable",
    didDrawPage: (data) => {
      // Adicionar o total recebido no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Total Receita: R$ ${totalReceita.toFixed(2)}`, 10, pageHeight - 10);
    },
  });
  doc.save("historico_receitas.pdf");
}