const formulario = document.querySelector("form");

formulario.addEventListener("submit", async function(event){
   event.preventDefault(); 

   const login = document.querySelector("#login").value;
   const senha = document.querySelector("#senha").value;
   const confirmarSenha = document.querySelector("#confirmarSenha").value;

   if(senha !== confirmarSenha){
    alert("As senhas não coincidem, tente novamente.");
    return;}

    const resposta = await fetch("http://localhost:8080/api/usuarios",{
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify({login, senha})
    });    

    const dados = await resposta.json();
    
    if (resposta.ok){
        alert("Cadastro realizado com sucesso!");
        formulario.reset();
        window.location.href = "pg_paciente.html";
    }
});