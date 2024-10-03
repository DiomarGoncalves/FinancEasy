const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Necessário para processar JSON no corpo da requisição


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Definir rotas
// app.use('/cartoes', require('./routes/cartoes'));
app.use('/producao', require('./routes/producao'));
app.use('/despesas', require('./routes/despesas'));


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta  http://127.0.0.1:${PORT}/`);
});
