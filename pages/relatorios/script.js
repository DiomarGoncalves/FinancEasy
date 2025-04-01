let totalReceitas = 0;
let totalDespesas = 0;
let anoAtual = new Date().getFullYear();

let charts = [];

function destroyCharts() {
  charts.forEach((chart) => chart.destroy());
  charts = [];
}

function atualizarAno() {
  anoAtual = document.getElementById("anoSelect").value;
  gerarGraficos();
  return anoAtual;
}

async function gerarGraficos() {
  try {
    destroyCharts();
    const dataInicio = `${anoAtual}-01-01`;
    const dataFim = `${anoAtual}-12-31`;

    const despesas = await fetchData("/api/despesas/filtrar", {
      dataInicio,
      dataFim,
    });
    const receitas = await fetchData("/api/receitas/filtrar", {
      dataInicio,
      dataFim,
    });
    const historicoDespesas = await fetchData(
      "/api/historico-despesas/filtrar",
      { dataInicio, dataFim }
    );
    const historicoReceitas = await fetchData(
      "/api/historico-receitas/filtrar",
      { dataInicio, dataFim }
    );

    const despesasMensais = Array(12).fill(0);
    const historicoDespesasMensais = Array(12).fill(0);
    const historicoReceitasMensais = Array(12).fill(0);
    const receitasMensais = Array(12).fill(0);
    const formasPagamento = {};
    const formasRecebimento = {};

    historicoDespesas.forEach((historicoDespesa) => {
      const mes = new Date(historicoDespesa.data).getMonth();
      historicoDespesasMensais[mes] += historicoDespesa.valor;

      formasPagamento[historicoDespesa.forma_pagamento] =
        (formasPagamento[historicoDespesa.forma_pagamento] || 0) +
        historicoDespesa.valor;
    });

    historicoReceitas.forEach((historicoReceita) => {
      const mes = new Date(historicoReceita.data).getMonth();
      historicoReceitasMensais[mes] += historicoReceita.valor;

      formasRecebimento[historicoReceita.forma_recebimento] =
        (formasRecebimento[historicoReceita.forma_recebimento] || 0) +
        historicoReceita.valor;
    });

    despesas.forEach((despesa) => {
      const mes = new Date(despesa.data).getMonth();
      despesasMensais[mes] += despesa.valor;
    });

    receitas.forEach((receita) => {
      const mes = new Date(receita.data).getMonth();
      receitasMensais[mes] += receita.valor;
    });

    const saldoMensal = receitasMensais.map(
      (receita, index) => receita - despesasMensais[index]
    );

    renderChart(
      "historicoDespesasMensaisChart",
      "Histórico de Despesas Mensais",
      historicoDespesasMensais
    );
    renderChart("despesasMensaisChart", "Despesas Mensais", despesasMensais);
    renderChart(
      "historicoReceitaMensaisChart",
      "Histórico de Receitas Mensais",
      historicoReceitasMensais
    );
    renderChart("receitasMensaisChart", "Receitas Mensais", receitasMensais);
    renderChart("saldoMensalChart", "Saldo Mensal", saldoMensal, "line");
    renderPieChart(
      "formasPagamentoChart",
      "Formas de Pagamento",
      formasPagamento
    );
    renderPieChart(
      "formasRecebimentoChart",
      "Formas de Recebimento",
      formasRecebimento
    );
  } catch (error) {
    console.error(`Erro ao gerar gráficos: ${error.message}`);
  }
}

async function fetchData(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Erro ao buscar dados de ${url}`);
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar dados de ${url}: ${error.message}`);
    return [];
  }
}

function renderChart(canvasId, label, data, type = "bar") {
  const chart = new Chart(document.getElementById(canvasId), {
    type,
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label,
          data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgb(75, 192, 110)",
          borderWidth: 1,
        },
      ],
    },
  });
  charts.push(chart);
}

function renderPieChart(canvasId, label, data) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chart = new Chart(document.getElementById(canvasId), {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
  });
  charts.push(chart);
}

// Chame a função para gerar os gráficos quando a página carregar
window.onload = gerarGraficos;

function showForm(formId) {
  document.getElementById(formId).classList.remove("hidden");
}

function hideForm(formId) {
  document.getElementById(formId).classList.add("hidden");
}

