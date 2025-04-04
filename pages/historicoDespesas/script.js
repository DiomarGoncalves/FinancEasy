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
    // Carregar todos os históricos inicialmente
    const historico = await fetchTodosHistoricoDespesas();
    renderHistorico(historico);

    // Aplicar filtro ao enviar o formulário
    filtroForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const mesInput = document.getElementById("mes"); // Campo 'mes'

      if (!mesInput) {
        console.error("Elemento 'mes' não encontrado.");
        return;
      }

      const mes = mesInput.value;
      if (!mes) {
        alert("Por favor, selecione um mês válido.");
        return;
      }

      const filtros = { mes };
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

async function fetchTodosHistoricoDespesas() {
  try {
    const response = await fetch("/api/historico/despesas");
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    // Verificar se a resposta é JSON válida
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text(); // Capturar a resposta como texto para depuração
      console.error("Resposta inesperada da API:", text);
      throw new Error("Resposta da API não é um JSON válido");
    }

    const data = await response.json();
    console.log("Todos os históricos de despesas:", data);
    return data;
  } catch (error) {
    console.error("Erro ao buscar todos os históricos de despesas:", error.message);
    return [];
  }
}

async function fetchHistoricoDespesasFiltradas(filtros) {
  if (!filtros.mes) {
    console.error("Parâmetro 'mes' ausente na requisição.");
    return [];
  }

  try {
    const response = await fetch("/api/historico/despesas/filtrar", {
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
  const totalGastoElement = document.getElementById("totalGasto");

  tableBody.innerHTML = ""; // Limpar tabela
  totalGasto = 0;

  if (historico.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhuma despesa encontrada.</td></tr>`;
    totalGastoElement.innerText = `Total Gasto: R$ 0,00`;
    return;
  }

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

  totalGastoElement.innerText = `Total Gasto: R$ ${totalGasto.toFixed(2)}`;
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Adicionar título
  doc.setFontSize(16);
  doc.text("Histórico de Despesas Pagas", 10, 10);

  // Adicionar tabela
  doc.autoTable({
    html: "#historicoTable",
    startY: 20, // Começar abaixo do título
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] }, // Cor do cabeçalho
    didDrawPage: (data) => {
      // Adicionar o total gasto no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(12);
      doc.text(`Total Gasto: R$ ${totalGasto.toFixed(2)}`, 10, pageHeight - 10);
    },
  });

  // Salvar o PDF
  doc.save("historico_despesas.pdf");
}