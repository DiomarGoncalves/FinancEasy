let totalReceitas = 0;
let totalDespesas = 0;
let anoAtual = new Date().getFullYear();

let charts = [];

function destroyCharts() {
  charts.forEach(chart => chart.destroy());
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
    // const dataAtual = new Date();
    // const anoAtual = dataAtual.getFullYear();
    const dataInicio = `${anoAtual}-01-01`;
    const dataFim = `${anoAtual}-12-31`; // Último dia do ano

    const despesas = await window.controle.getDespesasFiltradas({
      dataInicio,
      dataFim,
    });
    const receitas = await window.controle.getReceitasFiltradas({
      dataInicio,
      dataFim,
    });
    const historicoDespesas = await window.controle.getHistoricoDespesasFiltradas({
      dataInicio,
      dataFim,
    });
    const historicoReceitas = await window.controle.getHistoricoReceitasFiltradas({
      dataInicio,
      dataFim,
    });
    const investments = await window.controle.getInvestments();

    console.log("Despesas:", despesas); // Log para depuração
    console.log("Receitas:", receitas); // Log para depuração
    console.log("Investimentos:", investments); // Log para depuração

    const despesasMensais = Array(12).fill(0);
    const historicoDespesasMensais = Array(12).fill(0);
    const historicoReceitasMensais = Array(12).fill(0);
    const receitasMensais = Array(12).fill(0);
    const formasPagamento = {};
    const formasRecebimento = {};
    const tiposReceitas = {};
    const tiposInvestimentos = {};

    historicoDespesas.forEach((historicoDespesa) => {
      const mesDespesas = new Date(historicoDespesa.data).getMonth();
      historicoDespesasMensais[mesDespesas] += historicoDespesa.valor;

      if (formasPagamento[historicoDespesa.forma_pagamento]) {
        formasPagamento[historicoDespesa.forma_pagamento] += historicoDespesa.valor;
      } else {
        formasPagamento[historicoDespesa.forma_pagamento] = historicoDespesa.valor;
      }
    });

    historicoReceitas.forEach((historicoReceita) => {
      const mesReceitas = new Date(historicoReceita.data).getMonth();
      historicoReceitasMensais[mesReceitas] += historicoReceita.valor;

      if (formasRecebimento[historicoReceita.forma_recebimento]) {
        formasRecebimento[historicoReceita.forma_recebimento] += historicoReceita.valor;
      } else {
        formasRecebimento[historicoReceita.forma_recebimento] = historicoReceita.valor;
      }
    });
    console.log("historicoDespesas:", historicoDespesas); // Log para depuração

    investments.forEach((investment) => {
      if (tiposInvestimentos[investment.tipo_investimento]) {
        tiposInvestimentos[investment.tipo_investimento] += investment.valor_investido;
      } else {
        tiposInvestimentos[investment.tipo_investimento] = investment.valor_investido;
      }
    });

    despesas.forEach((despesa) => {
      const mes = new Date(despesa.data).getMonth();
      despesasMensais[mes] += despesa.valor;

      if (formasPagamento[despesa.forma_pagamento]) {
        formasPagamento[despesa.forma_pagamento] += despesa.valor;
      } else {
        formasPagamento[despesa.forma_pagamento] = despesa.valor;
      }
    });

    receitas.forEach((receita) => {
      const mes = new Date(receita.data).getMonth();
      receitasMensais[mes] += receita.valor;

      if (tiposReceitas[receita.forma_recebimento]) {
        tiposReceitas[receita.forma_recebimento] += receita.valor;
      } else {
        tiposReceitas[receita.forma_recebimento] = receita.valor;
      }
    });

    const saldoMensal = receitasMensais.map(
      (receita, index) => receita - despesasMensais[index]
    );

    const historicoDespesasChart = new Chart(document.getElementById("historicoDespesasMensaisChart"), {
      type: "bar",
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
            label: "Histórico de Despesas Mensais",
            data: historicoDespesasMensais,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    charts.push(historicoDespesasChart);

    const despesasMensaisChart = new Chart(document.getElementById("despesasMensaisChart"), {
      type: "bar",
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
            label: "Despesas Mensais",
            data: despesasMensais,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    charts.push(despesasMensaisChart);

    const historicoReceitasChart = new Chart(document.getElementById("historicoReceitaMensaisChart"), {
      type: "bar",
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
            label: "Receitas Mensais",
            data: historicoReceitasMensais,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    charts.push(historicoReceitasChart);

    const receitasMensaisChart = new Chart(document.getElementById("receitasMensaisChart"), {
      type: "bar",
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
            label: "Receitas Mensais",
            data: receitasMensais,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    charts.push(receitasMensaisChart);

    const saldoMensalChart = new Chart(document.getElementById("saldoMensalChart"), {
      type: "line",
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
            label: "Saldo Mensal",
            data: saldoMensal,
            backgroundColor: "rgba(153, 102, 255, 0.2)",
            borderColor: "rgba(153, 102, 255, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    charts.push(saldoMensalChart);

    const formasPagamentoLabels = Object.keys(formasPagamento);
    const formasPagamentoData = Object.values(formasPagamento);

    const formasPagamentoChart = new Chart(document.getElementById("formasPagamentoChart"), {
      type: "pie",
      data: {
        labels: formasPagamentoLabels,
        datasets: [
          {
            label: "Formas de Pagamento",
            data: formasPagamentoData,
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
    charts.push(formasPagamentoChart);

    const tiposReceitasLabels = Object.keys(tiposReceitas);
    const tiposReceitasData = Object.values(tiposReceitas);

    const tiposReceitasChart = new Chart(document.getElementById("tiposReceitasChart"), {
      type: "pie",
      data: {
        labels: tiposReceitasLabels,
        datasets: [
          {
            label: "Tipos de Receitas",
            data: tiposReceitasData,
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
    charts.push(tiposReceitasChart);

    const tiposInvestimentosLabels = Object.keys(tiposInvestimentos);
    const tiposInvestimentosData = Object.values(tiposInvestimentos);

    const tiposInvestimentosChart = new Chart(document.getElementById("tiposInvestimentosChart"), {
      type: "pie",
      data: {
        labels: tiposInvestimentosLabels,
        datasets: [
          {
            label: "Tipos de Investimentos",
            data: tiposInvestimentosData,
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
    charts.push(tiposInvestimentosChart);
  } catch (error) {
    console.error(`Erro ao gerar gráficos: ${error.message}`);
  }
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
    console.error(`Erro ao gerar relatório de histórico de despesas: ${error.message}`);
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
    console.error(`Erro ao gerar relatório de histórico de receitas: ${error.message}`);
  }
}

async function filtrarHistoricoDespesas() {
  try {
    const dataInicio = document.getElementById("dataInicioHistoricoDespesas").value;
    const dataFim = document.getElementById("dataFimHistoricoDespesas").value;
    const filtros = { dataInicio, dataFim };
    console.log("Filtros:", filtros); // Log para depuração
    const despesas = await window.controle.getHistoricoDespesasFiltradas(filtros);
    console.log("Despesas filtradas:", despesas); // Log para depuração
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
      tableBody.appendChild(row); // Adicionar linha à tabela
      totalDespesas += despesa.valor; // Atualizar total de despesas
    });
    document.getElementById(
      "totalHistoricoDespesas"
    ).innerText = `Total Despesas: R$ ${totalDespesas.toFixed(2)}`;
  } catch (error) {
    console.error(`Erro ao filtrar histórico de despesas: ${error.message}`);
  }
}

async function filtrarHistoricoReceitas() {
  try {
    const dataInicio = document.getElementById("dataInicioHistoricoReceitas").value;
    const dataFim = document.getElementById("dataFimHistoricoReceitas").value;
    const filtros = { dataInicio, dataFim };
    console.log("Filtros:", filtros); // Log para depuração
    const receitas = await window.controle.getHistoricoReceitasFiltradas(filtros);
    console.log("Receitas filtradas:", receitas); // Log para depuração
    const tableBody = document.querySelector("#previewHistoricoReceitasTable tbody");
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
  const mesModalHistorico = new bootstrap.Modal(document.getElementById("mesModalHistorico"));
  mesModalHistorico.show();
}

async function submitMesForm() {
  try {
    const mes = document.getElementById("mesInput").value;
    const ano = anoAtual;
    const dataInicio = `${ano}-${mes.padStart(2, "0")}-01`;
    const dataFim = new Date(ano, mes, 0).toISOString().split("T")[0]; // Último dia do mês

    const despesas = await window.controle.getDespesasFiltradas({
      dataInicio,
      dataFim,
    });
    const receitas = await window.controle.getReceitasFiltradas({
      dataInicio,
      dataFim,
    });

    console.log("Despesas:", despesas); // Log para depuração
    console.log("Receitas:", receitas); // Log para depuração

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

    const despesas = await window.controle.getHistoricoDespesasFiltradas({
      dataInicio,
      dataFim,
    });
    const receitas = await window.controle.getHistoricoReceitasFiltradas({
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
    console.error(`Erro ao gerar relatório mensal do histórico: ${error.message}`);
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
    info: "#2196F3"
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