async function filtrarDespesas() {
  try {
    const dataInicio = document.getElementById("dataInicioDespesas").value;
    const dataFim = document.getElementById("dataFimDespesas").value;
    const filtros = { dataInicio, dataFim };
    console.log("Filtros:", filtros); // Log para depuração
    const despesas = await window.controle.getDespesasFiltradas(filtros);
    console.log("Despesas filtradas:", despesas); // Log para depuração
    const tableBody = document.querySelector("#previewDespesasTable tbody");
    tableBody.innerHTML = ""; // Limpar tabela
    totalDespesas = 0;

    despesas.forEach((despesa) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                      <td>${despesa.estabelecimento}</td>
                      <td>${despesa.data}</td>
                      <td>R$ ${despesa.valor.toFixed(2)}</td>
                      <td>${despesa.forma_pagamento}</td>
                  `;
      tableBody.appendChild(row); // Adicionar linha à tabela
      totalDespesas += despesa.valor; // Atualizar total de despesas
    });
    document.getElementById(
      "totalDespesas"
    ).innerText = `Total Despesas: R$ ${totalDespesas.toFixed(2)}`;
  } catch (error) {
    console.error(`Erro ao filtrar despesas: ${error.message}`);
  }
}

async function filtrarReceitas() {
  try {
    const dataInicio = document.getElementById("dataInicioReceitas").value;
    const dataFim = document.getElementById("dataFimReceitas").value;
    const filtros = { dataInicio, dataFim };
    console.log("Filtros:", filtros); // Log para depuração
    const receitas = await window.controle.getReceitasFiltradas(filtros);
    console.log("Receitas filtradas:", receitas); // Log para depuração
    const tableBody = document.querySelector("#previewReceitasTable tbody");
    tableBody.innerHTML = ""; // Limpar tabela
    totalReceitas = 0;

    receitas.forEach((receita) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                      <td>${receita.descricao}</td>
                      <td>${receita.data}</td>
                      <td>R$ ${receita.valor.toFixed(2)}</td>
                      <td>${receita.forma_recebimento}</td>
                  `;
      tableBody.appendChild(row); // Adicionar linha à tabela
      totalReceitas += receita.valor; // Atualizar total de receitas
    });
    document.getElementById(
      "totalReceitas"
    ).innerText = `Total Receitas: R$ ${totalReceitas.toFixed(2)}`;
  } catch (error) {
    console.error(`Erro ao filtrar receitas: ${error.message}`);
  }
}

function gerarRelatorioDespesas() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório de Despesas", 10, 10);
    doc.autoTable({
      html: "#previewDespesasTable",
      didDrawCell: (data) => {
        if (data.column.index === 2) {
          const valorText = data.cell.raw || "0";
          const valor = parseFloat(String(valorText).replace("R$ ", ""));
          totalDespesas += isNaN(valor) ? 0 : valor;
        }
      },
    });
    const finalY = doc.lastAutoTable.finalY || 10;
    doc.text(`Total Gasto: R$ ${totalDespesas.toFixed(2)}`, 10, finalY + 10);
    doc.save("relatorio_despesas.pdf");
  } catch (error) {
    console.error(`Erro ao gerar relatório de despesas: ${error.message}`);
  }
}

function gerarRelatorioReceitas() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório de Receitas", 10, 10);
    doc.autoTable({
      html: "#previewReceitasTable",
      didDrawCell: (data) => {
        if (data.column.index === 2) {
          const valorText = data.cell.raw || "0";
          const valor = parseFloat(String(valorText).replace("R$ ", ""));
          totalReceitas += isNaN(valor) ? 0 : valor;
        }
      },
    });
    const finalY = doc.lastAutoTable.finalY || 10;
    doc.text(`Total Recebido: R$ ${totalReceitas.toFixed(2)}`, 10, finalY + 10);
    doc.save("relatorio_receitas.pdf");
  } catch (error) {
    console.error(`Erro ao gerar relatório de receitas: ${error.message}`);
  }
}

function gerarRelatorioHistoricoDespesas() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório de Histórico de Despesas", 10, 10);
    doc.autoTable({
      html: "#previewHistoricoDespesasTable",
      didDrawCell: (data) => {
        if (data.column.index === 2) {
          const valorText = data.cell.raw || "0";
          const valor = parseFloat(String(valorText).replace("R$ ", ""));
          totalDespesas += isNaN(valor) ? 0 : valor;
        }
      },
    });
    const finalY = doc.lastAutoTable.finalY || 10;
    doc.text(`Total Gasto: R$ ${totalDespesas.toFixed(2)}`, 10, finalY + 10);
    doc.save("relatorio_historico_despesas.pdf");
  } catch (error) {
    console.error(
      `Erro ao gerar relatório de histórico de despesas: ${error.message}`
    );
  }
}

