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

// Rota para registrar despesas parceladas
router.post("/parceladas", (req, res) => {
  const { estabelecimento, data, valor, numero_parcelas, forma_pagamento, cartao_id } = req.body;

  if (!estabelecimento || !data || !valor || !numero_parcelas || !forma_pagamento) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  // Normalizar o valor de forma_pagamento
  const formasPagamentoValidas = ["Crédito", "Débito", "Dinheiro", "Pix"];
  const formaPagamentoNormalizada = forma_pagamento
    .replace("Cartão de Crédito", "Crédito")
    .replace("Cartão de Débito", "Débito");

  if (!formasPagamentoValidas.includes(formaPagamentoNormalizada)) {
    return res.status(400).json({ error: "Forma de pagamento inválida." });
  }

  const valorParcela = valor / numero_parcelas;
  const parcelasRestantes = numero_parcelas;

  const sql = `
    INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [estabelecimento, data, valor, formaPagamentoNormalizada, numero_parcelas, parcelasRestantes, valorParcela, cartao_id || null], function (err) {
    if (err) {
      console.error("Erro ao registrar despesa parcelada:", err.message);
      return res.status(500).json({ error: "Erro ao registrar despesa parcelada." });
    }
    res.json({ id: this.lastID, message: "Despesa parcelada registrada com sucesso!" });
  });
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

// Rota para pagar uma despesa
router.post("/:id/pagar", (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE despesas
    SET paga = 1, parcelas_restantes = CASE WHEN parcelas_restantes > 1 THEN parcelas_restantes - 1 ELSE 0 END
    WHERE id = ?
  `;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao pagar despesa:", err.message);
      return res.status(500).json({ error: "Erro ao pagar despesa." });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Despesa não encontrada." });
    }

    res.json({ message: "Despesa paga com sucesso!" });
  });
});

// Rota para excluir uma despesa
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM despesas WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) {
      console.error("Erro ao excluir despesa:", err.message);
      return res.status(500).json({ error: "Erro ao excluir despesa." });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Despesa não encontrada." });
    }

    res.json({ message: "Despesa excluída com sucesso!" });
  });
});

module.exports = router;
