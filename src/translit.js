// Persian script -> Finglish. Offline: lexicon lookup first, then rule-based fallback.
(function (root) {
  const isNode = typeof module === 'object' && module.exports;
  const LEXICON = isNode ? require('./lexicon.js') : root.PersianLexicon;
  const LEX = LEXICON.map;
  const LEXG = LEXICON.gloss;
  const VERBS = isNode ? require('./verbs.js') : root.PersianVerbs;

  // Possessive / plural suffixes, tried (longest first) only on stems that are in the lexicon.
  const SUFFIXES = [
    ['هایم', 'haye-am', 'plural + my'],
    ['مان', 'man', 'our'], ['تان', 'tan', 'your (pl.)'], ['شان', 'shan', 'their'],
    ['مون', 'moon', 'our'], ['تون', 'toon', 'your (pl.)'], ['شون', 'shoon', 'their'],
    ['های', 'haye', 'plural'], ['ها', 'ha', 'plural'],
    ['م', 'am', 'my'], ['ت', 'at', 'your'], ['ش', 'esh', 'his/her'],
  ];

  const ZWNJ = '‌';

  const CONS = {
    ب: 'b', پ: 'p', ت: 't', ث: 's', ج: 'j', چ: 'ch', ح: 'h', خ: 'kh', د: 'd', ذ: 'z',
    ر: 'r', ز: 'z', ژ: 'zh', س: 's', ش: 'sh', ص: 's', ض: 'z', ط: 't', ظ: 'z',
    غ: 'gh', ف: 'f', ق: 'gh', ک: 'k', گ: 'g', ل: 'l', م: 'm', ن: 'n',
  };
  const VOWEL_LETTERS = new Set(['ا', 'آ', 'و', 'ی']);
  const PUNCT = { '،': ',', '؛': ';', '؟': '?', '٪': '%', '«': '"', '»': '"' };

  function normalize(s) {
    return s
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[أإ]/g, 'ا')
      .replace(/[ۀة]/g, 'ه')
      .replace(/[ً-ْـ]/g, '') // diacritics, tatweel
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[،؛؟٪«»]/g, (p) => PUNCT[p]);
  }

  // Rule-based fallback for one ZWNJ-free word.
  function rules(word) {
    const ch = [...word];
    const n = ch.length;
    const out = []; // {k:'C'|'V'|'X', s}
    const C = (s) => ({ k: 'C', s });
    const V = (s) => ({ k: 'V', s });

    for (let i = 0; i < n; i++) {
      const c = ch[i], prev = ch[i - 1], next = ch[i + 1];
      const first = i === 0, last = i === n - 1;
      if (c === 'آ' || c === 'ا') out.push(V('a'));
      else if (c === 'و') {
        if (prev === 'خ' && next === 'ا') continue; // khâh: silent و
        if (first || prev === 'ا' || prev === 'آ') out.push(C('v'));
        else out.push(V(last ? 'o' : 'oo'));
      } else if (c === 'ی') {
        if (last && prev === 'ا') out.push(V('i'));
        else if (first || VOWEL_LETTERS.has(prev)) out.push(C('y'));
        else out.push(V('i'));
      } else if (c === 'ه') {
        if (last && prev && !VOWEL_LETTERS.has(prev)) out.push(V('e'));
        else out.push(C('h'));
      } else if (c === 'ع') {
        if (first) out.push(V('a'));
      } else if (c === 'ئ' || c === 'ؤ' || c === 'ء') {
        // hamza: silent
      } else if (CONS[c]) out.push(C(CONS[c]));
      else out.push({ k: 'X', s: c });
    }

    // Insert a short 'e' to break up clusters: initial CC (ketab) and CCC runs
    // (ferhe-ng), while allowing coda+onset (bor-dan) and final CC (dast, fekr).
    let res = '';
    let run = 0; // consecutive consonants in the output so far
    let vowelSeen = false;
    for (const it of out) {
      if (it.k === 'C') {
        if ((run === 1 && !vowelSeen) || run >= 2) {
          res += 'e';
          run = 0;
          vowelSeen = true;
        }
        run++;
      } else {
        run = 0;
        if (it.k === 'V') vowelSeen = true;
      }
      res += it.s;
    }
    return res;
  }

  // Returns {fi, known, gloss?}; known=false means at least part of it came from the rule fallback (a guess).
  function wordInfo(w) {
    w = w.replace(/^\u200c+|\u200c+$/g, '');
    if (!w) return { fi: '', known: true };
    if (LEX[w]) return { fi: LEX[w], known: true, gloss: LEXG[w] };

    // Conjugated verbs (generated from stems), with or without ZWNJ
    const verb = VERBS.lookup(w);
    if (verb) return { fi: verb.fi, known: true, gloss: verb.gloss };

    const join = (infos, sep) => ({
      fi: infos.map((i) => i.fi).join(sep),
      known: infos.every((i) => i.known),
      gloss: infos.every((i) => i.gloss) ? infos.map((i) => i.gloss).join(' + ') : undefined,
    });

    // Known stem + possessive/plural suffix (مادرم, دوست‌هام, کتابشون)
    const bare = w.replace(/\u200c/g, '');
    for (const [sfa, sfi, sgl] of SUFFIXES) {
      if (bare.length - sfa.length < 2 || !bare.endsWith(sfa)) continue;
      const stem = bare.slice(0, -sfa.length);
      if (LEX[stem]) {
        return { fi: LEX[stem] + '-' + sfi, known: true, gloss: `${LEXG[stem]} + ${sgl}` };
      }
    }

    if (w.includes(ZWNJ)) return join(w.split(ZWNJ).filter(Boolean).map(wordInfo), '-');
    // Plural -ها on an unknown stem
    if (w.length > 3 && w.endsWith('ها')) {
      return join([wordInfo(w.slice(0, -2)), { fi: 'ha', known: true, gloss: 'plural' }], '-');
    }
    // Attached می-/نمی- prefixes on something not in the verb tables
    if (w.length > 3 && w.startsWith('نمی')) {
      return join([{ fi: 'nemi', known: true, gloss: '(not, ongoing)' }, wordInfo(w.slice(3))], '-');
    }
    if (w.length > 3 && w.startsWith('می')) {
      return join([{ fi: 'mi', known: true, gloss: '(ongoing)' }, wordInfo(w.slice(2))], '-');
    }
    return { fi: rules(w), known: false };
  }

  const translitWord = (w) => wordInfo(w).fi;

  const WORD_RE = /[ء-ۓ‌]+/g;

  function transliterate(text) {
    if (!text) return '';
    return normalize(text).replace(WORD_RE, translitWord);
  }

  // [{fa, fi, known} for words | {text} for everything else], in order.
  function tokens(text) {
    if (!text) return [];
    const out = [];
    let last = 0;
    const s = normalize(text);
    for (const m of s.matchAll(WORD_RE)) {
      if (m.index > last) out.push({ text: s.slice(last, m.index) });
      const fa = m[0].replace(/^‌+|‌+$/g, '');
      if (fa) out.push({ fa, ...wordInfo(fa) });
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push({ text: s.slice(last) });
    return out;
  }

  const api = { transliterate, translitWord, wordInfo, tokens, normalize };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PersianTranslit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
