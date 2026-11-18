/**
 * MathLab Aulas Visuais - Workflow Orchestrator (Seção 15 e 16)
 *
 * Executa as 8 etapas independentes do pipeline de autoria:
 *  1. Interpretação
 *  2. Planejamento
 *  3. Pesquisa (M01)
 *  4. Engenharia Didática (M02 + M03)
 *  5. Produção Editorial e Visual (M04)
 *  6. Auditoria de Qualidade (M05)
 *  7. Revisão / Disponibilização para edição
 *  8. Exportação (sob demanda)
 */

import { interpretNaturalRequest } from './requestInterpreter.js';
import { buildScientificFoundation } from './scientificEngine.js';
import { buildPedagogicalDesign } from './pedagogicalEngine.js';
import { buildDidacticEngineering } from './didacticEngine.js';
import { buildEditorialLessonMaterial } from './editorialEngine.js';
import { auditLessonMaterial } from './qualityEngine.js';
import { selectProductionPath, buildProfileMaterial, applyAiDraftToProfileMaterial } from './productionProfiles.js';

/**
 * Fase 2: escolhe entre o roteiro de aula (tipos didáticos) e um perfil estrutural (demais tipos).
 */
function produceMaterial({ interpreted, scientific, pedagogical, didactic, aiGeneratedContent, providerMetadata = null }) {
  const route = selectProductionPath(interpreted);
  if (route.path === 'lesson') {
    return buildEditorialLessonMaterial({ interpreted, scientific, pedagogical, didactic, aiGeneratedContent });
  }
  const material = buildProfileMaterial({ interpreted, scientific, profileId: route.profileId });
  return aiGeneratedContent ? applyAiDraftToProfileMaterial(material, aiGeneratedContent, providerMetadata) : material;
}

