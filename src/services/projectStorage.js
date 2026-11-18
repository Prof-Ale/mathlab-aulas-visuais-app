/**
 * MathLab Aulas Visuais - Project & Material Storage Service (Seções 13 e 17)
 *
 * Persistência local atômica em JSON (data/projects.json), preservando
 * histórico de versões e separação entre resposta original e edições humanas.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export class ProjectStorage {
  constructor(dataFilePath) {
    this.dataFilePath = dataFilePath;
  }

  async _ensureDir() {
    await fs.mkdir(path.dirname(this.dataFilePath), { recursive: true });
  }

  async loadAll() {
    try {
      const raw = await fs.readFile(this.dataFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.projects) ? parsed.projects : [];
    } catch (err) {
      if (err && err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async saveAll(projects) {
    await this._ensureDir();
    const tmp = `${this.dataFilePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ updatedAt: new Date().toISOString(), projects }, null, 2), 'utf8');
    await fs.rename(tmp, this.dataFilePath);
  }

  async createProject({ title, discipline = 'Matemática', gradeLevel = '8º ano', description = '' }) {
    const projects = await this.loadAll();
    const project = {
      id: `PRJ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      title: String(title || 'Novo Projeto MathLab').trim(),
      discipline,
      gradeLevel,
      description,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materials: []
    };
    projects.unshift(project);
    await this.saveAll(projects);
    return project;
  }

  async updateProject(projectId, patch = {}) {
    const projects = await this.loadAll();
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) throw new Error(`Projeto não encontrado: ${projectId}`);
    projects[idx] = {
      ...projects[idx],
      ...patch,
      id: projects[idx].id,
      updatedAt: new Date().toISOString()
    };
    await this.saveAll(projects);
    return projects[idx];
  }

  async duplicateProject(projectId) {
    const projects = await this.loadAll();
    const orig = projects.find((p) => p.id === projectId);
    if (!orig) throw new Error(`Projeto não encontrado: ${projectId}`);
    const copy = structuredClone(orig);
    copy.id = `PRJ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    copy.title = `${orig.title} (Cópia)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    projects.unshift(copy);
    await this.saveAll(projects);
    return copy;
  }

  async deleteProject(projectId) {
    const projects = await this.loadAll();
    const filtered = projects.filter((p) => p.id !== projectId);
    if (filtered.length === projects.length) throw new Error(`Projeto não encontrado: ${projectId}`);
    await this.saveAll(filtered);
    return { deleted: true, projectId };
  }

  async saveMaterialToProject(projectId, workflowOutput, humanEditedMaterial = null) {
    const projects = await this.loadAll();
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) throw new Error(`Projeto não encontrado: ${projectId}`);

    const materialId = `MAT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const currentMaterial = humanEditedMaterial || workflowOutput.material;
    const entry = {
      id: materialId,
      title: currentMaterial.title,
      discipline: workflowOutput.interpreted?.fields?.discipline || 'Matemática',
      gradeLevel: workflowOutput.interpreted?.fields?.gradeLevel || '',
      workflowMode: workflowOutput.interpreted?.workflowMode || 'Professor',
      productionMode: workflowOutput.productionMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originalGeneratedMaterial: workflowOutput.originalGeneratedMaterial || workflowOutput.material,
      currentMaterial,
      audit: workflowOutput.audit,
      scientific: workflowOutput.scientific,
      didactic: workflowOutput.didactic,
      pedagogical: workflowOutput.pedagogical,
      interpreted: workflowOutput.interpreted || null,
      versions: [
        {
          versionNumber: 1,
          savedAt: new Date().toISOString(),
          author: humanEditedMaterial ? 'Edição Humana' : 'Geração Inicial',
          material: structuredClone(currentMaterial)
        }
      ]
    };

    projects[idx].materials.unshift(entry);
    projects[idx].updatedAt = new Date().toISOString();
    await this.saveAll(projects);
    return entry;
  }

  async updateMaterialVersion(projectId, materialId, updatedMaterial, author = 'Edição Humana', audit = null) {
    const projects = await this.loadAll();
    const pIdx = projects.findIndex((p) => p.id === projectId);
    if (pIdx === -1) throw new Error(`Projeto não encontrado: ${projectId}`);
    const mIdx = projects[pIdx].materials.findIndex((m) => m.id === materialId);
    if (mIdx === -1) throw new Error(`Material não encontrado: ${materialId}`);

    const mat = projects[pIdx].materials[mIdx];
    const nextVer = (mat.versions?.length || 0) + 1;
    mat.currentMaterial = updatedMaterial;
    if (audit) mat.audit = audit;
    mat.title = updatedMaterial.title || mat.title;
    mat.updatedAt = new Date().toISOString();
    mat.versions.push({
      versionNumber: nextVer,
      savedAt: mat.updatedAt,
      author,
      material: structuredClone(updatedMaterial)
    });
    projects[pIdx].updatedAt = mat.updatedAt;
    await this.saveAll(projects);
    return mat;
  }
}
