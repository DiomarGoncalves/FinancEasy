const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const os = require("os");
const db = require("../database/db.js");

const localAppDataPathConfig =
  process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "share");
const appFolderConfig = path.join(localAppDataPathConfig, "FinancEasyV2");
const configPath = path.join(appFolderConfig, "config.json");

// Rota para obter configurações
router.get("/", (req, res) => {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath));
    res.json(config);
  } else {
    res.status(404).json({ error: "Configuração não encontrada" });
  }
});

// Rota para salvar configurações
router.put("/", (req, res) => {
  const { novaSenha, dbPath, ...restConfig } = req.body;
  let config = {};

  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }

  const updatedConfig = { ...config, ...restConfig };
  if (novaSenha) {
    updatedConfig.senha = novaSenha;
  }
  if (dbPath) {
    if (!fs.existsSync(dbPath)) {
      return res.status(400).json({ error: "O caminho do banco de dados não existe." });
    }
    updatedConfig.dbPath = dbPath;
  }

  fs.writeFileSync(configPath, JSON.stringify(updatedConfig));
  res.json({ status: "success" });
});

// Rota para verificar a senha
router.post("/verificar-senha", (req, res) => {
  const { senha } = req.body;

  if (!senha) {
    console.warn("Senha não fornecida na requisição.");
    return res.status(400).json({ error: "A senha é obrigatória." });
  }

  console.log("Verificando senha fornecida:", senha);

  const sql = `SELECT valor FROM configuracoes WHERE chave = 'senha'`;
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error("Erro ao executar consulta no banco de dados:", err.message);
      return res.status(500).json({ error: "Erro ao verificar senha." });
    }

    if (!row) {
      console.warn("Nenhuma senha encontrada na tabela 'configuracoes'.");
      return res.status(404).json({ error: "Senha não configurada." });
    }

    console.log("Senha armazenada no banco de dados:", row.valor);

    if (row.valor === senha) {
      console.log("Senha verificada com sucesso.");
      res.json({ autenticado: true });
    } else {
      console.warn("Senha incorreta.");
      res.json({ autenticado: false });
    }
  });
});

module.exports = router;
