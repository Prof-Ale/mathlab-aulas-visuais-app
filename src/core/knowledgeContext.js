/**
 * MathLab Aulas Visuais - Contexto de Conhecimento (Fase 1, prompt mestre seções 5.1 e 5.2)
 *
 * Identifica, a partir da solicitação, as dez dimensões da seção 5.2:
 * área, subárea, tema, objeto de estudo, natureza epistemológica, finalidade,
 * tipo de documento, público, profundidade e necessidade de pesquisa externa.
 *
 * Tudo roda localmente. Nenhuma chamada externa é feita aqui.
 * Toda identificação automática pode ser corrigida pelo usuário via overrides.
 */

import { EPISTEMIC_NATURES, getAdapterByArea, listAdapters, normalizeText } from '../adapters/disciplineAdapters.js';

export const KNOWLEDGE_CONTEXT_VERSION = '0.1.0';
const MIN_SCORE = 3;

const hasPattern = (norm, p) => new RegExp(`(?<![a-z0-9])(?:${p})`).test(norm);

function scoreAdapter(norm, adapter) {
  let score = 0;
  let nameHit = false;
  for (const n of adapter.names || []) {
    if (hasPattern(norm, n)) {
      score += 5;
      nameHit = true;
    }
  }
  for (const k of adapter.keywords) if (hasPattern(norm, k.p)) score += k.w;
  return { score, nameHit };
}

// Um adaptador especializado (ex.: Educação Especial) vence o adaptador pai (Educação)
// quando tem evidência forte própria; sem isso, o termo genérico mais frequente ganharia.
const SPECIALIZATION_MIN_SCORE = 5;
function promoteSpecialization(ranking) {
  const top = ranking[0];
  if (!top) return ranking;
  const child = ranking.find((r) => r.adapter.specializes === top.adapter.id && r.score >= SPECIALIZATION_MIN_SCORE);
  if (!child) return ranking;
  return [child, ...ranking.filter((r) => r !== child)];
}

function confidenceFromScore(score) {
  if (score >= 6) return 'alta';
  if (score >= MIN_SCORE) return 'media';
  return 'nenhuma';
}

/**
 * Detecta a área. overrides.area ou overrides.discipline têm precedência (correção do usuário).
 * Áreas sem adaptador continuam aceitas: o rótulo informado é mantido e a natureza fica indeterminada.
 */
