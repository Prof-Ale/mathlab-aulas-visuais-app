import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { runAuthoringWorkflow, reprocessWorkflowStage } from '../src/core/workflowOrchestrator.js';
import { interpretNaturalRequest } from '../src/core/requestInterpreter.js';
import { selectProductionPath, getProfile, PROFILE_IDS, SKELETON_MARK, applyAiDraftToProfileMaterial } from '../src/core/productionProfiles.js';
import { validateMaterialCompleteness, auditLessonMaterial } from '../src/core/qualityEngine.js';
import { exportMaterialToFile } from '../src/core/exportEngine.js';
import { AiProviderService } from '../src/services/aiProviderService.js';

const LESSON_ONLY = ['exemplos_resolvidos', 'gabarito_comentado', 'adaptacao_dua', 'atividade_visual', 'atividades_graduadas', 'representacao_visual'];
const types = (w) => w.material.blocks.map((b) => b.sectionType);

test('Fase 2: matemática didática continua no roteiro de aula de 11 blocos (compatibilidade)', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Apostila sobre função quadrática para o 9º ano' });
  assert.equal(w.material.blocks.length, 11);
  assert.equal(w.material.structureProfile, undefined);
  assert.ok(w.didactic);
  for (const t of LESSON_ONLY) assert.ok(types(w).includes(t), `faltou ${t}`);
});

test('Fase 2: estudo comparativo de Filosofia não recebe estrutura de aula nem M03', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo' });
  assert.equal(w.material.structureProfile.id, 'estudo_comparativo');
  assert.equal(w.didactic, null);
  assert.ok(w.stageLog.some((s) => s.stage === '4_Engenharia_Didatica_M02_M03' && s.status === 'NAO_APLICAVEL'));
  for (const t of LESSON_ONLY) assert.ok(!types(w).includes(t), `não deveria ter ${t}`);
  assert.ok(types(w).includes('contexto_historico'));
  assert.ok(types(w).includes('convergencias_divergencias'));
});

test('Fase 2: perfis diferentes geram estruturas diferentes (Filosofia, Psicanálise, Neuroanatomia, AEE, TO)', async () => {
  const pedidos = {
    filosofia: 'Estudo comparativo sobre racionalismo e empirismo',
    psicanalise: 'Ensaio teórico sobre a constituição psíquica em Winnicott',
    neuro: 'Revisão bibliográfica sobre o sistema nervoso central',
    aee: 'Material de formação docente sobre planejamento educacional e acessibilidade no AEE',
    to: 'Relatório técnico sobre ocupação, funcionalidade e participação humana'
  };
  const perfis = {};
  for (const [k, p] of Object.entries(pedidos)) {
    const w = await runAuthoringWorkflow({ promptText: p });
    perfis[k] = w.material.structureProfile?.id;
  }
  assert.deepEqual(perfis, {
    filosofia: 'estudo_comparativo',
    psicanalise: 'ensaio_teorico',
    neuro: 'revisao_bibliografica',
    aee: 'guia_formacao',
    to: 'relatorio_tecnico'
  });
});

test('Fase 2: todo perfil declarado é consistente (seções únicas, identificação e fontes presentes)', async () => {
  for (const id of PROFILE_IDS) {
    const p = getProfile(id);
    const ts = p.sections.map((s) => s.type);
    assert.equal(new Set(ts).size, ts.length, `${id} tem seção duplicada`);
    assert.ok(ts.includes('identificacao'), `${id} sem identificação`);
    if (id !== 'parecer_auditoria') assert.ok(ts.includes('fontes_e_limitacoes'), `${id} sem fontes`);
  }
});

test('Fase 2: o motor local não inventa conteúdo substantivo nem referências (esqueleto explícito)', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo entre Freud, Winnicott e Bion sobre a constituição psíquica' });
  const esqueletos = w.material.blocks.filter((b) => b.body.includes(SKELETON_MARK));
  assert.ok(esqueletos.length >= 4);
  assert.equal(w.scientific.references.length, 0);
  const fontes = w.material.blocks.find((b) => b.sectionType === 'fontes_e_limitacoes').body;
  assert.match(fontes, /nenhuma fonte verificada/i);
  assert.match(fontes, /Pistas de busca \(não são referências\)/);
  assert.equal(w.material.structureProfile.contentOrigin, 'SINTESE_LOCAL_ESQUELETO');
});

