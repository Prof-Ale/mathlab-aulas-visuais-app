/**
 * MathLab Aulas Visuais - Knowledge Base & Patrimony Recovery (Fase Zero)
 *
 * Indexa e disponibiliza em modo somente-leitura os módulos intelectuais (M01–M05)
 * e protocolos operacionais recuperados do repositório MathLab, preservando
 * baselines e candidatas sem promoção automática silenciosa.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const INTELLECTUAL_PATRIMONY_CATALOG = Object.freeze([
  {
    id: 'M01_CANDIDATA_REV6',
    moduleCode: 'M01',
    title: 'Base Científica',
    version: '2.3.3-CANDIDATA-REV6',
    category: 'Cientifica',
    state: 'candidata',
    relPath: '01_base_cientifica_v2.3.3_CANDIDATA_REV6.md',
    destination: 'src/core/scientificEngine.js'
  },
  {
    id: 'M01_CANDIDATA_REV5',
    moduleCode: 'M01',
    title: 'Base Científica',
    version: '2.3.2-CANDIDATA-REV5',
    category: 'Cientifica',
    state: 'baseline_anterior',
    relPath: '01_base_cientifica_v2.3.2_CANDIDATA_REV5.md',
    destination: 'src/core/scientificEngine.js'
  },
  {
    id: 'M02_CANDIDATA_REV6',
    moduleCode: 'M02',
    title: 'Motor Pedagógico',
    version: '2.3.7-CANDIDATA-REV6',
    category: 'Pedagogica',
    state: 'candidata',
    relPath: '02_motor_pedagogico_v2.3.7_CANDIDATA_REV6.md',
    destination: 'src/core/pedagogicalEngine.js'
  },
  {
    id: 'M02_BASELINE',
    moduleCode: 'M02',
    title: 'Motor Pedagógico',
    version: '2.3.6-BASELINE',
    category: 'Pedagogica',
    state: 'baseline',
    relPath: 'PACOTE_LEITURA_GEMINI_REV5_1/02_BASELINES/02_motor_pedagogico_v2.3.6.md',
    destination: 'src/core/pedagogicalEngine.js'
  },
  {
    id: 'M03_CANDIDATA_REV5',
    moduleCode: 'M03',
    title: 'Engenharia Didática',
    version: '2.2-CANDIDATA-REV5',
    category: 'Didatica',
    state: 'candidata',
    relPath: '03_engenharia_didatica_v2.2_CANDIDATA_REV5.md',
    destination: 'src/core/didacticEngine.js'
  },
  {
    id: 'M04_BASELINE',
    moduleCode: 'M04',
    title: 'Design Editorial',
    version: '2.4-BASELINE',
    category: 'Editorial',
    state: 'baseline',
    relPath: 'PACOTE_LEITURA_GEMINI_REV5_1/02_BASELINES/04_design_editorial_v2.4.md',
    destination: 'src/core/editorialEngine.js'
  },
  {
    id: 'M05_CANDIDATA_REV5',
    moduleCode: 'M05',
    title: 'Auditoria de Qualidade',
    version: '2.1-CANDIDATA-REV5',
    category: 'Auditoria',
    state: 'candidata',
    relPath: '05_auditoria_qualidade_v2.1_CANDIDATA_REV5.md',
    destination: 'src/core/qualityEngine.js'
  },
  {
    id: 'M05_CANDIDATA_REV4',
    moduleCode: 'M05',
    title: 'Auditoria de Qualidade',
    version: '2.1-CANDIDATA-REV4',
    category: 'Auditoria',
    state: 'baseline_anterior',
    relPath: '05_auditoria_qualidade_v2.1_CANDIDATA_REV4.md',
    destination: 'src/core/qualityEngine.js'
  },
  {
    id: 'OP_FLUXOS_REV3',
    moduleCode: 'FLUXOS',
    title: 'Fluxos de Trabalho',
    version: '2.1-CANDIDATA-REV3',
    category: 'Operacional',
    state: 'operacional',
    relPath: 'fluxos_de_trabalho_v2.1_CANDIDATA_REV3.md',
    destination: 'src/core/workflowOrchestrator.js'
  },
  {
    id: 'OP_ADAPTER_GEMINI_REV5',
    moduleCode: 'ADAPTER',
    title: 'Adaptador Gemini',
    version: '2.1-CANDIDATA-REV5',
    category: 'Operacional',
    state: 'operacional',
    relPath: 'adapter_gemini_v2.1_CANDIDATA_REV5.md',
    destination: 'src/services/aiProviderService.js'
  }
]);

export const VERSION_CONFLICTS_AND_PENDING_DECISIONS = Object.freeze([
  {
    moduleCode: 'M01',
    baselineOrPrevious: '01_base_cientifica_v2.3.2_CANDIDATA_REV5.md',
    candidate: '01_base_cientifica_v2.3.3_CANDIDATA_REV6.md',
    decisionStatus: 'PENDENTE_PROMOCAO_CANONICA',
    summary: 'REV6 adiciona protocolo de genealogia conceitual (camadas históricas vs. operacionalização empírica).'
  },
  {
    moduleCode: 'M02',
    baselineOrPrevious: '02_motor_pedagogico_v2.3.6.md',
    candidate: '02_motor_pedagogico_v2.3.7_CANDIDATA_REV6.md',
    decisionStatus: 'PENDENTE_PROMOCAO_CANONICA',
    summary: 'REV6 refina distinção entre ZDP (Vygotsky) e scaffolding (Wood, Bruner & Ross, 1976) e UDL 3.0.'
  },
  {
    moduleCode: 'M05',
    baselineOrPrevious: '05_auditoria_qualidade_v2.1_CANDIDATA_REV4.md',
    candidate: '05_auditoria_qualidade_v2.1_CANDIDATA_REV5.md',
    decisionStatus: 'PENDENTE_PROMOCAO_CANONICA',
    summary: 'REV5 integra Hard Fails de genealogia conceitual e rastreabilidade documental.'
  }
]);

/**
 * Carrega o inventário real do disco com tamanho e SHA-256 sem modificar os originais.
 */
export async function loadKnowledgeInventory(docsRootDir) {
  const items = [];
  for (const entry of INTELLECTUAL_PATRIMONY_CATALOG) {
    const absPath = path.resolve(docsRootDir, entry.relPath);
    try {
      const buf = await fs.readFile(absPath);
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
      items.push({
        ...entry,
        available: true,
        sizeBytes: buf.length,
        sha256
      });
    } catch {
      items.push({
        ...entry,
        available: false,
        sizeBytes: 0,
        sha256: null
      });
    }
  }
  return {
    loadedAt: new Date().toISOString(),
    docsRootDir,
    totalCatalogEntries: items.length,
    availableCount: items.filter((i) => i.available).length,
    items,
    pendingVersionDecisions: VERSION_CONFLICTS_AND_PENDING_DECISIONS
  };
}
