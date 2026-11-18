/**
 * MathLab Aulas Visuais - Scientific Research Provider (M01 + Seção 6)
 *
 * Integração real com Crossref e OpenAlex para consulta de metadados e DOIs.
 * Regras epistemológicas:
 *  - Nunca inventar referências ou declarar DOI verificado sem consulta efetiva.
 *  - Nunca declarar acesso "Integral" quando a API retornou apenas metadados/resumo.
 *  - Exige autorização explícita (authorized === true) para chamadas externas.
 */

import { createTraceableReference, SOURCE_ACCESS_STATES, EVIDENCE_TYPES } from '../core/scientificEngine.js';

export class ResearchProviderService {
  constructor({ fetchImpl = null, timeoutMs = 15000 } = {}) {
    this._fetch = fetchImpl || (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null);
    this.timeoutMs = Math.max(500, Number(timeoutMs) || 15000);
  }

  async searchCrossref({ query, rows = 5, authorized = false }) {
    if (authorized !== true) {
      throw new Error('Consulta externa ao Crossref bloqueada: autorização explícita obrigatória.');
    }
    if (!this._fetch) throw new Error('Fetch indisponível para consulta ao Crossref.');

    const url = `https://api.crossref.org/works?query=${encodeURIComponent(String(query || '').trim())}&rows=${Math.min(10, Math.max(1, rows))}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this._fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'MathLabAulasVisuais/1.0 (mailto:local@mathlab.edu)' },
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`);
      const json = await res.json();
      const items = json?.message?.items || [];

      return items.map((item) => {
        const authors = Array.isArray(item.author)
          ? item.author.map((a) => [a.family, a.given].filter(Boolean).join(', ')).join('; ')
          : 'Autor não informado';
        const year = item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0] || 's.d.';
        const title = Array.isArray(item.title) ? item.title[0] : item.title || 'Sem título';
        const hasAbstract = Boolean(item.abstract && String(item.abstract).trim());
        const ref = createTraceableReference({
          author: authors || 'Autor não informado',
          title,
          year: String(year),
          publication: Array.isArray(item['container-title']) ? item['container-title'][0] || '' : '',
          doiOrIsbn: item.DOI || '',
          url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ''),
          sourceType: 'Artigo / Obra (Crossref)',
          evidenceType: EVIDENCE_TYPES.EMPIRICAL,
          accessState: hasAbstract ? SOURCE_ACCESS_STATES.SUMMARY : SOURCE_ACCESS_STATES.METADATA,
          relevantExcerpts: hasAbstract ? [String(item.abstract).replace(/<[^>]+>/g, '').slice(0, 300)] : []
        });
        return { ...ref, provider: 'crossref', doiVerified: Boolean(item.DOI) };
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async searchOpenAlex({ query, perPage = 5, authorized = false }) {
    if (authorized !== true) {
      throw new Error('Consulta externa ao OpenAlex bloqueada: autorização explícita obrigatória.');
    }
    if (!this._fetch) throw new Error('Fetch indisponível para consulta ao OpenAlex.');

    const url = `https://api.openalex.org/works?search=${encodeURIComponent(String(query || '').trim())}&per-page=${Math.min(10, Math.max(1, perPage))}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this._fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
      const json = await res.json();
      const results = json?.results || [];

      return results.map((w) => {
        const authors = Array.isArray(w.authorships)
          ? w.authorships.map((a) => a.author?.display_name).filter(Boolean).join('; ')
          : 'Autor não informado';
        const cleanDoi = w.doi ? String(w.doi).replace(/^https?:\/\/doi\.org\//i, '') : '';
        const ref = createTraceableReference({
          author: authors || 'Autor não informado',
          title: w.title || w.display_name || 'Sem título',
          year: String(w.publication_year || 's.d.'),
          publication: w.primary_location?.source?.display_name || '',
          doiOrIsbn: cleanDoi,
          url: w.doi || w.id || '',
          sourceType: 'Obra indexada (OpenAlex)',
          evidenceType: EVIDENCE_TYPES.THEORETICAL,
          accessState: SOURCE_ACCESS_STATES.METADATA,
          relevantExcerpts: []
        });
        return { ...ref, provider: 'openalex', doiVerified: Boolean(cleanDoi) };
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
