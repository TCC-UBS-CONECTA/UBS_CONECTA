
const formulario = document.querySelector("form");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    const login = document.querySelector("#login").value;
    const senha = document.querySelector("#senha").value;

    try {
        const resposta = await fetch(
            "http://10.0.0.114:8080/api/usuarios/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ login, senha })
            }
        );

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
        alert("Não foi possível conectar ao servidor. Tente novamente.");
        console.error("Erro no login:", erro);
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
