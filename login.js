const formulario = document.querySelector("form");

formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const login = document.querySelector("#login").value;
    const senha = document.querySelector("#senha").value;

    try {
        const resposta = await fetch("http://localhost:8080/api/usuarios/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ login, senha })
        });

        const dados = await resposta.text();

        if (resposta.ok) {
            alert("Login realizado com sucesso!");
            formulario.reset();
            window.location.href = "pg_paciente.html";
        } else {
            alert(dados);
        }
    } catch (erro) {
        alert("Não foi possível conectar ao servidor. Tente novamente.");
        console.error("Erro no login:", erro);
    }

});


const campoSenha = document.querySelector('#senha');
const btn = document.querySelector('#btn-visualizar-senha');

btn.addEventListener('click', olharSenha);

function olharSenha() {
    if (campoSenha.type === 'password') {
        campoSenha.type = 'text';
        btn.innerHTML = '<i class="bxf bx-eye-slash"></i>';
    } else {
        campoSenha.type = 'password';
        btn.innerHTML = '<i class="bxf bx-eye"></i>';
    }
};