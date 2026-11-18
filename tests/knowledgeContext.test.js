import test from 'node:test';
import assert from 'node:assert/strict';

import { interpretNaturalRequest } from '../src/core/requestInterpreter.js';
import { buildScientificFoundation } from '../src/core/scientificEngine.js';
import { auditLessonMaterial } from '../src/core/qualityEngine.js';
import {
  listAdapters,
  registerAdapter,
  unregisterAdapter,
  validateAdapter,
  EPISTEMIC_NATURES
} from '../src/adapters/disciplineAdapters.js';

const ctx = (text, overrides) => interpretNaturalRequest(text, overrides).knowledgeContext;
const natureIds = (c) => c.epistemicNatures.map((n) => n.id);

// Testes A a H da seção 24 do prompt mestre: o contexto precisa ser realmente diferente por área.

test('A. Matemática: função quadrática 9º ano é formal, didática e sem pesquisa externa obrigatória', () => {
  const c = ctx('Apostila sobre função quadrática para o 9º ano');
  assert.equal(c.area, 'Matemática');
  assert.deepEqual(natureIds(c), ['formal']);
  assert.equal(c.documentType.id, 'apostila_didatica');
  assert.equal(c.requiresDidacticEngineering, true);
  assert.equal(c.needsExternalResearch, false);
  assert.equal(c.interdisciplinary, false);
});

test('B. Física: movimento uniforme é empírica com apoio formal', () => {
  const c = ctx('Material sobre movimento uniforme para o Ensino Médio');
  assert.equal(c.area, 'Física');
  assert.equal(c.subarea, 'Cinemática');
  assert.equal(natureIds(c)[0], 'empirico');
  assert.ok(natureIds(c).includes('formal'));
  assert.ok(c.natureRelations.some((n) => /modelo matemático/i.test(n)));
});

test('C. Filosofia: estudo comparativo é filosófico, não didático e dispensa SVG e demonstração', () => {
  const c = ctx('Estudo comparativo sobre racionalismo e empirismo');
  assert.equal(c.area, 'Filosofia');
  assert.equal(natureIds(c)[0], 'filosofico');
  assert.equal(c.documentType.id, 'estudo_comparativo');
  assert.equal(c.requiresDidacticEngineering, false);
  assert.equal(c.needsExternalResearch, true);
  assert.ok(c.adapterGuidance.doNotRequire.some((d) => /demonstração matemática/i.test(d)));
});

test('D. Psicanálise: Freud, Winnicott e Bion são teóricos e não experimentais', () => {
  const c = ctx('Estudo comparativo entre Freud, Winnicott e Bion sobre aspectos da constituição psíquica');
  assert.equal(c.area, 'Psicanálise');
  assert.equal(natureIds(c)[0], 'teorico');
  assert.equal(c.documentType.id, 'estudo_comparativo');
  assert.ok(c.adapterGuidance.cautions.some((x) => /falsas equivalências/i.test(x)));
  assert.ok(c.adapterGuidance.cautions.some((x) => /resultado experimental/i.test(x)));
  assert.ok(c.adapterGuidance.doNotRequire.some((x) => /validação clínica/i.test(x)));
});

test('E. Neuroanatomia: sistema nervoso central é baseado em evidências e não exige validação clínica', () => {
  const c = ctx('Material de estudo sobre o sistema nervoso central');
  assert.equal(c.area, 'Neuroanatomia');
  assert.equal(c.subarea, 'Sistema nervoso central');
  assert.equal(natureIds(c)[0], 'baseado_evidencias');
  assert.ok(c.adapterGuidance.cautions.some((x) => /inventar estruturas/i.test(x)));
  assert.ok(c.adapterGuidance.doNotRequire.some((x) => /validação clínica/i.test(x)));
});

