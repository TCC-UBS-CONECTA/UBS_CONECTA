
document.addEventListener("DOMContentLoaded", carregarPaciente);

async function carregarPaciente() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    const tipoUsuario = sessionStorage.getItem("tipoUsuario");

    // Confere se o usuário está logado como paciente
    if (!idUsuario || tipoUsuario !== "PACIENTE") {
        alert("Faça login para acessar sua área de paciente.");
        window.location.href = "pg_login.html";
        return;
    }

    const url =
        `http://localhost:8080/api/pacientes/por-usuario?idUsuario=${encodeURIComponent(idUsuario)}`;

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro ao buscar paciente: ${resposta.status}`);
        }

        const paciente = await resposta.json();

        console.log("Paciente encontrado:", paciente);

        // Saudação
        document.querySelector("#nome-paciente").textContent =
            paciente.nome ?? "Paciente";

        // Informações do perfil
        document.querySelector("#perfil-nome").textContent =
            paciente.nome ?? "Não informado";

        document.querySelector("#perfil-telefone").textContent =
            paciente.telefone ?? "Não informado";

        document.querySelector("#perfil-email").textContent =
            paciente.email ?? "Não informado";

        // Calcula a idade usando a data de nascimento
        document.querySelector("#perfil-idade").textContent =
            calcularIdade(paciente.dataNascimento);

    } catch (erro) {
        console.error("Erro ao carregar paciente:", erro);

        document.querySelector("#nome-paciente").textContent = "Paciente";
        document.querySelector("#perfil-nome").textContent = "Não foi possível carregar";
        document.querySelector("#perfil-idade").textContent = "Não disponível";
        document.querySelector("#perfil-telefone").textContent = "Não disponível";
        document.querySelector("#perfil-email").textContent = "Não disponível";

        alert("Não foi possível carregar seus dados. Confira o Console (F12).");
    }
}

function calcularIdade(dataNascimento) {
    if (!dataNascimento) {
        return "Não informada";
    }

    const nascimento = new Date(`${dataNascimento}T00:00:00`);
    const hoje = new Date();

    if (Number.isNaN(nascimento.getTime()) || nascimento > hoje) {
        return "Data inválida";
    }

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const aindaNaoFezAniversario =
        hoje.getMonth() < nascimento.getMonth() ||
        (
            hoje.getMonth() === nascimento.getMonth() &&
            hoje.getDate() < nascimento.getDate()
        );

    if (aindaNaoFezAniversario) {
        idade--;
    }

    return `${idade} anos`;
}
