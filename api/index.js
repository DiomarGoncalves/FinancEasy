require("dotenv").config(); // Carregar variáveis do .env
const express = require("express");
const googleAuth = require("./auth/google");
const path = require("path");

const app = express();

app.use(express.json());

// Servir arquivos estáticos do diretório "public"
app.use(express.static(path.join(__dirname, "../public")));

// Rotas principais
app.use("/api/auth/google", googleAuth);

// Rota para fornecer o client_id ao frontend
app.get("/api/client-id", (req, res) => {
  res.json({ client_id: process.env.GOOGLE_CLIENT_ID });
});

// Rota para a página inicial
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../public/login.html");
  res.sendFile(filePath);
});

// Rota para capturar todas as outras requisições
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "../public/404.html"); // Página 404 personalizada
  res.sendFile(filePath);
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
