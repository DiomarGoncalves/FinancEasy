const investmentForm = document.getElementById("investmentForm");
const investmentTable = document
  .getElementById("investmentTable")
  .getElementsByTagName("tbody")[0];
const alertMessage = document.getElementById("alertMessage");

let investments = [];

// Ao enviar o formulário de novo investimento
investmentForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const assetName = document.getElementById("assetName").value;
  const quantity = document.getElementById("quantity").value;
  const investmentValue = document.getElementById("investmentValue").value;
  const acquisitionDate = document.getElementById("acquisitionDate").value;
  const account = document.getElementById("account").value;
  const observations = document.getElementById("observations").value;

  const newInvestment = {
    nome_ativo: assetName,
    quantidade: quantity,
    valor_investido: investmentValue,
    data_aquisicao: acquisitionDate,
    tipo_investimento: assetName, // Vamos assumir que 'assetName' também é o tipo do ativo
    conta_origem: account,
    observacoes: observations,
  };

  // Envia o novo investimento para o backend
  window.controle.addInvestment(newInvestment).then(() => {
    loadInvestments(); // Carrega novamente os investimentos após adicionar
    investmentForm.reset();
  });
});

// Função para exibir os investimentos
function displayInvestments() {
  investmentTable.innerHTML = "";

  if (!Array.isArray(investments)) {
    console.error("Investimentos não é um array:", investments);
    return; // Retorna se não for um array
  }

  if (investments.length === 0) {
    alertMessage.style.display = "block";
  } else {
    alertMessage.style.display = "none";
    investments.forEach((investment,) => {
      const row = investmentTable.insertRow();
      row.innerHTML = `
          <td>${investment.nome_ativo}</td>
          <td>${investment.quantidade}</td>
          <td>${investment.valor_investido}</td>
          <td>${investment.data_aquisicao}</td>
          <td>${investment.conta_origem}</td>
          <td>${investment.observacoes || "-"}</td>
          <td><button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"  onclick="deleteInvest(${investment.id})">Excluir</button></td>
        `;
    });
  }
}

// Função para carregar investimentos
function loadInvestments() {
  window.controle
    .getInvestments()
    .then((data) => {
      investments = data;
      displayInvestments();
    })
    .catch((err) => {
      console.error("Erro ao carregar investimentos:", err);
    });
}

// Função para excluir investimento
function deleteInvest(id) {
  window.controle
    .deleteInvestment(id)
    .then((result) => {
      if (result) {
        console.log(`Investimento com ID ${id} excluído com sucesso.`);
        loadInvestments(); // Recarrega a lista
      } else {
        console.warn(`Nenhum investimento encontrado com o ID ${id}.`);
      }
    })
    .catch((err) => {
      console.error("Erro ao excluir investimento:", err);
    });
}


// Carrega os investimentos quando a página é carregada
loadInvestments();
