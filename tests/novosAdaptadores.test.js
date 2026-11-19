import test from 'node:test';
import assert from 'node:assert/strict';

import { interpretNaturalRequest } from '../src/core/requestInterpreter.js';
import { runAuthoringWorkflow } from '../src/core/workflowOrchestrator.js';
import { auditLessonMaterial } from '../src/core/qualityEngine.js';
import { SKELETON_MARK } from '../src/core/productionProfiles.js';
import { getAdapterById, listAdapters, validateAdapter, GROUPS } from '../src/adapters/disciplineAdapters.js';
import { selectAvatar } from '../src/avatars/avatarCatalog.js';

const ctx = (text) => interpretNaturalRequest(text).knowledgeContext;
const natureIds = (c) => c.epistemicNatures.map((n) => n.id);

const PEDIDOS = {
  historia: 'Aula sobre a Revolução Francesa para o 8º ano',
  brasil: 'Aula sobre a escravidão no Brasil Colônia para o 7º ano',
  teologia: 'Estudo bíblico sobre o Evangelho de João e a tradição cristã',
  religiao: 'Aula de Ensino Religioso sobre as tradições religiosas brasileiras',
  musica: 'Apostila de teoria musical sobre escalas maiores e intervalos',
  ritmo: 'Material sobre figuras musicais, compasso e semínima',
  biologia: 'Aula sobre mitose e meiose para o 1º ano do Ensino Médio'
};

async function materialCom(pedido, texto) {
  const wf = await runAuthoringWorkflow({ promptText: pedido });
  const m = structuredClone(wf.material);
  let colocou = false;
  for (const b of m.blocks) {
    if (b.body.includes(SKELETON_MARK)) {
      b.body = `Texto autoral desenvolvido para a seção "${b.title}", com fontes identificadas e nível de acesso declarado.${colocou ? '' : ` ${texto}`}`;
      colocou = true;
    }
  }
  if (!colocou) m.blocks.push({ id: 'b_teste', title: 'Desenvolvimento', body: `Texto autoral com fontes identificadas. ${texto}` });
  const audit = () => auditLessonMaterial(m, { scientific: wf.scientific, didactic: wf.didactic, knowledgeContext: wf.interpreted.knowledgeContext });
  return { audit };
}
const regra = (a, id) => [...a.hardFails, ...a.softWarnings].find((f) => f.ruleId === id);

test('novos adaptadores são válidos, têm cautelas e nenhum traz autor ou obra declarados', () => {
  for (const id of ['historia', 'teologia', 'teoria_musical']) {
    const a = getAdapterById(id);
    assert.ok(a, id);
    assert.deepEqual(validateAdapter(a), [], id);
    assert.ok(a.cautions.length >= 3 && a.limits.length >= 1, id);
    assert.deepEqual(a.keyAuthors, [], `${id} não pode declarar autores sem verificação`);
  }
  assert.ok(listAdapters().length >= 15);
  assert.equal(getAdapterById('teoria_musical').group, GROUPS.ARTES);
});

test('detecção: História, Teologia e Teoria Musical são reconhecidas pela própria área', () => {
  assert.equal(ctx(PEDIDOS.historia).area, 'História');
  assert.deepEqual(natureIds(ctx(PEDIDOS.historia))[0], 'historico');
  assert.equal(ctx(PEDIDOS.brasil).area, 'História');
  assert.equal(ctx(PEDIDOS.brasil).subarea, 'História do Brasil');
  assert.equal(ctx(PEDIDOS.teologia).area, 'Teologia e Ciências da Religião');
  assert.equal(natureIds(ctx(PEDIDOS.teologia))[0], 'teologico');
  assert.equal(ctx(PEDIDOS.religiao).area, 'Teologia e Ciências da Religião');
  assert.equal(ctx(PEDIDOS.musica).area, 'Teoria Musical');
  assert.equal(ctx(PEDIDOS.ritmo).subarea, 'Ritmo e compasso');
});

