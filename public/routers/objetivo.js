const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para obter o objetivo de poupança
router.get("/", (req, res) => {
  const sql = `SELECT * FROM objetivo WHERE id = 1`;
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error("Erro ao buscar objetivo:", err);
      res.status(500).json({ error: "Erro ao buscar objetivo" });
    } else {
      res.json(row || { valor: 0 });
    }
  });
});

// Rota para definir o objetivo de poupança
router.post("/", (req, res) => {
  const { valor } = req.body;

  const sql = `INSERT INTO objetivo (id, valor) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET valor = excluded.valor`;
  db.run(sql, [valor], function (err) {
    if (err) {
      console.error("Erro ao definir objetivo:", err);
      res.status(500).json({ error: "Erro ao definir objetivo" });
    } else {
      res.json({ status: "success" });
    }
  });
});

module.exports = router;
