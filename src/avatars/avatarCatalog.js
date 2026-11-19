/**
 * MathLab Aulas Visuais - Catálogo de avatares do Prof. Alê Chocolate (Manual Visual 4.0)
 *
 * Regras do manual que o app respeita:
 *  - O app nunca gera, redesenha nem recorta avatar: usa só a imagem real deste catálogo.
 *  - Rosto, camiseta e logotipo MathLab não são alterados.
 *  - Só entra em material imagem aprovada e com fundo transparente verificado.
 *  - Família 01 (personagem pedagógico) é a usada em apostilas, atividades e materiais para estudantes.
 *
 * Para incluir uma pose nova: coloque o PNG em public/avatars/ e acrescente uma entrada abaixo.
 * `approved` é decisão sua. `qaPending` lista o que o manual (seção 8) manda conferir a olho.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AVATAR_DIR = path.resolve(__dirname, '..', '..', 'public', 'avatars');
export const AVATAR_CATALOG_VERSION = '0.1.0';

const QA_PENDING = ['rosto reconhecível', 'logotipo legível e sem deformação', 'mãos e anatomia'];

export const AVATARS = Object.freeze([
  {
    id: 'confiante', family: 'pedagogico', label: 'O Confiante', file: 'prof-ale_confiante.png',
    description: 'Braços cruzados e sorriso seguro.',
    uses: ['capa', 'abertura de aula', 'identificação do professor'],
    approved: true, transparent: true, qaPending: QA_PENDING
  },
  {
    id: 'acolhedor', family: 'pedagogico', label: 'O Acolhedor', file: 'prof-ale_acolhedor.png',
    description: 'Braços abertos e expressão receptiva.',
    uses: ['convivência', 'acolhimento', 'educação para todos', 'AEE'],
    approved: true, transparent: true, qaPending: QA_PENDING
  },
  {
    id: 'descobridor', family: 'pedagogico', label: 'O Descobridor', file: 'prof-ale_descobridor.png',
    description: 'Indicador levantado, livro MathLab e ideias matemáticas.',
    uses: ['curiosidades', 'conceitos novos', 'momentos de compreensão'],
    approved: true, transparent: true, qaPending: QA_PENDING
  },
  {
    id: 'pensador', family: 'pedagogico', label: 'O Pensador', file: 'prof-ale_pensador.png',
    description: 'Mão no queixo, olhar reflexivo e balão de ideias.',
    uses: ['perguntas', 'hipóteses', 'filosofia', 'psicologia', 'resolução de problemas'],
    approved: true, transparent: true, qaPending: QA_PENDING,
    note: 'Fundo original tinha quadriculado desenhado; recortado em novembro de 2026 sem alterar rosto, camiseta e logotipo.'
  },
  {
    id: 'comemorador-trofeu', family: 'pedagogico', label: 'O Comemorador (troféu)', file: 'prof-ale_comemorador-trofeu.png',
    description: 'Punho fechado e troféu "Conquista da turma".',
    uses: ['conquistas', 'desafios concluídos', 'reconhecimento do esforço'],
    approved: true, transparent: true, qaPending: QA_PENDING,
    note: 'Fundo original tinha quadriculado desenhado; recortado em novembro de 2026.'
  },
  {
    id: 'comemorador-conquista', family: 'pedagogico', label: 'O Comemorador (conquista)', file: 'prof-ale_comemorador-conquista.png',
    description: 'Variante da pose de comemoração.',
    uses: ['conquistas', 'desafios concluídos'],
    approved: true, transparent: true, qaPending: QA_PENDING,
    note: 'Fundo original tinha quadriculado desenhado; recortado em novembro de 2026.'
  },
  {
    id: 'tablet-caneta', family: 'pedagogico', label: 'Com tablet e caneta', file: 'prof-ale_tablet-caneta.png',
    description: 'Tablet com logotipo e caneta digital.',
    uses: ['tecnologia educacional', 'atividades digitais', 'planejamento'],
    approved: true, transparent: true, qaPending: QA_PENDING,
    note: 'Pose fora das seis oficiais do Manual 4.0. Confirme se entra como pose oficial.'
  }
]);

export function getAvatar(id) {
  return AVATARS.find((a) => a.id === id) || null;
}

export function listAvatars({ onlyUsable = false } = {}) {
  const list = onlyUsable ? AVATARS.filter((a) => a.approved && a.transparent) : [...AVATARS];
  return list.map((a) => ({ ...a }));
}

const AREA_POSE = {
  Filosofia: 'pensador',
  Psicologia: 'pensador',
  'Psicanálise': 'pensador',
  'Neurociências': 'pensador',
  Neuroanatomia: 'pensador',
  'Educação Especial e AEE': 'acolhedor',
  'Terapia Ocupacional': 'acolhedor',
  'Educação': 'acolhedor',
  Matemática: 'descobridor',
  'Física': 'descobridor',
  'Química': 'descobridor',
  Biologia: 'descobridor',
  'História': 'pensador',
  'Teologia e Ciências da Religião': 'pensador',
  'Teoria Musical': 'descobridor',
  Geografia: 'descobridor',
  'Língua Portuguesa': 'acolhedor'
};
const DOCTYPE_POSE = {
  lista_exercicios: 'comemorador-trofeu',
  avaliacao: 'confiante',
  material_recuperacao: 'acolhedor',
  guia_formacao: 'acolhedor',
  caderno_atividades: 'descobridor',
  apostila_didatica: 'confiante',
  roteiro_experimental: 'descobridor',
  apresentacao: 'tablet-caneta',
  ensaio_teorico: 'pensador',
  estudo_comparativo: 'pensador',
  revisao_bibliografica: 'pensador',
  artigo_cientifico: 'pensador'
};

/**
 * Sugere o avatar para um material.
 * Prioridade: finalidade "capa" (sempre o Confiante, como diz o manual), tipo de documento, área, padrão.
 * Devolve a sugestão, alternativas utilizáveis e o motivo em linguagem simples.
 */
