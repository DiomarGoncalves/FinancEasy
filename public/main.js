require('electron-reload')(__dirname);
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database/db');
const localAppDataPathConfig = process.env.LOCALAPPDATA || path.join(os.homedir(), '.local', 'share');
const appFolderConfig = path.join(localAppDataPathConfig, 'FinancEasy');
const configPath = path.join(appFolderConfig, 'config.json');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    // mainWindow.maximize();

    mainWindow.loadFile(path.join(__dirname, '..', 'pages','home', 'home.html')); // Carrega o arquivo HTML principal
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady().then(() => {
    // Verificar e criar o arquivo de configuração se não existir
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            tema: 'escuro',
            notificacoes: 'ativadas',
            limiteGastos: 0,
            dbPath: 'C:\Users\User\AppData\Local\FinancEasy',
            senha: 'admin'
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig));
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Função para carregar configurações
function loadConfig() {
    try {
        const data = fs.readFileSync(configPath);
        return JSON.parse(data);
    } catch (error) {
        return { tema: 'escuro', notificacoes: 'ativadas', limiteGastos: 0,"dbPath":"C:\Users\User\AppData\Local\FinancEasy" }; // Configurações padrão
    }
}

// Função para salvar configurações
function saveConfig(config) {
    const { novaSenha, ...restConfig } = config;
    const currentConfig = loadConfig();
    const updatedConfig = { ...currentConfig, ...restConfig };
    if (novaSenha) {
        updatedConfig.senha = novaSenha;
    }
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig));
}

// IPC Handlers para configurações
ipcMain.handle('load-config', async () => {
    return loadConfig();
});

ipcMain.handle('save-config', async (event, config) => {
    saveConfig(config);
    return { status: 'success' };
});

// IPC Handler para verificar a senha
ipcMain.handle('verificar-senha', async (event, senha) => {
    const config = loadConfig();
    return config.senha === senha;
});

// Atualizar o limite do cartão ao adicionar uma despesa
ipcMain.handle('add-despesa', async (event, despesa) => {
    const { estabelecimento, data, valor, forma_pagamento, numero_parcelas, cartao_id } = despesa;
    const valorParcela = valor / numero_parcelas;

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            for (let i = 0; i < numero_parcelas; i++) {
                const parcelaData = new Date(data);
                parcelaData.setMonth(parcelaData.getMonth() + i);
                const parcelaDataStr = parcelaData.toISOString().split('T')[0];

                const sql = `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [estabelecimento, parcelaDataStr, valorParcela, forma_pagamento, numero_parcelas, numero_parcelas - i, valorParcela, cartao_id], function (err) {
                    if (err) {
                        reject(err);
                    }
                });
            }

            // Atualizar o limite do cartão
            const updateSql = `UPDATE cartoes SET limite = limite - ? WHERE id = ?`;
            db.run(updateSql, [valor, cartao_id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ status: 'success' });
                }
            });
        });
    });
});
ipcMain.handle('get-despesas', async () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM despesas`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('delete-despesa', async (event, id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM despesas WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
});

ipcMain.handle('pay-despesa', async (event, id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM despesas WHERE id = ?`;
        console.log(sql);
        db.get(sql, [id], (err, despesa) => {
            if (err) {
                reject(err);
            } else {
                const insertSql = `INSERT INTO historico_despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id, data_pagamento) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                const deleteSql = `DELETE FROM despesas WHERE id = ?`;
                const data_pagamento = new Date().toISOString().split('T')[0];

                db.run(insertSql, [despesa.estabelecimento, despesa.data, despesa.valor, despesa.forma_pagamento, despesa.numero_parcelas, despesa.parcelas_restantes, despesa.valor_parcela, despesa.cartao_id, data_pagamento], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        db.run(deleteSql, [id], function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ changes: this.changes });
                            }
                        });
                    }
                });
            }
        });
    });
});

