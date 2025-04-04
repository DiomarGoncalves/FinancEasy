document.addEventListener("DOMContentLoaded", async () => {
  try {
    const mesAtual = new Date().getMonth() + 1; // Mês atual (1-12)
    const anoAtual = new Date().getFullYear(); // Ano atual
    const mesFormatado = String(mesAtual).padStart(2, "0"); // Formatar o mês com dois dígitos
    // Buscar dados do dashboard para o mês atual
    const response = await fetch(`/api/dashboard/mensal?mes=${mesAtual}&ano=${anoAtual}`);
    if (!response.ok) throw new Error("Erro ao carregar dados do dashboard");
    const dados = await response.json();

    // Atualizar valores no painel com verificações
    document.getElementById("saldoAtual").textContent = `R$ ${(dados.saldoAtual || 0).toFixed(2)}`;
    document.getElementById("totalDespesas").textContent = `R$ ${(dados.totalDespesas || 0).toFixed(2)}`;
    document.getElementById("totalReceitas").textContent = `R$ ${(dados.totalReceitas || 0).toFixed(2)}`;

    // Buscar e atualizar comissões pendentes
    const comissoesPendentesResponse = await fetch("/api/comissoes/pendentes/total");
    if (!comissoesPendentesResponse.ok) throw new Error("Erro ao carregar comissões pendentes");
    const comissoesPendentesData = await comissoesPendentesResponse.json();
    document.getElementById("comissoesPendentes").textContent = `R$ ${(comissoesPendentesData.totalPendentes || 0).toFixed(2)}`;

    // Buscar histórico de comissões recebidas para o mês atual
    const comissoesRecebidasResponse = await fetch("/api/historico/comissoes/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes: `${anoAtual}-${mesFormatado}` }),
    });

    if (!comissoesRecebidasResponse.ok) throw new Error("Erro ao carregar comissões recebidas");

    const comissoesRecebidasData = await comissoesRecebidasResponse.json();

    // Calcular o total de comissões recebidas
    const totalRecebidas = comissoesRecebidasData.reduce((acc, comissao) => acc + comissao.valorComissao, 0);

    // Atualizar o card de comissões recebidas
    document.getElementById("comissoesRecebidas").textContent = `R$ ${totalRecebidas.toFixed(2)}`;

     // Buscar dados da meta de economia
     const responseMeta = await fetch("/api/reservas/meta");
     if (!responseMeta.ok) throw new Error("Erro ao carregar dados da meta de economia");
     const metaEconomia = await responseMeta.json();
 
     // Atualizar o card de meta de economia
     const progressoMeta = document.getElementById("progressoMeta");
     const textoMeta = document.getElementById("textoMeta");
 
     progressoMeta.max = metaEconomia.meta || 100; // Valor máximo da meta
     progressoMeta.value = metaEconomia.totalReservas || 0; // Progresso atual
     textoMeta.textContent = `R$ ${(metaEconomia.totalReservas || 0).toFixed(2)} de R$ ${(metaEconomia.meta || 0).toFixed(2)}`;
 
     // Atualizar outros elementos do dashboard
     document.getElementById("saldoAtual").textContent = `R$ ${(dados.saldoAtual || 0).toFixed(2)}`;
     document.getElementById("totalDespesas").textContent = `R$ ${(dados.totalDespesas || 0).toFixed(2)}`;
     document.getElementById("totalReceitas").textContent = `R$ ${(dados.totalReceitas || 0).toFixed(2)}`;

     
    // Atualizar resumo do mês
    atualizarResumoMes(dados);

    // Atualizar humor financeiro
    atualizarHumorFinanceiro(dados);

    // Atualizar notificações rápidas
    atualizarNotificacoesRapidas();

    // Verificar se os gastos estão acima da média
    verificarAvisoGastos(dados);

    // Configurar gráfico de desempenho mensal
    configurarGraficoDesempenhoMensal(dados);

    const config = await fetchConfig();
    if (config.notificacoes === "ativadas") {
      await verificarVencimentos();
    }
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
  }
});

function atualizarResumoMes(dados) {
  const resumoMes = document.getElementById("resumoMes");
  resumoMes.innerHTML = `
    <li>Saldo Atual: R$ ${dados.saldoAtual.toFixed(2)}</li>
    <li>Total de Despesas: R$ ${dados.totalDespesas.toFixed(2)}</li>
    <li>Total de Receitas: R$ ${dados.totalReceitas.toFixed(2)}</li>
  `;
}

function atualizarHumorFinanceiro(dados) {
  const iconeHumor = document.getElementById("iconeHumor");
  const descricaoHumor = document.getElementById("descricaoHumor");
  const saldo = dados.saldoAtual;

  if (saldo > 1000) {
    iconeHumor.textContent = "😄";
    descricaoHumor.textContent = "Você está com um ótimo saldo financeiro!";
  } else if (saldo > 0) {
    iconeHumor.textContent = "🙂";
    descricaoHumor.textContent = "Seu saldo está positivo, mas cuidado com os gastos.";
  } else {
    iconeHumor.textContent = "😟";
    descricaoHumor.textContent = "Seu saldo está negativo. É hora de economizar!";
  }
}

