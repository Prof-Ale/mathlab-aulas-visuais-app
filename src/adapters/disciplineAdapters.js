/**
 * MathLab Aulas Visuais - Adaptadores Disciplinares (Fase 1, prompt mestre seção 5.3)
 *
 * Cada adaptador é um objeto de dados independente, versionável e testável.
 * Acrescentar uma área nova NÃO exige alterar os módulos M01 a M05: basta
 * registrar um adaptador com registerAdapter().
 *
 * ATENÇÃO EPISTEMOLÓGICA:
 *  - keyAuthors são pistas de navegação para a pesquisa (M01), NÃO referências.
 *    Nenhuma obra, edição, página ou citação é declarada aqui. Toda referência
 *    real continua dependendo de verificação e de nível de acesso (M01).
 *  - doNotRequire lista exigências que a auditoria (M05) não deve fazer para a área.
 *    Ele só é consumido de fato na Fase 3; na Fase 1 apenas fica disponível no contexto.
 */

export const EPISTEMIC_NATURES = Object.freeze({
  FORMAL: { id: 'formal', label: 'Conhecimento formal e demonstrativo' },
  EMPIRICAL: { id: 'empirico', label: 'Conhecimento empírico e experimental' },
  EVIDENCE_BASED: { id: 'baseado_evidencias', label: 'Conhecimento científico e baseado em evidências' },
  THEORETICAL: { id: 'teorico', label: 'Conhecimento teórico e conceitual' },
  PHILOSOPHICAL: { id: 'filosofico', label: 'Conhecimento filosófico e argumentativo' },
  HISTORICAL: { id: 'historico', label: 'Conhecimento histórico e documental' },
  NORMATIVE: { id: 'normativo', label: 'Conhecimento normativo e jurídico' },
  PROFESSIONAL: { id: 'profissional', label: 'Conhecimento profissional e técnico' },
  UNDETERMINED: { id: 'indeterminado', label: 'Natureza epistemológica ainda não determinada' }
});

export const GROUPS = Object.freeze({
  EXATAS: 'Ciências Exatas e Tecnológicas',
  NATURAIS: 'Ciências Naturais e Biológicas',
  HUMANAS: 'Ciências Humanas e Sociais',
  PSI: 'Psicologia e Psicanálise',
  EDUCACAO: 'Educação e Desenvolvimento Humano',
  SAUDE: 'Saúde e Áreas Profissionais'
});

const N = EPISTEMIC_NATURES;

