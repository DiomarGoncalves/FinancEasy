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

// Carrega os investimentos quando a página é carregada
loadInvestments();
