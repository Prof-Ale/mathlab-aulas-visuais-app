/**
 * Testes da Etapa 2 — Validação Funcional do Produto e Aperfeiçoamento do Gerador de Aulas
 * Usa mocks determinísticos para provedores externos (zero chamadas pagas).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { loadLocalEnvFile, sanitizeCredentials } from '../src/services/envLoader.js';
import { ResearchProviderService } from '../src/services/researchProviderService.js';
import { AiProviderService } from '../src/services/aiProviderService.js';
import { runAuthoringWorkflow, reprocessWorkflowStage } from '../src/core/workflowOrchestrator.js';
import { renderMaterialHtml, buildDocxBuffer, buildPptxBuffer } from '../src/core/exportEngine.js';
import { createAppHandler } from '../server.js';

function invokeHandler(handler, { method = 'GET', url = '/', body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const req = {
      method,
      url,
      async *[Symbol.asyncIterator]() {
        if (payload) yield payload;
      }
    };
    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(code, headers = {}) {
        this.statusCode = code;
        this.headers = headers;
      },
      end(data) {
        if (data) chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(String(data)));
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch {
          json = null;
        }
        resolve({ statusCode: this.statusCode, headers: this.headers, raw, json });
      }
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

function readZipEntryText(zipBuf, targetName) {
  let offset = 0;
  while (offset + 30 <= zipBuf.length) {
    const sig = zipBuf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const method = zipBuf.readUInt16LE(offset + 8);
    const compSize = zipBuf.readUInt32LE(offset + 18);
    const nameLen = zipBuf.readUInt16LE(offset + 26);
    const extraLen = zipBuf.readUInt16LE(offset + 28);
    const name = zipBuf.subarray(offset + 30, offset + 30 + nameLen).toString('utf8');
    const dataStart = offset + 30 + nameLen + extraLen;
    const compData = zipBuf.subarray(dataStart, dataStart + compSize);
    if (name === targetName) {
      const raw = method === 8 ? zlib.inflateRawSync(compData) : compData;
      return raw.toString('utf8');
    }
    offset = dataStart + compSize;
  }
  return null;
}

test('Etapa 2.1 - envLoader carrega .env local sem sobrescrever e sanitiza credenciais', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathlab-env-'));
  const envPath = path.join(tmpDir, '.env');
  await fs.writeFile(envPath, '# comentário\nMATHLAB_TEST_VAR="valor_teste_123"\n', 'utf8');
  delete process.env.MATHLAB_TEST_VAR;

  const loaded = await loadLocalEnvFile(envPath);
  assert.equal(loaded.loaded, true);
  assert.equal(process.env.MATHLAB_TEST_VAR, 'valor_teste_123');
  delete process.env.MATHLAB_TEST_VAR;

  const scrubbed = sanitizeCredentials('Erro em ?key=AIzaSySecret12345678901234567890 e Bearer tok_abc');
  assert.equal(scrubbed.includes('AIzaSySecret12345678901234567890'), false);
  assert.equal(scrubbed.includes('tok_abc'), false);
  assert.equal(scrubbed.includes('REDACTED'), true);
});

test('Etapa 2.2 - ResearchProviderService bloqueia sem autorização e respeita Metadados/Resumo em Crossref & OpenAlex', async () => {
  const service = new ResearchProviderService({
    fetchImpl: async (url) => {
      if (url.includes('crossref.org')) {
        return {
          ok: true,
          async json() {
            return {
              message: {
                items: [
                  {
                    DOI: '10.1007/s11858-020-01150-0',
                    title: ['Teaching Pythagorean Theorem Visually'],
                    author: [{ family: 'Silva' }],
                    issued: { 'date-parts': [[2020]] }
                  }
                ]
              }
            };
          }
        };
      }
      return {
        ok: true,
        async json() {
          return {
            results: [
              {
                doi: 'https://doi.org/10.1080/10749039.2019.1574306',
                title: 'The early history of the scaffolding metaphor',
                publication_year: 2019,
                authorships: [{ author: { display_name: 'Anna Shvarts' } }],
                abstract_inverted_index: { History: [0], of: [1], scaffolding: [2] }
              }
            ]
          };
        }
      };
    }
  });

  await assert.rejects(
    () => service.searchCrossref({ query: 'Pitágoras', authorized: false }),
    /autorização explícita obrigatória/
  );

  const cr = await service.searchCrossref({ query: 'Pitágoras', authorized: true });
  assert.equal(cr.length, 1);
  assert.equal(cr[0].doiVerified, true);
  assert.equal(cr[0].accessState, 'Metadados');

  const oa = await service.searchOpenAlex({ query: 'scaffolding', authorized: true });
  assert.equal(oa.length, 1);
  assert.equal(oa[0].doiOrIsbn, '10.1080/10749039.2019.1574306');
  assert.equal(oa[0].accessState, 'Metadados');
});

test('Etapa 2.3 - Gerador produz SVGs e exemplos resolvidos específicos por domínio (Pitágoras, Frações, Sistemas)', async () => {
  const wfPitagoras = await runAuthoringWorkflow({
    promptText: 'Crie uma aula sobre Teorema de Pitágoras para o 9º ano com exemplo numérico'
  });
  const svgPitagoras = wfPitagoras.material.blocks.find((b) => b.svg)?.svg || '';
  assert.equal(svgPitagoras.includes('Triângulo Retângulo'), true);

  const wfFracoes = await runAuthoringWorkflow({
    promptText: 'Prepare aula sobre frações equivalentes para o 6º ano'
  });
  const svgFracoes = wfFracoes.material.blocks.find((b) => b.svg)?.svg || '';
  assert.equal(svgFracoes.includes('Equivalência de Frações (Modelo de Barra)'), true);

  const wfSistemas = await runAuthoringWorkflow({
    promptText: 'Aula sobre sistemas lineares 2x2 com interpretação geométrica'
  });
  const svgSistemas = wfSistemas.material.blocks.find((b) => b.svg)?.svg || '';
  assert.equal(svgSistemas.includes('Solução (3, 2)'), true);
});

test('Etapa 2.4 - AiProviderService.buildFiveModulePrompt incorpora M01 a M05', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Aula de sistemas lineares 2x2' });
  const provider = new AiProviderService();
  const prompt = provider.buildFiveModulePrompt({
    interpreted: wf.interpreted,
    scientific: wf.scientific,
    pedagogical: wf.pedagogical,
    didactic: wf.didactic
  });
  assert.equal(prompt.includes('M01'), true);
  assert.equal(prompt.includes('M02'), true);
  assert.equal(prompt.includes('M03'), true);
  assert.equal(prompt.includes('M04'), true);
  assert.equal(prompt.includes('M05'), true);
});

test('Etapa 2.5 - reprocessWorkflowStage reprocessa etapas de forma independente', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Aula de Teorema de Pitágoras' });
  const updated = await reprocessWorkflowStage({
    workflow: wf,
    stageName: 'research',
    customSources: [
      {
        author: 'Shvarts; Bakker',
        year: 2019,
        title: 'The early history of the scaffolding metaphor',
        doi: '10.1080/10749039.2019.1574306',
        evidenceType: 'ARTIGO_CIENTIFICO_REVISADO',
        accessState: 'Resumo'
      }
    ]
  });
  assert.equal(
    updated.scientific.references.some((r) => r.title.includes('scaffolding metaphor')),
    true
  );
  assert.equal(
    updated.stageLog.some((s) => s.stage === 'REPROCESSO_Pesquisa_M01'),
    true
  );

  const reEditorial = await reprocessWorkflowStage({
    workflow: updated,
    stageName: 'editorial'
  });
  assert.equal(
    reEditorial.stageLog.some((s) => s.stage === 'REPROCESSO_Producao_Editorial_M04'),
    true
  );

  await assert.rejects(
    () => reprocessWorkflowStage({ workflow: updated, stageName: 'invalida' }),
    /Etapa inválida/
  );
});

test('Etapa 2.6 - Exportações HTML, DOCX e PPTX geram formatação real (sem ** crus e com identidade Navy/Gold)', async () => {
  const wf = await runAuthoringWorkflow({ promptText: 'Aula sobre Teorema de Pitágoras' });
  const html = renderMaterialHtml(wf.material);
  assert.equal(html.includes('<strong>'), true);
  assert.equal(html.includes('@page'), true);

  const docxBuf = buildDocxBuffer(wf.material);
  const docXml = readZipEntryText(docxBuf, 'word/document.xml');
  assert.ok(docXml);
  assert.equal(docXml.includes('<w:b/>'), true);
  assert.equal(docXml.includes('**'), false);

  const pptxBuf = buildPptxBuffer(wf.material);
  const slide1Xml = readZipEntryText(pptxBuf, 'ppt/slides/slide1.xml');
  const slide2Xml = readZipEntryText(pptxBuf, 'ppt/slides/slide2.xml');
  assert.ok(slide1Xml);
  assert.ok(slide2Xml);
  assert.equal(slide1Xml.includes('0A2540'), true);
  assert.equal(slide1Xml.includes('E5A000'), true);
  assert.equal(slide2Xml.includes('0A2540'), true);
});

test('Etapa 2.7 - Endpoints HTTP /api/research/search e /api/workflow/reprocess-stage funcionam', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathlab-srv-'));
  const handler = createAppHandler({
    dataFile: path.join(tmpDir, 'projects.json'),
    exportsDir: path.join(tmpDir, 'exports'),
    researchProvider: new ResearchProviderService({
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return {
            message: {
              items: [
                {
                  DOI: '10.1000/test-doi',
                  title: ['Estudo Didático de Pitágoras'],
                  author: [{ family: 'Oliveira' }],
                  issued: { 'date-parts': [[2022]] }
                }
              ]
            },
            results: []
          };
        }
      })
    })
  });

  const searchRes = await invokeHandler(handler, {
    method: 'POST',
    url: '/api/research/search',
    body: { query: 'Pitágoras', source: 'crossref', authorized: true }
  });
  assert.equal(searchRes.statusCode, 200);
  assert.equal(searchRes.json.ok, true);
  assert.equal(searchRes.json.results.length, 1);

  const runRes = await invokeHandler(handler, {
    method: 'POST',
    url: '/api/workflow/run',
    body: { promptText: 'Aula sobre frações equivalentes' }
  });
  assert.equal(runRes.statusCode, 200);

  const reprocessRes = await invokeHandler(handler, {
    method: 'POST',
    url: '/api/workflow/reprocess-stage',
    body: {
      workflow: runRes.json.workflow,
      stageName: 'research',
      customSources: searchRes.json.results
    }
  });
  assert.equal(reprocessRes.statusCode, 200);
  assert.equal(reprocessRes.json.ok, true);
  assert.equal(
    reprocessRes.json.workflow.scientific.references.some((r) => r.doiOrIsbn === '10.1000/test-doi'),
    true
  );
});
