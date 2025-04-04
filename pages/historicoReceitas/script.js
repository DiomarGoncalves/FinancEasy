let totalRecebido = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("historicoTableBody");
  const totalRecebidoElement = document.getElementById("totalRecebido");
  const filtrarButton = document.getElementById("filtrar");
  const exportarButton = document.getElementById("exportar");

  // Verificar se os elementos necessários existem
  if (!tableBody) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }
  if (!totalRecebidoElement) {
    console.error("Elemento 'totalRecebido' não encontrado.");
    return;
  }
  if (!filtrarButton) {
    console.error("Elemento 'filtrar' não encontrado.");
    return;
  }
  if (!exportarButton) {
    console.error("Elemento 'exportar' não encontrado.");
    return;
  }

  try {
    const historico = await fetchHistoricoReceitas();
    renderHistorico(historico);

    filtrarButton.addEventListener("click", async () => {
      const mesInput = document.getElementById("mes");

      // Verificar se o elemento 'mes' existe
      if (!mesInput) {
        console.error("Elemento 'mes' não encontrado.");
        showMessage("Erro interno: elemento 'mes' não encontrado.", "error");
        return;
      }

      const mes = mesInput.value;
      if (!mes) {
        alert("Por favor, selecione um mês para filtrar.");
        return;
      }

      const filtros = { mes };
      const historicoFiltrado = await fetchHistoricoReceitasFiltradas(filtros);
      renderHistorico(historicoFiltrado);
    });

    exportarButton.addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao carregar histórico de receitas: ${error.message}`);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const historicoTable = document.querySelector("#historicoTable");
  const filtroForm = document.querySelector("#filtroForm");

  // Filtrar histórico
  filtroForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mesInput = document.getElementById("mes"); // Campo 'mes'

    const mes = mesInput ? mesInput.value : null; // Obter valor do campo 'mes'

    const filtros = { mes };
    const historicoFiltrado = await fetchHistoricoComissaoFiltradas(filtros);
    renderHistorico(historicoFiltrado);
  });
});

async function fetchHistoricoReceitas() {
  try {
    const response = await fetch("/api/historico/receitas");
    if (!response.ok) throw new Error("Erro ao buscar histórico de receitas");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar histórico de receitas: ${error.message}`);
    return [];
  }
}

async function fetchHistoricoReceitasFiltradas(filtros) {
  if (!filtros.mes) {
    console.error("Parâmetro 'mes' ausente na requisição.");
    return [];
  }

  try {
    const response = await fetch("/api/historico/receitas/filtrar", {
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
  const totalRecebidoElement = document.getElementById("totalRecebido");

  // Verificar se os elementos necessários existem
  if (!tableBody) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }
  if (!totalRecebidoElement) {
    console.error("Elemento 'totalRecebido' não encontrado.");
    return;
  }

  tableBody.innerHTML = ""; // Limpar tabela
  totalRecebido = 0;

  if (historico.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhuma receita encontrada.</td></tr>`;
    totalRecebidoElement.innerText = `Total Recebido: R$ 0,00`;
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

  totalRecebidoElement.innerText = `Total Recebido: R$ ${totalRecebido.toFixed(2)}`;
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