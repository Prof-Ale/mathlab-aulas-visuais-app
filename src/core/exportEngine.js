/**
 * MathLab Aulas Visuais - Real Export Engine (Módulo 09 + M04)
 *
 * Gera e verifica arquivos reais em:
 *  - Markdown (.md)
 *  - HTML otimizado para impressão / PDF (.html)
 *  - DOCX (.docx OpenXML válido, sem dependências externas)
 *  - PPTX (.pptx OpenXML válido, sem dependências externas)
 *  - SVG (.svg dos diagramas pedagógicos)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { validateMaterialCompleteness } from './qualityEngine.js';
import { loadAvatarForExport } from '../avatars/avatarCatalog.js';

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Tabela CRC32 padrão para geração de ZIP OpenXML (.docx / .pptx)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Constrói um arquivo ZIP válido em memória (deflate via node:zlib).
 */
export function buildZipArchive(entries) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const rawBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data), 'utf8');
    const compressed = zlib.deflateRawSync(rawBuf);
    const crc = crc32(rawBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localChunks.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralChunks.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralChunks);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDir.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralDir, endRecord]);
}

export function renderMaterialMarkdown(material) {
  const lines = [`# ${material.title || 'Material MathLab Aulas Visuais'}`, ''];
  for (const blk of material.blocks || []) {
    lines.push(`## ${blk.title || 'Seção'}`);
    lines.push('');
    if (blk.body) lines.push(blk.body);
    if (blk.latex) {
      lines.push('');
      lines.push(`$$${blk.latex}$$`);
    }
    if (blk.svg) {
      lines.push('');
      lines.push('_[Diagrama SVG pedagógico incluído na versão visual/HTML]_');
    }
    lines.push('');
  }
  return lines.join('\n');
}

