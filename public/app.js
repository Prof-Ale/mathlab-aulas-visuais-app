/**
 * MathLab Aulas Visuais v1.0.0 - Frontend Application
 */

const state = {
  projects: [],
  activeProjectId: null,
  activeMaterialId: null,
  activeWorkflow: null,
  currentMaterial: null,
  inventory: null,
  providers: null,
  catalog: null,
  avatars: null,
  avatarChoice: { enabled: false, id: null },
  creatorTarget: '__NEW__'
};

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let alertTimer = null;
function showAlert(msg, isError = false, kind = null) {
  const el = document.getElementById('globalAlert');
  const level = kind || (isError ? 'error' : 'ok');
  clearTimeout(alertTimer);
  el.className = `alert-banner ${level === 'error' ? 'alert-error' : level === 'warn' ? 'alert-warn' : 'alert-ok'}`;
  el.setAttribute('role', level === 'error' ? 'alert' : 'status');
  el.innerHTML = `<span>${esc(msg)}</span><button type="button" class="alert-close" aria-label="Fechar aviso">Fechar</button>`;
  el.style.display = 'flex';
  el.querySelector('.alert-close').addEventListener('click', () => { el.style.display = 'none'; });
  if (level !== 'error') alertTimer = setTimeout(() => { el.style.display = 'none'; }, 9000);
}

function switchView(viewName) {
  document.querySelectorAll('.nav-btn').forEach((b) => {
    const on = b.dataset.view === viewName;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `view-${viewName}`);
  });
  if (viewName === 'export') renderAvatarPanel();
  window.scrollTo({ top: 0 });
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function loadInitialData() {
  try {
    const [health, prjData, invData, catalog] = await Promise.all([
      api('/api/health'),
      api('/api/projects'),
      api('/api/knowledge/inventory'),
      api('/api/knowledge/catalog').catch(() => null)
    ]);
    state.catalog = catalog;
    state.providers = health.providers;
    state.projects = prjData.projects || [];
    state.inventory = invData;
    if (state.projects.length > 0 && !state.activeProjectId) {
      state.activeProjectId = state.projects[0].id;
    }
  } catch (err) {
    showAlert(`Erro ao carregar dados iniciais: ${err.message}`, true);
  }
  renderAll();
}

function renderDashboard() {
  const kpis = document.getElementById('dashKpis');
  const totalMaterials = state.projects.reduce((acc, p) => acc + (p.materials?.length || 0), 0);
  const invCount = state.inventory?.availableCount ?? 0;

  kpis.innerHTML = `
    <div class="card"><div class="muted">Projetos Ativos</div><div style="font-size:1.7rem;font-weight:800;color:var(--ml-navy);">${state.projects.filter((p) => !p.archived).length}</div></div>
    <div class="card"><div class="muted">Materiais Produzidos</div><div style="font-size:1.7rem;font-weight:800;color:var(--ml-navy);">${totalMaterials}</div></div>
    <div class="card"><div class="muted">Módulos Intelectuais (M01–M05)</div><div style="font-size:1.7rem;font-weight:800;color:var(--ml-navy);">${invCount} / ${state.inventory?.totalCatalogEntries ?? 10}</div></div>
  `;

  const recentBox = document.getElementById('dashRecentProjects');
  recentBox.innerHTML = state.projects.length
    ? state.projects
        .slice(0, 5)
        .map(
          (p) => `<div style="border-bottom:1px solid #E2E8F0;padding:8px 0;display:flex;justify-content:space-between;align-items:center;">
            <div><strong>${esc(p.title)}</strong> <span class="badge">${esc(p.discipline)}</span><br/><span class="muted">${p.materials?.length || 0} material(is)</span></div>
            <button class="btn btn-secondary" data-open-project="${esc(p.id)}">Abrir</button>
          </div>`
        )
        .join('')
    : '<p class="muted">Nenhum projeto criado ainda. Clique em "+ Criar Novo Material" ou "+ Novo Projeto".</p>';

  recentBox.querySelectorAll('[data-open-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeProjectId = btn.dataset.openProject;
      switchView('projects');
      renderProjects();
    });
  });

  const statusBox = document.getElementById('dashSystemStatus');
  const gem = state.providers?.gemini;
  statusBox.innerHTML = `
    <div><strong>Modo Offline Estruturado:</strong> <span class="badge badge-ok">Operacional</span></div>
    <div style="margin-top:6px;"><strong>Gemini API:</strong> <span class="badge ${gem?.configured ? 'badge-ok' : 'badge-warn'}">${esc(gem?.statusLabel || 'Não verificado')}</span></div>
    <div style="margin-top:6px;"><strong>OpenAI API:</strong> <span class="badge">Desativado (preparado)</span></div>
  `;
}

function renderCreatorSelectors() {
  const sel = document.getElementById('selectTargetProject');
  const wanted = state.creatorTarget;
  sel.innerHTML = `<option value="__NEW__">Criar um projeto novo para este material</option>` +
    state.projects
      .filter((p) => !p.archived)
      .map((p) => `<option value="${esc(p.id)}">${esc(p.title)}</option>`)
      .join('');
  sel.value = [...sel.options].some((o) => o.value === wanted) ? wanted : '__NEW__';
}