test('Fase 2: o documento não carrega instruções internas de auditoria no corpo', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo' });
  const texto = w.material.blocks.map((b) => b.body).join('\n');
  assert.ok(!/o que a auditoria/i.test(texto));
});

test('Fase 2 / M05: esqueleto é Hard Fail com localização, mas SVG, DUA e gabarito não são exigidos', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo' });
  assert.equal(w.audit.status, 'REPROVADO_HARD_FAIL');
  assert.ok(w.audit.hardFails.length > 0);
  assert.ok(w.audit.hardFails.every((h) => /esqueleto/i.test(h.problem)));
  const texto = JSON.stringify(w.audit.hardFails);
  for (const proibido of ['Representação Visual', 'DUA', 'Gabarito', 'Exemplos Resolvidos']) {
    assert.ok(!texto.includes(proibido), `não deveria exigir ${proibido}`);
  }
  assert.ok(w.audit.hardFails.every((h) => h.location && h.recommendedFix));
});

test('Fase 2: exportação é bloqueada com esqueleto e liberada após preenchimento real', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathlab-f2-'));
  try {
    const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo' });
    await assert.rejects(() => exportMaterialToFile({ material: w.material, format: 'html', exportsDir: dir }), /bloqueada|Seção/i);

    const preenchido = structuredClone(w.material);
    for (const b of preenchido.blocks) {
      if (b.body.includes(SKELETON_MARK)) b.body = `Texto autoral desenvolvido pelo professor para a seção "${b.title}", com fontes identificadas e níveis de acesso declarados.`;
    }
    assert.equal(validateMaterialCompleteness(preenchido).complete, true);
    const exp = await exportMaterialToFile({ material: preenchido, format: 'html', exportsDir: dir });
    assert.equal(exp.verified, true);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('Fase 2: seção removida do perfil é Hard Fail de estrutura', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo' });
  const m = structuredClone(w.material);
  m.blocks = m.blocks.filter((b) => b.sectionType !== 'quadro_comparativo');
  const c = validateMaterialCompleteness(m);
  assert.ok(c.issues.some((i) => i.location === 'quadro_comparativo' && /obrigatória/.test(i.problem)));
});

test('Fase 2: rascunho de IA (simulado) preenche só os esqueletos pelo título e fica marcado como a revisar', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo' });
  const rascunho = [
    '## Problema e critérios de comparação',
    'Pergunta: como cada posição explica a origem do conhecimento. Critérios: origem das ideias, papel da experiência, método.',
    '## Síntese e limites da comparação',
    'A comparação permite concluir apenas o que consta nas fontes consultadas; fonte a verificar.'
  ].join('\n');
  const m = applyAiDraftToProfileMaterial(structuredClone(w.material), rascunho, { modelName: 'mock' });
  const preenchidos = m.blocks.filter((b) => b.contentOrigin === 'IA_EXTERNA_RASCUNHO_A_REVISAR');
  assert.equal(preenchidos.length, 2);
  assert.equal(m.structureProfile.contentOrigin, 'IA_EXTERNA_RASCUNHO_A_REVISAR');
  assert.ok(m.blocks.filter((b) => b.body.includes(SKELETON_MARK)).length >= 3); // o resto segue em esqueleto
  const audit = auditLessonMaterial(m, { scientific: w.scientific, didactic: null });
  assert.ok(audit.softWarnings.some((x) => /rascunho de IA externa/.test(x.problem)));
});

