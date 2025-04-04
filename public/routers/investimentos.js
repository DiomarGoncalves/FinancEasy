const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para listar todos os investimentos
router.get("/", (req, res) => {
  const sql = `SELECT * FROM investimentos`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar investimentos:", err.message);
      return res.status(500).json({ error: "Erro ao buscar investimentos" });
    }
    res.json(rows);
  });
});

// Rota para buscar um investimento por ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM investimentos WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar investimento:", err.message);
      return res.status(500).json({ error: "Erro ao buscar investimento" });
    }
    if (!row) {
      return res.status(404).json({ error: "Investimento não encontrado" });
    }
    res.json(row);
  });
});

// Rota para adicionar um novo investimento
router.post("/", (req, res) => {
  const {
    nome_ativo,
    quantidade,
    valor_investido,
    data_aquisicao,
    tipo_investimento,
    conta_origem,
    observacoes,
  } = req.body;

  const sql = `
    INSERT INTO investimentos (nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Erro ao adicionar investimento:", err.message);
      return res.status(500).json({ error: "Erro ao adicionar investimento" });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Rota para atualizar um investimento
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    nome_ativo,
    quantidade,
    valor_investido,
    data_aquisicao,
    tipo_investimento,
    conta_origem,
    observacoes,
  } = req.body;

  const sql = `
    UPDATE investimentos
    SET nome_ativo = ?, quantidade = ?, valor_investido = ?, data_aquisicao = ?, tipo_investimento = ?, conta_origem = ?, observacoes = ?
    WHERE id = ?
  `;
  const params = [nome_ativo, quantidade, valor_investido, data_aquisicao, tipo_investimento, conta_origem, observacoes, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Erro ao atualizar investimento:", err.message);
      return res.status(500).json({ error: "Erro ao atualizar investimento" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Investimento não encontrado" });
    }
    res.json({ message: "Investimento atualizado com sucesso" });
  });
});

// Rota para excluir um investimento
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM investimentos WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir investimento:", err.message);
      return res.status(500).json({ error: "Erro ao excluir investimento" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Investimento não encontrado" });
    }
    res.json({ message: "Investimento excluído com sucesso" });
  });
});

module.exports = router;
