const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const os = require("os");
const db = require("./database/db.js");

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

// Promisify para suportar métodos assíncronos
db.getAsync = promisify(db.get);
db.allAsync = promisify(db.all);
db.runAsync = promisify(db.run);

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

// Importar rotas
const receitasRouter = require("./routers/receitas.js");
const despesasRouter = require("./routers/despesas.js");
const cartoesRouter = require("./routers/cartoes.js");
const configuracoesRouter = require("./routers/configuracoes.js");
const comissoesRouter = require("./routers/comissoes.js");
const historicoRouter = require("./routers/historico.js");
const reservasRouter = require("./routers/reservas.js");
const objetivoRouter = require("./routers/objetivo.js");
const notificacoesRouter = require("./routers/notificacoes.js");
const testeRouter = require("./routers/teste.js");
const dashboardRouter = require("./routers/dashboard.js");
const investimentosRouter = require("./routers/investimentos.js");
const homeRouter = require("./routers/home.js");
const configRouter = require("./routers/config");

// Usar rotas
app.use("/api/receitas", receitasRouter);
app.use("/api/despesas", despesasRouter);
app.use("/api/cartoes", cartoesRouter);
app.use("/api/config", configuracoesRouter);
app.use("/api/comissoes", comissoesRouter);
app.use("/api/historico", historicoRouter);
app.use("/api/reservas", reservasRouter);
app.use("/api/objetivo", objetivoRouter);
app.use("/api/notificacoes", notificacoesRouter);
app.use("/api/teste", testeRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/investimentos", investimentosRouter); // Adicionada a rota de investimentos
app.use("/api/home", homeRouter);
app.use("/api/config", configRouter);

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
