const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const despesasRouter = require("./routers/despesas");
const receitasRouter = require("./routers/receitas");
const cartoesRouter = require("./routers/cartoes");
const reservasRouter = require("./routers/reservas");
const comissoesRouter = require("./routers/comissoes");
const historicoRouter = require("./routers/historico");
const dashboardRouter = require("./routers/dashboard");
const notificacoesRouter = require("./routers/notificacoes");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/despesas", despesasRouter);
app.use("/api/receitas", receitasRouter);
app.use("/api/cartoes", cartoesRouter);
app.use("/api/reservas", reservasRouter);
app.use("/api/comissoes", comissoesRouter);
app.use("/api/historico", historicoRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notificacoes", notificacoesRouter);

const configRouter = require("./routers/config");
app.use("/api/config", configRouter);

app.use(express.static(path.join(__dirname, "../pages")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/home/home.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});