const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para listar receitas
router.get("/", (req, res) => {
  const sql = `SELECT * FROM receitas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar receitas:", err);
      res.status(500).json({ error: "Erro ao buscar receitas" });
    } else {
      res.json(rows);
    }
  });
});

// Rota para adicionar receita
router.post("/", (req, res) => {
  const {
    descricao,
    valor,
    data,
    categoria,
    fonte,
    forma_recebimento,
    conta_bancaria,
    recorrente,
    intervalo_recorrencia,
  } = req.body;

  if (!descricao || !valor || !data) {
    console.error("Dados inválidos recebidos:", req.body);
    return res.status(400).json({ error: "Dados inválidos. Campos obrigatórios ausentes." });
  }

  const sql = `INSERT INTO receitas (descricao, valor, data, categoria, fonte, forma_recebimento, conta_bancaria, recorrente, intervalo_recorrencia) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [
      descricao,
      valor,
      data,
      categoria,
      fonte,
      forma_recebimento,
      conta_bancaria,
      recorrente,
      intervalo_recorrencia,
    ],
    function (err) {
      if (err) {
        console.error("Erro ao adicionar receita:", err);
        res.status(500).json({ error: "Erro ao adicionar receita" });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// Rota para filtrar receitas
router.post("/filtrar", (req, res) => {
  const { dataInicio, dataFim } = req.body;
  console.log("Recebendo filtros para receitas:", { dataInicio, dataFim });

  let sql = `SELECT * FROM receitas WHERE 1=1`;
  const params = [];

  if (dataInicio) {
    sql += ` AND data >= ?`;
    params.push(dataInicio);
  }
  if (dataFim) {
    sql += ` AND data <= ?`;
    params.push(dataFim);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar receitas:", err.message);
      res.status(500).json({ error: "Erro ao filtrar receitas" });
    } else {
      res.json(rows);
    }
  });
});

module.exports = router;
