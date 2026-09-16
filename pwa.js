export const APP_VERSION = '1.0.0';
export function initPwa({openSheet, toast}) {
  let registration, installPrompt, applying = false, unavailable = false;
  const banner = document.createElement('div');
  banner.id = 'pwa-status'; banner.className = 'pwa-status'; banner.setAttribute('aria-live','polite');
  document.querySelector('.shell header')?.after(banner);
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const paint = () => {
    const waiting = !!registration?.waiting;
    banner.hidden = navigator.onLine && !waiting && !installPrompt && !unavailable;
    banner.innerHTML = `${!navigator.onLine?'<span>Offline · Eingaben bleiben auf diesem Gerät</span>':''}${unavailable?'<span>Offline-Modus noch nicht bereit</span>':''}${waiting?'<button type="button" data-pwa="update">Neue Version verfügbar · Aktualisieren</button>':installPrompt&&!standalone()?'<button type="button" data-pwa="install">Hany als App installieren</button>':''}`;
  };
  const help = () => openSheet(`<h1 class="sheet-title">Hany auf deinem Handy</h1><p class="subtitle">Version ${APP_VERSION} · Kostenlos als Web-App</p><div class="card"><h3>iPhone & iPad</h3><p class="hint">Diesen Link in Safari öffnen, „Teilen“ antippen und „Zum Home-Bildschirm“ wählen. Falls angezeigt, „Als Web-App öffnen“ aktivieren.</p></div><div class="card"><h3>Android</h3><p class="hint">Im Browser-Menü „App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen.</p></div><p class="hint">Nach dem ersten vollständigen Laden kannst du Hany offline nutzen. Eine neue Version wird hier angekündigt. Speichere offene Formulare vor dem Aktualisieren.</p><p class="hint">Die installierte App speichert auf diesem Gerät. Nutze für deine Daten dieselbe Internetadresse und sichere sie vor einem Gerätewechsel.</p><button class="quick secondary wide" data-pwa="check">Nach Aktualisierung suchen</button>`);
  async function check() {
    if (!registration) {toast('Offline-Modus wird vorbereitet. Bitte bei Internetverbindung erneut versuchen.');return;}
    try {await registration.update(); paint(); toast(registration.waiting?'Neue Version bereit. Formular schließen und oben aktualisieren.':'Prüfung gestartet. Verfügbare Updates erscheinen oben.');}
    catch {toast('Aktualisierung konnte nicht geprüft werden. Internetverbindung prüfen.');}
  }
  async function update() {
    if (document.querySelector('dialog[open]')) {toast('Bitte dein geöffnetes Formular zuerst speichern oder schließen.');return;}
    const worker = registration?.waiting;
    if (!worker) return;
    applying = true;
    toast('Hany wird aktualisiert. Deine gespeicherten Daten bleiben erhalten.');
    worker.postMessage({type:'SKIP_WAITING'});
  }
  document.addEventListener('click', async event => {
    const action = event.target.closest('[data-pwa]')?.dataset.pwa;
    if (action === 'update') await update();
    if (action === 'check') await check();
    if (action === 'install') {
      if (!installPrompt) return help();
      const prompt = installPrompt; installPrompt = null;
      await prompt.prompt(); await prompt.userChoice; paint();
    }
  });
  window.addEventListener('online', paint); window.addEventListener('offline', paint);
  window.addEventListener('beforeinstallprompt', event => {event.preventDefault();installPrompt=event;paint();});
  window.addEventListener('appinstalled', () => {installPrompt=null;paint();toast('Hany wurde zum Startbildschirm hinzugefügt.');});
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Other tabs can have unsaved forms. Only this user's explicit click reloads.
      if (applying && !document.querySelector('dialog[open]')) location.reload();
    });
    navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), {updateViaCache:'none'}).then(reg => {
      registration=reg;
      const observe = worker => worker?.addEventListener('statechange', () => {unavailable=worker.state==='redundant'&&!registration.active;paint();});
      reg.addEventListener('updatefound', () => observe(reg.installing));observe(reg.installing);paint();
      reg.update().catch(()=>{});
    }).catch(() => {unavailable=true;paint();});
    document.addEventListener('visibilitychange', () => {if(!document.hidden&&navigator.onLine)registration?.update().catch(()=>{});});
  } else unavailable=true;
  paint();
  return {help,check,isNative:false};
}
