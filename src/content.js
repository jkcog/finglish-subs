// Finglish Subs content script.
// Primary path: fetch the Persian caption track (json3), cache, sync to playback.
// Fallback: read YouTube's rendered caption text live.
// Each Finglish word is clickable: pauses the video, shows a meaning card, can save to a practice list.
(() => {
  'use strict';
  const T = globalThis.PersianTranslit;
  const LEXG = globalThis.PersianLexicon.gloss;
  const DEFAULTS = { enabled: true, fontSize: 20, autoLookup: false };
  const CACHE_MAX = 30;
  const WORDS_KEY = 'fg:words';
  const ZWNJ = '‌';

  let settings = { ...DEFAULTS };
  let overlay = null, finEl = null, faEl = null;
  let currentVideoId = null;
  let cues = null; // [{s, e, fa}] sorted by start
  let lastDomFa = '';
  let lastShown = '';
  let curFa = ''; // sentence currently on screen
  let saved = {}; // practice list, keyed by Persian word
  let card = null;
  let cardResume = false;

  const getVideo = () => document.querySelector('video.html5-main-video');
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const isolate = (node, events) =>
    events.forEach((ev) => node.addEventListener(ev, (e) => e.stopPropagation()));
  const MOUSE_EVENTS = ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart'];

  // ---------- settings & saved words ----------
  chrome.storage.sync.get(DEFAULTS, (s) => {
    settings = { ...DEFAULTS, ...s };
    applySettings();
  });
  chrome.storage.local.get(WORDS_KEY, (r) => {
    saved = r[WORDS_KEY] || {};
    lastShown = '';
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      for (const k of Object.keys(changes)) settings[k] = changes[k].newValue;
      applySettings();
    } else if (area === 'local' && changes[WORDS_KEY]) {
      saved = changes[WORDS_KEY].newValue || {};
      lastShown = ''; // re-render so saved words are recoloured
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && card) return closeCard();
    const t = e.target;
    if (!e.altKey || e.code !== 'KeyF') return;
    if (t && (/^(INPUT|TEXTAREA)$/.test(t.tagName) || t.isContentEditable)) return;
    chrome.storage.sync.set({ enabled: !settings.enabled });
  });

  function applySettings() {
    if (!overlay) return;
    overlay.style.setProperty('--fg-size', settings.fontSize + 'px');
    if (!settings.enabled) {
      overlay.classList.remove('fg-on');
      closeCard();
    }
  }

  const persistSaved = () => chrome.storage.local.set({ [WORDS_KEY]: saved });

  // ---------- overlay ----------
  function ensureOverlay() {
    const player = document.getElementById('movie_player');
    if (!player) return null;
    if (!overlay) {
      overlay = el('div', 'fg-overlay');
      faEl = el('div', 'fg-fa');
      faEl.dir = 'rtl';
      finEl = el('div', 'fg-fin');
      overlay.append(faEl, finEl);
      // Clicking a word must not toggle YouTube's play/pause.
      isolate(overlay, MOUSE_EVENTS);
      finEl.addEventListener('click', (e) => {
        const w = e.target.closest('.fg-word');
        if (w) openCard(w.dataset.fa, w.dataset.fi, w.dataset.gloss);
      });
      applySettings();
    }
    if (overlay.parentElement !== player) player.appendChild(overlay); // stays visible in fullscreen
    return player;
  }

  function nativeCaptionWindow() {
    const seg = document.querySelector('.ytp-caption-window-container .ytp-caption-segment');
    return seg ? seg.closest('.caption-window') || seg.parentElement : null;
  }

  function renderTokens(fa) {
    finEl.textContent = '';
    for (const tk of T.tokens(fa)) {
      if (tk.text !== undefined) {
        finEl.append(tk.text);
        continue;
      }
      const cls = 'fg-word' + (tk.known ? '' : ' fg-guess') + (saved[tk.fa] ? ' fg-saved' : '');
      const s = el('span', cls, tk.fi);
      s.dataset.fa = tk.fa;
      s.dataset.fi = tk.fi;
      s.dataset.gloss = tk.gloss || '';
      finEl.append(s);
    }
  }

  function show(fa) {
    const player = ensureOverlay();
    if (!player) return;
    if (!settings.enabled || !fa || !/[؀-ۿ]/.test(fa)) {
      overlay.classList.remove('fg-on');
      lastShown = '';
      return;
    }
    curFa = fa;
    const nativeWin = nativeCaptionWindow();
    const key = fa + '|' + !!nativeWin;
    if (key !== lastShown) {
      lastShown = key;
      renderTokens(fa);
      faEl.textContent = fa;
      faEl.hidden = !!nativeWin; // native captions already show the Persian
    }
    // Sit just above native captions if they're on; otherwise a default spot.
    if (nativeWin) {
      const pr = player.getBoundingClientRect();
      const cr = nativeWin.getBoundingClientRect();
      overlay.style.bottom = Math.max(8, pr.bottom - cr.top + 4) + 'px';
    } else {
      overlay.style.bottom = '60px';
    }
    overlay.classList.add('fg-on');
  }

  // ---------- word card ----------
  async function toggleSave(fa, fi, meaning, ctx) {
    if (saved[fa]) {
      delete saved[fa];
    } else {
      const v = getVideo();
      saved[fa] = {
        fa, fi,
        gloss: meaning.trim(),
        ctx,
        videoId: currentVideoId,
        t: v ? Math.floor(v.currentTime) : 0,
        added: Date.now(),
        box: 0,
        due: Date.now(),
        reviews: 0,
      };
    }
    lastShown = '';
    await persistSaved();
  }

  function closeCard() {
    if (card) {
      card.remove();
      card = null;
    }
    if (cardResume) {
      cardResume = false;
      const v = getVideo();
      if (v) v.play().catch(() => {});
    }
  }

  function openCard(fa, fi, tokenGloss) {
    const player = ensureOverlay();
    if (!player) return;
    const video = getVideo();
    if (card) {
      card.remove();
      card = null;
    } else if (video && !video.paused) {
      video.pause();
      cardResume = true;
    }

    const ctx = curFa;
    const c = el('div', 'fg-card');
    card = c;
    isolate(c, [...MOUSE_EVENTS, 'keyup', 'keypress', 'wheel']);
    c.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') closeCard();
    });

    const head = el('div', 'fg-card-head');
    const faE = el('div', 'fg-card-fa', fa);
    faE.dir = 'rtl';
    const x = el('button', 'fg-card-x', '✕');
    x.title = 'Close (Esc)';
    x.addEventListener('click', closeCard);
    head.append(el('div', 'fg-card-fi', fi), faE, x);

    const input = el('input', 'fg-card-input');
    input.placeholder = 'Meaning (type your own)';
    let prefill = (saved[fa] && saved[fa].gloss) || tokenGloss || LEXG[fa] || '';
    if (!prefill && fa.includes(ZWNJ)) {
      const parts = fa.split(ZWNJ).filter(Boolean).map((p) => LEXG[p]);
      if (parts.every(Boolean)) prefill = parts.join(' + ');
    }
    input.value = prefill;

    const status = el('div', 'fg-card-status');
    const results = el('div', 'fg-card-results');
    const sentence = el('div', 'fg-card-ctx', ctx);
    sentence.dir = 'rtl';
    const save = el('button', 'fg-card-save');
    const refreshSave = () => {
      save.textContent = saved[fa] ? '✓ Saved (click to remove)' : '+ Save to practice list';
      save.classList.toggle('fg-saved-btn', !!saved[fa]);
    };
    refreshSave();
    save.addEventListener('click', async () => {
      await toggleSave(fa, fi, input.value, ctx);
      refreshSave();
    });
    input.addEventListener('change', async () => {
      if (saved[fa]) {
        saved[fa].gloss = input.value.trim();
        await persistSaved();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
    });

    c.append(head, input, status, results, sentence, save);
    player.appendChild(c);

    const runLookup = () => {
      lookupBtn.remove();
      status.textContent = 'Looking up…';
      chrome.runtime
        .sendMessage({ type: 'lookup', word: fa })
        .then((res) => {
          if (card !== c) return;
          status.textContent = '';
          if (res && res.glosses && res.glosses.length) {
            status.textContent = 'Wiktionary (tap to use):';
            for (const g of res.glosses) {
              const b = el('button', 'fg-card-opt', g);
              b.addEventListener('click', () => {
                input.value = g;
                input.dispatchEvent(new Event('change'));
              });
              results.append(b);
            }
          } else if (res && res.error) {
            status.textContent = "Couldn't reach the dictionary. Type your own meaning.";
          } else {
            status.textContent = 'No dictionary entry found. Type your own meaning.';
          }
        })
        .catch(() => {
          if (card === c) status.textContent = 'Lookup unavailable. Type your own meaning.';
        });
    };
    const lookupBtn = el('button', 'fg-card-opt', 'Look up meaning online (sends this word to Wiktionary)');
    lookupBtn.addEventListener('click', runLookup);
    if (!input.value) {
      if (settings.autoLookup) runLookup();
      else results.append(lookupBtn);
    }
  }

  // ---------- caption tracks ----------
  function pickTrack(tracks) {
    const fa = tracks.filter((t) => /^fa/i.test(t.languageCode));
    fa.sort((a, b) => (a.kind === 'asr') - (b.kind === 'asr')); // manual captions first
    return fa[0] || null;
  }

  function parseJson3(data) {
    const out = [];
    for (const ev of data.events || []) {
      if (!ev.segs) continue;
      const fa = ev.segs.map((s) => s.utf8 || '').join('').replace(/\s*\n\s*/g, ' ').trim();
      if (!fa) continue;
      const s = (ev.tStartMs || 0) / 1000;
      out.push({ s, e: s + (ev.dDurationMs || 0) / 1000, fa });
    }
    return out.sort((a, b) => a.s - b.s);
  }

  async function cacheGet(key) {
    return (await chrome.storage.local.get(key))[key] || null;
  }
  async function cachePut(key, val) {
    const idx = (await chrome.storage.local.get('fg:index'))['fg:index'] || [];
    const next = [key, ...idx.filter((k) => k !== key)];
    const drop = next.splice(CACHE_MAX);
    await chrome.storage.local.set({ [key]: val, 'fg:index': next });
    if (drop.length) await chrome.storage.local.remove(drop);
  }

  async function loadCues(msg) {
    const track = pickTrack(msg.tracks);
    if (!track) return; // no Persian track: DOM fallback handles it
    const key = `fg:${msg.videoId}:${track.languageCode}:${track.kind}`;
    try {
      const cached = await cacheGet(key);
      if (cached) return void (msg.videoId === currentVideoId && (cues = cached));
      const url = new URL(track.baseUrl, location.origin);
      url.searchParams.set('fmt', 'json3');
      const text = await (await fetch(url)).text();
      if (!text) throw new Error('empty caption response');
      const parsed = parseJson3(JSON.parse(text));
      if (msg.videoId !== currentVideoId) return; // user navigated away
      cues = parsed;
      if (parsed.length) cachePut(key, parsed);
    } catch (err) {
      console.debug('[Finglish Subs] track fetch failed, using DOM fallback:', err);
      cues = null;
    }
  }

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (e.source !== window || !d || d.source !== 'finglish-bridge' || !d.videoId) return;
    if (d.videoId === currentVideoId) return;
    currentVideoId = d.videoId;
    cues = null;
    lastDomFa = lastShown = '';
    if (card) {
      card.remove();
      card = null;
      cardResume = false;
    }
    loadCues(d);
  });

  function requestTracks() {
    window.postMessage({ source: 'finglish-content', type: 'request' }, '*');
  }

  // ---------- main loop ----------
  function tick() {
    const video = getVideo();
    if (!video) return;

    if (cues && cues.length) {
      const t = video.currentTime;
      let hit = null;
      for (let i = cues.length - 1; i >= 0; i--) {
        if (cues[i].s <= t) {
          if (t < cues[i].e) hit = cues[i];
          break;
        }
      }
      show(hit ? hit.fa : '');
      return;
    }

    // DOM fallback: use whatever Persian text YouTube is rendering.
    const segs = [...document.querySelectorAll('.ytp-caption-window-container .ytp-caption-segment')];
    const fa = segs.map((s) => s.textContent).join(' ').trim();
    if (fa !== lastDomFa) lastDomFa = fa;
    show(lastDomFa);
  }

  setInterval(tick, 250);
  requestTracks();
  window.addEventListener('yt-navigate-finish', () => setTimeout(requestTracks, 600));
  // Retry a few times in case the player isn't ready on first load.
  let tries = 0;
  const retry = setInterval(() => {
    if (currentVideoId || ++tries > 20) return clearInterval(retry);
    requestTracks();
  }, 1000);
})();