const BUILTIN_ADAPTERS = [
  {
    id: 'matematica',
    version: '0.1.0',
    area: 'Matemática',
    group: GROUPS.EXATAS,
    names: ['matematica'],
    keywords: [
      { p: 'equac', w: 3 }, { p: 'funcao|funcoes', w: 3 }, { p: 'geometri', w: 3 },
      { p: 'fracao|fracoes', w: 3 }, { p: 'algebr', w: 3 }, { p: 'trigonometri', w: 3 },
      { p: 'probabilidad', w: 3 }, { p: 'estatistic', w: 3 }, { p: 'inteiros', w: 3 },
      { p: 'pitagoras|teorema de', w: 3 }, { p: 'quadratic', w: 3 }, { p: 'sistemas? (de )?(equac|lineares)', w: 3 },
      { p: 'porcentagem|razao e proporcao', w: 3 }, { p: 'plano cartesiano|reta numerica', w: 3 },
      { p: 'polinomi', w: 3 }, { p: 'logaritm', w: 3 }, { p: 'matriz|matrizes|determinante', w: 2 }
    ],
    subareas: [
      { label: 'Álgebra e funções', p: ['equac', 'funcao|funcoes', 'quadratic', 'polinomi', 'algebr'] },
      { label: 'Geometria', p: ['geometri', 'pitagoras', 'triangulo', 'area de', 'perimetro'] },
      { label: 'Aritmética e números', p: ['inteiros', 'fracao|fracoes', 'porcentagem', 'razao'] },
      { label: 'Estatística e probabilidade', p: ['estatistic', 'probabilidad', 'media e mediana'] },
      { label: 'Trigonometria', p: ['trigonometri', 'seno|cosseno'] }
    ],
    natures: { primary: [N.FORMAL], secondary: [] },
    evidenceTypes: ['Demonstração e coerência lógica'],
    representations: ['Plano cartesiano', 'Reta numérica', 'Figuras geométricas', 'Gráficos', 'Modelos de frações', 'Diagramas algébricos'],
    keyAuthors: [],
    cautions: ['Verificar domínio e restrições das expressões.', 'Conferir cada resolução e o gabarito.'],
    auditFocus: ['Erro matemático', 'Consistência simbólica', 'Correção dos procedimentos', 'Gabarito conferido'],
    doNotRequire: ['Evidência empírica', 'Controvérsia científica', 'Referências de pesquisa empírica em atividade escolar original'],
    limits: ['Exemplos gerados por motor local devem ser conferidos pelo professor antes do uso.']
  },
  {
    id: 'fisica',
    version: '0.1.0',
    area: 'Física',
    group: GROUPS.EXATAS,
    names: ['fisica'],
    keywords: [
      { p: 'cinematica|dinamica|termodinamica|optica|eletricidade', w: 3 },
      { p: 'movimento uniforme|mru|mruv|velocidade media|aceleracao', w: 3 },
      { p: 'leis de newton|forca resultante|energia cinetica|energia potencial', w: 3 },
      { p: 'circuito|corrente eletrica|ondas?\\b', w: 2 }, { p: 'referencial|trajetoria|deslocamento', w: 2 }
    ],
    subareas: [
      { label: 'Cinemática', p: ['cinematica', 'movimento uniforme', 'mru', 'velocidade media', 'aceleracao'] },
      { label: 'Dinâmica', p: ['dinamica', 'newton', 'forca'] },
      { label: 'Termodinâmica', p: ['termodinamica', 'calor', 'temperatura'] },
      { label: 'Eletricidade', p: ['eletricidade', 'circuito', 'corrente'] },
      { label: 'Óptica e ondas', p: ['optica', 'onda'] }
    ],
    natures: { primary: [N.EMPIRICAL], secondary: [N.FORMAL] },
    evidenceTypes: ['Observação e medida', 'Modelo matemático'],
    representations: ['Diagramas de forças', 'Gráficos de movimento', 'Circuitos', 'Esquemas de fenômenos', 'Representações de ondas'],
    keyAuthors: [],
    cautions: ['Conferir unidades e análise dimensional.', 'Distinguir modelo, fenômeno e grandeza medida.'],
    auditFocus: ['Coerência entre modelo, fenômeno e grandezas', 'Unidades e sinais', 'Interpretação física de gráficos'],
    doNotRequire: ['Demonstração formal completa de cada equação em material de Ensino Médio'],
    limits: ['A adequação empírica de um modelo não decorre de sua validade formal.']
  },
  {
    id: 'quimica',
    version: '0.1.0',
    area: 'Química',
    group: GROUPS.NATURAIS,
    names: ['quimica'],
    keywords: [
      { p: 'atomo|atomico|molecul|estequiometria|tabela periodica', w: 3 },
      { p: 'reacao quimica|ligacao (ionica|covalente)|solucao|acido|base\\b', w: 2 }
    ],
    subareas: [
      { label: 'Química geral', p: ['atomo', 'tabela periodica', 'ligacao'] },
      { label: 'Estequiometria e reações', p: ['estequiometria', 'reacao'] }
    ],
    natures: { primary: [N.EMPIRICAL], secondary: [] },
    evidenceTypes: ['Observação e medida', 'Modelo atômico e molecular'],
    representations: ['Estruturas moleculares', 'Ligações', 'Modelos atômicos', 'Esquemas de reações'],
    keyAuthors: [],
    cautions: ['Modelos atômicos são modelos: indicar limites de cada um.'],
    auditFocus: ['Nomenclatura química', 'Balanceamento', 'Coerência entre modelo e fenômeno'],
    doNotRequire: ['Demonstração formal', 'Validação clínica'],
    limits: []
  },
  {
    id: 'biologia',
    version: '0.1.0',
    area: 'Biologia',
    group: GROUPS.NATURAIS,
    names: ['biologia'],
    keywords: [
      { p: 'celula|celular|genetic|ecologi|fotossintese|organismo|dna\\b|ecossistema', w: 3 },
      { p: 'evolucao', w: 1 }
    ],
    subareas: [
      { label: 'Citologia', p: ['celula', 'celular'] },
      { label: 'Genética', p: ['genetic', 'dna'] },
      { label: 'Ecologia', p: ['ecologi', 'ecossistema'] }
    ],
    natures: { primary: [N.EMPIRICAL], secondary: [N.EVIDENCE_BASED] },
    evidenceTypes: ['Observação', 'Experimento', 'Evidência comparada'],
    representations: ['Estruturas', 'Sistemas', 'Diagramas de processos biológicos'],
    keyAuthors: [],
    cautions: ['Não inventar estruturas ou relações funcionais.'],
    auditFocus: ['Nomenclatura biológica', 'Coerência dos processos descritos'],
    doNotRequire: ['Demonstração formal'],
    limits: []
  },
  {
    id: 'neuroanatomia',
    version: '0.1.0',
    area: 'Neuroanatomia',
    group: GROUPS.NATURAIS,
    names: ['neuroanatomia'],
    keywords: [
      { p: 'sistema nervoso', w: 4 }, { p: 'encefalo|cortex|medula espinal|hipocampo|talamo|hipotalamo|cerebelo|tronco encefalico', w: 3 },
      { p: 'lobo (frontal|parietal|temporal|occipital)', w: 3 }, { p: 'nervos? cranian', w: 3 }
    ],
    subareas: [
      { label: 'Sistema nervoso central', p: ['sistema nervoso central|snc', 'encefalo', 'medula'] },
      { label: 'Sistema nervoso periférico', p: ['periferic', 'nervos? cranian'] }
    ],
    natures: { primary: [N.EVIDENCE_BASED], secondary: [N.EMPIRICAL] },
    evidenceTypes: ['Descrição anatômica', 'Literatura científica revisada'],
    representations: ['Estruturas anatômicas', 'Sistemas', 'Relações funcionais'],
    keyAuthors: [],
    cautions: [
      'Usar nomenclatura anatômica reconhecida e conferir a fonte.',
      'Não inventar estruturas, conexões ou relações funcionais.',
      'Distinguir estrutura de função e evitar localizacionismo estrito.'
    ],
    auditFocus: ['Erro de nomenclatura anatômica', 'Organização anatômica', 'Relações funcionais sustentadas por fonte'],
    doNotRequire: ['Critérios de validação clínica', 'Engenharia didática de aula', 'DUA em atlas ou guia de consulta'],
    limits: ['Diagramas SVG gerados localmente são esquemas didáticos, não representação anatômica fiel.']
  },
  {
    id: 'neurociencias',
    version: '0.1.0',
    area: 'Neurociências',
    group: GROUPS.NATURAIS,
    names: ['neurociencia'],
    keywords: [
      { p: 'sinapse|sinaptic|neuroplasticidade|neuronio|neuroimagem|cognicao neural', w: 3 },
      { p: 'cerebro', w: 2 }
    ],
    subareas: [
      { label: 'Neurociência cognitiva', p: ['cognicao', 'atencao', 'memoria'] },
      { label: 'Neurociência e educação', p: ['educacao', 'aprendizagem'] }
    ],
    natures: { primary: [N.EVIDENCE_BASED], secondary: [] },
    evidenceTypes: ['Estudos empíricos', 'Revisões e meta-análises'],
    representations: ['Quadros comparativos', 'Diagramas de relações entre níveis explicativos'],
    keyAuthors: [],
    cautions: [
      'Distinguir correlação de causalidade.',
      'Evitar neuromitos e reducionismo.',
      'Não transpor resultado de laboratório diretamente para a sala de aula.'
    ],
    auditFocus: ['Qualidade metodológica das evidências', 'Consensos e controvérsias', 'Níveis explicativos'],
    doNotRequire: ['Demonstração formal'],
    limits: ['Sem busca externa, o motor local não garante o estado atual da literatura.']
  },
  {
    id: 'psicanalise',
    version: '0.1.0',
    area: 'Psicanálise',
    group: GROUPS.PSI,
    names: ['psicanalis'],
    keywords: [
      { p: 'freud', w: 4 }, { p: 'winnicott', w: 4 }, { p: 'bion\\b', w: 4 }, { p: 'lacan', w: 4 }, { p: 'melanie klein|kleinian', w: 4 },
      { p: 'inconsciente|pulsao|pulsoes|transferencia|complexo de edipo|objeto transicional', w: 3 },
      { p: 'constituicao psiquica|aparelho psiquico', w: 3 }
    ],
    subareas: [
      { label: 'Psicanálise freudiana', p: ['freud', 'pulsao|pulsoes', 'inconsciente'] },
      { label: 'Psicanálise winnicottiana', p: ['winnicott', 'objeto transicional', 'espaco potencial'] },
      { label: 'Psicanálise bioniana', p: ['bion\\b'] },
      { label: 'Psicanálise lacaniana', p: ['lacan'] },
      { label: 'Psicanálise kleiniana', p: ['klein'] }
    ],
    natures: { primary: [N.THEORETICAL], secondary: [N.HISTORICAL] },
    evidenceTypes: ['Teórica e conceitual', 'Clínica relatada (não experimental)'],
    representations: ['Mapas conceituais', 'Quadros comparativos', 'Genealogias teóricas', 'Diagramas de relações conceituais'],
    keyAuthors: ['Freud', 'Klein', 'Winnicott', 'Bion', 'Lacan'],
    cautions: [
      'Respeitar a genealogia dos conceitos e as diferenças entre escolas; evitar falsas equivalências.',
      'Distinguir obra original, edição e tradução.',
      'Não tratar interpretação psicanalítica como resultado experimental.',
      'Não produzir diagnóstico nem substituir avaliação profissional.'
    ],
    auditFocus: ['Fidelidade conceitual', 'Atribuição de autoria e obra', 'Diferenças entre escolas', 'Rastreabilidade de edições e traduções'],
    doNotRequire: ['Dados experimentais', 'Validação clínica', 'Demonstração formal', 'DUA em ensaio ou estudo teórico'],
    limits: ['Sem acesso integral às obras, o material deve declarar o nível de acesso de cada fonte.']
  },
  {
    id: 'psicologia',
    version: '0.1.0',
    area: 'Psicologia',
    group: GROUPS.PSI,
    names: ['psicologia'],
    keywords: [
      { p: 'psicolog', w: 4 }, { p: 'vygotsky|piaget|luria|wallon|bandura', w: 3 },
      { p: 'desenvolvimento cognitivo|comportamento|cognitiv', w: 2 }
    ],
    subareas: [
      { label: 'Psicologia histórico-cultural', p: ['vygotsky', 'luria', 'historico.cultural'] },
      { label: 'Psicologia do desenvolvimento', p: ['piaget', 'wallon', 'desenvolvimento'] },
      { label: 'Psicologia cognitiva', p: ['cognitiv'] }
    ],
    natures: { primary: [N.THEORETICAL], secondary: [N.EVIDENCE_BASED] },
    evidenceTypes: ['Teórica', 'Empírica (pesquisa psicológica)'],
    representations: ['Mapas conceituais', 'Quadros comparativos', 'Genealogias teóricas'],
    keyAuthors: ['Vygotsky', 'Piaget', 'Luria', 'Wallon'],
    cautions: [
      'Distinguir abordagem teórica de evidência empírica.',
      'Não confundir Zona de Desenvolvimento Proximal com scaffolding (Wood, Bruner e Ross, 1976).'
    ],
    auditFocus: ['Atribuição teórica', 'Distinção entre teoria e evidência', 'Contexto histórico dos conceitos'],
    doNotRequire: ['Demonstração formal'],
    limits: []
  },
  {
    id: 'filosofia',
    version: '0.1.0',
    area: 'Filosofia',
    group: GROUPS.HUMANAS,
    names: ['filosofi'],
    keywords: [
      { p: 'racionalismo|empirismo|epistemologia|metafisica|etica\\b|ontologia|fenomenologia|estoicismo|pragmatismo', w: 4 },
      { p: 'descartes|spinoza|leibniz|locke|berkeley|hume|kant|aristoteles|platao', w: 3 },
      { p: 'kierkegaard|nietzsche|hegel|sartre|heidegger|schopenhauer|existencialis|hermeneutic', w: 3 }
    ],
    subareas: [
      { label: 'Epistemologia moderna', p: ['racionalismo', 'empirismo', 'descartes', 'locke', 'hume', 'kant'] },
      { label: 'Ética', p: ['etica\\b', 'estoicismo'] },
      { label: 'Metafísica e ontologia', p: ['metafisica', 'ontologia'] }
    ],
    natures: { primary: [N.PHILOSOPHICAL], secondary: [N.HISTORICAL] },
    evidenceTypes: ['Argumentação', 'Texto primário e tradição interpretativa'],
    representations: ['Mapas argumentativos', 'Quadros comparativos', 'Linhas históricas', 'Diagramas conceituais'],
    keyAuthors: [],
    cautions: [
      'Reconstruir argumentos e explicitar pressupostos.',
      'Distinguir texto primário de comentário.',
      'Não apresentar interpretação como consenso; evitar anacronismo.'
    ],
    auditFocus: ['Consistência argumentativa', 'Contextualização histórica', 'Fidelidade ao texto primário', 'Contraposição de perspectivas'],
    doNotRequire: ['Demonstração matemática', 'Diagrama SVG em texto argumentativo', 'DUA em ensaio filosófico'],
    limits: []
  },
  {
    id: 'educacao',
    version: '0.1.0',
    area: 'Educação',
    group: GROUPS.EDUCACAO,
    names: ['pedagogi', 'didatica'],
    keywords: [
      { p: 'educacao|educacional', w: 3 },
      { p: 'ensino e aprendizagem|aprendizagem', w: 2 },
      { p: 'formacao docente|formacao de professores|curriculo|bncc', w: 4 },
      { p: 'planejamento (educacional|pedagogico|de ensino)|avaliacao da aprendizagem|metodologias? ativas?', w: 3 }
    ],
    subareas: [
      { label: 'Formação de professores', p: ['formacao docente', 'formacao de professores'] },
      { label: 'Currículo e avaliação', p: ['curriculo', 'bncc', 'avaliacao'] },
      { label: 'Planejamento e didática', p: ['planejamento', 'didatica'] }
    ],
    natures: { primary: [N.THEORETICAL], secondary: [N.NORMATIVE] },
    evidenceTypes: ['Teórica', 'Normativa', 'Empírica (pesquisa educacional)'],
    representations: ['Fluxos pedagógicos', 'Matrizes de planejamento', 'Esquemas de mediação'],
    keyAuthors: ['Vygotsky', 'Duval'],
    cautions: [
      'Não atribuir a Vygotsky a formulação original de scaffolding (Wood, Bruner e Ross, 1976).',
      'As categorias I, II e III do MathLab são operacionais internas, não classificações de autores.',
      'Verificar a vigência de documentos curriculares.'
    ],
    auditFocus: ['Atribuição teórica', 'Alinhamento entre objetivos, atividades e avaliação', 'Vigência normativa'],
    doNotRequire: ['Demonstração formal'],
    limits: []
  },
  {
    id: 'educacao_especial',
    version: '0.1.0',
    area: 'Educação Especial e AEE',
    group: GROUPS.EDUCACAO,
    specializes: 'educacao',
    names: ['educacao especial', 'atendimento educacional especializado'],
    keywords: [
      { p: '\\baee\\b', w: 5 }, { p: 'educacao inclusiva|inclusiv', w: 3 }, { p: 'acessibilidade', w: 3 },
      { p: 'deficiencia|autis|\\btea\\b|altas habilidades|superdotacao', w: 3 },
      { p: 'plano educacional individualizado|\\bpei\\b|tecnologia assistiva|desenho universal', w: 4 }
    ],
    subareas: [
      { label: 'Atendimento Educacional Especializado', p: ['\\baee\\b', 'atendimento educacional'] },
      { label: 'Acessibilidade e DUA', p: ['acessibilidade', 'desenho universal', 'dua\\b'] },
      { label: 'Planejamento individualizado', p: ['plano educacional individualizado', 'planejamento'] }
    ],
    natures: { primary: [N.PROFESSIONAL, N.NORMATIVE], secondary: [N.THEORETICAL] },
    evidenceTypes: ['Normativa', 'Literatura científica', 'Documentos oficiais'],
    representations: ['Mapas de acessibilidade', 'Matrizes de planejamento', 'Fluxos pedagógicos'],
    keyAuthors: [],
    cautions: [
      'Não reduzir o estudante a um diagnóstico.',
      'Diferenciar informação clínica, pedagógica e institucional.',
      'Verificar a vigência de cada norma: documentos desta área foram revogados e substituídos ao longo do tempo.',
      'Preservar a confidencialidade de dados pessoais.'
    ],
    auditFocus: ['Norma desatualizada', 'Terminologia adequada', 'Barreiras, participação e condições de aprendizagem'],
    doNotRequire: ['Demonstração formal', 'Evidência experimental para cada afirmação normativa'],
    limits: ['O motor local não confere vigência de normas: exige consulta a fonte oficial.']
  },
  {
    id: 'terapia_ocupacional',
    version: '0.1.0',
    area: 'Terapia Ocupacional',
    group: GROUPS.SAUDE,
    names: ['terapia ocupacional', 'terapeuta ocupacional'],
    keywords: [
      { p: 'desempenho ocupacional|ocupacao humana|atividades de vida diaria', w: 4 },
      { p: 'ocupacao|ocupacoes', w: 2 }, { p: 'funcionalidade|\\bcif\\b', w: 2 }, { p: 'participacao', w: 1 }
    ],
    subareas: [
      { label: 'Ocupação e participação', p: ['ocupacao', 'participacao'] },
      { label: 'Funcionalidade', p: ['funcionalidade', 'cif'] }
    ],
    natures: { primary: [N.PROFESSIONAL], secondary: [N.EVIDENCE_BASED] },
    evidenceTypes: ['Referenciais profissionais', 'Literatura científica'],
    representations: ['Quadros comparativos', 'Mapas conceituais', 'Matrizes de análise de referenciais'],
    keyAuthors: [],
    cautions: [
      'Respeitar escopo de atuação e responsabilidades profissionais.',
      'Não produzir diagnóstico, protocolo ou prescrição de tratamento.',
      'Não extrapolar evidências além do que os estudos sustentam.'
    ],
    auditFocus: ['Precisão conceitual', 'Referenciais profissionais', 'Limites do escopo', 'Evidências e limitações'],
    doNotRequire: ['Demonstração formal', 'Engenharia didática de aula em material de estudo profissional'],
    limits: ['Material de estudo não substitui avaliação nem orientação profissional.']
  }
];

