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
