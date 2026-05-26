/**
 * Guardião da Rede — Controlador da Triagem (5 passos)
 * 
 * Gerencia o questionário Akinator de 5 etapas, as falas da Capi,
 * a persistência comunitária e a classificação do caso.
 */

document.addEventListener("DOMContentLoaded", () => {
  const relatoTitulo = localStorage.getItem("guardiao_relato_titulo");
  const relatoDescricao = localStorage.getItem("guardiao_relato_descricao");

  if (!relatoTitulo || !relatoDescricao) {
    alert("Por favor, preencha o formulário de relato primeiro.");
    window.location.href = "relato.html";
    return;
  }

  // Falas da Capi por etapa (total 5)
  const CAPI_FALAS = {
    1: "Para começar a triagem do caso, me diga qual é a sua faixa etária! Alguns golpes são direcionados especificamente para faixas etárias de maior vulnerabilidade.",
    2: "A sua região geográfica no Brasil ajuda a identificar se há quadrilhas locais atuando com golpes específicos no momento.",
    3: "O seu nível de familiaridade digital é fundamental! Isso me ajuda a adaptar as dicas de segurança finais de um jeito simples e fácil de entender.",
    4: "Por favor, me conte por qual canal o golpista usou para te procurar! O canal inicial (como WhatsApp ou Ligação) é o maior segredo para desvendar a fraude.",
    5: "Para terminar, me conte se você disponibiliza ou possui dados públicos online (como CNPJ de MEI, sociedade em empresas ou contatos de influenciador). Golpistas usam essas informações públicas para planejar golpes específicos!"
  };

  // Estado da triagem
  let currentStep = 1;
  const totalSteps = 5;
  const triagemDados = {
    idade: "",
    regiao: "",
    familiaridade: "",
    canal: "",
    exposicaoDados: ""
  };

  // Elementos do DOM
  const steps = [
    document.getElementById("step-1"),
    document.getElementById("step-2"),
    document.getElementById("step-3"),
    document.getElementById("step-4"),
    document.getElementById("step-5")
  ];
  
  const progressBar = document.getElementById("progress-bar");
  const progressFill = document.getElementById("progress-fill");
  const btnVoltar = document.getElementById("btn-triage-voltar");
  const stepIndicator = document.getElementById("step-indicator");
  const triageCard = document.getElementById("triage-card");
  const triageLoader = document.getElementById("triage-loader");
  const capiText = document.getElementById("capi-triage-text");
  const wizardStatus = document.getElementById("wizard-status");
  const triageNavActions = document.getElementById("triage-nav-actions");

  // Adiciona evento aos botões de opções
  const optionButtons = document.querySelectorAll(".triage-option-btn");
  optionButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      const btn = e.target.closest(".triage-option-btn");
      const field = btn.getAttribute("data-field");
      const value = btn.getAttribute("data-value");

      triagemDados[field] = value;

      if (currentStep < totalSteps) {
        avancarPasso();
      } else {
        concluirTriagem();
      }
    });
  });

  // Botão Voltar
  btnVoltar.addEventListener("click", () => {
    if (currentStep > 1) {
      retrocederPasso();
    }
  });

  function avancarPasso() {
    steps[currentStep - 1].classList.remove("active");
    steps[currentStep - 1].setAttribute("aria-hidden", "true");

    currentStep++;

    steps[currentStep - 1].classList.add("active");
    steps[currentStep - 1].setAttribute("aria-hidden", "false");

    updateUI();
  }

  function retrocederPasso() {
    steps[currentStep - 1].classList.remove("active");
    steps[currentStep - 1].setAttribute("aria-hidden", "true");

    currentStep--;

    steps[currentStep - 1].classList.add("active");
    steps[currentStep - 1].setAttribute("aria-hidden", "false");

    updateUI();
  }

  function updateUI() {
    btnVoltar.disabled = currentStep === 1;

    const porcentagem = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${porcentagem}%`;
    progressBar.setAttribute("aria-valuenow", porcentagem);

    stepIndicator.textContent = `Pergunta ${currentStep} de ${totalSteps}`;
    wizardStatus.textContent = `Passo ${currentStep}/${totalSteps}`;

    if (capiText && CAPI_FALAS[currentStep]) {
      capiText.textContent = CAPI_FALAS[currentStep];
    }
  }

  async function concluirTriagem() {
    triageCard.style.display = "none";
    progressBar.style.display = "none";
    triageNavActions.style.display = "none";
    triageLoader.style.display = "flex";
    wizardStatus.textContent = "Processando...";

    if (capiText) {
      capiText.textContent = "Aguarde um instante! Estou abrindo meus arquivos confidenciais de segurança para analisar as evidências do caso...";
    }

    try {
      const analiseResultado = await analisarRelatoComIA(
        relatoTitulo,
        relatoDescricao,
        triagemDados
      );

      localStorage.setItem("guardiao_resultado_analise", JSON.stringify(analiseResultado));
      localStorage.setItem("guardiao_triagem_respostas", JSON.stringify(triagemDados));

      const relatoImagem = localStorage.getItem("guardiao_relato_imagem") || "";
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      const novoDossie = {
        id: "rep-" + Date.now(),
        data: dateStr,
        titulo: relatoTitulo,
        descricao: relatoDescricao,
        imagem: relatoImagem,
        triagem: triagemDados,
        analise: analiseResultado,
        comentarios: []
      };

      // Carrega relatos da base comunitária
      let dbRaw = localStorage.getItem("guardiao_reports_database");
      let reportsDB = dbRaw ? JSON.parse(dbRaw) : [];

      reportsDB.unshift(novoDossie);
      localStorage.setItem("guardiao_reports_database", JSON.stringify(reportsDB));

      setTimeout(() => {
        window.location.href = "resultado.html";
      }, 1800);

    } catch (err) {
      console.error("Erro durante processamento da triagem:", err);
      
      const localResult = analisarRelatoLocal(relatoTitulo, relatoDescricao, triagemDados);
      localStorage.setItem("guardiao_resultado_analise", JSON.stringify(localResult));
      
      const relatoImagem = localStorage.getItem("guardiao_relato_imagem") || "";
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      const novoDossie = {
        id: "rep-" + Date.now(),
        data: dateStr,
        titulo: relatoTitulo,
        descricao: relatoDescricao,
        imagem: relatoImagem,
        triagem: triagemDados,
        analise: localResult,
        comentarios: []
      };

      let dbRaw = localStorage.getItem("guardiao_reports_database");
      let reportsDB = dbRaw ? JSON.parse(dbRaw) : [];
      reportsDB.unshift(novoDossie);
      localStorage.setItem("guardiao_reports_database", JSON.stringify(reportsDB));

      window.location.href = "resultado.html";
    }
  }
});
