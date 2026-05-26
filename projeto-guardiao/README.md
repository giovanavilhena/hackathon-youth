# Guardião da Rede — Central Comunitária de Proteção Contra Golpes Virtuais

Este projeto é um MVP (Mínimo Produto Viável) desenvolvido para o hackathon **"Cidadão na Rede - FIB16"** em Belém/PA. A plataforma adota uma **estética retrô dos anos 2000 (Y2K / Windows 2000)** com a mascote **Capi** (a capivara investigadora), voltada à inclusão digital e acessibilidade comportamental de pessoas leigas e idosas.

O principal objetivo do **Guardião da Rede** é transformar a conscientização passiva e massificada sobre golpes cibernéticos em um ecossistema ativo de **Crowdreport** (denúncias comunitárias anônimas com suporte a fóruns e comentários) e **Letramento Digital**, com recomendações de segurança personalizadas.

---

## 🏛️ Fundamentação: Alinhamento com o Decálogo de Princípios do CGI.br / NIC.br

O projeto foi concebido sob a luz do **Decálogo de Princípios para a Governança e Uso da Internet no Brasil** elaborado pelo Comitê Gestor da Internet no Brasil (CGI.br). A arquitetura do MVP reflete as seguintes diretrizes éticas e técnicas do terceiro setor:

### 1. Inviolabilidade e Segurança (Princípio 7)
*   **Implementado no MVP:** O sistema atua como um escudo preventivo ativo, classificando na hora o nível de risco de mensagens/comprovantes suspeitos recebidos por cidadãos leigos, gerando alertas rápidos e guias de segurança sob medida para evitar perdas financeiras e roubo de dados.
*   **Visão de Futuro:** Desenvolvimento de mecanismos de alerta integrados e boletins de golpes locais georreferenciados para prever vetores de ataques emergentes em bairros específicos.

### 2. Liberdade, Privacidade e Direitos Humanos (Princípio 1)
*   **Implementado no MVP:** Proteção estrita do anonimato das vítimas. A plataforma **não exige cadastros, CPF ou dados de identificação** para enviar denúncias ou realizar comentários, reduzindo a barreira psicológica do constrangimento social que frequentemente desencoraja a notificação de golpes bem-sucedidos.
*   **Visão de Futuro (Criptografia de Ponta a Ponta):** Integração com a **Web Crypto API** para criptografar relatos diretamente no navegador do usuário antes do envio. Somente analistas autorizados portando chaves privadas correspondentes conseguirão descriptografar e auditar os relatos textuais originais.

### 3. Padronização, Interoperabilidade e Software Livre (Princípio 9)
*   **Implementado no MVP:** A aplicação foi escrita inteiramente em tecnologias web abertas padrões (HTML5, CSS3, JavaScript puro) sem dependências pesadas de frameworks proprietários ou restritivos. Toda a lógica do classificador roda localmente de forma limpa.
*   **Visão de Futuro:** O projeto está estruturado para distribuição e licenciamento de código aberto (Software Livre - GPL v3), assegurando que governos, ONGs e comunidades possam auditar, rodar e adaptar seus próprios servidores do Guardião da Rede livremente.

### 4. Universalidade e Inclusão (Princípio 3)
*   **Implementado no MVP:** A interface skeuomórfica estilo Windows 2000 resgata elementos visuais tradicionais e legíveis conhecidos por públicos com menor intimidade digital. O código-fonte prioriza tags HTML5 semânticas, alto contraste visual e leveza de rede para garantir acessibilidade universal e compatibilidade nativa com leitores de tela básicos.

---

## 📂 Arquitetura do Projeto

```text
/projeto-guardiao/
├── index.html            # Área de Trabalho - Página Inicial Y2K com a mascote Capi
├── relato.html           # Formulário de Relato Anônimo com drag-and-drop de imagem
├── triagem.html          # Fluxo "Akinator" de triagem sociodemográfica
├── resultado.html        # Diagnóstico final de risco, táticas e recomendações de Capi
├── historico.html        # Banco de Relatos da Comunidade com comentários anônimos
├── hub.html              # Dicionário Temático de Golpes (WhatsApp, Bancos, etc.)
├── letramento.html       # Letramento Digital e detalhamento do Decálogo do CGI.br
├── css/
│   └── estilo.css        # Design System Windows 2000 (beveled borders, Tahoma, VT323)
├── js/
│   ├── classificador.js  # Motor de classificação semântica e pesos demográficos
│   ├── triagem.js        # Controle do questionário e inserção na base local
│   └── api.js            # Integração com a API do Google Gemini (IA)
├── imagens/
│   └── capi_detective.png # Imagem pixel art da mascote Capi
├── chatbot/
│   ├── bot-telegram.js   # Script Node.js para o bot do Telegram
│   └── README-bot.md     # Instruções de deploy do bot (Render / Replit)
├── .env.example          # Modelo de chaves de API
└── README.md             # Este guia
```

---

## 💾 Banco de Dados Local (Crowdreport)

O histórico comunitário de relatos e a respectiva seção de comentários anônimos operam por meio do **`localStorage`** do navegador. 
- No primeiro carregamento, o site auto-inicializa a base com **relatos de simulação reais** compilados a partir de relatórios da Febraban e CERT.br (como falsas centrais e clone de WhatsApp).
- Denúncias submetidas no formulário são indexadas com IDs dinâmicos e entram automaticamente no feed do histórico público.
- Qualquer usuário do histórico público pode enviar comentários de alerta ou dicas úteis em qualquer relato. Os comentários persistem no navegador em tempo real.

*Nota técnica para a banca: Em ambiente de produção de larga escala, o `localStorage` seria substituído por bancos de dados distribuídos e P2P (como OrbitDB e IPFS) para garantir que nenhuma entidade corporativa centralizada possa apagar ou censurar denúncias coletivas da população.*

---

## 💻 Executando e Testando Localmente

### Servidor Local Recomendado:
Para visualizar a navegação e as transições do fórum de histórico com a persistência de comentários de forma fluida:
```bash
# Entre na pasta
cd ./projeto-guardiao

# Rode um servidor estático
npx http-server -p 8080
```
Acesse `http://localhost:8080` no seu navegador.

---

## 🚀 Publicação/Deploy do MVP
O site está pronto para deploy gratuito em plataformas de hospedagem estática. Basta arrastar a pasta `/projeto-guardiao` para o dashboard da **Vercel** ou **Netlify**, ou configurar como branch principal no **GitHub Pages** para gerar um link HTTPS ativo em segundos.
