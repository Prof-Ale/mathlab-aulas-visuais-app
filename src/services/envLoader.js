/**
 * Carregador seguro de variáveis de ambiente (.env) para MathLab Aulas Visuais.
 * Nunca expõe, registra em log ou serializa credenciais.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadLocalEnvFile(envFilePath = path.resolve(process.cwd(), '.env')) {
  try {
    const raw = await fs.readFile(envFilePath, 'utf8');
    for (const rawLine of raw.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && (process.env[key] === undefined || process.env[key] === '')) {
        process.env[key] = val;
      }
    }
    return { loaded: true };
  } catch (err) {
    if (err && err.code === 'ENOENT') return { loaded: false };
    return { loaded: false, error: err.message };
  }
}

export function sanitizeCredentials(text) {
  let out = String(text || '');
  const gemKey = (process.env.GEMINI_API_KEY || '').trim();
  if (gemKey.length >= 6) out = out.split(gemKey).join('[REDACTED_KEY]');
  return out
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_GEMINI_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED_KEY]');
}