export function classifyArea(rawText, overrides = {}) {
  const userArea = overrides.area || overrides.discipline || '';
  if (userArea) {
    return {
      area: String(userArea),
      adapter: getAdapterByArea(userArea),
      confidence: 'alta',
      source: 'usuario',
      ranking: []
    };
  }
  const norm = normalizeText(rawText);
  const ranking = promoteSpecialization(
    listAdapters()
      .map((adapter) => ({ adapter, ...scoreAdapter(norm, adapter) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.nameHit) - Number(a.nameHit))
  );

  const top = ranking[0];
  if (!top || top.score < MIN_SCORE) {
    return { area: null, adapter: null, confidence: 'nenhuma', source: 'automatica', ranking };
  }
  return { area: top.adapter.area, adapter: top.adapter, confidence: confidenceFromScore(top.score), source: 'automatica', ranking };
}

function detectSubarea(norm, adapter, overrides) {
  if (overrides.subarea) return { label: String(overrides.subarea), source: 'usuario' };
  if (!adapter) return { label: null, source: 'automatica' };
  let best = null;
  for (const s of adapter.subareas || []) {
    const hits = s.p.filter((p) => hasPattern(norm, p)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { label: s.label, hits };
  }
  return { label: best?.label || null, source: 'automatica' };
}

// Tipos documentais (seção 6 e 8). A ordem importa: padrões mais específicos primeiro.
// didactic: true = M03 se aplica; false = não se aplica; 'depende' = decidido pelo modo de fluxo.
export const DOCUMENT_TYPES = Object.freeze([
  { id: 'revisao_bibliografica', label: 'Revisão bibliográfica', re: /revisao (bibliografica|de literatura|sistematica)/, didactic: false, purpose: 'investigativa', research: true },
  { id: 'estudo_comparativo', label: 'Estudo comparativo', re: /estudo comparativ|analise comparativ|comparativo|comparacao entre|comparar/, didactic: false, purpose: 'investigativa', research: true },
  { id: 'artigo_cientifico', label: 'Artigo científico', re: /\bartigo\b(?! \d)/, didactic: false, purpose: 'investigativa', research: true },
  { id: 'ensaio_teorico', label: 'Ensaio teórico', re: /\bensaio/, didactic: false, purpose: 'investigativa', research: true },
  { id: 'relatorio_tecnico', label: 'Relatório técnico', re: /\brelatorio\b/, didactic: false, purpose: 'profissional', research: false },
  { id: 'manual_profissional', label: 'Manual profissional', re: /\bmanual\b(?! (do|docente))/, didactic: false, purpose: 'profissional', research: false },
  { id: 'guia_formacao', label: 'Guia de formação', re: /(material|guia|documento) de formacao|formacao (docente|de professores)/, didactic: true, purpose: 'formativa', research: false },
  { id: 'atlas_ilustrado', label: 'Atlas ilustrado', re: /\batlas\b/, didactic: false, purpose: 'consulta', research: false },
  { id: 'caderno_atividades', label: 'Caderno de atividades', re: /caderno de atividades|ficha de atividades/, didactic: true, purpose: 'educacional', research: false },
  { id: 'lista_exercicios', label: 'Lista de exercícios', re: /lista de exercicios/, didactic: true, purpose: 'educacional', research: false },
  { id: 'avaliacao', label: 'Avaliação', re: /\b(prova|simulado)\b|instrumento de avaliacao|avaliacao diagnostica/, didactic: true, purpose: 'educacional', research: false },
  { id: 'material_recuperacao', label: 'Recuperação e aprofundamento', re: /recuperacao|aprofundamento/, didactic: true, purpose: 'educacional', research: false },
  { id: 'material_revisao', label: 'Material de revisão', re: /material de revisao|revisao (do conteudo|para)/, didactic: true, purpose: 'educacional', research: false },
  { id: 'roteiro_experimental', label: 'Roteiro experimental', re: /roteiro experimental|pratica experimental|\bexperimento/, didactic: true, purpose: 'educacional', research: false },
  { id: 'divulgacao_cientifica', label: 'Material de divulgação científica', re: /divulgacao cientifica/, didactic: false, purpose: 'divulgacao', research: false },
  { id: 'documento_institucional', label: 'Documento institucional', re: /documento institucional|projeto politico|regimento|\bppp\b/, didactic: false, purpose: 'institucional', research: false },
  { id: 'guia_estudo', label: 'Guia de estudo', re: /material de estudo|guia de estudo|roteiro de leitura|guia de leitura/, didactic: 'depende', purpose: 'educacional', research: false },
  { id: 'apresentacao', label: 'Apresentação', re: /apresentacao|\bslides?\b|palestra/, didactic: 'depende', purpose: 'educacional', research: false },
  { id: 'livro', label: 'Livro', re: /\blivro\b/, didactic: 'depende', purpose: 'educacional', research: false },
  { id: 'apostila_didatica', label: 'Apostila didática', re: /apostila|material didatico|infografico/, didactic: true, purpose: 'educacional', research: false },
  { id: 'roteiro_aula', label: 'Roteiro de aula', re: /plano de aula|roteiro de aula|\baula (sobre|de)\b/, didactic: true, purpose: 'educacional', research: false }
]);

const MODE_DEFAULTS = Object.freeze({
  'Material Didático': { id: 'apostila_didatica', label: 'Apostila didática', didactic: true, purpose: 'educacional', research: false },
  Pesquisador: { id: 'dossie_cientifico', label: 'Dossiê científico', didactic: false, purpose: 'investigativa', research: true },
  Auditoria: { id: 'parecer_auditoria', label: 'Parecer de auditoria', didactic: false, purpose: 'profissional', research: false },
  Professor: { id: 'roteiro_aula', label: 'Roteiro de aula', didactic: true, purpose: 'educacional', research: false }
});

export function detectDocumentType(rawText, mode, overrides = {}) {
  if (overrides.documentType) {
    const wanted = normalizeText(overrides.documentType);
    const known = DOCUMENT_TYPES.find((d) => d.id === wanted || normalizeText(d.label) === wanted);
    if (known) return { ...known, source: 'usuario' };
    return { id: wanted.replace(/[^a-z0-9]+/g, '_'), label: String(overrides.documentType), didactic: 'depende', purpose: 'indefinida', research: false, source: 'usuario' };
  }
  const norm = normalizeText(rawText);
  const hit = DOCUMENT_TYPES.find((d) => d.re.test(norm));
  if (hit) return { ...hit, source: 'automatica' };
  return { ...(MODE_DEFAULTS[mode] || MODE_DEFAULTS.Professor), source: 'padrao_do_modo' };
}

const NATURE_RELATION_NOTES = Object.freeze({
  'empirico+formal': 'Distinguir o modelo matemático do fenômeno medido: validade formal não garante adequação empírica.',
  'baseado_evidencias+teorico': 'Separar o que tem sustentação metodológica do que é construção teórica; não tratar interpretação como resultado experimental.',
  'baseado_evidencias+profissional': 'Evidência disponível não equivale a prescrição profissional; delimitar o escopo de atuação.',
  'normativo+profissional': 'Distinguir norma vigente de prática profissional recomendada.',
  'normativo+teorico': 'Distinguir texto normativo de literatura acadêmica e verificar a vigência da norma.',
  'historico+teorico': 'Situar cada conceito em seu contexto histórico e evitar anacronismo.',
  'filosofico+historico': 'Distinguir o argumento do filósofo do contexto histórico em que foi formulado.',
  'historico+teologico': 'Distinguir o dado histórico, a tradição interpretativa e a afirmação de fé.',
  'filosofico+teologico': 'Distinguir o argumento filosófico da doutrina confessional e atribuir cada posição a quem a sustenta.',
  'baseado_evidencias+empirico': 'Indicar o desenho de pesquisa e os limites de generalização das evidências.'
});

function relationNotes(natureIds) {
  const notes = [];
  for (let i = 0; i < natureIds.length; i++) {
    for (let j = i + 1; j < natureIds.length; j++) {
      const key = [natureIds[i], natureIds[j]].sort().join('+');
      if (NATURE_RELATION_NOTES[key]) notes.push(NATURE_RELATION_NOTES[key]);
    }
  }
  return [...new Set(notes)];
}

function detectAudience(rawText, gradeLevel) {
  const norm = normalizeText(rawText);
  if (/professores|docentes|formacao docente|formacao de professores/.test(norm)) return 'Professores (formação docente)';
  if (/pos.?graduacao|mestrado|doutorado|graduacao|universitari/.test(norm)) return 'Ensino superior e pós-graduação';
  if (/profissionais|terapeutas/.test(norm)) return 'Profissionais da área';
  if (gradeLevel && !/^Não especificado/.test(gradeLevel)) return gradeLevel;
  return 'Não especificado';
}

const RESEARCH_NATURES = new Set(['teorico', 'filosofico', 'historico', 'teologico', 'normativo', 'baseado_evidencias', 'profissional']);

/**
 * Monta o contexto completo. area vem de classifyArea (chamada antes pelo interpretador).
 */
export function buildKnowledgeContext({ rawText, mode, areaDetection, topic, gradeLevel, depth, overrides = {} }) {
  const norm = normalizeText(rawText);
  const adapter = areaDetection.adapter;
  const area = areaDetection.area || null;

  const sub = detectSubarea(norm, adapter, overrides);

  // Áreas secundárias: outros adaptadores com pontuação mínima, apenas quando a área foi detectada automaticamente.
  const secondaryAreas = (areaDetection.ranking || [])
    .filter((r) => r.adapter.id !== adapter?.id && r.score >= MIN_SCORE)
    .map((r) => ({ area: r.adapter.area, adapterId: r.adapter.id, group: r.adapter.group, score: r.score }));
  const interdisciplinary = Boolean(adapter) && secondaryAreas.some((s) => s.group !== adapter.group);

  // Naturezas epistemológicas (permite combinação, seção 5.1).
  const natures = [];
  const pushNature = (n, role) => {
    if (!natures.some((x) => x.id === n.id)) natures.push({ id: n.id, label: n.label, role });
  };
  if (Array.isArray(overrides.epistemicNatures) && overrides.epistemicNatures.length) {
    const all = Object.values(EPISTEMIC_NATURES);
    overrides.epistemicNatures.forEach((id, i) => {
      const found = all.find((n) => n.id === id);
      if (found) pushNature(found, i === 0 ? 'primaria' : 'secundaria');
    });
  }
  if (natures.length === 0 && adapter) {
    adapter.natures.primary.forEach((n) => pushNature(n, 'primaria'));
    (adapter.natures.secondary || []).forEach((n) => pushNature(n, 'secundaria'));
    if (interdisciplinary) {
      for (const s of secondaryAreas.filter((x) => x.group !== adapter.group)) {
        const other = listAdapters().find((a) => a.id === s.adapterId);
        other?.natures.primary.forEach((n) => pushNature(n, 'secundaria'));
      }
    }
  }
  if (natures.length === 0) pushNature(EPISTEMIC_NATURES.UNDETERMINED, 'primaria');
  const natureIds = natures.map((n) => n.id);

  const docType = detectDocumentType(rawText, mode, overrides);
  const requiresDidacticEngineering =
    docType.didactic === true || (docType.didactic === 'depende' && (mode === 'Professor' || mode === 'Material Didático'));

  const needsExternalResearch =
    Boolean(docType.research) || natureIds.some((id) => RESEARCH_NATURES.has(id)) || natureIds.includes('indeterminado');

  const needsAreaConfirmation = !areaDetection.area || areaDetection.confidence === 'media' || natureIds.includes('indeterminado');
  const clarificationQuestion = !areaDetection.area
    ? 'Qual é a área de conhecimento deste material? (por exemplo: Filosofia, Física, Neuroanatomia)'
    : natureIds.includes('indeterminado')
      ? `A área "${areaDetection.area}" ainda não possui adaptador. Deseja informar a natureza do conhecimento (formal, empírica, teórica, filosófica, normativa, profissional)?`
      : null;

  return {
    version: KNOWLEDGE_CONTEXT_VERSION,
    area,
    areaConfidence: areaDetection.confidence,
    adapterId: adapter?.id || null,
    adapterVersion: adapter?.version || null,
    group: adapter?.group || null,
    subarea: sub.label,
    secondaryAreas,
    interdisciplinary,
    topic,
    objectOfStudy: topic,
    epistemicNatures: natures,
    natureRelations: relationNotes(natureIds),
    purpose: docType.purpose,
    documentType: { id: docType.id, label: docType.label, didactic: docType.didactic, source: docType.source },
    requiresDidacticEngineering,
    audience: detectAudience(rawText, gradeLevel),
    depth,
    needsExternalResearch,
    externalResearchNote: 'Pesquisa externa só ocorre com autorização expressa; no modo offline, a base é apenas local e declarada como tal.',
    needsAreaConfirmation,
    clarificationQuestion,
    adapterGuidance: adapter
      ? {
          evidenceTypes: adapter.evidenceTypes,
          representations: adapter.representations,
          keyAuthorsHints: adapter.keyAuthors,
          cautions: adapter.cautions,
          auditFocus: adapter.auditFocus,
          doNotRequire: adapter.doNotRequire,
          limits: adapter.limits
        }
      : null,
    fieldSources: {
      area: areaDetection.source,
      subarea: sub.source,
      documentType: docType.source,
      epistemicNatures: Array.isArray(overrides.epistemicNatures) && overrides.epistemicNatures.length ? 'usuario' : 'automatica'
    }
  };
}

/**
 * Catálogo para a interface de correção de contexto: áreas, subáreas, naturezas e tipos documentais.
 * Só dados locais, sem expressões regulares nem regras internas.
 */
export function getKnowledgeCatalog() {
  return {
    version: KNOWLEDGE_CONTEXT_VERSION,
    areas: listAdapters().map((a) => ({
      id: a.id,
      area: a.area,
      group: a.group,
      subareas: (a.subareas || []).map((s) => s.label || s.name || String(s)),
      defaultNatures: [...(a.natures?.primary || []), ...(a.natures?.secondary || [])].map((n) => n.id)
    })),
    natures: Object.values(EPISTEMIC_NATURES).map((n) => ({ id: n.id, label: n.label })),
    documentTypes: DOCUMENT_TYPES.map((d) => ({ id: d.id, label: d.label, didactic: d.didactic, purpose: d.purpose }))
  };
}
