
const API = "http://localhost:8080/api";

const UBS_PILOTO = 4;
const FUSO = "America/Fortaleza";

const formulario = document.getElementById("form-ficha");
const tipoConsultaSelect = document.getElementById("tipoConsulta");
const horarioInput = document.getElementById("horario");

const mesAno = document.getElementById("mesAno");
const diasCalendario = document.getElementById("diasCalendario");

const mesAnterior = document.getElementById("mesAnterior");
const proximoMes = document.getElementById("proximoMes");

const mensagemCalendario =
    document.getElementById("mensagemCalendario");

const areaTurnos = document.getElementById("areaTurnos");
const dataSelecionada = document.getElementById("dataSelecionada");
const listaHorarios = document.getElementById("listaHorarios");

const resumoAgendamento =
    document.getElementById("resumoAgendamento");

const botoesTurno =
    document.querySelectorAll(".botao-turno");

const botaoEnviar =
    formulario.querySelector('button[type="submit"]');

const botaoLimpar =
    formulario.querySelector('button[type="reset"]');

let pacienteAtual = null;
let horariosDisponiveis = [];

let diaSelecionado = null;
let turnoSelecionado = null;
let horarioSelecionado = null;

let carregando = false;
let enviando = false;

const meses = [
    "Janeiro", "Fevereiro", "Março",
    "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro",
    "Outubro", "Novembro", "Dezembro"
];




function obterDataAtual() {

    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: FUSO,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const obter = tipo =>
        partes.find(p => p.type === tipo).value;

    return {
        ano: Number(obter("year")),
        mes: Number(obter("month")),
        dia: Number(obter("day"))
    };
}

const hoje = obterDataAtual();

let mesAtual = hoje.mes;
let anoAtual = hoje.ano;




function home(pagina) {
    window.location.href = pagina;
}

function aj() {

    alert(
        "Selecione o tipo de consulta, " +
        "uma data disponível, o turno e o horário. " +
        "Informe o motivo e clique em Enviar."
    );
}

function dois(numero) {
    return String(numero).padStart(2, "0");
}

function montarDataISO(dia) {

    return `${anoAtual}-${dois(mesAtual)}-${dois(dia)}`;
}

function formatarData(data) {

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}

function obterHora(dataHora) {
    return dataHora.substring(11, 16);
}

function horarioFuturo(horario) {

    const data = new Date(
        horario.dataHora + "-03:00"
    );

    return data > new Date();
}

async function buscarDados(rota) {

    const resposta = await fetch(`${API}${rota}`, {
        cache: "no-store"
    });

    if (!resposta.ok) {

        throw new Error(
            `Erro ao carregar ${rota}`
        );
    }

    return resposta.json();
}


async function carregarTiposConsulta() {

    try {

        const tipos = await buscarDados(
            "/tipos-consultas"
        );

        tipoConsultaSelect.replaceChildren(
            new Option(
                "Selecione o tipo de consulta",
                ""
            )
        );

        tipos.forEach(tipo => {

            tipoConsultaSelect.add(
                new Option(tipo.nomeTipo, tipo.id)
            );
        });

    } catch (erro) {

        console.error(erro);

        alert(
            "Não foi possível carregar os tipos de consulta."
        );
    }
}



function preencherDadosPaciente() {

    if (!pacienteAtual) return;

    const campos = [
        "nome",
        "cpf",
        "rg",
        "dataNascimento",
        "telefone",
        "email"
    ];

    campos.forEach(campo => {

        const input = document.getElementById(campo);

        input.value = pacienteAtual[campo] ?? "";

        input.readOnly = true;
    });
}

async function carregarDadosPaciente() {

    const idUsuario =
        sessionStorage.getItem("idUsuario");

    if (!idUsuario) {

        alert("Sua sessão não foi encontrada.");

        window.location.href = "pg_login.html";

        return;
    }

    try {

        pacienteAtual = await buscarDados(
            `/pacientes/por-usuario?idUsuario=${encodeURIComponent(idUsuario)}`
        );

        preencherDadosPaciente();

    } catch (erro) {

        console.error(erro);

        alert(
            "Não foi possível carregar seu perfil de paciente."
        );
    }
}



function limparHorarioSelecionado() {

    horarioSelecionado = null;

    horarioInput.value = "";

    resumoAgendamento.textContent = "";

    document.querySelectorAll(".botao-horario")
        .forEach(botao => {

            botao.classList.remove("ativo");

            botao.setAttribute("aria-pressed", "false");
        });
}

