/**
 * MathLab Aulas Visuais - Pedagogical Engine (M02: Motor Pedagógico v2.3.7 REV6 / v2.3.6)
 *
 * Mobiliza referenciais psicológicos e pedagógicos apenas quando pertinentes ao conteúdo,
 * preservando distinções conceituais rigorosas (Vygotsky/ZDP vs. Wood, Bruner & Ross 1976;
 * Duval; Galperin; Davydov; CAST UDL 3.0).
 */

export const PEDAGOGICAL_FRAMEWORKS = Object.freeze({
  VYGOTSKY: {
    id: 'vygotsky',
    label: 'Vigotski / Matriz Histórico-Cultural',
    coreFocus: 'Zona de Desenvolvimento Proximal (ZDP) e mediação semiótica (não reduzir a técnica mecânica de ajuda).'
  },
  WOOD_BRUNER_ROSS: {
    id: 'wood_bruner_ross',
    label: 'Wood, Bruner & Ross (1976)',
    coreFocus: 'Operacionalização empírica do suporte contingente (scaffolding) e retirada gradual de apoios.'
  },
  DUVAL: {
    id: 'duval',
    label: 'Raymond Duval (2003)',
    coreFocus: 'Conversão e tratamento entre múltiplos registros de representação semiótica.'
  },
  GALPERIN: {
    id: 'galperin',
    label: 'P. Ya. Galperin',
    coreFocus: 'Formação por etapas das ações mentais (base orientadora da ação, materializada, verbal e mental).'
  },
  DAVYDOV: {
    id: 'davydov',
    label: 'V. V. Davydov',
    coreFocus: 'Ascensão do abstrato nuclear às manifestações particulares por meio de modelagem conceitual.'
  },
  UDL_3_0: {
    id: 'udl_3_0',
    label: 'CAST UDL Guidelines 3.0 (2024)',
    coreFocus: 'Engajamento, Representação, Ação/Expressão e Agência do Estudante (aplicação contextual, não checklist).'
  }
});

export function buildPedagogicalDesign(interpreted) {
  const { discipline, topic, accessibility } = interpreted.fields;
  const isMath = discipline === 'Matemática';
  const mobilized = [PEDAGOGICAL_FRAMEWORKS.VYGOTSKY, PEDAGOGICAL_FRAMEWORKS.WOOD_BRUNER_ROSS];

  if (isMath || /gráfic|equaç|funç|geometria/i.test(topic)) {
    mobilized.push(PEDAGOGICAL_FRAMEWORKS.DUVAL);
  }
  if (/etapas|resolução|procedimento|passo/i.test(interpreted.rawRequest)) {
    mobilized.push(PEDAGOGICAL_FRAMEWORKS.GALPERIN);
  }
  if (accessibility.length > 0 || /inclus|acessib|dua|udl/i.test(interpreted.rawRequest)) {
    mobilized.push(PEDAGOGICAL_FRAMEWORKS.UDL_3_0);
  }

  return {
    moduleRef: 'M02 Motor Pedagógico (v2.3.7 CANDIDATA REV6 / v2.3.6 BASELINE)',
    mobilizedFrameworks: mobilized,
    priorKnowledgeDiagnosis: {
      purpose: 'Mapear concepções prévias e obstáculos antes da formalização.',
      checkpoints: interpreted.fields.priorKnowledge
    },
    conceptualProgression: [
      '1. Situação-problema intuitiva e levantamento de hipóteses.',
      '2. Articulação entre representação em língua natural, visual/gráfica e simbólica.',
      '3. Apoios contingentes graduados (exemplos guiados) com retirada progressiva na prática autônoma.',
      '4. Sistematização conceitual e verificação formativa de transferência.'
    ],
    obstacleAnalysis: [
      `Risco de aplicação mecânica de regras em ${topic} sem compreender o significado das variáveis ou relações.`,
      'Dificuldade de conversão entre enunciado verbal, tabela/gráfico e notação simbólica.'
    ],
    udlConsiderations:
      accessibility.length > 0
        ? { applied: true, notes: accessibility }
        : {
            applied: false,
            notes: ['DUA/UDL 3.0 mantido sob demanda (múltiplas representações visuais e textuais já integradas).']
          },
    epistemicGuardrail:
      'ZDP (Vigotski) não é reduzida a técnica de ajuda; suporte contingente gradual (scaffolding) é atribuído à operacionalização empírica de Wood, Bruner & Ross (1976).'
  };
}
