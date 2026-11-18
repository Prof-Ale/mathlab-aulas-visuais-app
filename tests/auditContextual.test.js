import test from 'node:test';
import assert from 'node:assert/strict';

import { runAuthoringWorkflow } from '../src/core/workflowOrchestrator.js';
import { auditLessonMaterial, resolveAuditPolicy } from '../src/core/qualityEngine.js';
import { SKELETON_MARK } from '../src/core/productionProfiles.js';
import { registerAdapter, unregisterAdapter, validateAdapter, listAdapters, EPISTEMIC_NATURES } from '../src/adapters/disciplineAdapters.js';

const PEDIDOS = {
  filosofia: 'Estudo comparativo sobre racionalismo e empirismo',
  aee: 'Material de formação docente sobre planejamento educacional e acessibilidade no AEE',
  neuro: 'Revisão bibliográfica sobre o sistema nervoso central',
  psicanalise: 'Ensaio teórico sobre a constituição psíquica em Winnicott',
  matematica: 'Apostila sobre função quadrática para o 9º ano'
};

// Preenche todos os esqueletos com texto neutro e coloca `texto` na primeira seção desenvolvida, para auditar só o que interessa.
async function materialCom(pedido, texto) {
  const wf = await runAuthoringWorkflow({ promptText: pedido });
  const m = structuredClone(wf.material);
  let colocou = false;
  for (const b of m.blocks) {
    if (b.body.includes(SKELETON_MARK)) {
      b.body = `Texto autoral desenvolvido para a seção "${b.title}", com fontes identificadas e nível de acesso declarado.${colocou ? '' : ` ${texto}`}`;
      colocou = true;
    }
  }
  return { wf, material: m, audit: (extra = {}) => auditLessonMaterial(m, { scientific: wf.scientific, didactic: wf.didactic, knowledgeContext: wf.interpreted.knowledgeContext, ...extra }) };
}
const regra = (audit, id) => [...audit.hardFails, ...audit.softWarnings].find((f) => f.ruleId === id);

test('Fase 3: decreto revogado é Hard Fail com evidência e fonte, só em Educação Especial', async () => {
  const { audit } = await materialCom(PEDIDOS.aee, 'A política vigente se apoia no Decreto nº 10.502/2020 para organizar o atendimento.');
  const a = audit();
  const f = regra(a, 'NORMA_DECRETO_10502_REVOGADO');
  assert.ok(f, 'regra não disparou');
  assert.ok(a.hardFails.includes(f), 'deveria ser Hard Fail');
  assert.equal(a.status, 'REPROVADO_HARD_FAIL');
  assert.match(f.evidence, /10\.502/);
  assert.match(f.source, /11\.370/);
  assert.equal(f.category, 'Normativa');
});

test('Fase 3: a mesma citação com a ressalva da revogação não dispara a regra', async () => {
  const { audit } = await materialCom(PEDIDOS.aee, 'O Decreto nº 10.502/2020 foi revogado pelo Decreto nº 11.370/2023, e não orienta mais a política.');
  assert.equal(regra(audit(), 'NORMA_DECRETO_10502_REVOGADO'), undefined);
});

test('Fase 3: regra de uma área não vaza para outra (decreto em Matemática e Filosofia não é auditado)', async () => {
  for (const k of ['matematica', 'filosofia']) {
    const { audit } = await materialCom(PEDIDOS[k], 'Cita o Decreto nº 10.502/2020 sem ressalva.');
    assert.equal(regra(audit(), 'NORMA_DECRETO_10502_REVOGADO'), undefined, k);
  }
});

test('Fase 3: terminologia desatualizada em Educação Especial é advertência, não bloqueio', async () => {
  const { audit } = await materialCom(PEDIDOS.aee, 'O professor deve acolher o aluno portador de deficiência na sala regular.');
  const a = audit();
  const f = a.softWarnings.find((w) => w.ruleId === 'EE_TERMINOLOGIA_DESATUALIZADA');
  assert.ok(f);
  assert.match(f.evidence, /portador de defici/i);
  assert.ok(!a.hardFails.some((h) => h.ruleId === 'EE_TERMINOLOGIA_DESATUALIZADA'));
});