function gerarRelatorioHistoricoReceitas() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório de Histórico de Receitas", 10, 10);
    doc.autoTable({
      html: "#previewHistoricoReceitasTable",
      didDrawCell: (data) => {
        if (data.column.index === 2) {
          const valorText = data.cell.raw || "0";
          const valor = parseFloat(String(valorText).replace("R$ ", ""));
          totalReceitas += isNaN(valor) ? 0 : valor;
        }
      },
    });
    const finalY = doc.lastAutoTable.finalY || 10;
    doc.text(`Total Recebido: R$ ${totalReceitas.toFixed(2)}`, 10, finalY + 10);
    doc.save("relatorio_historico_receitas.pdf");
  } catch (error) {
    console.error(
      `Erro ao gerar relatório de histórico de receitas: ${error.message}`
    );
  }
}

async function filtrarHistoricoDespesas() {
  try {
    const dataInicio = document.getElementById("dataInicioHistoricoDespesas").value;
    const dataFim = document.getElementById("dataFimHistoricoDespesas").value;
    const filtros = { dataInicio, dataFim };

    const response = await fetch("/api/historico-despesas/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!response.ok) throw new Error("Erro ao filtrar histórico de despesas");

    const despesas = await response.json();
    const tableBody = document.querySelector("#previewHistoricoDespesasTable tbody");
    tableBody.innerHTML = ""; // Limpar tabela
    totalDespesas = 0;

    despesas.forEach((despesa) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${despesa.estabelecimento}</td>
        <td>${despesa.data}</td>
        <td>R$ ${despesa.valor.toFixed(2)}</td>
        <td>${despesa.forma_pagamento}</td>
      `;
      tableBody.appendChild(row);
      totalDespesas += despesa.valor;
    });

    document.getElementById("totalHistoricoDespesas").innerText = `Total Despesas: R$ ${totalDespesas.toFixed(2)}`;
  } catch (error) {
    console.error(`Erro ao filtrar histórico de despesas: ${error.message}`);
  }
}

async function filtrarHistoricoReceitas() {
  try {
    const dataInicio = document.getElementById(
      "dataInicioHistoricoReceitas"
    ).value;
    const dataFim = document.getElementById("dataFimHistoricoReceitas").value;
    const filtros = { dataInicio, dataFim };
    console.log("Filtros:", filtros); // Log para depuração
    const receitas = await window.controle.getHistoricoReceitasFiltradas(
      filtros
    );
    console.log("Receitas filtradas:", receitas); // Log para depuração
    const tableBody = document.querySelector(
      "#previewHistoricoReceitasTable tbody"
    );
    tableBody.innerHTML = ""; // Limpar tabela
    totalReceitas = 0;

    receitas.forEach((receita) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                      <td>${receita.descricao}</td>
                      <td>${receita.data}</td>
                      <td>R$ ${receita.valor.toFixed(2)}</td>
                      <td>${receita.forma_recebimento}</td>
                  `;
      tableBody.appendChild(row); // Adicionar linha à tabela
      totalReceitas += receita.valor; // Atualizar total de receitas
    });
    document.getElementById(
      "totalHistoricoReceitas"
    ).innerText = `Total Receitas: R$ ${totalReceitas.toFixed(2)}`;
  } catch (error) {
    console.error(`Erro ao filtrar histórico de receitas: ${error.message}`);
  }
}

function abrirMesModal() {
  const mesModal = new bootstrap.Modal(document.getElementById("mesModal"));
  mesModal.show();
}

function abrirMesModalHistorico() {
  const mesModalHistorico = new bootstrap.Modal(
    document.getElementById("mesModalHistorico")
  );
  mesModalHistorico.show();
}