test('F. Educação Especial e AEE: formação docente é profissional e normativa, com alerta de vigência', () => {
  const c = ctx('Material de formação docente sobre planejamento educacional e acessibilidade no AEE');
  assert.equal(c.area, 'Educação Especial e AEE');
  assert.ok(natureIds(c).includes('profissional') && natureIds(c).includes('normativo'));
  assert.equal(c.audience, 'Professores (formação docente)');
  assert.equal(c.documentType.id, 'guia_formacao');
  assert.ok(c.adapterGuidance.cautions.some((x) => /vigência/i.test(x)));
  assert.ok(c.natureRelations.some((n) => /norma vigente|vigência/i.test(n)));
});

test('F2. Sem a sigla AEE, a solicitação continua no grupo Educação e sugere confirmar a área', () => {
  const c = ctx('Material de formação docente sobre planejamento educacional e acessibilidade');
  const areas = [c.area, ...c.secondaryAreas.map((s) => s.area)];
  assert.ok(areas.includes('Educação Especial e AEE'));
  assert.equal(c.group, 'Educação e Desenvolvimento Humano');
  assert.equal(c.interdisciplinary, false);
});

test('G. Terapia Ocupacional: ocupação, funcionalidade e participação é profissional e baseada em evidências', () => {
  const c = ctx('Material de estudo sobre ocupação, funcionalidade e participação humana');
  assert.equal(c.area, 'Terapia Ocupacional');
  assert.equal(natureIds(c)[0], 'profissional');
  assert.ok(c.adapterGuidance.cautions.some((x) => /diagnóstico, protocolo ou prescrição/i.test(x)));
});

test('H. Interdisciplinar: neurociências, aprendizagem e educação combina naturezas e explicita a relação', () => {
  const c = ctx('Estudo sobre relações entre neurociências, aprendizagem e educação');
  assert.equal(c.area, 'Neurociências');
  assert.equal(c.interdisciplinary, true);
  assert.ok(c.secondaryAreas.some((s) => s.area === 'Educação'));
  assert.ok(natureIds(c).includes('baseado_evidencias') && natureIds(c).includes('teorico'));
  assert.ok(c.natureRelations.some((n) => /construção teórica|resultado experimental/i.test(n)));
  assert.ok(c.adapterGuidance.cautions.some((x) => /reducionismo/i.test(x)));
});

// Comportamento geral

test('Áreas diferentes produzem contextos diferentes (não é só troca de rótulo)', () => {
  const a = ctx('Apostila sobre função quadrática para o 9º ano');
  const b = ctx('Estudo comparativo sobre racionalismo e empirismo');
  assert.notDeepEqual(natureIds(a), natureIds(b));
  assert.notDeepEqual(a.adapterGuidance.doNotRequire, b.adapterGuidance.doNotRequire);
  assert.notEqual(a.requiresDidacticEngineering, b.requiresDidacticEngineering);
});

test('Correção do usuário tem precedência e fica registrada', () => {
  const c = ctx('Material sobre movimento uniforme', {
    area: 'Filosofia',
    subarea: 'Filosofia da Ciência',
    documentType: 'Ensaio teórico',
    epistemicNatures: ['filosofico', 'historico']
  });
  assert.equal(c.area, 'Filosofia');
  assert.equal(c.subarea, 'Filosofia da Ciência');
  assert.equal(c.documentType.id, 'ensaio_teorico');
  assert.deepEqual(natureIds(c), ['filosofico', 'historico']);
  assert.deepEqual(c.fieldSources, { area: 'usuario', subarea: 'usuario', documentType: 'usuario', epistemicNatures: 'usuario' });
});

test('Área desconhecida é aceita sem inventar natureza: fica indeterminada e pergunta de forma objetiva', () => {
  const r = interpretNaturalRequest('Texto sobre arqueologia amazônica', { discipline: 'Arqueologia' });
  assert.equal(r.fields.discipline, 'Arqueologia');
  const c = r.knowledgeContext;
  assert.equal(c.adapterId, null);
  assert.deepEqual(natureIds(c), ['indeterminado']);
  assert.equal(c.needsAreaConfirmation, true);
  assert.match(c.clarificationQuestion, /Arqueologia/);
});

