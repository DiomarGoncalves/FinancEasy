const express = require('express');
const router = express.Router();
const path = require('path'); // Certifique-se de importar o path
const db = require('../db');


// Rota para carregar cartões
router.get('/loadCartoes', (req, res) => {
    const sql = 'SELECT * FROM cartoes'; // Seleciona todos os cartões

    db.all(sql, [], (err, cartoes) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar cartões' });
        }
        res.json(cartoes); // Retorna os cartões em formato JSON
    });
});


// Exemplo de rota para listar cartões
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'cartoes.html'));
});

// Página para adicionar novo cartão
router.get('/novo', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'novoCartao.html'));
});

// Rota para salvar novo cartão no banco de dados
router.post('/adicionar', (req, res) => {
    const { nome, banco, limite } = req.body;

    if (!nome || !banco || !limite) {
        return res.status(400).json({ error: 'Preencha todos os campos corretamente' });
    }

    const sql = 'INSERT INTO cartoes (nome, banco, limite) VALUES (?, ?, ?)';
    db.run(sql, [nome, banco, limite], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao adicionar cartão' });
        }
        res.redirect('/cartoes');
    });
});

// Rota para visualizar detalhes de um cartão
router.get('/:nome', (req, res) => {
    const nomeCartao = decodeURIComponent(req.params.nome); // Decodifica o nome do cartão

    // Consulta o banco de dados para obter os detalhes do cartão
    const sql = 'SELECT * FROM cartoes WHERE nome = ?';
    db.get(sql, [nomeCartao], (err, cartao) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar cartão' });
        }
        if (!cartao) {
            return res.status(404).json({ error: 'Cartão não encontrado' });
        }
        // Envie a página de detalhes do cartão
        res.send(`
            <h1>Detalhes do Cartão: ${cartao.nome}</h1>
            <p>Banco: ${cartao.banco}</p>
            <p>Limite: ${cartao.limite}</p>
            <a href="/cartoes" class="btn btn-light">Voltar para a Lista de Cartões</a>
        `);
    });
});

module.exports = router;