test('regressão: as áreas antigas continuam sendo reconhecidas como antes', () => {
  assert.equal(ctx('Apostila sobre função quadrática para o 9º ano').area, 'Matemática');
  assert.equal(ctx('Material sobre movimento uniforme para o Ensino Médio').area, 'Física');
  assert.equal(ctx('Estudo comparativo sobre racionalismo e empirismo').area, 'Filosofia');
  assert.equal(ctx(PEDIDOS.biologia).area, 'Biologia');
  assert.equal(ctx(PEDIDOS.biologia).subarea, 'Citologia');
});

test('Teologia exige pesquisa externa e traz a nota de distinção entre fé, história e filosofia', () => {
  const c = ctx(PEDIDOS.teologia);
  assert.equal(c.needsExternalResearch, true);
  assert.ok(c.natureRelations.some((n) => /afirmação de fé|doutrina confessional/i.test(n)));
});

test('regras de História: causa única, termo e datas viram advertência com evidência e não bloqueiam', async () => {
  const { audit } = await materialCom(PEDIDOS.brasil, 'A única causa da abolição foi a pressão inglesa. A Lei Áurea foi assinada em 1871 e os escravos foram libertados.');
  const a = audit();
  for (const id of ['HIS_CAUSA_UNICA', 'HIS_ESCRAVOS_TERMO', 'HIS_DATA_LEI_AUREA']) {
    const f = a.softWarnings.find((w) => w.ruleId === id);
    assert.ok(f, id);
    assert.ok(f.evidence && f.recommendedFix, id);
  }
  assert.equal(a.hardFails.some((h) => /^HIS_/.test(h.ruleId)), false);
});

test('regras de História: a ressalva certa suprime a advertência', async () => {
  const { audit } = await materialCom(
    PEDIDOS.brasil,
    'Uma das causas da abolição foi a pressão inglesa. A Lei Áurea foi assinada em 1888 e as pessoas escravizadas foram libertadas. A expressão "descobrimento do Brasil" é discutida pela historiografia.'
  );
  const a = audit();
  for (const id of ['HIS_CAUSA_UNICA', 'HIS_ESCRAVOS_TERMO', 'HIS_DATA_LEI_AUREA', 'HIS_DESCOBRIMENTO_DO_BRASIL']) assert.equal(regra(a, id), undefined, id);
});

test('regras de Teologia: consenso e citação sem referência; com ressalva ou versículo não disparam', async () => {
  const ruim = await materialCom(PEDIDOS.teologia, 'Todas as religiões ensinam a mesma coisa. A Bíblia diz que devemos amar.');
  const a = ruim.audit();
  assert.ok(regra(a, 'TEO_DOUTRINA_COMO_CONSENSO'));
  assert.ok(regra(a, 'TEO_CITACAO_SEM_REFERENCIA'));
  const bom = await materialCom(PEDIDOS.teologia, 'Segundo a tradição cristã, a Bíblia diz que se deve amar o próximo (Mateus 22:39, tradução indicada na bibliografia).');
  const b = bom.audit();
  assert.equal(regra(b, 'TEO_DOUTRINA_COMO_CONSENSO'), undefined);
  assert.equal(regra(b, 'TEO_CITACAO_SEM_REFERENCIA'), undefined);
});

test('regras de Teoria Musical: tom/semitom incorreto bloqueia; valor sem compasso é advertência; 4/4 libera', async () => {
  const erro = await materialCom(PEDIDOS.musica, 'Um tom equivale a um semitom, e a música é uma linguagem universal.');
  const a = erro.audit();
  const hard = a.hardFails.find((h) => h.ruleId === 'MUS_TOM_SEMITOM');
  assert.ok(hard);
  assert.ok(regra(a, 'MUS_LINGUAGEM_UNIVERSAL'));
  const valor = await materialCom(PEDIDOS.musica, 'A semínima vale um tempo.');
  assert.ok(regra(valor.audit(), 'MUS_VALOR_SEM_COMPASSO'));
  const ok = await materialCom(PEDIDOS.musica, 'No compasso 4/4, a semínima vale um tempo. Um tom equivale a dois semitons.');
  const c = ok.audit();
  assert.equal(regra(c, 'MUS_VALOR_SEM_COMPASSO'), undefined);
  assert.equal(regra(c, 'MUS_TOM_SEMITOM'), undefined);
});

