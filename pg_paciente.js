document.addEventListener("DOMContentLoaded", async () => {

    const idUsuario = sessionStorage.getItem("idUsuario");
    const tipoUsuario = sessionStorage.getItem("tipoUsuario");

    if (!idUsuario || tipoUsuario !== "PACIENTE") {
        window.location.href = "pg_login.html";
        return;
    }

    await carregarPaciente();

    document.getElementById("btn-atualizar-consultas")
        .addEventListener("click", carregarConsultas);

    document.getElementById("filtro-status")
        .addEventListener("change", carregarConsultas);

    await carregarConsultas();
});


async function carregarPaciente() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    const tipoUsuario = sessionStorage.getItem("tipoUsuario");

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
        const primeiroNome = paciente.nome?.trim().split(/\s+/)[0] || "Paciente";

        document.getElementById("saudacao-paciente").textContent =
            `Olá, ${primeiroNome}!`;

        console.log("Paciente encontrado:", paciente);


        document.querySelector("#nome-paciente").textContent =
            'Olá, ' + paciente.nome ?? "Paciente";


        document.querySelector("#perfil-nome").textContent =
            paciente.nome ?? "Não informado";

        document.querySelector("#perfil-telefone").textContent =
            paciente.telefone ?? "Não informado";

        document.querySelector("#perfil-email").textContent =
            paciente.email ?? "Não informado";

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

    return `${idade} anos`; //aqui o javascript retorna a idade do paciente e adiciona anos no final
}



async function carregarConsultas() {

    const idUsuario = sessionStorage.getItem("idUsuario");
    const lista = document.getElementById("lista-consultas");
    const mensagem = document.getElementById("mensagem-consultas");
    const filtro = document.getElementById("filtro-status");

    lista.replaceChildren();

    mensagem.textContent = "Carregando consultas...";

    try {

        const resposta = await fetch(
            `http://localhost:8080/api/consultas/paciente?idUsuario=${encodeURIComponent(idUsuario)}`
        );

        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const consultas = await resposta.json();

        atualizarIndicadores(consultas);

        const consultasFiltradas = consultas.filter(consulta => {

            const status = consulta.status?.trim().toLowerCase();

            return filtro.value === "todas" ||
                status === filtro.value;
        });

        consultasFiltradas.sort((a, b) =>
            new Date(b.dataAtendimento) -
            new Date(a.dataAtendimento)
        );

        if (consultasFiltradas.length === 0) {

            mensagem.textContent = "Nenhuma consulta encontrada.";

            return;
        }

        mensagem.textContent =
            `Total de consultas encontradas: ${consultasFiltradas.length}`;

        consultasFiltradas.forEach(consulta => {

            const item = document.createElement("div");

            item.className = "consulta-item";

            const status = consulta.status?.trim().toLowerCase();

            if (status === "solicitada") {
                item.classList.add("consulta-solicitada");
            } else if (status === "agendada") {
                item.classList.add("consulta-agendada");
            } else if (status === "recusada") {
                item.classList.add("consulta-recusada");
            }

            const titulo = document.createElement("h4");

            titulo.textContent = `Consulta #${consulta.id}`;

            item.appendChild(titulo);

            const dados = [
                ["Unidade", consulta.nomeUbs || "Unidade não identificada"],
                ["Data", formatarData(consulta.dataAtendimento)],
                ["Motivo", consulta.motivo || "Não informado"],
                ["Status", consulta.status || "Não informado"]
            ];

            dados.forEach(([campo, valor]) => {

                const p = document.createElement("p");

                const strong = document.createElement("strong");

                strong.textContent = `${campo}: `;

                const texto = document.createElement("span");

                texto.textContent = valor;

                p.append(strong, texto);

                item.appendChild(p);
            });

            lista.appendChild(item);
        });

    } catch (erro) {

        console.error("Erro ao carregar consultas:", erro);

        mensagem.textContent =
            "Não foi possível carregar as consultas.";

        document.getElementById("total-solicitadas").textContent = "—";
        document.getElementById("total-agendadas").textContent = "—";
        document.getElementById("total-recusadas").textContent = "—";
    }
}


function atualizarIndicadores(consultas) {

    const solicitadas = consultas.filter(consulta =>
        consulta.status?.trim().toLowerCase() === "solicitada"
    ).length;

    const agendadas = consultas.filter(consulta =>
        consulta.status?.trim().toLowerCase() === "agendada"
    ).length;

    const recusadas = consultas.filter(consulta =>
        consulta.status?.trim().toLowerCase() === "recusada"
    ).length;

    document.getElementById("total-solicitadas").textContent =
        solicitadas;

    document.getElementById("total-agendadas").textContent =
        agendadas;

    document.getElementById("total-recusadas").textContent =
        recusadas;
}


function formatarData(data) {

    if (!data) return "Não informada";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
        return "Data inválida";
    }

    const dia = dataFormatada.toLocaleDateString("pt-BR");

    const horario = dataFormatada.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    return `${dia} às ${horario}`;
}

