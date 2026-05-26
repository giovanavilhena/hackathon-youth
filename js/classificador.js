/**
 * Guardião da Rede — Motor de Classificação de Golpes
 * 
 * Este arquivo contém a base de dados de táticas de fraudes,
 * com novas categorias integradas (vagas online, encomendas, facial, exames, processos)
 * e o motor lógico com suporte a dados expostos (MEI, Sócio, Influenciador).
 */

const CARACTERISTICAS_GOLPES = [
  {
    id: "urgencia",
    nome: "Urgência ou Ameaça Artificial",
    descricao: "Pressão temporal ou judicial forçando uma decisão rápida (ex: bloqueio de conta, penhora, cirurgia urgente).",
    palavrasChave: ["bloqueado", "cancelamento", "bloqueada", "urgente", "imediatamente", "cancelar", "clique rápido", "30 minutos", "regularizar", "prazo", "expira", "penhora", "bloqueio judicial", "mandado de prisão", "cirurgia de emergência", "risco de vida"],
    exemplo: "Seu acesso ao banco será bloqueado em 30 minutos. Clique aqui para regularizar."
  },
  {
    id: "oferta_vantajosa",
    nome: "Oferta Muito Vantajosa / Renda Fácil",
    descricao: "Promessa de retornos financeiros surreais (como tarefas online lucrativas ou aparelhos com 70% de desconto).",
    palavrasChave: ["ganhar", "ganhe", "sorteio", "invista", "receba", "retorno", "dinheiro fácil", "promessa", "multiplicar", "rendimento", "ganhei", "duplicar", "fique rico", "tarefas diárias", "comissão por vídeo", "vaga remota de meio período"],
    exemplo: "Ganhe R$ 300 por dia assistindo vídeos do YouTube de casa. Faça um depósito de garantia de R$ 20."
  },
  {
    id: "dados_sensiveis",
    nome: "Solicitação de Dados ou Reconhecimento Facial",
    descricao: "Tentativa de obter senhas, CPF, fotos de documentos ou selfies de validação facial.",
    palavrasChave: ["cpf", "rg", "senha", "cartão de crédito", "dados pessoais", "foto do rg", "documento", "confirmar dados", "recadastrar", "atualização cadastral", "selfie", "reconhecimento facial", "olhar para a câmera", "foto do rosto", "girar o rosto"],
    exemplo: "Suposto atendente pede que você faça um reconhecimento facial na câmera do celular para 'desbloquear' a conta bancária."
  },
  {
    id: "erros_formatacao",
    nome: "Erros Gramaticais e Formatação Suspeita",
    descricao: "Comunicações oficiais escritas com gírias, abreviações incomuns (ex: 'VC') ou formatações desalinhadas.",
    palavrasChave: ["vcs", "vc", "erros de português", "abreviação", "logotipo borrado", "erro ortográfico"],
    exemplo: "Comunicado jurídico escrito com erros gramaticais gritantes solicitando Pix."
  },
  {
    id: "falsa_autoridade",
    nome: "Falsa Autoridade (Advogados/Fiscais/Bancos)",
    descricao: "Criminosos fingindo ser gerentes, policiais, oficiais de justiça, advogados ou médicos.",
    palavrasChave: ["gerente", "funcionário", "central", "banco", "polícia federal", "investigação", "receita federal", "suporte técnico", "atendente", "juiz", "delegado", "oficial de justiça", "advogado", "dr.", "médico", "clínica"],
    exemplo: "Mensagem de WhatsApp de um suposto escritório de advocacia alegando custas judiciais pendentes."
  },
  {
    id: "pagamento_antecipado",
    nome: "Pagamento Antecipado (Depósito Prévio/Custas)",
    descricao: "Cobrança de taxas de reenvio, fretes de prêmios, seguros de empréstimos ou custas processuais prévias.",
    palavrasChave: ["frete", "taxa", "pagamento antecipado", "adiantado", "pagar antes", "taxa de liberação", "custo de envio", "depósito prévio", "custas judiciais", "depósito de segurança", "pagar pix de garantia"],
    exemplo: "Taxa cobrada de forma antecipada para liberar o reenvio de um pacote preso nos Correios."
  },
  {
    id: "anexo_inesperado",
    nome: "Anexo ou Link Inesperado",
    descricao: "Links encurtados ou arquivos suspeitos (como laudos em PDF/EXE que instalam vírus ou roubam dados).",
    palavrasChave: ["link encurtado", "anexo", "nota fiscal", "pdf", ".exe", "clique no link", "baixe o arquivo", "instalador", "laudo anexo", "resultados_exame"],
    exemplo: "E-mail com falso resultado de exame de saúde solicitando clique em link externo para ver laudo clínico."
  },
  {
    id: "isolamento",
    nome: "Isolamento e Sigilo",
    descricao: "Instrução para que a vítima mantenha segredo e não fale com familiares ou gerentes reais.",
    palavrasChave: ["segredo", "sigiloso", "não conte", "investigação sigilosa", "obstrução", "familiar", "amigos", "sem contar"],
    exemplo: "O falso funcionário instrui que você não converse com ninguém nem desligue o telefone até fazer a operação."
  },
  {
    id: "pressao_emocional",
    nome: "Pressão Emocional / Diagnósticos Graves",
    descricao: "Apelo sentimental simulando acidentes familiares ou diagnósticos de saúde urgentes.",
    palavrasChave: ["filho", "filha", "pai", "mãe", "acidente", "sequestro", "ajuda urgente", "bati o carro", "doença grave", "câncer", "cirurgia rápida", "leito de hospital", "emergência de saúde"],
    exemplo: "Golpista liga alegando ser de laboratório e avisa sobre resultado alarmante de exame de saúde da vítima."
  },
  {
    id: "erro_canal",
    nome: "Erro de Canal (Migração de Conversa)",
    descricao: "Tentativa de transferir o contato do chat oficial de uma plataforma para canais pessoais (como o WhatsApp).",
    palavrasChave: ["olx", "marketplace", "mercado livre", "migrar conversa", "whatsapp particular", "contato fora", "meu número"],
    exemplo: "O comprador pede para fechar negócio fora do Mercado Livre."
  }
];

