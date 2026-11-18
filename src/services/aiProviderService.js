/**
 * MathLab Aulas Visuais - AI Provider Service (Seção 15 + Etapa 2 Seção 3)
 *
 * Incorpora explicitamente regras dos 5 módulos intelectuais (M01-M05) no prompt
 * e nunca realiza chamadas pagas sem autorização explícita.
 */

import { sanitizeCredentials } from './envLoader.js';
import { selectProductionPath, listProfileSectionTitles } from '../core/productionProfiles.js';

export class AiProviderService {
  constructor({ fetchImpl = null } = {}) {
    this._fetch = fetchImpl || (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null);
  }

  getStatus() {
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    return {
      gemini: {
        configured: geminiConfigured,
        statusLabel: geminiConfigured ? 'Configurado (ambiente do servidor)' : 'Não configurado (modo offline disponível)'
      },
      openai: {
        configured: false,
        enabled: false,
        statusLabel: 'Preparado para integração futura (desativado)'
      }
    };
  }

  buildFiveModulePrompt({ interpreted, scientific, pedagogical, didactic }) {
    const { discipline, gradeLevel, topic, objectives } = interpreted.fields;
    const kc = interpreted.knowledgeContext;
    const route = selectProductionPath(interpreted);
    const isProfile = route.path === 'profile';
    const contextLines = kc
      ? [
          `[Contexto disciplinar]: Área=${kc.area || 'não confirmada'}${kc.subarea ? ` | Subárea=${kc.subarea}` : ''} | Natureza do conhecimento=${kc.epistemicNatures.map((n) => n.label).join('; ')} | Tipo de documento=${kc.documentType.label} | Público=${kc.audience}.`,
          kc.adapterGuidance
            ? `[Cuidados da área]: ${kc.adapterGuidance.cautions.join(' ')} Não imponha à área elementos que não lhe pertencem: ${kc.adapterGuidance.doNotRequire.join('; ')}.`
            : '[Cuidados da área]: área sem adaptador; declare a natureza do conhecimento e não invente fontes.',
          'Nunca invente autores, obras, edições, páginas, citações ou resultados. Quando não tiver certeza de uma fonte, escreva "fonte a verificar".'
        ]
      : [];
    const finalInstruction = isProfile
      ? [
          `PRODUZA um rascunho em Markdown para as seções abaixo, cada uma iniciada por um título de segundo nível idêntico ao nome da seção (## Nome da seção). Não produza exemplos resolvidos, gabarito nem atividades de aula.`,
          `Seções: ${listProfileSectionTitles(route.profileId).join(' | ')}.`
        ].join('\n')
      : 'PRODUZA a seção de Desenvolvimento Conceitual + Explicação + Exemplo Resolvido passo a passo em Markdown.';
    return [
      'VOCÊ ESTÁ OPERANDO NO AMBIENTE MATHLAB AULAS VISUAIS (M01-M05).',
      // Em documentos não didáticos, etapa e objetivos padrão do interpretador (formato de aula) só induziriam a erro.
      isProfile
        ? `SOLICITAÇÃO: Disciplina=${discipline} | Tema=${topic}${/^Não especificado/.test(gradeLevel || '') ? '' : ` | Etapa=${gradeLevel}`}`
        : `SOLICITAÇÃO: Disciplina=${discipline} | Etapa=${gradeLevel} | Tema=${topic}`,
      ...(isProfile ? [] : [`OBJETIVOS: ${objectives.join('; ')}`]),
      ...contextLines,
      `[M01 Base Científica]: Declare limitações documentais; não invente referências nem citações; distinga evidência empírica, teórica e normativa. Referências ativas: ${scientific.references.map((r) => `${r.author} (${r.year}) [${r.accessState}]`).join('; ')}.`,
      `[M02 Motor Pedagógico]: ${pedagogical.epistemicGuardrail} Referenciais mobilizados: ${pedagogical.mobilizedFrameworks.map((f) => f.label).join(', ')}.`,
      isProfile
        ? `[M03 Engenharia Didática]: não se aplica a este tipo de documento; não imponha estrutura de aula.`
        : `[M03 Engenharia Didática]: Mantenha alinhamento entre objetivos, atividades e critérios; não confunda realização de tarefa com aprendizagem demonstrada.`,
      `[M04 Design Editorial]: Use linguagem clara, notação LaTeX precisa ($...$ / $$...$$) e progressão visual-conceitual.`,
      `[M05 Auditoria]: Evite qualquer Hard Fail (anacronismo, atribuição falsa de scaffolding a Vigotski, divisão por zero sem ressalva).`,
      finalInstruction
    ].join('\n\n');
  }

  async generateLessonSection({
    interpreted,
    scientific,
    pedagogical,
    didactic,
    modelName = process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash',
    authorized = false
  }) {
    if (authorized !== true) {
      throw new Error('Chamada externa bloqueada: autorização explícita obrigatória.');
    }
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no ambiente do servidor.');
    }
    if (!this._fetch) {
      throw new Error('Fetch indisponível para comunicação com Gemini API.');
    }

    const prompt = this.buildFiveModulePrompt({ interpreted, scientific, pedagogical, didactic });
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;

    try {
      const res = await this._fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 3072 }
        })
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        throw new Error(`Gemini API HTTP ${res.status}: ${sanitizeCredentials(errTxt)}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('') || '';
      return {
        provider: 'gemini',
        text,
        promptUsed: prompt,
        metadata: {
          modelName,
          modelVersion: data?.modelVersion || modelName,
          usageMetadata: data?.usageMetadata || null
        }
      };
    } catch (err) {
      throw new Error(sanitizeCredentials(err.message));
    }
  }
}
