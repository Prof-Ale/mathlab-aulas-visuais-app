/**
 * MathLab Aulas Visuais - Perfis de Produção (Fase 2, prompt mestre seções 6, 7 e 8)
 *
 * Separa a ÁREA do conhecimento do TIPO de documento: cada tipo tem sua própria estrutura.
 * O roteiro de aula (exemplos resolvidos, gabarito, DUA) continua existindo em editorialEngine.js
 * e só é usado para tipos de fato didáticos.
 *
 * PRINCÍPIO: o motor local NÃO escreve conteúdo substantivo de áreas que dependem de fontes
 * (Filosofia, Psicanálise, Neuroanatomia, Educação Especial etc.). Ele monta a estrutura,
 * as perguntas orientadoras e os cuidados epistemológicos da área, e marca as seções ainda
 * sem conteúdo com [ESQUELETO]. O conteúdo vem do autor (editor) ou de IA externa autorizada,
 * e então passa a ser rascunho a revisar. Nada é preenchido com frases genéricas.
 */

export const SKELETON_MARK = '[ESQUELETO]';
export const PROFILE_VERSION = '0.1.0';

// Tipos que continuam usando o roteiro de aula do editorialEngine (apenas quando também exigem engenharia didática).
export const LESSON_TYPE_IDS = Object.freeze(
  new Set(['apostila_didatica', 'roteiro_aula', 'caderno_atividades', 'lista_exercicios', 'avaliacao', 'material_recuperacao', 'material_revisao', 'roteiro_experimental', 'apresentacao', 'livro'])
);

const isEvidenceArea = (ctx) =>
  (ctx?.epistemicNatures || []).some((n) => n.id === 'empirico' || n.id === 'baseado_evidencias');

function skeleton(purpose, questions, extra = []) {
  return [
    `${SKELETON_MARK} Desenvolva esta seção com fontes identificadas e apague esta linha.`,
    '',
    `**Função desta seção:** ${purpose}`,
    '',
    '**Perguntas orientadoras:**',
    ...questions.map((q) => `- ${q}`),
    ...(extra.length ? ['', ...extra] : [])
  ].join('\n');
}

// Cada seção: { type, title, kind: 'gerada' | 'esqueleto', build(ctx, topic, scientific) }
const S = (type, title, purpose, questionsFn, extraFn = () => []) => ({
  type,
  title,
  kind: 'esqueleto',
  build: (ctx, topic) => skeleton(purpose, questionsFn(topic, ctx), extraFn(topic, ctx))
});
const G = (type, title, build) => ({ type, title, kind: 'gerada', build });

const representationsHint = (ctx) =>
  ctx?.adapterGuidance?.representations?.length
    ? [`**Representações adequadas à área:** ${ctx.adapterGuidance.representations.join('; ')}.`]
    : [];

// Seções geradas a partir de dados reais (contexto, adaptador, base científica). Não inventam conteúdo.
const identificacao = G('identificacao', 'Identificação e natureza do conhecimento', (ctx, topic) => {
  const natures = ctx.epistemicNatures.map((n) => `${n.label} (${n.role})`).join('; ');
  return [
    `**Área:** ${ctx.area || 'Não confirmada'}${ctx.subarea ? ` | **Subárea:** ${ctx.subarea}` : ''}`,
    `**Tema:** ${topic}`,
    `**Tipo de documento:** ${ctx.documentType.label} | **Finalidade:** ${ctx.purpose}`,
    `**Público:** ${ctx.audience} | **Profundidade:** ${ctx.depth}`,
    `**Natureza do conhecimento:** ${natures}`,
    `**Pesquisa externa:** ${ctx.needsExternalResearch ? 'recomendada para esta finalidade; não executada sem autorização expressa' : 'não necessária para esta finalidade'}`
  ].join('\n');
});

