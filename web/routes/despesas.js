const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Rota para exibir a página de despesas
router.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'despesas.html'));
});// Configurar o banco de dados SQLite
const db = new sqlite3.Database('./database.db');

// Criar tabela de despesas se não existir
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS despesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estabelecimento TEXT,
        data TEXT,
        valor REAL,
        forma_pagamento TEXT,
        numero_parcelas INTEGER,
        parcelas_restantes INTEGER,
        valor_parcela REAL
    )`);
});

// Rota para exibir despesas
router.get('/', (req, res) => {
    db.all(`SELECT * FROM despesas`, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// Rota para adicionar uma nova despesa
router.post('/despesas/add', (req, res) => {
    const { estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela } = req.body;
    
    // Exiba os dados recebidos no console para verificar
    console.log(req.body);

    // Verifica se todos os campos foram preenchidos
    if (!estabelecimento || !data || !valor || !forma_pagamento || !numero_parcelas || !parcelas_restantes || !valor_parcela) {
        return res.status(400).json({ error: 'Preencha todos os campos corretamente' });
    }

    // Inserir os dados no banco de dados
    db.run(`INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela], 
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

module.exports = router;
