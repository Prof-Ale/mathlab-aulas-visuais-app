/**
 * MathLab Aulas Visuais - Didactic Engine (M03: Engenharia Didática v2.2 REV5)
 *
 * Transforma a intenção pedagógica em sequência de aprendizagem com:
 *  - Matriz de Alinhamento Construtivo (Objetivo, Conteúdo, Estratégia, Atividade,
 *    Evidência de Aprendizagem, Critério de Avaliação).
 *  - Organização em Parte A (Arquitetura Didática) e Parte B (Especificação Operacional).
 *  - Níveis operacionais I, II e III explicitamente identificados como proposições MathLab.
 */

export const MATHLAB_OPERATIONAL_LEVELS = Object.freeze({
  LEVEL_1: 'Nível I (Proposição operacional MathLab): Reconhecimento e mobilização guiada',
  LEVEL_2: 'Nível II (Proposição operacional MathLab): Coordenação de representações e aplicação orientada',
  LEVEL_3: 'Nível III (Proposição operacional MathLab): Transferência autônoma e justificação'
});

export function buildDidacticEngineering(interpreted, pedagogical) {
  const { topic, objectives, duration } = interpreted.fields;

  const alignmentMatrix = objectives.map((obj, idx) => {
    const level =
      idx === 0
        ? MATHLAB_OPERATIONAL_LEVELS.LEVEL_1
        : idx === 1
          ? MATHLAB_OPERATIONAL_LEVELS.LEVEL_2
          : MATHLAB_OPERATIONAL_LEVELS.LEVEL_3;

    return {
      objectiveId: `OBJ-${idx + 1}`,
      learningObjective: obj,
      content: topic,
      teachingStrategy:
        idx === 0
          ? 'Problematização inicial e diálogo socrático sobre conhecimentos prévios.'
          : idx === 1
            ? 'Modelagem comparativa entre representação verbal, gráfica e simbólica (Duval).'
            : 'Resolução graduada com retirada progressiva de apoios e análise de erros.',
      activity:
        idx === 0
          ? `Atividade Diagnóstica/Orientada 1: Interpretar situação-problema envolvendo ${topic}.`
          : idx === 1
            ? `Atividade Orientada 2: Converter o problema de ${topic} para tabela, gráfico e expressão algébrica.`
            : `Atividade Independente 3: Resolver e justificar caso novo sem roteiro passo a passo.`,
      learningEvidence:
        idx === 0
          ? 'Registro escrito identificando grandezas envolvidas e relações entre elas.'
          : idx === 1
            ? 'Produção coerente de pelo menos duas representações equivalentes para o mesmo objeto.'
            : 'Solução comentada com justificativa conceitual e verificação do resultado.',
      evaluationCriterion:
        idx === 0
          ? 'Identifica dados relevantes e formula hipótese coerente (não basta apenas copiar o enunciado).'
          : idx === 1
            ? 'Mantém consistência matemática/científica na passagem entre representações.'
            : 'Justifica a validade da resposta frente às condições do problema.',
      operationalLevel: level
    };
  });

  return {
    moduleRef: 'M03 Engenharia Didática (v2.2 CANDIDATA REV5)',
    partA_didacticArchitecture: {
      duration,
      conceptualProgression: pedagogical.conceptualProgression,
      alignmentMatrix,
      coherenceChecked: alignmentMatrix.every(
        (row) => row.learningObjective && row.activity && row.learningEvidence && row.evaluationCriterion
      ),
      distinctionNote:
        'Objetivos, atividades, estratégias de ensino, evidências de aprendizagem e critérios de avaliação são mantidos como entidades distintas; realização de atividade não é confundida com aprendizagem demonstrada.'
    },
    partB_operationalSpecification: {
      taskSequencing: [
        { phase: 'Abertura e Diagnóstico', estimatedMinutes: 10, level: MATHLAB_OPERATIONAL_LEVELS.LEVEL_1 },
        { phase: 'Desenvolvimento Conceitual e Representações', estimatedMinutes: 18, level: MATHLAB_OPERATIONAL_LEVELS.LEVEL_2 },
        { phase: 'Prática Graduada e Sistematização', estimatedMinutes: 15, level: MATHLAB_OPERATIONAL_LEVELS.LEVEL_2 },
        { phase: 'Avaliação Formativa e Retomada', estimatedMinutes: 7, level: MATHLAB_OPERATIONAL_LEVELS.LEVEL_3 }
      ],
      identifiedObstacles: pedagogical.obstacleAnalysis
    }
  };
}
