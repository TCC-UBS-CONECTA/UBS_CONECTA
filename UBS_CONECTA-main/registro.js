const formulario = document.querySelector("form");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!tipoSelecionado) {
        alert("Selecione Paciente ou Profissional.");
        return;
    }

    const login = document.querySelector("#login").value;
    const senha = document.querySelector("#senha").value;
    const confirmarSenha = document.querySelector("#confirmarSenha").value;

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem, tente novamente.");
        return;
    }
    
const API = "http://localhost:8080";

try {
    const resposta = await fetch(`${API}/api/usuarios`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            login,
            senha,
            tipoUsuario: tipoSelecionado
        })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
        alert("Cadastro realizado com sucesso!");

        window.location.href =
            "completar_perfil.html?idUsuario=" +
            encodeURIComponent(dados.id) +
            "&tipo=" +
            encodeURIComponent(tipoSelecionado);
    } else {
        alert(
            dados.erro ||
            dados.mensagem ||
            "Erro ao realizar cadastro."
        );
    }

} catch (erro) {
    console.error("Erro no cadastro:", erro);
    alert("Não foi possível conectar ao servidor.");
}

});


function configurarOlho(idCampo, idBotao) {
    const campoSenha = document.querySelector(idCampo);
    const btn = document.querySelector(idBotao);

    btn.addEventListener('click', function () {
        if (campoSenha.type === 'password') {
            campoSenha.type = 'text';
            btn.innerHTML = '<i class="bxf bx-eye-slash"></i>';
        } else {
            campoSenha.type = 'password';
            btn.innerHTML = '<i class="bxf bx-eye"></i>';
        }
    });
}

configurarOlho('#senha', '#btn-visualizar-senha');
configurarOlho('#confirmarSenha', '#btn-confirmar-senha');



let tipoSelecionado = "";

const botoesUsuario = document.querySelectorAll(".tipo-usuario button");

botoesUsuario.forEach(function (botao) {
    botao.addEventListener("click", function () {
        tipoSelecionado = botao.value;

        botoesUsuario.forEach(function (outroBotao) {
            outroBotao.classList.remove("ativo");
        });

        botao.classList.add("ativo");

        console.log("Tipo selecionado:", tipoSelecionado);
    });
});
