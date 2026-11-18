/**
 * MathLab Aulas Visuais - Quality Audit Engine (M05: Auditoria de Qualidade v2.1 REV5)
 *
 * Revisa materiais didáticos nas 10 categorias definidas no M05,
 * diferenciando Hard Fails, Soft Warnings e Limitações Documentais.
 */

import { getAdapterById, getAdapterByArea, normalizeText, GROUPS } from '../adapters/disciplineAdapters.js';

export const AUDIT_CATEGORIES = Object.freeze([
  'Científica',
  'Conceitual',
  'Histórica',
  'Normativa',
  'Pedagógica',
  'Didática',
  'Matemática',
  'Documental',
  'Editorial',
  'Acessibilidade'
]);

const GENERIC_PLACEHOLDER_PATTERNS = [
  { pattern: /Passo 1:\s*Identificar variáveis e condições/i, label: 'Roteiro genérico de exemplo ("Passo 1: Identificar variáveis...")' },
  { pattern: /Passo 2:\s*Aplicar o modelo conceitual/i, label: 'Roteiro genérico de exemplo ("Passo 2: Aplicar o modelo conceitual")' },
  { pattern: /Interpretar situação-problema envolvendo/i, label: 'Meta-instrução genérica no lugar de atividade real' },
  { pattern: /Converter o problema de .* para tabela/i, label: 'Meta-instrução genérica no lugar de atividade real' },
  { pattern: /Resolver e justificar caso novo sem roteiro/i, label: 'Meta-instrução genérica no lugar de exercício concreto' },
  { pattern: /Desenvolvimento conceitual de .* articulando definição, propriedades essenciais/i, label: 'Texto genérico sem desenvolvimento conceitual real' }
];

/**
 * Valida se o material didático possui conteúdo real, completo e verificável
 * antes de autorizar aprovação ou exportação.
 */
const SKELETON_MARKER = '[ESQUELETO]';

/**
 * Fase 2: completude de materiais com perfil estrutural (não didáticos).
 * Exige as seções do perfil e conteúdo real nelas; NÃO exige exemplos resolvidos, gabarito, DUA ou SVG.
 */
function validateProfileCompleteness(material) {
  const blocks = Array.isArray(material?.blocks) ? material.blocks : [];
  const profile = material.structureProfile;
  const byType = new Map(blocks.map((b) => [b.sectionType, b]));
  const issues = [];
  const warnings = [];
  const missingSections = [];
  const genericBlocks = [];

  for (const type of profile.requiredSections || []) {
    const blk = byType.get(type);
    if (!blk) {
      missingSections.push(type);
      issues.push({
        category: 'Editorial',
        ruleId: 'PERFIL_SECAO_AUSENTE',
        location: type,
        problem: `Seção obrigatória do perfil "${profile.label}" ausente.`,
        recommendedFix: 'Restaurar a seção ou escolher outro perfil documental.'
      });
      continue;
    }
    const body = String(blk.body || '');
    if (body.includes(SKELETON_MARKER)) {
      missingSections.push(blk.title);
      issues.push({
        category: 'Editorial',
        ruleId: 'PERFIL_SECAO_EM_ESQUELETO',
        location: blk.title,
        problem: 'Seção ainda em esqueleto: contém apenas perguntas orientadoras, sem conteúdo desenvolvido.',
        recommendedFix: 'Desenvolver a seção com fontes identificadas (edição manual ou rascunho de IA autorizado) e remover a marca [ESQUELETO].'
      });
    } else if (body.trim().length < 40) {
      missingSections.push(blk.title);
      issues.push({
        category: 'Conceitual',
        ruleId: 'PERFIL_SECAO_CURTA',
        location: blk.title,
        problem: 'Seção com conteúdo insuficiente (< 40 caracteres).',
        recommendedFix: 'Desenvolver a seção com conteúdo substantivo.'
      });
    }
    for (const { pattern, label } of GENERIC_PLACEHOLDER_PATTERNS) {
      if (pattern.test(body)) {
        genericBlocks.push(blk.title);
        issues.push({
          category: 'Editorial',
          location: blk.title,
          problem: `Conteúdo genérico detectado: ${label}.`,
          recommendedFix: 'Substituir por conteúdo específico do tema.'
        });
        break;
      }
    }
  }

  const aiBlocks = blocks.filter((b) => b.contentOrigin === 'IA_EXTERNA_RASCUNHO_A_REVISAR');
  if (aiBlocks.length > 0) {
    warnings.push({
      category: 'Documental',
      location: aiBlocks.map((b) => b.title).join('; '),
      problem: `${aiBlocks.length} seção(ões) vieram de rascunho de IA externa e não foram verificadas contra fontes.`,
      recommendedFix: 'Conferir autoria, obras, datas e citações em fonte primária antes de publicar; não tratar o rascunho como fonte.'
    });
  }

  return { complete: issues.length === 0, missingSections, genericBlocks, issues, warnings };
}