test('Fase 3: neuromito dos 10% é Hard Fail em Neuroanatomia, e não dispara quando é apresentado como mito', async () => {
  const afirma = await materialCom(PEDIDOS.neuro, 'Sabe-se que usamos apenas 10% do cérebro durante a vida.');
  const aa = afirma.audit();
  const f = regra(aa, 'NEURO_MITO_10_POR_CENTO');
  assert.ok(f && aa.hardFails.includes(f));
  assert.match(f.evidence, /10%/);

  const mito = await materialCom(PEDIDOS.neuro, 'É um neuromito dizer que usamos apenas 10% do cérebro.');
  assert.equal(regra(mito.audit(), 'NEURO_MITO_10_POR_CENTO'), undefined);
});

test('Fase 3: Filosofia e Psicanálise recebem advertências próprias, nunca Hard Fail por essas regras', async () => {
  const fil = await materialCom(PEDIDOS.filosofia, 'Todos os filósofos concordam que a experiência é a origem do conhecimento.');
  const af = fil.audit();
  const f = regra(af, 'FIL_INTERPRETACAO_COMO_CONSENSO');
  assert.ok(f);
  assert.ok(af.softWarnings.includes(f) && !af.hardFails.includes(f));

  const psi = await materialCom(PEDIDOS.psicanalise, 'O conceito de holding foi comprovado experimentalmente em laboratório.');
  const ap = psi.audit();
  const p = regra(ap, 'PSI_INTERPRETACAO_COMO_RESULTADO_EXPERIMENTAL');
  assert.ok(p && ap.softWarnings.includes(p) && !ap.hardFails.includes(p));
});

test('Fase 3: toda falha vinda de regra traz localização, correção e evidência identificável', async () => {
  const { audit } = await materialCom(PEDIDOS.aee, 'O aluno portador de deficiência. O Decreto 10.502 vale. Há retardo mental no relato.');
  const regras = [...audit().hardFails, ...audit().softWarnings].filter((f) => /^(NORMA|EE)_/.test(f.ruleId || ''));
  assert.ok(regras.length >= 2);
  for (const f of regras) {
    assert.ok(f.location && f.recommendedFix && f.evidence && f.category, `incompleta: ${f.ruleId}`);
  }
});

test('Fase 3: texto em esqueleto e a seção de cuidados não são varridos pelas regras', async () => {
  const wf = await runAuthoringWorkflow({ promptText: PEDIDOS.neuro });
  const a = auditLessonMaterial(wf.material, { scientific: wf.scientific, didactic: wf.didactic, knowledgeContext: wf.interpreted.knowledgeContext });
  assert.ok(![...a.hardFails, ...a.softWarnings].some((f) => /^NEURO_/.test(f.ruleId || '')));
});

test('Fase 3: divisão por zero só é auditada onde faz sentido (Matemática sim, Filosofia não)', async () => {
  const mat = await materialCom(PEDIDOS.matematica, '');
  const m2 = structuredClone(mat.material);
  m2.blocks.find((b) => b.sectionType === 'desenvolvimento_conceitual').body += '\nResultado: 5/0 = infinito.';
  const aMat = auditLessonMaterial(m2, { scientific: mat.wf.scientific, didactic: mat.wf.didactic, knowledgeContext: mat.wf.interpreted.knowledgeContext });
  assert.ok(aMat.hardFails.some((h) => h.ruleId === 'MAT_DIVISAO_POR_ZERO'));

  const fil = await materialCom(PEDIDOS.filosofia, 'A razão 5/0 aparece como metáfora do indefinível.');
  assert.equal(regra(fil.audit(), 'MAT_DIVISAO_POR_ZERO'), undefined);
});

