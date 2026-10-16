/* BlueTeamAI · Generador de políticas de seguridad (antes ComplianceFlow / SecurePolicy) */
(function () {
  'use strict';
  const { t, esc } = BT;
  const $ = id => document.getElementById(id);

  const SIZES = ['micro', 'small', 'medium', 'large'];
  const SECTORS = ['finance', 'health', 'retail', 'tech', 'education', 'public', 'industry', 'logistics', 'legal', 'hospitality', 'energy', 'media', 'telecom', 'insurance', 'construction'];
  const DATA = ['personal', 'payment', 'health', 'ip', 'minors', 'hr', 'government', 'critical', 'mixed'];
  const MATURITY = ['basic', 'intermediate', 'advanced'];
  const FRAMEWORKS = ['gdpr_ens', 'iso27001', 'nist_csf', 'pci', 'soc2', 'hipaa'];
  // Política: icono, prioridad, referencias orientativas (ISO/IEC 27001:2022, ENS RD 311/2022, RGPD, NIST, NIS2…)
  const POLICIES = [
    ['passwords', '🔐', 'high', ['ISO 27001 A.5.17', 'NIST SP 800-63B', 'ENS op.acc.6', 'RGPD art. 32'], true],
    ['access', '🚪', 'high', ['ISO 27001 A.5.15', 'ISO 27001 A.5.18', 'ISO 27001 A.8.2', 'ENS op.acc', 'NIST CSF PR.AA'], true],
    ['backups', '💾', 'high', ['ISO 27001 A.8.13', 'ENS mp.info.6', 'RGPD art. 32', 'NIST CSF PR.DS'], true],
    ['devices', '💻', 'high', ['ISO 27001 A.8.1', 'ISO 27001 A.7.9', 'ENS mp.eq', 'NIST CSF PR.PS'], true],
    ['incidents', '🚨', 'high', ['ISO 27001 A.5.24–A.5.28', 'RGPD art. 33–34', 'NIS2 art. 23', 'ENS op.exp.7'], true],
    ['email', '📧', 'medium', ['ISO 27001 A.5.14', 'ENS mp.s.1', 'NIST CSF PR.AT'], true],
    ['remote', '🏠', 'high', ['ISO 27001 A.6.7', 'ENS mp.eq.3', 'RGPD art. 32'], true],
    ['ai', '🤖', 'medium', ['Reglamento (UE) 2024/1689 (AI Act)', 'RGPD art. 22', 'ISO/IEC 42001'], false],
    ['vendors', '🤝', 'medium', ['ISO 27001 A.5.19–A.5.22', 'RGPD art. 28', 'ENS op.ext', 'NIS2 art. 21'], false],
    ['social', '📱', 'low', ['ISO 27001 A.6.3', 'ENS mp.per.3', 'RGPD art. 5'], false],
  ];
  const META = Object.fromEntries(POLICIES.map(([id, ico, prio, refs]) => [id, { ico, prio, refs }]));
  const PRIO_SEV = { high: 'critical', medium: 'medium', low: 'low' };

  BT.addI18n({
    es: {
      'pol.title': 'Políticas de seguridad', 'pol.company': 'Tu organización', 'pol.f.name': 'Nombre (opcional)', 'pol.f.namePh': 'Ej.: Clínica Ejemplo S.L.',
      'pol.f.size': 'Tamaño', 'pol.f.sector': 'Sector', 'pol.f.data': 'Datos que maneja', 'pol.f.maturity': 'Madurez en seguridad', 'pol.f.framework': 'Marco de referencia principal',
      'pol.choose': '— Elige —', 'pol.pick': 'Políticas a generar', 'pol.all': 'Todas', 'pol.none': 'Ninguna',
      'pol.privacy': '🔒 El perfil de la empresa se envía a Google Gemini con tu clave. No hace falta poner el nombre real si prefieres no hacerlo.',
      'pol.generate': 'Generar políticas', 'pol.note': 'Documentos orientativos: revísalos con un especialista antes de aprobarlos.',
      'pol.upsell': '¿Sin clave ni conexión? GhostPolicy para Windows genera el cuerpo normativo con un motor local, sin enviar nada fuera.',
      'pol.h1': 'Políticas de seguridad a medida de tu organización',
      'pol.lead': 'Elige el perfil de la empresa y las políticas que necesitas. La IA redacta cada una con valores concretos (longitudes, plazos, frecuencias, retenciones) adaptados a tu tamaño, sector, datos y marco normativo.',
      'pol.c1': 'Una política por llamada', 'pol.c1d': 'Cada documento se genera por separado: nada se corta y puedes regenerar solo el que no te guste.',
      'pol.c2': 'Hasta 10 políticas', 'pol.c2d': 'Contraseñas, accesos, copias, dispositivos, incidentes, correo, teletrabajo, IA, proveedores y redes sociales.',
      'pol.c3': 'Marcos reales', 'pol.c3d': 'RGPD + ENS, ISO/IEC 27001:2022, NIST CSF 2.0, PCI DSS v4.0, SOC 2 o HIPAA.',
      'pol.c4': 'PDF, Word y HTML', 'pol.c4d': 'Descarga el conjunto completo listo para revisar, editar y aprobar.',
      'pol.noKey': '🔑 Para generar necesitas tu clave gratuita de Google Gemini: pulsa «CLAVE IA» arriba.',
      'pol.need': 'Completa tamaño, sector y tipo de datos.', 'pol.needOne': 'Elige al menos una política.',
      'pol.copy': 'Copiar', 'pol.stop': 'Detener', 'pol.regen': 'Regenerar', 'pol.retry': 'Reintentar', 'pol.waiting': 'En cola…', 'pol.running': 'Redactando…',
      'pol.resTitle': 'Políticas de seguridad — {company}', 'pol.yourCompany': 'Tu organización',
      'pol.resSub': '{n} políticas · {framework} · {date}', 'pol.progress': '{d} de {n} políticas', 'pol.stopped': 'Generación detenida.',
      'pol.k.count': 'Políticas', 'pol.k.framework': 'Marco', 'pol.k.maturity': 'Madurez', 'pol.k.review': 'Revisión', 'pol.k.annual': 'Anual',
      'pol.k.reviewSub': 'o tras cambios relevantes', 'pol.k.docs': 'documentos',
      'pol.refs': 'Referencias orientativas:', 'pol.prio': 'Prioridad {p}', 'pol.prio.high': 'alta', 'pol.prio.medium': 'media', 'pol.prio.low': 'baja',
      'pol.report': 'POLÍTICAS DE SEGURIDAD', 'pol.index': 'Índice', 'pol.date': 'Fecha', 'pol.disclaimer': 'Documento orientativo generado con IA. Revísalo con un especialista en ciberseguridad y en protección de datos antes de aprobarlo e implantarlo.',
      'pol.restored': 'Se ha recuperado el último conjunto que generaste en este navegador.', 'pol.failed': 'No se pudo generar: {msg}',
      'pol.notGenerated': '(no generada)',
      'size.micro': 'Microempresa (1–9 empleados)', 'size.small': 'Pequeña empresa (10–49)', 'size.medium': 'Mediana empresa (50–249)', 'size.large': 'Gran empresa (250 o más)',
      'sector.finance': 'Banca y servicios financieros', 'sector.health': 'Sanidad y salud', 'sector.retail': 'Comercio y e-commerce', 'sector.tech': 'Tecnología y software',
      'sector.education': 'Educación', 'sector.public': 'Administración pública', 'sector.industry': 'Industria y fabricación', 'sector.logistics': 'Logística y transporte',
      'sector.legal': 'Legal y consultoría', 'sector.hospitality': 'Hostelería y turismo', 'sector.energy': 'Energía y suministros', 'sector.media': 'Medios y comunicación',
      'sector.telecom': 'Telecomunicaciones', 'sector.insurance': 'Seguros', 'sector.construction': 'Construcción e inmobiliaria',
      'data.personal': 'Datos personales de clientes (RGPD)', 'data.payment': 'Datos de tarjetas y pagos (PCI DSS)', 'data.health': 'Datos de salud',
      'data.ip': 'Propiedad intelectual y secretos comerciales', 'data.minors': 'Datos de menores', 'data.hr': 'Datos de empleados y RR. HH.',
      'data.government': 'Información de la Administración', 'data.critical': 'Infraestructuras críticas', 'data.mixed': 'Mixtos (clientes, empleados, financieros)',
      'mat.basic': 'Básica — sin políticas previas', 'mat.intermediate': 'Intermedia — algunas políticas', 'mat.advanced': 'Avanzada — ISO 27001 / ENS',
      'fw.gdpr_ens': 'RGPD + ENS (España)', 'fw.iso27001': 'ISO/IEC 27001:2022', 'fw.nist_csf': 'NIST CSF 2.0', 'fw.pci': 'PCI DSS v4.0', 'fw.soc2': 'SOC 2', 'fw.hipaa': 'HIPAA',
      'p.passwords': 'Contraseñas y autenticación', 'p.access': 'Control de accesos', 'p.backups': 'Copias de seguridad', 'p.devices': 'Gestión de dispositivos',
      'p.incidents': 'Gestión de incidentes', 'p.email': 'Correo electrónico', 'p.remote': 'Teletrabajo', 'p.ai': 'Uso de IA y herramientas externas',
      'p.vendors': 'Proveedores y terceros', 'p.social': 'Redes sociales y comunicación',
    },
    en: {
      'pol.title': 'Security policies', 'pol.company': 'Your organisation', 'pol.f.name': 'Name (optional)', 'pol.f.namePh': 'E.g. Example Clinic Ltd',
      'pol.f.size': 'Size', 'pol.f.sector': 'Sector', 'pol.f.data': 'Data handled', 'pol.f.maturity': 'Security maturity', 'pol.f.framework': 'Main reference framework',
      'pol.choose': '— Choose —', 'pol.pick': 'Policies to generate', 'pol.all': 'All', 'pol.none': 'None',
      'pol.privacy': '🔒 The company profile is sent to Google Gemini with your key. You do not need to use the real name if you prefer not to.',
      'pol.generate': 'Generate policies', 'pol.note': 'Guidance documents: have a specialist review them before approval.',
      'pol.upsell': 'No key or no connection? GhostPolicy for Windows builds the policy set with a local engine, sending nothing out.',
      'pol.h1': 'Security policies tailored to your organisation',
      'pol.lead': 'Choose the company profile and the policies you need. The AI writes each one with concrete values (lengths, deadlines, frequencies, retention) adapted to your size, sector, data and framework.',
      'pol.c1': 'One policy per call', 'pol.c1d': 'Each document is generated separately: nothing gets cut off and you can regenerate just the one you dislike.',
      'pol.c2': 'Up to 10 policies', 'pol.c2d': 'Passwords, access, backups, devices, incidents, email, remote work, AI, vendors and social media.',
      'pol.c3': 'Real frameworks', 'pol.c3d': 'GDPR + ENS, ISO/IEC 27001:2022, NIST CSF 2.0, PCI DSS v4.0, SOC 2 or HIPAA.',
      'pol.c4': 'PDF, Word and HTML', 'pol.c4d': 'Download the whole set ready to review, edit and approve.',
      'pol.noKey': '🔑 To generate you need your free Google Gemini key: click “AI KEY” at the top.',
      'pol.need': 'Fill in size, sector and data type.', 'pol.needOne': 'Choose at least one policy.',
      'pol.copy': 'Copy', 'pol.stop': 'Stop', 'pol.regen': 'Regenerate', 'pol.retry': 'Retry', 'pol.waiting': 'Queued…', 'pol.running': 'Writing…',
      'pol.resTitle': 'Security policies — {company}', 'pol.yourCompany': 'Your organisation',
      'pol.resSub': '{n} policies · {framework} · {date}', 'pol.progress': '{d} of {n} policies', 'pol.stopped': 'Generation stopped.',
      'pol.k.count': 'Policies', 'pol.k.framework': 'Framework', 'pol.k.maturity': 'Maturity', 'pol.k.review': 'Review', 'pol.k.annual': 'Yearly',
      'pol.k.reviewSub': 'or after relevant changes', 'pol.k.docs': 'documents',
      'pol.refs': 'Indicative references:', 'pol.prio': '{p} priority', 'pol.prio.high': 'High', 'pol.prio.medium': 'Medium', 'pol.prio.low': 'Low',
      'pol.report': 'SECURITY POLICIES', 'pol.index': 'Contents', 'pol.date': 'Date', 'pol.disclaimer': 'AI-generated guidance document. Have a cybersecurity and data protection specialist review it before approval and roll-out.',
      'pol.restored': 'The last set you generated in this browser has been restored.', 'pol.failed': 'Could not be generated: {msg}',
      'pol.notGenerated': '(not generated)',
      'size.micro': 'Micro business (1–9 staff)', 'size.small': 'Small business (10–49)', 'size.medium': 'Medium business (50–249)', 'size.large': 'Large business (250+)',
      'sector.finance': 'Banking and financial services', 'sector.health': 'Healthcare', 'sector.retail': 'Retail and e-commerce', 'sector.tech': 'Technology and software',
      'sector.education': 'Education', 'sector.public': 'Public administration', 'sector.industry': 'Manufacturing and industry', 'sector.logistics': 'Logistics and transport',
      'sector.legal': 'Legal and consulting', 'sector.hospitality': 'Hospitality and tourism', 'sector.energy': 'Energy and utilities', 'sector.media': 'Media and communication',
      'sector.telecom': 'Telecommunications', 'sector.insurance': 'Insurance', 'sector.construction': 'Construction and real estate',
      'data.personal': 'Customer personal data (GDPR)', 'data.payment': 'Card and payment data (PCI DSS)', 'data.health': 'Health data',
      'data.ip': 'Intellectual property and trade secrets', 'data.minors': 'Children’s data', 'data.hr': 'Employee and HR data',
      'data.government': 'Government information', 'data.critical': 'Critical infrastructure', 'data.mixed': 'Mixed (customers, staff, financial)',
      'mat.basic': 'Basic — no previous policies', 'mat.intermediate': 'Intermediate — some policies', 'mat.advanced': 'Advanced — ISO 27001 / ENS',
      'fw.gdpr_ens': 'GDPR + ENS (Spain)', 'fw.iso27001': 'ISO/IEC 27001:2022', 'fw.nist_csf': 'NIST CSF 2.0', 'fw.pci': 'PCI DSS v4.0', 'fw.soc2': 'SOC 2', 'fw.hipaa': 'HIPAA',
      'p.passwords': 'Passwords and authentication', 'p.access': 'Access control', 'p.backups': 'Backups', 'p.devices': 'Device management',
      'p.incidents': 'Incident management', 'p.email': 'Email', 'p.remote': 'Remote working', 'p.ai': 'Use of AI and external tools',
      'p.vendors': 'Vendors and third parties', 'p.social': 'Social media and communication',
    },
  });

  // ───────────────────────── Estado ─────────────────────────
  let set = null;          // { profile, lang, date, order:[ids], docs:{id:{status, html, error, model}} }
  let running = false;
  let controller = null;

  const profileLabels = p => ({
    company: p.company || t('pol.yourCompany'), size: t('size.' + p.size), sector: t('sector.' + p.sector), data: t('data.' + p.data),
    maturity: t('mat.' + p.maturity), framework: t('fw.' + p.framework),
  });

  function fillSelect(id, values, prefix, required) {
    const el = $(id), cur = el.value;
    el.innerHTML = (required ? `<option value="">${esc(t('pol.choose'))}</option>` : '') + values.map(v => `<option value="${v}">${esc(t(prefix + v))}</option>`).join('');
    if (cur) el.value = cur;
  }
  function renderForm() {
    fillSelect('size', SIZES, 'size.', true);
    fillSelect('sector', SECTORS, 'sector.', true);
    fillSelect('data', DATA, 'data.', true);
    fillSelect('maturity', MATURITY, 'mat.', false);
    fillSelect('framework', FRAMEWORKS, 'fw.', false);
    const checked = new Set(Array.from(document.querySelectorAll('#checks input:checked')).map(i => i.value));
    const first = !$('checks').children.length;
    $('checks').innerHTML = POLICIES.map(([id, ico, , , def]) => `<label title="${esc(t('p.' + id))}"><input type="checkbox" value="${id}"${(first ? def : checked.has(id)) ? ' checked' : ''}><span>${ico} ${esc(t('p.' + id))}</span></label>`).join('');
    syncToggle();
  }
  function syncToggle() {
    const all = document.querySelectorAll('#checks input'), on = document.querySelectorAll('#checks input:checked');
    $('toggleAll').textContent = on.length === all.length ? t('pol.none') : t('pol.all');
  }
  function keyHint() { $('noKeyHint').hidden = !!BT.gemini.key(); $('noKeyHint').textContent = t('pol.noKey'); }
  function save() { if (set) BT.store.setJson('pol_last', set); }

  // ───────────────────────── Prompts ─────────────────────────
  function systemPrompt(lang) {
    const language = lang === 'es' ? 'Spanish (Spain)' : 'English';
    return `You are an expert in corporate cybersecurity governance and regulatory compliance (ISO/IEC 27001:2022, Spain's ENS (Royal Decree 311/2022), GDPR, NIST CSF 2.0, PCI DSS v4.0, SOC 2, HIPAA, NIS2). You write formal, practical security policies for organisations.
Write in ${language}.
Output ONLY an HTML fragment: no <html>, <head> or <body>, no Markdown, no code fences, no scripts, styles or attributes other than class.
Use only these tags: <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, plus <div class="highlight-box"> for key requirements and <div class="warn-box"> for warnings.`;
  }
  function policyPrompt(id, p, all) {
    const L = profileLabels(p);
    const others = all.filter(x => x !== id).map(x => t('p.' + x));
    return `Write the "${t('p.' + id)}" policy for this organisation:
- Name: ${p.company || '(not given: refer to it as "the organisation")'}
- Size: ${L.size}
- Sector: ${L.sector}
- Data handled: ${L.data}
- Current security maturity: ${L.maturity}
- Main framework: ${L.framework}

Structure it with these <h4> sections, numbered: 1 Purpose and scope; 2 Definitions; 3 Policy requirements (detailed and with CONCRETE values adapted to the size, sector and data: lengths, deadlines, frequencies, retention periods, responsible roles); 4 Roles and responsibilities; 5 Compliance, monitoring and evidence; 6 Exceptions; 7 Consequences of non-compliance; 8 Review and validity.
Cite the specific controls or articles of ${L.framework} (and GDPR when personal data is involved) where they apply. Requirements must be realistic for an organisation of this size and maturity.
Include at least one table where it adds clarity (for example requirements by role, by asset type or by level).
Length: 700 to 1,100 words.${others.length ? `\nIt belongs to a set together with these policies, so stay consistent and refer to them instead of repeating their content: ${others.join(', ')}.` : ''}`;
  }

  // ───────────────────────── Generación ─────────────────────────
  async function generateOne(id) {
    const doc = set.docs[id];
    doc.status = 'run'; doc.error = '';
    renderTabs(); renderPane(id);
    try {
      const r = await BT.gemini.generate({
        system: systemPrompt(set.lang), prompt: policyPrompt(id, set.profile, set.order), temperature: 0.5, signal: controller.signal,
        onStatus: s => { $('progStatus').hidden = false; $('progStatus').textContent = s; },
      });
      $('progStatus').hidden = true;
      const html = BT.sanitize(r.text);
      if (!html.replace(/<[^>]+>/g, '').trim()) throw new BT.gemini.GeminiError('empty');
      Object.assign(doc, { status: 'done', html, model: r.model, truncated: r.truncated });
    } catch (err) {
      if (err.name === 'AbortError') { doc.status = 'wait'; throw err; }
      Object.assign(doc, { status: 'fail', error: BT.gemini.explain(err) });
      if (err.kind === 'badkey' || err.kind === 'nokey' || (err.kind === 'quota' && err.perDay)) throw err; // no tiene sentido seguir
    } finally {
      save(); renderTabs(); renderPane(id); renderProgress();
    }
  }

  async function runQueue(ids) {
    if (running) return;
    running = true;
    controller = new AbortController();
    $('genBtn').disabled = true;
    $('stopBtn').hidden = false;
    renderProgress();
    renderPanes();
    try {
      for (const id of ids) {
        if (set.docs[id].status === 'done') continue;
        await generateOne(id);
      }
    } catch (err) {
      $('progStatus').hidden = false;
      $('progStatus').textContent = err.name === 'AbortError' ? t('pol.stopped') : BT.gemini.explain(err);
    } finally {
      running = false;
      controller = null;
      $('genBtn').disabled = false;
      $('stopBtn').hidden = true;
      renderProgress();
      renderTabs();
      renderPanes();
    }
  }

  function start() {
    if (running) return;
    const profile = { company: $('company').value.trim(), size: $('size').value, sector: $('sector').value, data: $('data').value, maturity: $('maturity').value, framework: $('framework').value };
    if (!profile.size || !profile.sector || !profile.data) { BT.toast(t('pol.need'), 3500); return; }
    const order = Array.from(document.querySelectorAll('#checks input:checked')).map(i => i.value);
    if (!order.length) { BT.toast(t('pol.needOne')); return; }
    if (!BT.gemini.key()) { BT.toast(t('err.nokey'), 4000); BT.openKeyModal(); return; }
    set = { profile, lang: BT.lang(), date: Date.now(), order, active: order[0], docs: Object.fromEntries(order.map(id => [id, { status: 'wait', html: '' }])) };
    $('progStatus').hidden = true;
    renderResults();
    BT.reveal($('stResults'));
    runQueue(order);
  }

  // ───────────────────────── Pintado ─────────────────────────
  function renderResults() {
    $('stWelcome').hidden = true;
    $('stResults').hidden = false;
    const L = profileLabels(set.profile);
    $('resTitle').textContent = t('pol.resTitle', { company: L.company });
    $('resSub').textContent = `${L.size} · ${L.sector} · ${L.data}`;
    $('summary').innerHTML = [
      [t('pol.k.count'), set.order.length, t('pol.k.docs')], [t('pol.k.framework'), L.framework, ''],
      [t('pol.k.maturity'), L.maturity.split(' — ')[0], L.maturity.split(' — ')[1] || ''], [t('pol.k.review'), t('pol.k.annual'), t('pol.k.reviewSub')],
    ].map(([k, v, s]) => `<div class="kpi"><small>${esc(k)}</small><b>${esc(v)}</b><span>${esc(s)}</span></div>`).join('');
    renderTabs();
    renderPanes();
    renderProgress();
  }
  function renderProgress() {
    if (!set) return;
    const n = set.order.length, d = set.order.filter(id => set.docs[id].status === 'done').length;
    $('progress').hidden = !running && d === n;
    $('progBar').style.width = Math.round(d / n * 100) + '%';
    $('progText').textContent = t('pol.progress', { d, n });
  }
  const stIcon = s => (s === 'done' ? '<span class="st done">✓</span>' : s === 'run' ? '<span class="st run">◉</span>' : s === 'fail' ? '<span class="st fail">✕</span>' : '<span class="st">○</span>');
  function renderTabs() {
    if (!set) return;
    $('tabs').innerHTML = set.order.map(id => `<button type="button" role="tab" data-id="${id}" aria-selected="${set.active === id}">${META[id].ico} ${esc(t('p.' + id))}${stIcon(set.docs[id].status)}</button>`).join('');
  }
  function renderPanes() {
    $('panes').innerHTML = set.order.map(id => `<div class="pane" id="pane-${id}" role="tabpanel"${set.active === id ? '' : ' hidden'}></div>`).join('');
    set.order.forEach(renderPane);
  }
  function renderPane(id) {
    const el = $('pane-' + id);
    if (!el) return;
    const doc = set.docs[id], m = META[id];
    const head = `<div class="pol-head"><h3>${m.ico} ${esc(t('p.' + id))}</h3><div class="right">
        <span class="tag sev-${PRIO_SEV[m.prio]}">${esc(t('pol.prio', { p: t('pol.prio.' + m.prio) }))}</span>
        ${doc.status !== 'run' && !(doc.status === 'wait' && running) ? `<button type="button" class="btn ghost small" data-regen="${id}" ${running ? 'disabled' : ''}>${esc(t(doc.status === 'done' ? 'pol.regen' : 'pol.retry'))}</button>` : ''}
      </div></div>`;
    const refs = `<div class="refs">${esc(t('pol.refs'))} ${m.refs.map(r => `<span class="pill">${esc(r)}</span>`).join('')}</div>`;
    let body;
    if (doc.status === 'done') body = `<div class="prose">${doc.html}</div>${doc.truncated ? `<p class="notice">${esc(t('err.truncated'))}</p>` : ''}`;
    else if (doc.status === 'run') body = `<div class="pane-wait"><div class="spinner"></div>${esc(t('pol.running'))}</div>`;
    else if (doc.status === 'fail') body = `<p class="notice err">${esc(t('pol.failed', { msg: doc.error }))}</p>`;
    else body = `<div class="pane-wait">${esc(t('pol.waiting'))}</div>`;
    el.innerHTML = head + body + refs;
  }

  // ───────────────────────── Exportar ─────────────────────────
  const doneIds = () => set.order.filter(id => set.docs[id].status === 'done');
  function plainText() {
    const L = profileLabels(set.profile);
    let s = `${t('pol.resTitle', { company: L.company })}\n${L.size} · ${L.sector} · ${L.data} · ${L.framework}\n${BT.fmtDate(set.date)}\n`;
    for (const id of doneIds()) {
      const div = document.createElement('div');
      div.innerHTML = set.docs[id].html.replace(/<\/(p|h4|li|tr|div|table|ul|ol)>/g, '$&\n').replace(/<\/t[hd]>/g, ' | ');
      s += `\n${'='.repeat(64)}\n${t('p.' + id).toUpperCase()}\n${'='.repeat(64)}\n${div.textContent.replace(/\n{3,}/g, '\n\n').trim()}\n`;
    }
    return s;
  }
  function htmlDocument(forWord) {
    const L = profileLabels(set.profile);
    const title = t('pol.resTitle', { company: L.company });
    const css = `body{font-family:Calibri,Arial,sans-serif;color:#1a2220;line-height:1.5;max-width:860px;margin:24px auto;padding:0 18px}
      h1{color:#0f7a3f;font-size:24pt;margin:0 0 4px}h2{color:#0f7a3f;font-size:16pt;border-bottom:2px solid #0f7a3f;padding-bottom:4px;margin-top:28px;page-break-before:always}
      h4{font-size:12pt;margin:16px 0 6px}table{border-collapse:collapse;width:100%;margin:8px 0}th,td{border:1px solid #c8d4d1;padding:5px 7px;text-align:left;vertical-align:top;font-size:10pt}
      th{background:#eef6f2}.highlight-box{border-left:4px solid #0f7a3f;background:#eef6f2;padding:8px 12px;margin:8px 0}.warn-box{border-left:4px solid #b9500b;background:#fdf3e9;padding:8px 12px;margin:8px 0}
      .meta{color:#60706e;font-size:10pt}.refs{color:#60706e;font-size:9pt;margin-top:10px}.disc{border:1px solid #c8d4d1;padding:8px 12px;font-size:9.5pt;color:#60706e;margin:14px 0}`;
    let body = `<h1>${esc(title)}</h1><p class="meta">${esc(L.size)} · ${esc(L.sector)} · ${esc(L.data)}<br>${esc(t('pol.k.framework'))}: ${esc(L.framework)} · ${esc(t('pol.k.maturity'))}: ${esc(L.maturity)}<br>${esc(t('pol.date'))}: ${esc(BT.fmtDate(set.date))}</p>
      <p class="disc">${esc(t('pol.disclaimer'))}</p><h3>${esc(t('pol.index'))}</h3><ol>${doneIds().map(id => `<li>${esc(t('p.' + id))}</li>`).join('')}</ol>`;
    for (const id of doneIds()) {
      body += `<h2>${esc(t('p.' + id))}</h2><p class="meta">${esc(t('pol.prio', { p: t('pol.prio.' + META[id].prio) }))}</p>${set.docs[id].html}<p class="refs">${esc(t('pol.refs'))} ${META[id].refs.map(esc).join(' · ')}</p>`;
    }
    body += `<p class="meta" style="margin-top:30px">${esc(t('pdf.generated'))}</p>`;
    const head = forWord
      ? `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(title)}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>${css}</style></head>`
      : `<!DOCTYPE html><html lang="${set.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head>`;
    return `${head}<body>${body}</body></html>`;
  }
  const fileBase = () => `blueteamai-politicas-${BT.slug(set.profile.company || t('pol.yourCompany'))}-${new Date(set.date).toISOString().slice(0, 10)}`;

  async function exportPdf() {
    if (!set || !doneIds().length) return;
    const btn = $('pdfBtn');
    btn.disabled = true;
    BT.toast(t('pdf.loading'));
    try {
      const L = profileLabels(set.profile);
      const p = await BT.pdf({ title: t('pol.resTitle', { company: L.company }), header: 'BLUETEAMAI · ' + t('pol.report'), headerRight: L.company });
      p.cover({
        kicker: '// ' + t('pol.report'), title: t('pol.resTitle', { company: L.company }), subtitle: `${L.size} · ${L.sector}`,
        meta: [[t('pol.date'), BT.fmtDate(set.date)], [t('pol.f.data'), L.data], [t('pol.k.framework'), L.framework], [t('pol.k.maturity'), L.maturity],
          [t('pol.k.count'), String(doneIds().length)], [t('pol.k.review'), t('pol.k.annual') + ' · ' + t('pol.k.reviewSub')]],
        note: t('pol.disclaimer'),
      });
      p.heading(t('pol.index'), 1);
      p.table([['#', t('pol.k.count'), t('pol.prio', { p: '' }).trim(), t('pol.refs').replace(':', '')]]
        .concat(doneIds().map((id, i) => [String(i + 1), t('p.' + id), t('pol.prio.' + META[id].prio), META[id].refs.join(' · ')])), true);
      p.box([{ text: t('pol.disclaimer') }], 'warn');
      doneIds().forEach((id, i) => {
        p.newPage();
        p.heading(`${i + 1}. ${t('p.' + id)}`, 1);
        p.runs([{ text: t('pol.prio', { p: t('pol.prio.' + META[id].prio) }), bold: true }, { text: '  ·  ' + META[id].refs.join(' · ') }], { color: BT.pdfColors.muted, size: 8.5 });
        const root = document.createElement('div');
        root.innerHTML = set.docs[id].html;
        p.html(root);
      });
      p.finish(fileBase() + '.pdf');
    } catch (err) {
      BT.toast(t('pdf.error', { msg: err.message }), 5000);
      console.error(err);
    } finally { btn.disabled = false; }
  }

  // ───────────────────────── Eventos ─────────────────────────
  function init() {
    renderForm();
    keyHint();
    $('checks').addEventListener('change', syncToggle);
    $('toggleAll').onclick = () => {
      const all = document.querySelectorAll('#checks input'), on = document.querySelectorAll('#checks input:checked').length === all.length;
      all.forEach(i => { i.checked = !on; });
      syncToggle();
    };
    $('genBtn').onclick = start;
    $('stopBtn').onclick = () => controller && controller.abort();
    $('tabs').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      set.active = b.dataset.id;
      renderTabs();
      document.querySelectorAll('#panes .pane').forEach(p => { p.hidden = p.id !== 'pane-' + set.active; });
      save();
    };
    $('panes').onclick = e => {
      const b = e.target.closest('[data-regen]');
      if (!b || running) return;
      if (!BT.gemini.key()) { BT.toast(t('err.nokey'), 4000); BT.openKeyModal(); return; }
      const id = b.dataset.regen;
      set.docs[id] = { status: 'wait', html: '' };
      runQueue([id]);
    };
    $('pdfBtn').onclick = exportPdf;
    $('docBtn').onclick = () => set && doneIds().length && BT.download(fileBase() + '.doc', new Blob(['﻿' + htmlDocument(true)], { type: 'application/msword' }));
    $('htmlBtn').onclick = () => set && doneIds().length && BT.download(fileBase() + '.html', htmlDocument(false), 'text/html;charset=utf-8');
    $('copyBtn').onclick = async () => { if (set && doneIds().length && await BT.copyText(plainText())) BT.toast(t('copied')); };
    document.addEventListener('bt:lang', () => { renderForm(); keyHint(); if (set) renderResults(); });
    document.addEventListener('bt:key', keyHint);

    // Último conjunto generado en este navegador
    const last = BT.store.json('pol_last', null);
    if (last && last.order && last.docs && last.profile) {
      set = last;
      set.order.forEach(id => { if (set.docs[id].status === 'run') set.docs[id].status = 'wait'; });
      ['company', 'size', 'sector', 'data', 'maturity', 'framework'].forEach(k => { if (set.profile[k]) $(k === 'company' ? 'company' : k).value = set.profile[k]; });
      document.querySelectorAll('#checks input').forEach(i => { i.checked = set.order.includes(i.value); });
      syncToggle();
      renderResults();
      $('progStatus').hidden = false;
      $('progStatus').className = 'notice info';
      $('progStatus').textContent = t('pol.restored');
    }
  }
  init();
})();
