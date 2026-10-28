
document.addEventListener("DOMContentLoaded", carregarProfissional);

async function carregarProfissional() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    const tipoUsuario = sessionStorage.getItem("tipoUsuario");

    if (!idUsuario || tipoUsuario !== "PROFISSIONAL") {
        alert("Faça login para acessar sua área profissional.");
        window.location.href = "pg_login.html";
        return;
    }

    const url = `http://localhost:8080/api/profissionais/por-usuario?idUsuario=${encodeURIComponent(idUsuario)}`;

    console.log("ID do usuário:", idUsuario);
    console.log("Tipo da conta:", tipoUsuario);
    console.log("URL da requisição:", url);

    try {
        // Primeiro, fazemos a requisição
        const resposta = await fetch(url);

        // Depois, verificamos a resposta
        if (!resposta.ok) {
            const erroServidor = await resposta.text();

            console.error("Status HTTP:", resposta.status);
            console.error("Resposta do servidor:", erroServidor);

            throw new Error(`Falha ao carregar perfil: ${resposta.status}`);
        }

        // Se deu certo, lemos os dados
        const profissional = await resposta.json();

        console.log("Profissional encontrado:", profissional);

        document.querySelector("#nome-profissional").textContent =
            profissional.nome ?? "Profissional";

        document.querySelector("#perfil-nome").textContent =
            profissional.nome ?? "Não informado";

        document.querySelector("#perfil-cargo").textContent =
            profissional.cargo ?? "Não informado";

        document.querySelector("#perfil-especialidade").textContent =
            profissional.especialidade ?? "Não informada";

        document.querySelector("#perfil-conselho").textContent =
            profissional.conselhoProfissional ?? "Não informado";

        document.querySelector("#perfil-registro").textContent =
            profissional.registroProfissional ?? "Não informado";

        document.querySelector("#perfil-telefone").textContent =
            profissional.telefone ?? "Não informado";

        document.querySelector("#perfil-email").textContent =
            profissional.email ?? "Não informado";

        document.querySelector("#perfil-ubs").textContent =
            profissional.idUbs ?? "Não informada";

    } catch (erro) {
        console.error("Erro ao carregar profissional:", erro);

        alert(
            "Não foi possível carregar seus dados. " +
            "Confira o Console (F12)."
        );
    }
}