function renderProjects() {
  const box = document.getElementById('projectsListBox');
  if (!state.projects.length) {
    box.innerHTML = '<p class="muted">Nenhum projeto salvo ainda.</p>';
    return;
  }

  box.innerHTML = state.projects
    .map((p) => {
      const matsHtml = (p.materials || []).length
        ? p.materials
            .map(
              (m) => `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:8px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                  <strong>${esc(m.title)}</strong> <span class="badge">${esc(m.workflowMode)}</span>
                  <span class="badge ${auditStatusInfo(m.audit?.status)[0]}">${esc(auditStatusInfo(m.audit?.status)[1])}</span>
                  <br/><span class="muted">Versões: ${m.versions?.length || 1} | Modo: ${esc(m.productionMode)}</span>
                </div>
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-secondary" data-edit-mat="${esc(p.id)}::${esc(m.id)}">Editar / Exportar</button>
                </div>
              </div>`
            )
            .join('')
        : '<p class="muted" style="margin:6px 0 0;">Sem materiais salvos neste projeto.</p>';

      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <strong style="font-size:1.05rem;color:var(--ml-navy);">${esc(p.title)}</strong>
            <span class="badge">${esc(p.discipline)}</span>
            ${p.archived ? '<span class="badge badge-warn">Arquivado</span>' : ''}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-secondary" data-dup-prj="${esc(p.id)}">Duplicar</button>
            <button class="btn btn-secondary" data-arch-prj="${esc(p.id)}">${p.archived ? 'Desarquivar' : 'Arquivar'}</button>
            <button class="btn btn-danger" data-del-prj="${esc(p.id)}">Excluir</button>
          </div>
        </div>
        ${matsHtml}
      </div>`;
    })
    .join('');

  box.querySelectorAll('[data-dup-prj]').forEach((b) =>
    b.addEventListener('click', async () => {
      await api(`/api/projects/${b.dataset.dupPrj}/duplicate`, { method: 'POST' });
      await loadInitialData();
      showAlert('Projeto duplicado.');
    })
  );
  box.querySelectorAll('[data-arch-prj]').forEach((b) =>
    b.addEventListener('click', async () => {
      const prj = state.projects.find((x) => x.id === b.dataset.archPrj);
      await api(`/api/projects/${prj.id}`, { method: 'PUT', body: JSON.stringify({ archived: !prj.archived }) });
      await loadInitialData();
    })
  );
  box.querySelectorAll('[data-del-prj]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm('Confirma a exclusão permanente deste projeto e de seus materiais?')) return;
      await api(`/api/projects/${b.dataset.delPrj}`, { method: 'DELETE' });
      await loadInitialData();
      showAlert('Projeto excluído.');
    })
  );
  box.querySelectorAll('[data-edit-mat]').forEach((b) =>
    b.addEventListener('click', () => {
      const [pid, mid] = b.dataset.editMat.split('::');
      const prj = state.projects.find((x) => x.id === pid);
      const mat = prj?.materials?.find((x) => x.id === mid);
      if (!mat) return;
      state.activeProjectId = pid;
      state.activeMaterialId = mid;
      state.currentMaterial = structuredClone(mat.currentMaterial);
      state.activeWorkflow = {
        scientific: mat.scientific,
        didactic: mat.didactic,
        pedagogical: mat.pedagogical,
        audit: mat.audit,
        interpreted: mat.interpreted || null,
        originalGeneratedMaterial: mat.originalGeneratedMaterial || null,
        material: state.currentMaterial
      };
      renderEditor();
      renderResearch();
      renderAudit();
      renderExportPreview();
      document.getElementById('workflowStagesBox').style.display = 'none';
      if (!mat.interpreted) showAlert('Este material foi criado antes do contexto de conhecimento ser guardado. Para ver e corrigir a área, gere-o de novo na aba Criar Material.', false, 'warn');
      switchView('editor');
    })
  );
}

function renderResearch() {
  const box = document.getElementById('researchBox');
  const sci = state.activeWorkflow?.scientific;
  const searchPanelHtml = `
    <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:8px;padding:12px;margin-bottom:14px;">
      <strong>Consulta Científica Real (Crossref & OpenAlex — M01)</strong>
      <p class="muted" style="margin:4px 0 8px 0;">Busca metadados e resumos reais sem inventar DOIs ou declarar acesso integral sem leitura completa.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <label for="inputResearchQuery" class="sr-only">Termo de busca científica</label>
        <input id="inputResearchQuery" type="text" placeholder="Ex.: Teorema de Pitágoras ensino médio" style="flex:1;min-width:220px;" />
        <label for="selectResearchSource" class="sr-only">Fonte da busca</label>
        <select id="selectResearchSource" style="width:auto;">
          <option value="all">Crossref + OpenAlex</option>
          <option value="crossref">Somente Crossref</option>
          <option value="openalex">Somente OpenAlex</option>
        </select>
        <button id="btnSearchResearch" class="btn btn-primary" type="button">Buscar Fontes</button>
      </div>
      <label class="check-row" style="margin-top:8px;font-size:0.9rem;" for="chkAuthorizeResearch">
        <input id="chkAuthorizeResearch" type="checkbox" />
        Autorizo consulta externa às APIs públicas Crossref / OpenAlex nesta sessão.
      </label>
      <div id="researchSearchResults" style="margin-top:10px;"></div>
    </div>
  `;

  if (!sci) {
    box.innerHTML = `${searchPanelHtml}<p class="muted">Gere ou abra um material para visualizar e complementar as fontes científicas (M01).</p>`;
  } else {
    box.innerHTML = `
      ${searchPanelHtml}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <p style="margin:0;"><strong>Módulo:</strong> ${esc(sci.moduleRef)}</p>
        <button id="btnReprocessResearchStage" class="btn btn-secondary" type="button">Reprocessar Pesquisa M01</button>
      </div>
      ${sci.references
        .map(
          (r) => `<div style="border-bottom:1px solid #E2E8F0;padding:8px 0;">
            <strong>${esc(r.author)} (${esc(r.year)})</strong> — <em>${esc(r.title)}</em>${r.doi ? ` — <code>DOI: ${esc(r.doi)}</code>` : ''}<br/>
            <span class="badge">${esc(r.evidenceType)}</span> <span class="badge badge-warn">Acesso: ${esc(r.accessState)}</span>
          </div>`
        )
        .join('')}
      <div style="margin-top:12px;">
        <strong>Limitações Documentais:</strong>
        <ul>${(sci.documentaryLimitations || []).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      </div>
    `;
  }

  document.getElementById('btnSearchResearch')?.addEventListener('click', async () => {
    const query = document.getElementById('inputResearchQuery')?.value?.trim() || '';
    const source = document.getElementById('selectResearchSource')?.value || 'all';
    const authorized = document.getElementById('chkAuthorizeResearch')?.checked === true;
    const resultsEl = document.getElementById('researchSearchResults');
    if (!query) {
      showAlert('Informe um termo de busca científica.', true);
      return;
    }
    try {
      const data = await api('/api/research/search', {
        method: 'POST',
        body: JSON.stringify({ query, source, rows: 4, authorized })
      });
      const items = data.results || [];
      if (!items.length) {
        resultsEl.innerHTML = '<p class="muted">Nenhum resultado encontrado para esta consulta.</p>';
        return;
      }
      resultsEl.innerHTML = items
        .map(
          (item, idx) => `<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;padding:8px;margin-top:6px;">
            <strong>${esc(item.author)} (${esc(item.year)})</strong> — <em>${esc(item.title)}</em><br/>
            <span class="badge">${esc(item.provider)}</span>
            <span class="badge badge-warn">Acesso: ${esc(item.accessState)}</span>
            ${item.doi ? `<code style="margin-left:6px;">DOI: ${esc(item.doi)}</code>` : ''}
            ${state.activeWorkflow ? `<div style="margin-top:6px;"><button class="btn btn-secondary" data-attach-ref="${idx}" type="button">Anexar à aula e reprocessar M01</button></div>` : ''}
          </div>`
        )
        .join('');

      resultsEl.querySelectorAll('[data-attach-ref]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const picked = items[Number(btn.dataset.attachRef)];
          if (!picked || !state.activeWorkflow) return;
          const currentCustom = state.activeWorkflow.scientific?.customSources || [];
          const nextCustom = [...currentCustom, picked];
          const resp = await api('/api/workflow/reprocess-stage', {
            method: 'POST',
            body: JSON.stringify({
              workflow: state.activeWorkflow,
              stageName: 'research',
              customSources: nextCustom
            })
          });
          state.activeWorkflow = resp.workflow;
          renderResearch();
          renderAudit();
          showAlert('Fonte anexada e etapa de Pesquisa (M01) reprocessada.');
        });
      });
    } catch (err) {
      resultsEl.innerHTML = `<div class="alert-banner alert-error">${esc(err.message)}</div>`;
    }
  });

  document.getElementById('btnReprocessResearchStage')?.addEventListener('click', async () => {
    if (!state.activeWorkflow) return;
    const resp = await api('/api/workflow/reprocess-stage', {
      method: 'POST',
      body: JSON.stringify({
        workflow: state.activeWorkflow,
        stageName: 'research',
        customSources: state.activeWorkflow.scientific?.references?.filter((r) => r.origin === 'custom') || []
      })
    });
    state.activeWorkflow = resp.workflow;
    renderResearch();
    renderAudit();
    showAlert('Etapa de Pesquisa (M01) reprocessada.');
  });
}


// ===== Rótulos em linguagem simples =====
const STAGE_LABELS = {
  '1_Interpretacao': 'Entender o pedido',
  '2_3_Planejamento_e_Pesquisa_M01': 'Planejar e reunir fontes (M01)',
  '4_Engenharia_Didatica_M02_M03': 'Engenharia didática (M02 e M03)',
  '5_Producao_Editorial_M04': 'Montar o documento (M04)',
  '6_Auditoria_Qualidade_M05': 'Auditar a qualidade (M05)',
  IMPORTACAO_MANUAL_LLM: 'Importar resposta da LLM'
};
const STAGE_STATUS = {
  CONCLUIDA: ['ok', 'Concluída'],
  NAO_APLICAVEL: ['na', 'Não se aplica a este tipo de documento'],
  REPROVADA_PENDENTE: ['warn', 'Concluída, com pendências a resolver'],
  SEM_EFEITO: ['warn', 'Sem efeito']
};
const ORIGIN_LABELS = {
  usuario: ['ok', 'corrigido por você'],
  automatica: ['', 'identificado automaticamente'],
  regra_legada: ['warn', 'palpite, confirme'],
  padrao_do_modo: ['', 'padrão do modo']
};
const AUDIT_STATUS_TEXT = {
  APROVADO: ['badge-ok', 'Aprovado'],
  REPROVADO_HARD_FAIL: ['badge-err', 'Com pendências graves'],
  APROVADO_COM_RESSALVAS: ['badge-warn', 'Aprovado com ressalvas']
};
function auditStatusInfo(status) {
  return AUDIT_STATUS_TEXT[status] || ['badge-warn', String(status || 'Não auditado').replace(/_/g, ' ').toLowerCase()];
}

function originBadge(key, kc) {
  if (key === 'area' && !kc?.area) return '';
  const o = ORIGIN_LABELS[kc?.fieldSources?.[key]];
  return o ? `<span class="badge ${o[0] ? 'badge-' + o[0] : ''}">${esc(o[1])}</span>` : '';
}

function materialHasHumanEdits() {
  const wf = state.activeWorkflow;
  if (!wf?.originalGeneratedMaterial || !state.currentMaterial) return false;
  return JSON.stringify(wf.originalGeneratedMaterial.blocks) !== JSON.stringify(state.currentMaterial.blocks);
}

// ===== Contexto de conhecimento: mostrar e corrigir =====
function contextPanelHtml(wf, px = 'ctx') {
  const kc = wf?.interpreted?.knowledgeContext;
  if (!kc) return '';
  const cat = state.catalog;
  const natures = (kc.epistemicNatures || []).map((n) => esc(n.label)).join('; ') || 'Não determinada';
  const secondary = (kc.secondaryAreas || []).map((a) => esc(a.area)).join(', ');
  const needsConfirm = kc.needsAreaConfirmation || !kc.area;
  const areaOptions = cat
    ? `<option value="">Deixar o sistema decidir</option>` + cat.areas.map((a) => `<option value="${esc(a.area)}" ${a.area === kc.area ? 'selected' : ''}>${esc(a.area)}</option>`).join('')
    : '';
  const typeOptions = cat
    ? `<option value="">Deixar o sistema decidir</option>` + cat.documentTypes.map((d) => `<option value="${esc(d.id)}" ${d.id === kc.documentType?.id ? 'selected' : ''}>${esc(d.label)}</option>`).join('')
    : '';
  const currentNatureIds = new Set((kc.epistemicNatures || []).map((n) => n.id));
  const natureBoxes = cat
    ? cat.natures.filter((n) => n.id !== 'indeterminado').map((n) => `<label class="check-row"><input type="checkbox" name="ctxNature" value="${esc(n.id)}" ${currentNatureIds.has(n.id) ? 'checked' : ''} /> <span>${esc(n.label)}</span></label>`).join('')
    : '';

  return `<section class="card ctx-panel ${needsConfirm ? 'callout-warn' : ''}" aria-labelledby="${px}Title" data-ctx-panel>
    <h3 id="${px}Title" style="margin:0;color:var(--ml-navy);">Como o sistema entendeu seu pedido</h3>
    ${needsConfirm ? `<div class="callout callout-warn" style="margin-top:8px;">${kc.area ? `<strong>Confirme a área.</strong> Identifiquei ${esc(kc.area)}, mas com confiança média. Se estiver certo, siga em frente; se não, corrija abaixo.` : `<strong>Preciso da sua confirmação.</strong> ${esc(kc.clarificationQuestion || 'Qual é a área de conhecimento deste material?')} Sem isso, a auditoria usa só critérios gerais.`}</div>` : ''}
    <dl class="ctx-grid">
      <div><dt>Área</dt><dd>${esc(kc.area || 'Não identificada')} ${originBadge('area', kc)}</dd></div>
      <div><dt>Subárea</dt><dd>${esc(kc.subarea || 'Não identificada')} ${originBadge('subarea', kc)}</dd></div>
      <div><dt>Tipo de documento</dt><dd>${esc(kc.documentType?.label || 'Não identificado')} ${originBadge('documentType', kc)}</dd></div>
      <div><dt>Natureza do conhecimento</dt><dd>${natures} ${originBadge('epistemicNatures', kc)}</dd></div>
      <div><dt>Exige engenharia didática</dt><dd>${kc.requiresDidacticEngineering === false ? 'Não, não é uma aula' : 'Sim'}</dd></div>
      <div><dt>Pesquisa externa</dt><dd>${kc.needsExternalResearch ? 'Recomendada, só com sua autorização' : 'Não necessária'}</dd></div>
    </dl>
    ${kc.interdisciplinary ? `<p class="muted" style="margin:0 0 8px;">Tema interdisciplinar. Outras áreas consideradas: ${secondary}.</p>` : secondary ? `<p class="muted" style="margin:0 0 8px;">Outras áreas próximas: ${secondary}.</p>` : ''}
    ${cat ? `<details class="ctx-form" ${needsConfirm ? 'open' : ''}>
      <summary><strong>Corrigir o entendimento</strong></summary>
      <div class="grid-2" style="margin-top:8px;">
        <div><label for="${px}Area"><strong>Área</strong></label><select id="${px}Area">${areaOptions}</select></div>
        <div><label for="${px}Subarea"><strong>Subárea</strong></label><select id="${px}Subarea"></select></div>
        <div><label for="${px}DocType"><strong>Tipo de documento</strong></label><select id="${px}DocType">${typeOptions}</select></div>
      </div>
      <fieldset><legend>Natureza do conhecimento (pode marcar mais de uma)</legend>${natureBoxes}</fieldset>
      <p class="muted" style="margin:6px 0;">Ao reaplicar, o sistema gera um novo material com a sua correção. O material atual continua salvo e não é alterado.</p>
      <button type="button" class="btn btn-gold" data-ctx-reapply>Reaplicar com esta correção</button>
    </details>` : '<p class="muted">Catálogo de áreas indisponível. Recarregue a página para corrigir o contexto.</p>'}
  </section>`;
}

function bindContextPanel(root, px = 'ctx') {
  const panel = root.querySelector('[data-ctx-panel]');
  if (!panel || !state.catalog) return;
  const kc = state.activeWorkflow.interpreted.knowledgeContext;
  const areaSel = panel.querySelector(`#${px}Area`);
  const subSel = panel.querySelector(`#${px}Subarea`);
  const fillSubareas = () => {
    const entry = state.catalog.areas.find((a) => a.area === areaSel.value);
    const keep = areaSel.value === kc.area ? kc.subarea : '';
    subSel.innerHTML = `<option value="">Deixar o sistema decidir</option>` +
      (entry?.subareas || []).map((x) => `<option value="${esc(x)}" ${x === keep ? 'selected' : ''}>${esc(x)}</option>`).join('');
  };
  fillSubareas();
  areaSel.addEventListener('change', fillSubareas);

  panel.querySelector('[data-ctx-reapply]').addEventListener('click', async () => {
    const wf = state.activeWorkflow;
    const prompt = wf?.interpreted?.rawRequest || wf?.interpreted?.rawText;
    if (!prompt) return showAlert('Este material não guardou o pedido original, então não dá para reaplicar. Gere de novo na aba Criar Material.', true);
    const base = baseOverridesFrom(wf);
    const next = { ...base };
    // Só vira "correção do usuário" o que o usuário de fato mudou em relação ao que o sistema mostrou.
    const setIf = (key, value, current) => { if (!value) delete next[key]; else if (value !== current || next[key]) next[key] = value; };
    setIf('area', areaSel.value, kc.area);
    setIf('subarea', subSel.value, kc.subarea);
    setIf('documentType', panel.querySelector(`#${px}DocType`).value, kc.documentType?.id);
    const picked = [...panel.querySelectorAll('input[name="ctxNature"]:checked')].map((i) => i.value);
    const currentIds = (kc.epistemicNatures || []).map((n) => n.id).filter((id) => id !== 'indeterminado');
    const same = picked.length === currentIds.length && picked.every((id) => currentIds.includes(id));
    if (!picked.length) delete next.epistemicNatures; else if (!same || next.epistemicNatures) next.epistemicNatures = picked;
    const aviso = materialHasHumanEdits()
      ? 'Você editou este material. Reaplicar cria um material NOVO, sem as suas edições. O atual continua salvo no projeto. Continuar?'
      : 'Reaplicar cria um material novo com a sua correção. O atual continua salvo no projeto. Continuar?';
    if (!confirm(aviso)) return;
    try {
      const res = await api('/api/workflow/run', { method: 'POST', body: JSON.stringify({ promptText: prompt, overrides: next }) });
      res.workflow.contextOverrides = next;
      await adoptWorkflow(res.workflow, { targetProject: state.activeProjectId || '__NEW__' });
      showAlert('Contexto corrigido: gerei um novo material com a sua escolha. O anterior continua no projeto.');
    } catch (err) {
      showAlert(`Não consegui reaplicar a correção: ${err.message}`, true);
    }
  });
}

function baseOverridesFrom(wf) {
  if (wf.contextOverrides) return { ...wf.contextOverrides };
  const kc = wf.interpreted?.knowledgeContext || {};
  const fs = kc.fieldSources || {};
  const out = {};
  if (fs.area === 'usuario' && kc.area) out.area = kc.area;
  if (fs.subarea === 'usuario' && kc.subarea) out.subarea = kc.subarea;
  if (fs.documentType === 'usuario' && kc.documentType?.id) out.documentType = kc.documentType.id;
  if (fs.epistemicNatures === 'usuario') out.epistemicNatures = (kc.epistemicNatures || []).map((n) => n.id);
  return out;
}

// Coloca um fluxo recém-gerado como material ativo, salva no projeto e redesenha tudo.
async function adoptWorkflow(workflow, { targetProject }) {
  state.activeWorkflow = workflow;
  state.currentMaterial = structuredClone(workflow.material);
  let pid = targetProject;
  if (!pid || pid === '__NEW__') {
    const f = workflow.interpreted.fields;
    const created = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: `${f.discipline}: ${f.topic}`.slice(0, 120), discipline: f.discipline, gradeLevel: f.gradeLevel })
    });
    pid = created.project.id;
  }
  state.activeProjectId = pid;
  const saved = await api(`/api/projects/${pid}/materials`, { method: 'POST', body: JSON.stringify({ workflowOutput: workflow }) });
  state.activeMaterialId = saved.material.id;
  const keep = state.activeWorkflow;
  const keepMaterial = state.currentMaterial;
  await loadInitialData();
  state.activeWorkflow = keep;
  state.currentMaterial = keepMaterial;
  renderAll();
  renderCreatorResult();
}

