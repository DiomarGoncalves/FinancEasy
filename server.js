const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors'); // Importe o middleware CORS

const app = express();
const db = new sqlite3.Database('database/database.db');

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

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

// Endpoint para gerar relatório mensal
app.get('/api/monthly-expenses/:month', (req, res) => {
  const month = req.params.month;
  db.get('SELECT * FROM monthly_expenses WHERE month = ?', [month], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'No report found for the specified month' });
      return;
    }
    res.json(row);
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

// Start the server
const PORT = process.env.PORT || 3015;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
