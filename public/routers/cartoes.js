const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para listar cartões
router.get("/", (req, res) => {
  const sql = `SELECT * FROM cartoes`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar cartões:", err);
      res.status(500).json({ error: "Erro ao buscar cartões" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para adicionar um cartão
router.post("/", (req, res) => {
  const { nome, banco, limite, vencimento } = req.body;
  const sql = `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nome, banco, limite, vencimento], function (err) {
    if (err) {
      console.error("Erro ao adicionar cartão:", err);
      res.status(500).json({ error: "Erro ao adicionar cartão" });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

// Rota para atualizar um cartão
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nome, banco, limite } = req.body;
  const sql = `UPDATE cartoes SET nome = ?, banco = ?, limite = ? WHERE id = ?`;
  db.run(sql, [nome, banco, limite, id], function (err) {
    if (err) {
      console.error("Erro ao atualizar cartão:", err);
      res.status(500).json({ error: "Erro ao atualizar cartão" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// Rota para excluir um cartão
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM cartoes WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir cartão:", err);
      res.status(500).json({ error: "Erro ao excluir cartão" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

module.exports = router;