const cuidados = G('cuidados_epistemologicos', 'Cuidados epistemológicos da área', (ctx) => {
  const g = ctx.adapterGuidance;
  if (!g) {
    return [
      `A área "${ctx.area || 'não identificada'}" ainda não possui adaptador disciplinar; a natureza do conhecimento está indeterminada.`,
      ctx.clarificationQuestion ? `**Confirmação necessária:** ${ctx.clarificationQuestion}` : '',
      'Enquanto isso, valem as regras gerais: não inventar fontes, citações ou páginas; declarar o nível de acesso de cada fonte; distinguir evidência, teoria e norma.'
    ]
      .filter(Boolean)
      .join('\n\n');
  }
  const list = (arr) => arr.map((x) => `- ${x}`).join('\n');
  return [
    ctx.natureRelations.length ? `**Relações entre naturezas de conhecimento:**\n${list(ctx.natureRelations)}` : '',
    `**Cuidados para ${ctx.area}:**\n${list(g.cautions)}`,
    g.limits.length ? `**Limites do motor local:**\n${list(g.limits)}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');
});

const fontes = G('fontes_e_limitacoes', 'Fontes e limitações documentais', (ctx, topic, scientific) => {
  const refs = scientific?.references || [];
  const hints = ctx.adapterGuidance?.keyAuthorsHints || [];
  return [
    refs.length
      ? `**Referências registradas (M01):**\n${refs.map((r) => `- ${r.author} (${r.year}). *${r.title}*. [${r.evidenceType} | Acesso: ${r.accessState}]`).join('\n')}`
      : '**Referências registradas (M01):** nenhuma fonte verificada foi registrada nesta versão.',
    hints.length
      ? `**Pistas de busca (não são referências):** autores frequentemente associados à área: ${hints.join(', ')}. Consulte as obras originais e registre o nível de acesso (Integral, Parcial, Resumo, Metadados, Referência localizada ou Não verificado).`
      : '',
    scientific?.documentaryLimitations?.length ? `**Limitações documentais:**\n${scientific.documentaryLimitations.map((l) => `- ${l}`).join('\n')}` : '',
    scientific?.claimsRequiringVerification?.length ? `**Afirmações a verificar:**\n${scientific.claimsRequiringVerification.map((c) => `- ${c}`).join('\n')}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');
});

const PROFILES = {
  estudo_comparativo: {
    label: 'Estudo comparativo',
    sections: [
      identificacao,
      S('problema_e_criterios', 'Problema e critérios de comparação', 'Delimitar a pergunta que orienta a comparação e os critérios usados para comparar.', (t) => [
        `Que pergunta sobre ${t} justifica comparar estas posições?`,
        'Quais critérios (conceitos, problemas, métodos, consequências) serão usados e por que servem a todas as posições?',
        'Quais posições ou autores entram na comparação e quais ficam de fora, com qual justificativa?'
      ]),
      S('contexto_historico', 'Contexto histórico e genealogia das posições', 'Situar cada posição no seu contexto de formulação, sem anacronismo.', () => [
        'Em que contexto histórico e intelectual cada posição foi formulada?',
        'Quais obras primárias sustentam cada posição, em qual edição ou tradução e com qual nível de acesso?',
        'Que termos mudaram de sentido entre os autores ou ao longo do tempo?'
      ]),
      S('posicoes_e_conceitos', 'Exposição de cada posição', 'Expor cada posição pelos seus próprios termos antes de compará-las.', (t) => [
        `Qual é a tese central de cada posição sobre ${t}?`,
        'Quais conceitos e argumentos sustentam essa tese, segundo o texto primário?',
        'O que é afirmação do próprio autor e o que é interpretação de comentadores?'
      ]),
      S('quadro_comparativo', 'Quadro comparativo', 'Organizar a comparação segundo os critérios definidos.', () => [
        'Para cada critério, o que afirma cada posição?',
        'Que critério não se aplica a uma das posições?'
      ], (t, ctx) => representationsHint(ctx)),
      S('convergencias_divergencias', 'Convergências, divergências e falsas equivalências', 'Explicitar o que aproxima e o que separa as posições, sem igualar o que não é igual.', () => [
        'Quais convergências se sustentam nos textos primários?',
        'Quais divergências são de fundo e quais são de ênfase?',
        'Que equivalências aparentes entre conceitos de posições diferentes não se sustentam?'
      ]),
      cuidados,
      S('sintese_e_limites', 'Síntese e limites da comparação', 'Dizer o que a comparação permite concluir e o que ela não permite.', () => [
        'Que resposta a pergunta inicial recebe?',
        'Que controvérsias interpretativas permanecem em aberto?',
        'Que limites tem esta comparação (fontes consultadas, recorte)?'
      ]),
      fontes
    ]
  },
  ensaio_teorico: {
    label: 'Ensaio teórico',
    sections: [
      identificacao,
      S('tese_e_pergunta', 'Pergunta e tese', 'Formular com clareza o problema e a tese que o ensaio defende.', (t) => [
        `Qual é o problema sobre ${t} que o ensaio enfrenta?`,
        'Qual tese será defendida e a partir de quais pressupostos?'
      ]),
      S('fundamentacao_conceitual', 'Fundamentação conceitual', 'Definir os conceitos e situar sua origem.', () => [
        'Quais conceitos são indispensáveis e como cada um é definido?',
        'Quem formulou cada conceito, em qual obra e com qual sentido original?'
      ]),
      S('argumento_central', 'Argumento central', 'Desenvolver o argumento de modo que premissas e conclusão sejam identificáveis.', () => [
        'Quais são as premissas e como levam à conclusão?',
        'Que evidência, texto ou exemplo sustenta cada premissa?'
      ]),
      S('objecoes_e_respostas', 'Objeções e respostas', 'Enfrentar as melhores objeções, e não as mais fracas.', () => [
        'Que objeções sérias existem na literatura?',
        'Como o argumento responde a cada uma, e o que permanece sem resposta?'
      ]),
      cuidados,
      S('conclusao', 'Conclusão', 'Retomar a tese e delimitar seu alcance.', () => ['O que foi estabelecido e o que ficou apenas sugerido?']),
      fontes
    ]
  },
  revisao_bibliografica: {
    label: 'Revisão bibliográfica',
    sections: [
      identificacao,
      S('questao_e_escopo', 'Questão e escopo da revisão', 'Delimitar o que se quer saber e o recorte da revisão.', (t) => [
        `Qual questão sobre ${t} a revisão procura responder?`,
        'Que recorte de tempo, áreas e tipos de documento delimita o escopo?'
      ]),
      S('estrategia_de_busca', 'Estratégia de busca', 'Registrar como as fontes foram (ou serão) localizadas, para que o processo seja reproduzível.', () => [
        'Quais bases, repositórios e descritores foram usados? Este motor local não executou nenhuma busca.',
        'Quais critérios de inclusão e exclusão foram aplicados?'
      ]),
      S('corpus_e_acesso', 'Corpus e níveis de acesso', 'Listar as obras e declarar o que de fato foi lido.', () => [
        'Para cada obra: autoria, ano, veículo, DOI ou ISBN e nível de acesso (Integral, Parcial, Resumo, Metadados, Referência localizada, Não verificado).',
        'Que obras foram identificadas mas não puderam ser acessadas?'
      ]),
      S('sintese_tematica', 'Síntese temática', 'Organizar o que a literatura afirma por eixo, sem listar fichamentos.', () => [
        'Quais eixos temáticos organizam o corpus?',
        'Em cada eixo, o que há de consenso e o que é disputado?'
      ]),
      S('lacunas_e_controversias', 'Lacunas e controvérsias', 'Apontar o que falta e onde há desacordo.', () => ['Que perguntas a literatura não responde?', 'Quais divergências metodológicas ou conceituais aparecem?']),
      cuidados,
      fontes
    ]
  },
  artigo_cientifico: {
    label: 'Artigo científico',
    sections: [
      identificacao,
      S('introducao', 'Introdução', 'Apresentar o problema, sua relevância e o objetivo.', (t) => [`Qual é o problema sobre ${t} e por que ele importa?`, 'Qual é o objetivo do artigo?']),
      S('referencial_teorico', 'Referencial teórico', 'Situar o estudo na literatura relevante.', () => ['Quais obras e autores sustentam o estudo?', 'Quais conceitos serão usados e com que definição?']),
      S('metodo', 'Método', 'Descrever o procedimento de modo que possa ser avaliado.', (t, ctx) =>
        isEvidenceArea(ctx)
          ? ['Qual é o desenho da pesquisa, a amostra e os instrumentos?', 'Como os dados foram analisados e que limites o desenho impõe?']
          : ['Qual é o procedimento de análise conceitual ou documental?', 'Qual é o corpus e qual o critério para delimitá-lo?']
      ),
      S('analise_ou_resultados', 'Análise ou resultados', 'Apresentar o que foi encontrado, separando dado de interpretação.', () => ['O que foi encontrado?', 'Como separar o que é dado do que é interpretação?']),
      S('discussao', 'Discussão', 'Interpretar os achados em diálogo com a literatura.', () => ['Como os achados dialogam com a literatura?', 'Que explicações alternativas existem?']),
      S('conclusao', 'Conclusão', 'Responder ao objetivo e declarar limites.', () => ['O objetivo foi atingido?', 'Quais limites e desdobramentos futuros?']),
      cuidados,
      fontes
    ]
  },
  guia_estudo: {
    label: 'Guia de estudo',
    sections: [
      identificacao,
      S('objetivos_de_estudo', 'Objetivos de estudo', 'Dizer o que a pessoa deverá ser capaz de explicar ao final.', (t) => [`O que se espera que a pessoa explique sobre ${t}?`, 'Que conhecimentos prévios facilitam o estudo?']),
      S('mapa_de_conceitos', 'Mapa de conceitos', 'Organizar os conceitos centrais e suas relações.', (t) => [`Quais são os conceitos centrais de ${t}?`, 'Como eles se relacionam entre si?'], (t, ctx) => representationsHint(ctx)),
      S('roteiro_de_estudo', 'Roteiro de estudo', 'Propor uma ordem de estudo com sentido progressivo.', () => ['Por onde começar e por quê?', 'Que fontes consultar em cada etapa?']),
      S('autoavaliacao', 'Questões de autoavaliação', 'Permitir que a pessoa verifique se compreendeu.', () => ['Quais perguntas verificam compreensão, e não memorização?', 'Que respostas são esperadas e onde conferi-las nas fontes?']),
      cuidados,
      fontes
    ]
  },
  guia_formacao: {
    label: 'Guia de formação',
    sections: [
      identificacao,
      S('finalidade_formativa', 'Finalidade formativa', 'Dizer a quem a formação se destina e o que pretende mudar na prática.', (t) => [`Que prática profissional relacionada a ${t} a formação quer fortalecer?`, 'Qual é o ponto de partida do público?']),
      S('fundamentos', 'Fundamentos', 'Apresentar os referenciais e normas que sustentam a prática.', () => ['Quais referenciais teóricos e normativos sustentam o tema?', 'Qual é a vigência de cada norma citada?']),
      S('pratica_docente', 'Aplicação na prática', 'Traduzir os fundamentos para situações reais de trabalho.', () => ['Que situações concretas ilustram o tema?', 'Que barreiras e apoios aparecem nessas situações?']),
      S('atividades_formativas', 'Atividades formativas', 'Propor atividades que mobilizem o que foi estudado.', () => ['Quais atividades permitem aplicar o tema ao contexto do público?', 'Que evidência mostra que a formação produziu efeito?']),
      cuidados,
      fontes
    ]
  },
  relatorio_tecnico: {
    label: 'Relatório técnico',
    sections: [
      identificacao,
      S('objetivo_e_escopo', 'Objetivo e escopo', 'Delimitar o que o relatório trata e o que não trata.', (t) => [`Qual é a pergunta técnica sobre ${t}?`, 'Que situação, população ou contexto está dentro do escopo?']),
      S('metodo_de_levantamento', 'Método de levantamento', 'Informar como a informação foi obtida.', () => ['Quais fontes, instrumentos ou referenciais foram usados?', 'Que dados pessoais foram tratados e como foi preservada a confidencialidade?']),
      S('achados', 'Achados', 'Descrever o que foi encontrado, sem interpretar ainda.', () => ['O que foi observado ou levantado?']),
      S('analise', 'Análise', 'Interpretar os achados à luz dos referenciais.', () => ['Que leitura os referenciais permitem?', 'Que explicações alternativas existem?']),
      S('limitacoes_e_responsabilidade', 'Limitações e responsabilidade profissional', 'Delimitar o alcance do relatório e o escopo de atuação.', () => ['Que conclusões o relatório não sustenta?', 'Que decisões dependem de avaliação profissional presencial?']),
      S('recomendacoes', 'Recomendações', 'Propor encaminhamentos dentro do escopo, sem prescrição clínica.', () => ['Quais encaminhamentos decorrem da análise?', 'Quais precisam de validação por profissional habilitado?']),
      cuidados,
      fontes
    ]
  },
  dossie_cientifico: {
    label: 'Dossiê científico',
    sections: [
      identificacao,
      S('questao_de_pesquisa', 'Questão de pesquisa', 'Formular o que se quer esclarecer.', (t) => [`Que pergunta sobre ${t} orienta o dossiê?`]),
      S('panorama_conceitual', 'Panorama conceitual', 'Mapear conceitos, escolas e vocabulário.', () => ['Quais são os conceitos e termos centrais?', 'Como diferentes escolas ou autores os definem?']),
      S('genealogia_e_fontes_primarias', 'Genealogia e fontes primárias', 'Rastrear a origem das formulações.', () => ['Quem formulou cada ideia, quando e em qual obra?', 'Que formulações são atribuídas a quem não as fez?']),
      S('evidencias_e_controversias', 'Evidências e controvérsias', 'Separar o que está estabelecido do que é disputado.', () => ['Que tipo de evidência sustenta cada afirmação (empírica, teórica, normativa)?', 'Onde há controvérsia?']),
      cuidados,
      fontes
    ]
  },
  parecer_auditoria: {
    label: 'Parecer de auditoria',
    sections: [
      identificacao,
      S('material_examinado', 'Material examinado', 'Identificar o material auditado e sua versão.', () => ['Qual material, em qual versão, foi examinado?', 'Que partes não puderam ser examinadas?']),
      G('criterios_aplicados', 'Critérios aplicados', (ctx) => {
        const g = ctx.adapterGuidance;
        if (!g) return 'Critérios gerais: fontes rastreáveis, coerência interna, atribuição correta de autoria e declaração de limites. A área ainda não tem adaptador próprio.';
        return `**Verificar:**\n${g.auditFocus.map((x) => `- ${x}`).join('\n')}\n\n**Não exigir nesta área:**\n${g.doNotRequire.map((x) => `- ${x}`).join('\n')}`;
      }),
      S('achados', 'Achados', 'Registrar cada falha com localização e evidência identificável.', () => ['Qual é a falha, onde está e que evidência a sustenta?', 'É falha grave (Hard Fail) ou advertência (Soft Warning)?']),
      S('correcoes_recomendadas', 'Correções recomendadas', 'Dizer como corrigir cada achado.', () => ['Qual correção resolve cada achado?']),
      G('limitacoes_da_auditoria', 'Limitações da auditoria', (ctx) =>
        ['A auditoria local confere estrutura e regras explícitas; não substitui revisão por especialista da área.', ...(ctx.adapterGuidance?.limits || [])].map((x) => `- ${x}`).join('\n')
      ),
      fontes
    ]
  },
  documento_generico: {
    label: 'Documento (estrutura mínima)',
    sections: [
      identificacao,
      S('finalidade_e_escopo', 'Finalidade e escopo', 'Dizer para que serve o documento e o que ele cobre.', (t) => [`Qual é a finalidade do documento sobre ${t}?`, 'Quem o lerá e o que fará com ele?']),
      S('desenvolvimento', 'Desenvolvimento', 'Desenvolver o conteúdo na forma própria do tipo de documento.', () => ['Que estrutura o tipo de documento pede?', 'Que fontes sustentam cada afirmação?'], (t, ctx) => representationsHint(ctx)),
      cuidados,
      fontes
    ]
  }
};

export const PROFILE_IDS = Object.freeze(Object.keys(PROFILES));

export function getProfile(id) {
  return PROFILES[id] || null;
}

/**
 * Decide o caminho de produção: roteiro de aula (legado) ou perfil estrutural.
 */
export function selectProductionPath(interpreted) {
  const ctx = interpreted?.knowledgeContext;
  if (!ctx) return { path: 'lesson', profileId: null };
  const typeId = ctx.documentType?.id;
  if (LESSON_TYPE_IDS.has(typeId) && ctx.requiresDidacticEngineering) return { path: 'lesson', profileId: null };
  return { path: 'profile', profileId: PROFILES[typeId] ? typeId : 'documento_generico' };
}

export function buildProfileMaterial({ interpreted, scientific, profileId }) {
  const ctx = interpreted.knowledgeContext;
  const topic = interpreted.fields.topic;
  const profile = PROFILES[profileId] || PROFILES.documento_generico;
  const id = PROFILES[profileId] ? profileId : 'documento_generico';

  const blocks = profile.sections.map((s, i) => ({
    id: `blk-${s.type}`,
    sectionType: s.type,
    title: `${i + 1}. ${s.title}`,
    body: s.build(ctx, topic, scientific)
  }));

  return {
    moduleRef: 'M04 Design Editorial (v2.4 BASELINE) + Perfil de produção (Fase 2)',
    title: `${ctx.area || interpreted.fields.discipline}: ${topic} (${profile.label})`,
    printOptimized: true,
    blocks,
    structureProfile: {
      id,
      label: profile.label,
      version: PROFILE_VERSION,
      requiredSections: profile.sections.map((s) => s.type),
      generatedSections: profile.sections.filter((s) => s.kind === 'gerada').map((s) => s.type),
      contentOrigin: 'SINTESE_LOCAL_ESQUELETO',
      needsExternalResearch: Boolean(ctx.needsExternalResearch),
      skeletonMarker: SKELETON_MARK
    }
  };
}

export function listProfileSectionTitles(profileId) {
  const profile = PROFILES[profileId] || PROFILES.documento_generico;
  return profile.sections.filter((s) => s.kind === 'esqueleto').map((s) => s.title);
}

const normTitle = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Preenche as seções em esqueleto com um rascunho de IA externa (Markdown com títulos "## ").
 * Casa pelo título da seção; o que não casar permanece em esqueleto. O resultado é rascunho a revisar.
 */
export function applyAiDraftToProfileMaterial(material, aiText, providerMetadata = null) {
  const text = String(aiText || '').trim();
  if (!text || !material?.structureProfile) return material;

  const parts = text.split(/^##\s+/m).filter((p) => p.trim());
  const hasHeadings = /^##\s+/m.test(text);
  const sections = hasHeadings
    ? parts.map((p) => {
        const nl = p.indexOf('\n');
        return { key: normTitle(nl === -1 ? p : p.slice(0, nl)), body: (nl === -1 ? '' : p.slice(nl + 1)).trim() };
      })
    : [{ key: '', body: text }];

  const used = new Set();
  let filled = 0;
  for (const blk of material.blocks) {
    if (!String(blk.body).includes(SKELETON_MARK)) continue;
    const bt = normTitle(blk.title);
    let idx = sections.findIndex((s, i) => !used.has(i) && s.key && (s.key === bt || s.key.includes(bt) || bt.includes(s.key)));
    if (idx === -1 && !hasHeadings && filled === 0) idx = 0;
    if (idx === -1 || !sections[idx].body) continue;
    used.add(idx);
    blk.body = sections[idx].body;
    blk.contentOrigin = 'IA_EXTERNA_RASCUNHO_A_REVISAR';
    filled += 1;
  }

  if (filled > 0) {
    material.structureProfile.contentOrigin = 'IA_EXTERNA_RASCUNHO_A_REVISAR';
    material.structureProfile.aiMetadata = providerMetadata;
  }
  return material;
}
