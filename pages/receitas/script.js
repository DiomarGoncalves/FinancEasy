let totalReceita = 0;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const receitaForm = document.getElementById("receitaForm");
    const filtroForm = document.getElementById("filtroForm");

    if (!receitaForm || !filtroForm) {
      throw new Error("Elementos do formulário não encontrados no DOM.");
    }

    await loadReceitas();

    receitaForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const receita = getFormData();

      if (!receita.descricao || !receita.valor || !receita.data) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      await saveReceita(receita);
      await loadReceitas();
      resetForm();
    });

    filtroForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const filtros = getFiltroData();
      await filtrarReceitas(filtros);
    });

    document.getElementById("exportar").addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao inicializar a página: ${error.message}`);
  }
});

async function loadReceitas(filtros = {}) {
  try {
    const response = await fetch("/api/receitas");

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.statusText} - ${errorText}`);
    }

    const receitas = await response.json();

    if (!Array.isArray(receitas)) {
      throw new Error("A resposta da API não é um array.");
    }

    renderReceitas(receitas);
  } catch (error) {
    console.error(`Erro ao carregar receitas: ${error.message}`);
  }
}

async function filtrarReceitas(filtros) {
  try {
    const response = await fetch("/api/receitas/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.statusText} - ${errorText}`);
    }

    const receitas = await response.json();

    if (!Array.isArray(receitas)) {
      throw new Error("A resposta da API não é um array.");
    }

    renderReceitas(receitas);
  } catch (error) {
    console.error(`Erro ao filtrar receitas: ${error.message}`);
    showMessage("Erro ao filtrar receitas.", "error");
  }
}

function renderReceitas(receitas) {
  const tableBody = document.querySelector("#receitasTable tbody");
  tableBody.innerHTML = ""; // Limpar tabela

  receitas.forEach((receita) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${receita.descricao}</td>
      <td>R$ ${receita.valor.toFixed(2)}</td>
      <td>${receita.data}</td>
      <td>${receita.categoria}</td>
      <td>${receita.fonte}</td>
      <td>${receita.forma_recebimento}</td>
      <td>${receita.conta_bancaria}</td>
      <td>${receita.recorrente ? "Sim" : "Não"}</td>
      <td>${receita.intervalo_recorrencia || "-"}</td>
      <td>
        <button class="bg-green-500 text-white px-3 py-1 rounded" onclick="marcarRecebida(${receita.id})">Receber</button>
        <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="deleteReceita(${receita.id})">Excluir</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

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

async function marcarRecebida(id) {
  try {
    const response = await fetch(`/api/receitas/${id}/receber`, { method: "POST" });
    if (!response.ok) throw new Error("Erro ao marcar receita como recebida");
    showMessage("Receita marcada como recebida com sucesso!", "success");
    await loadReceitas();
  } catch (error) {
    console.error(`Erro ao marcar receita como recebida: ${error.message}`);
    showMessage("Erro ao marcar receita como recebida.", "error");
  }
}

async function saveReceita(receita) {
  try {
    if (!receita.descricao || !receita.valor || !receita.data) {
      console.error("Dados obrigatórios ausentes:", receita);
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const method = receita.id ? "PUT" : "POST";
    const endpoint = receita.id ? `/api/receitas/${receita.id}` : "/api/receitas";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receita),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.statusText} - ${errorText}`);
    }

    showMessage("Receita salva com sucesso!", "success");
  } catch (error) {
    console.error(`Erro ao salvar receita: ${error.message}`);
    showMessage("Erro ao salvar receita.", "error");
  }
}

async function deleteReceita(id) {
  try {
    const response = await fetch(`/api/receitas/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Erro ao excluir receita");
    showMessage("Receita excluída com sucesso!", "error");
    await loadReceitas();
  } catch (error) {
    console.error(`Erro ao excluir receita: ${error.message}`);
    showMessage("Erro ao excluir receita.", "error");
  }
}

function editReceita(id) {
  fetch(`/api/receitas/${id}`)
    .then((response) => response.json())
    .then((receita) => populateForm(receita))
    .catch((error) => console.error(`Erro ao carregar receita: ${error.message}`));
}

function getFormData() {
  const descricao = document.getElementById("descricao")?.value.trim();
  const valor = parseFloat(document.getElementById("valor")?.value);
  const data = document.getElementById("data")?.value;

  if (!descricao || isNaN(valor) || !data) {
    console.error("Dados inválidos no formulário:", { descricao, valor, data });
    return {};
  }

  return {
    id: document.getElementById("receitaForm").dataset.id || null,
    descricao,
    valor,
    data,
    categoria: document.getElementById("categoria")?.value || null,
    fonte: document.getElementById("fonte")?.value || null,
    forma_recebimento: document.getElementById("forma_recebimento")?.value || null,
    conta_bancaria: document.getElementById("conta_bancaria")?.value || null,
    recorrente: document.getElementById("recorrente")?.checked || false,
    intervalo_recorrencia: document.getElementById("intervalo_recorrencia")?.value || null,
  };
}

function getFiltroData() {
  return {
    dataInicio: document.getElementById("filtroDataInicio").value || null,
    dataFim: document.getElementById("filtroDataFim").value || null,
  };
}

function populateForm(receita) {
  document.getElementById("descricao").value = receita.descricao;
  document.getElementById("valor").value = receita.valor;
  document.getElementById("data").value = receita.data;
  document.getElementById("categoria").value = receita.categoria;
  document.getElementById("fonte").value = receita.fonte;
  document.getElementById("forma_recebimento").value = receita.forma_recebimento;
  document.getElementById("conta_bancaria").value = receita.conta_bancaria;
  document.getElementById("recorrente").checked = receita.recorrente;
  document.getElementById("intervalo_recorrencia").value = receita.intervalo_recorrencia || "";
  document.getElementById("receitaForm").dataset.id = receita.id;
}

function resetForm() {
  document.getElementById("receitaForm").reset();
  document.getElementById("receitaForm").dataset.id = "";
}

function exportarPDF() {
  console.log(totalReceita);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Receitas", 10, 10);
  doc.autoTable({
    html: "#receitasTable",
  });
  doc.save("receitas.pdf");
}