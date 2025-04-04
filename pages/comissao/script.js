// Função para exibir notificações estilo toast
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
  }, 5000);
}


document.addEventListener("DOMContentLoaded", () => {
  const cadastroVendaForm = document.getElementById("cadastroVenda");
  const tabelaComissoes = document.getElementById("tabelaComissoes");
  const exportarButton = document.getElementById("exportar");

  // Verificar se os elementos necessários existem
  if (!cadastroVendaForm) {
    console.error("Elemento 'cadastroVenda' não encontrado.");
    return;
  }
  if (!tabelaComissoes) {
    console.error("Elemento 'tabelaComissoes' não encontrado.");
    return;
  }
  if (!exportarButton) {
    console.error("Elemento 'exportar' não encontrado.");
    return;
  }

  exportarButton.addEventListener("click", () => {
    exportarPDF();
  });

  // Função para carregar comissões pendentes
  async function carregarComissoes() {
    try {
      const response = await fetch("/api/comissoes");
      if (!response.ok) throw new Error("Erro ao carregar comissões");

      const comissoes = await response.json();
      tabelaComissoes.innerHTML = "";

      comissoes.forEach((comissao) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="p-2">${comissao.nf}</td>
          <td>${comissao.pedidoNectar}</td>
          <td>${comissao.notaNectar}</td>
          <td>R$ ${comissao.valorVenda.toFixed(2)}</td>
          <td>${comissao.dataVenda}</td>
          <td>R$ ${(comissao.valorVenda * 0.025).toFixed(2)}</td>
          <td>
            <button class="bg-red-500 text-white p-1 rounded excluir-btn" data-id="${comissao.id}">Excluir</button>
            <button class="bg-green-500 text-white p-1 rounded recebido-btn" data-id="${comissao.id}">Recebido</button>
          </td>
        `;
        tabelaComissoes.appendChild(tr);
      });

      adicionarEventosBotoes();
    } catch (error) {
      console.error("Erro ao carregar comissões:", error);
      showMessage("Erro ao carregar comissões.", "error");
    }
  }

  // Função para adicionar eventos aos botões
  function adicionarEventosBotoes() {
    document.querySelectorAll(".excluir-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const id = event.target.dataset.id;
        try {
          await fetch(`/api/comissoes/${id}`, { method: "DELETE" });
          carregarComissoes();
        } catch (error) {
          console.error("Erro ao excluir comissão:", error);
        }
      });
    });

    document.querySelectorAll(".recebido-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const id = event.target.dataset.id;
        try {
          await fetch(`/api/comissoes/${id}/recebido`, { method: "PUT" });
          carregarComissoes();
        } catch (error) {
          console.error("Erro ao marcar comissão como recebida:", error);
        }
      });
    });
  }

  // Evento de envio do formulário de cadastro
  cadastroVendaForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const novaVenda = {
      nf: document.getElementById("nf").value,
      pedidoNectar: document.getElementById("pedidoNectar").value,
      notaNectar: document.getElementById("notaNectar").value,
      valorVenda: parseFloat(document.getElementById("valorVenda").value),
      dataVenda: document.getElementById("dataVenda").value,
    };

    try {
      await fetch("/api/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaVenda),
      });
      showMessage('Venda cadastrada com sucesso!', 'success');
      cadastroVendaForm.reset();
      carregarComissoes();
    } catch (error) {
      console.error("Erro ao cadastrar venda:", error);
    }
  });

  // Carregar comissões ao iniciar
  carregarComissoes();
});

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Comissões", 10, 10);
  doc.autoTable({
    html: "#tabelaComissoesPendentes",
  });
  doc.save("Comissões.pdf");
}

document.addEventListener("DOMContentLoaded", () => {
  const comissoesTable = document.querySelector("#comissoesTable");
  const comissaoForm = document.querySelector("#comissaoForm");

  // Adicionar comissão
  comissaoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nf = document.querySelector("#nf").value;
    const valor = document.querySelector("#valor").value;
    const data = document.querySelector("#data").value;

    if (nf && valor && data) {
      const novaLinha = `
        <tr>
          <td>${nf}</td>
          <td>${valor}</td>
          <td>${data}</td>
        </tr>
      `;
      comissoesTable.querySelector("tbody").insertAdjacentHTML("beforeend", novaLinha);
      comissaoForm.reset();
    }
  });
});