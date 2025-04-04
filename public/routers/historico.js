const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para listar histórico de despesas
router.get("/despesas", (req, res) => {
  const sql = `SELECT * FROM historico_despesas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar histórico de despesas:", err.message);
      return res.status(500).json({ error: "Erro ao buscar histórico de despesas" });
    }

    console.log("Dados retornados da tabela historico_despesas:", rows); // Log para depuração
    res.json(rows); // Certifique-se de que está retornando um JSON válido
  });
});

// Rota para listar histórico de receitas
router.get("/receitas", (req, res) => {
  const sql = `SELECT * FROM historico_receitas`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar histórico de receitas:", err.message);
      return res.status(500).json({ error: "Erro ao buscar histórico de receitas" });
    }
    res.json(rows);
  });
});

// Rota para listar histórico de comissões
router.get("/comissoes", (req, res) => {
  const sql = `SELECT * FROM historico_comissoes`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar histórico de comissões:", err.message);
      return res.status(500).json({ error: "Erro ao buscar histórico de comissões" });
    }
    res.json(rows);
  });
});

// Rota para filtrar histórico de despesas
router.post("/despesas/filtrar", (req, res) => {
  const { mes } = req.body;

  if (!mes || typeof mes !== "string" || !/^\d{4}-\d{2}$/.test(mes)) {
    console.warn("Parâmetro 'mes' inválido ou ausente na requisição:", mes);
    return res.status(400).json({ 
      error: "O parâmetro 'mes' é obrigatório e deve estar no formato 'YYYY-MM'." 
    });
  }

  const sql = `
    SELECT * FROM historico_despesas
    WHERE strftime('%Y-%m', data_pagamento) = ?
  `;
  const params = [mes];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar histórico de despesas:", err.message);
      return res.status(500).json({ error: "Erro ao filtrar histórico de despesas" });
    }
    res.json(rows);
  });
});

// Rota para filtrar histórico de receitas
router.post("/receitas/filtrar", (req, res) => {
  const { mes } = req.body;

  if (!mes || typeof mes !== "string" || !/^\d{4}-\d{2}$/.test(mes)) {
    console.warn("Parâmetro 'mes' inválido ou ausente na requisição:", mes);
    return res.status(400).json({ 
      error: "O parâmetro 'mes' é obrigatório e deve estar no formato 'YYYY-MM'." 
    });
  }

  const sql = `
    SELECT * FROM historico_receitas
    WHERE strftime('%Y-%m', data_recebimento) = ?
  `;
  const params = [mes];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar histórico de receitas:", err.message);
      return res.status(500).json({ error: "Erro ao filtrar histórico de receitas" });
    }
    res.json(rows);
  });
});

// Rota para filtrar histórico de comissões
router.post("/comissoes/filtrar", (req, res) => {
  const { mes } = req.body;

  if (!mes || typeof mes !== "string" || !/^\d{4}-\d{2}$/.test(mes)) {
    console.warn("Parâmetro 'mes' inválido ou ausente na requisição:", mes);
    return res.status(400).json({ 
      error: "O parâmetro 'mes' é obrigatório e deve estar no formato 'YYYY-MM'." 
    });
  }

  const sql = `
    SELECT * FROM historico_comissoes
    WHERE strftime('%Y-%m', dataRecebimento) = ?
  `;
  const params = [mes];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao filtrar histórico de comissões:", err.message);
      return res.status(500).json({ error: "Erro ao filtrar histórico de comissões" });
    }
    res.json(rows);
  });
});

module.exports = router;
