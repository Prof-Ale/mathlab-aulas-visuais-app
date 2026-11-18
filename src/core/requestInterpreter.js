/**
 * MathLab Aulas Visuais - Request Interpreter (Fluxos de Trabalho + M03)
 *
 * Interpreta solicitações em linguagem natural, extrai metadados didáticos
 * e roteia entre os 4 modos oficiais (Pesquisador, Professor, Material Didático, Auditoria).
 */

import { classifyArea, buildKnowledgeContext } from './knowledgeContext.js';
import { getAdapterByArea } from '../adapters/disciplineAdapters.js';

export const WORKFLOW_MODES = Object.freeze({
  RESEARCHER: 'Pesquisador',
  TEACHER: 'Professor',
  DIDACTIC_MATERIAL: 'Material Didático',
  AUDIT: 'Auditoria'
});

export function detectWorkflowMode(text) {
  const lower = String(text || '').toLowerCase();
  if (/(verifique|audite|auditoria|está correta|revise cientificamente|cheque se)/i.test(lower)) {
    return WORKFLOW_MODES.AUDIT;
  }
  if (/(pesquise|história do|origem de|genealogia|levantamento bibliográfico|fontes sobre)/i.test(lower)) {
    return WORKFLOW_MODES.RESEARCHER;
  }
  if (/(apostila|ficha de atividades|infográfico|apresentação|slides|guia de estudo|material didático)/i.test(lower)) {
    return WORKFLOW_MODES.DIDACTIC_MATERIAL;
  }
  return WORKFLOW_MODES.TEACHER;
}

export function interpretNaturalRequest(rawText, overrides = {}) {
  const text = String(rawText || '').trim();
  const mode = overrides.mode || detectWorkflowMode(text);

  // Disciplina: 1) correção do usuário, 2) adaptadores disciplinares (Fase 1),
  // 3) regras legadas (compatibilidade v1.5), 4) padrão legado "Matemática" sinalizado como não confirmado.
  const areaDetection = classifyArea(text, overrides);
  let discipline = overrides.discipline || '';
  let disciplineFromLegacyDefault = false;
  if (!discipline) {
    if (areaDetection.area) discipline = areaDetection.area;
    else if (/(física|cinemática|dinâmica|termodinâmica|óptica|eletricidade)/i.test(text)) discipline = 'Física';
    else if (/(química|átomo|estequiometria|mol|reação química|tabela periódica)/i.test(text)) discipline = 'Química';
    else if (/(biologia|célula|genética|ecologia|evolução|fotossíntese)/i.test(text)) discipline = 'Biologia';
    else if (/(ciências|sistema solar|energia|matéria)/i.test(text)) discipline = 'Ciências da Natureza';
    else if (/(matemática|equaç|funç|geometria|fração|fraçõ|álgebra|trigonometria|probabilidade|estatística)/i.test(text)) discipline = 'Matemática';
    else {
      discipline = 'Matemática';
      disciplineFromLegacyDefault = true;
    }
  }
  // Se a área veio das regras legadas ou do padrão, o contexto de conhecimento reflete essa origem.
  const effectiveAreaDetection = areaDetection.area
    ? areaDetection
    : {
        ...areaDetection,
        area: disciplineFromLegacyDefault ? null : discipline,
        adapter: disciplineFromLegacyDefault ? null : getAdapterByArea(discipline),
        source: 'regra_legada',
        confidence: disciplineFromLegacyDefault ? 'nenhuma' : 'baixa'
      };

  // Ano ou etapa
  let gradeLevel = overrides.gradeLevel || '';
  if (!gradeLevel) {
    const anoMatch = text.match(/(\d{1,2}\s*[º°]?\s*ano(?:\s+do\s+ensino\s+(?:fundamental|médio))?)/i);
    if (anoMatch) gradeLevel = anoMatch[1].trim();
    else if (/ensino médio/i.test(text)) gradeLevel = 'Ensino Médio';
    else if (/ensino fundamental/i.test(text)) gradeLevel = 'Ensino Fundamental';
    else gradeLevel = 'Não especificado (adaptável)';
  }

  // Duração
  const durMatch = text.match(/(\d+\s*(?:min|minutos|aula|aulas|h|horas))/i);
  const duration = overrides.duration || (durMatch ? durMatch[1].trim() : '50 minutos (1 aula padrão)');

  // Tema / Conteúdo
  let topic = overrides.topic || '';
  if (!topic) {
    const sobreMatch = text.match(/\bsobre\s+([^.;!\n]+)/i);
    topic = sobreMatch ? sobreMatch[1].trim() : text.slice(0, 120);
  }

  // Profundidade e tipo de material
  const depth = overrides.depth || (/aprofund|rigoros|avançad/i.test(text) ? 'Aprofundada' : 'Conceitual e aplicada');
  const materialType =
    overrides.materialType ||
    (mode === WORKFLOW_MODES.DIDACTIC_MATERIAL
      ? 'Apostila / Ficha Didática'
      : mode === WORKFLOW_MODES.RESEARCHER
        ? 'Dossiê Científico'
        : mode === WORKFLOW_MODES.AUDIT
          ? 'Parecer de Auditoria'
          : 'Roteiro de Aula Visual');

  // Necessidades de acessibilidade / DUA
  const accessibility = [];
  if (/(dislexia|leitura fácil|fonte legível)/i.test(text)) accessibility.push('Apoio à leitura / layout claro');
  if (/(tdah|foco|blocos curtos)/i.test(text)) accessibility.push('Segmentação em blocos curtos');
  if (/(visual|daltonismo|contraste|audiodescrição)/i.test(text)) accessibility.push('Alto contraste e descrições textuais de figuras');
  if (/(libras|surd)/i.test(text)) accessibility.push('Suporte visual estruturado e vocabulário explícito');

  // Esclarecimento mínimo apenas se faltar informação essencial (tema vazio)
  const missingEssential = [];
  if (!text || text.length < 6) {
    missingEssential.push('Informe o tema ou conteúdo principal desejado.');
  }

  const knowledgeContext = buildKnowledgeContext({
    rawText: text,
    mode,
    areaDetection: effectiveAreaDetection,
    topic,
    gradeLevel,
    depth,
    overrides
  });

  return {
    interpretedAt: new Date().toISOString(),
    rawRequest: text,
    workflowMode: mode,
    fastTrackEligible: missingEssential.length === 0,
    missingEssential,
    knowledgeContext,
    fields: {
      discipline,
      gradeLevel,
      topic,
      duration,
      depth,
      materialType,
      objectives: overrides.objectives || [
        `Compreender os fundamentos conceituais de ${topic}.`,
        `Articular múltiplas representações (algébrica, gráfica e verbal) aplicadas a ${topic}.`,
        `Resolver situações-problema graduadas e refletir sobre erros frequentes.`
      ],
      priorKnowledge: overrides.priorKnowledge || [
        'Operações fundamentais e leitura de expressões simples.',
        'Interpretação de tabelas e relações numéricas básicas.'
      ],
      classProfile: overrides.classProfile || 'Turma heterogênea (nível regular)',
      restrictions: overrides.restrictions || 'Evitar memorização mecânica sem sentido conceitual; economia de tinta na impressão.',
      accessibility
    }
  };
}
