/**
 * Guardião da Rede — Integração com API do Google Gemini
 * 
 * Este arquivo gerencia a chave de API salva no localStorage, a interface do modal
 * de configurações e a chamada da IA (Gemini 1.5 Flash).
 */

// Chave do localStorage
const GEMINI_STORAGE_KEY = "guardiao_gemini_api_key";

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
      alert("Chave de API salva com sucesso localmente!");
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
      alert("Chave removida. O site usará o classificador local offline.");
    }
    closeModal();
  });

  // Limpa a chave
  clearSettings.addEventListener("click", () => {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
    keyInput.value = "";
    alert("Chave de API removida do seu navegador.");
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

    // Remove inline style que forçaria texto preto
    if (capiBubbleText) {
      capiBubbleText.style.color = "";
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
});

