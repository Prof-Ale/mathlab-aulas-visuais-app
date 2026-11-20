import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { Readable } from 'node:stream';

import { loadKnowledgeInventory } from '../src/knowledge/knowledgeBase.js';
import { interpretNaturalRequest, WORKFLOW_MODES } from '../src/core/requestInterpreter.js';
import { runAuthoringWorkflow } from '../src/core/workflowOrchestrator.js';
import { auditLessonMaterial } from '../src/core/qualityEngine.js';
import { ProjectStorage } from '../src/services/projectStorage.js';
import { createAppHandler } from '../server.js';

function invokeHandler(handler, { method = 'GET', url = '/', body = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = body !== null ? Readable.from([Buffer.from(body, 'utf8')]) : Readable.from([]);
    req.method = method;
    req.url = url;
    req.headers = {};
    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(code, headers = {}) {
        this.statusCode = code;
        this.headers = headers;
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          buffer: Buffer.concat(chunks),
          body: Buffer.concat(chunks).toString('utf8')
        });
      }
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

// Os documentos M01 a M05 ficam na pasta de documentos do professor, fora deste repositório.
// Caminho padrão: a pasta acima. Outro caminho: variável MATHLAB_DOCS_ROOT.
const DOCS_ROOT = process.env.MATHLAB_DOCS_ROOT
  ? path.resolve(process.env.MATHLAB_DOCS_ROOT)
  : path.resolve(process.cwd(), '..');
const DOCS_PRESENTES = fsSync.existsSync(path.join(DOCS_ROOT, '01_base_cientifica_v2.3.3_CANDIDATA_REV6.md'));

test('1. Fase Zero: recupera inventário real M01-M05 e registra conflitos sem auto-promover', {
  skip: DOCS_PRESENTES ? false : 'documentos M01-M05 não encontrados (defina MATHLAB_DOCS_ROOT com a pasta que os contém)'
}, async () => {
  const inv = await loadKnowledgeInventory(DOCS_ROOT);
  assert.equal(inv.totalCatalogEntries, 10);
  assert.equal(inv.availableCount, 10);
  assert.ok(inv.pendingVersionDecisions.length >= 3);
  assert.ok(inv.items.every((i) => i.sha256 && i.sizeBytes > 0));
});

test('2. Interpretador e 4 Modos de Fluxo + Auditoria M05 Hard Fail', async () => {
  assert.equal(interpretNaturalRequest('Pesquise a história do número zero.').workflowMode, WORKFLOW_MODES.RESEARCHER);
  assert.equal(interpretNaturalRequest('Planeje uma aula de função afim.').workflowMode, WORKFLOW_MODES.TEACHER);
  assert.equal(interpretNaturalRequest('Produza uma apostila sobre equações.').workflowMode, WORKFLOW_MODES.DIDACTIC_MATERIAL);
  assert.equal(interpretNaturalRequest('Verifique se esta explicação sobre Vygotsky está correta.').workflowMode, WORKFLOW_MODES.AUDIT);

  const badAudit = auditLessonMaterial({
    title: 'Teste',
    blocks: [{ title: 'Erro', body: 'Vygotsky criou o conceito scaffolding em 1930.' }]
  });
  assert.equal(badAudit.status, 'REPROVADO_HARD_FAIL');
  assert.equal(badAudit.autoApprovalBlocked, true);
});

test('3. Fluxo MVP completo (Sistemas 8º ano): Projeto -> Geração -> Edição -> Versões -> Exportação DOCX/PPTX/HTML/MD/SVG', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathlab-app-e2e-'));
  try {
    const handler = createAppHandler({
      dataFile: path.join(tmpDir, 'projects.json'),
      exportsDir: path.join(tmpDir, 'exports'),
      docsRootDir: path.resolve(process.cwd(), '..')
    });

    // 1. Health & Static index.html
    const health = await invokeHandler(handler, { url: '/api/health' });
    assert.equal(health.statusCode, 200);
    assert.equal(JSON.parse(health.body).application, 'MathLab Aulas Visuais');

    const indexHtml = await invokeHandler(handler, { url: '/' });
    assert.equal(indexHtml.statusCode, 200);
    assert.ok(indexHtml.body.includes('MATHLAB AULAS VISUAIS'));

    // 2. Criar projeto
    const prjRes = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/projects',
      body: JSON.stringify({ title: 'Álgebra 8º Ano', discipline: 'Matemática', gradeLevel: '8º ano' })
    });
    assert.equal(prjRes.statusCode, 201);
    const projectId = JSON.parse(prjRes.body).project.id;

    // 3. Executar workflow em linguagem natural
    const wfRes = await invokeHandler(handler, {
      method: 'POST',
      url: '/api/workflow/run',
      body: JSON.stringify({
        promptText: 'Elabore uma aula de Matemática para o 8º ano sobre sistemas de equações do primeiro grau. Quero uma abordagem conceitual, representação gráfica, exemplos resolvidos, atividades graduadas e avaliação formativa.'
      })
    });
    assert.equal(wfRes.statusCode, 200);
    const workflow = JSON.parse(wfRes.body).workflow;
    assert.equal(workflow.interpreted.fields.discipline, 'Matemática');
    assert.ok(workflow.material.blocks.some((b) => b.svg && b.svg.includes('<svg')));

    // 4. Salvar material e registrar edição humana separada do original
    const saveMat = await invokeHandler(handler, {
      method: 'POST',
      url: `/api/projects/${projectId}/materials`,
      body: JSON.stringify({ workflowOutput: workflow })
    });
    assert.equal(saveMat.statusCode, 201);
    const materialId = JSON.parse(saveMat.body).material.id;

    const edited = structuredClone(workflow.material);
    edited.blocks[0].body += '\nEditado pelo professor.';
    const updMat = await invokeHandler(handler, {
      method: 'PUT',
      url: `/api/projects/${projectId}/materials/${materialId}`,
      body: JSON.stringify({ updatedMaterial: edited, author: 'Professor' })
    });
    assert.equal(updMat.statusCode, 200);
    const updatedMat = JSON.parse(updMat.body).material;
    assert.equal(updatedMat.versions.length, 2);
    assert.notEqual(updatedMat.originalGeneratedMaterial.blocks[0].body, updatedMat.currentMaterial.blocks[0].body);

    // 5. Exportações reais verificadas (HTML, MD, SVG, DOCX, PPTX)
    for (const fmt of ['html', 'md', 'svg', 'docx', 'pptx']) {
      const expRes = await invokeHandler(handler, {
        method: 'POST',
        url: '/api/export',
        body: JSON.stringify({ material: edited, format: fmt, baseFilename: 'sistemas_8ano' })
      });
      assert.equal(expRes.statusCode, 200);
      const expJson = JSON.parse(expRes.body);
      assert.equal(expJson.verified, true);
      assert.ok(expJson.sizeBytes > 0);

      const dlRes = await invokeHandler(handler, { url: expJson.downloadUrl });
      assert.equal(dlRes.statusCode, 200);
      if (fmt === 'docx' || fmt === 'pptx') {
        assert.equal(dlRes.buffer[0], 0x50); // 'P'
        assert.equal(dlRes.buffer[1], 0x4b); // 'K' (ZIP OpenXML válido)
      }
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
