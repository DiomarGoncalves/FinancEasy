const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para listar despesas
router.get("/", (req, res) => {
  const sql = `
    SELECT d.*, c.nome AS cartao_nome 
    FROM despesas d 
    LEFT JOIN cartoes c ON d.cartao_id = c.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar despesas:", err.message);
      res.status(500).json({ error: "Erro ao buscar despesas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para adicionar uma nova despesa
router.post("/", (req, res) => {
  const {
    estabelecimento,
    data,
    valor,
    forma_pagamento,
    numero_parcelas,
    cartao_id,
  } = req.body;

  const sql = `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const valorParcela = valor / numero_parcelas;

  db.run(
    sql,
    [
      estabelecimento,
      data,
      valor,
      forma_pagamento,
      numero_parcelas,
      numero_parcelas,
      valorParcela,
      cartao_id,
    ],
    function (err) {
      if (err) {
        console.error("Erro ao adicionar despesa:", err);
        res.status(500).json({ error: "Erro ao adicionar despesa" });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// Rota para filtrar despesas
router.post("/filtrar", (req, res) => {
  const { dataInicio, dataFim, nome, banco } = req.body;
  console.log("Recebendo filtros para despesas:", { dataInicio, dataFim, nome, banco });

  let sql = `
    SELECT d.*, c.nome AS cartao_nome, c.banco AS banco_nome 
    FROM despesas d 
    LEFT JOIN cartoes c ON d.cartao_id = c.id 
    WHERE 1=1
  `;
  const params = [];

  if (dataInicio) {
    sql += " AND d.data >= ?";
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += " AND d.data <= ?";
    params.push(dataFim);
  }
  if (nome) {
    sql += " AND d.estabelecimento LIKE ?";
    params.push(`%${nome}%`);
  }
  if (banco) {
    sql += " AND c.banco = ?";
    params.push(banco);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar despesas:", err.message);
      res.status(500).json({ error: "Erro ao filtrar despesas" });
    } else {
      res.json(rows);
    }
  });
});

module.exports = router;
