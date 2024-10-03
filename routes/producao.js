const express = require('express');
const router = express.Router();
const path = require('path');

// Rota para exibir a página de despesas
router.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'producao.html'));
});// Configurar o banco de dados SQLite