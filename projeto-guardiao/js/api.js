/**
 * Guardião da Rede — Integração com API do Google Gemini
 * 
 * Este arquivo gerencia a chave de API salva no localStorage, a interface do modal
 * de configurações e a chamada da IA (Gemini 1.5 Flash).
 */

// Chave do localStorage
const GEMINI_STORAGE_KEY = "guardiao_gemini_api_key";

// ==============================================================================
// SISTEMA DE NOTIFICAÇÕES TOAST (SUBSTITUTO PARA ALERTS NATIVOS)
// ==============================================================================
function showToast(mensagem, tipo = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  
  let icon = 'ℹ️';
  if (tipo === 'success') icon = '✅';
  else if (tipo === 'error') icon = '❌';
  else if (tipo === 'warning') icon = '⚠️';

  toast.innerHTML = `<span style="font-size: 16px;">${icon}</span> <span>${mensagem}</span>`;
  container.appendChild(toast);

  // Força refluxo
  toast.offsetHeight;

  toast.classList.add('show');

  // Remove o toast após 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3000);
}


// Elementos do Modal de Configurações
const settingsToggle = document.getElementById("btn-settings-toggle");
const settingsModal = document.getElementById("settings-modal");
const closeSettings = document.getElementById("btn-close-settings");
const keyInput = document.getElementById("gemini-key-input");
const saveSettings = document.getElementById("btn-save-settings");
const clearSettings = document.getElementById("btn-clear-settings");

// Inicializa Eventos do Modal se os elementos existirem na página
if (settingsToggle && settingsModal) {
  // Abre o modal
  settingsToggle.addEventListener("click", () => {
    const savedKey = localStorage.getItem(GEMINI_STORAGE_KEY) || "";
    keyInput.value = savedKey;
    settingsModal.classList.add("active");
    settingsModal.setAttribute("aria-hidden", "false");
  });

  // Fecha o modal ao clicar no fechar
  closeSettings.addEventListener("click", closeModal);

  // Fecha o modal ao clicar fora dele
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      closeModal();
    }
  });

  // Salva a chave
  saveSettings.addEventListener("click", () => {
    const key = keyInput.value.trim();
    if (key) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key);
      showToast("Chave de API salva com sucesso localmente!", "success");
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
      showToast("Chave removida. O site usará o classificador local offline.", "warning");
    }
    closeModal();
  });

  // Limpa a chave
  clearSettings.addEventListener("click", () => {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
    keyInput.value = "";
    showToast("Chave de API removida do seu navegador.", "info");
    closeModal();
  });
}

function closeModal() {
  settingsModal.classList.remove("active");
  settingsModal.setAttribute("aria-hidden", "true");
}

/**
 * Função unificada para analisar o relato. Tenta usar o Gemini, senão cai
 * no classificador local offline.
 * 
 * @param {string} titulo Título do relato
 * @param {string} descricao Descrição detalhada
 * @param {Object} triagem Dados de triagem
 * @returns {Promise<Object>} Promessa contendo os dados de análise do golpe
 */
