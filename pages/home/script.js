document.addEventListener("DOMContentLoaded", async () => {
  try {
    const mesAtual = new Date().getMonth() + 1; // Mês atual (1-12)
    const anoAtual = new Date().getFullYear(); // Ano atual

    // Buscar dados do dashboard para o mês atual
    const response = await fetch(`/api/dashboard/mensal?mes=${mesAtual}&ano=${anoAtual}`);
    if (!response.ok) throw new Error("Erro ao carregar dados do dashboard");
    const dados = await response.json();

    // Atualizar valores no painel
    document.getElementById("saldoAtual").textContent = `R$ ${dados.saldoAtual.toFixed(2)}`;
    document.getElementById("totalDespesas").textContent = `R$ ${dados.totalDespesas.toFixed(2)}`;
    document.getElementById("totalReceitas").textContent = `R$ ${dados.totalReceitas.toFixed(2)}`;

    // Configurar gráfico de desempenho mensal
    const ctx = document.getElementById("graficoDesempenhoMensal").getContext("2d");
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

    const config = await fetchConfig();
    if (config.notificacoes === "ativadas") {
      await verificarVencimentos();
    }
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
  }
});

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
