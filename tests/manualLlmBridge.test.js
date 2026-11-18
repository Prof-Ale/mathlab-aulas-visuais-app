import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { runAuthoringWorkflow } from '../src/core/workflowOrchestrator.js';
import { buildManualPrompt, importManualDraft } from '../src/core/manualLlmBridge.js';
import { SKELETON_MARK } from '../src/core/productionProfiles.js';
import { exportMaterialToFile } from '../src/core/exportEngine.js';

const FILOSOFIA = 'Estudo comparativo sobre racionalismo e empirismo';
const RESPOSTA = [
  '## Problema e critérios de comparação',
  'Pergunta: de onde vêm as ideias. Critérios: origem do conhecimento, papel da experiência, método. Fonte a verificar.',
  '## Síntese e limites da comparação',
  'A comparação vale apenas para as fontes consultadas; controvérsias interpretativas permanecem em aberto.'
].join('\n');

test('Ponte manual: o prompt de um perfil pede seções "## " e não pede exemplo resolvido', async () => {
  const wf = await runAuthoringWorkflow({ promptText: FILOSOFIA });
  const p = buildManualPrompt(wf);
  assert.equal(p.path, 'profile');
  assert.match(p.prompt, /Contexto disciplinar/);
  assert.match(p.prompt, /FORMATO DA RESPOSTA/);
  assert.match(p.prompt, /Nunca invente autores/);
  assert.ok(!/Exemplo Resolvido passo a passo/.test(p.prompt));
  assert.ok(p.expectedSections.includes('Problema e critérios de comparação'));
  assert.equal(p.instructions.length, 4);
});

test('Ponte manual: o prompt de aula de Matemática continua pedindo o desenvolvimento conceitual', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Apostila sobre função quadrática para o 9º ano' });
  const p = buildManualPrompt(wf);
  assert.equal(p.path, 'lesson');
  assert.match(p.prompt, /Exemplo Resolvido passo a passo/);
  assert.deepEqual(p.expectedSections, ['Desenvolvimento Conceitual e Explicações']);
});

test('Ponte manual: sem material gerado, não monta prompt', () => {
  assert.throws(() => buildManualPrompt({}), /Gere o material primeiro/);
});

test('Ponte manual: importa só as seções em esqueleto que casam, marca origem e relata o restante', async () => {
  const wf = await runAuthoringWorkflow({ promptText: FILOSOFIA });
  const r = importManualDraft({ workflow: wf, material: wf.material, text: RESPOSTA, sourceLabel: 'Gemini no navegador' });
  assert.deepEqual(r.importReport.filled, ['2. Problema e critérios de comparação', '8. Síntese e limites da comparação']);
  assert.ok(r.importReport.keptAsSkeleton.length >= 3);
  const preenchidas = r.material.blocks.filter((b) => b.contentOrigin === 'IA_EXTERNA_RASCUNHO_A_REVISAR');
  assert.equal(preenchidas.length, 2);
  assert.ok(preenchidas.every((b) => !b.body.includes(SKELETON_MARK)));
  assert.equal(r.workflow.providerMetadata.provider, 'manual');
  assert.equal(r.workflow.providerMetadata.sourceLabel, 'Gemini no navegador');
  const log = r.workflow.stageLog.at(-1);
  assert.equal(log.stage, 'IMPORTACAO_MANUAL_LLM');
  assert.equal(log.sectionsFilled, 2);
  assert.ok(r.workflow.audit.softWarnings.some((x) => /rascunho de IA externa/.test(x.problem)));
  assert.equal(r.workflow.audit.status, 'REPROVADO_HARD_FAIL'); // ainda há esqueletos
});

test('Ponte manual: não muta os argumentos e preserva texto que o professor já escreveu', async () => {
  const wf = await runAuthoringWorkflow({ promptText: FILOSOFIA });
  const editado = structuredClone(wf.material);
  const alvo = editado.blocks.find((b) => b.sectionType === 'problema_e_criterios');
  alvo.body = 'Texto autoral do professor sobre o problema e os critérios, já desenvolvido com fontes.';
  const antes = JSON.stringify({ wf, editado });
  const r = importManualDraft({ workflow: wf, material: editado, text: RESPOSTA });
  assert.equal(JSON.stringify({ wf, editado }), antes, 'argumentos foram mutados');
  const depois = r.material.blocks.find((b) => b.sectionType === 'problema_e_criterios');
  assert.equal(depois.body, alvo.body);
  assert.notEqual(depois.contentOrigin, 'IA_EXTERNA_RASCUNHO_A_REVISAR');
  assert.deepEqual(r.importReport.filled, ['8. Síntese e limites da comparação']);
  assert.ok(r.importReport.notes.some((n) => /não casaram/.test(n)));
});

