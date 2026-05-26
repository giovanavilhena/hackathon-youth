/**
 * CapiSafe — Integração com API da Maritaca AI (Sabiá-3)
 *
 * Gerencia a chave de API salva no localStorage, o modal de configurações
 * e as chamadas ao modelo de linguagem brasileiro Sabiá-3 (maritaca.ai).
 */

// Chave do localStorage
const MARITACA_STORAGE_KEY = "capisafe_maritaca_api_key";

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
    const savedKey = localStorage.getItem(MARITACA_STORAGE_KEY) || "";
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
      localStorage.setItem(MARITACA_STORAGE_KEY, key);
      showToast("Chave de API salva com sucesso localmente!", "success");
    } else {
      localStorage.removeItem(MARITACA_STORAGE_KEY);
      showToast("Chave removida. O site usará o classificador local offline.", "warning");
    }
    closeModal();
  });

  // Limpa a chave
  clearSettings.addEventListener("click", () => {
    localStorage.removeItem(MARITACA_STORAGE_KEY);
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
  const apiKey = localStorage.getItem(MARITACA_STORAGE_KEY);

  // Fallback se não houver chave salva
  if (!apiKey) {
    console.log("Chave Maritaca AI não configurada. Usando classificador local offline.");
    return analisarRelatoLocal(titulo, descricao, triagem);
  }

  const endpoint = "https://chat.maritaca.ai/api/chat/completions";

  // Prepara prompt estruturado
  const prompt = `Você é o "Capi", analista especialista em cibersegurança e golpes virtuais do projeto CapiSafe.
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
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sabia-3",
        messages: [
          { role: "system", content: "Você é um analista especialista em cibersegurança brasileiro. Responda EXCLUSIVAMENTE com JSON válido, sem markdown, sem texto adicional." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na chamada da API: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonText = data.choices[0].message.content;

    // Converte a string JSON recebida para objeto JS
    const analise = JSON.parse(jsonText.trim());
    return analise;

  } catch (error) {
    console.error("Falha ao consultar a Maritaca AI. Usando classificador local de fallback:", error);
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
  // WIDGET DE CHATBOT FLUTUANTE (CAPI BOT)
  // ==============================================================================
  const chatbotWidget = document.getElementById("chatbot-widget");
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const btnMinimizeChat = document.getElementById("btn-minimize-chat");
  const chatbotInput = document.getElementById("chatbot-input");
  const btnSendChat = document.getElementById("btn-send-chat");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotLoading = document.getElementById("chatbot-loading");

  if (chatbotWidget && chatbotToggle && btnMinimizeChat && chatbotInput && btnSendChat && chatbotMessages) {
    // Abrir o chat
    chatbotToggle.addEventListener("click", () => {
      chatbotWidget.classList.remove("minimized");
      chatbotInput.focus();
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    });

    // Minimizar o chat
    btnMinimizeChat.addEventListener("click", () => {
      chatbotWidget.classList.add("minimized");
    });

    // Enviar mensagem
    async function handleChatSubmit() {
      const text = chatbotInput.value.trim();
      if (!text) return;

      chatbotInput.value = "";
      appendChatMessage(text, "user");

      // Mostra o loader
      chatbotLoading.style.display = "block";
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

      try {
        const reply = await getChatbotResponse(text);
        appendChatMessage(reply, "bot");
      } catch (err) {
        console.error("Erro na conversação:", err);
        appendChatMessage("⚠️ Desculpe, encontrei um erro técnico temporário ao processar sua resposta. Tente novamente.", "bot");
      } finally {
        chatbotLoading.style.display = "none";
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
      }
    }

    btnSendChat.addEventListener("click", handleChatSubmit);
    chatbotInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleChatSubmit();
      }
    });

    // Função para renderizar uma mensagem
    function appendChatMessage(text, sender) {
      const msgDiv = document.createElement("div");
      msgDiv.className = `chat-message ${sender}`;
      
      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.style.fontSize = "10px";
      meta.style.fontFamily = "var(--font-mono)";
      meta.style.color = sender === "bot" ? "var(--accent-purple)" : "var(--accent-teal)";
      meta.style.marginBottom = "2px";
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      meta.textContent = sender === "bot" ? `Capi Bot • ${timeStr}` : `Você • ${timeStr}`;
      
      const textDiv = document.createElement("div");
      textDiv.className = "message-text";
      textDiv.style.fontSize = "12px";
      textDiv.style.lineHeight = "1.45";
      
      // Sanitização básica e formatação de markdown
      let formattedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
      textDiv.innerHTML = formattedText;
      
      msgDiv.appendChild(meta);
      msgDiv.appendChild(textDiv);
      chatbotMessages.appendChild(msgDiv);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Histórico de mensagens estruturado para a API do Gemini
    let chatHistory = [];

    // Prompt de treinamento (System Instruction) do Capi Bot especialista em golpes
    const SYSTEM_INSTRUCTION = `Você é o "Capi Bot", o especialista virtual de inteligência artificial do projeto "CapiSafe" (plataforma brasileira de segurança cibernética contra golpes virtuais).
Seu objetivo é ajudar cidadãos a detectar se são vítimas de engenharia social, phishing ou fraudes financeiras de forma amigável, ética e direta.

Regras e Instruções para sua Resposta:
1. Responda sempre em português (Brasil) de forma concisa, porém muito instrutiva e legível. Use bullet points e negrito.
2. Seu tom é o de um especialista vigilante digital amigável. Use termos fáceis de entender.
3. Se o usuário fornecer poucos detalhes (ex: "recebi um link"), faça perguntas simples e focadas (uma de cada vez) para entender o caso, por exemplo: "Como eles te contataram (SMS, WhatsApp, telefone)?", "Que tipo de link era?".
4. Se identificar um golpe provável, forneça:
   - Um veredito de risco claro (Ex: "⚠️ RISCO ESTIMADO: ALTO" ou "🟢 RISCO ESTIMADO: BAIXO").
   - Explicação breve do mecanismo do golpe (ex: phishing fingindo ser os Correios ou sequestro de WhatsApp).
   - Recomendações urgentes de proteção (Ex: NÃO clique, bloqueie o número, entre em contato com o banco pelo canal oficial).
5. Incentive o usuário a usar a ferramenta principal "Relatar Suspeita" no menu superior para gerar um dossiê técnico de proteção detalhado para o caso.
6. Nunca responda a perguntas fora de segurança da informação ou golpes. Se o usuário perguntar sobre outros assuntos, diga de forma bem-humorada que sua mente de capivara hacker está focada em caçar golpistas.`;

    async function getChatbotResponse(userMessage) {
      const apiKey = localStorage.getItem(MARITACA_STORAGE_KEY);

      // Fallback heurístico se não houver API Key
      if (!apiKey) {
        return getHeuristicResponse(userMessage);
      }

      // Adiciona mensagem do usuário ao histórico local (formato OpenAI)
      chatHistory.push({ role: "user", content: userMessage });

      // Limita o histórico das últimas 10 mensagens
      if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(-10);
      }

      const endpoint = "https://chat.maritaca.ai/api/chat/completions";

      const payload = {
        model: "sabia-3",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...chatHistory
        ],
        temperature: 0.7,
        max_tokens: 500
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Erro na requisição para a Maritaca AI");
      }

      const data = await response.json();
      const botText = data.choices[0].message.content.trim();

      // Adiciona a resposta do bot ao histórico
      chatHistory.push({ role: "assistant", content: botText });

      return botText;
    }

    // Assistente local com regras heurísticas simples
    function getHeuristicResponse(message) {
      const lower = message.toLowerCase();
      let response = `⚠️ *[MODO OFFLINE / HEURÍSTICO EM EXECUÇÃO]*\n\n`;
      response += `Para análises inteligentes profundas com IA, ative sua chave Maritaca AI no ícone ⚙️ no menu superior.\n\n`;

      let matched = false;

      if (lower.includes("pix") || lower.includes("urgente") || lower.includes("dinheiro") || lower.includes("transfer") || lower.includes("familiar") || lower.includes("filho") || lower.includes("filha")) {
        response += `🔴 *RISCO ESTIMADO: ALTO RISCO (Fraude Pix / Falso Familiar)*\n\n`;
        response += `Parece uma tentativa de golpe financeira por WhatsApp ou rede social:\n`;
        response += `• *NÃO transfira qualquer valor.*\n`;
        response += `• Ligue imediatamente para o telefone normal (de voz) do seu familiar usando o número antigo.\n`;
        response += `• Golpistas usam fotos clonadas e fingem urgência para impedir você de pensar racionalmente.\n\n`;
        response += `Dica: Use a aba *Relatar Suspeita* do site para analisar o caso detalhadamente.`;
        matched = true;
      }
      else if (lower.includes("link") || lower.includes("correios") || lower.includes("taxa") || lower.includes("rastreio") || lower.includes("siga") || lower.includes("entrega") || lower.includes("alfandega")) {
        response += `🔴 *RISCO ESTIMADO: ALTO RISCO (Phishing de Encomendas)*\n\n`;
        response += `Golpes que imitam taxas dos Correios ou transportadoras são extremamente frequentes no momento:\n`;
        response += `• *NÃO clique no link e nunca digite dados de cartão de crédito.*\n`;
        response += `• Verifique o código de rastreio direto no aplicativo oficial ou site oficial dos Correios (correios.com.br).\n`;
        response += `• Domínios suspeitos costumam terminar em \`.site\`, \`.top\`, \`.xyz\` em vez de \`.com.br\`.\n\n`;
        response += `Dica: Use a aba *Relatar Suspeita* do site para analisar o caso detalhadamente.`;
        matched = true;
      }
      else if (lower.includes("vaga") || lower.includes("trabalho") || lower.includes("renda") || lower.includes("tarefa") || lower.includes("ganhar") || lower.includes("emprego") || lower.includes("extra")) {
        response += `🔴 *RISCO ESTIMADO: ALTO RISCO (Falso Emprego / Tarefas Pix)*\n\n`;
        response += `Ofertas fáceis de trabalho via WhatsApp ou Telegram são falsas:\n`;
        response += `• Eles pedem para você fazer pequenas tarefas (como curtir vídeos) e te pagam valores baixos no início.\n`;
        response += `• Depois, exigem que você deposite valores maiores para 'subir de nível' ou 'sacar a comissão'. É uma pirâmide financeira.\n`;
        response += `• *NÃO deposite dinheiro.* Bloqueie o recrutador imediatamente.\n\n`;
        response += `Dica: Use a aba *Relatar Suspeita* do site para analisar o caso detalhadamente.`;
        matched = true;
      }
      else if (lower.includes("banco") || lower.includes("0800") || lower.includes("bloqueada") || lower.includes("compra") || lower.includes("seguranca") || lower.includes("cartao") || lower.includes("senha")) {
        response += `🔴 *RISCO ESTIMADO: ALTO RISCO (Falsa Central de Segurança)*\n\n`;
        response += `Ligações alertando sobre transações ou transferências suspeitas na sua conta bancária costumam ser fraudes:\n`;
        response += `• O golpista finge ser funcionário da área de segurança e pede que você transfira o dinheiro para uma 'conta segura' temporária.\n`;
        response += `• *Desligue imediatamente.* O banco nunca liga solicitando transferências Pix, depósitos ou senhas.\n`;
        response += `• Ligue para o número oficial impresso atrás do seu cartão físico.\n\n`;
        response += `Dica: Use a aba *Relatar Suspeita* do site para analisar o caso detalhadamente.`;
        matched = true;
      }

      if (!matched) {
        response += `💡 *RISCO ESTIMADO: ANÁLISE INCONCLUSIVA (Modo Offline)*\n\n`;
        response += `Não consegui identificar termos de golpes conhecidos na sua mensagem.\n\n`;
        response += `Por favor, ative a chave API do Gemini no ícone ⚙️ no menu superior para conversar de forma livre e profunda com a inteligência artificial, ou descreva a suspeita citando se envolveu mensagens, WhatsApp, links, ligações ou transferências Pix.`;
      }

      return response;
    }
  }
});


