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
  if (!tableBody) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }

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

  const totalGastoElement = document.getElementById("totalGasto");
  if (totalGastoElement) {
    totalGastoElement.innerText = `Total Gasto: R$ ${totalGasto.toFixed(2)}`;
  } else {
    console.error("Elemento 'totalGasto' não encontrado.");
  }
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

document.addEventListener("DOMContentLoaded", async () => {
  const tabelaHistorico = document.getElementById("historicoTableBody");
  const totalRecebidoElement = document.getElementById("totalRecebido");

  // Função para carregar o histórico de comissões recebidas
  async function carregarHistorico() {
    try {
      const response = await fetch("/api/comissoes/historico");
      const historico = await response.json();
      renderizarTabela(historico);
    } catch (error) {
      console.error("Erro ao carregar histórico de comissões:", error);
    }
  }

  // Função para filtrar o histórico por mês
  async function filtrarHistorico(mes) {
    try {
      const response = await fetch("/api/comissoes/historico/filtrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes }),
      });
      const historicoFiltrado = await response.json();
      renderizarTabela(historicoFiltrado);
    } catch (error) {
      console.error("Erro ao filtrar histórico de comissões:", error);
    }
  }

  // Função para renderizar a tabela de histórico
  function renderizarTabela(historico) {
    tabelaHistorico.innerHTML = "";
    let totalRecebido = 0;

    historico.forEach((comissao) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${comissao.nf}</td>
        <td>${comissao.pedidoNectar}</td>
        <td>${comissao.notaNectar}</td>
        <td>R$ ${comissao.valorVenda.toFixed(2)}</td>
        <td>${comissao.dataVenda}</td>
        <td>R$ ${(comissao.valorVenda * 0.025).toFixed(2)}</td>
      `;
      tabelaHistorico.appendChild(tr);
      totalRecebido += comissao.valorVenda * 0.025;
    });

    totalRecebidoElement.innerText = `💰 Total Recebido: R$ ${totalRecebido.toFixed(2)}`;
  }

  // Função para exportar o histórico para PDF
  function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Histórico de Comissões Recebidas", 10, 10);
    doc.autoTable({
      html: "#historicoTable",
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height;
        doc.text(totalRecebidoElement.innerText, 10, pageHeight - 10);
      },
    });
    doc.save("historico_comissoes.pdf");
  }

  // Eventos
  document.getElementById("filtrar").addEventListener("click", () => {
    const mes = document.getElementById("mes").value;
    if (mes) filtrarHistorico(mes);
  });

  document.getElementById("exportar").addEventListener("click", exportarPDF);

  // Carregar histórico ao iniciar
  carregarHistorico();
});

document.addEventListener("DOMContentLoaded", () => {
  const historicoTable = document.querySelector("#historicoTable");
  const filtroForm = document.querySelector("#filtroForm");

  // Filtrar histórico
  filtroForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const dataInicio = document.querySelector("#dataInicio").value;
    const dataFim = document.querySelector("#dataFim").value;

    if (dataInicio && dataFim) {
      console.log(`Filtrando de ${dataInicio} até ${dataFim}`);
      // Adicione lógica de filtro aqui
    }
  });
});