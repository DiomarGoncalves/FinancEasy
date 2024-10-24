const express = require('express');
const app = express();
const path = require('path');
const cartoesRoutes = require('./routes/cartoes'); // Importar as rotas de cartões
const producaoRoutes = require('./routes/producao'); // Importar rotas em produção
const despesasRoutes = require('./routes/despesas'); // Importar rotas de despesas

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Para processar JSON no corpo da requisição

// Rota da página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Definir rotas para as diferentes funcionalidades
app.use('/cartoes', cartoesRoutes);
app.use('/producao', producaoRoutes);
app.use('/despesas', despesasRoutes);

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://127.0.0.1:${PORT}/`);
});
