import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AVATARS, AVATAR_DIR, listAvatars, selectAvatar, loadAvatarForExport } from '../src/avatars/avatarCatalog.js';
import { renderMaterialHtml, buildDocxBuffer, exportMaterialToFile } from '../src/core/exportEngine.js';

const material = { title: 'Teste', blocks: [{ id: 'b1', title: 'Seção', body: 'Texto' }] };

test('todo avatar do catálogo tem arquivo PNG com canal alfa', async () => {
  for (const a of AVATARS) {
    const av = await loadAvatarForExport(a.id);
    assert.ok(av.width > 500 && av.height > 500, a.id);
  }
  const files = await fs.readdir(AVATAR_DIR);
  for (const a of AVATARS) assert.ok(files.includes(a.file), `${a.file} ausente`);
});

test('seleção: capa usa o Confiante; áreas e tipos seguem o manual', () => {
  assert.equal(selectAvatar({ purpose: 'capa' }).primary.id, 'confiante');
  assert.equal(selectAvatar({ knowledgeContext: { area: 'Filosofia' }, purpose: 'secao' }).primary.id, 'pensador');
  assert.equal(selectAvatar({ knowledgeContext: { area: 'Educação Especial e AEE' }, purpose: 'secao' }).primary.id, 'acolhedor');
  assert.equal(selectAvatar({ knowledgeContext: { area: 'Matemática', documentType: { id: 'lista_exercicios', label: 'Lista de exercícios' } }, purpose: 'secao' }).primary.id, 'comemorador-trofeu');
  const none = selectAvatar({ knowledgeContext: {}, purpose: 'secao' });
  assert.ok(none.primary && none.reason && none.alternatives.length > 0);
});

test('avatar não aprovado nunca é oferecido nem exportado', async () => {
  const listed = listAvatars({ onlyUsable: true });
  assert.ok(listed.every((a) => a.approved && a.transparent));
  await assert.rejects(() => loadAvatarForExport('nao-existe'), /não existe/);
});

test('HTML embute a imagem real e exportação sem avatar continua igual', async () => {
  const av = await loadAvatarForExport('confiante');
  const withAv = renderMaterialHtml(material, { avatar: av });
  assert.match(withAv, /<img src="data:image\/png;base64,/);
  assert.match(withAv, /alt="Professor Alê Chocolate/);
  assert.ok(!renderMaterialHtml(material).includes('<img'));
});

test('DOCX com avatar contém a mídia, a relação e o tipo png', async () => {
  const av = await loadAvatarForExport('pensador');
  const buf = buildDocxBuffer(material, { avatar: av });
  const text = buf.toString('latin1');
  assert.ok(text.includes('word/media/avatar.png') && text.includes('word/_rels/document.xml.rels'));
  assert.ok(!buildDocxBuffer(material).toString('latin1').includes('avatar.png'));
});

test('exportMaterialToFile aceita avatarId e rejeita id inválido', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ml-av-'));
  const ok = await exportMaterialToFile({ material, format: 'html', exportsDir: dir, baseFilename: 'x', skipCompletenessCheck: true, avatarId: 'acolhedor' });
  assert.ok((await fs.readFile(ok.filePath, 'utf8')).includes('data:image/png'));
  await assert.rejects(() => exportMaterialToFile({ material, format: 'html', exportsDir: dir, skipCompletenessCheck: true, avatarId: 'xx' }), /não existe/);
  await fs.rm(dir, { recursive: true, force: true });
});
