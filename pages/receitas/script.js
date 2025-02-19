let totalReceita = 0;

function resetFormAndUnlockInputs(form) {
  form.reset(); // Resetar o formulário
  form.querySelectorAll("input").forEach((input) => (input.disabled = false)); // Desbloquear inputs
}

function showMessage(message, type) {
  const messageContainer = document.createElement("div");
  messageContainer.className = `alert alert-${type}`;
  messageContainer.textContent = message;
  document.body.prepend(messageContainer);
  setTimeout(() => {
    messageContainer.remove();
  }, 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  const receitaForm = document.getElementById("receitaForm");
  if (receitaForm) {
    receitaForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const descricao = document.getElementById("descricao").value;
      const valor = parseFloat(document.getElementById("valor").value);
      const data = document.getElementById("data").value;
      const categoria = document.getElementById("categoria").value;
      const fonte = document.getElementById("fonte").value;
      const formaRecebimento =
        document.getElementById("forma_recebimento").value;
      const contaBancaria = document.getElementById("conta_bancaria").value;
      const recorrente = document.getElementById("recorrente").checked;
      const intervaloRecorrencia = document.getElementById(
        "intervalo_recorrencia"
      ).value;

      const receita = {
        descricao,
        valor,
        data,
        categoria,
        fonte,
        forma_recebimento: formaRecebimento,
        conta_bancaria: contaBancaria,
        recorrente,
        intervalo_recorrencia: recorrente ? intervaloRecorrencia : null,
      };

      resetFormAndUnlockInputs(event.target); // Resetar e desbloquear inputs

      try {
        await window.controle.invoke("add-receita", receita);
        showMessage("Receita adicionada com sucesso!", "success");
        loadReceitas();
      } catch (error) {
        showMessage(`Erro ao adicionar receita: ${error.message}`, "danger");
      }
    });
  }
  document.getElementById("exportar").addEventListener("click", () => {
    exportarPDF();
  });
  document
    .getElementById("filtroForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const dataInicio = document.getElementById("filtroDataInicio").value;
      const dataFim = document.getElementById("filtroDataFim").value;
      
      const filtros = {
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
      };

      try {
        const receitasFiltradas = await window.controle.invoke(
          "get-receitas-filtradas",
          filtros
        );
        renderReceitas(receitasFiltradas);
      } catch (error) {
        console.error(`Erro ao filtrar receitas: ${error.message}`);
      }
    });

  loadReceitas();
  loadContasBancarias();
});
async function loadReceitas() {
    try {
      const receitas = await window.controle.invoke("get-receitas");
      renderReceitas(receitas);
    } catch (error) {
      console.error(`Erro ao carregar despesas: ${error.message}`);
    }
  }

async function renderReceitas(receitas) {
    const tableBody = document.querySelector("#receitasTable tbody");
    tableBody.innerHTML = ""; // Limpar tabela
    totalReceita = 0;

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
                    <button class="btn btn-danger btn-sm" onclick="deleteReceita(${
                      receita.id
                    })">Excluir</button>
                </td>
            `;
      tableBody.appendChild(row); // Adicionar linha à tabela
      totalReceita += receita.valor;
    });
}

async function deleteReceita(id) {
  try {
    await window.controle.invoke("delete-receita", id);
    loadReceitas(); // Atualizar a lista de receitas
    showMessage("Receita excluída com sucesso!", "success");
  } catch (error) {
    showMessage(`Erro ao excluir receita: ${error.message}`, "danger");
  }
}

async function loadContasBancarias() {
  try {
    const contas = await window.controle.invoke("get-contas-bancarias");
    const contaSelect = document.getElementById("conta_bancaria");
    contaSelect.innerHTML = ""; // Limpar opções

    contas.forEach((conta) => {
      const option = document.createElement("option");
      option.value = conta.id;
      option.textContent = `${conta.nome} - ${conta.tipo}`;
      contaSelect.appendChild(option); // Adicionar opção ao select
    });

    // Adicionar opções fixas
    const fixedOptions = [
      { id: "conta_corrente", nome: "Conta Corrente" },
      { id: "poupanca", nome: "Poupança" },
      { id: "carteira_digital", nome: "Carteira Digital" },
    ];

    fixedOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.id;
      opt.textContent = option.nome;
      contaSelect.appendChild(opt); // Adicionar opção ao select
    });
  } catch (error) {
    showMessage(
      `Erro ao carregar contas bancárias: ${error.message}`,
      "danger"
    );
  }
}

function exportarPDF() {
  console.log(totalReceita);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Relatorio de Receitas", 10, 10);
  doc.autoTable({
    html: "#receitasTable",
    didDrawPage: (data) => {
      // Adicionar o total gasto no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.text(
        `Total Receitas: R$ ${totalReceita.toFixed(2)}`,
        10,
        pageHeight - 10
      );
    },
  });
  doc.save("Relatorio de receitas.pdf");
}