const AREAS_GOLPES = [
  {
    id: "whatsapp",
    nome: "Fraudes em WhatsApp e Aplicativos de Mensagens",
    descricao: "Clonagem de conta ou criação de perfil falso se passando por familiar/amigo pedindo Pix urgente.",
    perfilVitima: "Extremos da pirâmide (jovens 16-29 e idosos 60+).",
    palavrasChave: ["whatsapp", "familiar", "amigo", "mãe", "pai", "filho", "filha", "mudei de número", "novo número", "celular novo", "meu celular quebrou", "pix", "transferência"],
    recomendacao: [
      "Nunca envie dinheiro ou faça transferências baseando-se apenas em mensagens de texto ou áudios suspeitos.",
      "Ligue imediatamente para o número habitual do seu familiar para confirmar a história.",
      "Ative a verificação em duas etapas no seu aplicativo de WhatsApp."
    ]
  },
  {
    id: "ecommerce",
    nome: "Comércio Eletrônico Fraudulento (Falsas Vendas)",
    descricao: "Lojas online falsas, anúncios com preços irreais, golpes na entrega física ou taxas de reenvio de encomendas.",
    perfilVitima: "Adultos de 30 a 59 anos ativos em compras online.",
    palavrasChave: ["loja falsa", "anúncio", "desconto", "promoção", "abaixo do preço", "comprar", "olx", "marketplace", "maquininha", "maquininha com defeito", "frete", "boleto", "entrega", "reenvio de encomenda", "retirada de pacote", "taxa de entrega"],
    recomendacao: [
      "Desconfie de ofertas excessivamente baratas. Verifique a reputação no site Reclame Aqui.",
      "Nunca pague taxas adicionais cobradas por motoboys ou e-mails de entrega sem checar no rastreamento oficial.",
      "Confira o valor no visor da maquininha de cartão antes de digitar sua senha ou aproximar."
    ]
  },
  {
    id: "bancos",
    nome: "Engenharia Social Bancária / Reconhecimento Facial",
    descricao: "Golpe da falsa central bancária ou indução ao reconhecimento facial para contratação de empréstimos falsos.",
    perfilVitima: "Principalmente idosos (60+) e pensionistas.",
    palavrasChave: ["central do banco", "gerente", "funcionário", "falsa central", "transação suspeita", "segurança da conta", "teste de token", "fazer transferência", "conta de segurança", "reconhecimento facial", "selfie", "tirar foto do rosto", "foto de segurança"],
    recomendacao: [
      "Bancos NUNCA pedem transferências Pix de segurança nem selfies fora do aplicativo oficial da própria instituição.",
      "Desconfie se ligarem solicitando que faça uma selfie para 'atualização de cadastro' ou 'liberação de acesso'.",
      "Se receber uma ligação suspeita, desligue imediatamente e telefone para o SAC impresso atrás do seu cartão."
    ]
  },
  {
    id: "phishing",
    nome: "Phishing e Captura de Dados Pessoais",
    descricao: "E-mails, SMS ou sites clonados imitando Correios, Governo (gov.br), Clínicas de Saúde ou Tribunais de Justiça.",
    perfilVitima: "Distribuído uniformemente entre adultos de todas as idades.",
    palavrasChave: ["correios", "receita federal", "taxa", "multa", "alfândega", "liberação de encomenda", "gov.br", "link de acesso", "atualização", "sms do banco", "e-mail falso", "site clonado", "exame médico", "laudo clínico", "resultado de exame", "processo judicial", "intimidação", "bloqueio judicial", "penhora"],
    recomendacao: [
      "Não clique em links de SMS/E-mail alegando encomendas retidas, processos em aberto ou exames prontos.",
      "Para rastrear encomendas, acesse o portal oficial dos Correios. Para exames de saúde, ligue na clínica habitual.",
      "Consultas processuais reais devem ser feitas diretamente no site oficial do Tribunal de Justiça (dominados por '.jus.br')."
    ]
  },
  {
    id: "relacionamento",
    nome: "Vagas Online Falsas / Relacionamento e Investimento",
    descricao: "Golpes de catfishing, promessas de ganhos de investimentos rápidos ou falsas vagas de emprego com depósito prévio.",
    perfilVitima: "Geração Z (16-29 anos) é a mais vulnerável por excesso de confiança digital.",
    palavrasChave: ["tinder", "namorado", "romance", "investimento milagroso", "ganho fácil", "vaga de emprego", "trabalhar de casa", "tarefas diárias", "comissão por curtidas", "assinar contrato", "pagar taxa de inscrição", "comprar kit inicial"],
    recomendacao: [
      "Nenhuma vaga de emprego legítima exige que você pague taxas de inscrição, compre kits de trabalho ou faça Pix de garantia.",
      "Desconfie de ofertas de trabalho fáceis pelo WhatsApp/Telegram prometendo comissões para curtir vídeos.",
      "Nunca envie dinheiro ou faça investimentos indicados por contatos de redes sociais ou parceiros virtuais."
    ]
  }
];