const REQUIRED_FIELDS = ['id', 'version', 'area', 'group', 'keywords', 'natures', 'cautions', 'auditFocus', 'doNotRequire'];

export function validateAdapter(adapter) {
  const errors = [];
  if (!adapter || typeof adapter !== 'object') return ['Adaptador inválido (não é objeto).'];
  for (const f of REQUIRED_FIELDS) {
    if (adapter[f] === undefined || adapter[f] === null || adapter[f] === '') errors.push(`Campo obrigatório ausente: ${f}.`);
  }
  if (adapter.id && !/^[a-z0-9_]+$/.test(adapter.id)) errors.push('id deve usar apenas a-z, 0-9 e _.');
  if (adapter.version && !/^\d+\.\d+\.\d+$/.test(adapter.version)) errors.push('version deve seguir MAJOR.MINOR.PATCH.');
  if (!Array.isArray(adapter.keywords) || adapter.keywords.length === 0) errors.push('keywords deve ser lista não vazia.');
  if (adapter.natures && !Array.isArray(adapter.natures.primary)) errors.push('natures.primary deve ser lista.');
  if (Array.isArray(adapter.keywords)) {
    for (const k of adapter.keywords) {
      try {
        new RegExp(k.p);
      } catch {
        errors.push(`Padrão inválido em keywords: ${k?.p}`);
      }
    }
  }
  if (adapter.auditRules !== undefined) {
    if (!Array.isArray(adapter.auditRules)) errors.push('auditRules deve ser lista.');
    else {
      for (const r of adapter.auditRules) {
        for (const f of ['id', 'severity', 'category', 'pattern', 'problem', 'fix']) {
          if (!r?.[f]) errors.push(`auditRules: campo ${f} ausente na regra ${r?.id || '(sem id)'}.`);
        }
        if (r?.severity && !['hard', 'soft'].includes(r.severity)) errors.push(`auditRules: severity inválida em ${r.id}.`);
        for (const key of ['pattern', 'unless']) {
          if (r?.[key]) {
            try {
              new RegExp(r[key]);
            } catch {
              errors.push(`auditRules: padrão ${key} inválido em ${r.id}.`);
            }
          }
        }
      }
    }
  }
  return errors;
}