test('regras de Biologia: teleologia e herança de adquiridas são advertências; Lamarck como contexto não dispara', async () => {
  const ruim = await materialCom(PEDIDOS.biologia, 'O animal precisou se adaptar ao frio. As características adquiridas são herdadas pelos filhos.');
  const a = ruim.audit();
  assert.ok(regra(a, 'BIO_TELEOLOGIA_EVOLUTIVA'));
  assert.ok(regra(a, 'BIO_CARACTERISTICAS_ADQUIRIDAS'));
  assert.equal(a.hardFails.some((h) => /^BIO_/.test(h.ruleId)), false);
  const bom = await materialCom(PEDIDOS.biologia, 'Lamarck propunha que as características adquiridas são herdadas, ideia hoje refutada pela genética.');
  assert.equal(regra(bom.audit(), 'BIO_CARACTERISTICAS_ADQUIRIDAS'), undefined);
});

test('isolamento: regras de uma área nova não vazam para Matemática', async () => {
  const { audit } = await materialCom('Apostila sobre função quadrática para o 9º ano', 'Um tom equivale a um semitom. A única causa foi a pressão inglesa. Todas as religiões ensinam a mesma coisa.');
  const a = audit();
  for (const id of ['MUS_TOM_SEMITOM', 'HIS_CAUSA_UNICA', 'TEO_DOUTRINA_COMO_CONSENSO']) assert.equal(regra(a, id), undefined, id);
});

test('avatar: as áreas novas têm pose indicada', () => {
  for (const area of ['História', 'Teologia e Ciências da Religião', 'Teoria Musical']) {
    const s = selectAvatar({ knowledgeContext: { area }, purpose: 'secao' });
    assert.ok(s.primary && /área/.test(s.reason), area);
  }
});

// ===== Fase 6: Geografia e Língua Portuguesa =====
const PEDIDOS6 = {
  mapas: 'Aula sobre mapas, escala cartográfica e coordenadas geográficas para o 6º ano',
  relevo: 'Apostila sobre relevo, bacias hidrográficas e biomas do Brasil',
  urbano: 'Aula sobre urbanização, migração e densidade demográfica nas regiões do Brasil',
  gramatica: 'Aula de Língua Portuguesa sobre concordância verbal e pontuação para o 9º ano',
  texto: 'Oficina de produção textual sobre texto dissertativo-argumentativo, coesão e coerência',
  variacao: 'Aula sobre variação linguística e norma culta'
};

test('fase 6: adaptadores novos são válidos, sem autores declarados, e a natureza linguística existe', () => {
  for (const id of ['geografia', 'lingua_portuguesa']) {
    const a = getAdapterById(id);
    assert.ok(a, id);
    assert.deepEqual(validateAdapter(a), [], id);
    assert.ok(a.cautions.length >= 3 && a.limits.length >= 1, id);
    assert.deepEqual(a.keyAuthors, [], id);
  }
  assert.equal(getAdapterById('lingua_portuguesa').group, GROUPS.LINGUAGENS);
  assert.ok(listAdapters().length >= 17);
});

test('fase 6: detecção de Geografia e Língua Portuguesa com subárea', () => {
  assert.equal(ctx(PEDIDOS6.mapas).area, 'Geografia');
  assert.equal(ctx(PEDIDOS6.mapas).subarea, 'Cartografia');
  assert.equal(ctx(PEDIDOS6.relevo).area, 'Geografia');
  assert.equal(ctx(PEDIDOS6.relevo).subarea, 'Geografia física');
  assert.equal(ctx(PEDIDOS6.urbano).area, 'Geografia');
  assert.equal(ctx(PEDIDOS6.urbano).subarea, 'Geografia humana e econômica');
  assert.equal(ctx(PEDIDOS6.gramatica).area, 'Língua Portuguesa');
  assert.equal(ctx(PEDIDOS6.gramatica).subarea, 'Gramática e análise linguística');
  assert.equal(ctx(PEDIDOS6.texto).area, 'Língua Portuguesa');
  assert.equal(ctx(PEDIDOS6.texto).subarea, 'Leitura e produção de texto');
  assert.equal(ctx(PEDIDOS6.variacao).area, 'Língua Portuguesa');
  assert.equal(natureIds(ctx(PEDIDOS6.gramatica))[0], 'linguistico');
  assert.equal(natureIds(ctx(PEDIDOS6.mapas))[0], 'empirico');
});

