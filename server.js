/**
 * MathLab Aulas Visuais v1.0.0 - Servidor Local
 * Endereço padrão: http://127.0.0.1:4180
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadKnowledgeInventory } from './src/knowledge/knowledgeBase.js';
import { getKnowledgeCatalog } from './src/core/knowledgeContext.js';
import { listAvatars, selectAvatar } from './src/avatars/avatarCatalog.js';
import { runAuthoringWorkflow, reprocessWorkflowStage } from './src/core/workflowOrchestrator.js';
import { auditLessonMaterial } from './src/core/qualityEngine.js';
import { exportMaterialToFile } from './src/core/exportEngine.js';
import { buildManualPrompt, importManualDraft } from './src/core/manualLlmBridge.js';
import { ProjectStorage } from './src/services/projectStorage.js';
import { AiProviderService } from './src/services/aiProviderService.js';
import { ResearchProviderService } from './src/services/researchProviderService.js';
import { loadLocalEnvFile, sanitizeCredentials } from './src/services/envLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, 'public');
const DATA_FILE = path.resolve(__dirname, 'data', 'projects.json');
const EXPORTS_DIR = path.resolve(__dirname, 'data', 'exports');
const DOCS_ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req, maxBytes = 5 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      const err = new Error('Payload excede o limite permitido.');
      err.statusCode = 413;
      throw err;
    }
    chunks.push(buf);
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function isInsideDir(baseDir, targetPath) {
  return targetPath === baseDir || targetPath.startsWith(baseDir + path.sep);
}

export function createAppHandler(options = {}) {
  const storage = options.storage || new ProjectStorage(options.dataFile || DATA_FILE);
  const exportsDir = options.exportsDir || EXPORTS_DIR;
  const docsRootDir = options.docsRootDir || DOCS_ROOT_DIR;
  const aiProvider = options.aiProvider || new AiProviderService();
  const researchProvider = options.researchProvider || new ResearchProviderService();

  return async function appHandler(req, res) {
    try {
      const urlObj = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(urlObj.pathname);

      if (pathname === '/api/health' && req.method === 'GET') {
        return sendJson(res, 200, {
          ok: true,
          application: 'MathLab Aulas Visuais',
          version: '1.0.0',
          providers: aiProvider.getStatus()
        });
      }

      if (pathname === '/api/knowledge/inventory' && req.method === 'GET') {
        const inventory = await loadKnowledgeInventory(docsRootDir);
        return sendJson(res, 200, inventory);
      }

      if (pathname === '/api/knowledge/catalog' && req.method === 'GET') {
        return sendJson(res, 200, getKnowledgeCatalog());
      }

      if (pathname === '/api/avatars' && req.method === 'GET') {
        return sendJson(res, 200, { avatars: listAvatars() });
      }

      if (pathname === '/api/avatars/suggest' && req.method === 'POST') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, { ok: true, ...selectAvatar({ knowledgeContext: body.knowledgeContext, purpose: body.purpose || 'capa' }) });
      }

      if (pathname === '/api/providers/status' && req.method === 'GET') {
        return sendJson(res, 200, { providers: aiProvider.getStatus() });
      }

      // Projetos
      if (pathname === '/api/projects' && req.method === 'GET') {
        const projects = await storage.loadAll();
        return sendJson(res, 200, { projects });
      }

      if (pathname === '/api/projects' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const project = await storage.createProject(body);
        return sendJson(res, 201, { ok: true, project });
      }

      const prjMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
      if (prjMatch) {
        const projectId = prjMatch[1];
        if (req.method === 'PUT') {
          const body = await readJsonBody(req);
          const project = await storage.updateProject(projectId, body);
          return sendJson(res, 200, { ok: true, project });
        }
        if (req.method === 'DELETE') {
          const out = await storage.deleteProject(projectId);
          return sendJson(res, 200, { ok: true, ...out });
        }
      }

      const dupMatch = pathname.match(/^\/api\/projects\/([^/]+)\/duplicate$/);
      if (dupMatch && req.method === 'POST') {
        const copy = await storage.duplicateProject(dupMatch[1]);
        return sendJson(res, 201, { ok: true, project: copy });
      }

      const matCreateMatch = pathname.match(/^\/api\/projects\/([^/]+)\/materials$/);
      if (matCreateMatch && req.method === 'POST') {
        const body = await readJsonBody(req);
        const saved = await storage.saveMaterialToProject(
          matCreateMatch[1],
          body.workflowOutput,
          body.humanEditedMaterial || null
        );
        return sendJson(res, 201, { ok: true, material: saved });
      }

      const matUpdateMatch = pathname.match(/^\/api\/projects\/([^/]+)\/materials\/([^/]+)$/);
      if (matUpdateMatch && req.method === 'PUT') {
        const body = await readJsonBody(req);
        const updated = await storage.updateMaterialVersion(
          matUpdateMatch[1],
          matUpdateMatch[2],
          body.updatedMaterial,
          body.author || 'Edição Humana',
          body.audit || null
        );
        return sendJson(res, 200, { ok: true, material: updated });
      }

      // Workflow de Autoria
      if (pathname === '/api/workflow/run' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const result = await runAuthoringWorkflow({
          promptText: body.promptText || '',
          overrides: body.overrides || {},
          customSources: body.customSources || [],
          aiProvider,
          useExternalAi: Boolean(body.useExternalAi),
          authorizedExternalCall: body.authorizedExternalCall === true,
          modelName: body.modelName || 'gemini-2.5-flash'
        });
        return sendJson(res, 200, { ok: true, workflow: result });
      }

      if (pathname === '/api/workflow/reprocess-stage' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const updated = await reprocessWorkflowStage({
          workflow: body.workflow,
          stageName: body.stageName,
          customSources: body.customSources || [],
          aiProvider,
          useExternalAi: Boolean(body.useExternalAi),
          authorizedExternalCall: body.authorizedExternalCall === true,
          modelName: body.modelName || 'gemini-2.5-flash'
        });
        return sendJson(res, 200, { ok: true, workflow: updated });
      }

      // Ponte manual de LLM: monta o prompt para copiar e importa a resposta colada. Sem chamada externa.
      if (pathname === '/api/manual/prompt' && req.method === 'POST') {
        const body = await readJsonBody(req);
        try {
          return sendJson(res, 200, { ok: true, ...buildManualPrompt(body.workflow) });
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      if (pathname === '/api/manual/import' && req.method === 'POST') {
        const body = await readJsonBody(req);
        try {
          const result = importManualDraft({
            workflow: body.workflow,
            material: body.material,
            text: body.text,
            sourceLabel: body.sourceLabel
          });
          return sendJson(res, 200, { ok: true, ...result });
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      // Pesquisa Científica Real (Crossref & OpenAlex sob autorização explícita)
      if (pathname === '/api/research/search' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const query = String(body.query || '').trim();
        const source = String(body.source || 'all').toLowerCase();
        const rows = Math.min(Math.max(Number(body.rows || 5), 1), 10);
        const authorized = body.authorized === true;

        const crossref =
          source === 'all' || source === 'crossref'
            ? await researchProvider.searchCrossref({ query, rows, authorized })
            : [];
        const openalex =
          source === 'all' || source === 'openalex'
            ? await researchProvider.searchOpenAlex({ query, perPage: rows, authorized })
            : [];

        return sendJson(res, 200, {
          ok: true,
          query,
          source,
          crossref,
          openalex,
          results: [...crossref, ...openalex]
        });
      }

      // Auditoria M05 sob demanda
      if (pathname === '/api/audit/run' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const audit = auditLessonMaterial(body.material, {
          scientific: body.scientific,
          didactic: body.didactic,
          knowledgeContext: body.knowledgeContext
        });
        return sendJson(res, 200, { ok: true, audit });
      }

      // Exportação real verificada
      if (pathname === '/api/export' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const exported = await exportMaterialToFile({
          material: body.material,
          format: body.format || 'html',
          exportsDir,
          baseFilename: body.baseFilename || 'aula_mathlab',
          avatarId: body.avatarId || null
        });
        return sendJson(res, 200, {
          ok: true,
          verified: exported.verified,
          format: exported.format,
          filename: exported.filename,
          sizeBytes: exported.sizeBytes,
          downloadUrl: `/exports/${encodeURIComponent(exported.filename)}`
        });
      }

      // Download de arquivos exportados
      if (pathname.startsWith('/exports/') && req.method === 'GET') {
        const rel = pathname.slice('/exports/'.length);
        const safeFile = path.resolve(exportsDir, rel);
        if (!isInsideDir(exportsDir, safeFile)) {
          return sendJson(res, 403, { error: 'Acesso negado.' });
        }
        const buf = await fs.readFile(safeFile);
        const ext = path.extname(safeFile).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${path.basename(safeFile)}"`
        });
        return res.end(buf);
      }

      // Arquivos estáticos
      const relPublic = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const safePublic = path.resolve(PUBLIC_DIR, relPublic);
      if (!isInsideDir(PUBLIC_DIR, safePublic)) {
        return sendJson(res, 403, { error: 'Acesso negado.' });
      }
      try {
        const stat = await fs.stat(safePublic);
        if (stat.isFile()) {
          const buf = await fs.readFile(safePublic);
          const ext = path.extname(safePublic).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
          return res.end(buf);
        }
      } catch {
        return sendJson(res, 404, { error: 'Recurso não encontrado.' });
      }

      return sendJson(res, 404, { error: 'Rota não encontrada.' });
    } catch (err) {
      return sendJson(res, err?.statusCode || 400, {
        ok: false,
        error: sanitizeCredentials(err?.message || 'Erro interno')
      });
    }
  };
}

export function createAppServer(options = {}) {
  return http.createServer(createAppHandler(options));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await loadLocalEnvFile(path.resolve(__dirname, '.env'));
  const port = Number(process.env.MATHLAB_PORT || 4180);
  const host = process.env.MATHLAB_HOST || '127.0.0.1';
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`MathLab Aulas Visuais v1.0.0 ativo em http://${host}:${port}`);
  });
}
