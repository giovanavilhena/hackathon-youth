/**
 * CapiSafe — Chatbot do Telegram
 * 
 * Um chatbot simplificado que recebe descrições de relatos
 * e retorna a classificação de risco e orientações.
 */

// Importa dependências
const { Telegraf } = require('telegraf');
const path = require('path');

// Carrega o classificador de golpes (reutilizando a lógica do site)
const { analisarRelatoLocal } = require(path.join(__dirname, '../js/classificador.js'));

// Verifica o token de ambiente
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("ERRO: A variável de ambiente TELEGRAM_BOT_TOKEN não foi configurada.");
  console.error("Consulte o arquivo README-bot.md para saber como configurar.");
  process.exit(1);
}

// Inicializa o Bot
const bot = new Telegraf(BOT_TOKEN);

// Comando Inicial /start
bot.start((ctx) => {
  const welcomeMessage = `
🛡️ *Bem-vindo ao CapiSafe!*

Olá! Eu sou o assistente virtual do projeto CapiSafe (MVP desenvolvido para o Hackathon FIB16).
Estou aqui para ajudar a identificar possíveis golpes virtuais de forma rápida e anônima.

*Como usar:*
Basta digitar uma mensagem descrevendo a situação suspeita que aconteceu com você ou com algum familiar.

*Exemplo:* 
_"Recebi uma mensagem do meu filho dizendo que mudou de celular e me pedindo um Pix de 2 mil reais urgente."_

Envie seu relato abaixo e farei a análise na hora!
  `;
  ctx.replyWithMarkdown(welcomeMessage);
});

// Comando /help
bot.help((ctx) => {
  const helpText = `
ℹ️ *Instruções de Uso*

• Envie-me um texto relatando a mensagem, e-mail, ligação ou oferta suspeita.
• O sistema vai analisar palavras-chave, urgência e características comuns de fraudes cibernéticas.
• Responderei com a porcentagem de risco estimado (Baixo, Médio ou Alto) e recomendações.

_Nota: Esta análise é baseada em regras estatísticas e inteligência computacional básica. Sempre confirme com canais oficiais de segurança antes de realizar transações financeiras._
  `;
  ctx.replyWithMarkdown(helpText);
});

// Processamento de Mensagens de Texto (Análise de Golpe)
bot.on('text', async (ctx) => {
  const userText = ctx.message.text;

  // Mostra indicador de que o bot está digitando
  await ctx.sendChatAction('typing');

  try {
    // Para o bot de Telegram, criamos um título fictício curto a partir do texto
    const tituloFicticio = userText.substring(0, 50) + "...";
    
    // Assume dados demográficos neutros/padrão já que não há triagem passo-a-passo no bot simples
    const triagemPadrao = {
      idade: "Não informada",
      regiao: "Não informada",
      familiaridade: "Médio",
      canal: "Mensagens"
    };

    // Executa a classificação local
    const resultado = analisarRelatoLocal(tituloFicticio, userText, triagemPadrao);

    // Formata o nível de risco visualmente
    let emojiRisco = "🟢";
    if (resultado.nivel === "MÉDIO") emojiRisco = "🟡";
    if (resultado.nivel === "ALTO") emojiRisco = "🔴";

    // Limpa asteriscos do markdown que o classificador retorna para evitar quebra no Telegram
    let explicacaoLimpa = resultado.explicacao
      .replace(/\*\*/g, "*") // Substitui ** por * simples do telegram
      .replace(/&amp;/g, "&");

    // Monta a mensagem de resposta
    let responseMsg = `📊 *GUARDIÃO DA REDE — ANÁLISE DE SUSPEITA*\n\n`;
    responseMsg += `${emojiRisco} *Risco Estimado:* ${resultado.risco}% (${resultado.nivel} RISCO)\n`;
    responseMsg += `📁 *Categoria Provável:* ${resultado.areaProvavel}\n\n`;
    responseMsg += `🔍 *Diagnóstico:*\n${explicacaoLimpa}\n\n`;
    
    responseMsg += `🛡️ *Recomendações de Segurança:*\n`;
    resultado.recomendacoes.slice(0, 4).forEach((rec, index) => {
      responseMsg += `${index + 1}. ${rec}\n`;
    });

    responseMsg += `\n_Para uma análise completa com IA, acesse o site oficial do CapiSafe._`;

    // Envia o laudo
    ctx.replyWithMarkdown(responseMsg);

  } catch (error) {
    console.error("Erro ao analisar mensagem no bot:", error);
    ctx.reply("Desculpe, ocorreu um erro técnico ao processar seu relato. Tente novamente mais tarde.");
  }
});

// Inicialização do Servidor do Bot
bot.launch().then(() => {
  console.log("🛡️ Bot da CapiSafe iniciado com sucesso no Telegram!");
});

// Encerramento limpo para interrupções
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('TERM', () => bot.stop('TERM'));
