/* BlueTeamAI · núcleo común: marca, idioma, tema, clave y llamadas a Gemini,
   Markdown seguro, saneado de HTML y generador de PDF. Sin dependencias. */
(function () {
  'use strict';

  // ───────────────────────── Almacenamiento ─────────────────────────
  const PREFIX = 'bt_';
  const store = {
    get(k) { try { return localStorage.getItem(PREFIX + k); } catch (e) { return null; } },
    set(k, v) {
      try { if (v == null || v === '') localStorage.removeItem(PREFIX + k); else localStorage.setItem(PREFIX + k, v); } catch (e) { /* modo privado */ }
    },
    json(k, fallback) { try { const v = JSON.parse(store.get(k)); return v == null ? fallback : v; } catch (e) { return fallback; } },
    setJson(k, v) {
      try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
  };

  // ───────────────────────── Idioma ─────────────────────────
  const DICT = { es: {}, en: {} };
  let lang = store.get('lang') || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
  if (!DICT[lang]) lang = 'es';

  function addI18n(d) {
    for (const l of Object.keys(DICT)) Object.assign(DICT[l], d[l] || {});
  }
  function t(key, vars) {
    let s = DICT[lang][key];
    if (s == null) s = DICT.es[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    root.querySelectorAll('[data-t-html]').forEach(el => { el.innerHTML = t(el.dataset.tHtml); });
    root.querySelectorAll('[data-t-ph]').forEach(el => { el.placeholder = t(el.dataset.tPh); });
    root.querySelectorAll('[data-t-title]').forEach(el => { el.title = t(el.dataset.tTitle); });
    root.querySelectorAll('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
    document.documentElement.lang = lang;
    if (document.body && document.body.dataset.titleKey) document.title = t(document.body.dataset.titleKey) + ' · BlueTeamAI';
  }
  function setLang(l) {
    if (!DICT[l] || l === lang) return;
    lang = l;
    store.set('lang', l);
    applyI18n();
    renderChrome();
    document.dispatchEvent(new CustomEvent('bt:lang', { detail: l }));
  }

  // ───────────────────────── Tema ─────────────────────────
  function theme() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function setTheme(th) {
    document.documentElement.setAttribute('data-theme', th);
    store.set('theme', th);
    renderChrome();
    document.dispatchEvent(new CustomEvent('bt:theme', { detail: th }));
  }

  // ───────────────────────── Utilidades ─────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  let toastTimer;
  function toast(msg, ms) {
    let el = document.getElementById('btToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'btToast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2800);
  }
  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function slug(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'informe';
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* nada */ }
      ta.remove(); return ok;
    }
  }
  // Lleva a la vista un bloque si no se ve (en móvil los resultados quedan debajo del formulario).
  function reveal(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 60 || r.top > window.innerHeight * 0.5) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function fmtDate(d, opts) {
    return new Date(d).toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', opts || { dateStyle: 'medium', timeStyle: 'short' });
  }

  // ───────────────────────── Textos comunes ─────────────────────────
  addI18n({
    es: {
      'brand.sub': 'UN FANTASMA EN EL SISTEMA · BLUE TEAM CON IA',
      'nav.home': 'Inicio', 'nav.logs': 'Logs', 'nav.incident': 'Incidentes', 'nav.policies': 'Políticas',
      'chip.key': 'CLAVE IA', 'chip.keyTitle': 'Configurar tu clave gratuita de Google Gemini',
      'chip.themeTitle': 'Cambiar entre tema claro y oscuro', 'chip.langTitle': 'Switch to English',
      'foot.text': 'Gratis y de código abierto. La IA puede equivocarse: revisa cada recomendación antes de aplicarla.',
      'foot.source': 'Código fuente',
      'key.title': 'Tu clave de Google Gemini',
      'key.intro': 'Las tres herramientas usan la IA de Google con tu propia clave gratuita. Se guarda solo en este navegador y viaja únicamente a Google.',
      'key.step1': 'Entra en Google AI Studio con tu cuenta de Google.',
      'key.step2': 'Pulsa «Create API key» y copia la clave (empieza por AIza…).',
      'key.step3': 'Pégala aquí, pruébala y guárdala.',
      'key.get': 'Obtener clave gratis ↗',
      'key.privacy': 'Ojo: en el nivel gratuito Google puede usar lo que envías para mejorar sus modelos. No pegues logs ni datos reales confidenciales; anonimízalos antes.',
      'key.show': 'Mostrar u ocultar la clave', 'key.test': 'Probar', 'key.save': 'Guardar', 'key.delete': 'Borrar', 'key.close': 'Cerrar',
      'key.testing': 'Probando la clave…', 'key.ok': 'Clave válida. Responde el modelo {model}.',
      'key.saved': 'Clave guardada en este navegador', 'key.deleted': 'Clave borrada de este navegador', 'key.empty': 'Pega primero tu clave.',
      'key.format': 'Las claves de Google AI Studio suelen empezar por «AIza». Revisa que la has copiado entera.',
      'key.state.on': 'Clave configurada · modelo: {model}', 'key.state.off': 'Sin clave configurada',
      'err.nokey': 'Configura primero tu clave gratuita de Gemini (botón «CLAVE IA» de arriba).',
      'err.badkey': 'Google dice que la clave no es válida o no tiene permiso para la API de Gemini. Revisa que la copiaste completa desde Google AI Studio.',
      'err.quota': 'Has llegado al límite de uso gratuito de tu clave. Espera un minuto (o hasta mañana si es el límite diario) y vuelve a intentarlo.',
      'err.network': 'No se pudo contactar con Google. Revisa tu conexión a Internet.',
      'err.unavailable': 'Google ha retirado los modelos de Gemini que usa la app y no ofrece ninguno compatible para tu clave.',
      'err.blocked': 'Google ha bloqueado la respuesta por sus filtros de seguridad. Reformula o quita contenido sensible.',
      'err.empty': 'Gemini no devolvió texto. Inténtalo de nuevo.',
      'err.server': 'Los servidores de Gemini están saturados ahora mismo. Inténtalo en unos segundos.',
      'err.truncated': 'La respuesta se cortó por longitud.',
      'err.http': 'Error de Gemini: {msg}',
      'wait.quota': 'Límite por minuto alcanzado: reintentando en {s} s…',
      'wait.server': 'Gemini está saturado: reintentando…',
      'pdf.loading': 'Preparando PDF…', 'pdf.error': 'No se pudo generar el PDF: {msg}', 'pdf.page': 'Pág. {n}/{total}',
      'pdf.generated': 'Generado con BlueTeamAI · unfantasmaenelsistema.com', 'copied': 'Copiado al portapapeles',
      'sev.critical': 'Crítico', 'sev.high': 'Alto', 'sev.medium': 'Medio', 'sev.low': 'Bajo', 'sev.info': 'Info',
    },
    en: {
      'brand.sub': 'UN FANTASMA EN EL SISTEMA · AI BLUE TEAM',
      'nav.home': 'Home', 'nav.logs': 'Logs', 'nav.incident': 'Incidents', 'nav.policies': 'Policies',
      'chip.key': 'AI KEY', 'chip.keyTitle': 'Set up your free Google Gemini key',
      'chip.themeTitle': 'Switch between light and dark theme', 'chip.langTitle': 'Cambiar a español',
      'foot.text': 'Free and open source. AI can be wrong: review every recommendation before applying it.',
      'foot.source': 'Source code',
      'key.title': 'Your Google Gemini key',
      'key.intro': 'All three tools use Google’s AI with your own free key. It is stored only in this browser and is sent only to Google.',
      'key.step1': 'Sign in to Google AI Studio with your Google account.',
      'key.step2': 'Click “Create API key” and copy the key (it starts with AIza…).',
      'key.step3': 'Paste it here, test it and save it.',
      'key.get': 'Get a free key ↗',
      'key.privacy': 'Heads-up: on the free tier Google may use what you send to improve its models. Do not paste real confidential logs or data; anonymise them first.',
      'key.show': 'Show or hide the key', 'key.test': 'Test', 'key.save': 'Save', 'key.delete': 'Delete', 'key.close': 'Close',
      'key.testing': 'Testing the key…', 'key.ok': 'Valid key. Model {model} answered.',
      'key.saved': 'Key saved in this browser', 'key.deleted': 'Key deleted from this browser', 'key.empty': 'Paste your key first.',
      'key.format': 'Google AI Studio keys usually start with “AIza”. Check that you copied all of it.',
      'key.state.on': 'Key configured · model: {model}', 'key.state.off': 'No key configured',
      'err.nokey': 'Set up your free Gemini key first (“AI KEY” button at the top).',
      'err.badkey': 'Google says the key is invalid or not allowed to use the Gemini API. Check that you copied all of it from Google AI Studio.',
      'err.quota': 'Your key has hit its free usage limit. Wait a minute (or until tomorrow for the daily limit) and try again.',
      'err.network': 'Could not reach Google. Check your Internet connection.',
      'err.unavailable': 'Google has retired the Gemini models this app uses and offers no compatible one for your key.',
      'err.blocked': 'Google blocked the answer with its safety filters. Rephrase or remove sensitive content.',
      'err.empty': 'Gemini returned no text. Please try again.',
      'err.server': 'Gemini servers are overloaded right now. Try again in a few seconds.',
      'err.truncated': 'The answer was cut short because of its length.',
      'err.http': 'Gemini error: {msg}',
      'wait.quota': 'Per-minute limit reached: retrying in {s} s…',
      'wait.server': 'Gemini is overloaded: retrying…',
      'pdf.loading': 'Preparing PDF…', 'pdf.error': 'Could not create the PDF: {msg}', 'pdf.page': 'Page {n}/{total}',
      'pdf.generated': 'Generated with BlueTeamAI · unfantasmaenelsistema.com', 'copied': 'Copied to clipboard',
      'sev.critical': 'Critical', 'sev.high': 'High', 'sev.medium': 'Medium', 'sev.low': 'Low', 'sev.info': 'Info',
    },
  });

  // ───────────────────────── Cabecera y pie de la casa ─────────────────────────
  const REPO = 'https://github.com/unfantasmaenelsistema/BlueTeamAI';
  const WEB = 'https://www.unfantasmaenelsistema.com';
  const STORE = 'https://ghostore.unfantasmaenelsistema.com/';
  const PAGES = [['home', 'index.html'], ['logs', 'logs.html'], ['incident', 'incident.html'], ['policies', 'policies.html']];

  function renderChrome() {
    const tool = document.body.dataset.tool || 'home';
    const top = document.getElementById('btTop');
    if (top) {
      const hasKey = !!gemini.key();
      top.innerHTML = `
        <a class="bt-brand" href="index.html">
          <img src="assets/logo.png" alt="Un Fantasma en el Sistema" width="42" height="42">
          <span><b>BLUETEAM<span>AI</span></b><small>${esc(t('brand.sub'))}</small></span>
        </a>
        <nav class="bt-nav" aria-label="BlueTeamAI">
          ${PAGES.map(([id, href]) => `<a href="${href}"${id === tool ? ' aria-current="page"' : ''}>${esc(t('nav.' + id))}</a>`).join('')}
        </nav>
        <div class="bt-controls">
          <button class="chip${hasKey ? ' has-key' : ''}" id="btKeyBtn" type="button" title="${esc(t('chip.keyTitle'))}"><span class="kdot"></span>${esc(t('chip.key'))}</button>
          <a class="chip" href="${WEB}" target="_blank" rel="noopener">[ WEB ]</a>
          <a class="chip" href="${STORE}" target="_blank" rel="noopener">[ GHOSTORE ]</a>
          <button class="chip" id="btLangBtn" type="button" title="${esc(t('chip.langTitle'))}">${lang === 'es' ? 'EN' : 'ES'}</button>
          <button class="chip" id="btThemeBtn" type="button" title="${esc(t('chip.themeTitle'))}" aria-label="${esc(t('chip.themeTitle'))}">${theme() === 'dark' ? '☀' : '☾'}</button>
        </div>`;
      top.querySelector('#btKeyBtn').onclick = () => openKeyModal();
      top.querySelector('#btLangBtn').onclick = () => setLang(lang === 'es' ? 'en' : 'es');
      top.querySelector('#btThemeBtn').onclick = () => setTheme(theme() === 'dark' ? 'light' : 'dark');
    }
    const foot = document.getElementById('btFoot');
    if (foot) {
      foot.innerHTML = `
        <span>${esc(t('foot.text'))}</span>
        <span class="links">
          <a href="${WEB}" target="_blank" rel="noopener">unfantasmaenelsistema.com</a>
          <a href="${STORE}" target="_blank" rel="noopener">GhoStore</a>
          <a href="${REPO}" target="_blank" rel="noopener">${esc(t('foot.source'))}</a>
        </span>`;
    }
  }

  // ───────────────────────── Gemini ─────────────────────────
  const API = 'https://generativelanguage.googleapis.com/v1beta';
  // Modelo estable fijado y, de reserva, el alias que Google mantiene apuntando al Flash actual.
  // Si Google retira ambos, se elige el Flash más nuevo de la lista de modelos de la clave.
  const PREFERRED = ['gemini-3.8-flash', 'gemini-flash-latest'];

  class GeminiError extends Error {
    constructor(kind, message, extra) {
      super(message || kind);
      this.name = 'GeminiError';
      this.kind = kind;
      Object.assign(this, extra || {});
    }
  }

  function explain(err) {
    if (err && err.name === 'AbortError') return '';
    if (err instanceof GeminiError) {
      if (err.kind === 'http') return t('err.http', { msg: err.message });
      return t('err.' + err.kind);
    }
    return t('err.http', { msg: (err && err.message) || String(err) });
  }

  function classify(status, body) {
    const e = (body && body.error) || {};
    const msg = e.message || ('HTTP ' + status);
    const st = e.status || '';
    const text = msg + ' ' + st + ' ' + JSON.stringify(e.details || []);
    if (/API_KEY_INVALID|API key not valid|API key expired|API_KEY_SERVICE_BLOCKED/i.test(text) || status === 401) return new GeminiError('badkey', msg);
    if (status === 429 || st === 'RESOURCE_EXHAUSTED') {
      let retry = 0;
      for (const d of e.details || []) {
        if (d && d.retryDelay) retry = parseFloat(d.retryDelay) || 0;
      }
      const perDay = /PerDay|per day|daily/i.test(text);
      return new GeminiError('quota', msg, { retryAfter: retry, perDay });
    }
    if (status === 403 || st === 'PERMISSION_DENIED') return new GeminiError('badkey', msg);
    if (status === 404 || st === 'NOT_FOUND' || /is not found|not supported for generateContent|no longer available|has been (shut down|retired|deprecated)/i.test(msg)) {
      return new GeminiError('unavailable', msg);
    }
    if (status >= 500) return new GeminiError('server', msg, { status });
    return new GeminiError('http', msg, { status });
  }

  const sleep = (ms, signal) => new Promise((res, rej) => {
    const id = setTimeout(res, ms);
    if (signal) signal.addEventListener('abort', () => { clearTimeout(id); rej(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });

  async function rawGenerate(model, body, key, signal) {
    let resp;
    try {
      resp = await fetch(`${API}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
        signal,
      });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new GeminiError('network', e.message);
    }
    let data = null;
    try { data = await resp.json(); } catch (e) { /* cuerpo vacío */ }
    if (!resp.ok) throw classify(resp.status, data);
    if (data && data.promptFeedback && data.promptFeedback.blockReason) throw new GeminiError('blocked', data.promptFeedback.blockReason);
    const cand = data && data.candidates && data.candidates[0];
    const reason = cand && cand.finishReason;
    const text = ((cand && cand.content && cand.content.parts) || []).filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
    if (!text) {
      if (reason && /SAFETY|PROHIBITED|BLOCKLIST|SPII|RECITATION/.test(reason)) throw new GeminiError('blocked', reason);
      if (reason === 'MAX_TOKENS') throw new GeminiError('truncated', reason);
      throw new GeminiError('empty', reason || 'empty');
    }
    return { text, truncated: reason === 'MAX_TOKENS', finishReason: reason };
  }

  const versionOf = id => (id.match(/^gemini-(\d+(?:\.\d+)*)/) || [0, '0'])[1].split('.').map(Number);
  function newerFirst(a, b) {
    const va = versionOf(a), vb = versionOf(b);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      const d = (vb[i] || 0) - (va[i] || 0);
      if (d) return d;
    }
    return a.localeCompare(b);
  }
  // El mejor modelo de texto general de la lista de Google: Flash estable más nuevo, alias Flash,
  // Flash preview/lite más nuevo y, si no hay, cualquier Gemini de texto.
  function pickModel(models) {
    const ids = models
      .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
      .map(m => (m.name || '').replace(/^models\//, ''))
      .filter(id => id.startsWith('gemini-') && !/tts|image|live|audio|embed|transcribe|translate|computer-use|robotics|nano|omni/i.test(id));
    const tiers = [
      ids.filter(id => /^gemini-\d+(\.\d+)*-flash$/.test(id)),
      ids.filter(id => id === 'gemini-flash-latest'),
      ids.filter(id => /^gemini-\d+(\.\d+)*-flash/.test(id)),
      ids,
    ];
    for (const tier of tiers) if (tier.length) return tier.slice().sort(newerFirst)[0];
    return null;
  }
  async function listModels(key, signal) {
    let resp;
    try {
      resp = await fetch(`${API}/models?pageSize=1000`, { headers: { 'x-goog-api-key': key }, signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new GeminiError('network', e.message);
    }
    const data = await resp.json().catch(() => null);
    if (!resp.ok) throw classify(resp.status, data);
    return (data && data.models) || [];
  }

  // Una llamada con reintentos ante saturación (5xx) y límite por minuto (429 con espera corta).
  async function generateOn(model, body, key, opts) {
    let serverTries = 0, quotaTries = 0;
    for (;;) {
      try {
        return await rawGenerate(model, body, key, opts.signal);
      } catch (err) {
        if (err.kind === 'server' && serverTries < 2) {
          serverTries++;
          if (opts.onStatus) opts.onStatus(t('wait.server'));
          await sleep(serverTries * 3000, opts.signal);
          continue;
        }
        if (err.kind === 'quota' && !err.perDay && quotaTries < 2) {
          const s = Math.ceil(err.retryAfter || 20);
          if (s <= 65) {
            quotaTries++;
            for (let left = s; left > 0; left--) {
              if (opts.onStatus) opts.onStatus(t('wait.quota', { s: left }));
              await sleep(1000, opts.signal);
            }
            continue;
          }
        }
        throw err;
      }
    }
  }

  const gemini = {
    key: () => store.get('gemini_key') || '',
    setKey: k => { store.set('gemini_key', (k || '').trim()); renderChrome(); document.dispatchEvent(new CustomEvent('bt:key')); },
    model: () => store.get('gemini_model') || PREFERRED[0],
    /**
     * opts: { system, turns: [{role:'user'|'model', text}], prompt, json, schema, temperature, maxTokens, signal, onStatus, key }
     * Devuelve { text, model, truncated }.
     */
    async generate(opts) {
      const key = (opts.key || gemini.key()).trim();
      if (!key) throw new GeminiError('nokey');
      const turns = opts.turns || [{ role: 'user', text: opts.prompt }];
      const body = {
        contents: turns.map(x => ({ role: x.role === 'model' ? 'model' : 'user', parts: [{ text: x.text }] })),
        generationConfig: {},
      };
      if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
      if (opts.temperature != null) body.generationConfig.temperature = opts.temperature;
      if (opts.maxTokens) body.generationConfig.maxOutputTokens = opts.maxTokens;
      if (opts.json) body.generationConfig.responseMimeType = 'application/json';
      if (opts.schema) body.generationConfig.responseSchema = opts.schema;

      const remembered = store.get('gemini_model');
      const tried = new Set();
      const attempt = async model => {
        tried.add(model);
        const r = await generateOn(model, body, key, opts);
        if (model !== remembered && !opts.key) store.set('gemini_model', model);
        return Object.assign(r, { model });
      };
      // Primero los modelos fijados (así manda el de una versión nueva de la app) y luego el recordado.
      for (const model of [...new Set([...PREFERRED, remembered].filter(Boolean))]) {
        try {
          return await attempt(model);
        } catch (err) {
          if (!(err instanceof GeminiError) || err.kind !== 'unavailable') throw err;
          if (model === remembered && !opts.key) store.set('gemini_model', null);
        }
      }
      const listed = await listModels(key, opts.signal);
      const found = pickModel(listed.filter(m => !tried.has((m.name || '').replace(/^models\//, ''))));
      if (!found) throw new GeminiError('unavailable');
      return attempt(found);
    },
    explain,
    pickModel,
    GeminiError,
  };

  // Extrae JSON aunque venga envuelto en ```json … ``` o con texto alrededor.
  function parseJson(text) {
    let s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try { return JSON.parse(s); } catch (e) {
      const a = s.indexOf('{'), b = s.lastIndexOf('}');
      if (a >= 0 && b > a) return JSON.parse(s.slice(a, b + 1));
      throw e;
    }
  }

  // ───────────────────────── Ventana de la clave ─────────────────────────
  function openKeyModal() {
    if (document.getElementById('btKeyModal')) return;
    const m = document.createElement('div');
    m.className = 'modal'; m.id = 'btKeyModal';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'btKeyTitle');
    m.innerHTML = `
      <div class="modal-box">
        <h2 id="btKeyTitle">🔑 ${esc(t('key.title'))}</h2>
        <p>${esc(t('key.intro'))}</p>
        <ol><li>${esc(t('key.step1'))}</li><li>${esc(t('key.step2'))}</li><li>${esc(t('key.step3'))}</li></ol>
        <a class="btn ghost small" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">${esc(t('key.get'))}</a>
        <div class="keywrap">
          <label class="sr-only" for="btKeyInput">${esc(t('key.title'))}</label>
          <input class="input" id="btKeyInput" type="password" autocomplete="off" spellcheck="false" placeholder="AIzaSy…">
          <button type="button" id="btKeyEye" title="${esc(t('key.show'))}" aria-label="${esc(t('key.show'))}">👁</button>
        </div>
        <p class="muted mono" id="btKeyState" style="font-size:.78rem;margin-top:6px"></p>
        <div class="notice" id="btKeyMsg" hidden style="margin-top:10px"></div>
        <div class="notice" style="margin-top:10px">⚠ ${esc(t('key.privacy'))}</div>
        <div class="modal-row">
          <button class="btn danger small" type="button" id="btKeyDel">${esc(t('key.delete'))}</button>
          <span class="grow"></span>
          <button class="btn ghost small" type="button" id="btKeyTest">${esc(t('key.test'))}</button>
          <button class="btn small" type="button" id="btKeySave">${esc(t('key.save'))}</button>
          <button class="btn ghost small" type="button" id="btKeyClose">${esc(t('key.close'))}</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    const input = m.querySelector('#btKeyInput');
    const msg = m.querySelector('#btKeyMsg');
    const state = m.querySelector('#btKeyState');
    const showState = () => { state.textContent = gemini.key() ? t('key.state.on', { model: gemini.model() }) : t('key.state.off'); };
    const say = (text, kind) => { msg.hidden = !text; msg.className = 'notice ' + (kind || ''); msg.textContent = text; };
    input.value = gemini.key();
    showState();
    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); const b = document.getElementById('btKeyBtn'); if (b) b.focus(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', e => { if (e.target === m) close(); });
    m.querySelector('#btKeyClose').onclick = close;
    m.querySelector('#btKeyEye').onclick = () => { input.type = input.type === 'password' ? 'text' : 'password'; };
    m.querySelector('#btKeyDel').onclick = () => { input.value = ''; gemini.setKey(''); store.set('gemini_model', null); say(t('key.deleted'), 'ok'); showState(); };
    m.querySelector('#btKeySave').onclick = () => {
      const k = input.value.trim();
      if (!k) { say(t('key.empty'), 'err'); return; }
      gemini.setKey(k);
      say(t('key.saved') + (k.startsWith('AIza') ? '' : ' · ' + t('key.format')), k.startsWith('AIza') ? 'ok' : '');
      showState();
      toast(t('key.saved'));
    };
    m.querySelector('#btKeyTest').onclick = async () => {
      const k = input.value.trim();
      if (!k) { say(t('key.empty'), 'err'); return; }
      const btn = m.querySelector('#btKeyTest');
      btn.disabled = true;
      say(t('key.testing'), 'info');
      try {
        const r = await gemini.generate({ key: k, prompt: 'Reply with the single word OK.', onStatus: s => say(s, 'info') });
        say(t('key.ok', { model: r.model }), 'ok');
      } catch (err) {
        say(explain(err) + (k.startsWith('AIza') ? '' : ' ' + t('key.format')), 'err');
      } finally { btn.disabled = false; }
    };
    setTimeout(() => input.focus(), 30);
  }

  // ───────────────────────── Markdown seguro ─────────────────────────
  function inline(s) {
    const codes = [];
    let out = esc(s).replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    out = out
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_(?!\s)(.+?)_(?!\w)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, txt, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${txt}</a>`);
    return out.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${codes[+i]}</code>`);
  }
  const isTableSep = l => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

  function md(src) {
    const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    let html = '';
    let i = 0;
    let para = [];
    const flush = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
    while (i < lines.length) {
      const line = lines[i];
      const fence = line.match(/^\s*(```|~~~)\s*([\w+-]*)\s*$/);
      if (fence) {
        flush();
        const buf = [];
        i++;
        while (i < lines.length && !new RegExp('^\\s*' + fence[1] + '\\s*$').test(lines[i])) buf.push(lines[i++]);
        i++;
        html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`;
        continue;
      }
      const h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (h) { flush(); const lvl = Math.min(5, h[1].length + 1); html += `<h${lvl}>${inline(h[2])}</h${lvl}>`; i++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); html += '<hr>'; i++; continue; }
      if (/^\s*>/.test(line)) {
        flush();
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
        html += `<blockquote>${md(buf.join('\n'))}</blockquote>`;
        continue;
      }
      if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        flush();
        const head = cells(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
        html += '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
          rows.map(r => '<tr>' + head.map((_, k) => `<td>${inline(r[k] || '')}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
        continue;
      }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
        flush();
        const items = [];
        while (i < lines.length) {
          const l = lines[i];
          const m = l.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
          if (m) { items.push({ indent: m[1].replace(/\t/g, '    ').length, ordered: /\d/.test(m[2]), text: m[3] }); i++; continue; }
          if (l.trim() && /^\s{2,}\S/.test(l) && items.length) { items[items.length - 1].text += ' ' + l.trim(); i++; continue; }
          break;
        }
        html += renderList(items);
        continue;
      }
      if (!line.trim()) { flush(); i++; continue; }
      para.push(line.trim());
      i++;
    }
    flush();
    return html;
  }
  function renderList(items) {
    let html = '';
    const stack = [];
    for (const it of items) {
      while (stack.length && it.indent < stack[stack.length - 1].indent) html += `</li></${stack.pop().tag}>`;
      const top = stack[stack.length - 1];
      if (!top || it.indent > top.indent) {
        const tag = it.ordered ? 'ol' : 'ul';
        stack.push({ indent: it.indent, tag });
        html += `<${tag}><li>`;
      } else {
        html += '</li><li>';
      }
      html += inline(it.text);
    }
    while (stack.length) html += `</li></${stack.pop().tag}>`;
    return html;
  }

  // ───────────────────────── Saneado de HTML generado por la IA ─────────────────────────
  const ALLOWED = new Set(['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'br', 'hr', 'code', 'pre',
    'blockquote', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span', 'section', 'small', 'sup', 'sub', 'dl', 'dt', 'dd']);
  const DROP = new Set(['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'svg', 'math', 'form', 'input', 'button', 'textarea',
    'select', 'option', 'link', 'meta', 'base', 'img', 'video', 'audio', 'source', 'track', 'canvas', 'template', 'noscript', 'title', 'head', 'picture']);
  const OK_CLASSES = new Set(['highlight-box', 'warn-box']);
  function sanitize(html) {
    const s = String(html || '').trim().replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '');
    const doc = new DOMParser().parseFromString(`<body>${s}</body>`, 'text/html');
    const walk = node => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 8) { child.remove(); continue; }
        if (child.nodeType !== 1) continue;
        let tag = child.tagName.toLowerCase();
        if (DROP.has(tag)) { child.remove(); continue; }
        if (tag === 'h1') { const h = doc.createElement('h3'); while (child.firstChild) h.appendChild(child.firstChild); child.replaceWith(h); walk(h); continue; }
        if (!ALLOWED.has(tag)) {
          walk(child);
          child.replaceWith(...Array.from(child.childNodes));
          continue;
        }
        for (const attr of Array.from(child.attributes)) {
          const n = attr.name.toLowerCase();
          if (n === 'class') {
            const keep = attr.value.split(/\s+/).filter(c => OK_CLASSES.has(c));
            if (keep.length) child.setAttribute('class', keep.join(' ')); else child.removeAttribute('class');
          } else if ((n === 'colspan' || n === 'rowspan') && /^\d{1,2}$/.test(attr.value)) {
            /* se queda */
          } else child.removeAttribute(attr.name);
        }
        walk(child);
      }
    };
    walk(doc.body);
    return doc.body.innerHTML;
  }

  // ───────────────────────── PDF ─────────────────────────
  const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js';
  const JSPDF_SRI = 'sha512-plOdviVmws4Y3JAvbnpfKb2hVxKM1lCwsi3vmElYRj+tiDLffZ4FVUj5a8vyKJ9pIgl8JCAHEJ4D1iUKBecswg==';
  const FONTS = { 'DejaVuSans.ttf': ['DejaVuSans', 'normal'], 'DejaVuSans-Bold.ttf': ['DejaVuSans', 'bold'], 'DejaVuSansMono.ttf': ['DejaVuSansMono', 'normal'] };
  let jspdfPromise = null, fontsPromise = null;

  function loadJsPDF() {
    if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
    if (!jspdfPromise) {
      jspdfPromise = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = JSPDF_URL; s.integrity = JSPDF_SRI; s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
        s.onload = () => (window.jspdf ? res(window.jspdf.jsPDF) : rej(new Error('jsPDF')));
        s.onerror = () => { jspdfPromise = null; rej(new Error('jsPDF (CDN)')); };
        document.head.appendChild(s);
      });
    }
    return jspdfPromise;
  }
  function b64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function loadFonts() {
    if (!fontsPromise) {
      fontsPromise = Promise.all(Object.keys(FONTS).map(async f => {
        const r = await fetch('assets/fonts/' + f);
        if (!r.ok) throw new Error(f);
        return [f, b64(await r.arrayBuffer())];
      })).catch(e => { fontsPromise = null; throw e; });
    }
    return fontsPromise;
  }
  // Las fuentes del PDF no traen emoji de color: se quitan (y los selectores de variación).
  const pdfText = s => String(s == null ? '' : s).replace(/[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}︎️‍]/gu, '').replace(/ /g, ' ');

  const C = {
    ink: [26, 34, 32], muted: [96, 112, 110], accent: [15, 122, 63], line: [210, 220, 217], soft: [238, 246, 242],
    warn: [185, 80, 11], warnSoft: [253, 243, 233], codeBg: [244, 246, 246],
    crit: [192, 21, 48], high: [185, 80, 11], medium: [148, 98, 0], low: [11, 98, 168], info: [91, 107, 117],
  };

  class Pdf {
    constructor(doc, opts) {
      this.d = doc;
      this.o = opts || {};
      this.W = 210; this.H = 297; this.M = 18;
      this.CW = this.W - this.M * 2;
      this.y = this.M;
    }
    font(style, size, color, mono) {
      this.d.setFont(mono ? 'DejaVuSansMono' : 'DejaVuSans', mono ? 'normal' : (style === 'bold' ? 'bold' : 'normal'));
      this.d.setFontSize(size || 10);
      this.d.setTextColor(...(color || C.ink));
    }
    newPage() { this.d.addPage(); this.y = this.M + 8; }
    ensure(h) { if (this.y + h > this.H - this.M - 6) this.newPage(); }
    gap(h) { this.y += h; }

    cover({ kicker, title, subtitle, meta, note }) {
      const d = this.d, W = this.W, H = this.H, M = this.M;
      d.setFillColor(7, 11, 14); d.rect(0, 0, W, H, 'F');
      d.setFillColor(...C.accent); d.rect(0, 0, 5, H, 'F'); d.rect(0, 0, W, 3, 'F');
      d.setDrawColor(22, 34, 40); d.setLineWidth(0.15);
      for (let yy = 12; yy < H; yy += 14) d.line(5, yy, W, yy);
      for (let xx = 12; xx < W; xx += 14) d.line(xx, 3, xx, H);
      if (this.o.logo) { try { d.addImage(this.o.logo, 'PNG', M + 4, 30, 26, 26); } catch (e) { /* sin logo */ } }
      this.font('bold', 9, [0, 230, 118], true);
      d.text(pdfText(kicker || ''), M + 4, 70);
      this.font('bold', 24, [226, 236, 233]);
      const tl = d.splitTextToSize(pdfText(title || ''), this.CW - 8);
      d.text(tl, M + 4, 84);
      let yy = 84 + tl.length * 10;
      if (subtitle) {
        this.font('normal', 12, [150, 175, 172]);
        const sl = d.splitTextToSize(pdfText(subtitle), this.CW - 8);
        d.text(sl, M + 4, yy); yy += sl.length * 6 + 6;
      }
      yy += 4;
      for (const [k, v] of meta || []) {
        if (v == null || v === '') continue;
        this.font('bold', 8, [0, 200, 105], true);
        d.text(pdfText(String(k).toUpperCase()), M + 4, yy);
        this.font('normal', 10, [215, 226, 223]);
        const vl = d.splitTextToSize(pdfText(v), this.CW - 50);
        d.text(vl, M + 48, yy);
        yy += Math.max(1, vl.length) * 5 + 3;
      }
      if (note) {
        this.font('normal', 8, [120, 140, 138]);
        d.text(d.splitTextToSize(pdfText(note), this.CW - 8), M + 4, H - 30);
      }
      this.font('normal', 8, [0, 200, 105], true);
      d.text(pdfText(t('pdf.generated')), M + 4, H - 14);
      this.newPage();
    }

    heading(text, level) {
      const size = level === 1 ? 16 : level === 2 ? 13 : 11;
      this.ensure(size + 10);
      this.gap(level === 1 ? 4 : 3);
      this.font('bold', size, level === 1 ? C.accent : C.ink);
      const lines = this.d.splitTextToSize(pdfText(text), this.CW);
      for (const l of lines) { this.ensure(size * 0.5); this.d.text(l, this.M, this.y); this.y += size * 0.48; }
      if (level === 1) {
        this.d.setDrawColor(...C.accent); this.d.setLineWidth(0.5);
        this.d.line(this.M, this.y - 1.5, this.M + this.CW, this.y - 1.5);
        this.y += 2;
      }
      this.y += 1.5;
    }

    // Párrafo con negritas/código en línea: runs = [{text, bold, mono}]
    runs(runs, opts) {
      opts = opts || {};
      const size = opts.size || 9.5, lh = size * 0.47, x0 = this.M + (opts.indent || 0), maxW = (opts.width || this.CW) - (opts.indent || 0);
      const words = [];
      for (const r of runs) {
        const parts = pdfText(r.text).replace(/\s+/g, ' ').split(/( )/);
        for (const p of parts) if (p) words.push({ text: p, bold: r.bold, mono: r.mono });
      }
      const lines = [[]];
      let w = 0;
      for (const wd of words) {
        this.font(wd.bold ? 'bold' : 'normal', wd.mono ? size - 0.8 : size, null, wd.mono);
        const ww = this.d.getTextWidth(wd.text);
        if (wd.text === ' ' && !lines[lines.length - 1].length) continue;
        if (w + ww > maxW && lines[lines.length - 1].length && wd.text !== ' ') {
          const last = lines[lines.length - 1];
          while (last.length && last[last.length - 1].text === ' ') last.pop();
          lines.push([]); w = 0;
        }
        if (ww > maxW) { // palabra más ancha que la línea (p. ej. un hash): se parte
          const chunks = this.d.splitTextToSize(wd.text, maxW);
          for (const ch of chunks) { lines[lines.length - 1].push(Object.assign({}, wd, { text: ch })); lines.push([]); }
          w = 0;
          continue;
        }
        lines[lines.length - 1].push(wd);
        w += ww;
      }
      for (const line of lines) {
        if (!line.length) continue;
        this.ensure(lh + 1);
        let x = x0;
        for (const wd of line) {
          this.font(wd.bold ? 'bold' : 'normal', wd.mono ? size - 0.8 : size, opts.color, wd.mono);
          this.d.text(wd.text, x, this.y);
          x += this.d.getTextWidth(wd.text);
        }
        this.y += lh;
      }
      this.y += opts.after == null ? 1.6 : opts.after;
    }
    para(text, opts) { this.runs([{ text, bold: opts && opts.bold }], opts); }

    bullet(runs, depth, marker) {
      const ind = 4 + depth * 5;
      this.ensure(6);
      this.font('normal', 9.5, C.accent);
      this.d.text(marker || '•', this.M + ind - 3.5, this.y);
      this.runs(runs, { indent: ind + 1, after: 0.8 });
    }

    code(text) {
      const lines = [];
      this.font('normal', 8, C.ink, true);
      for (const l of pdfText(text).split('\n')) lines.push(...(l ? this.d.splitTextToSize(l, this.CW - 8) : ['']));
      let i = 0;
      while (i < lines.length) {
        this.ensure(8);
        const room = Math.max(1, Math.floor((this.H - this.M - 6 - this.y - 4) / 3.8));
        const chunk = lines.slice(i, i + room);
        const h = chunk.length * 3.8 + 4;
        this.d.setFillColor(...C.codeBg); this.d.rect(this.M, this.y - 3, this.CW, h, 'F');
        this.d.setFillColor(...C.accent); this.d.rect(this.M, this.y - 3, 1, h, 'F');
        this.font('normal', 8, C.ink, true);
        let yy = this.y + 0.6;
        for (const l of chunk) { this.d.text(l, this.M + 4, yy); yy += 3.8; }
        this.y += h + 1;
        i += chunk.length;
      }
      this.y += 1.5;
    }

    box(runs, kind) {
      // El fondo se dibuja antes que el texto, con la altura estimada sobre el texto plano.
      const fill = kind === 'warn' ? C.warnSoft : C.soft, bar = kind === 'warn' ? C.warn : C.accent;
      this.font('bold', 9.5);
      const plain = pdfText(runs.map(r => r.text).join('')).replace(/\s+/g, ' ').trim();
      const h = this.d.splitTextToSize(plain, this.CW - 8).length * 4.47 + 3;
      if (h < this.H - this.M * 2 - 20) this.ensure(h);
      if (this.y + h < this.H - this.M - 6) {
        this.d.setFillColor(...fill); this.d.rect(this.M, this.y - 3.6, this.CW, h, 'F');
        this.d.setFillColor(...bar); this.d.rect(this.M, this.y - 3.6, 1.2, h, 'F');
      }
      this.runs(runs, { indent: 5, width: this.CW - 2, after: 3.5 });
    }

    table(rows, hasHead) {
      if (!rows.length) return;
      const n = Math.max(...rows.map(r => r.length));
      const lens = Array.from({ length: n }, (_, c) => Math.max(4, ...rows.map(r => Math.min(60, pdfText(r[c] || '').length))));
      const sum = lens.reduce((a, b) => a + b, 0);
      const widths = lens.map(l => Math.max(18, this.CW * l / sum));
      const scale = this.CW / widths.reduce((a, b) => a + b, 0);
      for (let k = 0; k < widths.length; k++) widths[k] *= scale;
      rows.forEach((r, ri) => {
        const head = hasHead && ri === 0;
        this.font(head ? 'bold' : 'normal', 8.2);
        const cellLines = widths.map((wd, c) => this.d.splitTextToSize(pdfText(r[c] || ''), wd - 3));
        const h = Math.max(...cellLines.map(l => l.length)) * 3.7 + 3;
        this.ensure(h + 1);
        if (head) { this.d.setFillColor(...C.soft); this.d.rect(this.M, this.y - 3.2, this.CW, h, 'F'); }
        this.d.setDrawColor(...C.line); this.d.setLineWidth(0.2);
        let x = this.M;
        cellLines.forEach((lines, c) => {
          this.d.rect(x, this.y - 3.2, widths[c], h, 'S');
          this.font(head ? 'bold' : 'normal', 8.2, head ? C.accent : C.ink);
          let yy = this.y;
          for (const l of lines) { this.d.text(l, x + 1.5, yy); yy += 3.7; }
          x += widths[c];
        });
        this.y += h;
      });
      this.y += 3;
    }

    rule() { this.ensure(4); this.d.setDrawColor(...C.line); this.d.setLineWidth(0.3); this.d.line(this.M, this.y, this.M + this.CW, this.y); this.y += 4; }

    // Convierte el HTML ya pintado en pantalla (Markdown o HTML saneado) en bloques del PDF.
    html(root) {
      const runsOf = (node, acc, st) => {
        acc = acc || []; st = st || {};
        for (const ch of node.childNodes) {
          if (ch.nodeType === 3) { acc.push({ text: ch.textContent, bold: st.bold, mono: st.mono }); continue; }
          if (ch.nodeType !== 1) continue;
          const tg = ch.tagName.toLowerCase();
          if (tg === 'ul' || tg === 'ol') continue;
          if (tg === 'br') { acc.push({ text: ' ' }); continue; }
          runsOf(ch, acc, { bold: st.bold || tg === 'strong' || tg === 'b' || tg === 'th', mono: st.mono || tg === 'code' });
        }
        return acc;
      };
      const list = (el, depth) => {
        let n = 0;
        for (const li of el.children) {
          if (li.tagName.toLowerCase() !== 'li') continue;
          n++;
          const r = runsOf(li);
          if (r.some(x => x.text.trim())) this.bullet(r, depth, el.tagName.toLowerCase() === 'ol' ? n + '.' : (depth ? '–' : '•'));
          for (const sub of li.children) if (/^(ul|ol)$/i.test(sub.tagName)) list(sub, depth + 1);
        }
        this.y += depth ? 0 : 1.5;
      };
      const block = el => {
        for (const ch of el.childNodes) {
          if (ch.nodeType === 3) { if (ch.textContent.trim()) this.para(ch.textContent); continue; }
          if (ch.nodeType !== 1) continue;
          const tg = ch.tagName.toLowerCase();
          if (ch.dataset && ch.dataset.pdf === 'skip') continue;
          if (/^h[1-6]$/.test(tg)) this.heading(ch.textContent, +tg[1] <= 2 ? 1 : +tg[1] === 3 ? 2 : 3);
          else if (tg === 'p') this.runs(runsOf(ch));
          else if (tg === 'ul' || tg === 'ol') list(ch, 0);
          else if (tg === 'pre') this.code(ch.textContent);
          else if (tg === 'blockquote') this.box(runsOf(ch), 'info');
          else if (tg === 'hr') this.rule();
          else if (tg === 'table') {
            const rows = Array.from(ch.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(c => c.textContent.trim()));
            this.table(rows, !!ch.querySelector('th'));
          } else if (tg === 'div' && (ch.classList.contains('highlight-box') || ch.classList.contains('warn-box'))) {
            this.box(runsOf(ch), ch.classList.contains('warn-box') ? 'warn' : 'info');
          } else if (ch.children.length && Array.from(ch.children).some(c => /^(p|ul|ol|pre|table|h\d|div|blockquote|section)$/i.test(c.tagName))) block(ch);
          else { const r = runsOf(ch); if (r.some(x => x.text.trim())) this.runs(r); }
        }
      };
      block(root);
    }

    finish(filename) {
      const total = this.d.getNumberOfPages();
      for (let p = 2; p <= total; p++) {
        this.d.setPage(p);
        this.d.setDrawColor(...C.accent); this.d.setLineWidth(0.6); this.d.line(this.M, 10, this.W - this.M, 10);
        this.font('bold', 7.5, C.accent, true);
        this.d.text(pdfText(this.o.header || 'BlueTeamAI'), this.M, 7.5);
        this.font('normal', 7.5, C.muted, true);
        this.d.text(pdfText(this.o.headerRight || ''), this.W - this.M, 7.5, { align: 'right' });
        this.d.setDrawColor(...C.line); this.d.setLineWidth(0.2); this.d.line(this.M, this.H - 11, this.W - this.M, this.H - 11);
        this.font('normal', 7, C.muted);
        this.d.text(pdfText(this.o.footer || 'unfantasmaenelsistema.com'), this.M, this.H - 7);
        this.d.text(t('pdf.page', { n: p - 1, total: total - 1 }), this.W - this.M, this.H - 7, { align: 'right' });
      }
      this.d.save(filename);
    }
  }

  let logoData = null;
  async function loadLogo() {
    if (logoData !== null) return logoData;
    try {
      const r = await fetch('assets/logo.png');
      logoData = 'data:image/png;base64,' + b64(await r.arrayBuffer());
    } catch (e) { logoData = ''; }
    return logoData;
  }

  async function pdf(opts) {
    const [JsPDF, fonts, logo] = await Promise.all([loadJsPDF(), loadFonts(), loadLogo()]);
    const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    for (const [file, data] of fonts) {
      doc.addFileToVFS(file, data);
      doc.addFont(file, FONTS[file][0], FONTS[file][1]);
    }
    doc.setProperties({ title: opts.title || 'BlueTeamAI', creator: 'BlueTeamAI · unfantasmaenelsistema.com' });
    return new Pdf(doc, Object.assign({ logo }, opts));
  }

  // ───────────────────────── Arranque ─────────────────────────
  window.BT = { store, t, addI18n, applyI18n, lang: () => lang, setLang, theme, setTheme, esc, toast, download, slug, copyText, fmtDate, reveal,
    gemini, parseJson, openKeyModal, md, sanitize, pdf, pdfColors: C };

  function boot() {
    renderChrome();
    applyI18n();
    document.addEventListener('bt:key', renderChrome);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
