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
      await saveReceita(receita);
      await loadReceitas();
      resetForm();
    });

    filtroForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const filtros = getFiltroData();
      await loadReceitas(filtros);
    });

    document.getElementById("filtrar").addEventListener("click", async () => {
      const mes = document.getElementById("mes").value;
      const filtros = { dataInicio: `${mes}-01`, dataFim: `${mes}-31` };
      const historicoFiltrado = await fetchHistoricoReceitasFiltradas(filtros);
      renderHistorico(historicoFiltrado);
    });

    document.getElementById("exportar").addEventListener("click", () => {
      exportarPDF();
    });
  } catch (error) {
    console.error(`Erro ao inicializar a página: ${error.message}`);
  }
});

async function fetchHistoricoReceitas() {
  try {
    const response = await fetch("/api/historico-receitas");
    if (!response.ok) throw new Error("Erro ao buscar histórico de Receita");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar histórico de Receita: ${error.message}`);
    return [];
  }
}

async function fetchHistoricoReceitasFiltradas(filtros) {
  try {
    const response = await fetch("/api/historico-receitas/filtrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!response.ok) throw new Error("Erro ao filtrar histórico de Receita");
    return await response.json();
  } catch (error) {
    console.error(`Erro ao filtrar histórico de Receita: ${error.message}`);
    return [];
  }
}

async function loadReceitas(filtros = {}) {
  try {
    const response = await fetch("/api/receitas", {
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
    console.error(`Erro ao carregar receitas: ${error.message}`);
  }
}

function renderHistorico(historico) {
  const tableBody = document.getElementById("historicoTableBody");
  if (!tableBody) {
    console.error("Elemento 'historicoTableBody' não encontrado.");
    return;
  }

  tableBody.innerHTML = ""; // Limpar tabela
  totalReceita = 0;

  historico.forEach((receita) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${receita.data_recebimento}</td>
      <td>${receita.data}</td>
      <td>${receita.descricao}</td>
      <td>R$ ${receita.valor.toFixed(2)}</td>
      <td>${receita.categoria}</td>
      <td>${receita.fonte}</td>
    `;
    tableBody.appendChild(row); // Adicionar linha à tabela
    totalReceita += receita.valor;
  });

  const totalReceitaElement = document.getElementById("totalReceita");
  if (totalReceitaElement) {
    totalReceitaElement.innerText = `Total Receita: R$ ${totalReceita.toFixed(2)}`;
  } else {
    console.error("Elemento 'totalReceita' não encontrado.");
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
        <button class="bg-blue-500 text-white px-3 py-1 rounded" onclick="editReceita(${receita.id})">Editar</button>
        <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="deleteReceita(${receita.id})">Excluir</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function saveReceita(receita) {
  try {
    const method = receita.id ? "PUT" : "POST";
    const endpoint = receita.id ? `/api/receitas/${receita.id}` : "/api/receitas";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receita),
    });
    if (!response.ok) throw new Error("Erro ao salvar receita");
  } catch (error) {
    console.error(`Erro ao salvar receita: ${error.message}`);
  }
}

async function deleteReceita(id) {
  try {
    const response = await fetch(`/api/receitas/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Erro ao excluir receita");
    await loadReceitas();
  } catch (error) {
    console.error(`Erro ao excluir receita: ${error.message}`);
  }
}

function editReceita(id) {
  fetch(`/api/receitas/${id}`)
    .then((response) => response.json())
    .then((receita) => populateForm(receita))
    .catch((error) => console.error(`Erro ao carregar receita: ${error.message}`));
}

function getFormData() {
  return {
    id: document.getElementById("receitaForm").dataset.id || null,
    descricao: document.getElementById("descricao").value,
    valor: parseFloat(document.getElementById("valor").value),
    data: document.getElementById("data").value,
    categoria: document.getElementById("categoria").value,
    fonte: document.getElementById("fonte").value,
    forma_recebimento: document.getElementById("forma_recebimento").value,
    conta_bancaria: document.getElementById("conta_bancaria").value,
    recorrente: document.getElementById("recorrente").checked,
    intervalo_recorrencia: document.getElementById("intervalo_recorrencia").value || null,
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
  doc.text("Histórico de Receitas Recebidas", 10, 10);
  doc.autoTable({
    html: "#historicoTable",
    didDrawPage: (data) => {
      // Adicionar o total recebido no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.text(`Total Receita: R$ ${totalReceita.toFixed(2)}`, 10, pageHeight - 10);
    },
  });
  doc.save("historico_receitas.pdf");
}