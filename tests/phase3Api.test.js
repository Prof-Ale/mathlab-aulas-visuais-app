import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createAppServer } from '../server.js';

async function withServer(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ml-p3-'));
  const server = createAppServer({ dataFile: path.join(dir, 'p.json'), exportsDir: path.join(dir, 'e') });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); await fs.rm(dir, { recursive: true, force: true }); }
}
const post = (u, b, m = 'POST') => fetch(u, { method: m, body: JSON.stringify(b) }).then((r) => r.json());

test('catálogo de conhecimento expõe áreas, naturezas e tipos sem regras internas', async () => {
  await withServer(async (base) => {
    const c = await fetch(`${base}/api/knowledge/catalog`).then((r) => r.json());
    assert.ok(c.areas.length >= 12);
    assert.ok(c.areas.some((a) => a.area === 'Filosofia' && a.subareas.length > 0));
    assert.ok(c.natures.length > 0 && c.documentTypes.length > 0);
    assert.ok(!JSON.stringify(c).includes('auditRules'));
  });
});

test('material salvo guarda o contexto interpretado e a auditoria atualizada', async () => {
  await withServer(async (base) => {
    const wf = (await post(`${base}/api/workflow/run`, { promptText: 'Ensaio teórico sobre a angústia em Kierkegaard' })).workflow;
    const prj = (await post(`${base}/api/projects`, { title: 'T', discipline: 'Filosofia' })).project;
    const mat = (await post(`${base}/api/projects/${prj.id}/materials`, { workflowOutput: wf })).material;
    assert.equal(mat.interpreted.knowledgeContext.area, 'Filosofia');
    const audit = (await post(`${base}/api/audit/run`, { material: wf.material, knowledgeContext: wf.interpreted.knowledgeContext })).audit;
    const upd = (await post(`${base}/api/projects/${prj.id}/materials/${mat.id}`, { updatedMaterial: wf.material, audit }, 'PUT')).material;
    assert.equal(upd.audit.status, audit.status);
  });
});