function renderCreatorResult() {
  const box = document.getElementById('workflowStagesBox');
  const wf = state.activeWorkflow;
  if (!wf?.stageLog) { box.style.display = 'none'; return; }
  const audit = wf.audit;
  const [badge, label] = auditStatusInfo(audit?.status);
  const grave = audit?.hardFails?.length || 0;
  const adv = audit?.softWarnings?.length || 0;
  const prog = audit?.progress;
  let verdict;
  if (!audit) verdict = ['callout', 'Material gerado.'];
  else if (grave > 0) verdict = ['callout-warn', `Estrutura gerada, mas ainda não está pronta: ${grave} pendência(s) grave(s)${prog ? ` e ${prog.pendingSections} de ${prog.totalSections} seções em esqueleto` : ''}. Abra o editor para desenvolver o conteúdo, ou use a ponte de copiar e colar com a sua LLM.`];
  else verdict = ['callout-ok', `Material gerado e auditado. ${adv ? `${adv} advertência(s) para revisar.` : 'Sem pendências.'}`];

  box.style.display = 'block';
  box.innerHTML = `
    <div class="callout ${verdict[0]}" role="status"><h3>Resultado</h3><p style="margin:0;">${esc(verdict[1])} <span class="badge ${badge}">${esc(label)}</span></p></div>
    ${contextPanelHtml(wf, 'cr')}
    <h3 style="margin:8px 0 0;color:var(--ml-navy);">O que o sistema fez</h3>
    <ol class="stepper">${wf.stageLog.map((st, i) => {
      const [cls, txt] = STAGE_STATUS[st.status] || ['', String(st.status)];
      return `<li class="step-${cls}"><span class="step-dot" aria-hidden="true">${i + 1}</span><span><strong>${esc(STAGE_LABELS[st.stage] || st.stage)}</strong><br/><span class="muted">${esc(txt)}</span></span></li>`;
    }).join('')}</ol>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="btnGoToEditorNow" class="btn btn-gold" type="button">Abrir no editor</button>
      <button id="btnGoToAuditNow" class="btn btn-secondary" type="button">Ver auditoria</button>
    </div>`;
  box.querySelector('#btnGoToEditorNow').addEventListener('click', () => switchView('editor'));
  box.querySelector('#btnGoToAuditNow').addEventListener('click', () => switchView('audit'));
  bindContextPanel(box, 'cr');
}

