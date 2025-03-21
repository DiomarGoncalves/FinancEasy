let totalRecebido = 0;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const historico = await fetchHistoricoReceitas();
    renderHistorico(historico);

    document.getElementById("filtrar").addEventListener("click", async () => {
      const mes = document.getElementById("mes").value;
      if (!mes) {
        alert("Por favor, selecione um mês para filtrar.");
        return;
      }
      const filtros = { dataInicio: `${mes}-01`, dataFim: `${mes}-31` };
      const historicoFiltrado = await fetchHistoricoReceitasFiltradas(filtros);
      renderHistorico(historicoFiltrado);
    });

    document.getElementById("exportar").addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao carregar histórico de receitas: ${error.message}`);
  }
});

async function fetchHistoricoReceitas() {
  try {
    const response = await fetch("/api/historico-receitas");
    if (!response.ok) throw new Error("Erro ao buscar histórico de receitas");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar histórico de receitas: ${error.message}`);
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
    if (!response.ok) throw new Error("Erro ao filtrar histórico de receitas");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao filtrar histórico de receitas: ${error.message}`);
    return [];
  }
}

function renderHistorico(historico) {
  const tableBody = document.getElementById("historicoTableBody");
  tableBody.innerHTML = ""; // Limpar tabela
  totalRecebido = 0;

  if (historico.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhuma receita encontrada.</td></tr>`;
    document.getElementById("totalRecebido").innerText = `Total Recebido: R$ 0,00`;
    return;
  }

  historico.forEach((receita) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${receita.data_recebimento || "-"}</td>
      <td>${receita.data || "-"}</td>
      <td>${receita.descricao}</td>
      <td>R$ ${receita.valor.toFixed(2)}</td>
      <td>${receita.categoria || "-"}</td>
      <td>${receita.conta_bancaria || "-"}</td>
      <td>${receita.forma_recebimento || "-"}</td>
    `;
    tableBody.appendChild(row);
    totalRecebido += receita.valor;
  });

  document.getElementById(
    "totalRecebido"
  ).innerText = `Total Recebido: R$ ${totalRecebido.toFixed(2)}`;
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Histórico de Receitas Recebidas", 10, 10);
  doc.autoTable({
    html: "#historicoTable",
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Total Recebido: R$ ${totalRecebido.toFixed(2)}`, 10, pageHeight - 10);
    },
  });
  doc.save("historico_receitas.pdf");
}