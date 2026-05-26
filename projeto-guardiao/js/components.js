/**
 * Guardião da Rede — Componentes Compartilhados Dinâmicos
 * 
 * Este script injeta elementos duplicados em todo o site, como o Modal de Configurações,
 * garantindo consistência e facilitando a manutenção do código.
 */

(function() {
  const MODAL_SETTINGS_HTML = `
  <!-- CONFIGURATION MODAL (IA SETTINGS) -->
  <div class="modal-overlay" id="settings-modal" aria-hidden="true" role="dialog" aria-labelledby="settings-modal-title">
    <div class="window outset-border modal-card">
      <div class="window-titlebar">
        <div class="titlebar-text">
          <span id="settings-modal-title">⚙️ CONFIGURACOES_IA.EXE</span>
        </div>
        <div class="titlebar-controls">
          <button class="win-btn" id="btn-close-settings" aria-label="Fechar">&times;</button>
        </div>
      </div>
      <div class="window-body">
        <p style="margin-bottom: 10px;">
          Insira sua API Key do <strong>Google Gemini</strong> para análises inteligentes avançadas. Chave salva localmente no navegador.
        </p>
        <div class="form-group">
          <label for="gemini-key-input" class="form-label">API Key:</label>
          <input type="password" id="gemini-key-input" class="form-input inset-border" placeholder="AIzaSy...">
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
})();