export function selectAvatar({ knowledgeContext, purpose = 'capa' } = {}) {
  const usable = AVATARS.filter((a) => a.approved && a.transparent);
  const byId = (id) => usable.find((a) => a.id === id) || null;
  if (!usable.length) return { primary: null, alternatives: [], reason: 'Nenhum avatar aprovado e com fundo transparente no catálogo.' };

  let id;
  let reason;
  const area = knowledgeContext?.area || null;
  const dt = knowledgeContext?.documentType?.id || null;

  if (purpose === 'capa') {
    id = 'confiante';
    reason = 'O manual indica o Confiante para capas e identificação do professor.';
  } else if (dt && DOCTYPE_POSE[dt]) {
    id = DOCTYPE_POSE[dt];
    reason = `Pose indicada para o tipo de documento (${knowledgeContext.documentType.label}).`;
  } else if (area && AREA_POSE[area]) {
    id = AREA_POSE[area];
    reason = `Pose indicada para a área ${area}.`;
  } else {
    id = 'confiante';
    reason = 'Área e tipo de documento sem regra específica: pose padrão.';
  }

  const primary = byId(id) || usable[0];
  if (primary.id !== id) reason = 'A pose ideal não está disponível no catálogo; usei a primeira disponível.';
  return { primary: { ...primary }, alternatives: usable.filter((a) => a.id !== primary.id).map((a) => ({ ...a })), reason };
}

/** Lê o arquivo, confere que é PNG com canal alfa (tipo 6) e devolve dados para exportação. */
export async function loadAvatarForExport(id, dir = AVATAR_DIR) {
  const avatar = getAvatar(id);
  if (!avatar) throw new Error(`Avatar "${id}" não existe no catálogo.`);
  if (!avatar.approved || !avatar.transparent) throw new Error(`Avatar "${id}" não está aprovado com fundo transparente.`);
  const buffer = await fs.readFile(path.join(dir, avatar.file));
  const sig = buffer.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a') throw new Error(`O arquivo de "${id}" não é um PNG válido.`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer.readUInt8(25);
  if (colorType !== 6) throw new Error(`O PNG de "${id}" não tem canal alfa (transparência).`);
  return { id, buffer, width, height, mime: 'image/png', alt: `Professor Alê Chocolate, ${avatar.label.toLowerCase()}` };
}