ipcMain.handle('get-cartoes', async () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM cartoes`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('add-cartao', async (event, cartao) => {
    const { nome, banco, limite } = cartao;

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO cartoes (nome, banco, limite) VALUES (?, ?, ?)`;
        db.run(sql, [nome, banco, limite], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
});

ipcMain.handle('delete-cartao', async (event, id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM cartoes WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
});

ipcMain.handle('update-cartao', async (event, cartao) => {
    const { id, nome, banco, limite } = cartao;

    return new Promise((resolve, reject) => {
        const sql = `UPDATE cartoes SET nome = ?, banco = ?, limite = ? WHERE id = ?`;
        db.run(sql, [nome, banco, limite, id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
});

ipcMain.handle('get-historico-despesas', async () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM historico_despesas`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// Função para inserir valores de teste
function inserirValoresTeste() {
    return new Promise((resolve, reject) => {
        const sqls = [
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Loja A', '2025-01-01', 100.00, 'Crédito', 1, 0, 100.00, 1)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Loja B', '2025-02-01', 200.00, 'Débito', 2, 1, 100.00, 2)`,
            `INSERT INTO cartoes (nome, banco, limite) VALUES ('Cartão A', 'Banco A', 1000.00)`,
            `INSERT INTO cartoes (nome, banco, limite) VALUES ('Cartão B', 'Banco B', 2000.00)`,
            `INSERT INTO historico_despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id, data_pagamento) VALUES ('Loja A', '2025-01-01', 100.00, 'Crédito', 1, 0, 100.00, 1, '2025-01-02')`,
            `INSERT INTO historico_despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id, data_pagamento) VALUES ('Loja B', '2025-02-01', 200.00, 'Débito', 2, 1, 100.00, 2, '2025-02-02')`,
            `INSERT INTO receitas (descricao, data, valor, forma_recebimento) VALUES ('Salário', '2025-01-15', 3000.00, 'Transferência')`,
            `INSERT INTO receitas (descricao, data, valor, forma_recebimento) VALUES ('Freelance', '2025-02-10', 1500.00, 'Dinheiro')`
        ];
        db.serialize(() => {
            sqls.forEach(sql => {
                db.run(sql, (err) => {
                    if (err) {
                        console.error('Erro ao executar SQL:', sql, err); // Log de erro
                        reject(err);
                    }
                });
            });
            resolve();
        });
    });
}

function inserirDespesasAnoCompleto() {
    return new Promise((resolve, reject) => {
        const sqls = [
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-01-15', 150.00, 'Crédito', 1, 0, 150.00, 1)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Padaria', '2025-02-10', 50.00, 'Débito', 1, 0, 50.00, 2)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Farmácia', '2025-03-05', 75.00, 'Dinheiro', 1, 0, 75.00, NULL)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Restaurante', '2025-04-20', 200.00, 'Crédito', 2, 1, 100.00, 1)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Posto de Gasolina', '2025-05-18', 120.00, 'Débito', 1, 0, 120.00, 2)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Cinema', '2025-06-25', 60.00, 'Dinheiro', 1, 0, 60.00, NULL)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Loja de Roupas', '2025-07-12', 300.00, 'Crédito', 3, 2, 100.00, 1)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Supermercado', '2025-08-08', 180.00, 'Débito', 1, 0, 180.00, 2)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Padaria', '2025-09-14', 40.00, 'Dinheiro', 1, 0, 40.00, NULL)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Farmácia', '2025-10-22', 90.00, 'Crédito', 1, 0, 90.00, 1)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Restaurante', '2025-11-30', 250.00, 'Débito', 1, 0, 250.00, 2)`,
            `INSERT INTO despesas (estabelecimento, data, valor, forma_pagamento, numero_parcelas, parcelas_restantes, valor_parcela, cartao_id) VALUES ('Posto de Gasolina', '2025-12-05', 100.00, 'Dinheiro', 1, 0, 100.00, NULL)`
        ];
        db.serialize(() => {
            sqls.forEach(sql => {
                db.run(sql, (err) => {
                    if (err) {
                        console.error('Erro ao executar SQL:', sql, err); // Log de erro
                        reject(err);
                    }
                });
            });
            resolve();
        });
    });
}