test('Fase 2: prompt de IA muda conforme o tipo (sem pedir exemplo resolvido a estudo comparativo) e inclui cuidados da área', () => {
  const svc = new AiProviderService();
  const base = (txt) => {
    const interpreted = interpretNaturalRequest(txt);
    return svc.buildFiveModulePrompt({ interpreted, scientific: { references: [] }, pedagogical: { epistemicGuardrail: 'x', mobilizedFrameworks: [] }, didactic: null });
  };
  const fil = base('Estudo comparativo sobre racionalismo e empirismo');
  assert.match(fil, /Contexto disciplinar/);
  assert.match(fil, /Contexto histórico e genealogia das posições/);
  assert.match(fil, /Nunca invente autores/);
  assert.match(fil, /não se aplica a este tipo de documento/);
  assert.ok(!/Exemplo Resolvido passo a passo/.test(fil));

  const mat = base('Apostila sobre função quadrática para o 9º ano');
  assert.match(mat, /Exemplo Resolvido passo a passo/);
  assert.match(mat, /\[M03 Engenharia Didática\]: Mantenha alinhamento/);
});

test('Fase 2: reprocessar a etapa editorial respeita o perfil e a etapa didática segue "não aplicável"', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo' });
  const re = await reprocessWorkflowStage({ workflow: w, stageName: 'editorial' });
  assert.equal(re.material.structureProfile.id, 'estudo_comparativo');
  const rd = await reprocessWorkflowStage({ workflow: w, stageName: 'didactic' });
  assert.equal(rd.didactic, null);
});

test('Fase 2: tipos sem perfil próprio caem em estrutura mínima, e correção do usuário define o tipo', () => {
  const r = interpretNaturalRequest('Texto sobre fenomenologia', { documentType: 'Documento institucional' });
  assert.equal(selectProductionPath(r).profileId, 'documento_generico');
  const r2 = interpretNaturalRequest('Texto sobre fenomenologia', { documentType: 'Ensaio teórico' });
  assert.equal(selectProductionPath(r2).profileId, 'ensaio_teorico');
});

test('Fase 2: área desconhecida gera documento com aviso de adaptador ausente e pergunta de confirmação', async () => {
  const w = await runAuthoringWorkflow({ promptText: 'Ensaio sobre arqueologia amazônica', overrides: { discipline: 'Arqueologia' } });
  const cuidados = w.material.blocks.find((b) => b.sectionType === 'cuidados_epistemologicos').body;
  assert.match(cuidados, /ainda não possui adaptador/);
  assert.match(cuidados, /Confirmação necessária/);
});

test('Fase 2: fluxo com IA externa simulada (sem rede) preenche seções do perfil e registra a origem', async () => {
  let chamadas = 0;
  const aiProvider = {
    async generateLessonSection() {
      chamadas += 1;
      return {
        provider: 'mock',
        text: '## Problema e critérios de comparação\nPergunta e critérios definidos no rascunho; fonte a verificar.',
        promptUsed: 'mock',
        metadata: { modelName: 'mock' }
      };
    }
  };
  const w = await runAuthoringWorkflow({
    promptText: 'Estudo comparativo sobre racionalismo e empirismo',
    aiProvider,
    useExternalAi: true,
    authorizedExternalCall: true
  });
  assert.equal(chamadas, 1);
  const blk = w.material.blocks.find((b) => b.sectionType === 'problema_e_criterios');
  assert.equal(blk.contentOrigin, 'IA_EXTERNA_RASCUNHO_A_REVISAR');
  assert.ok(!blk.body.includes(SKELETON_MARK));
  assert.ok(w.audit.softWarnings.some((x) => /rascunho de IA externa/.test(x.problem)));
});

test('Fase 2: sem autorização explícita nenhuma chamada externa acontece', async () => {
  let chamadas = 0;
  const aiProvider = { async generateLessonSection() { chamadas += 1; return { text: 'x', metadata: {} }; } };
  const w = await runAuthoringWorkflow({ promptText: 'Estudo comparativo sobre racionalismo e empirismo', aiProvider, useExternalAi: true, authorizedExternalCall: false });
  assert.equal(chamadas, 0);
  assert.ok(w.material.blocks.some((b) => b.body.includes(SKELETON_MARK)));
});