export function validateMaterialCompleteness(material, context = {}) {
  if (material?.structureProfile) return validateProfileCompleteness(material);
  const blocks = Array.isArray(material?.blocks) ? material.blocks : [];
  const byType = new Map();
  for (const blk of blocks) {
    if (blk?.sectionType) byType.set(blk.sectionType, blk);
  }

  const titleText = String(material?.title || '').toLowerCase();
  const discText = String(context?.discipline || titleText).toLowerCase();
  const legacyHumanities = /(filosofia|hist[óo]ria|sociologia|l[íi]ngua portuguesa|literatura)/i.test(discText);
  // Fase 3: a política vem do adaptador da área (context.visual); sem ela, vale o critério legado por regex.
  const isHumanities = context?.visual ? context.visual === 'warning' : legacyHumanities;

  const issues = [];
  const warnings = [];
  const genericBlocks = [];
  const missingSections = [];

  for (const blk of blocks) {
    const body = String(blk?.body || '');
    for (const { pattern, label } of GENERIC_PLACEHOLDER_PATTERNS) {
      if (pattern.test(body)) {
        genericBlocks.push(blk.title || blk.sectionType || 'Bloco');
        issues.push({
          category: 'Editorial',
          location: blk.title || blk.sectionType || 'Bloco',
          problem: `Conteúdo genérico detectado: ${label}.`,
          recommendedFix: 'Substituir por explicação, exemplo resolvido ou exercício concreto sobre o tema.'
        });
        break;
      }
    }
  }

  const dev = byType.get('desenvolvimento_conceitual');
  if (!dev || String(dev.body || '').trim().length < 120) {
    missingSections.push('Desenvolvimento Conceitual');
    issues.push({
      category: 'Conceitual',
      location: 'Desenvolvimento Conceitual',
      problem: 'Explicação conceitual ausente ou insuficiente (< 120 caracteres).',
      recommendedFix: 'Elaborar desenvolvimento conceitual substantivo com definição, propriedades e exemplos.'
    });
  }

  const visual = byType.get('representacao_visual');
  if (!visual || !String(visual.svg || '').includes('<svg') || String(visual.body || '').trim().length < 20) {
    const visualIssue = {
      category: 'Editorial',
      location: 'Representação Visual Pedagógica',
      problem: 'Diagrama SVG funcional ou legenda descritiva ausente.',
      recommendedFix: 'Incluir figura SVG específica do tema com legenda pedagógica.'
    };
    if (isHumanities) {
      warnings.push(visualIssue);
    } else {
      missingSections.push('Representação Visual (SVG)');
      issues.push(visualIssue);
    }
  }

  const examples = byType.get('exemplos_resolvidos');
  const exBody = String(examples?.body || '');
  if (!examples || !/Exemplo Resolvido/i.test(exBody) || !/(Resolu[çc][ãa]o|Resposta|=)/i.test(exBody)) {
    missingSections.push('Exemplos Resolvidos');
    issues.push({
      category: 'Didática',
      location: 'Exemplos Resolvidos',
      problem: 'Exemplos resolvidos completos (enunciado, resolução e resposta) não encontrados.',
      recommendedFix: 'Incluir exemplos matemáticos resolvidos passo a passo com resposta explícita.'
    });
  }

  const exercises = byType.get('atividades_graduadas');
  const excBody = String(exercises?.body || '');
  if (!exercises || !/\b1\./.test(excBody) || !/\b2\./.test(excBody)) {
    missingSections.push('Exercícios Completos');
    issues.push({
      category: 'Didática',
      location: 'Exercícios Completos',
      problem: 'Lista de exercícios numerados completos ausente.',
      recommendedFix: 'Elaborar questões completas e graduadas aplicáveis em sala.'
    });
  }

  const gabarito = byType.get('gabarito_comentado');
  const gabBody = String(gabarito?.body || '');
  if (!gabarito || gabBody.trim().length < 40 || !/\b1\./.test(gabBody)) {
    missingSections.push('Gabarito Comentado');
    issues.push({
      category: 'Didática',
      location: 'Gabarito Comentado',
      problem: 'Gabarito comentado com respostas e justificativas ausente.',
      recommendedFix: 'Incluir respostas e justificativas conceituais para todos os exercícios.'
    });
  }

  const visAct = byType.get('atividade_visual');
  if (!visAct || String(visAct.body || '').trim().length < 40) {
    missingSections.push('Atividade Visual');
    issues.push({
      category: 'Editorial',
      location: 'Atividade Visual Prática',
      problem: 'Atividade visual prática ausente ou incompleta.',
      recommendedFix: 'Incluir atividade visual articulada à figura/diagrama da aula.'
    });
  }

  const dua = byType.get('adaptacao_dua');
  if (!dua || String(dua.body || '').trim().length < 40) {
    missingSections.push('Adaptação DUA');
    issues.push({
      category: 'Acessibilidade',
      location: 'Adaptação Pedagógica — DUA',
      problem: 'Adaptação baseada no Desenho Universal para a Aprendizagem (DUA) ausente.',
      recommendedFix: 'Incluir adaptações concretas para representação, ação/expressão e engajamento.'
    });
  }

  return {
    complete: issues.length === 0,
    missingSections,
    genericBlocks,
    issues,
    warnings
  };
}