function renderInlineMarkdownToHtml(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

function renderMarkdownBodyToHtml(body) {
  const lines = String(body || '').split(/\r?\n/);
  const out = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      out.push('</ol>');
      inOl = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      closeLists();
      out.push(`<h4>${renderInlineMarkdownToHtml(trimmed.slice(4))}</h4>`);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${renderInlineMarkdownToHtml(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${renderInlineMarkdownToHtml(olMatch[1])}</li>`);
      continue;
    }

    closeLists();
    out.push(`<p>${renderInlineMarkdownToHtml(trimmed)}</p>`);
  }

  closeLists();
  return out.join('\n');
}

function parseInlineMarkdownRuns(line) {
  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), bold: false, italic: false });
    }
    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ text: raw.slice(2, -2), bold: true, italic: false });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ text: raw.slice(1, -1), bold: false, italic: true });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ text: raw.slice(1, -1), bold: false, italic: false });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), bold: false, italic: false });
  }
  if (tokens.length === 0) {
    tokens.push({ text: '', bold: false, italic: false });
  }
  return tokens;
}

function buildDocxParagraphXml(rawLine) {
  const trimmed = String(rawLine ?? '').trim();
  if (!trimmed) {
    return '<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>';
  }

  if (trimmed.startsWith('### ')) {
    const headingText = trimmed.slice(4).replace(/\*\*/g, '');
    return `<w:p><w:pPr><w:spacing w:before="140" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve">${escapeXml(headingText)}</w:t></w:r></w:p>`;
  }

  const isBullet = /^[-*]\s+/.test(trimmed);
  const contentText = isBullet ? `• ${trimmed.replace(/^[-*]\s+/, '')}` : trimmed;
  const indentXml = isBullet ? '<w:ind w:left="360"/>' : '';
  const runsXml = parseInlineMarkdownRuns(contentText)
    .map((tok) => {
      const rPrParts = [];
      if (tok.bold) rPrParts.push('<w:b/>');
      if (tok.italic) rPrParts.push('<w:i/>');
      rPrParts.push('<w:sz w:val="21"/><w:color w:val="0F172A"/>');
      return `<w:r><w:rPr>${rPrParts.join('')}</w:rPr><w:t xml:space="preserve">${escapeXml(tok.text)}</w:t></w:r>`;
    })
    .join('');

  return `<w:p><w:pPr>${indentXml}<w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr>${runsXml}</w:p>`;
}

export function renderMaterialHtml(material, { avatar = null } = {}) {
  const sectionsHtml = (material.blocks || [])
    .map(
      (blk) => `
    <section class="lesson-block">
      <h2>${escapeHtml(blk.title)}</h2>
      <div class="block-body">${renderMarkdownBodyToHtml(blk.body || '')}</div>
      ${blk.latex ? `<div class="math-box"><code>$$${escapeHtml(blk.latex)}$$</code></div>` : ''}
      ${blk.svg ? `<div class="diagram-box">${blk.svg}</div>` : ''}
    </section>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(material.title || 'MathLab Aulas Visuais')}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; background: #FFFFFF; margin: 28px auto; max-width: 820px; line-height: 1.55; }
    header { border-bottom: 3px solid #E5A000; padding-bottom: 10px; margin-bottom: 20px; }
    h1 { color: #0A2540; margin: 0 0 4px 0; font-size: 1.55rem; }
    .cover { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .cover img { height: 130px; width: auto; flex: none; }
    h2 { color: #0A2540; font-size: 1.15rem; border-left: 4px solid #E5A000; padding-left: 8px; margin-top: 18px; margin-bottom: 8px; }
    h4 { color: #0A2540; font-size: 0.98rem; margin: 10px 0 4px 0; }
    .block-body p { margin: 6px 0; }
    .block-body ul, .block-body ol { margin: 6px 0 8px 20px; padding-left: 8px; }
    .block-body li { margin-bottom: 4px; }
    .block-body code { background: #F1F5F9; padding: 1px 5px; border-radius: 4px; font-size: 0.92em; }
    .lesson-block { margin-bottom: 16px; page-break-inside: avoid; }
    .math-box { background: #F8FAFC; border: 1px solid #CBD5E1; padding: 8px 12px; margin-top: 8px; border-radius: 6px; }
    .diagram-box { margin-top: 10px; text-align: center; }
    @media print {
      body { margin: 0; max-width: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <header class="cover">
    <div>
      <h1>${escapeHtml(material.title || 'MathLab Aulas Visuais')}</h1>
      <small>Produzido com MathLab Aulas Visuais — Layout otimizado para impressão (economia de tinta)</small>
    </div>${avatar ? `\n    <img src="data:${avatar.mime};base64,${avatar.buffer.toString('base64')}" alt="${escapeHtml(avatar.alt)}" />` : ''}
  </header>
  ${sectionsHtml}
</body>
</html>`;
}

function buildDocxAvatarXml(avatar) {
  const cx = Math.round(4.2 * 360000); // 4,2 cm de largura
  const cy = Math.round((cx * avatar.height) / avatar.width);
  return `<w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Avatar" descr="${escapeXml(avatar.alt)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="avatar.png" descr="${escapeXml(avatar.alt)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdAvatar"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

export function buildDocxBuffer(material, { avatar = null } = {}) {
  const paragraphs = [];
  if (avatar) paragraphs.push(buildDocxAvatarXml(avatar));
  paragraphs.push(
    `<w:p><w:pPr><w:spacing w:after="160"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0A2540"/></w:rPr><w:t>${escapeXml(material.title || 'MathLab Aulas Visuais')}</w:t></w:r></w:p>`
  );

  for (const blk of material.blocks || []) {
    paragraphs.push(
      `<w:p><w:pPr><w:spacing w:before="200" w:after="100"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="E5A000"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0A2540"/></w:rPr><w:t>${escapeXml(blk.title || '')}</w:t></w:r></w:p>`
    );
    const lines = String(blk.body || '').split(/\r?\n/);
    for (const ln of lines) {
      paragraphs.push(buildDocxParagraphXml(ln));
    }
    if (blk.latex) {
      paragraphs.push(
        `<w:p><w:pPr><w:ind w:left="240"/><w:spacing w:before="60" w:after="120"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="1E3A5F"/></w:rPr><w:t xml:space="preserve">Expressão Matemática (LaTeX): $$${escapeXml(blk.latex)}$$</w:t></w:r></w:p>`
      );
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>${paragraphs.join('')}<w:sectPr/></w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${avatar ? '<Default Extension="png" ContentType="image/png"/>' : ''}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const entries = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rels },
    { name: 'word/document.xml', data: documentXml }
  ];
  if (avatar) {
    entries.push(
      {
        name: 'word/_rels/document.xml.rels',
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdAvatar" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/avatar.png"/></Relationships>`
      },
      { name: 'word/media/avatar.png', data: avatar.buffer }
    );
  }
  return buildZipArchive(entries);
}

function buildPptxParagraphsXml(bodyText) {
  const lines = String(bodyText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 14);

  if (lines.length === 0) {
    return '<a:p><a:r><a:rPr lang="pt-BR" sz="1500"/><a:t></a:t></a:r></a:p>';
  }

  return lines
    .map((line) => {
      const cleanLine = line.replace(/^###\s+/, '');
      const isBullet = /^[-*]\s+/.test(cleanLine);
      const displayLine = isBullet ? `• ${cleanLine.replace(/^[-*]\s+/, '')}` : cleanLine;
      const runs = parseInlineMarkdownRuns(displayLine.slice(0, 260))
        .map((tok) => {
          const bAttr = tok.bold ? ' b="1"' : '';
          const iAttr = tok.italic ? ' i="1"' : '';
          return `<a:r><a:rPr lang="pt-BR" sz="1500"${bAttr}${iAttr}><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></a:rPr><a:t>${escapeXml(tok.text)}</a:t></a:r>`;
        })
        .join('');
      return `<a:p><a:pPr marL="${isBullet ? '228600' : '0'}"/><a:spcAft><a:spcPts val="600"/></a:spcAft>${runs}</a:p>`;
    })
    .join('');
}

export function buildPptxBuffer(material, { avatar = null } = {}) {
  const blocks = (material.blocks || []).slice(0, 11);
  const slideEntries = [];
  const slideRels = [];
  const slideIds = [];
  const contentTypeOverrides = [];

  const addSlide = (num, slideXml) => {
    slideEntries.push({ name: `ppt/slides/slide${num}.xml`, data: slideXml });
    slideRels.push(
      `<Relationship Id="rId${num}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${num}.xml"/>`
    );
    slideIds.push(`<p:sldId id="${255 + num}" r:id="rId${num}"/>`);
    contentTypeOverrides.push(
      `<Override PartName="/ppt/slides/slide${num}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    );
  };

  // Slide 1: Capa institucional Navy + Gold
  // Avatar na capa: cabe em 2,7M x 4,3M EMU, encostado no canto inferior direito; título e subtítulo ficam mais estreitos.
  let avatarPicXml = '';
  let coverTextWidth = 7772400;
  if (avatar) {
    const scale = Math.min(2700000 / avatar.width, 4300000 / avatar.height);
    const aw = Math.round(avatar.width * scale);
    const ah = Math.round(avatar.height * scale);
    const ax = 9144000 - aw - 350000;
    const ay = 6858000 - ah - 250000;
    coverTextWidth = 5200000;
    avatarPicXml = `<p:pic>
      <p:nvPicPr><p:cNvPr id="6" name="Avatar" descr="${escapeXml(avatar.alt)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
      <p:blipFill><a:blip r:embed="rIdAvatar"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
      <p:spPr><a:xfrm><a:off x="${ax}" y="${ay}"/><a:ext cx="${aw}" cy="${ah}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
    </p:pic>`;
  }
  const coverXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr/>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="2" name="CoverBg"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="0A2540"/></a:solidFill>
      </p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
    </p:sp>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="3" name="GoldBar"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="685800" y="2100000"/><a:ext cx="1800000" cy="70000"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="E5A000"/></a:solidFill>
      </p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
    </p:sp>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="4" name="CoverTitle"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="685800" y="2350000"/><a:ext cx="${coverTextWidth}" cy="1800000"/></a:xfrm></p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="3400" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>${escapeXml(material.title || 'MathLab Aulas Visuais')}</a:t></a:r></a:p></p:txBody>
    </p:sp>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="5" name="CoverSubtitle"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="685800" y="4300000"/><a:ext cx="${coverTextWidth}" cy="600000"/></a:xfrm></p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="1600"><a:solidFill><a:srgbClr val="E5A000"/></a:solidFill></a:rPr><a:t>MathLab Aulas Visuais — Material Didático Estruturado</a:t></a:r></a:p></p:txBody>
    </p:sp>
    ${avatarPicXml}
  </p:spTree></p:cSld>
</p:sld>`;
  addSlide(1, coverXml);

  blocks.forEach((blk, idx) => {
    const num = idx + 2;
    const latexNote = blk.latex
      ? `<p:sp>
      <p:nvSpPr><p:cNvPr id="6" name="LatexNote"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="457200" y="6100000"/><a:ext cx="8229600" cy="450000"/></a:xfrm></p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="1200" i="1"><a:solidFill><a:srgbClr val="1E3A5F"/></a:solidFill></a:rPr><a:t>Expressão: $$${escapeXml(blk.latex)}$$</a:t></a:r></a:p></p:txBody>
    </p:sp>`
      : '';

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr/>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="2" name="HeaderBar"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="1050000"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="0A2540"/></a:solidFill>
      </p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
    </p:sp>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="3" name="GoldStripe"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="0" y="1050000"/><a:ext cx="9144000" cy="55000"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="E5A000"/></a:solidFill>
      </p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
    </p:sp>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="4" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="457200" y="200000"/><a:ext cx="8229600" cy="700000"/></a:xfrm></p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="pt-BR" sz="2400" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>${escapeXml(blk.title || '')}</a:t></a:r></a:p></p:txBody>
    </p:sp>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="5" name="Body"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="457200" y="1300000"/><a:ext cx="8229600" cy="4650000"/></a:xfrm></p:spPr>
      <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${buildPptxParagraphsXml(blk.body)}</p:txBody>
    </p:sp>
    ${latexNote}
  </p:spTree></p:cSld>
</p:sld>`;
    addSlide(num, slideXml);
  });

  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>${slideIds.join('')}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
</p:presentation>`;

  const presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slideRels.join('')}</Relationships>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${avatar ? '<Default Extension="png" ContentType="image/png"/>' : ''}
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${contentTypeOverrides.join('')}
</Types>`;

  const avatarEntries = avatar
    ? [
        {
          name: 'ppt/slides/_rels/slide1.xml.rels',
          data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdAvatar" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/avatar.png"/></Relationships>`
        },
        { name: 'ppt/media/avatar.png', data: avatar.buffer }
      ]
    : [];

  return buildZipArchive([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'ppt/presentation.xml', data: presentationXml },
    { name: 'ppt/_rels/presentation.xml.rels', data: presRels },
    ...slideEntries,
    ...avatarEntries
  ]);
}

/**
 * Gera e verifica arquivo exportado no diretório exportsDir.
 */
export async function exportMaterialToFile({
  material,
  format = 'html',
  exportsDir,
  baseFilename = 'aula_mathlab',
  skipCompletenessCheck = false,
  avatarId = null
}) {
  if (!skipCompletenessCheck) {
    const completeness = validateMaterialCompleteness(material);
    if (!completeness.complete) {
      const details = [
        completeness.missingSections.length ? `Seções pendentes: ${completeness.missingSections.join(', ')}` : '',
        completeness.genericBlocks.length ? `Blocos genéricos: ${completeness.genericBlocks.join(', ')}` : ''
      ]
        .filter(Boolean)
        .join(' | ');
      const err = new Error(`Exportação bloqueada pela validação de completude: ${details}`);
      err.statusCode = 422;
      err.completeness = completeness;
      throw err;
    }
  }

  // Avatar do catálogo (opcional). Se o id for inválido ou a imagem não estiver aprovada, a exportação falha com motivo claro.
  const avatar = avatarId ? await loadAvatarForExport(avatarId) : null;

  await fs.mkdir(exportsDir, { recursive: true });
  const safeBase = String(baseFilename || 'aula_mathlab').replace(/[^a-zA-Z0-9_-]/g, '_');
  const ext = String(format || 'html').toLowerCase();

  let filename;
  let contentBuffer;
  let mimeType;

  if (ext === 'md' || ext === 'markdown') {
    filename = `${safeBase}.md`;
    contentBuffer = Buffer.from(renderMaterialMarkdown(material), 'utf8');
    mimeType = 'text/markdown; charset=utf-8';
  } else if (ext === 'docx') {
    filename = `${safeBase}.docx`;
    contentBuffer = buildDocxBuffer(material, { avatar });
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (ext === 'pptx') {
    filename = `${safeBase}.pptx`;
    contentBuffer = buildPptxBuffer(material, { avatar });
    mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  } else if (ext === 'svg') {
    const svgBlock = (material.blocks || []).find((b) => b.svg);
    if (!svgBlock) {
      throw new Error('O material não possui diagrama SVG para exportação.');
    }
    filename = `${safeBase}.svg`;
    contentBuffer = Buffer.from(svgBlock.svg, 'utf8');
    mimeType = 'image/svg+xml; charset=utf-8';
  } else {
    filename = `${safeBase}.html`;
    contentBuffer = Buffer.from(renderMaterialHtml(material, { avatar }), 'utf8');
    mimeType = 'text/html; charset=utf-8';
  }

  const outPath = path.resolve(exportsDir, filename);
  await fs.writeFile(outPath, contentBuffer);
  const stat = await fs.stat(outPath);

  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`Falha na verificação do arquivo exportado: ${outPath}`);
  }

  return {
    verified: true,
    format: ext,
    filename,
    filePath: outPath,
    sizeBytes: stat.size,
    mimeType,
    buffer: contentBuffer
  };
}
