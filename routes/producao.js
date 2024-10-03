const express = require('express');
const router = express.Router();
const path = require('path');

// Rota para a página "Em Produção"
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'emProducao.html'));
});

module.exports = router;