const LESSON_NOT_REQUIRED_FOR_PROFILE = [
  'Estrutura de aula: exemplos resolvidos, atividades graduadas, gabarito e atividade visual',
  'Adaptação DUA como seção obrigatória',
  'Diagrama SVG'
];

function snippet(original, norm, index, length) {
  // Normalizar (sem acentos) preserva o comprimento quando o texto está em forma composta, o caso comum.
  if (original.length !== norm.length) return norm.slice(Math.max(0, index - 40), index + length + 60).trim();
  return original.slice(Math.max(0, index - 40), index + length + 60).replace(/\s+/g, ' ').trim();
}

/**
 * Política de auditoria da produção: quem é a área, o que se exige, o que NÃO se exige e por quê.
 */
export function resolveAuditPolicy(material, { scientific, knowledgeContext } = {}) {
  const ctx = knowledgeContext || null;
  const adapter = (ctx?.adapterId && getAdapterById(ctx.adapterId)) || (!ctx && scientific?.discipline ? getAdapterByArea(scientific.discipline) : null);
  const secondary = (ctx?.secondaryAreas || []).map((a) => getAdapterById(a.adapterId)).filter(Boolean);
  const adapters = [adapter, ...secondary].filter(Boolean).filter((a, i, arr) => arr.findIndex((b) => b.id === a.id) === i);

  const isProfile = Boolean(material?.structureProfile);
  const exactOrNatural = adapter && (adapter.group === GROUPS.EXATAS || adapter.group === GROUPS.NATURAIS);
  const visual = isProfile ? 'na' : !adapter ? 'legacy' : exactOrNatural ? 'hard' : 'warning';

  const rules = [];
  for (const a of adapters) for (const r of a.auditRules || []) if (!rules.some((x) => x.id === r.id)) rules.push(r);

  const notRequired = [];
  for (const item of adapter?.doNotRequire || []) {
    notRequired.push({ item, reason: `Não pertence ao tipo de conhecimento de ${adapter.area}.` });
  }
  if (isProfile) {
    const label = ctx?.documentType?.label || material.structureProfile.label;
    for (const item of LESSON_NOT_REQUIRED_FOR_PROFILE) {
      notRequired.push({ item, reason: `O tipo documental "${label}" não é uma aula.` });
    }
  }
  if (!isProfile && adapter && !exactOrNatural) {
    notRequired.push({ item: 'Diagrama SVG como pendência grave', reason: `Em ${adapter.area}, a ausência de figura vira advertência, não bloqueio.` });
  }

  const natures = ctx?.epistemicNatures?.length
    ? ctx.epistemicNatures.map((n) => n.label)
    : (adapter?.natures?.primary || []).map((n) => n.label);

  return {
    adapter,
    adapters,
    rules,
    visual,
    isProfile,
    notRequired,
    summary: {
      area: ctx?.area || adapter?.area || scientific?.discipline || null,
      adapterId: adapter?.id || null,
      adapterVersion: adapter?.version || null,
      documentType: ctx?.documentType?.label || material?.structureProfile?.label || (isProfile ? null : 'Roteiro de aula'),
      path: isProfile ? 'perfil' : 'aula',
      natures,
      visualPolicy: visual,
      appliedRules: rules.map((r) => r.id),
      notRequired,
      basis: adapter
        ? `Critérios do adaptador "${adapter.area}" v${adapter.version}${secondary.length ? ` e de ${secondary.map((a) => a.area).join(', ')}` : ''}.`
        : 'Área sem adaptador: aplicados apenas os critérios gerais. Confirme a área para uma auditoria mais específica.'
    }
  };
}

