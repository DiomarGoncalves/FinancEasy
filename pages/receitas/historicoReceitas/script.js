let totalRecebido = 0;
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const historico = await window.controle.invoke("get-historicoReceitas-filtradas");
    renderHistorico(historico);

    document.getElementById("filtrar").addEventListener("click", () => {
      const mes = document.getElementById("mes").value;
      const historicoFiltrado = historico.filter((receita) =>
        receita.data_recebimento.startsWith(mes)
      );
      renderHistorico(historicoFiltrado);
    });

    document.getElementById("exportar").addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao carregar histórico de receitas: ${error.message}`);
  }
});

function renderHistorico(historico) {
  const tableBody = document.getElementById("historicoTableBody");
  tableBody.innerHTML = ""; // Limpar tabela
  totalRecebido = 0; // Resetar totalRecebido

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
    totalRecebido += receitas.valor;
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
      // Adicionar o total recebido no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Total Recebido: R$ ${totalRecebido.toFixed(2)}`, 10, pageHeight - 10);
    },
  });
  doc.save("historico_receitas.pdf");
}
