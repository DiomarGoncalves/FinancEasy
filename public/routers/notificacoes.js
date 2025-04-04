const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para verificar despesas próximas do vencimento
router.get("/vencimentos", (req, res) => {
  const sql = `
    SELECT * FROM despesas
    WHERE DATE(data) BETWEEN DATE('now') AND DATE('now', '+3 days')
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar despesas próximas do vencimento:", err);
      res.status(500).json({ error: "Erro ao buscar despesas próximas do vencimento" });
    } else {
      res.json(rows);
    }
  });
});

module.exports = router;
