const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para listar reservas de emergência
router.get("/", (req, res) => {
  const sql = `SELECT * FROM reservas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar reservas:", err);
      res.status(500).json({ error: "Erro ao buscar reservas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para adicionar uma reserva de emergência
router.post("/", (req, res) => {
  const { descricao, valor, data } = req.body;

  const sql = `INSERT INTO reservas (descricao, valor, data) VALUES (?, ?, ?)`;
  db.run(sql, [descricao, valor, data], function (err) {
    if (err) {
      console.error("Erro ao adicionar reserva:", err);
      res.status(500).json({ error: "Erro ao adicionar reserva" });
    } else {
      res.json({ id: this.lastID });
    }
  });
});

// Rota para excluir uma reserva de emergência
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM reservas WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir reserva:", err);
      res.status(500).json({ error: "Erro ao excluir reserva" });
    } else {
      res.json({ changes: this.changes });
    }
  });
});

// Rota para obter a meta de economia e o progresso atual
router.get("/meta", (req, res) => {
  const sql = `
    SELECT 
      (SELECT COALESCE(SUM(valor), 0) FROM reservas) AS totalReservas,
      (SELECT valor FROM objetivo WHERE id = 1) AS meta
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      console.error("Erro ao buscar meta de economia:", err);
      res.status(500).json({ error: "Erro ao buscar meta de economia" });
    } else {
      res.json({
        totalReservas: row.totalReservas || 0,
        meta: row.meta || 0,
      });
    }
  });
});

module.exports = router;
