let pacientesDaUbs = [];
document.addEventListener("DOMContentLoaded", async () => {//espera o html para executar o script
    await carregarProfissional();//chama a função para carregar o profissional
    const botaoAtualizar = document.getElementById("btn-atualizar-consultas");//pega o botão de atualizar consultas do html
    const filtroStatus = document.getElementById("filtro-status");

    if (filtroStatus) {
        filtroStatus.addEventListener("change", carregarConsultas);
    }

    if (botaoAtualizar) {
        botaoAtualizar.addEventListener("click", carregarConsultas);
    }
    await carregarConsultas();
});

async function carregarProfissional() {//funcao para carregar o profissional
    const idUsuario = sessionStorage.getItem("idUsuario");//pega o id do usuario logado
    const tipoUsuario = sessionStorage.getItem("tipoUsuario");//pega o tipo do usuario logado

    if (!idUsuario || tipoUsuario !== "PROFISSIONAL") {//verifica se o id do usuario existe e se o tipo do usuario é profissional
        alert("Faça login para acessar sua área profissional.");//mostra um alerta para o usuario caso ele não esteja logado ou não seja profissional
        window.location.href = "pg_login.html";//e retorna para a pagina de login
        return;
    }

    const url = `http://localhost:8080/api/profissionais/por-usuario?idUsuario=${encodeURIComponent(idUsuario)}`;//cria a url para fazer a requisição para o backend para pegar os dados do profissional

    console.log("ID do usuário:", idUsuario);
    console.log("Tipo da conta:", tipoUsuario);
    console.log("URL da requisição:", url);

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            const erroServidor = await resposta.text();

            console.error("Status HTTP:", resposta.status);
            console.error("Resposta do servidor:", erroServidor);

            throw new Error(`Falha ao carregar perfil: ${resposta.status}`);
        }

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

async function carregarConsultas() { // funcao para carregar as consultas do profissional

    const idUsuario = sessionStorage.getItem("idUsuario"); //pega o id do usuario logado

    const lista = document.getElementById("lista-consultas");//pega a lista de consultas do html
    const mensagem = document.getElementById("mensagem-consultas");//pega a mensagem de consultas do html

    if (!lista || !mensagem || !idUsuario) {//verifica se a lista, mensagem e idUsuario existem
        return;
    }

    lista.replaceChildren();//limpa a lista de consultas
    mensagem.textContent = "Carregando consultas...";

    try {
        const url = `http://localhost:8080/api/consultas/ubs?idUsuario=${encodeURIComponent(idUsuario)}`;

        const resposta = await fetch(url);//faz a requisição para o backend para pegar as consultas do profissional

        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);//verifica se a resposta do backend foi ok
        }

        const consultas = await resposta.json();//pega a resposta do backend e transforma em json
        atualizarIndicadores(consultas);//busca a função para atualizar os indicadores de consultas
        atualizarAgenda(consultas);//busca a função para atualizar a agenda do profissional
        atualizarPacientes(consultas);//busca a função para atualizar a lista de pacientes do profissional

        const filtro = document.getElementById("filtro-status");

        const statusSelecionado = filtro?.value || "todas";

        const consultasFiltradas = consultas.filter(consulta => {
            if (statusSelecionado === "todas") {
                return true;
            }

            return consulta.status?.trim().toLowerCase() === statusSelecionado;
        });

        mensagem.textContent = "";

        if (consultasFiltradas.length === 0) {//verifica se a lista de consultas está vazia
            mensagem.textContent = "Nenhuma consulta encontrada.";
            return;
        }

        consultasFiltradas.forEach(consulta => {//ele percorre  a lista de consultas e cria os elementos html para cada consulta

            const item = document.createElement("div");//cria um elemento div para cada consulta
            item.className = "consulta-item";//adciona consulta-item como classe para o elemento div

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
                ["Paciente", consulta.nomePaciente ||`#${consulta.idPaciente}`],
                ["Data", formatarData(consulta.dataAtendimento)],
                ["Motivo", consulta.motivo || "Não informado"],
                ["Status", consulta.status || "Não informado"]
            ];

            dados.forEach(([campo, valor]) => {

                const p = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = `${campo}: `;
                p.appendChild(strong);

                const texto = document.createElement("span");
                texto.textContent = valor;

                if (campo === "Status") {
                    const status = String(valor).trim().toLowerCase();

                    if (status === "solicitada") {
                        texto.classList.add("status-solicitada");
                    } else if (status === "agendada") {
                        texto.classList.add("status-agendada");
                    } else if (status === "recusada") {
                        texto.classList.add("status-recusada");
                    }
                }

                p.appendChild(texto);
                item.appendChild(p);
            });

            const dataConsulta = consulta.dataAtendimento
                ? new Date(consulta.dataAtendimento)
                : null;

            const consultaFutura = dataConsulta
                && !Number.isNaN(dataConsulta.getTime())
                && dataConsulta > new Date();

            if (
                consulta.status?.trim().toLowerCase() === "solicitada"
                && consultaFutura
            ) {

                const acoes = document.createElement("div");
                acoes.className = "consulta-acoes";

                const confirmar = document.createElement("button");
                confirmar.className = "btn-confirmar";
                confirmar.textContent = "Confirmar";

                const recusar = document.createElement("button");
                recusar.className = "btn-recusar";
                recusar.textContent = "Recusar";

                confirmar.onclick = () =>
                    alterarConsulta(consulta.id, "confirmar");

                recusar.onclick = () =>
                    alterarConsulta(consulta.id, "recusar");

                acoes.append(confirmar, recusar);
                item.appendChild(acoes);
            }

            lista.appendChild(item);
        });

    } catch (erro) {//verifica se houve algum erro na requisição
        console.error("Erro ao carregar consultas:", erro);
        mensagem.textContent = "Não foi possível carregar as consultas.";
    }
}

