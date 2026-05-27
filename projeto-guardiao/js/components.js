/**
 * CapiSafe — Componentes Compartilhados Dinâmicos
 *
 * Injeta elementos reutilizados em todo o site (modal de configurações, chatbot, mascote flutuante).
 */

(function() {
  // Apply saved theme immediately to prevent flashing
  const savedTheme = localStorage.getItem("capi-theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }

  const MODAL_SETTINGS_HTML = `
  <!-- CONFIGURATION MODAL (IA SETTINGS) -->
  <div class="modal-overlay" id="settings-modal" aria-hidden="true" role="dialog" aria-labelledby="settings-modal-title">
    <div class="window outset-border modal-card">
      <div class="window-titlebar">
        <div class="titlebar-text">
          <span id="settings-modal-title">CONFIGURACOES_IA.EXE</span>
        </div>
        <div class="titlebar-controls">
          <button class="win-btn" id="btn-close-settings" aria-label="Fechar">&times;</button>
        </div>
      </div>
      <div class="window-body">
        <p style="margin-bottom: 10px;">
          Insira sua API Key da <strong>Maritaca AI</strong> para análises inteligentes avançadas com o Sabiá-3 🇧🇷. Chave salva localmente no navegador.
        </p>
        <div class="form-group">
          <label for="gemini-key-input" class="form-label">API Key Maritaca:</label>
          <input type="password" id="gemini-key-input" class="form-input inset-border" placeholder="110672...">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: 15px;">
          <button class="btn btn-secondary outset-border" id="btn-clear-settings">Limpar</button>
          <button class="btn btn-primary outset-border" id="btn-save-settings">Salvar</button>
        </div>
      </div>
    </div>
  </div>
  `;

  // Injeta o modal no final do body de forma síncrona
  document.body.insertAdjacentHTML('beforeend', MODAL_SETTINGS_HTML);

  const CHATBOT_HTML = `
  <!-- WIDGET DE CHATBOT FLUTUANTE INTERATIVO (CAPI BOT) -->
  <div class="chatbot-widget minimized" id="chatbot-widget">
    <button class="chatbot-toggle outset-border" id="chatbot-toggle" aria-label="Falar com Especialista em Golpes">
      <img src="imagens/capi_detective.png" alt="Capi" class="logo-img" style="width:20px;height:20px;margin-right:6px;">
      <span class="chatbot-toggle-text">Falar com Especialista</span>
      <span class="chatbot-pulse-dot"></span>
    </button>
    <div class="chatbot-window window outset-border">
      <div class="window-titlebar">
        <div class="titlebar-text">
          <img src="imagens/capi_detective.png" alt="Capi" class="logo-img" style="width:16px;height:16px;margin-right:6px;">
          <span>CAPI_BOT.EXE</span>
        </div>
        <div class="titlebar-controls">
          <button class="win-btn" id="btn-minimize-chat" aria-label="Minimizar chat">&times;</button>
        </div>
      </div>
      <div class="window-body chatbot-body" style="padding: 12px; display: flex; flex-direction: column; height: 350px; justify-content: space-between;">
        <div class="chatbot-messages" id="chatbot-messages" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; padding-right: 4px;">
          <div class="chat-message bot">
            <div class="message-meta" style="font-size: 10px; font-family: var(--font-mono); color: var(--accent-purple); margin-bottom: 2px;">Capi Bot • Agora</div>
            <div class="message-text" style="font-size: 12px; line-height: 1.45;">Olá! Sou o especialista de segurança cibernética do Guardião da Rede. Suspeita de alguma mensagem, ligação ou investimento Pix? Me conte os detalhes e eu analiso para você na hora!</div>
          </div>
        </div>
        <div class="chatbot-loading-line" id="chatbot-loading" style="display: none; font-size: 11px; font-family: var(--font-mono); color: var(--accent-teal); margin-bottom: 8px; padding-left: 4px;">
          <span class="typing-indicator">[CAPI_BOT COGNITIVO PROCESSANDO...]</span>
        </div>
        <div class="chatbot-input-container" style="display: flex; gap: 6px; align-items: center;">
          <input type="text" id="chatbot-input" class="form-input inset-border" style="font-size: 12px; padding: 8px 12px; flex: 1;" placeholder="Diga o que aconteceu..." autocomplete="off">
          <button class="btn btn-primary outset-border" id="btn-send-chat" style="font-size: 12px; padding: 8px 14px;">Enviar</button>
        </div>
      </div>
      <div class="window-statusbar">
        <span>Canal Direto de IA</span>
        <span>Online</span>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', CHATBOT_HTML);

  const MASCOT_HTML = `
  <!-- MASCOTE FLUTUANTE DA CAPIVARA (FLOATING CAPI MASCOT) -->
  <div class="floating-capi-mascot" id="capi-mascot">
    <div class="capi-speech-bubble" id="capi-mascot-bubble">
      Dica da Capi: Proteja-se!
    </div>
    <div class="capi-sprite-container" id="capi-mascot-sprite" title="Clique em mim para ver uma dica de segurança!">
      <img src="imagens/capi_detective.png" alt="Capi Mascote" class="capi-sprite-img">
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', MASCOT_HTML);

  // Injetar botão de alternar tema ao lado das configurações de IA
  document.addEventListener("DOMContentLoaded", () => {
    const settingsToggle = document.getElementById("btn-settings-toggle");
    if (settingsToggle) {
      const themeToggle = document.createElement("button");
      themeToggle.className = "btn-settings outset-border";
      themeToggle.id = "btn-theme-toggle";
      themeToggle.style.display = "inline-flex";
      themeToggle.style.alignItems = "center";
      themeToggle.style.justifyContent = "center";
      themeToggle.style.fontSize = "13px";
      
      const isLight = document.body.classList.contains("light-theme");
      themeToggle.title = isLight ? "Alternar para Modo Escuro" : "Alternar para Modo Claro";
      themeToggle.innerHTML = "🌓";
      
      themeToggle.addEventListener("click", () => {
        const wasLight = document.body.classList.toggle("light-theme");
        if (wasLight) {
          localStorage.setItem("capi-theme", "light");
          themeToggle.title = "Alternar para Modo Escuro";
        } else {
          localStorage.setItem("capi-theme", "dark");
          themeToggle.title = "Alternar para Modo Claro";
        }
      });
      
      settingsToggle.parentNode.insertBefore(themeToggle, settingsToggle);
    }
  });
})();
