document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('receitaForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const descricao = document.getElementById('descricao').value;
        const data = document.getElementById('data').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const formaRecebimento = document.getElementById('forma_recebimento').value;

        const receita = {
            descricao,
            data,
            valor,
            forma_recebimento: formaRecebimento
        };

        await window.controle.invoke('add-receita', receita);
        alert('Receita adicionada com sucesso!');
        loadReceitas();
    });

    loadReceitas();
});

async function loadReceitas() {
    const receitas = await window.controle.invoke('get-receitas');
    const tableBody = document.querySelector("#receitasTable tbody");
    tableBody.innerHTML = ""; // Limpar tabela

    receitas.forEach((receita) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${receita.descricao}</td>
            <td>${receita.data}</td>
            <td>R$ ${receita.valor.toFixed(2)}</td>
            <td>${receita.forma_recebimento}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteReceita(${receita.id})">Excluir</button>
            </td>
        `;
        tableBody.appendChild(row); // Adicionar linha à tabela
    });
}

async function deleteReceita(id) {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
        await window.controle.invoke('delete-receita', id);
        loadReceitas(); // Atualizar a lista de receitas
    }
}