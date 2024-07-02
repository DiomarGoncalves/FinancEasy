document.addEventListener("DOMContentLoaded", function () {
  const content = document.getElementById("content");
  const navLinks = document.querySelectorAll("nav a");
  const resetButton = document.getElementById("reset-db");
  function loadPage(page) {
    fetch(`pages/${page}.html`)
      .then((response) => response.text())
      .then((data) => {
        content.innerHTML = data;
        if (page === "cards") {
          setupCardsPage();
        } else if (page === "monthly-expenses") {
          setupMonthlyExpensesPage();
        } else if (page === "reports") {
          setupReportsPage();
        }
      });
  }

  // Função para carregar a página de cartões
  function loadPage(page) {
    fetch(`pages/${page}.html`)
      .then((response) => response.text())
      .then((data) => {
        content.innerHTML = data;
        if (page === "cards") {
          setupCardsPage();
        } else if (page === "monthly-expenses") {
          setupMonthlyExpensesPage();
        } else if (page === "reports") {
          setupReportsPage();
        }
      });
  }

  // Função para configurar a página de cartões
  function setupCardsPage() {
    const form = document.getElementById("add-card-form");
    const cardsList = document.getElementById("cards-list");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const cardName = document.getElementById("card-name").value;
      const cardLimit = document.getElementById("card-limit").value;
      const cardDueDate = document.getElementById("card-due-date").value;
      addCard(cardName, cardLimit, cardDueDate);
    });

    // Função para adicionar um cartão
    function addCard(name, limite, dueDate) {
      fetch("http://localhost:3015/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, limite, dueDate }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error adding card:", data.error);
          } else {
            console.log("Card added successfully");
            loadCards(); // Recarrega os cartões para incluir o novo
          }
        });
    }

    // Função para carregar os cartões
    function loadCards() {
      fetch("http://localhost:3015/api/cards")
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error loading cards:", data.error);
          } else {
            renderCards(data.cards);
          }
        });
    }

    // Função para renderizar os cartões na tabela
    function renderCards(cards) {
      const cardsTable = document.getElementById("cards-table");
      cardsTable.innerHTML = ""; // Limpa o conteúdo anterior da tabela
      cards.forEach((card) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${card.name}</td>
        <td>${card.limite}</td>
        <td>${card.due_date}</td>
        <td>
          <button data-id="${card.id}" class="btn btn-primary edit-card-button" data-toggle="modal" data-target="#editCardModal">Editar</button>
          <button data-id="${card.id}" class="btn btn-danger delete-card-button" data-toggle="modal" data-target="#deleteCardModal">Excluir</button>
        </td>
      `;
        cardsTable.appendChild(tr);
      });

      // Adicionar event listeners para botões de editar e excluir
      cardsTable.querySelectorAll(".edit-card-button").forEach((button) => {
        button.addEventListener("click", function () {
          const cardId = this.getAttribute("data-id");
          fetch(`http://localhost:3015/api/cards/${cardId}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.error) {
                console.error("Error loading card details:", data.error);
              } else {
                // Preencher o formulário de edição com os detalhes do cartão
                document.getElementById("edit-card-id").value = data.card.id;
                document.getElementById("edit-card-name").value = data.card.name;
                document.getElementById("edit-card-limit").value = data.card.limite;
                document.getElementById("edit-card-due-date").value =
                  data.card.due_date;
              }
            })
            .catch((error) => {
              console.error("Error fetching card details:", error);
            });
        });
      });
      

      cardsTable.querySelectorAll(".delete-card-button").forEach((button) => {
        button.addEventListener("click", function () {
          const cardId = this.getAttribute("data-id");
          document
            .getElementById("confirmDeleteCardButton")
            .addEventListener("click", function () {
              deleteCard(cardId);
            });
        });
      });
    }

    loadCards(); // Carregar os cartões ao carregar a página
  }

  // Função para excluir um cartão
  function deleteCard(cardId) {
    fetch(`http://localhost:3015/api/cards/${cardId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao excluir o cartão.");
        }
        console.log("Cartão excluído com sucesso.");
        $("#deleteCardModal").modal("hide"); // Fecha o modal após a exclusão
        loadCards(); // Recarrega a lista de cartões
      })
      .catch((error) => {
        console.error("Erro ao excluir o cartão:", error);
      });
  }

  function setupMonthlyExpensesPage() {
    const form = document.getElementById("add-expense-form");
    const expensesTable = document
      .getElementById("expenses-table")
      .querySelector("tbody");
    const expenseCardSelect = document.getElementById("expense-card");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const month = document.getElementById("expense-month").value;
      const amount = document.getElementById("expense-amount").value;
      const cardId = document.getElementById("expense-card").value;
      addOrEditExpense(month, amount, cardId);
    });

    function addOrEditExpense(month, amount, cardId) {
      fetch("http://localhost:3015/api/monthly-expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, amount, cardId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error adding/editing expense:", data.error);
          } else {
            console.log("Expense added/edited successfully");
            loadExpenses(); // Reload expenses to include the new one
          }
        });
    }

    function loadExpenses() {
      fetch("http://localhost:3015/api/monthly-expenses")
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error loading expenses:", data.error);
          } else {
            renderExpenses(data.expenses);
          }
        });
    }

    function renderExpenses(expenses) {
      expensesTable.innerHTML = "";
      expenses.forEach((expense) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${expense.month}</td>
          <td>${expense.amount}</td>
          <td>${expense.card_id}</td>
          <td><button data-id="${expense.id}" class="delete-expense bbutton">Excluir</button></td>
        `;
        expensesTable.appendChild(tr);
      });
      document.querySelectorAll(".delete-expense").forEach((button) => {
        button.addEventListener("click", function () {
          const id = this.getAttribute("data-id");
          deleteExpense(id);
        });
      });
    }

    function deleteExpense(id) {
      fetch(`http://localhost:3015/api/monthly-expenses/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error deleting expense");
          }
          return response.json();
        })
        .then((data) => {
          if (data.error) {
            console.error("Error deleting expense:", data.error);
          } else {
            console.log("Expense deleted successfully");
            loadExpenses(); // Reload expenses to reflect the deletion
          }
        })
        .catch((error) => {
          console.error("Error deleting expense:", error);
        });
    }

    function loadCards() {
      fetch("http://localhost:3015/api/cards")
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error loading cards:", data.error);
          } else {
            const cards = data.cards;
            cards.forEach((card) => {
              const option = document.createElement("option");
              option.value = card.id;
              option.textContent = card.name;
              expenseCardSelect.appendChild(option);
            });
          }
        });
    }

    loadCards(); // Load cards for the select on page load
    loadExpenses(); // Load expenses on page load
  }

  function setupReportsPage() {
    const form = document.getElementById("report-form");
    const reportContent = document.getElementById("report-content");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const month = document.getElementById("report-month").value;
      generateReport(month);
    });

    function generateReport(month) {
      fetch(`http://localhost:3015/api/monthly-expenses/${month}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error generating report:", data.error);
          } else {
            renderReport(data);
          }
        });
    }

    function renderReport(data) {
      console.log("Data received for report:", data); // Verifique o conteúdo de data no console
    
      reportContent.innerHTML = `
        <p>Total Gasto: ${data.amount}</p>
        <p>Total Recebido: ${data.totalIncome}</p>
        <p>Saldo Final: ${data.balance}</p>
        <h3>Gastos por Cartão</h3>
        <table class="table table-dark">
          <thead>
            <tr>
              <th scope="col">Cartão</th>
              <th scope="col">Valor Gasto</th>
            </tr>
          </thead>
          <tbody>
            ${
              data.card_id && Array.isArray(data.card_id)
                ? data.card_id
                    .map(
                      (spending) => `
                <tr>
                  <td>${spending.cardName}</td>
                  <td>${spending.amount}</td>
                </tr>
              `
                    )
                    .join("")
                : '<tr><td colspan="2">Nenhum dado disponível</td></tr>'
            }
          </tbody>
        </table>
      `;
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const page = this.getAttribute("data-page");
      loadPage(page);
    });
  });

  resetButton.addEventListener("click", function () {
    if (confirm("Você tem certeza que deseja zerar o banco de dados?")) {
      fetch("http://localhost:3015/api/reset-db", {
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error resetting database:", data.error);
          } else {
            console.log("Database reset successfully");
          }
        });
    }
  });

  loadPage("home");
});
const myCarouselElement = document.querySelector('#myCarousel');

const carousel = new bootstrap.Carousel(myCarouselElement, {
  interval: 2000,
  touch: false
});