/**
 * Teste de Regressão — Auditoria e Correção do Pipeline Editorial
 * Caso obrigatório: Matemática | 7º ano | Adição de números inteiros
 * Zero chamadas pagas a APIs externas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { runAuthoringWorkflow } from '../src/core/workflowOrchestrator.js';
import { validateMaterialCompleteness, auditLessonMaterial } from '../src/core/qualityEngine.js';
import { exportMaterialToFile } from '../src/core/exportEngine.js';

test('Regressão Editorial - Matemática 7º ano: Adição de números inteiros gera apostila visual completa', async () => {
  const wf = await runAuthoringWorkflow({
    promptText:
      'Crie uma apostila visual completa para Matemática, 7º ano, sobre Adição de números inteiros, com explicação conceitual, reta numérica funcional, 5 exemplos resolvidos, 5 exercícios completos, gabarito comentado, 1 atividade visual e 1 adaptação DUA.'
  });

  assert.equal(wf.interpreted.fields.discipline, 'Matemática');
  assert.equal(wf.interpreted.fields.gradeLevel.includes('7'), true);
  assert.equal(wf.productionMode, 'SINTESE_LOCAL_OFFLINE');

  // Rastreio completo das etapas
  assert.equal(wf.stageLog.length >= 5, true);
  assert.equal(wf.stageLog.every((s) => Boolean(s.stage) && Boolean(s.status)), true);

  const byType = new Map(wf.material.blocks.map((b) => [b.sectionType, b]));

  // 1. Explicação conceitual real
  const dev = byType.get('desenvolvimento_conceitual');
  assert.ok(dev);
  assert.equal(dev.body.includes('Conjunto dos Números Inteiros'), true);
  assert.equal(dev.body.includes('Módulo'), true);

  // 2. Reta numérica funcional
  const visual = byType.get('representacao_visual');
  assert.ok(visual);
  assert.equal(visual.svg.includes('<svg'), true);
  assert.equal(visual.svg.includes('Reta Numérica Funcional'), true);
  assert.equal(visual.svg.includes('-6'), true);
  assert.equal(visual.svg.includes('+6'), true);

  // 3. Cinco exemplos resolvidos com Enunciado, Resolução e Resposta
  const ex = byType.get('exemplos_resolvidos');
  assert.ok(ex);
  for (let i = 1; i <= 5; i++) {
    assert.equal(ex.body.includes(`Exemplo Resolvido ${i}`), true);
  }
  assert.equal((ex.body.match(/Enunciado:/g) || []).length >= 5, true);
  assert.equal((ex.body.match(/Resolução:/g) || []).length >= 5, true);
  assert.equal((ex.body.match(/Resposta:/g) || []).length >= 5, true);

  // 4. Cinco exercícios completos
  const exc = byType.get('atividades_graduadas');
  assert.ok(exc);
  for (let i = 1; i <= 5; i++) {
    assert.equal(exc.body.includes(`${i}. `), true);
  }

  // 5. Gabarito comentado
  const gab = byType.get('gabarito_comentado');
  assert.ok(gab);
  for (let i = 1; i <= 5; i++) {
    assert.equal(gab.body.includes(`${i}. `), true);
  }
  assert.equal(gab.body.includes('Justificativa'), true);

  // 6. Uma atividade visual
  const visAct = byType.get('atividade_visual');
  assert.ok(visAct);
  assert.equal(visAct.body.includes('Atividade Visual'), true);

  // 7. Uma adaptação baseada no DUA
  const dua = byType.get('adaptacao_dua');
  assert.ok(dua);
  assert.equal(dua.body.includes('DUA I'), true);
  assert.equal(dua.body.includes('DUA II'), true);
  assert.equal(dua.body.includes('DUA III'), true);

  // Validação de completude e exportação real permitida
  assert.equal(wf.audit.completeness.complete, true);
  assert.equal(wf.audit.hardFails.length, 0);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathlab-inteiros-'));
  const exportedHtml = await exportMaterialToFile({
    material: wf.material,
    format: 'html',
    exportsDir: tmpDir,
    baseFilename: 'apostila_inteiros_7ano'
  });
  assert.equal(exportedHtml.verified, true);
  assert.equal(exportedHtml.sizeBytes > 3000, true);
});

test('Regressão Editorial - Bloqueia exportação e reprova auditoria quando conteúdo é genérico ou incompleto', async () => {
  const genericMaterial = {
    title: 'Matemática: ADIÇÃO DE NÚMEROS INTEIROS (7º ano)',
    blocks: [
      {
        sectionType: 'desenvolvimento_conceitual',
        title: '4. Desenvolvimento Conceitual',
        body: 'Desenvolvimento conceitual de ADIÇÃO DE NÚMEROS INTEIROS articulando definição, propriedades essenciais e transição entre linguagem natural e simbólica.'
      },
      {
        sectionType: 'exemplos_resolvidos',
        title: '6. Exemplos Resolvidos',
        body: 'Passo 1: Identificar variáveis e condições.\nPasso 2: Aplicar o modelo conceitual.'
      },
      {
        sectionType: 'atividades_graduadas',
        title: '7. Atividades Graduadas',
        body: 'Atividade Diagnóstica/Orientada 1: Interpretar situação-problema envolvendo ADIÇÃO DE NÚMEROS INTEIROS.'
      }
    ]
  };

  const completeness = validateMaterialCompleteness(genericMaterial);
  assert.equal(completeness.complete, false);
  assert.equal(completeness.genericBlocks.length >= 2, true);
  assert.equal(completeness.missingSections.includes('Gabarito Comentado'), true);
  assert.equal(completeness.missingSections.includes('Adaptação DUA'), true);

  const audit = auditLessonMaterial(genericMaterial);
  assert.equal(audit.status, 'REPROVADO_HARD_FAIL');
  assert.equal(audit.autoApprovalBlocked, true);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathlab-block-'));
  await assert.rejects(
    () =>
      exportMaterialToFile({
        material: genericMaterial,
        format: 'html',
        exportsDir: tmpDir,
        baseFilename: 'nao_deve_exportar'
      }),
    (err) => err.statusCode === 422 && /Exportação bloqueada/.test(err.message)
  );
});
