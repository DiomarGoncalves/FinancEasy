const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para listar todas as comissões
router.get("/", (req, res) => {
  const sql = `SELECT * FROM comissoes`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar comissões:", err.message);
      return res.status(500).json({ error: "Erro ao buscar comissões" });
    }
    res.json(rows);
  });
});

// Rota para excluir uma comissão
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM comissoes WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir comissão:", err.message);
      return res.status(500).json({ error: "Erro ao excluir comissão" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Comissão não encontrada" });
    }
    res.json({ message: "Comissão excluída com sucesso" });
  });
});

// Rota para marcar uma comissão como recebida
router.put("/:id/recebido", (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE comissoes SET recebido = 1 WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao marcar comissão como recebida:", err.message);
      return res.status(500).json({ error: "Erro ao marcar comissão como recebida" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Comissão não encontrada" });
    }
    res.json({ message: "Comissão marcada como recebida com sucesso" });
  });
});

// Rota para filtrar comissões pendentes
router.post("/filtrar", (req, res) => {
  const { mes } = req.body;

  if (!mes || typeof mes !== "string" || !/^\d{4}-\d{2}$/.test(mes)) {
    console.warn("Parâmetro 'mes' inválido ou ausente na requisição:", mes);
    return res.status(400).json({
      error: "O parâmetro 'mes' é obrigatório e deve estar no formato 'YYYY-MM'.",
    });
  }

  console.log("Recebendo filtros para comissões pendentes:", { mes });

  const sql = `
    SELECT * FROM comissoes
    WHERE strftime('%Y-%m', dataVenda) = ?
  `;
  const params = [mes];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar comissões pendentes:", err.message);
      return res.status(500).json({ error: "Erro ao filtrar comissões pendentes" });
    }

    res.json(rows);
  });
});

// Rota para calcular o total de comissões pendentes
router.get("/pendentes/total", (req, res) => {
  const sql = `
    SELECT IFNULL(SUM(valorVenda * 0.025), 0) AS totalPendentes
    FROM comissoes
    WHERE recebido = 0
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      console.error("Erro ao calcular total de comissões pendentes:", err.message);
      return res.status(500).json({ error: "Erro ao calcular total de comissões pendentes" });
    }

    res.json({ totalPendentes: row.totalPendentes });
  });
});

module.exports = router;
