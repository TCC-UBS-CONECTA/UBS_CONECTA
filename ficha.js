
function lixo() {
    window.alert("Apagando tudo...");
}

function aj() {
    window.alert(
        "Preencha os campos corretamente e clique em enviar para solicitar sua consulta."
    );
}

function home(pagina) {
    window.location.href = pagina;
}

const API = "http://localhost:8080/api";

const estadoSelect = document.getElementById("estado");
const cidadeSelect = document.getElementById("cidade");
const ubsSelect = document.getElementById("ubs");
const tipoConsultaSelect = document.getElementById("tipoConsulta");
const horarioSelect = document.getElementById("horario");
const formulario = document.getElementById("form-ficha");

let horariosDisponiveis = [];
let pacienteAtual = null;

async function buscarDados(rota) {
    const resposta = await fetch(`${API}${rota}`);

    if (!resposta.ok) {
        throw new Error(`Erro ao carregar ${rota}`);
    }

    return resposta.json();
}

function preencherSelect(select, dados, valorId, texto, mensagem) {
    select.replaceChildren(new Option(mensagem, ""));

    dados.forEach(item => {
        select.add(new Option(texto(item), item[valorId]));
    });
}

async function carregarEstados() {
    try {
        const estados = await buscarDados("/estados");

        preencherSelect(
            estadoSelect,
            estados,
            "id",
            estado => estado.nomeEstado,
            "Selecione um estado"
        );
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar os estados.");
    }
}

async function carregarCidades(idEstado) {
    preencherSelect(
        cidadeSelect, [], "id",
        item => item.nomeCidade,
        "Selecione uma cidade"
    );

    preencherSelect(
        ubsSelect, [], "id",
        item => item.nomeUbs,
        "Selecione uma cidade primeiro"
    );

    if (!idEstado) return;

    try {
        const cidades = await buscarDados("/cidades");

        const filtradas = cidades.filter(
            cidade => String(cidade.idEstado) === String(idEstado)
        );

        preencherSelect(
            cidadeSelect,
            filtradas,
            "id",
            cidade => cidade.nomeCidade,
            "Selecione uma cidade"
        );
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar as cidades.");
    }
}

async function carregarUbs(idCidade) {
    preencherSelect(
        ubsSelect, [], "id",
        item => item.nomeUbs,
        "Selecione uma UBS"
    );

    if (!idCidade) {
        ubsSelect.options[0].textContent =
            "Selecione uma cidade primeiro";
        return;
    }

    try {
        const unidades = await buscarDados("/ubs");

        const filtradas = unidades.filter(
            ubs => String(ubs.idCidade) === String(idCidade)
        );

        preencherSelect(
            ubsSelect,
            filtradas,
            "id",
            ubs => `${ubs.nomeUbs} - ${ubs.enderecoUbs}`,
            "Selecione uma UBS"
        );
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar as UBS.");
    }
}

async function carregarTiposConsulta() {
    try {
        const tipos = await buscarDados("/tipos-consultas");

        preencherSelect(
            tipoConsultaSelect,
            tipos,
            "id",
            tipo => tipo.nomeTipo,
            "Selecione o tipo de consulta"
        );
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar os tipos de consulta.");
    }
}

async function carregarHorarios() {
    try {
        const horarios = await buscarDados("/horarios");
        const agora = new Date();

        horariosDisponiveis = horarios.filter(horario =>
            horario.disponivel === true &&
            new Date(horario.dataHora) > agora
        );

        preencherSelect(
            horarioSelect,
            horariosDisponiveis,
            "id",
            horario =>
                new Date(horario.dataHora).toLocaleString("pt-BR"),
            "Selecione um horário disponível"
        );

        if (horariosDisponiveis.length === 0) {
            horarioSelect.options[0].textContent =
                "Nenhum horário futuro disponível";
        }
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar os horários.");
    }
}

async function carregarDadosPaciente() {
    const idUsuario = sessionStorage.getItem("idUsuario");

    if (!idUsuario) {
        alert("Sua sessão não foi encontrada. Entre novamente.");
        window.location.href = "pg_login.html";
        return;
    }

    try {
        const resposta = await fetch(
            `${API}/pacientes/por-usuario?idUsuario=${encodeURIComponent(idUsuario)}`
        );

        if (!resposta.ok) {
            throw new Error("Perfil de paciente não encontrado.");
        }

        pacienteAtual = await resposta.json();

        document.getElementById("nome").value =
            pacienteAtual.nome ?? "";

        document.getElementById("cpf").value =
            pacienteAtual.cpf ?? "";

        document.getElementById("rg").value =
            pacienteAtual.rg ?? "";

        document.getElementById("dataNascimento").value =
            pacienteAtual.dataNascimento ?? "";

        document.getElementById("telefone").value =
            pacienteAtual.telefone ?? "";

        document.getElementById("email").value =
            pacienteAtual.email ?? "";

    } catch (erro) {
        console.error(erro);
        alert(
            "Não foi possível carregar seus dados. Confira se você completou o perfil de paciente."
        );
    }
}

function dataHoraLocalISO() {
    const data = new Date();
    const dois = numero => String(numero).padStart(2, "0");

    return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`;
}

estadoSelect.addEventListener("change", () => {
    carregarCidades(estadoSelect.value);
});

cidadeSelect.addEventListener("change", () => {
    carregarUbs(cidadeSelect.value);
});

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    if (!formulario.reportValidity()) return;

    if (!pacienteAtual || !pacienteAtual.id) {
        alert("Não foi possível identificar seu cadastro de paciente.");
        return;
    }

    const idHorario = Number(horarioSelect.value);

    const horarioSelecionado = horariosDisponiveis.find(
        horario => horario.id === idHorario
    );

    if (!horarioSelecionado) {
        alert("Selecione um horário disponível.");
        return;
    }

    if (new Date(horarioSelecionado.dataHora) <= new Date()) {
        alert("Esse horário já passou. Atualize a página e escolha outro.");
        await carregarHorarios();
        return;
    }

    const motivo = document.getElementById("comentario").value.trim();

    if (!motivo) {
        alert("Informe o motivo da consulta.");
        document.getElementById("comentario").focus();
        return;
    }

    const consulta = {
        idPaciente: pacienteAtual.id,
        idProfissional: null,
        idUbs: Number(ubsSelect.value),
        idTipoConsulta: Number(tipoConsultaSelect.value),
        idHorarios: idHorario,
        dataSolicitacao: dataHoraLocalISO(),
        dataAtendimento: horarioSelecionado.dataHora,
        motivo: motivo,
        status: "Solicitada"
    };

    const botaoEnviar = formulario.querySelector(
        'button[type="submit"]'
    );

    try {
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando...";

        const resposta = await fetch(`${API}/consultas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(consulta)
        });

        const resultado = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(
                resultado?.erro ||
                resultado?.message ||
                "O servidor não conseguiu registrar a solicitação."
            );
        }

        alert("Solicitação de consulta enviada com sucesso!");

        await carregarHorarios();

    } catch (erro) {
        console.error("Erro ao enviar ficha:", erro);

        alert(
            "Não foi possível enviar sua ficha: " + erro.message
        );
    } finally {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = "Enviar";
    }
});

async function iniciarFicha() {
    await Promise.all([
        carregarEstados(),
        carregarTiposConsulta(),
        carregarHorarios(),
        carregarDadosPaciente()
    ]);
}

iniciarFicha();