async function submitMesForm() {
  try {
    const mes = document.getElementById("mesInput").value.padStart(2, "0");
    const ano = anoAtual;
    const dataInicio = `${ano}-${mes}-01`;
    const dataFim = new Date(ano, mes, 0).toISOString().split("T")[0]; // Último dia do mês

    const despesas = await fetchData("/api/despesas/filtrar", { dataInicio, dataFim });
    const receitas = await fetchData("/api/receitas/filtrar", { dataInicio, dataFim });

    console.log("Despesas:", despesas); // Log para depuração
    console.log("Receitas:", receitas); // Log para depuração

    const totalDespesas = despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
    const totalReceitas = receitas.reduce((acc, receita) => acc + receita.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Relatório Mensal - ${mes}/${ano}`, 10, 10);
    doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 10, 20);
    doc.text(`Total de Receitas: R$ ${totalReceitas.toFixed(2)}`, 10, 30);
    doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 10, 40);

    doc.autoTable({
      head: [["Descrição", "Data", "Valor", "Forma de Pagamento"]],
      body: despesas.map((despesa) => [
        despesa.estabelecimento,
        despesa.data,
        `R$ ${despesa.valor.toFixed(2)}`,
        despesa.forma_pagamento,
      ]),
      startY: 50,
      theme: "striped",
      headStyles: { fillColor: [255, 0, 0] },
      margin: { top: 10 },
    });

    doc.autoTable({
      head: [["Descrição", "Data", "Valor", "Forma de Recebimento"]],
      body: receitas.map((receita) => [
        receita.descricao,
        receita.data,
        `R$ ${receita.valor.toFixed(2)}`,
        receita.forma_recebimento,
      ]),
      startY: doc.previousAutoTable.finalY + 10,
      theme: "striped",
      headStyles: { fillColor: [0, 255, 0] },
      margin: { top: 10 },
    });

    doc.save(`relatorio_mensal_${mes}_${ano}.pdf`);
  } catch (error) {
    console.error(`Erro ao gerar relatório mensal: ${error.message}`);
  }
}

async function submitMesFormHistorico() {
  try {
    const mes = document.getElementById("mesInputHistorico").value;
    const ano = anoAtual;
    const dataInicio = `${ano}-${mes.padStart(2, "0")}-01`;
    const dataFim = new Date(ano, mes, 0).toISOString().split("T")[0]; // Último dia do mês

    const despesas = await fetchData("/api/historico-despesas/filtrar", {
      dataInicio,
      dataFim,
    });
    const receitas = await fetchData("/api/historico-receitas/filtrar", {
      dataInicio,
      dataFim,
    });

    console.log("Histórico de Despesas:", despesas); // Log para depuração
    console.log("Histórico de Receitas:", receitas); // Log para depuração

    const totalDespesas = despesas.reduce(
      (acc, despesa) => acc + despesa.valor,
      0
    );
    const totalReceitas = receitas.reduce(
      (acc, receita) => acc + receita.valor,
      0
    );
    const saldo = totalReceitas - totalDespesas;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Relatório Mensal do Histórico - ${mes}/${ano}`, 10, 10);
    doc.text(`Total de Despesas: R$ ${totalDespesas.toFixed(2)}`, 10, 20);
    doc.text(`Total de Receitas: R$ ${totalReceitas.toFixed(2)}`, 10, 30);
    doc.text(`Saldo: R$ ${saldo.toFixed(2)}`, 10, 40);

    doc.autoTable({
      head: [["Descrição", "Data", "Valor", "Forma de Pagamento"]],
      body: despesas.map((despesa) => [
        despesa.estabelecimento,
        despesa.data,
        `R$ ${despesa.valor.toFixed(2)}`,
        despesa.forma_pagamento,
      ]),
      startY: 50,
      theme: "striped",
      headStyles: { fillColor: [255, 0, 0] },
      margin: { top: 10 },
    });

    doc.autoTable({
      head: [["Descrição", "Data", "Valor", "Forma de Recebimento"]],
      body: receitas.map((receita) => [
        receita.descricao,
        receita.data,
        `R$ ${receita.valor.toFixed(2)}`,
        receita.forma_recebimento,
      ]),
      startY: doc.previousAutoTable.finalY + 10,
      theme: "striped",
      headStyles: { fillColor: [0, 255, 0] },
      margin: { top: 10 },
    });

    doc.save(`relatorio_mensal_historico_${mes}_${ano}.pdf`);
  } catch (error) {
    console.error(
      `Erro ao gerar relatório mensal do histórico: ${error.message}`
    );
  }
}

function showMessage(message, type) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.position = "fixed";
    toastContainer.style.top = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "9999";
    toastContainer.style.display = "flex";
    toastContainer.style.flexDirection = "column";
    toastContainer.style.gap = "10px";
    toastContainer.style.alignItems = "center"; // Centralizar mensagens
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast-message alert alert-${type}`;
  toast.textContent = message;
  toast.style.padding = "15px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
  toast.style.color = "#fff";
  toast.style.fontWeight = "bold";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-20px)";
  toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.justifyContent = "center";

  const colors = {
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FFC107",
    info: "#2196F3",
  };
  toast.style.backgroundColor = colors[type] || "#333";

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 100);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const exportarBtn = document.querySelector("#exportar");
  const relatorioTable = document.querySelector("#relatorioTable");

  // Verificar se o botão de exportar existe antes de adicionar o evento
  if (exportarBtn) {
    exportarBtn.addEventListener("click", () => {
      const doc = new jsPDF();
      doc.autoTable({ html: relatorioTable });
      doc.save("relatorio.pdf");
    });
  }

  // Exemplo de gráfico
  const ctx = document.getElementById("graficoRelatorio")?.getContext("2d");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Janeiro", "Fevereiro", "Março"],
        datasets: [
          {
            label: "Despesas",
            data: [500, 300, 400],
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
          {
            label: "Receitas",
            data: [700, 800, 600],
            backgroundColor: "rgba(54, 162, 235, 0.5)",
          },
        ],
      },
    });
  }
});
