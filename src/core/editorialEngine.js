/**
 * MathLab Aulas Visuais - Editorial & Visual Engine (M04: Design Editorial v2.4)
 *
 * Constrói materiais didáticos completos e utilizáveis em sala de aula, com:
 *  - Desenvolvimento conceitual substantivo, explicações e exemplos resolvidos.
 *  - Diagramas SVG pedagógicos funcionais adaptados ao tema (Cartesiano, Geometria, Frações, Fluxograma).
 *  - Preservação de notação LaTeX e layout otimizado para impressão (economia de tinta).
 */

export function generateNumberLineSvg({
  title = 'Reta Numérica Funcional: Adição de Números Inteiros (-3) + (+5) = +2',
  start = -6,
  end = 6
} = {}) {
  const width = 560;
  const height = 210;
  const padX = 36;
  const yAxis = 128;
  const step = (width - padX * 2) / (end - start);
  const toX = (n) => padX + (n - start) * step;

  const ticks = [];
  for (let n = start; n <= end; n++) {
    const x = toX(n).toFixed(1);
    const isZero = n === 0;
    const color = isZero ? '#E5A000' : n < 0 ? '#B91C1C' : '#0A2540';
    const label = n > 0 ? `+${n}` : `${n}`;
    ticks.push(
      `<line x1="${x}" y1="${yAxis - (isZero ? 11 : 7)}" x2="${x}" y2="${yAxis + (isZero ? 11 : 7)}" stroke="${color}" stroke-width="${isZero ? 3 : 1.8}" />` +
      `<text x="${x}" y="${yAxis + 28}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${isZero ? 13 : 11}" font-weight="${isZero ? 'bold' : '600'}" fill="${color}">${label}</text>`
    );
  }

  const xMinus3 = toX(-3).toFixed(1);
  const xPlus2 = toX(2).toFixed(1);
  const xZero = toX(0).toFixed(1);
  const midArc1 = ((toX(-3) + toX(2)) / 2).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}" style="max-width:100%;height:auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#FFFFFF" />
  <text x="${width / 2}" y="24" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0A2540">${title}</text>
  <line x1="20" y1="${yAxis}" x2="${width - 20}" y2="${yAxis}" stroke="#0A2540" stroke-width="2.2" />
  <polygon points="${width - 14},${yAxis} ${width - 24},${yAxis - 5} ${width - 24},${yAxis + 5}" fill="#0A2540" />
  <polygon points="14,${yAxis} 24,${yAxis - 5} 24,${yAxis + 5}" fill="#0A2540" />
  ${ticks.join('\n  ')}
  <circle cx="${xZero}" cy="${yAxis}" r="4.5" fill="#E5A000" stroke="#0A2540" stroke-width="1.5" />
  <circle cx="${xMinus3}" cy="${yAxis}" r="5" fill="#B91C1C" />
  <path d="M ${xMinus3} ${yAxis - 6} Q ${midArc1} 42 ${xPlus2} ${yAxis - 8}" fill="none" stroke="#1D4ED8" stroke-width="2.5" stroke-dasharray="5,3" />
  <polygon points="${xPlus2},${yAxis - 6} ${Number(xPlus2) - 7},${yAxis - 15} ${Number(xPlus2) + 2},${yAxis - 16}" fill="#1D4ED8" />
  <circle cx="${xPlus2}" cy="${yAxis}" r="5.5" fill="#1D4ED8" stroke="#0A2540" stroke-width="1.5" />
  <text x="${midArc1}" y="58" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#1D4ED8">+5 unidades para a direita</text>
  <text x="${xMinus3}" y="${yAxis + 48}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#B91C1C">Partida (-3)</text>
  <text x="${xPlus2}" y="${yAxis + 48}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold" fill="#1D4ED8">Chegada (+2)</text>
</svg>`;
}

export function generateCartesianSystemSvg({
  title = 'Representação Gráfica: Interseção de Retas',
  line1Label = 'x + y = 5',
  line2Label = 'x - y = 1',
  intersectionLabel = 'Solução (3, 2)'
} = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" role="img" aria-label="${title}" style="max-width:100%;height:auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;">
  <rect x="0" y="0" width="420" height="260" fill="#FFFFFF" />
  <text x="210" y="22" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0A2540">${title}</text>
  <g stroke="#E2E8F0" stroke-width="1">
    <line x1="60" y1="45" x2="60" y2="225" /><line x1="120" y1="45" x2="120" y2="225" />
    <line x1="180" y1="45" x2="180" y2="225" /><line x1="240" y1="45" x2="240" y2="225" />
    <line x1="300" y1="45" x2="300" y2="225" /><line x1="360" y1="45" x2="360" y2="225" />
    <line x1="45" y1="75" x2="375" y2="75" /><line x1="45" y1="105" x2="375" y2="105" />
    <line x1="45" y1="135" x2="375" y2="135" /><line x1="45" y1="165" x2="375" y2="165" />
    <line x1="45" y1="195" x2="375" y2="195" />
  </g>
  <line x1="45" y1="195" x2="380" y2="195" stroke="#0A2540" stroke-width="2" />
  <line x1="120" y1="230" x2="120" y2="40" stroke="#0A2540" stroke-width="2" />
  <text x="386" y="199" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#0A2540">x</text>
  <text x="115" y="34" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#0A2540">y</text>
  <line x1="90" y1="55" x2="330" y2="215" stroke="#1D4ED8" stroke-width="2.5" />
  <text x="310" y="190" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#1D4ED8">${line1Label}</text>
  <line x1="90" y1="215" x2="330" y2="55" stroke="#B45309" stroke-width="2.5" stroke-dasharray="6,3" />
  <text x="295" y="72" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#B45309">${line2Label}</text>
  <circle cx="210" cy="135" r="5.5" fill="#E5A000" stroke="#0A2540" stroke-width="2" />
  <text x="220" y="128" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold" fill="#0A2540">${intersectionLabel}</text>
</svg>`;
}

