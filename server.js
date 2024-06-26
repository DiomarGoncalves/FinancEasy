const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('database/database.db');

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors()); // Use o middleware CORS

// API endpoints
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ cards: rows });
  });
});

app.post('/api/cards', (req, res) => {
  const { name, limite, dueDate } = req.body;
  db.run('INSERT INTO cards (name, limite, due_date) VALUES (?, ?, ?)', [name, limite, dueDate], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

app.get('/api/monthly-expenses', (req, res) => {
  db.all('SELECT * FROM monthly_expenses', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ expenses: rows });
  });
});

app.post('/api/monthly-expenses', (req, res) => {
  const { month, amount, cardId } = req.body;
  db.run('INSERT INTO monthly_expenses (month, amount, card_id) VALUES (?, ?, ?)', [month, amount, cardId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// Rota para gerar relatório de um mês específico
app.get('/api/reports/:month', (req, res) => {
  const month = req.params.month;
  // Lógica para gerar o relatório do mês específico
  // Substitua com a lógica apropriada usando o banco de dados
  db.all('SELECT * FROM monthly_expenses WHERE month = ?', [month], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Aqui você processa os dados do relatório conforme necessário e envia como resposta
    const reportData = {
      totalSpent: calculateTotalSpent(rows), // Exemplo de função para calcular total gasto
      // Outros dados do relatório que você deseja incluir
    };
    res.json(reportData);
  });
});

// Reset database endpoint
app.post('/api/reset-db', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM cards');
    db.run('DELETE FROM monthly_expenses');
    db.run('DELETE FROM reports');
    res.json({ message: 'Database reset successfully' });
  });
});

// Função de exemplo para calcular o total gasto
function calculateTotalSpent(expenses) {
  let total = 0;
  expenses.forEach(expense => {
    total += expense.amount;
  });
  return total;
}

// Start the server
const PORT = process.env.PORT || 3015;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});