const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'financeiro.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});

// Função para criar as tabelas se não existirem
function inicializarBanco() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS contas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL,
            saldo_inicial REAL NOT NULL,
            saldo_atual REAL NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conta_id INTEGER,
            categoria_id INTEGER,
            descricao TEXT,
            valor REAL,
            data DATE NOT NULL,
            tipo TEXT,
            FOREIGN KEY (conta_id) REFERENCES contas (id),
            FOREIGN KEY (categoria_id) REFERENCES categorias (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS comparacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            taxa REAL NOT NULL,
            beneficios TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS orcamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            data DATE NOT NULL,
            conta_id INTEGER,
            FOREIGN KEY (conta_id) REFERENCES contas (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS notificacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            mensagem TEXT,
            data DATE NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS contatos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT,
            email TEXT
        )`);
    });
}

// Inicializa o banco de dados
inicializarBanco();

module.exports = {
    adicionarConta,
    obterContas,
    removerConta,
    adicionarTransacao,
    obterUltimasTransacoes,
};