export function generateGeometryTriangleSvg({
  title = 'Relação Geométrica no Triângulo Retângulo',
  aLabel = 'a = 3',
  bLabel = 'b = 4',
  cLabel = 'c = 5'
} = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 240" role="img" aria-label="${title}" style="max-width:100%;height:auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;">
  <rect x="0" y="0" width="420" height="240" fill="#FFFFFF" />
  <text x="210" y="24" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0A2540">${title}</text>
  <polygon points="100,190 300,190 100,65" fill="#F8FAFC" stroke="#0A2540" stroke-width="2.5" />
  <polyline points="100,172 118,172 118,190" fill="none" stroke="#E5A000" stroke-width="2" />
  <text x="72" y="132" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0A2540">${aLabel}</text>
  <text x="195" y="210" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0A2540">${bLabel}</text>
  <text x="215" y="118" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#1D4ED8">${cLabel}</text>
</svg>`;
}

export function generateFractionBarSvg({ title = 'Equivalência de Frações (Modelo de Barra)', label1 = '1/2', label2 = '2/4' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 175" role="img" aria-label="${title}" style="max-width:100%;height:auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;">
  <rect x="0" y="0" width="420" height="175" fill="#FFFFFF" />
  <text x="210" y="24" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold" fill="#0A2540">${title}</text>
  <rect x="50" y="48" width="160" height="36" fill="#FEF3C7" stroke="#0A2540" stroke-width="2" />
  <rect x="210" y="48" width="160" height="36" fill="#FFFFFF" stroke="#0A2540" stroke-width="2" />
  <text x="25" y="71" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0A2540">${label1}</text>
  <rect x="50" y="104" width="80" height="36" fill="#FEF3C7" stroke="#0A2540" stroke-width="2" />
  <rect x="130" y="104" width="80" height="36" fill="#FEF3C7" stroke="#0A2540" stroke-width="2" />
  <rect x="210" y="104" width="80" height="36" fill="#FFFFFF" stroke="#0A2540" stroke-width="2" />
  <rect x="290" y="104" width="80" height="36" fill="#FFFFFF" stroke="#0A2540" stroke-width="2" />
  <text x="25" y="127" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0A2540">${label2}</text>
</svg>`;
}