async function alterarConsulta(idConsulta, acao) {//altera o status da consulta para "confirmada" ou "recusada"

    const idUsuario = sessionStorage.getItem("idUsuario");//pega o id do usuario logado

    if (!["confirmar", "recusar"].includes(acao)) {//verifica se a ação é "confirmar" ou "recusar"
        return;
    }

    if (!confirm(`Deseja ${acao} a consulta #${idConsulta}?`)) {//verifica se o usuario confirma a ação
        return;
    }

    try {

        const url = `http://localhost:8080/api/consultas/${idConsulta}/${acao}?idUsuario=${encodeURIComponent(idUsuario)}`;

        const resposta = await fetch(url, {//pede para o backend alterar o status da consulta
            method: "PUT"
        });

        if (!resposta.ok) {
            const erroServidor = await resposta.text();//pega a resposta do backend caso haja algum erro
            console.error("Resposta do servidor:", erroServidor);//mostra no console a resposta do backend

            throw new Error(`Erro HTTP ${resposta.status}`);//verifica se a resposta do backend foi ok
        }

        alert("Consulta atualizada com sucesso!");

        await carregarConsultas();//chama a função para carregar as consultas novamente para atualizar a lista de consultas

    } catch (erro) {
        console.error("Erro ao alterar consulta:", erro);

        alert("Não foi possível atualizar a consulta.");
        await carregarConsultas();
    }
}


function atualizarIndicadores(consultas) {

    const hoje = new Date();

    const totalSolicitadas = consultas.filter(consulta =>
        consulta.status?.trim().toLowerCase() === "solicitada"
    ).length;

    const totalAgendadas = consultas.filter(consulta =>
        consulta.status?.trim().toLowerCase() === "agendada"
    ).length;

    const consultasHoje = consultas.filter(consulta => {

        if (!consulta.dataAtendimento) return false;

        const dataConsulta = new Date(consulta.dataAtendimento);

        if (Number.isNaN(dataConsulta.getTime())) return false;

        const mesmoDia =
            dataConsulta.getDate() === hoje.getDate() &&
            dataConsulta.getMonth() === hoje.getMonth() &&
            dataConsulta.getFullYear() === hoje.getFullYear();

        const agendada =
            consulta.status?.trim().toLowerCase() === "agendada";

        return mesmoDia && agendada;
    }).length;

    const elementoSolicitadas = document.getElementById("total-solicitadas");
    const elementoAgendadas = document.getElementById("total-agendadas");
    const elementoHoje = document.getElementById("consultas-hoje");

    console.log("Elemento solicitadas:", elementoSolicitadas);
    console.log("Elemento agendadas:", elementoAgendadas);
    console.log("Elemento hoje:", elementoHoje);

    if (elementoSolicitadas) {
        elementoSolicitadas.textContent = totalSolicitadas;
    }

    if (elementoAgendadas) {
        elementoAgendadas.textContent = totalAgendadas;
    }

    if (elementoHoje) {
        elementoHoje.textContent = consultasHoje;
    }
}


