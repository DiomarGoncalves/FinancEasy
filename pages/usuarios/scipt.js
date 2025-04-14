document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = document.getElementById("formCadastro");
    const formLogin = document.getElementById("formLogin");

    if (formCadastro) {
        formCadastro.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome").value;
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;

            try {
                const response = await fetch("/api/usuarios/registro", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nome, email, senha }),
                });

                if (response.ok) {
                    alert("Cadastro realizado com sucesso!");
                    window.location.href = "/pages/usuarios/login/login.html";
                } else {
                    const error = await response.json();
                    alert(`Erro: ${error.error}`);
                }
            } catch (err) {
                console.error("Erro ao cadastrar:", err);
                alert("Erro ao cadastrar. Tente novamente.");
            }
        });
    }

    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;

            try {
                const response = await fetch("/api/usuarios/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("token", data.token);
                    alert("Login realizado com sucesso!");
                    window.location.href = "/pages/home/home.html"; // Redirecionar para a página inicial
                } else {
                    const error = await response.json();
                    alert(`Erro: ${error.error}`);
                }
            } catch (err) {
                console.error("Erro ao fazer login:", err);
                alert("Erro ao fazer login. Tente novamente.");
            }
        });
    }
});
