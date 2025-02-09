function resetFormAndUnlockInputs(form) {
    form.reset(); // Resetar o formulário
    form.querySelectorAll('input').forEach(input => input.disabled = false); // Desbloquear inputs
};

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
        resetFormAndUnlockInputs(event.target); // Resetar e desbloquear inputs

        try {
            await window.controle.invoke('add-receita', receita);
            console.log('Receita adicionada com sucesso!');
            loadReceitas();
        } catch (error) {
            console.error(`Erro ao adicionar receita: ${error.message}`);
        }
    });

    document.getElementById('salarioForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const descricao = "Salário";
        const data = document.getElementById('dataSalario').value;
        const valor = parseFloat(document.getElementById('valorSalario').value);
        const formaRecebimento = document.getElementById('forma_recebimento_salario').value;

        const receita = {
            descricao,
            data,
            valor,
            forma_recebimento: formaRecebimento
        };
        resetFormAndUnlockInputs(event.target); // Resetar e desbloquear inputs

        try {
            await window.controle.invoke('add-receita', receita);
            console.log('Salário adicionado com sucesso!');
            loadReceitas();
        } catch (error) {
            console.error(`Erro ao adicionar salário: ${error.message}`);
        }
    });

    loadReceitas();
});

async function loadReceitas() {
    try {
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
    } catch (error) {
        console.error(`Erro ao carregar receitas: ${error.message}`);
    }
}

async function deleteReceita(id) {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
        try {
            await window.controle.invoke('delete-receita', id);
            loadReceitas(); // Atualizar a lista de receitas
        } catch (error) {
            console.error(`Erro ao excluir receita: ${error.message}`);
        }
    }
}