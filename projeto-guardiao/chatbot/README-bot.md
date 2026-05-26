# 🤖 Chatbot do Telegram — Guardião da Rede

Este diretório contém a versão simplificada do bot do **Guardião da Rede** para Telegram. O bot opera analisando descrições textuais de mensagens suspeitas diretamente no chat e devolve um relatório contendo a estimativa de risco de golpe e recomendações preventivas.

---

## 🛠️ Pré-requisitos
Antes de executar o chatbot, certifique-se de possuir:
1. **Node.js** instalado (versão 16 ou superior).
2. Um token de bot gerado pelo **BotFather** no Telegram.

---

## 🔑 Passo 1: Como Obter o Token do Bot (Gratuito)
1. No seu aplicativo do Telegram, busque por **@BotFather** (o canal oficial de criação de bots do Telegram).
2. Clique em **Começar** ou digite `/start`.
3. Crie um novo bot enviando o comando:
   ```text
   /newbot
   ```
4. Siga as instruções do chat:
   - Defina um nome de exibição amigável (Ex: `Guardião da Rede - FIB16`).
   - Defina um nome de usuário único que termine obrigatoriamente com a palavra `bot` (Ex: `guardiaorede_fib16_bot`).
5. Ao concluir, o BotFather enviará uma mensagem de parabéns com a **HTTP API Token** (uma sequência longa contendo números e letras, similar a `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
6. Salve esta chave com segurança.

---

## 🚀 Passo 2: Executando Localmente
1. Abra o terminal na pasta `/projeto-guardiao/chatbot/`.
2. Instale o pacote da biblioteca do bot (Telegraf):
   ```bash
   npm install telegraf
   ```
3. Configure a variável de ambiente no seu terminal (substituindo pelo token que obteve no BotFather):
   - **No Linux/Mac:**
     ```bash
     export TELEGRAM_BOT_TOKEN="seu_token_aqui"
     ```
   - **No Windows (PowerShell):**
     ```powershell
     $env:TELEGRAM_BOT_TOKEN="seu_token_aqui"
     ```
4. Execute o script do chatbot:
   ```bash
   node bot-telegram.js
   ```
5. Acesse seu bot no Telegram buscando pelo nome de usuário definido e clique em **Começar**. Envie sua suspeita de golpe para receber a análise imediata.

---

## 🌐 Passo 3: Como Hospedar Gratuitamente (24/7)

Para que o bot funcione continuamente sem precisar do seu computador ligado, faça o deploy em plataformas de nuvem gratuitas:

### Opção 1: Render (Recomendado & Simples)
1. Salve o projeto no seu repositório do **GitHub**.
2. Acesse [render.com](https://render.com) e crie uma conta gratuita.
3. Clique em **New** > **Web Service** ou **Background Worker**.
4. Conecte sua conta do GitHub e selecione o repositório do projeto.
5. Configure os seguintes parâmetros de deploy:
   - **Build Command**: `npm install`
   - **Start Command**: `node chatbot/bot-telegram.js`
   - **Instance Type**: `Free` (Gratuito)
6. Adicione a variável de ambiente:
   - Vá na aba **Environment**.
   - Adicione uma variável com chave `TELEGRAM_BOT_TOKEN` e insira o token obtido no BotFather como valor.
7. Clique em **Deploy**. A Render compilará e ativará o bot em minutos!

### Opção 2: Replit (Rápido e Interativo)
1. Crie uma conta em [replit.com](https://replit.com).
2. Crie um novo Repl e selecione a opção **Import from GitHub** ou crie um Repl vazio com ambiente Node.js.
3. Copie o arquivo `bot-telegram.js` e o `js/classificador.js` mantendo a estrutura de pastas.
4. No menu lateral esquerdo, vá em **Secrets** (ícone de cadeado).
5. Crie um secret:
   - **Key**: `TELEGRAM_BOT_TOKEN`
   - **Value**: `seu_token_aqui`
6. Vá na aba **Console** ou **Shell** e instale a dependência:
   ```bash
   npm install telegraf
   ```
7. Clique no botão **Run** no topo da tela. O bot estará no ar.