async function analisarRelatoComIA(titulo, descricao, triagem) {
  const apiKey = localStorage.getItem(GEMINI_STORAGE_KEY);

  // Fallback se não houver chave salva
  if (!apiKey) {
    console.log("Gemini API Key não configurada. Usando classificador local offline.");
    return analisarRelatoLocal(titulo, descricao, triagem);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Prepara prompt estruturado
  const prompt = `Você é o "Guardião da Rede", um analista especialista em cibersegurança e golpes virtuais.
Analise o relato enviado por um cidadão e os dados de triagem sociodemográfica fornecidos.
Sua resposta deve ser EXCLUSIVAMENTE um objeto JSON válido, estruturado conforme o exemplo abaixo, sem tags markdown (como \`\`\`json) e sem introduções ou conclusões textuais.

RELATO DO USUÁRIO:
Título: ${titulo}
Descrição: ${descricao}

DADOS DA TRIAGEM DO USUÁRIO:
Faixa Etária: ${triagem.idade || "Não informada"}
Região do Brasil: ${triagem.regiao || "Não informada"}
Nível de Familiaridade Digital: ${triagem.familiaridade || "Não informada"}
Canal de Contato Inicial: ${triagem.canal || "Não informado"}

REGRAS DE ANÁLISE:
- Risco (porcentagem de 0 a 100): Calcule com base em táticas suspeitas (urgência, falsa autoridade, dados solicitados, oferta irreal, etc.) e na triagem (ex: idosos no canal telefone são altíssimo risco para golpes bancários).
- Nível de Risco: "BAIXO" (0-33%), "MÉDIO" (34-66%) ou "ALTO" (67-100%).
- Area ID: Mapeie para uma das seguintes chaves (exatamente a string indicada):
  * "whatsapp" (fraudes em WhatsApp/mensagens, falsos familiares)
  * "ecommerce" (comércio eletrônico falso, compras falsas, golpes de maquininha)
  * "bancos" (engenharia bancária, falsa central bancária)
  * "phishing" (sms/e-mail falsos de entrega, Correios, taxas, sites governamentais clonados)
  * "relacionamento" (catfishing, romance, investimentos indicados por contatos de redes)
- Características: Identifique táticas conhecidas presentes no texto (ex: urgência, pagamentos adiantados, isolamento da vítima). Explicite-as em um array de objetos.
- Recomendações: Gere orientações educacionais detalhadas e acionáveis, adaptadas para o canal e a idade da vítima.

EXEMPLO DE FORMATO DE RETORNO (DEVE SER APENAS O JSON):
{
  "risco": 85,
  "nivel": "ALTO",
  "areaProvavel": "Fraudes em Aplicativos de Mensagens (WhatsApp)",
  "areaId": "whatsapp",
  "explicacao": "Explicação fluida de por que isso parece ser um golpe, citando os fatores identificados no relato e contextualizando com a idade da vítima.",
  "caracteristicas": [
    {
      "nome": "Pressão Emocional",
      "descricao": "O golpista fingiu ser seu filho alegando um acidente urgente e pedindo transferência financeira."
    }
  ],
  "recomendacoes": [
    "Ligue imediatamente para o número de telefone de costume do seu filho para confirmar se a história é verdadeira.",
    "Nunca faça transferências Pix para chaves ou nomes de pessoas desconhecidas.",
    "Ative a verificação em duas etapas no seu aplicativo de WhatsApp."
  ]
}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na chamada da API: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonText = data.candidates[0].content.parts[0].text;
    
    // Converte a string JSON recebida para objeto JS
    const analise = JSON.parse(jsonText.trim());
    return analise;

  } catch (error) {
    console.error("Falha ao consultar a API do Gemini. Usando classificador local de fallback:", error);
    // Fallback em caso de erro na rede ou limite de cota estourado
    return analisarRelatoLocal(titulo, descricao, triagem);
  }
}

// ==============================================================================
// MASCOTE CAPI INTERATIVA — EASTER EGG E DICAS DINÂMICAS DE SEGURANÇA
// ==============================================================================
const DICAS_CAPI = [
  "Desconfie de links recebidos via SMS fingindo ser de taxas alfandegárias de encomendas. Rastreie no site oficial dos Correios!",
  "Ative a verificação em duas etapas no seu WhatsApp e nas redes sociais para blindar sua conta contra clonagens.",
  "Bancos de verdade nunca ligam pedindo suas senhas, códigos de token SMS ou transferências para 'contas de segurança'.",
  "O Pix não possui estorno garantido imediato. Em caso de golpe, acione na hora o MED (Mecanismo Especial de Devolução) no seu app bancário.",
  "Desconfie de vagas que pagam comissões por curtir vídeos ou avaliar produtos, especialmente se pedirem depósitos em dinheiro.",
  "Antes de fazer um Pix de urgência para um parente com número novo no WhatsApp, ligue e fale com a pessoa por voz para confirmar.",
  "Cuidado com a 'Selfie da Selfie': Nunca tire fotos do rosto fora de aplicativos oficiais se solicitado por supostos funcionários em ligação.",
  "Sites do governo brasileiro e da justiça terminam sempre com '.gov.br' ou '.jus.br'. Desconfie de links encurtados ou estranhos.",
  "O anonimato dos relatos no Guardião da Rede protege as vítimas da vergonha social e ajuda a proteger toda a comunidade em tempo real.",
  "Se um comprador pedir para migrar a negociação da OLX ou Mercado Livre para o WhatsApp particular, desconfie: é o início de um golpe comum."
];

document.addEventListener("DOMContentLoaded", () => {
  const capiWidget = document.querySelector(".capi-widget");
  if (capiWidget) {
    const capiImg = capiWidget.querySelector(".capi-pixel-img");
    const capiBubbleText = capiWidget.querySelector(".capi-bubble p");

    if (capiBubbleText) {
      capiBubbleText.style.color = "";
      
      // Efeito Typewriter na carga inicial da Capi
      const isTriagePage = window.location.pathname.includes("triagem.html");
      const isResultPage = window.location.pathname.includes("resultado.html");
      const isSurveyPage = window.location.pathname.includes("pesquisa.html");
      
      if (!isTriagePage && !isResultPage) {
        const originalHTML = capiBubbleText.innerHTML;
        const cleanText = capiBubbleText.textContent || capiBubbleText.innerText;
        capiBubbleText.textContent = "";
        let textIdx = 0;
        
        function typeWriter() {
          if (textIdx < cleanText.length) {
            capiBubbleText.textContent += cleanText.charAt(textIdx);
            textIdx++;
            setTimeout(typeWriter, 12);
          } else {
            capiBubbleText.innerHTML = originalHTML;
          }
        }
        typeWriter();
      }
    }

    capiWidget.addEventListener("click", () => {
      // Evita alterar o texto dinâmico essencial nas páginas de triagem e resultado
      const isTriagePage = window.location.pathname.includes("triagem.html");
      const isResultPage = window.location.pathname.includes("resultado.html");
      
      if (capiBubbleText && !isTriagePage && !isResultPage) {
        // Efeito de animação na imagem
        if (capiImg) {
          capiImg.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
          capiImg.style.transform = "scale(1.2) rotate(10deg)";
          setTimeout(() => {
            capiImg.style.transform = "scale(1) rotate(0deg)";
          }, 500);
        }

        // Escolhe uma dica aleatória diferente da atual
        let novaDica = "";
        do {
          const randIdx = Math.floor(Math.random() * DICAS_CAPI.length);
          novaDica = DICAS_CAPI[randIdx];
        } while (novaDica === capiBubbleText.textContent);

        // Aplica efeito fade ao trocar o texto
        capiBubbleText.style.opacity = 0;
        capiBubbleText.style.transition = "opacity 0.2s ease";
        
        setTimeout(() => {
          capiBubbleText.innerHTML = `<strong>Dica da Capi:</strong> "${novaDica}"`;
          capiBubbleText.style.opacity = 1;
        }, 200);
      }
    });
  }

  // Menu Hamburger Mobile Toggle
  const btnHamburger = document.getElementById("btn-hamburger");
  const appNav = document.querySelector(".app-nav");
  if (btnHamburger && appNav) {
    btnHamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      appNav.classList.toggle("open");
      btnHamburger.textContent = appNav.classList.contains("open") ? "✕" : "☰";
    });
    
    // Fecha o menu ao clicar fora
    document.addEventListener("click", (e) => {
      if (appNav.classList.contains("open") && !appNav.contains(e.target) && e.target !== btnHamburger) {
        appNav.classList.remove("open");
        btnHamburger.textContent = "☰";
      }
    });
  }

  // IntersectionObserver para animações de fade-up
  const fadeElements = document.querySelectorAll(".fade-up, .window, .card-flat");
  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    // Adiciona classe fade-up de forma dinâmica se não estiver presente nos windows/cards para suavizar
    fadeElements.forEach(el => {
      if (!el.classList.contains("fade-up")) {
        el.classList.add("fade-up");
      }
    });

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.02,
      rootMargin: "0px 0px -30px 0px"
    });

    fadeElements.forEach(el => observer.observe(el));
  } else {
    // Fallback se o navegador for muito antigo
    fadeElements.forEach(el => el.classList.add("visible"));
  }

  // Animação de Boot Sequence para o conteúdo principal
  const bootElements = document.querySelectorAll(".boot-hidden");
  if (bootElements.length > 0) {
    setTimeout(() => {
      bootElements.forEach(el => el.classList.add("boot-visible"));
    }, 150);
  }

  // ==============================================================================
  // INTERPRETADOR DE COMANDOS DO TERMINAL INTERATIVO (LANDING PAGE)
  // ==============================================================================
  const terminalInput = document.getElementById("terminal-console-input");
  const terminalBody = document.getElementById("terminal-console-body");

  if (terminalInput && terminalBody) {
    // Escreve uma linha no terminal
    function writeLine(text, type = "info") {
      const line = document.createElement("div");
      line.className = `terminal-log-line ${type}`;
      line.innerHTML = text;
      terminalBody.appendChild(line);
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // Efeito de escrita atrasada (logs linha a linha)
    async function writeBatchAnimated(lines, delay = 250) {
      for (const line of lines) {
        await new Promise(resolve => setTimeout(resolve, delay));
        writeLine(line.text, line.type);
      }
    }

    // Inicialização do Terminal
    writeLine("===================================================", "system");
    writeLine("🛡️ GUARDIÃO DA REDE - PROTOCOLO DE SEGURANÇA V2.1", "system");
    writeLine("CONEXÃO ESTABELECIDA. SISTEMA PRONTO PARA VARREDURA.", "success");
    writeLine("Digite <span style='color:var(--accent-teal);'>help</span> para ver os comandos disponíveis.", "info");
    writeLine("===================================================", "system");

    terminalInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        const commandText = terminalInput.value.trim();
        terminalInput.value = "";

        if (!commandText) return;

        writeLine(`> ${commandText}`, "user");

        const args = commandText.split(" ");
        const cmd = args[0].toLowerCase();

        switch (cmd) {
          case "help":
            await writeBatchAnimated([
              { text: "Comandos disponíveis:", type: "system" },
              { text: "  <span style='color:var(--accent-teal);'>scan &lt;relato ou URL&gt;</span> - Executa análise heurística local rápida", type: "info" },
              { text: "  <span style='color:var(--accent-teal);'>status</span> - Exibe telemetria da rede", type: "info" },
              { text: "  <span style='color:var(--accent-teal);'>logs</span> - Mostra contagem dos últimos relatos comunitários", type: "info" },
              { text: "  <span style='color:var(--accent-teal);'>clear</span> - Limpa a tela do terminal", type: "info" }
            ], 120);
            break;

          case "clear":
            terminalBody.innerHTML = "";
            break;

          case "status":
            const reportsCount = JSON.parse(localStorage.getItem("guardiao_reports_database") || "[]").length + 8;
            const surveysCount = JSON.parse(localStorage.getItem("guardiao_pesquisa_dados") || "[]").length + 12;
            
            writeLine("📡 Lendo sensores de telemetria...", "info");
            await writeBatchAnimated([
              { text: "⚡ [SISTEMA] Motor Offline: Ativo (Regras locais carregadas)", type: "success" },
              { text: `⚡ [TELEMETRIA] Casos registrados no banco: ${reportsCount}`, type: "info" },
              { text: `⚡ [PESQUISA] Entrevistas coletadas: ${surveysCount}`, type: "info" },
              { text: "⚡ [IA ENGINE] Gemini API Fallback: Configurado & Aguardando", type: "success" },
              { text: "🟢 [STATUS] Integridade do nó da rede: 100% OK", type: "success" }
            ], 180);
            break;

          case "logs":
            const dbLogs = JSON.parse(localStorage.getItem("guardiao_reports_database") || "[]");
            writeLine("📂 Carregando base de dados locais...", "info");
            await new Promise(resolve => setTimeout(resolve, 300));
            if (dbLogs.length === 0) {
              writeLine("Nenhum relato customizado inserido no localStorage. Usando base mockada.", "warning");
            } else {
              writeLine(`Encontrados ${dbLogs.length} relatos do usuário no localStorage.`, "success");
              dbLogs.slice(0, 3).forEach(log => {
                writeLine(`  • [${log.data}] ${log.titulo} - Risco: ${log.analise?.nivel || 'Indeterminado'}`, "info");
              });
            }
            break;

          case "scan":
            const target = args.slice(1).join(" ");
            if (!target) {
              writeLine("Erro: Informe o texto ou URL para escaneamento. Ex: <span style='color:var(--accent-teal);'>scan www.site-suspeito.com</span>", "error");
              break;
            }

            writeLine(`🔍 Iniciando varredura heurística em: "${target}"...`, "info");
            
            await writeBatchAnimated([
              { text: "⏳ [1/3] Cruzando texto com padrões de phishing conhecidos...", type: "info" },
              { text: "⏳ [2/3] Verificando domínios suspeitos e chaves de engenharia social...", type: "info" },
              { text: "⏳ [3/3] Calculando probabilidade de falsificação...", type: "info" }
            ], 350);

            const lowerTarget = target.toLowerCase();
            let isSuspicious = false;
            let reasons = [];

            if (lowerTarget.includes("pix") || lowerTarget.includes("urgente") || lowerTarget.includes("transferencia") || lowerTarget.includes("pagar")) {
              isSuspicious = true;
              reasons.push("Menção a Pix ou Transferência de caráter urgente");
            }
            if (lowerTarget.includes("vaga") || lowerTarget.includes("emprego") || lowerTarget.includes("ganhar") || lowerTarget.includes("tarefa")) {
              isSuspicious = true;
              reasons.push("Padrão de falsa promessa de renda extra por tarefas");
            }
            if (lowerTarget.includes("correios") || lowerTarget.includes("taxa") || lowerTarget.includes("rastreio") || lowerTarget.includes(".top") || lowerTarget.includes(".site")) {
              isSuspicious = true;
              reasons.push("Link suspeito imitando taxas postais ou domínio de baixo custo (.top/.site)");
            }
            if (lowerTarget.includes("0800") || lowerTarget.includes("banco") || lowerTarget.includes("bloqueada") || lowerTarget.includes("seguranca")) {
              isSuspicious = true;
              reasons.push("Falsa central telefônica ou engenharia de segurança bancária");
            }

            if (isSuspicious) {
              writeLine("🚨 [ALERTA DE SEGURANÇA] Ameaça detectada!", "error");
              reasons.forEach(r => writeLine(`  -> Fator de Risco: ${r}`, "error"));
              writeLine("Diagnóstico: Altamente Recomendável NÃO realizar transferências ou clicar em links relacionados.", "error");
            } else {
              writeLine("✅ Varredura concluída. Nenhum sinal suspeito óbvio detectado pelas regras locais rápidas.", "success");
              writeLine("Nota: Faça o relato detalhado na aba 'Relatar Suspeita' para um diagnóstico mais robusto.", "info");
            }
            break;

          default:
            writeLine(`Comando inválido: "${cmd}". Digite <span style='color:var(--accent-teal);'>help</span> para ver os comandos suportados.`, "error");
            break;
        }
      }
    });
  }
});


