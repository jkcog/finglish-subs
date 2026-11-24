// Practice page: Leitner-style review of words saved from YouTube, plus a list/export view.
const KEY = 'fg:words';
const DAY = 86400000;
const INTERVAL_DAYS = [0, 1, 3, 7, 21, 60]; // by box
let words = {};
let queue = []; // Persian keys due in this session
let revealed = false;

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const persist = () => chrome.storage.local.set({ [KEY]: words });
const dueKeys = () =>
  Object.values(words)
    .filter((w) => w.due <= Date.now())
    .sort((a, b) => a.due - b.due)
    .map((w) => w.fa);

function videoLink(w) {
  if (!w.videoId) return null;
  return `https://www.youtube.com/watch?v=${encodeURIComponent(w.videoId)}&t=${Math.max(0, (w.t || 0) - 3)}s`;
}

// ---------- review ----------
function renderReview() {
  const body = $('reviewBody');
  body.textContent = '';
  const total = Object.keys(words).length;
  if (!total) {
    body.append(el('p', 'muted', 'No saved words yet. On YouTube, tap a Finglish word and choose "Save to practice list".'));
    return;
  }
  const w = words[queue[0]];
  if (!w) {
    const future = Object.values(words).map((x) => x.due).sort((a, b) => a - b)[0];
    const when = future ? new Date(future).toLocaleString() : '';
    body.append(el('div', 'card', `All caught up. ${when ? 'Next review: ' + when : ''}`));
    return;
  }
  const card = el('div', 'card');
  card.append(el('div', 'muted', `${queue.length} left in this session`));
  const fa = el('div', 'fa', w.fa);
  fa.dir = 'rtl';
  card.append(fa);
  if (w.ctx) {
    const ctx = el('div', 'ctx', w.ctx);
    ctx.dir = 'rtl';
    card.append(ctx);
  }
  if ($('hintFi').checked) card.append(el('div', 'fi', w.fi));

  const actions = el('div', 'actions');
  if (!revealed) {
    const show = el('button', '', 'Show answer');
    show.addEventListener('click', () => {
      revealed = true;
      renderReview();
    });
    actions.append(show);
  } else {
    const ans = el('div', 'answer');
    if (!$('hintFi').checked) ans.append(el('div', 'fi', w.fi));
    ans.append(el('div', 'gloss', w.gloss || '(no meaning saved: add one in All words)'));
    const link = videoLink(w);
    if (link) {
      const a = el('a', '', 'Watch in context');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener';
      ans.append(a);
    }
    card.append(ans);
    const again = el('button', 'again', 'Again');
    const good = el('button', 'good', 'Good');
    again.addEventListener('click', () => grade(w, false));
    good.addEventListener('click', () => grade(w, true));
    actions.append(again, good);
  }
  card.append(actions);
  body.append(card);
}

async function grade(w, ok) {
  w.reviews = (w.reviews || 0) + 1;
  queue.shift();
  if (ok) {
    w.box = Math.min((w.box || 0) + 1, INTERVAL_DAYS.length - 1);
    w.due = Date.now() + INTERVAL_DAYS[w.box] * DAY;
  } else {
    w.box = 0;
    w.due = Date.now();
    queue.push(w.fa); // see it again at the end of this session
  }
  revealed = false;
  renderReview();
  await persist();
}

// ---------- list ----------
function renderList() {
  const body = $('listBody');
  body.textContent = '';
  const all = Object.values(words).sort((a, b) => b.added - a.added);
  if (!all.length) {
    body.append(el('p', 'muted', 'Nothing saved yet.'));
    return;
  }
  const table = el('table');
  const head = el('tr');
  ['Persian', 'Finglish', 'Meaning', ''].forEach((h) => head.append(el('th', '', h)));
  table.append(head);
  for (const w of all) {
    const tr = el('tr');
    tr.append(el('td', 'fa-cell', w.fa), el('td', '', w.fi));
    const td = el('td');
    const input = el('input');
    input.value = w.gloss || '';
    input.placeholder = 'add a meaning';
    input.addEventListener('change', async () => {
      w.gloss = input.value.trim();
      await persist();
    });
    td.append(input);
    const del = el('button', '', 'Delete');
    del.addEventListener('click', async () => {
      delete words[w.fa];
      queue = queue.filter((k) => k !== w.fa);
      await persist();
      renderList();
      renderReview();
    });
    const tdDel = el('td');
    tdDel.append(del);
    tr.append(td, tdDel);
    table.append(tr);
  }
  body.append(table);
}

function exportCsv() {
  const esc = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const rows = [['Persian', 'Finglish', 'Meaning', 'Sentence', 'Link']];
  for (const w of Object.values(words)) {
    rows.push([w.fa, w.fi, w.gloss, w.ctx, videoLink(w) || '']);
  }
  const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n'); // BOM so Excel reads UTF-8
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'finglish-words.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- wiring ----------
function setTab(name) {
  $('review').hidden = name !== 'review';
  $('list').hidden = name !== 'list';
  $('tabReview').classList.toggle('on', name === 'review');
  $('tabList').classList.toggle('on', name === 'list');
  if (name === 'list') renderList();
}
$('tabReview').addEventListener('click', () => setTab('review'));
$('tabList').addEventListener('click', () => setTab('list'));
$('hintFi').addEventListener('change', renderReview);
$('exportCsv').addEventListener('click', exportCsv);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes[KEY]) return;
  words = changes[KEY].newValue || {};
  queue = queue.filter((k) => words[k]);
  if (!$('list').hidden) renderList();
  renderReview();
});

chrome.storage.local.get(KEY, (r) => {
  words = r[KEY] || {};
  queue = dueKeys();
  renderReview();
});