function atualizarAgenda(consultas) {//aqui atualiza a agenda do profissional com as consultas agendadas para o dia atual

    const lista = document.getElementById("lista-agenda");
    const mensagem = document.getElementById("mensagem-agenda");

    if (!lista || !mensagem) return;//verifica se a lista e a mensagem existem

    lista.replaceChildren();

    const hoje = new Date();

    
    const agendaHoje = consultas.filter(consulta => {

        if (!consulta.dataAtendimento) return false;

        const data = new Date(consulta.dataAtendimento);

        if (Number.isNaN(data.getTime())) return false;

        const mesmoDia =
            data.toDateString() === hoje.toDateString();

        const agendada =
            consulta.status?.trim().toLowerCase() === "agendada";

        return mesmoDia && agendada;
    });

    
    agendaHoje.sort((a, b) =>//ordena a lista de consultas agendadas para o dia atual pelo horário de atendimento
        new Date(a.dataAtendimento) -
        new Date(b.dataAtendimento)
    );

    
    if (agendaHoje.length === 0) {

        mensagem.textContent =
            "Nenhuma consulta agendada para hoje.";

        return;
    }

    mensagem.textContent =
        `Total de atendimentos: ${agendaHoje.length}`;//mostra a quantidade de consultas agendadas para o dia atual


    agendaHoje.forEach(consulta => {

        const item = document.createElement("div");
        item.className = "agenda-item";

        const horario = new Date(
            consulta.dataAtendimento
        ).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const p = document.createElement("p");

        const strong = document.createElement("strong");
        strong.textContent = horario;

        p.appendChild(strong);

        p.append(` - ${consulta.nomePaciente || `Paciente #${consulta.idPaciente}`}`);

        item.appendChild(p);

        lista.appendChild(item);
    });
}



function formatarData(data) {//aqui formata a data para o formato "dd/mm/yyyy às hh:mm"

    if (!data) return "Não informada";//verifica se a data existe

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {//verifica se a data é válida
        return "Data inválida";
    }

    const dia = dataFormatada.toLocaleDateString("pt-BR");//tranforma a data para o formato "dd/mm/yyyy"

    const horario = dataFormatada.toLocaleTimeString("pt-BR", {//tranforma a hora para o formato "hh:mm"
        hour: "2-digit",
        minute: "2-digit"
    });

    return `${dia} às ${horario}`;
}


function atualizarPacientes(consultas) {//aqui atualiza a lista de pacientes do profissional com as consultas agendadas para o dia atual

    const pacientes = new Map();

    consultas.forEach(consulta => {

        const id = consulta.idPaciente;

        if (id == null) return;

        
        if (!pacientes.has(id)) {//verifica se o paciente já está na lista de pacientes

            pacientes.set(id, {
                id: id,
                nome: consulta.nomePaciente || `Paciente #${id}`,
                totalConsultas: 0
            });
        }

        
        pacientes.get(id).totalConsultas++;//adiciona 1 ao total de consultas do paciente
    });

  
    pacientesDaUbs = Array.from(pacientes.values());//tranforma a lista de pacientes em um array

    
    pacientesDaUbs.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
    );

    exibirPacientes();
}


function exibirPacientes() {

    const lista = document.getElementById("lista-pacientes");
    const mensagem = document.getElementById("mensagem-pacientes");
    const pesquisa = document.getElementById("pesquisa-paciente");

    if (!lista || !mensagem || !pesquisa) return;

    lista.replaceChildren();

    // Remove acentos e diferenciações entre maiúsculas e minúsculas
    const normalizar = texto => texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const termo = normalizar(pesquisa.value);

    const pacientesFiltrados = pacientesDaUbs.filter(paciente =>
        normalizar(paciente.nome).includes(termo)
    );

    if (pacientesFiltrados.length === 0) {

        mensagem.textContent = "Nenhum paciente encontrado.";

        return;
    }

    mensagem.textContent =
        `Exibindo ${pacientesFiltrados.length} de ${pacientesDaUbs.length} paciente(s).`;

    pacientesFiltrados.forEach(paciente => {

        const item = document.createElement("div");
        item.className = "paciente-item";

        const icone = document.createElement("div");
        icone.className = "paciente-icone";

        const simbolo = document.createElement("i");
        simbolo.className = "fa-solid fa-user";

        icone.appendChild(simbolo);

        const info = document.createElement("div");
        info.className = "paciente-info";

        const nome = document.createElement("h4");
        nome.textContent = paciente.nome;

        const detalhes = document.createElement("p");

        detalhes.textContent =
            `ID: ${paciente.id} | ${paciente.totalConsultas} consulta(s)`;//mostra o id do paciente e a quantidade de consultas que ele tem

        info.append(nome, detalhes);

        item.append(icone, info);

        lista.appendChild(item);
    });
}

