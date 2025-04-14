const express = require("express");
const { Client } = require("pg");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Configuração do banco de dados
const localAppDataPathConfig =
  process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "share");
const appFolderConfig = path.join(localAppDataPathConfig, "FinancEasyV2");
const configPath = path.join(appFolderConfig, "config.json");

function loadConfig() {
  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data);
  } catch (error) {
    return {
      ipServidor: "127.0.0.1",
      portaServidor: 3050,
    };
  }
}

const config = loadConfig();

// Variável para configurar o IP da máquina
const IP_MAQUINA = config.ipServidor || "127.0.0.1";
const PORT = config.portaServidor || 3050;

const app = express();

// Middleware para JSON
app.use(express.json());

// Servir arquivos estáticos da pasta "pages"
app.use("/pages", express.static(path.join(__dirname, "../pages")));

// Servir arquivos estáticos da pasta "public"
app.use("/public", express.static(path.join(__dirname)));

// Configuração do PostgreSQL
const client = new Client({
  user: "your_user",
  host: "your_host",
  database: "your_database",
  password: "your_password",
  port: 5432,
});

client.connect();

// Exemplo de rota para listar cartões
app.get("/api/cartoes", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM cartoes");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar cartões:", error);
    res.status(500).json({ error: "Erro ao buscar cartões" });
  }
});

// ...adicione outras rotas aqui...

// Rota para servir qualquer página HTML dentro da pasta "pages"
app.get("/pages/:folder/:file", (req, res) => {
  const { folder, file } = req.params;
  const filePath = path.join(__dirname, `../pages/${folder}/${file}`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Página não encontrada");
  }
});

// Rota para corrigir problemas de caminhos
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "../pages/home/home.html");
  res.sendFile(filePath);
});

module.exports = app;