test('Fase 3: política mostra o que NÃO se exige e por quê (perfil não didático)', async () => {
  const wf = await runAuthoringWorkflow({ promptText: PEDIDOS.filosofia });
  const p = wf.audit.policy;
  assert.equal(p.area, 'Filosofia');
  assert.equal(p.path, 'perfil');
  assert.equal(p.visualPolicy, 'na');
  assert.match(p.basis, /adaptador "Filosofia"/);
  assert.ok(p.notRequired.some((n) => /Diagrama SVG/.test(n.item) && /não é uma aula/.test(n.reason)));
  assert.ok(p.notRequired.some((n) => /Demonstração matemática/.test(n.item) && /Filosofia/.test(n.reason)));
  assert.ok(p.notRequired.every((n) => n.item && n.reason));
});

test('Fase 3: política visual do roteiro de aula vem do grupo do adaptador (Matemática bloqueia, Filosofia adverte)', async () => {
  const material = { title: 't', blocks: [{ sectionType: 'desenvolvimento_conceitual', title: 'Desenvolvimento', body: 'x'.repeat(200) }] };
  const mat = auditLessonMaterial(material, { scientific: { discipline: 'Matemática', references: [] } });
  assert.equal(mat.policy.visualPolicy, 'hard');
  assert.ok(mat.hardFails.some((h) => /Representação Visual/.test(h.location)));

  const fil = auditLessonMaterial(material, { scientific: { discipline: 'Filosofia', references: [] } });
  assert.equal(fil.policy.visualPolicy, 'warning');
  assert.ok(!fil.hardFails.some((h) => /Representação Visual/.test(h.location)));
  assert.ok(fil.softWarnings.some((w) => /Representação Visual/.test(w.location)));
  assert.ok(fil.policy.notRequired.some((n) => /SVG/.test(n.item)));
});

test('Fase 3: documento investigativo sem fontes recebe advertência; aula escolar original não', async () => {
  const fil = await runAuthoringWorkflow({ promptText: PEDIDOS.filosofia });
  assert.ok(fil.audit.softWarnings.some((w) => w.ruleId === 'DOC_SEM_FONTES_REGISTRADAS'));
  const mat = await runAuthoringWorkflow({ promptText: PEDIDOS.matematica });
  assert.ok(!mat.audit.softWarnings.some((w) => w.ruleId === 'DOC_SEM_FONTES_REGISTRADAS'));
});

test('Fase 3: progresso de seções do perfil e agrupamento por regra', async () => {
  const wf = await runAuthoringWorkflow({ promptText: PEDIDOS.filosofia });
  assert.equal(wf.audit.progress.totalSections, 9);
  assert.equal(wf.audit.progress.pendingSections, 6);
  assert.equal(wf.audit.progress.developedSections, 3);
  assert.ok(wf.audit.hardFails.every((h) => h.ruleId === 'PERFIL_SECAO_EM_ESQUELETO'));
  const mat = await runAuthoringWorkflow({ promptText: PEDIDOS.matematica });
  assert.equal(mat.audit.progress, null);
});

test('Fase 3: estudo interdisciplinar herda as regras das duas áreas', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Estudo sobre relações entre neurociências, aprendizagem e educação' });
  const policy = resolveAuditPolicy(wf.material, { scientific: wf.scientific, knowledgeContext: wf.interpreted.knowledgeContext });
  const ids = policy.rules.map((r) => r.id);
  assert.ok(ids.includes('NEURO_MITO_10_POR_CENTO'));
  assert.ok(ids.includes('NEURO_MITO_ESTILOS_DE_APRENDIZAGEM'));
  assert.equal(new Set(ids).size, ids.length, 'regras duplicadas');
});