export async function runAuthoringWorkflow({
  promptText,
  overrides = {},
  customSources = [],
  aiProvider = null,
  useExternalAi = false,
  authorizedExternalCall = false,
  modelName = 'gemini-2.5-flash'
}) {
  const stageLog = [];

  // 1. Interpretação
  const interpreted = interpretNaturalRequest(promptText, overrides);
  stageLog.push({
    stage: '1_Interpretacao',
    status: 'CONCLUIDA',
    inputSummary: `prompt(${String(promptText || '').length} chars)`,
    outputSummary: `${interpreted.fields.discipline} | ${interpreted.fields.gradeLevel} | ${interpreted.fields.topic}`,
    mode: interpreted.workflowMode,
    knowledge: {
      area: interpreted.knowledgeContext?.area,
      natures: interpreted.knowledgeContext?.epistemicNatures?.map((n) => n.id),
      documentType: interpreted.knowledgeContext?.documentType?.id,
      needsAreaConfirmation: interpreted.knowledgeContext?.needsAreaConfirmation
    }
  });

  // 2-3. Pesquisa Científica (M01)
  const scientific = buildScientificFoundation(interpreted, customSources);
  stageLog.push({
    stage: '2_3_Planejamento_e_Pesquisa_M01',
    status: 'CONCLUIDA',
    inputSummary: `${interpreted.fields.topic} (+${customSources.length} fontes customizadas)`,
    outputSummary: `${scientific.references.length} referências rastreáveis`,
    referencesCount: scientific.references.length
  });

  // 4. Motor Pedagógico (M02) e Engenharia Didática (M03)
  const pedagogical = buildPedagogicalDesign(interpreted);
  // Fase 2: M03 só se aplica quando a produção tem finalidade educacional ou formativa.
  const appliesDidactic = interpreted.knowledgeContext ? interpreted.knowledgeContext.requiresDidacticEngineering : true;
  const didactic = appliesDidactic ? buildDidacticEngineering(interpreted, pedagogical) : null;
  stageLog.push(
    appliesDidactic
      ? {
          stage: '4_Engenharia_Didatica_M02_M03',
          status: 'CONCLUIDA',
          inputSummary: `${interpreted.fields.discipline} (${interpreted.fields.gradeLevel})`,
          outputSummary: `${didactic.partA_didacticArchitecture.alignmentMatrix.length} níveis operacionais`
        }
      : {
          stage: '4_Engenharia_Didatica_M02_M03',
          status: 'NAO_APLICAVEL',
          reason: `Tipo documental "${interpreted.knowledgeContext.documentType.label}" não tem finalidade escolar; M03 não é imposto.`
        }
  );

  // 5. Produção (Offline local claramente identificado OU Gemini autorizado)
  let aiGeneratedContent = null;
  let productionMode = 'SINTESE_LOCAL_OFFLINE';
  let providerMetadata = null;

  if (useExternalAi && authorizedExternalCall && aiProvider) {
    const aiRes = await aiProvider.generateLessonSection({
      interpreted,
      scientific,
      pedagogical,
      didactic,
      modelName,
      authorized: true
    });
    aiGeneratedContent = aiRes.text;
    productionMode = `PROVEDOR_EXTERNO_${aiRes.provider.toUpperCase()}`;
    providerMetadata = aiRes.metadata;
  }

  let material = produceMaterial({ interpreted, scientific, pedagogical, didactic, aiGeneratedContent, providerMetadata });
  stageLog.push({
    stage: '5_Producao_Editorial_M04',
    status: 'CONCLUIDA',
    inputSummary: `M01+M02${didactic ? '+M03' : ''} (${productionMode})`,
    outputSummary: `${material.blocks.length} blocos editoriais`,
    productionMode,
    blocksCount: material.blocks.length,
    structureProfile: material.structureProfile?.id || 'roteiro_de_aula'
  });

  // 6. Auditoria de Qualidade + Validação de Completude (M05)
  let audit = auditLessonMaterial(material, { scientific, didactic, knowledgeContext: interpreted.knowledgeContext });
  // Fase 2: só vale para o roteiro de aula, cujo fallback local é completo. Num perfil estrutural o fallback
  // seria o esqueleto puro, e descartar o rascunho de IA faria o autor perder o que foi produzido.
  if (audit.completeness && !audit.completeness.complete && aiGeneratedContent && !material.structureProfile) {
    // Retorno corretivo à etapa editorial se conteúdo externo veio incompleto/genérico
    material = produceMaterial({ interpreted, scientific, pedagogical, didactic, aiGeneratedContent: null });
    stageLog.push({
      stage: '5B_Reelaboracao_Corretiva_M04',
      status: 'CONCLUIDA',
      reason: 'Completude insuficiente no conteúdo externo; recomposto com base editorial verificada.'
    });
    audit = auditLessonMaterial(material, { scientific, didactic, knowledgeContext: interpreted.knowledgeContext });
  }

  stageLog.push({
    stage: '6_Auditoria_Qualidade_M05',
    status: audit.completeness?.complete ? 'CONCLUIDA' : 'REPROVADA_PENDENTE',
    auditStatus: audit.status,
    completenessOk: Boolean(audit.completeness?.complete),
    hardFailsCount: audit.hardFails.length
  });

  return {
    generatedAt: new Date().toISOString(),
    productionMode,
    providerMetadata,
    stageLog,
    interpreted,
    scientific,
    pedagogical,
    didactic,
    material,
    originalGeneratedMaterial: structuredClone(material),
    audit
  };
}

/**
 * Reprocessa uma etapa específica de um workflow existente de forma independente,
 * preservando as demais decisões e atualizando o log de etapas e auditoria.
 */