/**
 * Regras de auditoria por área (Fase 3, prompt mestre seção 15).
 *
 * Cada regra descreve uma falha REAL e identificável, com evidência no próprio texto.
 * pattern e unless são expressões regulares escritas SEM acentos e em minúsculas, pois o texto auditado
 * é normalizado (sem acentos, minúsculo) antes da busca. unless suprime a regra quando o texto já traz a ressalva.
 * severity: 'hard' bloqueia exportação (use só para erro afirmado no texto); 'soft' é ressalva para o autor revisar.
 *
 * São heurísticas de texto: encontram formulações problemáticas, não substituem revisão por especialista.
 */
const RULE_DIV_ZERO = {
  id: 'MAT_DIVISAO_POR_ZERO',
  severity: 'hard',
  category: 'Matemática',
  pattern: '/\\s*0(?![.,\\d])',
  unless: 'nao existe divisao por zero|proibid|diferente de zero|denominador (nao pode|e)',
  problem: 'Possível divisão por zero sem ressalva explícita.',
  fix: 'Verificar o domínio da expressão e explicitar a restrição de denominador diferente de zero.'
};

const RULE_CLINICAL = {
  id: 'SAUDE_AFIRMACAO_CLINICA',
  severity: 'soft',
  category: 'Científica',
  pattern:
    '\\b(o|a)\\s+(paciente|crianca|aluno|aluna|estudante)\\s+(tem|possui|apresenta|sofre de)\\s+(transtorno|autismo|tdah|depressao|ansiedade|esquizofrenia|psicose|neurose|deficiencia)\\b|\\be diagnosticad[oa]\\s+com\\b',
  problem: 'Formulação com aparência de diagnóstico clínico atribuído a uma pessoa.',
  fix: 'Material de estudo não diagnostica. Reformular como descrição conceitual ou caso ilustrativo identificado como tal, e remeter a avaliação profissional.'
};

