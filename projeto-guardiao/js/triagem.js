/**
 * CapiSafe — Controlador da Triagem (5 passos)
 * 
 * Gerencia o questionário Akinator de 5 etapas, as falas da Capi,
 * a persistência comunitária e a classificação do caso.
 */

document.addEventListener("DOMContentLoaded", () => {
  const relatoTitulo = localStorage.getItem("guardiao_relato_titulo");
  const relatoDescricao = localStorage.getItem("guardiao_relato_descricao");

  if (!relatoTitulo || !relatoDescricao) {
    showToast("Por favor, preencha o relato de suspeita primeiro.", "error");
    setTimeout(() => {
      window.location.href = "relato.html";
    }, 1500);
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

      // Limpa seleções anteriores do mesmo passo
      const currentStepEl = steps[currentStep - 1];
      currentStepEl.querySelectorAll(".triage-option-btn").forEach(b => {
        b.style.background = "";
        b.style.color = "";
      });

      // Aplica cor de clique instantânea e efeito 2D pressionado
      btn.style.background = "var(--accent-teal)";
      btn.style.color = "#000";
      btn.style.borderColor = "var(--color-border)";
      btn.style.transform = "scale(0.95)";
      
      // Adiciona shimmer temporário na barra de progresso
      progressFill.classList.add("wizard-shimmer");

      triagemDados[field] = value;

      setTimeout(() => {
        btn.style.transform = "";
        progressFill.classList.remove("wizard-shimmer");
        if (currentStep < totalSteps) {
          avancarPasso();
        } else {
          concluirTriagem();
        }
      }, 350);
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
      capiText.style.opacity = 0;
      capiText.style.transition = "opacity 0.15s ease";
      setTimeout(() => {
        capiText.textContent = CAPI_FALAS[currentStep];
        capiText.style.opacity = 1;
      }, 150);
    }
  }

  // Mensagens rotativas do loader
  const loaderMessages = [
    "🔍 Cruzando padrões de golpes conhecidos...",
    "🧠 Consultando base de dados comunitária...",
    "⚡ Processando fatores de riscos demográficos...",
    "📡 Executando motores neurais de segurança...",
    "🤖 Formatando laudo e recomendações personalizadas..."
  ];
  let msgIdx = 0;
  let msgInterval = null;

  async function concluirTriagem() {
    triageCard.style.display = "none";
    progressBar.style.display = "none";
    triageNavActions.style.display = "none";
    triageLoader.style.display = "flex";
    wizardStatus.textContent = "Processando...";

    const loaderMsgEl = triageLoader.querySelector("p");
    if (loaderMsgEl) {
      loaderMsgEl.textContent = loaderMessages[0];
      msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % loaderMessages.length;
        loaderMsgEl.style.opacity = 0;
        loaderMsgEl.style.transition = "opacity 0.2s ease";
        setTimeout(() => {
          loaderMsgEl.textContent = loaderMessages[msgIdx];
          loaderMsgEl.style.opacity = 1;
        }, 200);
      }, 1400);
    }

    if (capiText) {
      capiText.textContent = "Aguarde um instante! Estou analisando os dados semânticos do seu relato...";
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

      clearInterval(msgInterval);
      setTimeout(() => {
        window.location.href = "resultado.html";
      }, 1000);

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

      clearInterval(msgInterval);
      window.location.href = "resultado.html";
    }
  }
});