export function auditLessonMaterial(material, { scientific, didactic, knowledgeContext } = {}) {
  const blocks = Array.isArray(material?.blocks) ? material.blocks : [];
  const fullText = blocks.map((b) => `${b.title}\n${b.body || ''}`).join('\n\n');
  const policy = resolveAuditPolicy(material, { scientific, knowledgeContext });

  const hardFails = [];
  const softWarnings = [];
  const push = (finding) => (finding.severity === 'soft' ? softWarnings : hardFails).push(finding);

  // Regras gerais (valem em qualquer área): atribuições teóricas incorretas.
  const scaffold = fullText.match(/(vygotsky\s+(criou|formulou|cunhou)\s+.*scaffolding|scaffolding\s+foi\s+criado\s+por\s+vygotsky)/i);
  if (scaffold) {
    hardFails.push({
      category: 'Histórica',
      ruleId: 'GERAL_SCAFFOLDING_ATRIBUIDO_A_VYGOTSKY',
      location: 'Texto do material',
      problem: 'Atribuição incorreta do termo/conceito scaffolding diretamente a Vygotsky.',
      recommendedFix: 'Distinguir a ZDP (Vygotsky) da operacionalização empírica de scaffolding por Wood, Bruner & Ross (1976).',
      evidence: snippet(fullText, fullText, scaffold.index, scaffold[0].length)
    });
  }
  const zdp = normalizeText(fullText).match(/zona de desenvolvimento proximal\s+(e|eh)\s+(o mesmo que|sinonimo de|igual a|equivalente a)\s+scaffolding/);
  if (zdp) {
    hardFails.push({
      category: 'Conceitual',
      ruleId: 'GERAL_ZDP_CONFUNDIDA_COM_SCAFFOLDING',
      location: 'Texto do material',
      problem: 'Confunde a Zona de Desenvolvimento Proximal com scaffolding.',
      recommendedFix: 'A ZDP é um conceito de Vygotsky; scaffolding é a operacionalização de Wood, Bruner & Ross (1976). Não são sinônimos.',
      evidence: snippet(fullText, normalizeText(fullText), zdp.index, zdp[0].length)
    });
  }

  // Regras da área (adaptadores): só falhas reais, cada uma com a evidência encontrada no texto.
  const scannable = blocks.filter((b) => b.sectionType !== 'cuidados_epistemologicos' && !String(b.body || '').includes('[ESQUELETO]'));
  const scanText = scannable.map((b) => `${b.title}\n${b.body || ''}`).join('\n\n');
  const scanNorm = normalizeText(scanText);
  const rules = [...policy.rules];
  // Sem adaptador, mantém-se a verificação numérica legada (compatibilidade com a v1.5).
  if (!policy.adapter && !policy.isProfile) {
    rules.push({
      id: 'MAT_DIVISAO_POR_ZERO',
      severity: 'hard',
      category: 'Matemática',
      pattern: '/\\s*0(?![.,\\d])',
      unless: 'nao existe divisao por zero|proibid|diferente de zero|denominador (nao pode|e)',
      problem: 'Possível divisão por zero sem ressalva explícita.',
      fix: 'Verificar o domínio da expressão e explicitar a restrição de denominador diferente de zero.'
    });
  }
  for (const r of rules) {
    // A ressalva (unless) precisa estar no texto do autor: o texto gerado pelo próprio app (cuidados da área,
    // esqueletos) pode conter palavras como "revogados" e não conta como ressalva ao que o autor escreveu.
    if (r.unless && new RegExp(r.unless).test(scanNorm)) continue;
    const re = new RegExp(r.pattern, 'g');
    const matches = [...scanNorm.matchAll(re)];
    if (matches.length === 0) continue;
    const first = matches[0];
    const where = scannable.find((b) => new RegExp(r.pattern).test(normalizeText(`${b.title}\n${b.body || ''}`)));
    push({
      severity: r.severity,
      category: r.category,
      ruleId: r.id,
      location: where?.title || 'Texto do material',
      problem: r.problem + (matches.length > 1 ? ` (${matches.length} ocorrências)` : ''),
      recommendedFix: r.fix,
      evidence: snippet(scanText, scanNorm, first.index, first[0].length),
      ...(r.source ? { source: r.source } : {})
    });
  }

  const refs = scientific?.references || [];
  const unverifiedRefs = refs.filter((r) => r.accessState !== 'Integral');
  if (unverifiedRefs.length > 0) {
    softWarnings.push({
      category: 'Documental',
      ruleId: 'DOC_FONTES_SEM_ACESSO_INTEGRAL',
      location: 'Referências e limitações documentais',
      problem: `${unverifiedRefs.length} referência(s) não possuem acesso "Integral" (${unverifiedRefs.map((r) => r.accessState).join(', ')}).`,
      recommendedFix: 'Manter o nível de acesso declarado e verificar fontes primárias antes de publicação final.'
    });
  }
  // Documento investigativo sem nenhuma fonte registrada: exigência diferente da de uma atividade escolar original.
  if (policy.isProfile && knowledgeContext?.needsExternalResearch && refs.length === 0) {
    softWarnings.push({
      category: 'Documental',
      ruleId: 'DOC_SEM_FONTES_REGISTRADAS',
      location: 'Fontes e limitações documentais',
      problem: 'Documento investigativo sem nenhuma fonte registrada.',
      recommendedFix: 'Registrar as obras consultadas com autoria, ano, DOI ou ISBN e nível de acesso. O app não inventa referências.'
    });
  }

  if (didactic && !didactic.partA_didacticArchitecture?.coherenceChecked) {
    hardFails.push({
      category: 'Didática',
      location: 'Matriz de Alinhamento Construtivo',
      problem: 'Lacuna entre objetivos de aprendizagem, atividades e critérios de avaliação.',
      recommendedFix: 'Garantir que todo objetivo tenha atividade, evidência e critério correspondente.'
    });
  }

  const hasSvgWithoutDesc = blocks.some((b) => b.svg && (!b.body || b.body.trim().length < 10));
  if (hasSvgWithoutDesc) {
    softWarnings.push({
      category: 'Acessibilidade',
      location: 'Bloco visual (SVG)',
      problem: 'Elemento gráfico sem descrição textual pedagógica suficiente.',
      recommendedFix: 'Adicionar legenda explicativa descrevendo o significado didático da figura.'
    });
  }

  if (blocks.length < 4) {
    softWarnings.push({
      category: 'Editorial',
      location: 'Estrutura geral',
      problem: 'Material possui menos de 4 blocos estruturados.',
      recommendedFix: 'Avaliar inclusão de objetivos, exemplos ou avaliação formativa se pertinente.'
    });
  }

  const completeness = validateMaterialCompleteness(material, {
    discipline: scientific?.discipline,
    visual: policy.visual === 'hard' ? 'hard' : policy.visual === 'warning' ? 'warning' : undefined
  });
  for (const issue of completeness.issues) hardFails.push(issue);
  for (const w of completeness.warnings || []) softWarnings.push(w);

  const profile = material?.structureProfile;
  const progress = profile
    ? {
        totalSections: (profile.requiredSections || []).length,
        pendingSections: completeness.missingSections.length,
        developedSections: Math.max(0, (profile.requiredSections || []).length - completeness.missingSections.length)
      }
    : null;

  const status = hardFails.length > 0 ? 'REPROVADO_HARD_FAIL' : softWarnings.length > 0 ? 'APROVADO_COM_RESSALVAS' : 'APROVADO';

  return {
    moduleRef: 'M05 Auditoria de Qualidade (v2.1 CANDIDATA REV5) + auditoria contextual (Fase 3)',
    auditedAt: new Date().toISOString(),
    categoriesCovered: AUDIT_CATEGORIES,
    status,
    hardFails,
    softWarnings,
    completeness,
    policy: policy.summary,
    progress,
    autoApprovalBlocked: hardFails.length > 0
  };
}