/**
 * Função principal do classificador.
 * Analisa o relato e a triagem, aplicando regras de dados expostos (MEI, Sócio, Influencer).
 */
function analisarRelatoLocal(titulo, descricao, triagem) {
  const textoCompleto = `${titulo.toLowerCase()} ${descricao.toLowerCase()}`;
  
  let scoreTotal = 15; // Pontuação base
  let caracteristicasDetectadas = [];
  let areasDetectadas = [];
  
  // 1. Analisa características do golpe
  CARACTERISTICAS_GOLPES.forEach(carac => {
    let matchCount = 0;
    carac.palavrasChave.forEach(palavra => {
      if (textoCompleto.includes(palavra)) {
        matchCount++;
      }
    });
    
    if (matchCount > 0) {
      const peso = matchCount >= 2 ? 20 : 12;
      scoreTotal += peso;
      caracteristicasDetectadas.push({
        id: carac.id,
        nome: carac.nome,
        descricao: carac.descricao,
        exemplo: carac.exemplo,
        intensidade: matchCount
      });
    }
  });
  
  // 2. Analisa a área/tipo de golpe predominante
  let areaMaisProvavel = null;
  let maxAreaScore = 0;
  
  AREAS_GOLPES.forEach(area => {
    let areaScore = 0;
    area.palavrasChave.forEach(palavra => {
      if (textoCompleto.includes(palavra)) {
        areaScore += 10;
      }
    });
    
    // Se o canal da triagem bater com a área, incrementa
    if (triagem && triagem.canal) {
      const canal = triagem.canal.toLowerCase();
      if (area.id === "whatsapp" && canal.includes("whatsapp")) areaScore += 25;
      if (area.id === "ecommerce" && (canal.includes("rede social") || canal.includes("venda"))) areaScore += 20;
      if (area.id === "bancos" && (canal.includes("ligação") || canal.includes("sms"))) areaScore += 25;
      if (area.id === "phishing" && (canal.includes("e-mail") || canal.includes("sms") || canal.includes("ligação"))) areaScore += 20;
      if (area.id === "relacionamento" && (canal.includes("rede social") || canal.includes("outro"))) areaScore += 15;
    }
    
    if (areaScore > 0) {
      areasDetectadas.push({
        id: area.id,
        nome: area.nome,
        score: areaScore
      });
      
      if (areaScore > maxAreaScore) {
        maxAreaScore = areaScore;
        areaMaisProvavel = area;
      }
    }
  });
  
  if (areasDetectadas.length > 0) {
    scoreTotal += Math.min(areasDetectadas.length * 10, 30);
  }
  
  // 3. Modificador de vulnerabilidade e dados expostos (MEI, Sócio, Influenciador)
  let modificadorDemografico = 0;
  let justificativasVulnerabilidade = [];
  
  if (triagem) {
    const idade = triagem.idade;
    const canal = triagem.canal ? triagem.canal.toLowerCase() : "";
    const familiaridade = triagem.familiaridade ? triagem.familiaridade.toLowerCase() : "";
    const exposicaoDados = triagem.exposicaoDados; // MEI, Sócio, Influenciador, Nenhum
    
    if (familiaridade === "baixo") {
      scoreTotal += 10;
    }
    
    // Análise de Exposição de Dados
    if (exposicaoDados === "MEI" || exposicaoDados === "Socio") {
      // MEIs/Sócios são alvos de golpes bancários, cobranças judiciais e marcas falsas
      if (textoCompleto.includes("banco") || textoCompleto.includes("central") || textoCompleto.includes("judicial") || textoCompleto.includes("taxa") || textoCompleto.includes("processo") || textoCompleto.includes("receita")) {
        scoreTotal += 15;
        justificativasVulnerabilidade.push(
          "Vulnerabilidade cadastral (MEI/Sócio): Seus dados empresariais (CNPJ, razão social, telefone corporativo) são públicos e estão expostos em cadastros comerciais. Golpistas utilizam essa exposição para ligar se passando por centrais jurídicas de bancos corporativos, oficiais de justiça ou fiscais da Receita Federal."
        );
        if (!areaMaisProvavel) {
          areaMaisProvavel = AREAS_GOLPES.find(a => a.id === "bancos" || a.id === "phishing");
        }
      }
    } else if (exposicaoDados === "Influencer") {
      // Influenciadores são alvos de phishing de parcerias comerciais nas redes
      if (canal.includes("rede social") || canal.includes("e-mail") || textoCompleto.includes("link") || textoCompleto.includes("parceria") || textoCompleto.includes("marca")) {
        scoreTotal += 15;
        justificativasVulnerabilidade.push(
          "Vulnerabilidade cadastral (Influenciador): Seus dados de contato profissional (e-mail comercial, telefone) estão públicos nas biografias de suas redes sociais. Golpistas usam essa exposição enviando propostas de publicidade falsas contendo links que sequestram contas."
        );
        if (!areaMaisProvavel) {
          areaMaisProvavel = AREAS_GOLPES.find(a => a.id === "phishing" || a.id === "relacionamento");
        }
      }
    }
    
    // Cruzamento Idosos (60+)
    if (idade === "60+") {
      if (canal.includes("ligação") || canal.includes("telefone")) {
        scoreTotal += 15;
        justificativasVulnerabilidade.push(
          "Risco demográfico: Idosos no canal telefônico são os alvos preferenciais de golpes de Falsa Central Bancária e fraudes envolvendo selfies de validação facial sob coação."
        );
        if (!areaMaisProvavel || areaMaisProvavel.id !== "bancos") {
          areaMaisProvavel = AREAS_GOLPES.find(a => a.id === "bancos");
        }
      } else if (canal.includes("whatsapp")) {
        scoreTotal += 10;
        justificativasVulnerabilidade.push(
          "Risco demográfico: Idosos no WhatsApp são os alvos preferidos de criminosos que simulam ser filhos com número novo alegando emergências financeiras."
        );
      }
    }
    
    // Cruzamento Jovens (16-29)
    if (idade === "16-29") {
      if (canal.includes("rede social") || canal.includes("outro") || textContainsVagas(textoCompleto)) {
        scoreTotal += 10;
        justificativasVulnerabilidade.push(
          "Risco demográfico: Jovens da Geração Z registram as maiores perdas financeiras em golpes de falsas vagas de emprego com tarefas pagas online e esquemas de romance virtual."
        );
        if (!areaMaisProvavel) {
          areaMaisProvavel = AREAS_GOLPES.find(a => a.id === "relacionamento");
        }
      }
    }
  }
  
  // Limita o score final
  const riscoPorcentagem = Math.min(Math.max(scoreTotal, 5), 100);
  
  let nivelRisco = "BAIXO";
  if (riscoPorcentagem >= 34 && riscoPorcentagem <= 66) {
    nivelRisco = "MÉDIO";
  } else if (riscoPorcentagem >= 67) {
    nivelRisco = "ALTO";
  }
  
  if (!areaMaisProvavel) {
    areaMaisProvavel = AREAS_GOLPES.find(a => a.id === "phishing");
  }
  
  // Gera explicação do diagnóstico
  let explicacao = "";
  if (nivelRisco === "ALTO") {
    explicacao = "Este caso possui **altíssimo risco** de ser uma tentativa de fraude digital. ";
  } else if (nivelRisco === "MÉDIO") {
    explicacao = "Este caso possui **risco médio** de fraude. Há elementos suspeitos que exigem atenção. ";
  } else {
    explicacao = "Não detectamos padrões evidentes de golpes conhecidos no seu relato, mas recomendamos cautela. ";
  }
  
  if (caracteristicasDetectadas.length > 0) {
    explicacao += `Detectamos as seguintes táticas suspeitas no texto: ` + 
      caracteristicasDetectadas.map(c => `**${c.nome}** (${c.descricao})`).join("; ") + ". ";
  }
  
  if (justificativasVulnerabilidade.length > 0) {
    explicacao += `\n\n**Análise de Vulnerabilidade:**\n` + justificativasVulnerabilidade.join("\n\n");
  }
  
  // Une recomendações
  let recomendacoesCustomizadas = [];
  if (areaMaisProvavel) {
    recomendacoesCustomizadas = [...areaMaisProvavel.recomendacao];
  }
  
  // Adiciona recomendações demográficas/exposição adicionais
  if (triagem) {
    if (triagem.exposicaoDados === "MEI" || triagem.exposicaoDados === "Socio") {
      recomendacoesCustomizadas.unshift("Se suspeitar de golpe, nunca pague taxas de associações comerciais falsas ou guias judiciais enviadas por WhatsApp. Acesse o portal oficial Simples Nacional/Gov.br.");
    }
    if (triagem.exposicaoDados === "Influencer") {
      recomendacoesCustomizadas.unshift("Nunca instale aplicativos indicados em e-mails de parcerias nem forneça chaves de acesso ao seu perfil ou códigos de SMS recebidos.");
    }
    if (triagem.idade === "60+" && (textoCompleto.includes("facial") || textoCompleto.includes("selfie") || textoCompleto.includes("foto"))) {
      recomendacoesCustomizadas.unshift("Cuidado com a 'Selfie da Selfie': Nunca tire fotos do seu rosto guiado por ligações telefônicas. Bancos não pedem selfies para cancelar transações; criminosos usam isso para aprovar empréstimos falsos.");
    }
  }
  
  recomendacoesCustomizadas.push(
    "Guarde capturas de tela (prints) da conversa, números de telefone e chaves Pix associadas.",
    "Caso tenha efetuado transferências financeiras, ligue imediatamente para o SAC do seu banco para registrar uma reclamação do Mecanismo Especial de Devolução (MED) e faça um Boletim de Ocorrência policial na delegacia virtual."
  );
  
  return {
    risco: riscoPorcentagem,
    nivel: nivelRisco,
    areaProvavel: areaMaisProvavel ? areaMaisProvavel.nome : "Desconhecido",
    areaId: areaMaisProvavel ? areaMaisProvavel.id : "phishing",
    explicacao: explicacao,
    caracteristicas: caracteristicasDetectadas,
    recomendacoes: recomendacoesCustomizadas
  };
}

function textContainsVagas(text) {
  const termos = ["vaga", "emprego", "trabalho", "comissão", "tarefa", "curtir", "vídeo", "renda", "garantia"];
  return termos.some(t => text.includes(t));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CARACTERISTICAS_GOLPES,
    AREAS_GOLPES,
    analisarRelatoLocal
  };
}
