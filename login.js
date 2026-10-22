
const formulario = document.querySelector("form");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    const login = document.querySelector("#login").value;
    const senha = document.querySelector("#senha").value;
    const API = "http://localhost:8080";
    try {
        const resposta = await fetch(`${API}/api/usuarios/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ login, senha })
        });

        const dados = await resposta.json();

        console.log("Status:", resposta.status);
        console.log("Resposta do backend:", dados);

        if (resposta.ok) {
            alert(dados.mensagem);
            formulario.reset();

            if (dados.tipoUsuario === "PACIENTE") {
                window.location.href = "pg_paciente.html";
            } else if (dados.tipoUsuario === "PROFISSIONAL") {
                window.location.href = "pg_profissional.html";
            }
        } else {
            alert(dados.mensagem);
        }

    } catch (erro) {
        console.error("Erro no login:", erro);
        alert("Falha na comunicação com o servidor. Confira o Console (F12).");
    }
});

const campoSenha = document.querySelector("#senha");
const btn = document.querySelector("#btn-visualizar-senha");

btn.addEventListener("click", olharSenha);

function olharSenha() {
    if (campoSenha.type === "password") {
        campoSenha.type = "text";
        btn.innerHTML = '<i class="bxf bx-eye-slash"></i>';
    } else {
        campoSenha.type = "password";
        btn.innerHTML = '<i class="bxf bx-eye"></i>';
    }
}