// Adicione um manipulador IPC para chamar essa função
ipcMain.handle('inserir-despesas-ano-completo', async () => {
    await inserirDespesasAnoCompleto();
    return 'Despesas inseridas para todos os meses do ano de 2025';
});
// Função para limpar o banco de dados
function limparBanco() {
    return new Promise((resolve, reject) => {
        const sqls = [
            `DELETE FROM despesas`,
            `DELETE FROM cartoes`,
            `DELETE FROM historico_despesas`,
            `DELETE FROM receitas`
        ];
        db.serialize(() => {
            sqls.forEach(sql => {
                db.run(sql, (err) => {
                    if (err) {
                        console.error('Erro ao executar SQL:', sql, err); // Log de erro
                        reject(err);
                    }
                });
            });
            resolve();
        });
    });
};


// IPC Handlers para teste e limpeza
ipcMain.handle('inserir-valores-teste', async () => {
    await inserirValoresTeste();
    return { status: 'success' };
});

ipcMain.handle('limpar-banco', async () => {
    await limparBanco();
    return { status: 'success' };
});

// IPC Handlers para receitas
ipcMain.handle('add-receita', async (event, receita) => {
    const { descricao, data, valor, forma_recebimento } = receita;

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO receitas (descricao, data, valor, forma_recebimento) VALUES (?, ?, ?, ?)`;
        db.run(sql, [descricao, data, valor, forma_recebimento], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
});

ipcMain.handle('get-receitas', async () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM receitas`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('delete-receita', async (event, id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM receitas WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
});

// IPC Handlers para filtrar despesas e receitas
ipcMain.handle('get-despesas-filtradas', async (event, filtros) => {
    const { dataInicio, dataFim } = filtros;
    console.log('Filtros recebidos:', filtros); // Log para depuração
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM despesas WHERE data BETWEEN ? AND ?`;
        console.log('Executando SQL:', sql, [dataInicio, dataFim]); // Log para depuração
        db.all(sql, [dataInicio, dataFim], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar despesas:', err); // Log de erro
                reject(err);
            } else {
                console.log('Despesas filtradas no banco de dados:', rows); // Log para depuração
                resolve(rows);
            }
        });
    });
});

ipcMain.handle('get-receitas-filtradas', async (event, filtros) => {
    const { dataInicio, dataFim } = filtros;
    console.log('Filtros recebidos:', filtros); // Log para depuração
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM receitas WHERE data BETWEEN ? AND ?`;
        db.all(sql, [dataInicio, dataFim], (err, rows) => {
            if (err) {
                console.error('Erro ao buscar receitas:', err); // Log de erro
                reject(err);
            } else {
                console.log('Receitas filtradas no banco de dados:', rows); // Log para depuração
                resolve(rows);
            }
        });
    });
});
// IPC Handler para calcular saldo
ipcMain.handle('calcular-saldo', async () => {
    return new Promise((resolve, reject) => {
        const sqlDespesas = `SELECT SUM(valor) as totalDespesas FROM despesas`;
        const sqlReceitas = `SELECT SUM(valor) as totalReceitas FROM receitas`;

        db.get(sqlDespesas, [], (err, resultDespesas) => {
            if (err) {
                reject(err);
            } else {
                db.get(sqlReceitas, [], (err, resultReceitas) => {
                    if (err) {
                        reject(err);
                    } else {
                        const saldo = (resultReceitas.totalReceitas || 0) - (resultDespesas.totalDespesas || 0);
                        resolve({ saldo });
                    }
                });
            }
        });
    });
});

ipcMain.handle('select-db-path', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    console.log('result', result);
    if (result.canceled) {
        return null;
        console.log('Operação cancelada');
    } else {
        return result.filePaths[0];
        console.log(result.filePaths[0]);
    }
});