const RULE_DECRETO_10502 = {
  id: 'NORMA_DECRETO_10502_REVOGADO',
  severity: 'hard',
  category: 'Normativa',
  pattern: 'decreto\\s*(n[ºo.]*\\s*)?10\\.?502|\\bpnee\\s*2020|politica nacional de educacao especial[^.\\n]{0,40}2020',
  unless: 'revogad|11\\.?370',
  problem:
    'Cita o Decreto nº 10.502/2020 (Política Nacional de Educação Especial de 2020) sem informar que foi revogado pelo Decreto nº 11.370, de 1º de janeiro de 2023.',
  fix: 'Informar a revogação ou citar a norma vigente. Verifique a vigência na fonte oficial antes de publicar.',
  source: 'Decreto nº 11.370/2023, art. 1º: "Fica revogado o Decreto nº 10.502, de 30 de setembro de 2020." (Câmara dos Deputados, Legin)'
};

const AUDIT_RULES = {
  matematica: [RULE_DIV_ZERO],
  fisica: [RULE_DIV_ZERO],
  quimica: [RULE_DIV_ZERO],
  psicanalise: [
    {
      id: 'PSI_INTERPRETACAO_COMO_RESULTADO_EXPERIMENTAL',
      severity: 'soft',
      category: 'Científica',
      pattern: '(comprovad|demonstrad|provad)[oa]s?\\s+(empirica|experimental|cientifica)mente',
      unless: 'nao (foi|foram|e|sao) (comprovad|demonstrad|provad)',
      problem: 'Formulação trata uma interpretação ou construção teórica como resultado empírico ou experimental comprovado.',
      fix: 'Distinguir teoria e interpretação clínica de evidência experimental; atribuir a afirmação ao autor e à obra.'
    },
    {
      id: 'PSI_FALSA_EQUIVALENCIA',
      severity: 'soft',
      category: 'Conceitual',
      pattern: '\\b(dizem|afirmam|defendem|entendem|pensam)\\s+(exatamente\\s+)?(a\\s+)?mesma\\s+coisa|\\bsao\\s+(sinonimos|equivalentes)\\b',
      problem: 'Possível falsa equivalência entre autores ou conceitos de escolas diferentes.',
      fix: 'Explicitar o que cada autor afirma, em qual obra, e onde os conceitos divergem.'
    },
    RULE_CLINICAL
  ],
  psicologia: [RULE_CLINICAL],
  terapia_ocupacional: [
    RULE_CLINICAL,
    {
      id: 'TO_PRESCRICAO_OU_PROTOCOLO',
      severity: 'soft',
      category: 'Normativa',
      pattern: 'o tratamento (indicado|correto|adequado) (e|sera)|\\bprescrev(e|emos|er)\\b|protocolo (de tratamento|clinico) (para|de)',
      problem: 'Formulação com aparência de prescrição ou protocolo de tratamento.',
      fix: 'Material de estudo não prescreve. Descrever referenciais e evidências disponíveis e remeter a decisão ao profissional habilitado.'
    }
  ],
  neuroanatomia: [],
  neurociencias: [],
  filosofia: [
    {
      id: 'FIL_INTERPRETACAO_COMO_CONSENSO',
      severity: 'soft',
      category: 'Conceitual',
      pattern:
        'e consenso (entre|na|na area)\\s+(os\\s+)?(filosofos|filosofia)|todos os filosofos\\s+(concordam|afirmam|defendem)|a filosofia\\s+(prova|demonstra)\\b',
      unless: 'nao ha consenso',
      problem: 'Interpretação filosófica apresentada como consenso ou como demonstração.',
      fix: 'Atribuir a tese ao autor ou à tradição interpretativa e indicar as leituras divergentes.'
    }
  ],
  educacao: [RULE_DECRETO_10502],
  educacao_especial: [
    RULE_DECRETO_10502,
    {
      id: 'EE_TERMINOLOGIA_DESATUALIZADA',
      severity: 'soft',
      category: 'Normativa',
      pattern: 'portador(a|es|as)?\\s+de\\s+(deficiencia|necessidades)|\\bretardo mental\\b|\\bretardad[oa]s?\\b|\\bmongol',
      unless: 'terminologia (antiga|historica|anterior)|termo (antigo|historico)',
      problem: 'Terminologia desatualizada ou inadequada para se referir a pessoas com deficiência.',
      fix: 'Usar "pessoa com deficiência" e a terminologia da Convenção sobre os Direitos das Pessoas com Deficiência (Decreto nº 6.949/2009) e da Lei nº 13.146/2015. Se o termo for citação histórica, indicar isso no texto.'
    },
    {
      id: 'EE_REDUCAO_AO_DIAGNOSTICO',
      severity: 'soft',
      category: 'Pedagógica',
      pattern: '\\bos (autistas|deficientes|cadeirantes|surdos)\\s+(nao conseguem|nao aprendem|nao sao capazes|so conseguem)',
      problem: 'Generalização que reduz o estudante ao diagnóstico ou à condição.',
      fix: 'Descrever barreiras, apoios e condições de aprendizagem, e não limitações atribuídas ao diagnóstico.'
    }
  ]
};
// Regras de neuromitos valem para Neuroanatomia, Neurociências e para quem as cruzar com Educação.
const NEUROMYTH_RULES = [
  {
    id: 'NEURO_MITO_10_POR_CENTO',
    severity: 'hard',
    category: 'Científica',
    pattern: '(usamos|utilizamos|usa|utiliza|usam)\\s+(apenas|somente|so)\\s+(de\\s+)?(10|dez)\\s*(%|por cento)\\s+(do|de)\\s+(nosso\\s+)?cerebro',
    unless: '\\bmito\\b|neuromito|falsa|equivocad',
    problem: 'Reproduz o neuromito de que usamos apenas 10% do cérebro, afirmado como fato.',
    fix: 'Remover a afirmação ou apresentá-la explicitamente como mito, com fonte de revisão científica.'
  },
  {
    id: 'NEURO_MITO_ESTILOS_DE_APRENDIZAGEM',
    severity: 'soft',
    category: 'Pedagógica',
    pattern: '(aprendizes|alunos|estudantes)\\s+(visuais|auditivos|cinestesicos)|estilos? de aprendizagem',
    unless: '\\bmito\\b|neuromito|nao ha evidencia|sem evidencia|criticad|criticas? a',
    problem: 'Menciona estilos de aprendizagem (visual, auditivo, cinestésico) sem ressalva sobre a fragilidade das evidências.',
    fix: 'Apresentar como hipótese controversa e indicar a literatura que a examina, ou reformular em termos de múltiplas representações.'
  }
];
AUDIT_RULES.neuroanatomia = NEUROMYTH_RULES;
AUDIT_RULES.neurociencias = NEUROMYTH_RULES;
AUDIT_RULES.educacao = [...AUDIT_RULES.educacao, ...NEUROMYTH_RULES.filter((r) => r.id === 'NEURO_MITO_ESTILOS_DE_APRENDIZAGEM')];

