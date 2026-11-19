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
  THEOLOGICAL: { id: 'teologico', label: 'Conhecimento teológico e hermenêutico' },
  LINGUISTIC: { id: 'linguistico', label: 'Conhecimento linguístico e descritivo' },
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
  SAUDE: 'Saúde e Áreas Profissionais',
  ARTES: 'Artes e Linguagens',
  LINGUAGENS: 'Linguagens e Códigos'
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
      { p: 'selecao natural|mitose|meiose|respiracao celular|taxonomia|cadeia alimentar|sistema (digestorio|circulatorio|respiratorio|nervoso|imunologico)', w: 3 },
      { p: 'evolucao', w: 1 }
    ],
    subareas: [
      { label: 'Citologia', p: ['celula', 'celular', 'mitose', 'meiose'] },
      { label: 'Genética', p: ['genetic', 'dna'] },
      { label: 'Ecologia', p: ['ecologi', 'ecossistema', 'cadeia alimentar'] },
      { label: 'Evolução', p: ['evolucao', 'selecao natural'] },
      { label: 'Fisiologia', p: ['sistema (digestorio|circulatorio|respiratorio|nervoso)'] }
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
    id: 'historia',
    version: '0.1.0',
    area: 'História',
    group: GROUPS.HUMANAS,
    names: ['historia'],
    keywords: [
      { p: 'revolucao (francesa|industrial|russa|farroupilha)|idade media|feudalismo|renascimento|imperio romano|antiguidade classica|guerra fria|guerras? mundiais?|primeira guerra|segunda guerra', w: 4 },
      { p: 'brasil (colonia|imperio|colonial)|periodo colonial|escravidao|republica velha|era vargas|ditadura militar|independencia do brasil|abolicao', w: 4 },
      { p: 'egito antigo|mesopotamia|grecia antiga|roma antiga|civilizacoes?', w: 3 },
      { p: 'historia\\b|historiograf|fontes historicas|linha do tempo', w: 2 }
    ],
    subareas: [
      { label: 'História antiga e medieval', p: ['egito antigo', 'mesopotamia', 'grecia antiga', 'roma antiga', 'idade media', 'feudalismo', 'imperio romano'] },
      { label: 'História moderna e contemporânea', p: ['revolucao', 'renascimento', 'guerra', 'guerra fria'] },
      { label: 'História do Brasil', p: ['brasil', 'colonial', 'escravidao', 'republica velha', 'era vargas', 'ditadura militar', 'abolicao', 'independencia'] }
    ],
    natures: { primary: [N.HISTORICAL], secondary: [N.THEORETICAL] },
    evidenceTypes: ['Fontes primárias e secundárias', 'Historiografia'],
    representations: ['Linhas do tempo', 'Mapas históricos', 'Quadros comparativos de fontes', 'Esquemas de causas e consequências'],
    keyAuthors: [],
    cautions: [
      'Situar cada fato no tempo e no lugar; evitar anacronismo.',
      'Distinguir fonte primária, fonte secundária e interpretação historiográfica.',
      'Tratar causas como múltiplas e inter-relacionadas, sem causa única nem determinismo.',
      'Conferir datas e nomes antes de usar: o motor local não verifica fatos.'
    ],
    auditFocus: ['Contextualização temporal', 'Uso crítico das fontes', 'Multicausalidade', 'Datas e nomes conferidos'],
    doNotRequire: ['Demonstração formal', 'Evidência experimental', 'Diagrama SVG em texto narrativo ou analítico'],
    limits: ['O motor local não verifica datas, nomes nem acontecimentos: o professor confere cada afirmação factual.']
  },
  {
    id: 'teologia',
    version: '0.1.0',
    area: 'Teologia e Ciências da Religião',
    group: GROUPS.HUMANAS,
    names: ['teologia', 'ciencias da religiao', 'ensino religioso'],
    keywords: [
      { p: 'teologi|exegese|hermeneutica biblica|patristic|soteriologia|cristologia|escatologia|eclesiologia', w: 5 },
      { p: 'biblia|biblic[oa]|evangelhos?|antigo testamento|novo testamento|escrituras sagradas|pentateuco|epistolas?', w: 4 },
      { p: 'religiao|religioso|religiosidade|ciencias da religiao|ensino religioso|tradicoes religiosas', w: 3 },
      { p: '\\bfe\\b|doutrina|sacramento|liturgia|cristianismo|islamismo|budismo|judaismo|hinduismo|candomble|umbanda', w: 2 }
    ],
    subareas: [
      { label: 'Estudo bíblico e exegese', p: ['biblia', 'biblic', 'exegese', 'evangelho', 'testamento', 'epistola'] },
      { label: 'Doutrina e teologia sistemática', p: ['doutrina', 'cristologia', 'soteriologia', 'escatologia', 'eclesiologia', 'teologi'] },
      { label: 'Ciências da Religião e diversidade religiosa', p: ['ciencias da religiao', 'ensino religioso', 'tradicoes religiosas', 'religiao'] }
    ],
    natures: { primary: [N.THEOLOGICAL], secondary: [N.HISTORICAL, N.PHILOSOPHICAL] },
    evidenceTypes: ['Texto sagrado e tradição interpretativa', 'Documentos históricos e confessionais', 'Argumentação teológica'],
    representations: ['Linhas do tempo', 'Quadros comparativos de tradições', 'Mapas conceituais', 'Mapas históricos e geográficos'],
    keyAuthors: [],
    cautions: [
      'Distinguir texto sagrado, tradição interpretativa e posição confessional; atribuir cada leitura a quem a sustenta.',
      'Não apresentar a doutrina de uma tradição como consenso entre as religiões nem como resultado científico.',
      'Citar texto sagrado com livro, capítulo, versículo e tradução usada.',
      'Em escola pública, o Ensino Religioso é não proselitista: tratar as tradições como objeto de estudo e respeitar a diversidade religiosa.'
    ],
    auditFocus: ['Fidelidade ao texto e à tradição citada', 'Distinção entre fé, história e filosofia', 'Respeito à diversidade religiosa', 'Citação com referência completa'],
    doNotRequire: ['Demonstração formal', 'Evidência experimental para afirmações de fé', 'Diagrama SVG em texto interpretativo'],
    limits: ['O motor local não avalia verdade de fé nem substitui a orientação da tradição confessional do autor.']
  },
  {
    id: 'teoria_musical',
    version: '0.1.0',
    area: 'Teoria Musical',
    group: GROUPS.ARTES,
    names: ['teoria musical', 'musicalizacao', 'educacao musical'],
    keywords: [
      { p: 'teoria musical|solfejo|musicalizacao|percepcao musical|harmonia|contraponto', w: 5 },
      { p: 'escala (maior|menor|cromatica|pentatonica)|intervalo musical|acordes?\\b|tonalidade|armadura de clave|campo harmonico|circulo das quintas', w: 4 },
      { p: 'compasso|clave de (sol|fa|do)|pauta|figuras? musicais?|semibreve|minima|seminima|colcheia|semicolcheia|pulsacao|andamento|semitom|semitons', w: 4 },
      { p: 'melodia|ritmo|musica|violino|violao|piano', w: 1 }
    ],
    subareas: [
      { label: 'Ritmo e compasso', p: ['compasso', 'semibreve', 'minima', 'seminima', 'colcheia', 'pulsacao', 'andamento', 'ritmo'] },
      { label: 'Escalas e intervalos', p: ['escala', 'intervalo', 'semitom', 'tonalidade', 'armadura'] },
      { label: 'Harmonia', p: ['harmonia', 'acorde', 'campo harmonico', 'circulo das quintas'] },
      { label: 'Notação musical', p: ['pauta', 'clave', 'figuras? musicais?'] }
    ],
    natures: { primary: [N.THEORETICAL, N.PROFESSIONAL], secondary: [N.HISTORICAL] },
    evidenceTypes: ['Tratados e métodos de teoria musical', 'Prática musical comentada'],
    representations: ['Pauta e notação (descritas em texto)', 'Teclado ou braço do instrumento (diagramas)', 'Círculo das quintas', 'Quadro de figuras rítmicas'],
    keyAuthors: [],
    cautions: [
      'Distinguir convenção de notação (o que foi combinado) de fenômeno acústico (o que é físico).',
      'O sistema tonal e o temperamento igual são construções históricas e culturais, não a única organização possível dos sons.',
      'Nomear as alturas com um único sistema (solfejo ou cifras) e não misturar convenções.',
      'Conferir cada exemplo de notação e de intervalo nota a nota, de preferência ao instrumento.'
    ],
    auditFocus: ['Precisão dos intervalos e escalas', 'Coerência de compasso e valores', 'Convenções de nomenclatura', 'Exemplos conferidos'],
    doNotRequire: ['Demonstração formal', 'Evidência empírica para convenções de notação'],
    limits: ['O motor local não ouve nem lê partituras: exemplos de notação, intervalos e acordes precisam ser conferidos pelo professor.']
  },
  {
    id: 'geografia',
    version: '0.1.0',
    area: 'Geografia',
    group: GROUPS.HUMANAS,
    names: ['geografia'],
    keywords: [
      { p: 'geografia|geografic[oa]s?|cartografia|geopolitica|urbanizacao|demografia', w: 5 },
      { p: 'relevo|bioma|bacia hidrografica|vegetacao|hidrografia|placas tectonicas|migracao|densidade demografica|regioes do brasil|ibge', w: 4 },
      { p: 'mapa|escala cartografica|projecao cartografica|latitude|longitude|fuso horario|coordenadas geograficas|rosa dos ventos', w: 4 },
      { p: 'territorio|paisagem|globalizacao|populacao|clima\\b', w: 2 }
    ],
    subareas: [
      { label: 'Cartografia', p: ['mapa', 'cartografi', 'escala cartografica', 'projecao', 'latitude', 'longitude', 'fuso horario', 'coordenadas'] },
      { label: 'Geografia física', p: ['relevo', 'clima', 'bioma', 'bacia hidrografica', 'vegetacao', 'hidrografia', 'placas tectonicas'] },
      { label: 'Geografia humana e econômica', p: ['urbanizacao', 'demografia', 'migracao', 'populacao', 'globalizacao', 'territorio', 'densidade demografica'] }
    ],
    natures: { primary: [N.EMPIRICAL], secondary: [] },
    evidenceTypes: ['Dados estatísticos e cartográficos', 'Observação de campo', 'Estudos da área'],
    representations: ['Mapas e croquis', 'Gráficos e tabelas de dados', 'Perfis topográficos', 'Climogramas', 'Blocos-diagrama'],
    keyAuthors: [],
    cautions: [
      'Todo dado (população, área, índice) leva fonte e ano; dados mudam e o motor local não os atualiza.',
      'Mapa em texto precisa dizer projeção, escala e o que está representado; toda projeção distorce alguma propriedade.',
      'Distinguir tempo atmosférico (condição de um momento) de clima (padrão de longo prazo).',
      'Em geografia humana, evitar hierarquias entre povos e lugares e dar atenção às escalas (local, regional, global).'
    ],
    auditFocus: ['Fonte e ano dos dados', 'Escala e projeção dos mapas', 'Distinção entre tempo e clima', 'Precisão de nomes e localizações'],
    doNotRequire: ['Demonstração formal', 'Experimento de laboratório', 'Diagrama SVG em texto descritivo ou analítico'],
    limits: ['O motor local não consulta bases de dados, não confere localizações nem gera mapas: números e mapas são conferidos pelo professor na fonte.']
  },
  {
    id: 'lingua_portuguesa',
    version: '0.1.0',
    area: 'Língua Portuguesa',
    group: GROUPS.LINGUAGENS,
    names: ['lingua portuguesa', 'portugues'],
    keywords: [
      { p: 'lingua portuguesa|gramatica|ortografia|sintaxe|morfologia|semantica|interpretacao de texto|producao textual|redacao', w: 5 },
      { p: 'substantivo|adjetivo|verbo|pronome|adverbio|preposicao|conjuncao|crase|concordancia (verbal|nominal)|regencia|pontuacao|oracao|periodo composto', w: 4 },
      { p: 'genero textual|texto narrativo|texto dissertativo|argumentativo|coesao|coerencia|variacao linguistica|norma culta', w: 4 },
      { p: 'leitura|escrita|texto|portugues', w: 1 }
    ],
    subareas: [
      { label: 'Gramática e análise linguística', p: ['gramatica', 'sintaxe', 'morfologia', 'substantivo', 'adjetivo', 'verbo', 'pronome', 'crase', 'concordancia', 'regencia', 'oracao', 'periodo'] },
      { label: 'Leitura e produção de texto', p: ['interpretacao', 'producao textual', 'redacao', 'genero textual', 'narrativo', 'dissertativo', 'argumentativo', 'coesao', 'coerencia'] },
      { label: 'Variação linguística', p: ['variacao linguistica', 'norma culta'] }
    ],
    natures: { primary: [N.LINGUISTIC], secondary: [] },
    evidenceTypes: ['Exemplos de uso real da língua', 'Gramáticas e descrições linguísticas', 'Corpora e textos autênticos'],
    representations: ['Quadros de classes e funções', 'Esquemas de análise sintática', 'Textos autênticos comentados', 'Linhas de revisão de texto'],
    keyAuthors: [],
    cautions: [
      'Partir de textos reais e do uso da língua; a regra vem depois do exemplo, não no lugar dele.',
      'Distinguir norma-padrão, variação linguística e adequação à situação comunicativa, sem tratar variedades como erro.',
      'Citar gramáticas e dicionários pela edição consultada; a norma pode variar entre obras e mudou com o Acordo Ortográfico.',
      'Conferir toda forma gramatical e toda grafia de exemplo antes de usar; o motor local não verifica ortografia.'
    ],
    auditFocus: ['Fidelidade da regra ao uso real', 'Distinção entre norma e variação', 'Exemplos autênticos e conferidos', 'Terminologia gramatical consistente'],
    doNotRequire: ['Demonstração formal', 'Evidência experimental', 'Diagrama SVG em texto analítico'],
    limits: ['O motor local não corrige ortografia, concordância ou pontuação: o professor confere cada exemplo.']
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
  biologia: [
    {
      id: 'BIO_TELEOLOGIA_EVOLUTIVA',
      severity: 'soft',
      category: 'Científica',
      pattern: '(o animal|a especie|a planta|o organismo|os seres vivos)\\s+(precisou|necessitou|quis|decidiu)\\s+(de\\s+)?(se\\s+)?(adaptar|evoluir|mudar)|evoluiu\\s+para\\s+(poder|conseguir)',
      unless: 'selecao natural|linguagem figurada|metafora|sem intencionalidade|sem intencao',
      problem: 'Explicação evolutiva com intenção ou finalidade (teleologia): a evolução não ocorre porque o organismo precisa ou quer mudar.',
      fix: 'Reescrever em termos de variação, hereditariedade e seleção natural: quem tem a característica vantajosa deixa mais descendentes.'
    },
    {
      id: 'BIO_CARACTERISTICAS_ADQUIRIDAS',
      severity: 'soft',
      category: 'Científica',
      pattern: 'caracteristicas adquiridas\\s+(sao|serao|podem ser)\\s+(herdadas|transmitidas|passadas)',
      unless: 'lamarck|historic|refutad|epigenetic|nao sao',
      problem: 'Afirma a herança de características adquiridas como fato, sem referência ao contexto histórico (Lamarck) nem à discussão atual.',
      fix: 'Atribuir a ideia a Lamarck, explicar por que o modelo foi superado pela genética e, se couber, tratar a epigenética como tema distinto.'
    }
  ],
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
  historia: [
    {
      id: 'HIS_CAUSA_UNICA',
      severity: 'soft',
      category: 'Histórica',
      pattern: '\\b(a|uma)\\s+(unica\\s+causa|causa\\s+unica)|(foi|foram)\\s+causad[oa]s?\\s+(apenas|somente|exclusivamente)\\s+por|so\\s+aconteceu\\s+por\\s+causa',
      unless: 'uma das causas|multiplas causas|varias causas|entre as causas',
      problem: 'Explicação histórica reduzida a uma causa única.',
      fix: 'Apresentar as causas como múltiplas e inter-relacionadas (econômicas, políticas, sociais, culturais) e indicar o peso que a historiografia atribui a cada uma.'
    },
    {
      id: 'HIS_DESCOBRIMENTO_DO_BRASIL',
      severity: 'soft',
      category: 'Conceitual',
      pattern: 'descobrimento do brasil|descobriu o brasil|descoberta do brasil',
      unless: 'expressao|termo|historiograf|chegada dos portugueses|invasao|discut',
      problem: 'Usa "descobrimento do Brasil" sem discutir a expressão, que tem perspectiva eurocêntrica e é debatida pela historiografia.',
      fix: 'Contextualizar a expressão ou preferir formulações como "chegada dos portugueses", indicando a perspectiva dos povos originários.'
    },
    {
      id: 'HIS_ESCRAVOS_TERMO',
      severity: 'soft',
      category: 'Conceitual',
      pattern: '\\bescravos\\b',
      unless: 'escravizad|terminologia|(termo|expressao)\\s+.?escravo',
      problem: 'Usa "escravos" como identidade das pessoas, sem a ressalva terminológica adotada por parte da historiografia.',
      fix: 'Considerar "pessoas escravizadas", que marca a escravidão como condição imposta, ou explicar a escolha do termo.'
    },
    {
      id: 'HIS_DATA_LEI_AUREA',
      severity: 'soft',
      category: 'Histórica',
      pattern: 'lei aurea[^.\\n]{0,60}\\b(1[0-9]{3}|20[0-9]{2})\\b',
      unless: '1888',
      problem: 'A Lei Áurea é citada com ano diferente de 1888.',
      fix: 'Conferir a data: a Lei Áurea (Lei nº 3.353) foi sancionada em 13 de maio de 1888.'
    },
    {
      id: 'HIS_DATA_PROCLAMACAO_REPUBLICA',
      severity: 'soft',
      category: 'Histórica',
      pattern: 'proclamacao da republica[^.\\n]{0,60}\\b(1[0-9]{3}|20[0-9]{2})\\b',
      unless: '1889',
      problem: 'A Proclamação da República é citada com ano diferente de 1889.',
      fix: 'Conferir a data: a República foi proclamada em 15 de novembro de 1889.'
    }
  ],
  teologia: [
    {
      id: 'TEO_DOUTRINA_COMO_CONSENSO',
      severity: 'soft',
      category: 'Conceitual',
      pattern: 'todas as religioes\\s+(ensinam|dizem|afirmam|defendem|pregam)|a\\s+(unica\\s+)?religiao\\s+verdadeira|(prova|comprova|demonstra)\\w*\\s+cientificamente\\s+(a\\s+)?(existencia de deus|a biblia|a fe)',
      unless: 'na perspectiva|segundo a tradicao|para (os|as) (fieis|adeptos|cristaos|muculmanos|judeus)|nao ha consenso',
      problem: 'Apresenta uma posição confessional como consenso entre as religiões, como verdade geral ou como resultado científico.',
      fix: 'Atribuir a afirmação à tradição que a sustenta ("segundo...", "na perspectiva de...") e distinguir fé, história e ciência.'
    },
    {
      id: 'TEO_CITACAO_SEM_REFERENCIA',
      severity: 'soft',
      category: 'Metodológica',
      pattern: 'a biblia\\s+(diz|afirma|ensina|declara)\\s+que',
      unless: '\\b\\d{1,3}\\s*[:.]\\s*\\d{1,3}\\b|traducao|versao',
      problem: 'Atribui uma afirmação à Bíblia sem indicar livro, capítulo, versículo e tradução.',
      fix: 'Citar o trecho com livro, capítulo e versículo, informar a tradução usada e distinguir o texto da interpretação.'
    }
  ],
  teoria_musical: [
    {
      id: 'MUS_TOM_SEMITOM',
      severity: 'hard',
      category: 'Musical',
      pattern: '\\bum tom\\s+(e igual a|equivale a|corresponde a|tem|e)\\s+(1|um|3|tres|4|quatro)\\s+semit(om|ons)\\b|\\bum semitom\\s+(e igual a|equivale a|corresponde a)\\s+(2|dois|duas)\\s+tons?\\b',
      problem: 'Relação incorreta entre tom e semitom: um tom equivale a dois semitons.',
      fix: 'Corrigir a relação (1 tom = 2 semitons; 1 semitom = meio tom) e conferir os intervalos que dependem dela.'
    },
    {
      id: 'MUS_VALOR_SEM_COMPASSO',
      severity: 'soft',
      category: 'Musical',
      pattern: '\\b(semibreve|minima|seminima|colcheia|semicolcheia)\\s+vale\\s+(um|uma|dois|duas|tres|quatro|meio|meia|[0-9]+)\\s+tempos?',
      unless: 'compasso|unidade de tempo|\\b[0-9]\\s*/\\s*[0-9]\\b',
      problem: 'Afirma o valor de uma figura em tempos sem indicar a unidade de tempo do compasso.',
      fix: 'Dizer a unidade de tempo (por exemplo, em compasso 4/4 a semínima vale um tempo) ou expressar o valor por relação entre figuras.'
    },
    {
      id: 'MUS_LINGUAGEM_UNIVERSAL',
      severity: 'soft',
      category: 'Conceitual',
      pattern: 'a musica e (uma )?linguagem universal|todas as culturas (usam|tem|possuem) (as mesmas|a mesma) (escalas?|notas?)',
      unless: '\\bmitos?\\b|discut|etnomusicolog|nao e universal|culturalmente situad',
      problem: 'Trata a música, ou a organização das notas ocidental, como universal.',
      fix: 'Apresentar o sistema tonal e o temperamento igual como construção histórica e cultural e mencionar outras organizações sonoras.'
    }
  ],
  geografia: [
    {
      id: 'GEO_CAPITAL_DO_BRASIL',
      severity: 'hard',
      category: 'Geográfica',
      pattern: 'a capital do brasil e\\s+(o\\s+)?(rio de janeiro|sao paulo|salvador)',
      unless: 'ja foi|antiga capital|ate 19[0-9]{2}|era a capital',
      problem: 'A capital do Brasil é Brasília desde 1960; a frase atribui o título a outra cidade.',
      fix: 'Corrigir para Brasília e, se o tema for histórico, indicar que Salvador (até 1763) e o Rio de Janeiro (até 1960) foram capitais anteriores.'
    },
    {
      id: 'GEO_TEMPO_CLIMA',
      severity: 'soft',
      category: 'Conceitual',
      pattern: 'o clima (hoje|amanha|desta semana|de hoje|desta manha|desta tarde)|(tempo|clima)\\s+e\\s+(clima|tempo)\\s+sao\\s+(a mesma coisa|sinonimos)',
      unless: 'tempo atmosferico|longo prazo|padrao climatico',
      problem: 'Confunde tempo atmosférico (condição de um momento) com clima (padrão de longo prazo).',
      fix: 'Usar "tempo atmosférico" para o estado da atmosfera num momento e "clima" para o padrão observado ao longo de décadas.'
    },
    {
      id: 'GEO_PROJECAO_SEM_DISTORCAO',
      severity: 'soft',
      category: 'Cartográfica',
      pattern: 'projecao (de )?mercator',
      unless: 'distorc|deform|exager|areas? (reais|relativas)|peters|robinson',
      problem: 'Cita a projeção de Mercator sem discutir que ela distorce áreas em latitudes altas.',
      fix: 'Indicar que a projeção preserva ângulos e distorce áreas, e comparar com outra projeção quando o tema for tamanho de países.'
    },
    {
      id: 'GEO_TERCEIRO_MUNDO',
      severity: 'soft',
      category: 'Conceitual',
      pattern: 'terceiro mundo',
      unless: 'guerra fria|historic|termo|expressao|criticad',
      problem: 'Usa "Terceiro Mundo" sem contextualizar a expressão, hoje criticada por hierarquizar países.',
      fix: 'Contextualizar a origem na Guerra Fria ou preferir critérios explícitos (renda, IDH, região) citando a fonte do dado.'
    }
  ],
  lingua_portuguesa: [
    {
      id: 'PORT_ERRO_LINGUISTICO',
      severity: 'soft',
      category: 'Linguística',
      pattern: '\\bfal(a|am|ar|ou)\\s+errad[oa]|portugues errado|erro de portugues',
      unless: 'preconceito linguistico|\\bmitos?\\b|adequacao (a|as|da|de) situacao|adequacao comunicativa',
      problem: 'Trata a variação linguística como erro, sem distinguir norma-padrão e adequação à situação.',
      fix: 'Reformular em termos de adequação à situação comunicativa e de distância em relação à norma-padrão, tratando as variedades como legítimas.'
    },
    {
      id: 'PORT_HAVIAM',
      severity: 'soft',
      category: 'Gramatical',
      pattern: '\\bhaviam\\s+(muit[oa]s|vari[oa]s|pouc[oa]s|alguns|algumas|alunos|pessoas|problemas)',
      unless: 'exemplo de (erro|desvio)|nao se diz|forma incorret|incorretamente|\\bincorret[oa]\\b',
      problem: '"Haviam" com sentido de existir foge à norma-padrão: o verbo haver impessoal fica no singular ("havia muitos alunos").',
      fix: 'Usar "havia" no sentido de existir; "haviam" só vale como auxiliar de tempo composto ("haviam chegado").'
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