test('Sem pistas de área: mantém o padrão legado, mas sinaliza que não foi confirmado', () => {
  const r = interpretNaturalRequest('Quero um material sobre isso daí');
  assert.equal(r.fields.discipline, 'Matemática'); // compatibilidade v1.5
  assert.equal(r.knowledgeContext.area, null);
  assert.equal(r.knowledgeContext.needsAreaConfirmation, true);
  assert.match(r.knowledgeContext.clarificationQuestion, /Qual é a área/);
});

test('Compatibilidade v1.5: campos legados permanecem iguais', () => {
  const r = interpretNaturalRequest('Apostila de Matemática sobre sistemas de equações para o 8º ano');
  assert.equal(r.fields.discipline, 'Matemática');
  assert.equal(r.fields.materialType, 'Apostila / Ficha Didática');
  assert.equal(r.workflowMode, 'Material Didático');
  assert.ok(Array.isArray(r.fields.objectives) && r.fields.objectives.length === 3);
});

test('Registro de adaptadores: todos os nativos são válidos e novas áreas entram sem alterar os módulos', () => {
  for (const a of listAdapters()) {
    assert.deepEqual(validateAdapter(a), [], `adaptador ${a.id} inválido`);
  }
  assert.ok(listAdapters().length >= 12);

  registerAdapter({
    id: 'teste_sociologia',
    version: '0.0.1',
    area: 'Sociologia',
    group: 'Ciências Humanas e Sociais',
    names: ['sociologia'],
    keywords: [{ p: 'durkheim|weber|fato social', w: 4 }],
    natures: { primary: [EPISTEMIC_NATURES.THEORETICAL], secondary: [] },
    cautions: ['Distinguir teoria sociológica de dado empírico.'],
    auditFocus: ['Atribuição teórica'],
    doNotRequire: ['Demonstração formal']
  });
  try {
    const c = ctx('Estudo sobre fato social em Durkheim');
    assert.equal(c.area, 'Sociologia');
    assert.equal(c.adapterId, 'teste_sociologia');
  } finally {
    unregisterAdapter('teste_sociologia');
  }
  assert.throws(() => registerAdapter({ id: 'x' }), /rejeitado/);
  assert.throws(() => unregisterAdapter('matematica'), /nativos/);
});

test('M01: área sem relação com Ciências da Natureza não recebe a BNCC de Ciências nem referência inventada', () => {
  const interpreted = interpretNaturalRequest('Estudo comparativo entre Freud, Winnicott e Bion');
  const sci = buildScientificFoundation(interpreted, []);
  assert.equal(sci.references.length, 0);
  assert.ok(sci.documentaryLimitations.some((l) => /Nenhuma referência padrão/.test(l)));

  const fis = buildScientificFoundation(interpretNaturalRequest('Material sobre movimento uniforme'), []);
  assert.ok(fis.references.some((r) => /Ciências da Natureza/.test(r.title)));
});

test('M05: a disciplina é repassada à completude, tornando o SVG aviso (e não falha) em Filosofia', () => {
  const material = {
    title: 'Estudo comparativo',
    blocks: [{ sectionType: 'desenvolvimento_conceitual', title: 'Desenvolvimento', body: 'x'.repeat(200) }]
  };
  const audit = auditLessonMaterial(material, { scientific: { discipline: 'Filosofia', references: [] }, didactic: null });
  assert.ok(audit.completeness.warnings.some((w) => /Representação Visual/.test(w.location)));
  assert.ok(!audit.hardFails.some((h) => /Representação Visual/.test(h.location)));

  const mat = auditLessonMaterial(material, { scientific: { discipline: 'Matemática', references: [] }, didactic: null });
  assert.ok(mat.hardFails.some((h) => /Representação Visual/.test(h.location)));
});