const registry = new Map();
for (const a of BUILTIN_ADAPTERS) registry.set(a.id, Object.freeze({ auditRules: AUDIT_RULES[a.id] || [], ...a }));

export function registerAdapter(adapter) {
  const errors = validateAdapter(adapter);
  if (errors.length) throw new Error(`Adaptador rejeitado: ${errors.join(' ')}`);
  if (registry.has(adapter.id)) throw new Error(`Já existe adaptador com id "${adapter.id}". Use outra versão de id.`);
  registry.set(adapter.id, Object.freeze({ subareas: [], names: [], keyAuthors: [], evidenceTypes: [], representations: [], limits: [], auditRules: [], ...adapter }));
  return adapter.id;
}

export function unregisterAdapter(id) {
  if (BUILTIN_ADAPTERS.some((a) => a.id === id)) throw new Error('Adaptadores nativos não podem ser removidos.');
  return registry.delete(id);
}

export function listAdapters() {
  return [...registry.values()];
}

export function normalizeText(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function getAdapterByArea(areaLabel) {
  const target = normalizeText(areaLabel).trim();
  if (!target) return null;
  return (
    listAdapters().find((a) => normalizeText(a.area) === target || a.id === target) ||
    listAdapters().find((a) => normalizeText(a.area).startsWith(target) || target.startsWith(normalizeText(a.area))) ||
    null
  );
}

export function getAdapterById(id) {
  return registry.get(id) || null;
}