function limparSelecao() {

    diaSelecionado = null;
    turnoSelecionado = null;

    limparHorarioSelecionado();

    areaTurnos.hidden = true;

    listaHorarios.replaceChildren();

    botoesTurno.forEach(botao => {

        botao.classList.remove("ativo");

        botao.setAttribute("aria-pressed", "false");
    });
}



function atualizarControles() {

    const atual = obterDataAtual();

    const periodoExibido =
        anoAtual * 12 + mesAtual;

    const periodoAtual =
        atual.ano * 12 + atual.mes;

    mesAnterior.disabled =
        carregando ||
        enviando ||
        periodoExibido <= periodoAtual;

    proximoMes.disabled =
        carregando ||
        enviando ||
        (anoAtual === 2100 && mesAtual === 12);

    botaoEnviar.disabled =
        carregando ||
        enviando ||
        !pacienteAtual;

    botaoLimpar.disabled = enviando;
}


async function carregarHorarios() {

    carregando = true;

    limparSelecao();

    horariosDisponiveis = [];

    atualizarControles();

    mesAno.textContent =
        `${meses[mesAtual - 1]}  de ${anoAtual}`;

    diasCalendario.replaceChildren();

    mensagemCalendario.textContent =
        "Carregando horários...";

    try {

        const horarios = await buscarDados(
            `/horarios/disponiveis?idUbs=${UBS_PILOTO}` +
            `&mes=${mesAtual}&ano=${anoAtual}`
        );

        horariosDisponiveis = horarios.filter(
            horario =>
                horario.disponivel === true &&
                Number(horario.idUbs) === UBS_PILOTO &&
                horarioFuturo(horario)
        );

        renderizarCalendario();

        mensagemCalendario.textContent =
            horariosDisponiveis.length > 0
                ? "Selecione uma data disponível."
                : "Nenhum horário disponível neste mês.";

    } catch (erro) {

        console.error(erro);

        renderizarCalendario();

        mensagemCalendario.textContent =
            "Não foi possível carregar os horários.";

    } finally {

        carregando = false;

        atualizarControles();
    }
}


function renderizarCalendario() {

    diasCalendario.replaceChildren();

    const primeiroDia = new Date(
        anoAtual,
        mesAtual - 1,
        1
    ).getDay();

    const quantidadeDias = new Date(
        anoAtual,
        mesAtual,
        0
    ).getDate();

    const datasDisponiveis = new Set(
        horariosDisponiveis.map(
            horario => horario.dataHora.substring(0, 10)
        )
    );


    for (let i = 0; i < primeiroDia; i++) {

        const espaco = document.createElement("span");

        diasCalendario.appendChild(espaco);
    }


    for (let dia = 1; dia <= quantidadeDias; dia++) {

        const data = montarDataISO(dia);

        const disponivel =
            datasDisponiveis.has(data);

        const botao = document.createElement("button");

        botao.type = "button";

        botao.textContent = dia;

        botao.className = "dia-calendario";

        botao.dataset.data = data;

        botao.setAttribute(
            "aria-label",
            formatarData(data)
        );

        botao.setAttribute(
            "aria-pressed",
            String(diaSelecionado === data)
        );

        if (disponivel) {

            botao.classList.add("dia-disponivel");

            botao.addEventListener("click", () => {

                if (!enviando) selecionarDia(data);
            });

        } else {

            botao.classList.add("dia-indisponivel");

            botao.disabled = true;
        }

        if (diaSelecionado === data) {

            botao.classList.add("selecionado");
        }

        diasCalendario.appendChild(botao);
    }
}



function mudarMes(direcao) {

    if (carregando || enviando) return;

    const novaData = new Date(
        anoAtual,
        mesAtual - 1 + direcao,
        1
    );

    const novoMes = novaData.getMonth() + 1;
    const novoAno = novaData.getFullYear();

    const atual = obterDataAtual();

    if (
        novoAno * 12 + novoMes <
        atual.ano * 12 + atual.mes
    ) return;

    if (novoAno > 2100) return;

    mesAtual = novoMes;

    anoAtual = novoAno;

    carregarHorarios();
}

mesAnterior.addEventListener("click", () => {

    mudarMes(-1);
});

proximoMes.addEventListener("click", () => {

    mudarMes(1);
});



function selecionarDia(data) {

    limparSelecao();

    diaSelecionado = data;

    renderizarCalendario();

    areaTurnos.hidden = false;

    dataSelecionada.textContent =
        `Data selecionada: ${formatarData(data)}`;

    const horariosDia = horariosDisponiveis.filter(
        horario =>
            horario.dataHora.startsWith(data) &&
            horarioFuturo(horario)
    );

    botoesTurno.forEach(botao => {

        const turno = botao.dataset.turno;

        botao.disabled = !horariosDia.some(
            horario => obterTurno(horario) === turno
        );
    });

    listaHorarios.textContent =
        "Selecione um turno.";
}