function renderEditor() {
  const box = document.getElementById('editorBox');
  const mat = state.currentMaterial;
  if (!mat) {
    box.innerHTML = '<p class="muted">Nenhum material ativo no editor. Gere uma aula na aba "Criar Material" ou abra um material salvo em "Projetos".</p>';
    return;
  }

  const SK = '[ESQUELETO]';
  const total = (mat.blocks || []).length;
  const pending = (mat.blocks || []).filter((b) => String(b.body || '').includes(SK)).length;
  const progressHtml = mat.structureProfile
    ? `<div class="callout ${pending ? 'callout-warn' : 'callout-ok'} no-print"><strong>${total - pending} de ${total} seções desenvolvidas.</strong> ${pending ? 'As seções marcadas como esqueleto precisam de conteúdo com fontes antes da exportação.' : 'Nenhuma seção em esqueleto.'}
      <div class="progress" role="progressbar" aria-label="Seções desenvolvidas" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${total - pending}" style="margin-top:8px;"><span style="width:${total ? Math.round(((total - pending) / total) * 100) : 0}%"></span></div></div>`
    : '';

  const blocksHtml = (mat.blocks || [])
    .map((blk, idx) => {
      const isSk = String(blk.body || '').includes(SK);
      const isAi = blk.contentOrigin === 'IA_EXTERNA_RASCUNHO_A_REVISAR';
      const cls = isSk ? 'block-skeleton' : isAi ? 'block-draft' : '';
      const badges = [
        isSk ? '<span class="badge badge-warn">Esqueleto: falta desenvolver</span>' : '',
        isAi ? '<span class="badge badge-warn">Rascunho de IA: revise e confira as fontes</span>' : '',
        !isSk && !isAi ? '<span class="badge badge-ok">Desenvolvida</span>' : ''
      ].join(' ');
      const n = idx + 1;
      return `
      <div class="block-editor-item ${cls}">
        <div class="block-head">
          <input type="text" data-blk-title="${idx}" value="${esc(blk.title)}" aria-label="Título da seção ${n}" style="font-weight:bold;" />
          <div style="display:flex;gap:4px;" class="no-print">
            <button class="btn btn-secondary" data-blk-up="${idx}" type="button" aria-label="Mover a seção ${n} para cima" ${idx === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-secondary" data-blk-down="${idx}" type="button" aria-label="Mover a seção ${n} para baixo" ${idx === mat.blocks.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn-danger" data-blk-del="${idx}" type="button" aria-label="Remover a seção ${n}">Remover</button>
          </div>
        </div>
        <div class="block-badges">${badges}</div>
        <textarea rows="4" data-blk-body="${idx}" aria-label="Texto da seção ${n}">${esc(blk.body || '')}</textarea>
        ${blk.latex !== undefined ? `<label class="muted" for="blk-latex-${idx}">Equação LaTeX da seção ${n}</label><input id="blk-latex-${idx}" type="text" data-blk-latex="${idx}" value="${esc(blk.latex || '')}" />` : ''}
        ${blk.svg ? `<div style="margin-top:8px;text-align:center;">${blk.svg}</div>` : ''}
      </div>`;
    })
    .join('');

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;" class="no-print">
      <label for="inputMaterialTitle" style="margin:0;"><strong>Título do material</strong></label>
      ${state.activeWorkflow?.interpreted ? '<button id="btnReprocessEditorialStage" class="btn btn-secondary" type="button">Reprocessar Editorial M04</button>' : ''}
    </div>
    <input id="inputMaterialTitle" type="text" value="${esc(mat.title || '')}" style="margin-bottom:14px;font-weight:bold;" />
    ${
      state.activeWorkflow?.interpreted
        ? `<details id="manualLlmPanel" class="card no-print" style="margin-bottom:14px;">
      <summary><strong>Desenvolver o conteúdo com a minha ferramenta de LLM (copiar e colar)</strong></summary>
      <p class="muted" style="margin:8px 0;">Sem API e sem custo: o app monta o prompt, você cola na ferramenta que preferir e traz a resposta de volta. A resposta entra como rascunho a revisar, nunca como fonte, e só preenche seções ainda em esqueleto.</p>
      <button id="btnManualPrompt" class="btn btn-secondary" type="button">1. Gerar prompt para copiar</button>
      <div id="manualPromptBox" style="display:none;margin-top:8px;">
        <label for="manualPromptOut" class="sr-only">Prompt para copiar</label>
        <textarea id="manualPromptOut" rows="7" readonly></textarea>
        <button id="btnCopyManualPrompt" class="btn btn-secondary" type="button" style="margin-top:6px;">Copiar prompt</button>
        <p id="manualExpected" class="muted" style="margin:6px 0 0;"></p>
      </div>
      <label for="manualAnswerIn" style="margin-top:10px;"><strong>2. Resposta da LLM</strong></label>
      <textarea id="manualAnswerIn" rows="8" placeholder="Cole aqui a resposta completa da ferramenta de LLM."></textarea>
      <label for="manualSourceLabel" class="sr-only">Ferramenta usada</label>
      <input id="manualSourceLabel" type="text" placeholder="Ferramenta usada (opcional, fica registrada no histórico)" style="margin-top:6px;" />
      <button id="btnImportManual" class="btn btn-gold" type="button" style="margin-top:6px;">3. Importar resposta como rascunho</button>
    </details>`
        : ''
    }
    ${contextPanelHtml(state.activeWorkflow, 'ed')}
    ${progressHtml}
    ${blocksHtml}
  `;
  bindContextPanel(box, 'ed');

  box.querySelector('#btnManualPrompt')?.addEventListener('click', async () => {
    try {
      const resp = await api('/api/manual/prompt', { method: 'POST', body: JSON.stringify({ workflow: state.activeWorkflow }) });
      box.querySelector('#manualPromptOut').value = resp.prompt;
      box.querySelector('#manualExpected').textContent = `Seções esperadas na resposta: ${resp.expectedSections.join(' | ')}.`;
      box.querySelector('#manualPromptBox').style.display = 'block';
    } catch (err) {
      showAlert(`Não foi possível gerar o prompt: ${err.message}`, true);
    }
  });

  box.querySelector('#btnCopyManualPrompt')?.addEventListener('click', async () => {
    const ta = box.querySelector('#manualPromptOut');
    try {
      await navigator.clipboard.writeText(ta.value);
      showAlert('Prompt copiado.');
    } catch {
      ta.focus();
      ta.select();
      showAlert('Seu navegador não permitiu copiar automaticamente. O texto está selecionado: use Ctrl+C.', true);
    }
  });

  box.querySelector('#btnImportManual')?.addEventListener('click', async () => {
    try {
      const resp = await api('/api/manual/import', {
        method: 'POST',
        body: JSON.stringify({
          workflow: state.activeWorkflow,
          material: state.currentMaterial,
          text: box.querySelector('#manualAnswerIn').value,
          sourceLabel: box.querySelector('#manualSourceLabel').value
        })
      });
      state.activeWorkflow = resp.workflow;
      state.currentMaterial = structuredClone(resp.material);
      renderEditor();
      renderAudit();
      renderExportPreview();
      const r = resp.importReport;
      const resto = r.keptAsSkeleton.length ? ` ${r.keptAsSkeleton.length} seção(ões) continuam em esqueleto.` : '';
      showAlert(`Rascunho importado em ${r.filled.length} seção(ões).${resto} ${r.notes.join(' ')} Confira as fontes antes de publicar.`, r.filled.length === 0);
    } catch (err) {
      showAlert(`Importação não realizada: ${err.message}`, true);
    }
  });

  box.querySelector('#btnReprocessEditorialStage')?.addEventListener('click', async () => {
    if (!state.activeWorkflow?.interpreted) return;
    const resp = await api('/api/workflow/reprocess-stage', {
      method: 'POST',
      body: JSON.stringify({
        workflow: state.activeWorkflow,
        stageName: 'editorial'
      })
    });
    state.activeWorkflow = resp.workflow;
    state.currentMaterial = structuredClone(resp.workflow.material);
    renderEditor();
    renderAudit();
    renderExportPreview();
    showAlert('Etapa Editorial (M04) reprocessada com sucesso.');
  });

  box.querySelector('#inputMaterialTitle')?.addEventListener('input', (e) => {
    mat.title = e.target.value;
    renderExportPreview();
  });
  box.querySelectorAll('[data-blk-title]').forEach((el) =>
    el.addEventListener('input', (e) => {
      mat.blocks[Number(el.dataset.blkTitle)].title = e.target.value;
      renderExportPreview();
    })
  );
  box.querySelectorAll('[data-blk-body]').forEach((el) =>
    el.addEventListener('input', (e) => {
      mat.blocks[Number(el.dataset.blkBody)].body = e.target.value;
      renderExportPreview();
    })
  );
  box.querySelectorAll('[data-blk-latex]').forEach((el) =>
    el.addEventListener('input', (e) => {
      mat.blocks[Number(el.dataset.blkLatex)].latex = e.target.value;
      renderExportPreview();
    })
  );
  box.querySelectorAll('[data-blk-up]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.blkUp);
      if (i > 0) {
        [mat.blocks[i - 1], mat.blocks[i]] = [mat.blocks[i], mat.blocks[i - 1]];
        renderEditor();
        renderExportPreview();
      }
    })
  );
  box.querySelectorAll('[data-blk-down]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.blkDown);
      if (i < mat.blocks.length - 1) {
        [mat.blocks[i + 1], mat.blocks[i]] = [mat.blocks[i], mat.blocks[i + 1]];
        renderEditor();
        renderExportPreview();
      }
    })
  );
  box.querySelectorAll('[data-blk-del]').forEach((btn) =>
    btn.addEventListener('click', () => {
      mat.blocks.splice(Number(btn.dataset.blkDel), 1);
      renderEditor();
      renderExportPreview();
    })
  );
}

let auditFilter = 'todos';

function groupFindings(list, severity) {
  const map = new Map();
  for (const f of list) {
    const key = f.ruleId || `${f.category}|${f.problem}`;
    if (!map.has(key)) map.set(key, { ...f, severity, items: [] });
    map.get(key).items.push(f);
  }
  return [...map.values()];
}

function findingHtml(g) {
  const many = g.items.length > 1;
  const sev = g.severity === 'hard' ? ['badge-err', 'Grave'] : ['badge-warn', 'Advertência'];
  const evidence = g.items.map((i) => i.evidence).filter(Boolean)[0];
  return `<article class="finding sev-${g.severity}">
    <h4><span class="badge ${sev[0]}">${sev[1]}</span> <span class="badge">${esc(g.category)}</span> ${esc(g.problem)}</h4>
    ${many ? `<p class="muted" style="margin:0;">Ocorre em ${g.items.length} lugares:</p><ul>${g.items.map((i) => `<li>${esc(i.location)}</li>`).join('')}</ul>` : `<p class="muted" style="margin:0;">Onde: ${esc(g.location)}</p>`}
    ${evidence ? `<blockquote>${esc(evidence)}</blockquote>` : ''}
    <p class="fix"><strong>O que fazer:</strong> ${esc(g.recommendedFix)}</p>
    ${g.source ? `<p class="finding-src"><strong>Base:</strong> ${esc(g.source)}</p>` : ''}
  </article>`;
}

function renderAudit() {
  const box = document.getElementById('auditBox');
  const audit = state.activeWorkflow?.audit;
  if (!audit) {
    box.innerHTML = '<p class="muted">Nenhuma auditoria ainda. Gere um material ou abra um salvo, e use "Reexecutar auditoria".</p>';
    return;
  }
  const [badge, label] = auditStatusInfo(audit.status);
  const hard = groupFindings(audit.hardFails || [], 'hard');
  const soft = groupFindings(audit.softWarnings || [], 'soft');
  const pol = audit.policy;
  const prog = audit.progress;
  const verdictClass = audit.hardFails.length ? 'callout-err' : audit.softWarnings.length ? 'callout-warn' : 'callout-ok';
  const verdictText = audit.hardFails.length
    ? `${audit.hardFails.length} pendência(s) grave(s) impedem a aprovação. Resolva as graves primeiro.`
    : audit.softWarnings.length ? `Sem pendências graves. ${audit.softWarnings.length} advertência(s) para revisar.` : 'Nenhum problema encontrado.';

  const visible = [
    ...(auditFilter === 'soft' ? [] : hard),
    ...(auditFilter === 'hard' ? [] : soft)
  ];

  box.innerHTML = `
    <div class="callout ${verdictClass}">
      <h3>Veredito: <span class="badge ${badge}">${esc(label)}</span></h3>
      <p style="margin:0;">${esc(verdictText)}</p>
      ${prog ? `<p style="margin:8px 0 4px;">${prog.developedSections} de ${prog.totalSections} seções desenvolvidas.</p><div class="progress" role="progressbar" aria-label="Seções desenvolvidas" aria-valuemin="0" aria-valuemax="${prog.totalSections}" aria-valuenow="${prog.developedSections}"><span style="width:${prog.totalSections ? Math.round((prog.developedSections / prog.totalSections) * 100) : 0}%"></span></div>` : ''}
    </div>

    ${pol ? `<details class="card" open>
      <summary><strong>Com quais critérios este material foi avaliado</strong></summary>
      <p style="margin:6px 0;">${esc(pol.basis || '')}</p>
      <dl class="ctx-grid">
        <div><dt>Área</dt><dd>${esc(pol.area || 'Não identificada, critérios gerais')}</dd></div>
        <div><dt>Tipo de documento</dt><dd>${esc(pol.documentType || 'Não informado')}</dd></div>
        <div><dt>Caminho de produção</dt><dd>${pol.path === 'perfil' ? 'Documento por seções' : 'Roteiro de aula'}</dd></div>
        <div><dt>Figura ou diagrama</dt><dd>${{ hard: 'Obrigatório', warning: 'Recomendado', na: 'Não se aplica', legacy: 'Regra geral' }[pol.visualPolicy] || esc(pol.visualPolicy)}</dd></div>
      </dl>
      ${(pol.notRequired || []).length ? `<details><summary>O que NÃO foi exigido, e por quê (${pol.notRequired.length})</summary><ul>${pol.notRequired.map((n) => `<li><strong>${esc(n.item)}:</strong> ${esc(n.reason)}</li>`).join('')}</ul></details>` : ''}
    </details>` : ''}

    <div class="chip-row" role="group" aria-label="Filtrar pendências">
      <button type="button" class="chip" data-audit-filter="todos" aria-pressed="${auditFilter === 'todos'}">Todas (${(audit.hardFails || []).length + (audit.softWarnings || []).length})</button>
      <button type="button" class="chip" data-audit-filter="hard" aria-pressed="${auditFilter === 'hard'}">Graves (${(audit.hardFails || []).length})</button>
      <button type="button" class="chip" data-audit-filter="soft" aria-pressed="${auditFilter === 'soft'}">Advertências (${(audit.softWarnings || []).length})</button>
    </div>
    ${visible.length ? visible.map(findingHtml).join('') : '<p class="muted">Nada a mostrar neste filtro.</p>'}
    <p class="muted">Categorias avaliadas: ${esc((audit.categoriesCovered || []).join(', '))}.</p>
  `;
  box.querySelectorAll('[data-audit-filter]').forEach((b) => b.addEventListener('click', () => { auditFilter = b.dataset.auditFilter; renderAudit(); }));
  renderExportReady();
}

async function renderAvatarPanel() {
  const box = document.getElementById('avatarBox');
  if (!box) return;
  if (!state.currentMaterial) { box.innerHTML = ''; return; }
  try {
    if (!state.avatars) state.avatars = (await api('/api/avatars')).avatars.filter((a) => a.approved && a.transparent);
    const sug = await api('/api/avatars/suggest', {
      method: 'POST',
      body: JSON.stringify({ knowledgeContext: state.activeWorkflow?.interpreted?.knowledgeContext, purpose: 'capa' })
    });
    const choice = state.avatarChoice;
    if (!choice.id) choice.id = sug.primary?.id || state.avatars[0]?.id || null;
    const chosen = state.avatars.find((a) => a.id === choice.id);
    box.innerHTML = `<fieldset class="card ctx-panel" style="border:1px solid var(--ml-border);">
      <legend><strong>Professor Alê Chocolate na capa</strong></legend>
      <label class="check-row" for="chkAvatar"><input id="chkAvatar" type="checkbox" ${choice.enabled ? 'checked' : ''} /> <span>Incluir o avatar na capa (vale para HTML, DOCX e PPTX)</span></label>
      <p class="muted" style="margin:6px 0;">Sugestão: ${esc(sug.reason)} O app usa só a imagem do catálogo, sem redesenhar rosto nem logotipo.</p>
      <div class="chip-row" role="radiogroup" aria-label="Escolher a pose do avatar">
        ${state.avatars.map((a) => `<label class="chip" style="display:flex;flex-direction:column;align-items:center;gap:4px;border-radius:12px;${a.id === choice.id ? 'outline:3px solid var(--ml-gold);' : ''}">
          <img src="/avatars/${esc(a.file)}" alt="" width="84" style="height:auto;background:#F1F5F9;border-radius:8px;" />
          <span class="check-row"><input type="radio" name="avatarPose" value="${esc(a.id)}" ${a.id === choice.id ? 'checked' : ''} /> <span>${esc(a.label)}</span></span>
        </label>`).join('')}
      </div>
      ${chosen?.note ? `<p class="muted" style="margin:6px 0;">Observação: ${esc(chosen.note)}</p>` : ''}
      <p class="muted" style="margin:6px 0;">Antes de publicar, confira rosto, logotipo e mãos (checklist da seção 8 do manual). Markdown e SVG não recebem avatar.</p>
    </fieldset>`;
    box.querySelector('#chkAvatar').addEventListener('change', (e) => { state.avatarChoice.enabled = e.target.checked; });
    box.querySelectorAll('input[name="avatarPose"]').forEach((r) => r.addEventListener('change', (e) => { state.avatarChoice.id = e.target.value; renderAvatarPanel(); }));
  } catch (err) {
    box.innerHTML = `<div class="callout callout-warn">Catálogo de avatares indisponível: ${esc(err.message)}</div>`;
  }
}

function renderExportReady() {
  const box = document.getElementById('exportReadyBox');
  if (!box) return;
  const audit = state.activeWorkflow?.audit;
  if (!state.currentMaterial) { box.innerHTML = ''; return; }
  if (!audit) { box.innerHTML = '<div class="callout">Este material ainda não foi auditado. Reexecute a auditoria antes de exportar.</div>'; return; }
  const g = audit.hardFails.length;
  box.innerHTML = g
    ? `<div class="callout callout-err"><h3>Ainda não está pronto para exportar</h3><p style="margin:0;">${g} pendência(s) grave(s) na auditoria. O servidor pode recusar a exportação. <button type="button" class="btn btn-secondary btn-sm" id="btnReadyToAudit">Ver pendências</button></p></div>`
    : `<div class="callout callout-ok"><h3>Pronto para exportar</h3><p style="margin:0;">${audit.softWarnings.length ? `Há ${audit.softWarnings.length} advertência(s) para revisar, mas nada bloqueia.` : 'Sem pendências.'}</p></div>`;
  box.querySelector('#btnReadyToAudit')?.addEventListener('click', () => switchView('audit'));
}

function renderPreviewMarkdown(body) {
  const inline = (txt) =>
    esc(txt)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const lines = String(body || '').split(/\r?\n/);
  const out = [];
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) { closeLists(); continue; }
    if (trimmed.startsWith('### ')) {
      closeLists();
      out.push(`<h4 style="color:var(--ml-navy);margin:10px 0 4px 0;">${inline(trimmed.slice(4))}</h4>`);
      continue;
    }
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul style="margin:6px 0 8px 20px;">'); inUl = true; }
      out.push(`<li>${inline(ulMatch[1])}</li>`);
      continue;
    }
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol style="margin:6px 0 8px 20px;">'); inOl = true; }
      out.push(`<li>${inline(olMatch[1])}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p style="margin:6px 0;">${inline(trimmed)}</p>`);
  }
  closeLists();
  return out.join('\n');
}

function renderExportPreview() {
  const box = document.getElementById('exportPreviewBox');
  const mat = state.currentMaterial;
  if (!mat) {
    box.innerHTML = '<p class="muted">Pré-visualização indisponível: gere ou abra um material primeiro.</p>';
    return;
  }
  renderExportReady();
  box.innerHTML = `
    <h2 style="color:var(--ml-navy);border-bottom:3px solid var(--ml-gold);padding-bottom:6px;">${esc(mat.title)}</h2>
    ${(mat.blocks || [])
      .map(
        (b) => `<div style="margin-bottom:16px;padding:10px 12px;border-left:4px solid var(--ml-gold);background:#FFFFFF;">
          <h3 style="color:var(--ml-navy);margin:0 0 6px 0;">${esc(b.title)}</h3>
          <div>${renderPreviewMarkdown(b.body || '')}</div>
          ${b.latex ? `<div style="background:#F8FAFC;border:1px solid #CBD5E1;padding:6px 10px;margin-top:6px;"><code>$$${esc(b.latex)}$$</code></div>` : ''}
          ${b.svg ? `<div style="margin-top:10px;text-align:center;">${b.svg}</div>` : ''}
        </div>`
      )
      .join('')}
  `;
}

function renderKnowledgeInventory() {
  const box = document.getElementById('knowledgeInventoryBox');
  const inv = state.inventory;
  if (!inv) {
    box.innerHTML = '<p class="muted">Inventário não carregado.</p>';
    return;
  }
  box.innerHTML = `
    <p><strong>Arquivos recuperados:</strong> ${inv.availableCount}/${inv.totalCatalogEntries}</p>
    <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
      <thead><tr style="text-align:left;border-bottom:2px solid var(--ml-navy);"><th>Módulo</th><th>Versão</th><th>Estado</th><th>Tamanho</th><th>Destino</th></tr></thead>
      <tbody>
        ${inv.items
          .map(
            (i) => `<tr style="border-bottom:1px solid #E2E8F0;">
              <td><strong>${esc(i.moduleCode)}</strong> — ${esc(i.title)}</td>
              <td>${esc(i.version)}</td>
              <td><span class="badge ${i.available ? 'badge-ok' : 'badge-err'}">${esc(i.state)}</span></td>
              <td>${i.sizeBytes} B</td>
              <td><code>${esc(i.destination)}</code></td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <h3 style="margin-top:16px;color:var(--ml-navy);">Conflitos / Decisões Pendentes de Promoção Canônica</h3>
    ${inv.pendingVersionDecisions
      .map((d) => `<div style="border-bottom:1px solid #E2E8F0;padding:6px 0;"><strong>${esc(d.moduleCode)}:</strong> ${esc(d.baselineOrPrevious)} vs. ${esc(d.candidate)} — <span class="badge badge-warn">${esc(d.decisionStatus)}</span><br/><span class="muted">${esc(d.summary)}</span></div>`)
      .join('')}
  `;
}

function renderAll() {
  renderAvatarPanel();
  renderDashboard();
  renderCreatorSelectors();
  renderProjects();
  renderResearch();
  renderEditor();
  renderAudit();
  renderExportPreview();
  renderKnowledgeInventory();
}

// Eventos de Navegação
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
document.getElementById('btnDashNewLesson').addEventListener('click', () => switchView('creator'));
document.getElementById('btnDashNewProject').addEventListener('click', () => switchView('projects'));
document.getElementById('btnDashOpenLibrary').addEventListener('click', () => switchView('projects'));
document.getElementById('btnDashOpenAudit').addEventListener('click', () => switchView('audit'));

document.getElementById('btnLoadSamplePrompt').addEventListener('click', () => {
  document.getElementById('inputNaturalPrompt').value =
    'Elabore uma aula de Matemática para o 8º ano sobre sistemas de equações do primeiro grau. Quero uma abordagem conceitual, representação gráfica, exemplos resolvidos, atividades graduadas e avaliação formativa.';
});

document.getElementById('btnCreateProject').addEventListener('click', async () => {
  const title = document.getElementById('inputNewProjectTitle').value.trim();
  const discipline = document.getElementById('inputNewProjectDisc').value.trim() || 'Matemática';
  if (!title) return showAlert('Informe o nome do projeto.', true);
  const res = await api('/api/projects', { method: 'POST', body: JSON.stringify({ title, discipline }) });
  state.activeProjectId = res.project.id;
  document.getElementById('inputNewProjectTitle').value = '';
  await loadInitialData();
  showAlert(`Projeto "${res.project.title}" criado.`);
});

document.getElementById('selectTargetProject').addEventListener('change', (e) => { state.creatorTarget = e.target.value; });

document.getElementById('btnRunWorkflow').addEventListener('click', async () => {
  const promptText = document.getElementById('inputNaturalPrompt').value.trim();
  if (!promptText) return showAlert('Descreva o material que você quer criar.', true);

  const btn = document.getElementById('btnRunWorkflow');
  const useExternalAi = document.getElementById('chkUseGemini').checked;
  const modeOverride = document.getElementById('selectWorkflowMode').value;
  const duration = document.getElementById('inputDuration').value.trim();
  const overrides = { ...(modeOverride ? { mode: modeOverride } : {}), ...(duration ? { duration } : {}) };

  btn.disabled = true;
  btn.textContent = 'Gerando...';
  try {
    const res = await api('/api/workflow/run', {
      method: 'POST',
      body: JSON.stringify({ promptText, overrides, useExternalAi, authorizedExternalCall: useExternalAi })
    });
    res.workflow.contextOverrides = overrides;
    await adoptWorkflow(res.workflow, { targetProject: document.getElementById('selectTargetProject').value });
    const audit = res.workflow.audit;
    if (audit?.hardFails?.length) showAlert(`Material criado e salvo, mas com ${audit.hardFails.length} pendência(s) grave(s). Veja o resultado abaixo.`, false, 'warn');
    else showAlert('Material criado, auditado e salvo no projeto.');
    document.getElementById('workflowStagesBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showAlert(`Não consegui gerar o material: ${err.message}`, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gerar material estruturado';
  }
});

document.getElementById('btnAddBlock').addEventListener('click', () => {
  if (!state.currentMaterial) return showAlert('Gere ou abra um material primeiro.', true);
  state.currentMaterial.blocks.push({
    id: `blk-custom-${Date.now()}`,
    sectionType: 'custom',
    title: 'Nova Seção Editável',
    body: 'Digite o conteúdo didático aqui...'
  });
  renderEditor();
  renderExportPreview();
});

document.getElementById('btnSaveMaterialProject').addEventListener('click', async () => {
  if (!state.currentMaterial || !state.activeProjectId || !state.activeMaterialId) {
    return showAlert('Nenhum material vinculado a projeto ativo para salvar versão.', true);
  }
  const re = await api('/api/audit/run', {
    method: 'POST',
    body: JSON.stringify({
      material: state.currentMaterial,
      scientific: state.activeWorkflow?.scientific,
      didactic: state.activeWorkflow?.didactic,
      knowledgeContext: state.activeWorkflow?.interpreted?.knowledgeContext
    })
  });
  await api(`/api/projects/${state.activeProjectId}/materials/${state.activeMaterialId}`, {
    method: 'PUT',
    body: JSON.stringify({ updatedMaterial: state.currentMaterial, author: 'Edição Humana', audit: re.audit })
  });
  const keep = state.activeWorkflow;
  const keepMaterial = state.currentMaterial;
  await loadInitialData();
  state.activeWorkflow = { ...keep, audit: re.audit };
  state.currentMaterial = keepMaterial;
  renderAudit();
  renderEditor();
  showAlert('Nova versão salva e auditada de novo.', false, re.audit.hardFails.length ? 'warn' : 'ok');
});

document.getElementById('btnReRunAudit').addEventListener('click', async () => {
  if (!state.currentMaterial) return showAlert('Nenhum material ativo para auditar.', true);
  const res = await api('/api/audit/run', {
    method: 'POST',
    body: JSON.stringify({
      material: state.currentMaterial,
      scientific: state.activeWorkflow?.scientific,
      didactic: state.activeWorkflow?.didactic,
      knowledgeContext: state.activeWorkflow?.interpreted?.knowledgeContext
    })
  });
  if (!state.activeWorkflow) state.activeWorkflow = {};
  state.activeWorkflow.audit = res.audit;
  renderAudit();
  showAlert(`Auditoria concluída: ${auditStatusInfo(res.audit.status)[1]}.`, false, res.audit.hardFails.length ? 'warn' : 'ok');
});

document.querySelectorAll('[data-export-fmt]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!state.currentMaterial) return showAlert('Nenhum material ativo para exportar.', true);
    try {
      const fmt = btn.dataset.exportFmt;
      const res = await api('/api/export', {
        method: 'POST',
        body: JSON.stringify({
          material: state.currentMaterial,
          format: fmt,
          baseFilename: 'aula_mathlab',
          avatarId: state.avatarChoice.enabled && ['html', 'docx', 'pptx'].includes(fmt) ? state.avatarChoice.id : null
        })
      });
      document.getElementById('exportResultBox').innerHTML = `
        <div class="callout callout-ok">
          Arquivo gerado e verificado: <strong>${esc(res.filename)}</strong> (${res.sizeBytes} bytes) —
          <a href="${esc(res.downloadUrl)}" download="${esc(res.filename)}">Baixar Agora</a>
        </div>`;
      showAlert(`Exportação ${fmt.toUpperCase()} verificada (${res.sizeBytes} bytes).`);
    } catch (err) {
      document.getElementById('exportResultBox').innerHTML = `<div class="callout callout-err" role="alert"><h3>Exportação não realizada</h3><p style="margin:0;">${esc(err.message)}</p></div>`;
      showAlert('A exportação foi recusada. O motivo está na página de exportação.', true);
    }
  });
});

document.getElementById('btnPrintPreview').addEventListener('click', () => window.print());

loadInitialData();