test('fase 6: regressão, áreas vizinhas não foram roubadas pelas novas', () => {
  assert.equal(ctx('Aula sobre ecossistemas, cadeia alimentar e fotossíntese').area, 'Biologia');
  assert.equal(ctx('Aula sobre a Revolução Industrial e o Brasil Império').area, 'História');
  assert.equal(ctx('Apostila sobre função quadrática para o 9º ano').area, 'Matemática');
  assert.equal(ctx('Aula sobre leis de Newton e movimento').area, 'Física');
  assert.equal(ctx('Estudo sobre Nietzsche e o niilismo').area, 'Filosofia');
});

test('fase 6: Geografia, capital errada bloqueia; ressalva histórica libera; tempo/clima e projeção são advertências', async () => {
  const ruim = await materialCom(PEDIDOS6.mapas, 'A capital do Brasil é o Rio de Janeiro. O clima hoje está chuvoso. A projeção de Mercator mostra o mundo.');
  const a = ruim.audit();
  assert.ok(a.hardFails.find((h) => h.ruleId === 'GEO_CAPITAL_DO_BRASIL'));
  assert.ok(regra(a, 'GEO_TEMPO_CLIMA'));
  assert.ok(regra(a, 'GEO_PROJECAO_SEM_DISTORCAO'));
  const bom = await materialCom(PEDIDOS6.mapas, 'A capital do Brasil é Brasília. O Rio de Janeiro já foi a capital até 1960. A projeção de Mercator preserva ângulos e distorce áreas.');
  const b = bom.audit();
  for (const id of ['GEO_CAPITAL_DO_BRASIL', 'GEO_PROJECAO_SEM_DISTORCAO']) assert.equal(regra(b, id), undefined, id);
});

test('fase 6: Língua Portuguesa, "falar errado" e "haviam" avisam; ressalva libera; "haviam chegado" não dispara', async () => {
  const ruim = await materialCom(PEDIDOS6.gramatica, 'Quem fala assim fala errado. Haviam muitos alunos na sala.');
  const a = ruim.audit();
  assert.ok(regra(a, 'PORT_ERRO_LINGUISTICO'));
  assert.ok(regra(a, 'PORT_HAVIAM'));
  assert.equal(a.hardFails.some((h) => /^PORT_/.test(h.ruleId)), false);
  const bom = await materialCom(PEDIDOS6.gramatica, 'Os alunos haviam chegado cedo. Não existe falar errado: há adequação à situação comunicativa.');
  const b = bom.audit();
  assert.equal(regra(b, 'PORT_ERRO_LINGUISTICO'), undefined);
  assert.equal(regra(b, 'PORT_HAVIAM'), undefined);
});

test('fase 6: regras novas não vazam para Matemática', async () => {
  const { audit } = await materialCom('Apostila sobre função quadrática para o 9º ano', 'A capital do Brasil é Salvador. Haviam muitos alunos. Falar errado.');
  const a = audit();
  for (const id of ['GEO_CAPITAL_DO_BRASIL', 'PORT_HAVIAM', 'PORT_ERRO_LINGUISTICO']) assert.equal(regra(a, id), undefined, id);
});

test('fase 6: avatar tem pose para as áreas novas', () => {
  for (const area of ['Geografia', 'Língua Portuguesa']) {
    const s = selectAvatar({ knowledgeContext: { area }, purpose: 'secao' });
    assert.ok(s.primary && /área/.test(s.reason), area);
  }
});