function atualizarNotificacoesRapidas() {
  const notificacoesRapidas = document.getElementById("notificacoesRapidas");
  notificacoesRapidas.innerHTML = `
    <li>📌 Lembre-se de revisar suas despesas.</li>
    <li>📌 Confira suas metas de economia.</li>
    <li>📌 Atualize suas receitas e despesas.</li>
  `;
}

function verificarAvisoGastos(dados) {
  const avisoGastos = document.getElementById("avisoGastos");
  const mediaMensal = 2000; // Exemplo de média mensal

  if (dados.totalDespesas > mediaMensal) {
    avisoGastos.style.display = "block";
  } else {
    avisoGastos.style.display = "none";
  }
}

function configurarGraficoDesempenhoMensal(dados) {
  const ctx = document.getElementById("graficoDesempenhoMensal").getContext("2d");

  // Verificar se os dados de desempenho mensal estão definidos e completos
  if (
    !dados.desempenhoMensal ||
    !Array.isArray(dados.desempenhoMensal.meses) ||
    !Array.isArray(dados.desempenhoMensal.despesas) ||
    !Array.isArray(dados.desempenhoMensal.receitas) ||
    dados.desempenhoMensal.meses.length === 0
  ) {
    console.warn("Dados de desempenho mensal estão incompletos ou ausentes.");
    const aviso = document.createElement("p");
    aviso.textContent = "Dados de desempenho mensal não disponíveis.";
    aviso.style.color = "gray";
    aviso.style.textAlign = "center";
    aviso.style.marginTop = "20px";
    ctx.canvas.parentNode.appendChild(aviso);
    ctx.canvas.style.display = "none"; // Ocultar o canvas do gráfico
    return;
  }

  console.log("Dados de desempenho mensal:", dados.desempenhoMensal);

  ctx.canvas.style.display = "block"; // Garantir que o canvas esteja visível
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dados.desempenhoMensal.meses,
      datasets: [
        {
          label: "Despesas",
          data: dados.desempenhoMensal.despesas,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          fill: true,
        },
        {
          label: "Receitas",
          data: dados.desempenhoMensal.receitas,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  });
}

async function fetchConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("Erro ao carregar configurações");
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return { notificacoes: "ativadas" }; // Configuração padrão
  }
}

async function verificarVencimentos() {
  try {
    const response = await fetch("/api/notificacoes/vencimentos");
    if (!response.ok) throw new Error("Erro ao buscar notificações de vencimento");

    const despesas = await response.json();
    if (despesas.length > 0) {
      despesas.forEach((despesa) => {
        showNotification(
          "Vencimento Próximo",
          `A despesa "${despesa.estabelecimento}" vence em breve (Data: ${despesa.data}).`
        );
      });
    }
  } catch (error) {
    console.error("Erro ao verificar vencimentos:", error);
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  try {
    const mesAtual = new Date().getMonth() + 1; // Mês atual (1-12)
    const anoAtual = new Date().getFullYear(); // Ano atual

    // Buscar dados do dashboard para o mês atual
    const response = await fetch(`/api/dashboard/mensal?mes=${mesAtual}&ano=${anoAtual}`);
    if (!response.ok) throw new Error("Erro ao carregar dados do dashboard");
    const dados = await response.json();

    // Buscar dados do mês anterior
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
    const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

    const responseMesAnterior = await fetch(`/api/dashboard/mensal?mes=${mesAnterior}&ano=${anoAnterior}`);
    if (!responseMesAnterior.ok) throw new Error("Erro ao carregar dados do mês anterior");
    const dadosMesAnterior = await responseMesAnterior.json();

    // Calcular comparativo
    const diferencaReceitas = dados.totalReceitas - dadosMesAnterior.totalReceitas;
    const diferencaDespesas = dados.totalDespesas - dadosMesAnterior.totalDespesas;

    // Atualizar o card de comparativo
    const comparativoMes = document.getElementById("comparativoMes");
    comparativoMes.innerHTML = `
      <strong>Receitas:</strong> ${diferencaReceitas >= 0 ? "⬆️" : "⬇️"} R$ ${Math.abs(diferencaReceitas).toFixed(2)}<br>
      <strong>Despesas:</strong> ${diferencaDespesas >= 0 ? "⬆️" : "⬇️"} R$ ${Math.abs(diferencaDespesas).toFixed(2)}
    `;

    // Atualizar outros elementos do dashboard
    document.getElementById("saldoAtual").textContent = `R$ ${(dados.saldoAtual || 0).toFixed(2)}`;
    document.getElementById("totalDespesas").textContent = `R$ ${(dados.totalDespesas || 0).toFixed(2)}`;
    document.getElementById("totalReceitas").textContent = `R$ ${(dados.totalReceitas || 0).toFixed(2)}`;

    // Outras funções existentes...
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
  }
});



function showNotification(title, message) {
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
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.style.padding = "15px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
  toast.style.backgroundColor = "#FFC107";
  toast.style.color = "#333";
  toast.style.fontWeight = "bold";
  toast.style.marginBottom = "10px";
  toast.innerHTML = `<strong>${title}</strong><br>${message}`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}
