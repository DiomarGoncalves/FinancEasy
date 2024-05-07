const sqlite3 = require('sqlite3').verbose();

// Conectar ao banco de dados
const db = new sqlite3.Database('database/database.db');

// Criar tabela de transações
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        amount REAL,
        date TEXT
    )`);
});

// Fechar conexão com o banco de dados
db.close();
