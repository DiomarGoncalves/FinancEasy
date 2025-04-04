let totalGasto = 0; // Variável global para armazenar o total gasto

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("historicoTableBody");
  const filtroForm = document.getElementById("filtroForm");
  const exportarButton = document.getElementById("exportar");
  const totalGastoElement = document.getElementById("totalGasto");

  // Verificar se os elementos necessários existem
  if (!tableBody) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }
  if (!filtroForm) {
    console.error("Elemento 'filtroForm' não encontrado.");
    return;
  }
  if (!exportarButton) {
    console.error("Elemento 'exportar' não encontrado.");
    return;
  }
  if (!totalGastoElement) {
    console.error("Elemento 'totalGasto' não encontrado.");
    return;
  }

  try {
    const historico = await fetchHistoricoComissao();
    console.log(historico);
    renderHistorico(historico);

    filtroForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const mesInput = document.getElementById("mes"); // Campo 'mes'

      const mes = mesInput ? mesInput.value : null; // Obter valor do campo 'mes'

      const filtros = { mes };
      const historicoFiltrado = await fetchHistoricoComissaoFiltradas(filtros);
      renderHistorico(historicoFiltrado);
    });

    exportarButton.addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao carregar histórico de Comissao: ${error.message}`);
  }
});

async function fetchHistoricoComissao() {
  try {
    const response = await fetch("/api/historico/comissoes");
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Histórico de comissões:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar histórico de comissões:", error.message);
    return [];
  }
}

async function fetchHistoricoComissaoFiltradas(filtros) {
  if (!filtros.mes) {
    console.error("Parâmetro 'mes' ausente ou inválido na requisição.");
    showMessage("Por favor, selecione um mês válido para filtrar.", "warning");
    return [];
  }

  try {
    const response = await fetch("/api/historico/comissoes/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!response.ok) throw new Error("Erro ao filtrar histórico de comissões");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao filtrar histórico de comissões: ${error.message}`);
    return [];
  }
}

function renderHistorico(historico) {
  const tableBody = document.getElementById("historicoTableBody");
  const totalGastoElement = document.getElementById("totalGasto");

  if (!tableBody) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }
  if (!totalGastoElement) {
    console.error("Elemento 'totalGasto' não encontrado.");
    return;
  }

  tableBody.innerHTML = ""; // Limpar tabela
  let totalGasto = 0;

  historico.forEach((comissao) => {
    const valorVenda = comissao.valorVenda || 0; // Garantir que 'valorVenda' tenha um valor padrão
    const valorComissao = valorVenda * 0.025; // Calcular a comissão com base no valor da venda

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${comissao.nf || "N/A"}</td>
      <td>${comissao.pedidoNectar || "N/A"}</td>
      <td class="hide-mobile">${comissao.notaNectar || "N/A"}</td>
      <td>R$ ${valorVenda.toFixed(2)}</td>
      <td>${comissao.dataVenda || "N/A"}</td>
      <td class="hide-mobile">R$ ${valorComissao.toFixed(2)}</td>
      <td>${comissao.dataRecebimento || "N/A"}</td>
    `;
    tableBody.appendChild(row);
    totalGasto += valorComissao; // Somar o valor da comissão ao total
  });

  totalGastoElement.innerText = `Total Ganho: R$ ${totalGasto.toFixed(2)}`;
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Adicionar título
  doc.setFontSize(16);
  doc.text("Histórico de Comissões Pagas", 10, 10);

  // Adicionar tabela
  doc.autoTable({
    html: "#historicoTable",
    startY: 20, // Começar abaixo do título
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] }, // Cor do cabeçalho
    didDrawPage: (data) => {
      // Adicionar o total ganho no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(12);
      doc.text(`Total Ganho: R$ ${totalGasto.toFixed(2)}`, 10, pageHeight - 10);
    },
  });

  // Salvar o PDF
  doc.save("historico_comissoes.pdf");
}