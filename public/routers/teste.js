const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para inserir valores de teste
router.post("/inserir-valores", (req, res) => {
  const sqls = [
    `INSERT INTO cartoes (nome, banco, limite, vencimento) VALUES ('Cartão A', 'Banco A', 1000.00, '2025-01-10');`,
    `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-01-15', 150.00, 'Crédito', 1, 0, 150.00, 1);`,
    `INSERT INTO receitas (descricao, data, valor, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) VALUES ('Salário', '2025-01-15', 3000.00, 'Salário', 'Empresa X', 'Transferência', 'Conta Corrente', 1, 'Mensal');`
  ];

  db.serialize(() => {
    let hasError = false;
    sqls.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.error("Erro ao executar SQL:", sql, err);
          hasError = true;
        }
      });
    });

    if (hasError) {
      return res.status(500).json({ error: "Erro ao inserir valores de teste" });
    }
    res.json({ status: "success", message: "Valores de teste inseridos com sucesso!" });
  });
});

module.exports = router;
