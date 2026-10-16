# BlueTeamAI

**Tres herramientas de blue team con IA, gratis y en el navegador** · *Three free AI blue team tools that run in your browser*

👉 **https://unfantasmaenelsistema.github.io/BlueTeamAI/**

| Herramienta | Qué hace | Antes |
|---|---|---|
| 📊 [Analizador de logs](https://unfantasmaenelsistema.github.io/BlueTeamAI/logs.html) | Logs de SSH, Windows, firewall, servidor web o Active Directory → alertas por severidad, técnicas MITRE ATT&CK, línea de tiempo, IPs anómalas con geolocalización y mitigaciones. PDF, texto y JSON. | LogSentinel |
| 🚨 [Respuesta a incidentes](https://unfantasmaenelsistema.github.io/BlueTeamAI/incident.html) | Plan completo (evaluación, contención con comandos, forense, erradicación, recuperación, comunicación, RGPD/NIS2/ENS), checklist marcable, preguntas de seguimiento, 12 playbooks, historial local. PDF y Markdown. | IR-Assist (IncidentResponse) |
| 📜 [Políticas de seguridad](https://unfantasmaenelsistema.github.io/BlueTeamAI/policies.html) | Hasta 10 políticas adaptadas a tamaño, sector, datos y marco (RGPD + ENS, ISO/IEC 27001:2022, NIST CSF 2.0, PCI DSS v4.0, SOC 2, HIPAA). PDF, Word y HTML. | SecurePolicy (ComplianceFlow) |

## Cómo se usa

1. Crea una clave gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. En la web, pulsa **CLAVE IA**, pégala, pruébala y guárdala. Sirve para las tres herramientas.
3. Abre la herramienta que necesites (cada una trae ejemplos).

Interfaz en **español e inglés** y tema **claro u oscuro**.

## Privacidad

- No hay servidor propio: es una web estática en GitHub Pages, sin cuentas, base de datos ni analítica.
- La clave se guarda solo en el `localStorage` de tu navegador y se envía únicamente a Google (cabecera `x-goog-api-key`, nunca en la URL).
- Lo que analizas va a la API de Gemini. **En el nivel gratuito Google puede usar esos datos para mejorar sus modelos**: anonimiza logs y datos reales.
- La geolocalización envía solo las IP públicas detectadas a [ipwho.is](https://ipwho.is) (o [ipapi.is](https://ipapi.is) si falla), y se puede desactivar.

¿Necesitas trabajar sin conexión o sin enviar nada a terceros? Las versiones de escritorio para Windows —[GhostLog](https://ghostore.unfantasmaenelsistema.com/apps/ghostlog/), [GhostIncident](https://ghostore.unfantasmaenelsistema.com/apps/ghostincident/) y [GhostPolicy](https://ghostore.unfantasmaenelsistema.com/apps/ghostpolicy/)— funcionan con un motor local.

## Detalles técnicos

- HTML, CSS y JavaScript sin compilar ni dependencias en tiempo de ejecución, salvo [jsPDF](https://github.com/parallax/jsPDF) 4.2.1 (cdnjs, con SRI), que se carga solo al exportar un PDF. Las fuentes DejaVu del PDF van en `assets/fonts/` para que acentos, ñ y símbolos salgan bien.
- **Modelos con reserva:** se usa `gemini-3.8-flash`; si Google lo retira, `gemini-flash-latest` y, si tampoco existe, el Flash más reciente que ofrezca tu clave según la lista de modelos de Google. El modelo que responde se recuerda.
- Reintentos automáticos ante saturación (5xx) y ante el límite por minuto del nivel gratuito (429 con espera corta).
- **Nada se da por bueno sin comprobarlo en el log:** los eventos por hora y por IP se cuentan en local; se descartan las IP y líneas de evidencia que la IA cite y no aparezcan en el log, y el nivel de riesgo nunca queda por debajo de la peor alerta.
- Todo el texto de la IA se escapa (Markdown propio, sin HTML) o se sanea con una lista blanca de etiquetas (políticas), así que una respuesta manipulada no puede ejecutar código en la página.
- Las políticas se generan **una por llamada**: nada se trunca y se puede regenerar solo una.

```
index.html        portada
logs.html         analizador de logs        → assets/logs.js
incident.html     respuesta a incidentes    → assets/incident.js
policies.html     políticas de seguridad    → assets/policies.js
assets/core.js    marca, ES/EN, tema, clave y llamadas a Gemini, Markdown, saneado HTML, PDF
```

Para probarlo en local: `python -m http.server` en la carpeta y abre `http://localhost:8000`.

---

## English

**BlueTeamAI** brings three AI blue team tools to the browser: a **log analyzer** (alerts, MITRE ATT&CK, timeline, anomalous IPs, mitigations), an **incident response assistant** (full containment-to-lessons plan, tickable checklist, follow-ups, 12 playbooks, local history) and a **security policy generator** (up to 10 policies for your size, sector, data and framework; PDF, Word and HTML export).

They run with **your own free Google Gemini key** ([Google AI Studio](https://aistudio.google.com/app/apikey)), stored only in your browser and sent only to Google. There is no backend. On the free tier Google may use what you send to improve its models, so anonymise real data. The UI is available in Spanish and English, with light and dark themes.

## Licencia · License

Código bajo licencia [MIT](LICENSE). Fuentes DejaVu bajo su propia licencia libre ([`assets/fonts/LICENSE-DejaVu.txt`](assets/fonts/LICENSE-DejaVu.txt)).

Hecho por [Un Fantasma en el Sistema](https://www.unfantasmaenelsistema.com) · [GhoStore](https://ghostore.unfantasmaenelsistema.com/)
