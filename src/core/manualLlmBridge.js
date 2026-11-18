/**
 * MathLab Aulas Visuais - Ponte manual de LLM (copiar e colar)
 *
 * Para quem não usa API: o app monta o prompt, o professor cola na ferramenta de LLM que preferir
 * (Gemini, Claude, ChatGPT etc.) e traz a resposta de volta. Nenhuma chamada externa é feita aqui.
 *
 * Regras:
 *  - A resposta colada é RASCUNHO A REVISAR, nunca fonte. Fica marcada em contentOrigin.
 *  - A importação é aplicada sobre o material atual (inclusive com edições humanas): só entram
 *    seções ainda em esqueleto (perfis) ou o bloco de desenvolvimento conceitual (roteiro de aula).
 *    Texto que o professor já escreveu nunca é sobrescrito sem aviso.
 *  - Nada é inventado: o que a resposta não cobrir continua em esqueleto e aparece no relatório.
 */

import { AiProviderService } from '../services/aiProviderService.js';
import { selectProductionPath, listProfileSectionTitles, applyAiDraftToProfileMaterial, SKELETON_MARK } from './productionProfiles.js';
import { auditLessonMaterial } from './qualityEngine.js';

const MIN_DRAFT_CHARS = 40;
const MAX_DRAFT_CHARS = 200_000;
const MANUAL_ORIGIN = 'IA_EXTERNA_RASCUNHO_A_REVISAR';

export function buildManualPrompt(workflow) {
  if (!workflow?.interpreted) throw new Error('Gere o material primeiro: não há solicitação interpretada para montar o prompt.');
  const route = selectProductionPath(workflow.interpreted);
  const base = new AiProviderService().buildFiveModulePrompt({
    interpreted: workflow.interpreted,
    scientific: workflow.scientific || { references: [] },
    pedagogical: workflow.pedagogical || { epistemicGuardrail: '', mobilizedFrameworks: [] },
    didactic: workflow.didactic || null
  });

  const format =
    route.path === 'profile'
      ? 'FORMATO DA RESPOSTA: responda somente com as seções pedidas, cada uma começando por "## " seguido do nome exato da seção. Sem introdução e sem despedida. Se não tiver fonte segura para uma afirmação, escreva "fonte a verificar".'
      : 'FORMATO DA RESPOSTA: responda somente com o texto da seção, em Markdown, sem introdução e sem despedida. Se não tiver fonte segura para uma afirmação, escreva "fonte a verificar".';

  return {
    prompt: `${base}\n\n${format}`,
    path: route.path,
    expectedSections: route.path === 'profile' ? listProfileSectionTitles(route.profileId) : ['Desenvolvimento Conceitual e Explicações'],
    instructions: [
      '1. Copie o prompt e cole na sua ferramenta de LLM.',
      '2. Copie a resposta inteira e cole no campo "Resposta da LLM".',
      '3. Clique em Importar. O texto entra como rascunho a revisar, nunca como fonte.',
      '4. Confira autoria, obras, datas e citações em fonte primária antes de publicar.'
    ]
  };
}

/**
 * Aplica a resposta colada ao material. Não muta os argumentos.
 * @returns {{ workflow, material, importReport }}
 */
export function importManualDraft({ workflow, material, text, sourceLabel = '' }) {
  if (!workflow?.interpreted) throw new Error('Gere o material primeiro: não há fluxo ativo para receber a resposta.');
  const draft = String(text ?? '').trim();
  if (draft.length < MIN_DRAFT_CHARS) throw new Error(`A resposta colada é muito curta (mínimo ${MIN_DRAFT_CHARS} caracteres).`);
  if (draft.length > MAX_DRAFT_CHARS) throw new Error('A resposta colada é grande demais para importar de uma vez.');

  const current = structuredClone(material || workflow.material);
  if (!current?.blocks?.length) throw new Error('Não há material aberto para receber a resposta.');

  const route = selectProductionPath(workflow.interpreted);
  const meta = { provider: 'manual', sourceLabel: String(sourceLabel || '').slice(0, 80), importedAt: new Date().toISOString() };
  const report = { path: route.path, filled: [], keptAsSkeleton: [], unmatchedSectionsInAnswer: 0, notes: [] };

  if (route.path === 'profile') {
    if (!current.structureProfile) {
      throw new Error('O material aberto não tem o perfil estrutural esperado. Reprocesse a etapa editorial e tente de novo.');
    }
    const before = new Map(current.blocks.map((b) => [b.id, b.body]));
    applyAiDraftToProfileMaterial(current, draft, meta);
    for (const b of current.blocks) {
      const wasSkeleton = String(before.get(b.id) || '').includes(SKELETON_MARK);
      if (wasSkeleton && b.contentOrigin === MANUAL_ORIGIN && b.body !== before.get(b.id)) report.filled.push(b.title);
      else if (b.body.includes(SKELETON_MARK)) report.keptAsSkeleton.push(b.title);
    }
    const answerSections = (draft.match(/^##\s+/gm) || []).length;
    report.unmatchedSectionsInAnswer = Math.max(0, answerSections - report.filled.length);
    if (report.filled.length === 0) {
      report.notes.push('Nenhuma seção da resposta casou com os títulos do documento. Confira se a LLM usou "## " e o nome exato de cada seção.');
    }
    if (report.unmatchedSectionsInAnswer > 0) {
      report.notes.push(`${report.unmatchedSectionsInAnswer} seção(ões) da resposta não casaram com nenhuma seção em esqueleto e não foram importadas.`);
    }
  } else {
    const dev = current.blocks.find((b) => b.sectionType === 'desenvolvimento_conceitual');
    if (!dev) throw new Error('O material aberto não tem o bloco de Desenvolvimento Conceitual para receber a resposta.');
    dev.body = draft;
    dev.contentOrigin = MANUAL_ORIGIN;
    report.filled.push(dev.title);
    report.notes.push('No roteiro de aula, a resposta substituiu o texto do bloco de Desenvolvimento Conceitual. Os demais blocos não foram alterados.');
  }

  const next = structuredClone(workflow);
  next.productionMode = 'IMPORTACAO_MANUAL_LLM';
  next.providerMetadata = meta;
  next.material = current;
  next.stageLog = [
    ...(next.stageLog || []),
    {
      stage: 'IMPORTACAO_MANUAL_LLM',
      status: report.filled.length > 0 ? 'CONCLUIDA' : 'SEM_EFEITO',
      timestamp: meta.importedAt,
      sourceLabel: meta.sourceLabel,
      sectionsFilled: report.filled.length,
      sectionsStillSkeleton: report.keptAsSkeleton.length
    }
  ];
  next.audit = auditLessonMaterial(current, { scientific: next.scientific, didactic: next.didactic, knowledgeContext: next.interpreted?.knowledgeContext });
  return { workflow: next, material: current, importReport: report };
}