export function generateConceptualFlowSvg({
  title = 'Fluxo de Representações Semióticas',
  nodes = ['Situação-Problema', 'Tabela / Gráfico', 'Modelo Simbólico', 'Sistematização']
} = {}) {
  const boxes = nodes
    .map((label, i) => {
      const x = 16 + i * 102;
      const arrow = i < nodes.length - 1
        ? `<line x1="${x + 90}" y1="68" x2="${x + 100}" y2="68" stroke="#0A2540" stroke-width="2" />`
        : '';
      return `<rect x="${x}" y="44" width="90" height="48" rx="6" fill="#F8FAFC" stroke="#0A2540" stroke-width="1.5" />
  <text x="${x + 45}" y="72" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="bold" fill="#0A2540">${label}</text>
  ${arrow}`;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 115" role="img" aria-label="${title}" style="max-width:100%;height:auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;">
  <rect x="0" y="0" width="430" height="115" fill="#FFFFFF" />
  <text x="215" y="24" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold" fill="#0A2540">${title}</text>
  ${boxes}
</svg>`;
}

function buildDomainContent(topic, discipline) {
  const lower = String(topic || '').toLowerCase();

  if (/(n[úu]meros?\s+inteiros?|adi[çc][ãa]o\s+de\s+inteiros?|subtra[çc][ãa]o\s+de\s+inteiros?|reta\s+num[ée]rica|inteiros)/i.test(lower)) {
    return {
      svg: generateNumberLineSvg(),
      visualCaption:
        'Reta numérica funcional graduada de -6 a +6 com origem destacada em 0. O arco azul ilustra o deslocamento de 5 unidades para a direita a partir de -3, resultando em (-3) + (+5) = +2.',
      latex: '(-3) + (+5) = +2 \\quad ; \\quad (-4) + (-2) = -6 \\quad ; \\quad (+a) + (-a) = 0',
      problem:
        'Em uma manhã de inverno em São Joaquim (SC), o termômetro marcava **-3 °C** às 6h. Ao longo da manhã, a temperatura subiu **5 °C**. Qual temperatura o termômetro passou a marcar ao meio-dia — e o que ocorreria se, à noite, ela caísse **7 °C** a partir desse novo valor?',
      development:
        '### 1. O Conjunto dos Números Inteiros ($\\mathbb{Z}$)\n' +
        'Os números inteiros ampliam os números naturais ao incluir os **inteiros negativos** e o **zero**: $\\mathbb{Z} = \\{\\dots, -3, -2, -1, 0, +1, +2, +3, \\dots\\}$. Eles modelam grandezas com dois sentidos opostos a partir de uma origem ($0$): lucro e prejuízo, altitude acima e abaixo do nível do mar, temperaturas positivas e negativas, avanços e recuos na reta.\n\n' +
        '### 2. Reta Numérica, Módulo e Opostos\n' +
        '- **Sentido na reta:** Valores à direita de $0$ são positivos ($+$); valores à esquerda de $0$ são negativos ($-$). Somar um número positivo desloca o ponto para a **direita**; somar um número negativo desloca o ponto para a **esquerda**.\n' +
        '- **Módulo (valor absoluto):** É a distância de um número até a origem $0$, sempre não negativa. Ex.: $|-5| = 5$ e $|+5| = 5$.\n' +
        '- **Números opostos (simétricos):** Possuem o mesmo módulo e sinais contrários, somando zero: $(+4) + (-4) = 0$.\n\n' +
        '### 3. Regras Conceituais da Adição em $\\mathbb{Z}$\n' +
        '- **Parcelas com o mesmo sinal:** Somamos os módulos e mantemos o sinal comum (juntar duas dívidas gera uma dívida maior: $(-4) + (-2) = -6$).\n' +
        '- **Parcelas com sinais contrários:** Calculamos a diferença entre os módulos e atribuímos o sinal da parcela de **maior módulo** (compensação parcial: $(-3) + (+5) = +2$, pois $|+5| > |-3|$).\n' +
        '- **Atenção ao obstáculo comum:** Na adição, $(-3) + (-2) = -5$ (não se aplica "menos com menos dá mais", regra exclusiva da multiplicação/divisão).',
      workedExamples:
        '**Exemplo Resolvido 1 (Mesmo sinal positivo — crédito acumulado):**\n' +
        '- *Enunciado:* Calcule $(+4) + (+7)$.\n' +
        '- *Resolução:* As duas parcelas são positivas. Partindo de $+4$ na reta numérica, avançamos $7$ unidades para a direita: $4 + 7 = 11$.\n' +
        '- *Resposta:* **$+11$**.\n\n' +
        '**Exemplo Resolvido 2 (Mesmo sinal negativo — duas dívidas):**\n' +
        '- *Enunciado:* Um cliente tinha saldo de $-12$ reais e gastou mais $8$ reais, ou seja, calcule $(-12) + (-8)$.\n' +
        '- *Resolução:* Ambas as parcelas são negativas. Somamos os módulos ($12 + 8 = 20$) e conservamos o sinal negativo, deslocando $8$ unidades para a esquerda de $-12$.\n' +
        '- *Resposta:* **$-20$** (saldo de $-20$ reais).\n\n' +
        '**Exemplo Resolvido 3 (Sinais diferentes com saldo positivo — temperatura):**\n' +
        '- *Enunciado:* Calcule $(-3) + (+5)$.\n' +
        '- *Resolução:* Os sinais são contrários. Subtraímos os módulos ($5 - 3 = 2$) e mantemos o sinal da parcela de maior módulo ($+5$). Na reta, saímos de $-3$ e avançamos $5$ unidades à direita.\n' +
        '- *Resposta:* **$+2$**.\n\n' +
        '**Exemplo Resolvido 4 (Sinais diferentes com saldo negativo — elevador/subsolo):**\n' +
        '- *Enunciado:* Um elevador está no andar $+2$ e desce $6$ andares: calcule $(+2) + (-6)$.\n' +
        '- *Resolução:* Sinais contrários: calculamos a diferença dos módulos ($6 - 2 = 4$) e conservamos o sinal do número de maior módulo ($-6$).\n' +
        '- *Resposta:* **$-4$** (4º subsolo).\n\n' +
        '**Exemplo Resolvido 5 (Parcelas opostas e múltiplas parcelas):**\n' +
        '- *Enunciado:* Calcule $(-9) + (+9) + (-4)$.\n' +
        '- *Resolução:* Pela propriedade associativa e pelo elemento oposto, $(-9) + (+9) = 0$. Em seguida, $0 + (-4) = -4$.\n' +
        '- *Resposta:* **$-4$**.',
      exercises:
        '1. **Cálculo direto na reta numérica:** Determine o resultado de cada adição representando o ponto de partida e o sentido do deslocamento:\n' +
        '   a) $(+6) + (+4)$   b) $(-5) + (-7)$   c) $(-8) + (+3)$   d) $(+4) + (-10)$\n' +
        '2. **Variação de temperatura:** Às 5h da manhã, uma cidade registrava $-4\\text{ }^\\circ\\text{C}$. Até o meio-dia, a temperatura aumentou $9\\text{ }^\\circ\\text{C}$. Qual foi a temperatura registrada ao meio-dia?\n' +
        '3. **Controle financeiro (extrato):** Joana tinha saldo de $+150$ reais, pagou uma conta de $210$ reais (adição de $-210$) e recebeu um depósito de $+80$ reais. Qual é o seu saldo final?\n' +
        '4. **Análise de erro conceitual:** Um colega afirmou que $(-6) + (-4) = +10$ dizendo que "menos com menos dá mais". Explique por que essa justificativa está incorreta na adição e apresente o cálculo correto.\n' +
        '5. **Desafio com três parcelas e oposto:** Sabendo que $x = (-12) + (+7)$ e $y = (+15) + (-15)$, calcule o valor de $x + y$.',
      visualActivity:
        '**Atividade Visual Prática — Mapa dos Saltos na Reta Numérica:**\n' +
        'Observe a reta numérica graduada de $-6$ a $+6$ acima. Em dupla, desenhe arcos coloridos (azul para deslocamento à direita/$+$ e vermelho para deslocamento à esquerda/$-$) para representar:\n' +
        '- **Cartão A:** Partir de $-2$, somar $+6$ e depois somar $-3$.\n' +
        '- **Cartão B:** Partir de $+4$, somar $-7$ e depois somar $+2$.\n' +
        '*Entrega esperada:* Reta desenhada com partida, setas de deslocamento e ponto de chegada destacado para cada cartão.',
      answerKey:
        '1. **Respostas e justificativas:** a) **$+10$** (mesmo sinal positivo: $6+4=10$); b) **$-12$** (mesmo sinal negativo: soma dos módulos $5+7=12$, mantém $-$); c) **$-5$** (sinais contrários: $8-3=5$, prevalece o sinal de $-8$); d) **$-6$** (sinais contrários: $10-4=6$, prevalece o sinal de $-10$).\n' +
        '2. **Resposta: $+5\\text{ }^\\circ\\text{C}$.** *Justificativa:* $(-4) + (+9) = +5$, pois $|+9| - |-4| = 5$ com sinal do $+9$.\n' +
        '3. **Resposta: $+20$ reais.** *Justificativa:* $(+150) + (-210) = -60$; depois $(-60) + (+80) = +20$.\n' +
        '4. **Resposta: $-10$.** *Justificativa:* "Menos com menos dá mais" vale apenas para multiplicação/divisão. Na adição de duas dívidas ($-6$ e $-4$), somamos os módulos e mantemos o sinal negativo.\n' +
        '5. **Resposta: $-5$.** *Justificativa:* $x = (-12) + (+7) = -5$ e $y = (+15) + (-15) = 0$ (opostos). Logo $x + y = (-5) + 0 = -5$.\n' +
        '- **Gabarito da Atividade Visual:** Cartão A: $(-2) + (+6) + (-3) = +4 + (-3) = +1$; Cartão B: $(+4) + (-7) + (+2) = -3 + (+2) = -1$.',
      duaAdaptation:
        '- **Múltiplos Meios de Representação (DUA I):** Associar cores consistentes aos sinais (azul = positivo/direita, vermelho = negativo/esquerda), usar reta numérica ampliada no quadro e cartões táteis de "crédito/débito" para estudantes que precisem de apoio concreto.\n' +
        '- **Múltiplos Meios de Ação e Expressão (DUA II):** Permitir que o estudante registre a resolução desenhando saltos na reta numérica, montando tabela de ganhos/perdas ou explicando oralmente antes da notação formal com parênteses.\n' +
        '- **Múltiplos Meios de Engajamento (DUA III):** Propor contextos próximos ao cotidiano (placar de jogos, saldo de pontos, temperatura e elevador) e oferecer lista graduada com verificação imediata nos dois primeiros itens.'
    };
  }

  if (/(sistema.*equa|sistema.*linear|1[º°] grau|fun[çc][ãa]o afim)/i.test(lower)) {
    return {
      svg: generateCartesianSystemSvg(),
      visualCaption:
        'Plano cartesiano exibindo as retas x + y = 5 e x - y = 1 se interceptando no ponto único P(3, 2), solução comum do sistema.',
      latex: 'x + y = 5 \\quad \\text{e} \\quad x - y = 1 \\implies (x, y) = (3, 2)',
      problem:
        'Em uma feira escolar, 2 cadernos e 1 caneta custam juntos R\\$ 15,00, enquanto 1 caderno e 1 caneta custam R\\$ 9,00. Como determinar o preço unitário de cada item relacionando as duas condições ao mesmo tempo?',
      development:
        '### 1. Ideia Central dos Sistemas Lineares\n' +
        'Uma equação linear com duas incógnitas ($x + y = 5$) admite infinitos pares ordenados como solução. Ao impor uma segunda equação ($x - y = 1$), buscamos o par $(x, y)$ que satisfaz **simultaneamente** ambas as equações.\n\n' +
        '### 2. Coordenação de Registros (Duval, 2003)\n' +
        'No registro algébrico, aplicamos os métodos da **adição** ou **substituição** preservando a equivalência; no registro gráfico, cada equação representa uma reta no plano cartesiano, e a solução única corresponde ao ponto de interseção.\n\n' +
        '### 3. Classificação das Soluções\n' +
        '- **SPD (Sistema Possível e Determinado):** retas concorrentes, solução única.\n' +
        '- **SPI (Sistema Possível e Indeterminado):** retas coincidentes, infinitas soluções.\n' +
        '- **SI (Sistema Impossível):** retas paralelas distintas, nenhuma solução.',
      workedExamples:
        '**Exemplo Resolvido 1 (Método da Adição):**\n' +
        '- *Enunciado:* Resolva o sistema $\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}$.\n' +
        '- *Resolução:* Somando as equações membro a membro: $(x + x) + (y - y) = 5 + 1 \\implies 2x = 6 \\implies x = 3$. Substituindo em $x + y = 5$: $3 + y = 5 \\implies y = 2$.\n' +
        '- *Resposta:* **$(3, 2)$**.\n\n' +
        '**Exemplo Resolvido 2 (Método da Substituição — problema da feira):**\n' +
        '- *Enunciado:* Sabendo que $2c + k = 15$ e $c + k = 9$, encontre $c$ e $k$.\n' +
        '- *Resolução:* De $c + k = 9$, isolamos $k = 9 - c$ e substituímos na 1ª equação: $2c + (9 - c) = 15 \\implies c = 6$. Logo $k = 9 - 6 = 3$.\n' +
        '- *Resposta:* **Caderno = R\\$ 6,00 e Caneta = R\\$ 3,00**.',
      exercises:
        '1. Resolva pelo método da adição: $\\begin{cases} x + y = 10 \\\\ x - y = 4 \\end{cases}$.\n' +
        '2. Resolva pelo método da substituição: $\\begin{cases} y = 2x \\\\ x + y = 12 \\end{cases}$.\n' +
        '3. Em um estacionamento há 20 veículos entre carros e motos, totalizando 56 rodas. Quantos são os carros e quantas são as motos?',
      visualActivity:
        '**Atividade Visual:** No plano cartesiano, construa uma tabela com 3 pontos para $x + y = 6$ e 3 pontos para $x - y = 2$, trace as duas retas e destaque o ponto de interseção.',
      answerKey:
        '1. **$(7, 3)$** — Somando as equações, $2x = 14 \\implies x = 7$ e $y = 10 - 7 = 3$.\n' +
        '2. **$(4, 8)$** — Substituindo $y = 2x$ em $x + 2x = 12 \\implies 3x = 12 \\implies x = 4$ e $y = 8$.\n' +
        '3. **8 carros e 12 motos** — $c + m = 20$ e $4c + 2m = 56 \\implies 2c + m = 28 \\implies c = 8$ e $m = 12$.\n' +
        '- **Atividade Visual:** A interseção ocorre em **$(4, 2)$**, pois $4 + 2 = 6$ e $4 - 2 = 2$.',
      duaAdaptation:
        '- **Representação (DUA I):** Usar cores diferentes para cada reta no gráfico e tabelas passo a passo.\n' +
        '- **Ação e Expressão (DUA II):** Permitir resolução por tabela de tentativas orientadas, gráfico ou método algébrico.\n' +
        '- **Engajamento (DUA III):** Problemas contextualizados de compras e contagem de veículos.'
    };
  }

  if (/(pit[áa]goras|tri[âa]ngulo|geometria)/i.test(lower)) {
    return {
      svg: generateGeometryTriangleSvg(),
      visualCaption:
        'Triângulo retângulo com ângulo reto destacado em dourado, catetos a = 3 e b = 4, e hipotenusa c = 5 ilustrando 3² + 4² = 5².',
      latex: 'a^2 + b^2 = c^2',
      problem:
        'Um engenheiro precisa apoiar uma escada de 5 m em uma parede vertical de modo que a base fique a 4 m da parede. Que altura a escada alcança sem escorregar?',
      development:
        '**1. Conceito estrutural:** Em todo triângulo retângulo, o lado oposto ao ângulo reto é a **hipotenusa** ($c$) e os lados adjacentes ao ângulo reto são os **catetos** ($a$ e $b$).\n' +
        '**2. Invariante geométrico (Teorema de Pitágoras):** A área do quadrado construído sobre a hipotenusa equivale à soma das áreas dos quadrados construídos sobre os catetos: $a^2 + b^2 = c^2$.\n' +
        '**3. Cuidado epistemológico:** Evitar memorização mecânica de letras ($a, b, c$); o critério invariante é sempre **hipotenusa ao quadrado = soma dos quadrados dos catetos**, independentemente da rotação da figura.',
      workedExamples:
        '**Exemplo Resolvido 1 (Cálculo da hipotenusa):**\n' +
        '- *Enunciado:* Um triângulo retângulo tem catetos $a = 3\\text{ cm}$ e $b = 4\\text{ cm}$. Calcule a hipotenusa $c$.\n' +
        '- *Resolução:* $c^2 = 3^2 + 4^2 = 9 + 16 = 25 \\implies c = \\sqrt{25} = 5\\text{ cm}$ ($c > 0$).\n' +
        '- *Resposta:* **$5\\text{ cm}$**.\n\n' +
        '**Exemplo Resolvido 2 (Problema da escada — cálculo de cateto):**\n' +
        '- *Enunciado:* Uma escada de $5\\text{ m}$ está apoiada a $4\\text{ m}$ da parede. Qual a altura $h$ alcançada?\n' +
        '- *Resolução:* $h^2 + 4^2 = 5^2 \\implies h^2 + 16 = 25 \\implies h^2 = 9 \\implies h = 3\\text{ m}$.\n' +
        '- *Resposta:* **$3\\text{ m}$**.',
      exercises:
        '1. Calcule a hipotenusa de um triângulo retângulo com catetos $6\\text{ cm}$ e $8\\text{ cm}$.\n' +
        '2. Um triângulo retângulo tem hipotenusa $13\\text{ cm}$ e um cateto $5\\text{ cm}$. Qual é a medida do outro cateto?\n' +
        '3. Verifique se um triângulo de lados $7\\text{ cm}$, $24\\text{ cm}$ e $25\\text{ cm}$ é retângulo.',
      visualActivity:
        '**Atividade Visual:** Recorte ou desenhe em malha quadriculada quadrados de lados $3$, $4$ e $5$ unidades encostados nos lados de um triângulo retângulo e confira que $9 + 16 = 25$ quadradinhos.',
      answerKey:
        '1. **$10\\text{ cm}$** ($c^2 = 6^2 + 8^2 = 36 + 64 = 100 \\implies c = 10$).\n' +
        '2. **$12\\text{ cm}$** ($b^2 = 13^2 - 5^2 = 169 - 25 = 144 \\implies b = 12$).\n' +
        '3. **Sim, é retângulo**, pois $7^2 + 24^2 = 49 + 576 = 625 = 25^2$.',
      duaAdaptation:
        '- **Representação (DUA I):** Destacar o ângulo reto em cor contrastante para identificar a hipotenusa sem depender da orientação do desenho.\n' +
        '- **Ação e Expressão (DUA II):** Permitir uso de malha quadriculada ou calculadora para raízes antes da síntese algébrica.\n' +
        '- **Engajamento (DUA III):** Problemas práticos de arquitetura, rampas e escadas.'
    };
  }

  if (/(fra[çc][ãa]o|fra[çc][õo]es|propor[çc]|raz[ãa]o|porcentagem)/i.test(lower)) {
    return {
      svg: generateFractionBarSvg(),
      visualCaption:
        'Modelo de barras comparando 1/2 (1 parte de 2) e 2/4 (2 partes de 4), evidenciando a mesma área pintada (frações equivalentes).',
      latex: '\\frac{1}{2} = \\frac{2}{4} = \\frac{1 \\cdot 2}{2 \\cdot 2}',
      problem:
        'Duas turmas dividiram barras idênticas de chocolate: a Turma A comeu $1/2$ da barra e a Turma B comeu $2/4$. Quem consumiu maior quantidade?',
      development:
        '**1. Significado de fração:** Uma fração $\\frac{a}{b}$ ($b \\neq 0$) expressa a relação parte-todo, quociente ou razão entre grandezas. O denominador indica em quantas partes **iguais** o inteiro foi particionado.\n' +
        '**2. Equivalência:** Multiplicar ou dividir numerador e denominador pelo mesmo número não nulo preserva a proporção representada, mudando apenas a granularidade da partição.\n' +
        '**3. Obstáculo comum:** Somar numeradores e denominadores diretamente ($\\frac{1}{2} + \\frac{1}{3} \\neq \\frac{2}{5}$); é necessário expressar as frações em uma unidade comum.',
      workedExamples:
        '**Exemplo Resolvido 1 (Equivalência):**\n' +
        '- *Enunciado:* Verifique se $\\frac{1}{2}$ e $\\frac{2}{4}$ representam a mesma quantidade.\n' +
        '- *Resolução:* Multiplicando numerador e denominador de $\\frac{1}{2}$ por $2$, obtemos $\\frac{1 \\cdot 2}{2 \\cdot 2} = \\frac{2}{4}$.\n' +
        '- *Resposta:* **Sim, são equivalentes** (metade da barra nos dois casos).\n\n' +
        '**Exemplo Resolvido 2 (Adição com denominadores diferentes):**\n' +
        '- *Enunciado:* Calcule $\\frac{1}{2} + \\frac{1}{3}$.\n' +
        '- *Resolução:* Reduzimos ao denominador comum $6$: $\\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$.\n' +
        '- *Resposta:* **$\\frac{5}{6}$**.',
      exercises:
        '1. Escreva duas frações equivalentes a $\\frac{3}{5}$.\n' +
        '2. Calcule $\\frac{2}{3} + \\frac{1}{6}$ simplificando o resultado.\n' +
        '3. Uma receita usa $\\frac{3}{4}$ de xícara de açúcar. Para fazer o dobro da receita, quanto será necessário?',
      visualActivity:
        '**Atividade Visual:** Pinte duas tiras retangulares de mesmo comprimento divididas em $3$ e em $6$ partes iguais para mostrar visualmente que $\\frac{2}{3} = \\frac{4}{6}$.',
      answerKey:
        '1. **Ex.: $\\frac{6}{10}$ e $\\frac{9}{15}$** (multiplicando numerador e denominador por $2$ e por $3$).\n' +
        '2. **$\\frac{5}{6}$** ($\\frac{4}{6} + \\frac{1}{6} = \\frac{5}{6}$).\n' +
        '3. **$\\frac{6}{4} = \\frac{3}{2}$ (1 xícara e meia)**.',
      duaAdaptation:
        '- **Representação (DUA I):** Barras fracionárias coloridas e tiras de papel.\n' +
        '- **Ação e Expressão (DUA II):** Permitir representação por desenho antes do algoritmo de MMC.\n' +
        '- **Engajamento (DUA III):** Receitas culinárias e partilha de alimentos.'
    };
  }

  if (/(cinem[áa]tica|velocidade\s+m[ée]dia|mru|movimento\s+uniforme|f[íi]sica.*movimento|deslocamento|acelera[çc][ãa]o)/i.test(lower) || (discipline === 'Física' && /(movimento|velocidade|cinem[áa]tica|trajet[óo]ria)/i.test(lower))) {
    return {
      svg: generateConceptualFlowSvg({
        title: `Cinemática: ${topic}`,
        nodes: ['Referencial (s₀)', 'Variação (Δs / Δt)', 'Modelo (v = Δs/Δt)', 'Gráfico s × t']
      }),
      visualCaption:
        'Diagrama funcional articulando referencial espacial, variação de posição e tempo (Δs, Δt), equação horária do MRU e leitura gráfica.',
      latex: 'v_m = \\frac{\\Delta s}{\\Delta t} \\quad ; \\quad s(t) = s_0 + v \\cdot t \\quad (\\Delta t \\neq 0)',
      problem:
        'Um ônibus escolar percorre uma rodovia retilínea passando pelo marco quilométrico **km 20** às **7h00** e pelo marco **km 140** às **8h30**. Como determinar sua velocidade média em km/h e em m/s, e prever sua posição às **9h00** mantendo o mesmo ritmo?',
      development:
        '### 1. Referencial, Posição e Deslocamento\n' +
        'Na Física, descrever um movimento exige definir primeiro um **referencial**. A **posição** ($s$) indica onde o móvel está na trajetória, e o **deslocamento escalar** ($\\Delta s = s - s_0$) mede a variação de posição entre o instante inicial e o final.\n\n' +
        '### 2. Velocidade Escalar Média e Movimento Uniforme (MRU)\n' +
        '- **Definição:** $v_m = \\frac{\\Delta s}{\\Delta t}$ ($\\Delta t > 0$), indicando quantos metros ou quilômetros são percorridos por unidade de tempo.\n' +
        '- **Conversão de unidades:** Para converter $\\text{km/h}$ em $\\text{m/s}$, dividimos por $3{,}6$; para o inverso, multiplicamos por $3{,}6$.\n' +
        '- **Função horária do MRU:** Quando a velocidade é constante e não nula, $s(t) = s_0 + v \\cdot t$, representada graficamente por uma reta no plano $s \\times t$.',
      workedExamples:
        '**Exemplo Resolvido 1 (Velocidade média em km/h):**\n' +
        '- *Enunciado:* Um ônibus vai do km $20$ ao km $140$ entre $7\\text{h}$ e $8\\text{h}30$. Calcule $v_m$.\n' +
        '- *Resolução:* $\\Delta s = 140 - 20 = 120\\text{ km}$ e $\\Delta t = 1{,}5\\text{ h}$. Logo $v_m = \\frac{120}{1{,}5} = 80\\text{ km/h}$.\n' +
        '- *Resposta:* **$80\\text{ km/h}$**.\n\n' +
        '**Exemplo Resolvido 2 (Conversão de unidades):**\n' +
        '- *Enunciado:* Converta $72\\text{ km/h}$ para $\\text{m/s}$.\n' +
        '- *Resolução:* Dividimos por $3{,}6$: $72 \\div 3{,}6 = 20\\text{ m/s}$.\n' +
        '- *Resposta:* **$20\\text{ m/s}$**.\n\n' +
        '**Exemplo Resolvido 3 (Função horária do MRU):**\n' +
        '- *Enunciado:* Um ciclista parte de $s_0 = 10\\text{ m}$ com $v = 5\\text{ m/s}$. Qual sua posição após $t = 12\\text{ s}$?\n' +
        '- *Resolução:* $s(12) = 10 + 5 \\cdot 12 = 10 + 60 = 70\\text{ m}$.\n' +
        '- *Resposta:* **$70\\text{ m}$**.',
      exercises:
        '1. Um carro percorre $180\\text{ km}$ em $2\\text{ horas}$. Qual é sua velocidade média em $\\text{km/h}$ e em $\\text{m/s}$?\n' +
        '2. Um atleta corre a $10\\text{ m/s}$ durante $30\\text{ segundos}$. Que distância ele percorre nesse intervalo?\n' +
        '3. Dado o movimento uniforme $s(t) = 15 + 4t$ (no SI), determine a posição inicial, a velocidade e o instante em que o móvel passa pela posição $55\\text{ m}$.',
      visualActivity:
        '**Atividade Visual Prática:** Construa uma tabela $(t, s)$ para $s(t) = 10 + 5t$ nos instantes $t = 0, 2, 4, 6\\text{ s}$ e esboce o gráfico $s \\times t$ identificando a inclinação da reta como a velocidade.',
      answerKey:
        '1. **$90\\text{ km/h}$ e $25\\text{ m/s}$** — $v_m = 180 / 2 = 90\\text{ km/h}$; $90 \\div 3{,}6 = 25\\text{ m/s}$.\n' +
        '2. **$300\\text{ m}$** — $\\Delta s = v \\cdot \\Delta t = 10 \\cdot 30 = 300\\text{ m}$.\n' +
        '3. **$s_0 = 15\\text{ m}$, $v = 4\\text{ m/s}$ e $t = 10\\text{ s}$** — $55 = 15 + 4t \\implies 4t = 40 \\implies t = 10\\text{ s}$.',
      duaAdaptation:
        '- **Representação (DUA I):** Associar esquema de trajetória com setas, tabela horária e gráfico $s \\times t$.\n' +
        '- **Ação e Expressão (DUA II):** Permitir leitura direta na tabela antes de manipular a equação algébrica.\n' +
        '- **Engajamento (DUA III):** Exemplos com deslocamento escolar, ciclismo e segurança no trânsito.'
    };
  }

  // Gerador Pedagógico Universal (M01–M05): adapta-se à disciplina e ao tema sem depender de bancos fechados
  const isHumanities = /(filosofia|hist[óo]ria|sociologia|geografia|portugu[êe]s|literatura|artes)/i.test(
    `${discipline} ${topic}`
  );
  const flowNodes = isHumanities
    ? ['Contexto / Tese', 'Conceitos-Chave', 'Argumentação', 'Síntese Crítica']
    : ['Fenômeno / Dados', 'Variáveis e Regras', 'Resolução Guiada', 'Verificação'];

  return {
    svg: generateConceptualFlowSvg({
      title: `Mapa Conceitual: ${topic}`,
      nodes: flowNodes
    }),
    visualCaption: `Mapa conceitual funcional de ${topic} (${discipline}), estruturando a progressão didática do fenômeno/contexto até a sistematização.`,
    latex: '',
    problem:
      `Em uma aula de **${discipline}** sobre **${topic}**, considere uma situação real em que o estudante precise decidir como organizar os dados observados, aplicar o conceito central e justificar sua conclusão com base em evidências.`,
    development:
      `### 1. Definição Operacional e Escopo em ${discipline}\n` +
      `O estudo de **${topic}** exige distinguir claramente o conceito principal de noções vizinhas, explicitando as condições em que suas propriedades ou relações são válidas.\n\n` +
      '### 2. Progressão entre Representações (Duval, 2003)\n' +
      '- **Registro em língua natural:** Descrição clara do fenômeno, enunciado ou argumento sem jargão opaco.\n' +
      '- **Registro visual/esquemático:** Organização de relações em diagrama, tabela comparativa ou esquema de causa e efeito.\n' +
      '- **Registro formal/técnico:** Sistematização dos conceitos, grandezas ou critérios próprios da disciplina.\n\n' +
      '### 3. Limitação Documental Declarada (M01)\n' +
      `Este material foi gerado em modo 100% local (sem consulta automática a APIs externas). Para aprofundamento bibliográfico específico sobre *${topic}*, recomenda-se validar fontes primárias antes da publicação final.`,
    workedExamples:
      `**Exemplo Resolvido 1 (Análise Conceitual de ${topic}):**\n` +
      `- *Enunciado:* A partir de um caso introdutório de **${topic}** em ${discipline}, identifique os elementos fundamentais envolvidos e explique a relação entre eles.\n` +
      `- *Resolução:* Primeiro destacam-se os dados ou conceitos iniciais do contexto; em seguida aplica-se a regra ou critério estrutural de ${topic}; por fim confere-se se a conclusão responde integralmente ao que foi perguntado.\n` +
      `- *Resposta:* Síntese coerente conectando os dados iniciais à propriedade central de ${topic}.\n\n` +
      `**Exemplo Resolvido 2 (Comparação de Representações em ${topic}):**\n` +
      `- *Enunciado:* Como expressar a mesma ideia de **${topic}** em texto explicativo e em esquema visual?\n` +
      `- *Resolução:* Listam-se os termos-chave no texto e posicionam-se em caixas relacionais no diagrama, mantendo correspondência unívoca entre os elementos.\n` +
      `- *Resposta:* Equivalência verificada entre a explicação verbal e o mapa conceitual.`,
    exercises:
      `1. **Compreensão conceitual:** Explique, com suas próprias palavras, o significado central de **${topic}** e cite um exemplo do cotidiano em que ele aparece.\n` +
      `2. **Análise estruturada:** Diante de um problema envolvendo **${topic}**, liste quais informações são dadas, qual relação deve ser usada e qual conclusão se obtém.\n` +
      `3. **Verificação crítica:** Identifique um erro comum que estudantes cometem ao estudar **${topic}** e escreva como evitá-lo.`,
    visualActivity:
      `**Atividade Visual Prática:** Complete o diagrama de 4 etapas (*${flowNodes.join(' → ')}*) aplicado a um caso concreto de **${topic}**, destacando com setas a relação entre os conceitos.`,
    answerKey:
      `1. **Resposta esperada:** Definição clara de **${topic}** acompanhada de exemplo pertinente ao contexto escolar.\n` +
      `2. **Resposta esperada:** Separação correta entre dados iniciais, regra/procedimento aplicado e conclusão justificada.\n` +
      `3. **Resposta esperada:** Apontamento de equívoco conceitual frequente e estratégia explícita de conferência.\n` +
      `- **Atividade Visual:** Esquema preenchido com correspondência coerente entre todas as etapas.`,
    duaAdaptation:
      `- **Múltiplos Meios de Representação (DUA I):** Apresentar **${topic}** simultaneamente em texto breve, esquema visual de 4 etapas e glossário de termos-chave.\n` +
      '- **Múltiplos Meios de Ação e Expressão (DUA II):** Permitir que o estudante demonstre aprendizagem por escrito, por mapa conceitual ilustrado ou por explicação oral guiada.\n' +
      '- **Múltiplos Meios de Engajamento (DUA III):** Conectar o tema a situações reais da turma e oferecer autoavaliação rápida ao final de cada bloco.'
  };
}

export function buildEditorialLessonMaterial({
  interpreted,
  scientific,
  pedagogical,
  didactic,
  aiGeneratedContent = null
}) {
  const { discipline, gradeLevel, topic, duration, objectives, priorKnowledge } = interpreted.fields;
  const domain = buildDomainContent(topic, discipline);

  const blocks = [
    {
      id: 'blk-identificacao',
      sectionType: 'identificacao',
      title: '1. Identificação da Apostila / Aula Visual',
      body: `**Disciplina:** ${discipline} | **Etapa:** ${gradeLevel} | **Duração:** ${duration}\n**Tema:** ${topic}`
    },
    {
      id: 'blk-objetivos',
      sectionType: 'objetivos',
      title: '2. Objetivos de Aprendizagem e Conhecimentos Prévios',
      body:
        `**Objetivos:**\n${objectives.map((o) => `- ${o}`).join('\n')}\n\n` +
        `**Conhecimentos prévios mobilizados:**\n${priorKnowledge.map((p) => `- ${p}`).join('\n')}`
    },
    {
      id: 'blk-problematizacao',
      sectionType: 'problematizacao',
      title: '3. Contextualização e Problematização',
      body: domain.problem
    },
    {
      id: 'blk-desenvolvimento',
      sectionType: 'desenvolvimento_conceitual',
      title: '4. Desenvolvimento Conceitual e Explicações',
      body: aiGeneratedContent || domain.development
    },
    {
      id: 'blk-visual',
      sectionType: 'representacao_visual',
      title: '5. Representação Visual Pedagógica',
      body: domain.visualCaption || 'Figura funcional para coordenação entre registro visual, verbal e simbólico (Duval, 2003).',
      svg: domain.svg,
      latex: domain.latex
    },
    {
      id: 'blk-exemplos',
      sectionType: 'exemplos_resolvidos',
      title: '6. Exemplos Resolvidos Passo a Passo',
      body: domain.workedExamples
    },
    {
      id: 'blk-atividades',
      sectionType: 'atividades_graduadas',
      title: '7. Exercícios Completos',
      body: domain.exercises
    },
    {
      id: 'blk-atividade-visual',
      sectionType: 'atividade_visual',
      title: '8. Atividade Visual Prática',
      body: domain.visualActivity
    },
    {
      id: 'blk-gabarito',
      sectionType: 'gabarito_comentado',
      title: '9. Gabarito Comentado',
      body: domain.answerKey
    },
    {
      id: 'blk-dua',
      sectionType: 'adaptacao_dua',
      title: '10. Adaptação Pedagógica — DUA (Desenho Universal para a Aprendizagem)',
      body: domain.duaAdaptation
    },
    {
      id: 'blk-avaliacao',
      sectionType: 'avaliacao_formativa',
      title: '11. Sistematização, Avaliação Formativa e Referências',
      body:
        '**Critérios formativos (Alinhamento Construtivo M03):**\n' +
        didactic.partA_didacticArchitecture.alignmentMatrix
          .map((row) => `- ${row.evaluationCriterion}`)
          .join('\n') +
        '\n\n**Referências (M01):**\n' +
        scientific.references
          .map((r) => `- ${r.author} (${r.year}). *${r.title}*. [${r.evidenceType} | Acesso: ${r.accessState}]`)
          .join('\n') +
        `\n\n**Nota epistemológica:** ${pedagogical.epistemicGuardrail}`
    }
  ];

  return {
    moduleRef: 'M04 Design Editorial (v2.4 BASELINE)',
    title: `${discipline}: ${topic} (${gradeLevel})`,
    printOptimized: true,
    blocks
  };
}