function obterTurno(horario) {

    const hora = Number(
        horario.dataHora.substring(11, 13)
    );

    return hora < 12 ? "MANHA" : "TARDE";
}



botoesTurno.forEach(botao => {

    botao.addEventListener("click", () => {

        if (!diaSelecionado || enviando) return;

        turnoSelecionado = botao.dataset.turno;

        limparHorarioSelecionado();

        botoesTurno.forEach(item => {

            const ativo = item === botao;

            item.classList.toggle("ativo", ativo);

            item.setAttribute(
                "aria-pressed",
                String(ativo)
            );
        });

        renderizarHorarios();
    });
});


function renderizarHorarios() {

    listaHorarios.replaceChildren();

    const horarios = horariosDisponiveis.filter(
        horario =>
            horario.dataHora.startsWith(diaSelecionado) &&
            obterTurno(horario) === turnoSelecionado &&
            horarioFuturo(horario)
    );

    if (horarios.length === 0) {

        listaHorarios.textContent =
            "Nenhum horário disponível neste turno.";

        return;
    }

    horarios.forEach(horario => {

        const botao = document.createElement("button");

        botao.type = "button";

        botao.className = "botao-horario";

        botao.textContent =
            obterHora(horario.dataHora);

        botao.setAttribute("aria-pressed", "false");

        botao.addEventListener("click", () => {

            if (!enviando) selecionarHorario(horario, botao);
        });

        listaHorarios.appendChild(botao);
    });
}



function selecionarHorario(horario, botao) {

    limparHorarioSelecionado();

    horarioSelecionado = horario;

    horarioInput.value = horario.id;

    botao.classList.add("ativo");

    botao.setAttribute("aria-pressed", "true");

    resumoAgendamento.textContent =
        `Consulta selecionada para ` +
        `${formatarData(diaSelecionado)} ` +
        `às ${obterHora(horario.dataHora)}.`;
}


formulario.addEventListener("submit", async evento => {

    evento.preventDefault();

    if (enviando || carregando) return;

    if (!formulario.reportValidity()) return;

    if (!pacienteAtual?.id) {

        alert("Paciente não identificado.");

        return;
    }

    if (!horarioSelecionado || !horarioInput.value) {

        alert("Selecione uma data, turno e horário.");

        return;
    }

    if (!horarioFuturo(horarioSelecionado)) {

        alert("Esse horário já passou.");

        await carregarHorarios();

        return;
    }

    const motivo = document
        .getElementById("comentario")
        .value.trim();

    if (!motivo) {

        alert("Informe o motivo da consulta.");

        document.getElementById("comentario").focus();

        return;
    }

    const consulta = {

        idPaciente: pacienteAtual.id,

        idUbs: UBS_PILOTO,

        idTipoConsulta: Number(
            tipoConsultaSelect.value
        ),

        idHorarios: Number(
            horarioInput.value
        ),

        motivo: motivo
    };

    enviando = true;

    atualizarControles();

    botaoEnviar.textContent = "Enviando...";

    try {

        const resposta = await fetch(
            `${API}/consultas`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(consulta)
            }
        );

        const resultado = await resposta.json()
            .catch(() => null);

        if (!resposta.ok) {

            if (resposta.status === 409) {

                await carregarHorarios();

                throw new Error(
                    "O horário não está mais disponível. " +
                    "Selecione outro horário."
                );
            }

            throw new Error(
                resultado?.erro ||
                resultado?.message ||
                "Não foi possível registrar a consulta."
            );
        }

        alert(
            "Solicitação de consulta enviada com sucesso!"
        );

        document.getElementById("comentario").value = "";

        tipoConsultaSelect.value = "";

        await carregarHorarios();

    } catch (erro) {

        console.error(erro);

        alert(erro.message);

    } finally {

        enviando = false;

        botaoEnviar.textContent = "Enviar";

        atualizarControles();
    }
});



formulario.addEventListener("reset", evento => {

    evento.preventDefault();

    if (enviando) return;

    tipoConsultaSelect.value = "";

    document.getElementById("comentario").value = "";

    limparSelecao();

    renderizarCalendario();

    preencherDadosPaciente();
});



async function iniciarFicha() {

    atualizarControles();

    await carregarDadosPaciente();

    if (!pacienteAtual) return;

    await Promise.all([

        carregarTiposConsulta(),

        carregarHorarios()

    ]);

    atualizarControles();
}

iniciarFicha();
