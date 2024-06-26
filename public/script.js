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
            loadCards(); // Reload cards to include the new one
          }
        });
    }

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
            <button data-id="${card.id}" class="view-card">Ver Detalhes</button>
          </td>
        `;
        cardsTable.appendChild(tr);
      });
      // Adicionar evento para botão de ver detalhes (opcional)
      cardsTable.querySelectorAll(".view-card").forEach((button) => {
        button.addEventListener("click", function () {
          const cardId = this.getAttribute("data-id");
          // Lógica para exibir detalhes do cartão conforme necessário
          console.log(`Detalhes do cartão ${cardId}`);
        });
      });
    }

    loadCards(); // Load cards on page load
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
          <td><button data-id="${expense.id}" class="delete-expense">Excluir</button></td>
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
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error deleting expense:", data.error);
          } else {
            console.log("Expense deleted successfully");
            loadExpenses(); // Reload expenses to reflect the deletion
          }
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
      fetch(`http://localhost:3015/api/reports/${month}`)
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
      reportContent.innerHTML = `
        <p>Total Gasto: ${data.totalSpent}</p>
        <p>Total Recebido: ${data.totalIncome}</p>
        <p>Saldo Final: ${data.balance}</p>
        <h3>Gastos por Cartão</h3>
        <table class="table table-dark">
          <thead>
            <tr>
              <th scope="col" >Cartão</th>
              <th scope="col" >Valor Gasto</th>
            </tr>
          </thead>
          <tbody>
            ${data.cardSpending && Array.isArray(data.cardSpending) ? 
              data.cardSpending.map(spending => `
                <tr>
                  <td>${spending.cardName}</td>
                  <td>${spending.amount}</td>
                </tr>
              `).join('') : '<tr><td colspan="2">Nenhum dado disponível</td></tr>'}
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
