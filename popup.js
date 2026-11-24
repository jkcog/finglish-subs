const enabled = document.getElementById('enabled');
const fontSize = document.getElementById('fontSize');
const sizeVal = document.getElementById('sizeVal');
const lookup = document.getElementById('lookup');
const practice = document.getElementById('practice');

chrome.storage.sync.get({ enabled: true, fontSize: 20 }, (s) => {
  enabled.checked = s.enabled;
  fontSize.value = s.fontSize;
  sizeVal.textContent = s.fontSize;
});
enabled.addEventListener('change', () => chrome.storage.sync.set({ enabled: enabled.checked }));
fontSize.addEventListener('input', () => {
  sizeVal.textContent = fontSize.value;
  chrome.storage.sync.set({ fontSize: Number(fontSize.value) });
});

chrome.storage.sync.get({ autoLookup: false }, (s) => (lookup.checked = s.autoLookup));
lookup.addEventListener('change', () => chrome.storage.sync.set({ autoLookup: lookup.checked }));

chrome.storage.local.get('fg:words', (r) => {
  const words = Object.values(r['fg:words'] || {});
  const due = words.filter((w) => w.due <= Date.now()).length;
  practice.textContent = words.length ? `Practice words (${due} due, ${words.length} saved)` : 'Practice words (none saved yet)';
});
practice.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('practice.html') });
});
