// Online dictionary lookup (English Wiktionary). Only runs when the user taps
// "Look up meaning online" on a word card (or has turned on auto-lookup).
const cache = new Map();

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function lookup(word) {
  if (cache.has(word)) return cache.get(word);
  try {
    const url = 'https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(word);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    let result;
    if (res.status === 404) {
      result = { glosses: [] };
    } else if (!res.ok) {
      return { error: 'network' };
    } else {
      const data = await res.json();
      const glosses = [];
      for (const entry of data.fa || []) {
        for (const d of entry.definitions || []) {
          const text = stripHtml(d.definition || '');
          if (text && !glosses.includes(text)) glosses.push(text);
          if (glosses.length >= 3) break;
        }
        if (glosses.length >= 3) break;
      }
      result = { glosses };
    }
    cache.set(word, result);
    return result;
  } catch (e) {
    return { error: 'network' };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'lookup' && typeof msg.word === 'string') {
    lookup(msg.word).then(sendResponse);
    return true; // async response
  }
});
