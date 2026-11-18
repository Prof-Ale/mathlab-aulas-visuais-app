/**
 * MathLab Aulas Visuais - Scientific Engine (M01: Base Científica v2.3.3 REV6)
 *
 * Gerencia rastreabilidade de fontes, classificação de evidências,
 * estados reais de acesso documental e protocolo de genealogia conceitual.
 */

export const SOURCE_ACCESS_STATES = Object.freeze({
  FULL: 'Integral',
  PARTIAL: 'Parcial',
  SUMMARY: 'Resumo',
  METADATA: 'Metadados',
  LOCATED: 'Referência localizada',
  UNVERIFIED: 'Não verificado'
});

export const EVIDENCE_TYPES = Object.freeze({
  EMPIRICAL: 'Empírica',
  THEORETICAL: 'Teórica',
  NORMATIVE: 'Normativa'
});

export function createTraceableReference({
  author,
  title,
  year,
  publication = '',
  doiOrIsbn = '',
  doi = '',
  url = '',
  sourceType = 'Secundária',
  evidenceType = EVIDENCE_TYPES.THEORETICAL,
  accessState = SOURCE_ACCESS_STATES.UNVERIFIED,
  relevantExcerpts = [],
  consultedAt = new Date().toISOString()
}) {
  return {
    author: String(author || 'Autor não informado'),
    title: String(title || 'Título não informado'),
    year: String(year || 's.d.'),
    publication,
    doiOrIsbn: doiOrIsbn || doi || '',
    url,
    sourceType,
    evidenceType,
    accessState,
    relevantExcerpts: Array.isArray(relevantExcerpts) ? [...relevantExcerpts] : [],
    consultedAt
  };
}

const NATURAL_SCIENCES_AREAS = new Set(['Física', 'Química', 'Biologia', 'Ciências da Natureza']);

export function buildScientificFoundation(interpreted, customSources = []) {
  const { discipline, topic, gradeLevel } = interpreted.fields;
  const references = [];
  const documentaryNotes = [];

  if (discipline === 'Matemática') {
    references.push(
      createTraceableReference({
        author: 'BRASIL. Ministério da Educação',
        title: 'Base Nacional Comum Curricular (BNCC) — Matemática',
        year: '2018',
        publication: 'MEC',
        sourceType: 'Documento normativo oficial',
        evidenceType: EVIDENCE_TYPES.NORMATIVE,
        accessState: SOURCE_ACCESS_STATES.METADATA,
        relevantExcerpts: [`Alinhamento curricular referencial para ${gradeLevel} no eixo de ${topic}.`]
      }),
      createTraceableReference({
        author: 'DUVAL, Raymond',
        title: 'Registros de representações semióticas e funcionamento cognitivo da compreensão em matemática',
        year: '2003',
        publication: 'Aprendizagem em matemática: registros de representação semiótica (org. Machado)',
        sourceType: 'Literatura acadêmica (referência conceitual)',
        evidenceType: EVIDENCE_TYPES.THEORETICAL,
        accessState: SOURCE_ACCESS_STATES.LOCATED,
        relevantExcerpts: ['Coordenação entre registro em língua natural, algébrico e gráfico.']
      })
    );
  } else if (NATURAL_SCIENCES_AREAS.has(discipline)) {
    references.push(
      createTraceableReference({
        author: 'BRASIL. Ministério da Educação',
        title: 'Base Nacional Comum Curricular (BNCC) — Ciências da Natureza',
        year: '2018',
        publication: 'MEC',
        sourceType: 'Documento normativo oficial',
        evidenceType: EVIDENCE_TYPES.NORMATIVE,
        accessState: SOURCE_ACCESS_STATES.METADATA,
        relevantExcerpts: [`Referência normativa para ${gradeLevel} em ${topic}.`]
      })
    );
  } else {
    // Fase 1: a BNCC de Ciências da Natureza não se aplica a Filosofia, Psicanálise, Educação Especial etc.
    // Nenhuma referência padrão é inventada: as fontes devem ser informadas ou pesquisadas com autorização.
    documentaryNotes.push(
      `Nenhuma referência padrão foi associada à área "${discipline}": as fontes precisam ser informadas pelo autor ou pesquisadas com autorização expressa.`
    );
  }

  for (const src of customSources) {
    references.push(createTraceableReference(src));
  }

  return {
    moduleRef: 'M01 Base Científica (v2.3.3 CANDIDATA REV6 / v2.3.2 REV5)',
    discipline,
    topic,
    references,
    documentaryLimitations: [
      'Sem busca externa ativa em modo offline; referências com estado "Metadados" ou "Referência localizada" não devem ser declaradas como consulta integral.',
      'Afirmações históricas ou citações textuais literais exigem verificação direta em fonte primária.',
      ...documentaryNotes
    ],
    claimsRequiringVerification: [
      // A BNCC só é pertinente a materiais escolares com etapa informada (não a ensaios, revisões ou estudos teóricos).
      ...(interpreted.knowledgeContext?.requiresDidacticEngineering !== false && !/^Não especificado/.test(String(gradeLevel || ''))
        ? [`Verificar códigos específicos de habilidade da BNCC aplicáveis a "${topic}" em "${gradeLevel}" na edição vigente.`]
        : [])
    ],
    controversies: []
  };
}
