const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Caminho do arquivo config.json
const configPath = path.join(
  process.env.LOCALAPPDATA || path.join(require("os").homedir(), ".local", "share"),
  "FinancEasyV2",
  "config.json"
);

// Rota para buscar a senha
router.get("/senha", (req, res) => {
  try {
    if (!fs.existsSync(configPath)) {
      console.error("Arquivo de configuração não encontrado:", configPath);
      return res.status(404).json({ error: "Arquivo de configuração não encontrado." });
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (!config.senha) {
      console.error("Senha não encontrada no arquivo de configuração.");
      return res.status(500).json({ error: "Senha não encontrada no arquivo de configuração." });
    }

    res.json({ senha: config.senha });
  } catch (error) {
    console.error("Erro ao ler o arquivo de configuração:", error.message);
    res.status(500).json({ error: "Erro ao acessar o arquivo de configuração." });
  }
});

module.exports = router;
