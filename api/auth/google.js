const { google } = require("googleapis");
const express = require("express");
const app = express();

app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userId = payload["sub"];
    const email = payload["email"];
    const name = payload["name"];

    // Aqui você pode salvar o usuário no banco de dados, se necessário.

    res.status(200).json({ token: `fake-jwt-token-for-${userId}`, email, name });
  } catch (error) {
    res.status(400).json({ error: "Autenticação falhou" });
  }
});

module.exports = app;