test('Fase 3: BNCC só é pedida para material escolar com etapa informada', async () => {
  const fil = await runAuthoringWorkflow({ promptText: PEDIDOS.filosofia });
  assert.equal(fil.scientific.claimsRequiringVerification.length, 0);
  const mat = await runAuthoringWorkflow({ promptText: PEDIDOS.matematica });
  assert.ok(mat.scientific.claimsRequiringVerification.some((c) => /BNCC/.test(c)));
});

test('Fase 3: adaptador novo com regra própria passa a ser auditado sem mexer no motor; regra inválida é recusada', async () => {
  const base = {
    id: 'teste_historia', version: '0.0.1', area: 'História', group: 'Ciências Humanas e Sociais', names: ['historia'],
    keywords: [{ p: 'revolucao francesa|brasil imperio', w: 4 }],
    natures: { primary: [EPISTEMIC_NATURES.HISTORICAL], secondary: [] },
    cautions: ['Evitar anacronismo.'], auditFocus: ['Contextualização'], doNotRequire: ['Demonstração formal']
  };
  assert.ok(validateAdapter({ ...base, auditRules: [{ id: 'x', severity: 'grave', category: 'c', pattern: '(', problem: 'p', fix: 'f' }] }).length >= 2);
  registerAdapter({
    ...base,
    auditRules: [{ id: 'HIS_ANACRONISMO_TESTE', severity: 'soft', category: 'Histórica', pattern: 'iluministas usavam internet', problem: 'Anacronismo.', fix: 'Remover.' }]
  });
  try {
    const wf = await runAuthoringWorkflow({ promptText: 'Ensaio teórico sobre a revolução francesa' });
    const m = structuredClone(wf.material);
    m.blocks[1].body = 'Os iluministas usavam internet para divulgar as ideias.';
    const a = auditLessonMaterial(m, { scientific: wf.scientific, knowledgeContext: wf.interpreted.knowledgeContext });
    const f = a.softWarnings.find((w) => w.ruleId === 'HIS_ANACRONISMO_TESTE');
    assert.ok(f);
    assert.match(f.evidence, /iluministas usavam internet/);
  } finally {
    unregisterAdapter('teste_historia');
  }
});

test('Fase 3: todas as regras nativas são válidas, únicas por id e escritas sem acentos', () => {
  const vistos = new Set();
  for (const a of listAdapters()) {
    assert.deepEqual(validateAdapter(a), [], a.id);
    for (const r of a.auditRules) {
      assert.equal(r.pattern, r.pattern.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ºª]/g, (c) => c), `${r.id} com acento no pattern`);
      assert.equal(r.pattern, r.pattern.toLowerCase().replace(/\\[A-Za-z]/g, (m) => m), `${r.id} com maiúscula no pattern`);
      vistos.add(`${a.id}:${r.id}`);
    }
  }
  assert.ok(vistos.size >= 15);
});

test('Fase 3: sem knowledgeContext (API antiga), a auditoria ainda funciona pela disciplina', () => {
  const m = { title: 't', blocks: [{ sectionType: 'desenvolvimento_conceitual', title: 'D', body: 'y'.repeat(200) }] };
  const a = auditLessonMaterial(m, { scientific: { discipline: 'Física', references: [] } });
  assert.equal(a.policy.area, 'Física');
  assert.equal(a.policy.visualPolicy, 'hard');
});

test('área não identificada: a auditoria não aplica regras da disciplina padrão legada (Matemática)', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Ensaio teórico sobre a angústia em um tema sem palavras-chave conhecidas xyz' });
  assert.equal(wf.interpreted.knowledgeContext.area, null);
  assert.equal(wf.audit.policy.adapterId, null);
  assert.ok(!wf.audit.policy.appliedRules.some((r) => r.startsWith('MAT_')));
});

test('Kierkegaard em ensaio teórico é reconhecido como Filosofia', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Ensaio teórico sobre o conceito de angústia em Kierkegaard' });
  assert.equal(wf.interpreted.knowledgeContext.area, 'Filosofia');
});
