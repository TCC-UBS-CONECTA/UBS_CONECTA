const formulario = document.querySelector("form");

formulario.addEventListener("submit", async function(event){
    event.preventDefault();

    const login = document.querySelector("#login").value;
    const senha = document.querySelector("#senha").value;

    const resposta = await fetch("http://localhost:8080/api/usuarios/login",{
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify({login, senha})
    });

    const dados = await resposta.text();
    
    if (resposta.ok){
        alert("Login realizado com sucesso!");
        formulario.reset();
        window.location.href = "pg_paciente.html";
    }

});