export async function reprocessWorkflowStage({
  workflow,
  stageName,
  customSources = [],
  aiProvider = null,
  useExternalAi = false,
  authorizedExternalCall = false,
  modelName = 'gemini-2.5-flash'
}) {
  if (!workflow || !workflow.interpreted) {
    throw new Error('Workflow inválido para reprocessamento de etapa.');
  }

  const validStages = ['research', 'didactic', 'editorial', 'audit'];
  if (!validStages.includes(stageName)) {
    throw new Error(`Etapa inválida "${stageName}". Etapas suportadas: ${validStages.join(', ')}.`);
  }

  const next = {
    ...workflow,
    stageLog: Array.isArray(workflow.stageLog) ? [...workflow.stageLog] : [],
    reprocessedAt: new Date().toISOString()
  };

  if (stageName === 'research') {
    const mergedSources = Array.isArray(customSources) ? customSources : [];
    next.scientific = buildScientificFoundation(next.interpreted, mergedSources);
    next.stageLog.push({
      stage: 'REPROCESSO_Pesquisa_M01',
      status: 'CONCLUIDA',
      referencesCount: next.scientific.references.length,
      timestamp: next.reprocessedAt
    });
    if (next.material) {
      next.audit = auditLessonMaterial(next.material, {
        scientific: next.scientific,
        knowledgeContext: next.interpreted?.knowledgeContext,
        didactic: next.didactic
      });
    }
    return next;
  }

  if (stageName === 'didactic') {
    next.pedagogical = buildPedagogicalDesign(next.interpreted);
    const appliesDidactic = next.interpreted.knowledgeContext ? next.interpreted.knowledgeContext.requiresDidacticEngineering : true;
    next.didactic = appliesDidactic ? buildDidacticEngineering(next.interpreted, next.pedagogical) : null;
    next.stageLog.push({
      stage: 'REPROCESSO_Engenharia_Didatica_M02_M03',
      status: appliesDidactic ? 'CONCLUIDA' : 'NAO_APLICAVEL',
      timestamp: next.reprocessedAt
    });
    if (next.material) {
      next.audit = auditLessonMaterial(next.material, {
        scientific: next.scientific,
        knowledgeContext: next.interpreted?.knowledgeContext,
        didactic: next.didactic
      });
    }
    return next;
  }

  if (stageName === 'editorial') {
    let aiGeneratedContent = null;
    let productionMode = 'SINTESE_LOCAL_OFFLINE';
    let providerMetadata = null;

    if (useExternalAi && authorizedExternalCall && aiProvider) {
      const aiRes = await aiProvider.generateLessonSection({
        interpreted: next.interpreted,
        scientific: next.scientific,
        pedagogical: next.pedagogical,
        didactic: next.didactic,
        modelName,
        authorized: true
      });
      aiGeneratedContent = aiRes.text;
      productionMode = `PROVEDOR_EXTERNO_${aiRes.provider.toUpperCase()}`;
      providerMetadata = aiRes.metadata;
    }

    next.productionMode = productionMode;
    next.providerMetadata = providerMetadata;
    next.material = produceMaterial({
      interpreted: next.interpreted,
      scientific: next.scientific,
      pedagogical: next.pedagogical,
      didactic: next.didactic,
      aiGeneratedContent,
      providerMetadata
    });
    next.originalGeneratedMaterial = structuredClone(next.material);
    next.stageLog.push({
      stage: 'REPROCESSO_Producao_Editorial_M04',
      status: 'CONCLUIDA',
      productionMode,
      blocksCount: next.material.blocks.length,
      timestamp: next.reprocessedAt
    });
    next.audit = auditLessonMaterial(next.material, {
      scientific: next.scientific,
        knowledgeContext: next.interpreted?.knowledgeContext,
      didactic: next.didactic
    });
    return next;
  }

  // stageName === 'audit'
  next.audit = auditLessonMaterial(next.material, {
    scientific: next.scientific,
        knowledgeContext: next.interpreted?.knowledgeContext,
    didactic: next.didactic
  });
  next.stageLog.push({
    stage: 'REPROCESSO_Auditoria_Qualidade_M05',
    status: 'CONCLUIDA',
    auditStatus: next.audit.status,
    timestamp: next.reprocessedAt
  });
  return next;
}
