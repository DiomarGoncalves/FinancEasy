const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// Rota para obter dados do dashboard da página inicial
router.get("/dashboard", async (req, res) => {
  console.log("Iniciando processamento da rota /dashboard...");
  try {
    const mesAtual = new Date().getMonth() + 1; // Mês atual (1-12)
    const anoAtual = new Date().getFullYear(); // Ano atual
    const mesFormatado = String(mesAtual).padStart(2, "0");

    console.log("Parâmetros calculados:", { mesAtual, anoAtual, mesFormatado });

    const saldoQuery = `
      SELECT 
        COALESCE(SUM(r.valor), 0) - COALESCE(SUM(d.valor), 0) AS saldoAtual
      FROM 
        (SELECT valor FROM receitas WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?) r
      LEFT JOIN 
        (SELECT valor FROM despesas WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?) d
    `;
    const despesasQuery = `
      SELECT COALESCE(SUM(valor), 0) AS totalDespesas 
      FROM despesas 
      WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?
    `;
    const receitasQuery = `
      SELECT COALESCE(SUM(valor), 0) AS totalReceitas 
      FROM receitas 
      WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?
    `;
    const desempenhoQuery = `
      SELECT 
        strftime('%m', data) AS mes, 
        SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS despesas,
        SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS receitas
      FROM (
        SELECT data, valor, 'despesa' AS tipo FROM despesas
        UNION ALL
        SELECT data, valor, 'receita' AS tipo FROM receitas
      )
      WHERE strftime('%Y', data) = ?
      GROUP BY mes
      ORDER BY mes
    `;

    console.log("Consultas SQL preparadas:", {
      saldoQuery,
      despesasQuery,
      receitasQuery,
      desempenhoQuery,
    });

    const [saldo, despesas, receitas, desempenho] = await Promise.all([
      db.getAsync(saldoQuery, [mesFormatado, anoAtual, mesFormatado, anoAtual]),
      db.getAsync(despesasQuery, [mesFormatado, anoAtual]),
      db.getAsync(receitasQuery, [mesFormatado, anoAtual]),
      db.allAsync(desempenhoQuery, [anoAtual]),
    ]);

    console.log("Resultados intermediários das consultas:");
    console.log("Saldo:", saldo);
    console.log("Despesas:", despesas);
    console.log("Receitas:", receitas);
    console.log("Desempenho:", desempenho);

    if (!saldo || !despesas || !receitas || desempenho.length === 0) {
      console.warn("Os dados retornados estão incompletos ou ausentes.");
    }

    const desempenhoMensal = {
      meses: desempenho.map((d) => d.mes),
      despesas: desempenho.map((d) => d.despesas),
      receitas: desempenho.map((d) => d.receitas),
    };

    res.json({
      saldoAtual: saldo?.saldoAtual || 0,
      totalDespesas: despesas?.totalDespesas || 0,
      totalReceitas: receitas?.totalReceitas || 0,
      desempenhoMensal: desempenhoMensal.meses.length ? desempenhoMensal : { meses: [], despesas: [], receitas: [] },
    });

    console.log("Resposta enviada com sucesso.");
  } catch (error) {
    console.error("Erro ao obter dados do dashboard da página inicial:", error);
    res.status(500).json({ error: "Erro ao obter dados do dashboard da página inicial" });
  }
});

module.exports = router;