test('Ponte manual: resposta que não casa com nenhum título avisa e não altera nada', async () => {
  const wf = await runAuthoringWorkflow({ promptText: FILOSOFIA });
  const texto = '## Capítulo inventado\nConteúdo qualquer que não corresponde a nenhuma seção do documento atual.';
  const r = importManualDraft({ workflow: wf, material: wf.material, text: texto });
  assert.equal(r.importReport.filled.length, 0);
  assert.ok(r.importReport.notes.some((n) => /Nenhuma seção/.test(n)));
  assert.equal(r.workflow.stageLog.at(-1).status, 'SEM_EFEITO');
  assert.deepEqual(r.material.blocks.map((b) => b.body), wf.material.blocks.map((b) => b.body));
});

test('Ponte manual: texto curto, vazio ou gigante é recusado', async () => {
  const wf = await runAuthoringWorkflow({ promptText: FILOSOFIA });
  assert.throws(() => importManualDraft({ workflow: wf, material: wf.material, text: '' }), /muito curta/);
  assert.throws(() => importManualDraft({ workflow: wf, material: wf.material, text: 'curto' }), /muito curta/);
  assert.throws(() => importManualDraft({ workflow: wf, material: wf.material, text: 'x'.repeat(200_001) }), /grande demais/);
  assert.throws(() => importManualDraft({ workflow: {}, material: null, text: RESPOSTA }), /Gere o material primeiro/);
});

test('Ponte manual: no roteiro de aula, a resposta entra só no desenvolvimento conceitual', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Apostila sobre função quadrática para o 9º ano' });
  const resposta = 'Uma função quadrática tem a forma f(x) = ax² + bx + c com a diferente de zero; o gráfico é uma parábola cuja concavidade depende do sinal de a.';
  const r = importManualDraft({ workflow: wf, material: wf.material, text: resposta });
  assert.equal(r.importReport.path, 'lesson');
  const dev = r.material.blocks.find((b) => b.sectionType === 'desenvolvimento_conceitual');
  assert.equal(dev.body, resposta);
  assert.equal(dev.contentOrigin, 'IA_EXTERNA_RASCUNHO_A_REVISAR');
  const demais = (b) => b.sectionType !== 'desenvolvimento_conceitual';
  assert.deepEqual(r.material.blocks.filter(demais).map((b) => b.body), wf.material.blocks.filter(demais).map((b) => b.body));
});

test('Ponte manual: depois de o professor completar tudo, o material passa na completude e exporta', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathlab-ponte-'));
  try {
    const wf = await runAuthoringWorkflow({ promptText: FILOSOFIA });
    const r1 = importManualDraft({ workflow: wf, material: wf.material, text: RESPOSTA });
    const completo = structuredClone(r1.material);
    for (const b of completo.blocks) {
      if (b.body.includes(SKELETON_MARK)) b.body = `Texto autoral revisado para a seção "${b.title}", com fontes identificadas e nível de acesso declarado.`;
    }
    const exp = await exportMaterialToFile({ material: completo, format: 'md', exportsDir: dir });
    assert.equal(exp.verified, true);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('Ponte manual: o prompt de documento não didático não leva objetivos de aula de Matemática', async () => {
  const wf = await runAuthoringWorkflow({ promptText: FILOSOFIA });
  const { prompt } = buildManualPrompt(wf);
  assert.ok(!/OBJETIVOS:/.test(prompt));
  assert.ok(!/algébrica, gráfica e verbal/.test(prompt));
  assert.ok(!/Etapa=Não especificado/.test(prompt));
  assert.match(prompt, /Disciplina=Filosofia \| Tema=racionalismo e empirismo/);
  const aula = buildManualPrompt(await runAuthoringWorkflow({ promptText: 'Apostila sobre função quadrática para o 9º ano' })).prompt;
  assert.match(aula, /OBJETIVOS:/); // aula de Matemática não muda
});
