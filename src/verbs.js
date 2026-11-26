// Verb conjugation generator: builds Persian-form -> {fi, gloss} for common verbs
// (present formal + colloquial, past, imperfect, subjunctive, imperative, negatives).
// To add a verb, append one entry to VERBS. Forms are keyed WITHOUT ZWNJ (lookup strips it).
(function (root) {
  const PC = root.PersianCore || { subjunctivePrefix: () => 'be' }; // no global PersianCore outside the extension (e.g. under Node)
  // fa/fi pairs are [persian, finglish]. en = [base, 3rd-person, past, participle].
  // imp = [persian stem after ب/ن, positive imperative finglish, finglish stem for the negative].
  const VERBS = [
    { inf: 'khastan', en: ['want', 'wants', 'wanted', 'wanted'], past: [['خواست', 'khast']], formal: [['خواه', 'khah']], coll: [['خوا', 'khaa']], imp: ['خواه', 'bekhah', 'khah'] },
    { inf: 'raftan', en: ['go', 'goes', 'went', 'gone'], past: [['رفت', 'raft']], formal: [['رو', 'rav']], coll: [['ر', 'r']], imp: ['رو', 'boro', 'ro'] },
    { inf: 'amadan', en: ['come', 'comes', 'came', 'come'], past: [['آمد', 'amad'], ['اومد', 'oomad']], formal: [], coll: [['ا', 'a']] },
    { inf: 'goftan', en: ['say', 'says', 'said', 'said'], past: [['گفت', 'goft']], formal: [['گو', 'goy']], coll: [['گ', 'g']], imp: ['گو', 'bego', 'goo'] },
    { inf: 'didan', en: ['see', 'sees', 'saw', 'seen'], past: [['دید', 'did']], formal: [['بین', 'bin']], coll: [['بین', 'bin']], imp: ['بین', 'bebin', 'bin'] },
    { inf: 'dadan', en: ['give', 'gives', 'gave', 'given'], past: [['داد', 'dad']], formal: [['ده', 'dah']], coll: [['د', 'd']], imp: ['ده', 'bedeh', 'deh'] },
    { inf: 'gereftan', en: ['take', 'takes', 'took', 'taken'], past: [['گرفت', 'gereft']], formal: [['گیر', 'gir']], coll: [['گیر', 'gir']], imp: ['گیر', 'begir', 'gir'] },
    { inf: 'shodan', enInf: 'become', en: ['become', 'becomes', 'became', 'become'], past: [['شد', 'shod']], formal: [['شو', 'shav']], coll: [['ش', 'sh']], imp: ['شو', 'besho', 'sho'] },
    { inf: 'khordan', enInf: 'eat/drink', en: ['eat', 'eats', 'ate', 'eaten'], past: [['خورد', 'khord']], formal: [['خور', 'khor']], coll: [['خور', 'khor']], imp: ['خور', 'bokhor', 'khor'] },
    { inf: 'kardan', enInf: 'do/make', en: ['do', 'does', 'did', 'done'], past: [['کرد', 'kard']], formal: [['کن', 'kon']], coll: [['کن', 'kon']], imp: ['کن', 'bokon', 'kon'] },
    { inf: 'danestan', enInf: 'know', en: ['know', 'knows', 'knew', 'known'], past: [['دانست', 'danest'], ['دونست', 'doonest']], formal: [['دان', 'dan']], coll: [['دون', 'doon']], imp: ['دان', 'bedan', 'dan'] },
    { inf: 'tavanestan', enInf: 'be able', en: ['can', 'can', 'could', 'been able'], negPres: "can't", negPast: "couldn't", past: [['توانست', 'tavanest'], ['تونست', 'toonest']], formal: [['توان', 'tavan']], coll: [['تون', 'toon']] },
    { inf: 'dashtan', enInf: 'have', en: ['have', 'has', 'had', 'had'], past: [['داشت', 'dasht']], formal: [], coll: [] },
    { inf: 'gozashtan', enInf: 'put/let', en: ['put', 'puts', 'put', 'put'], past: [['گذاشت', 'gozasht']], formal: [['گذار', 'gozar']], coll: [['ذار', 'zar']], imp: ['ذار', 'bezar', 'zar'] },
    { inf: 'fahmidan', enInf: 'understand', en: ['understand', 'understands', 'understood', 'understood'], past: [['فهمید', 'fahmid']], formal: [['فهم', 'fahm']], coll: [['فهم', 'fahm']], imp: ['فهم', 'befahm', 'fahm'] },
    { inf: 'neveshtan', enInf: 'write', en: ['write', 'writes', 'wrote', 'written'], past: [['نوشت', 'nevesht']], formal: [['نویس', 'nevis']], coll: [['نویس', 'nevis']], imp: ['نویس', 'benevis', 'nevis'] },
    { inf: 'khandan', enInf: 'read/sing', en: ['read', 'reads', 'read', 'read'], past: [['خواند', 'khand']], formal: [['خوان', 'khan']], coll: [['خون', 'khoon']], imp: ['خون', 'bekhoon', 'khoon'] },
    { inf: 'porsidan', enInf: 'ask', en: ['ask', 'asks', 'asked', 'asked'], past: [['پرسید', 'porsid']], formal: [['پرس', 'pors']], coll: [['پرس', 'pors']], imp: ['پرس', 'bepors', 'pors'] },
    { inf: 'zadan', enInf: 'hit/strike/play', en: ['hit', 'hits', 'hit', 'hit'], past: [['زد', 'zad']], formal: [['زن', 'zan']], coll: [['زن', 'zan']], imp: ['زن', 'bezan', 'zan'] },
    { inf: 'bordan', enInf: 'take away/carry', en: ['take away', 'takes away', 'took away', 'taken away'], past: [['برد', 'bord']], formal: [['بر', 'bar']], coll: [['بر', 'bar']], imp: ['بر', 'bebar', 'bar'] },
    { inf: 'avardan', enInf: 'bring', en: ['bring', 'brings', 'brought', 'brought'], past: [['آورد', 'avard']], formal: [['آور', 'avar']], coll: [['آر', 'ar']], imp: ['یار', 'biyar', 'yar'] },
    { inf: 'mandan', enInf: 'stay', en: ['stay', 'stays', 'stayed', 'stayed'], past: [['ماند', 'mand'], ['موند', 'moond']], formal: [['مان', 'man']], coll: [['مون', 'moon']], imp: ['مون', 'bemoon', 'moon'] },
    { inf: 'shenakhtan', enInf: 'know (a person)', en: ['know', 'knows', 'knew', 'known'], past: [['شناخت', 'shenakht']], formal: [['شناس', 'shenas']], coll: [['شناس', 'shenas']] },
    { inf: 'istadan', enInf: 'stand/stop', en: ['stand', 'stands', 'stood', 'stood'], past: [['ایستاد', 'istad'], ['وایساد', 'vaisad']], formal: [['ایست', 'ist']], coll: [['وایس', 'vais']], imp: ['وایس', 'bevais', 'vais'] },
    { inf: 'neshastan', enInf: 'sit', en: ['sit', 'sits', 'sat', 'sat'], past: [['نشست', 'neshast']], formal: [['نشین', 'neshin']], coll: [['شین', 'shin']], imp: ['شین', 'beshin', 'shin'] },
    { inf: 'khabidan', enInf: 'sleep', en: ['sleep', 'sleeps', 'slept', 'slept'], past: [['خوابید', 'khabid']], formal: [['خواب', 'khab']], coll: [['خواب', 'khab']], imp: ['خواب', 'bekhab', 'khab'] },
    { inf: 'sakhtan', enInf: 'make/build', en: ['build', 'builds', 'built', 'built'], past: [['ساخت', 'sakht']], formal: [['ساز', 'saz']], coll: [['ساز', 'saz']], imp: ['ساز', 'besaz', 'saz'] },
    { inf: 'ferestadan', enInf: 'send', en: ['send', 'sends', 'sent', 'sent'], past: [['فرستاد', 'ferestad']], formal: [['فرست', 'ferest']], coll: [['فرست', 'ferest']], imp: ['فرست', 'beferest', 'ferest'] },
    { inf: 'pooshidan', enInf: 'wear', en: ['wear', 'wears', 'wore', 'worn'], past: [['پوشید', 'pooshid']], formal: [['پوش', 'poosh']], coll: [['پوش', 'poosh']], imp: ['پوش', 'bepoosh', 'poosh'] },
    { inf: 'davidan', enInf: 'run', en: ['run', 'runs', 'ran', 'run'], past: [['دوید', 'david']], formal: [['دو', 'dav']], coll: [] },
    { inf: 'oftadan', enInf: 'fall/happen', en: ['fall', 'falls', 'fell', 'fallen'], past: [['افتاد', 'oftad']], formal: [['افت', 'oft']], coll: [['افت', 'oft']], imp: ['افت', 'beoft', 'oft'] },
    { inf: 'tarsidan', enInf: 'be afraid', en: ['fear', 'fears', 'feared', 'feared'], past: [['ترسید', 'tarsid']], formal: [['ترس', 'tars']], coll: [['ترس', 'tars']], imp: ['ترس', 'betars', 'tars'] },
    { inf: 'khandidan', enInf: 'laugh', en: ['laugh', 'laughs', 'laughed', 'laughed'], past: [['خندید', 'khandid']], formal: [['خند', 'khand']], coll: [['خند', 'khand']], imp: ['خند', 'bekhand', 'khand'] },
    { inf: 'keshidan', enInf: 'pull/draw', en: ['pull', 'pulls', 'pulled', 'pulled'], past: [['کشید', 'keshid']], formal: [['کش', 'kesh']], coll: [['کش', 'kesh']], imp: ['کش', 'bekesh', 'kesh'] },
    { inf: 'residan', enInf: 'arrive', en: ['arrive', 'arrives', 'arrived', 'arrived'], past: [['رسید', 'resid']], formal: [['رس', 'ras']], coll: [['رس', 'res']], imp: ['رس', 'beres', 'res'] },
    { inf: 'shenidan', enInf: 'hear', en: ['hear', 'hears', 'heard', 'heard'], past: [['شنید', 'shenid']], formal: [['شنو', 'shenav']], coll: [['شنو', 'shenav']], imp: ['شنو', 'beshnav', 'shenav'] },
    { inf: 'kharidan', enInf: 'buy', en: ['buy', 'buys', 'bought', 'bought'], past: [['خرید', 'kharid']], formal: [['خر', 'khar']], coll: [['خر', 'khar']], imp: ['خر', 'bekhar', 'khar'] },
    { inf: 'forookhtan', enInf: 'sell', en: ['sell', 'sells', 'sold', 'sold'], past: [['فروخت', 'forookht']], formal: [['فروش', 'foroosh']], coll: [['فروش', 'foroosh']], imp: ['فروش', 'beforoosh', 'foroosh'] },
    { inf: 'bastan', enInf: 'close/tie', en: ['close', 'closes', 'closed', 'closed'], past: [['بست', 'bast']], formal: [['بند', 'band']], coll: [['بند', 'band']], imp: ['بند', 'beband', 'band'] },
    { inf: 'bakhshidan', enInf: 'forgive', en: ['forgive', 'forgives', 'forgave', 'forgiven'], past: [['بخشید', 'bakhshid']], formal: [['بخش', 'bakhsh']], coll: [['بخش', 'bakhsh']], imp: ['بخش', 'bebakhsh', 'bakhsh'] },
  ];

  // Endings: [persian, finglish, who, thirdPerson]
  const E_PRES_FORMAL = [['م', 'am', 'I'], ['ی', 'i', 'you'], ['د', 'ad', 'he/she', 1], ['یم', 'im', 'we'], ['ید', 'id', 'you (pl.)'], ['ند', 'and', 'they']];
  const E_PRES_COLL_C = [['م', 'am', 'I'], ['ی', 'i', 'you'], ['ه', 'eh', 'he/she', 1], ['یم', 'im', 'we'], ['ید', 'id', 'you (pl.)'], ['ن', 'an', 'they']];
  const E_PRES_COLL_V = [['م', 'm', 'I'], ['ی', 'y', 'you'], ['د', 'd', 'he/she', 1], ['یم', 'ym', 'we'], ['ید', 'yd', 'you (pl.)'], ['ن', 'n', 'they']];
  const E_PAST = [['م', 'am', 'I'], ['ی', 'i', 'you'], ['', '', 'he/she', 1], ['یم', 'im', 'we'], ['ید', 'id', 'you (pl.)'], ['ند', 'and', 'they'], ['ن', 'an', 'they']];

  const map = new Map();
  const put = (fa, fi, gloss) => {
    if (!map.has(fa)) map.set(fa, { fi, gloss });
  };

  for (const v of VERBS) {
    const [base, third, past, pp] = v.en;
    const tag = ` (${v.inf}, to ${v.enInf || base})`;
    const negP = (isThird) => v.negPres || `${isThird ? "doesn't" : "don't"} ${base}`;
    const negPa = v.negPast || `didn't ${base}`;
    const presVerb = (isThird, neg) => (neg ? negP(isThird) : isThird ? third : base);

    // Present / subjunctive (formal and colloquial stems)
    const stems = [
      ...v.formal.map(([fa, fi]) => [fa, fi, E_PRES_FORMAL]),
      ...v.coll.map(([fa, fi]) => [fa, fi, /[aeiou]$/.test(fi) ? E_PRES_COLL_V : E_PRES_COLL_C]),
    ];
    for (const [sfa, sfi, ends] of stems) {
      const bePrefix = PC.subjunctivePrefix(sfi); // 'be' or 'bo' (بکنم vs بخورم) - see persian-core
      for (const [efa, efi, who, isThird] of ends) {
        const fa = sfa + efa;
        const fi = sfi + efi;
        put('می' + fa, 'mi-' + fi, `${who} ${presVerb(isThird, false)}${tag}`);
        put('نمی' + fa, 'nemi-' + fi, `${who} ${presVerb(isThird, true)}${tag}`);
        put('ب' + fa, bePrefix + fi, `(that) ${who} ${presVerb(false, false)}${tag}`);
        put('ن' + fa, 'na' + fi, `(that) ${who} ${presVerb(false, true)}${tag}`);
      }
    }

    // Past, imperfect past, participle
    for (const [sfa, sfi] of v.past) {
      for (const [efa, efi, who] of E_PAST) {
        const fa = sfa + efa;
        const fi = sfi + efi;
        put(fa, fi, `${who} ${past}${tag}`);
        put('ن' + fa, 'na' + fi, `${who} ${negPa}${tag}`);
        put('می' + fa, 'mi-' + fi, `${who} used to ${base}${tag}`);
        put('نمی' + fa, 'nemi-' + fi, `${who} didn't use to ${base}${tag}`);
      }
      put(sfa + 'ه', sfi + 'eh', `${pp}${tag}`);
    }

    // Imperatives
    if (v.imp) {
      const [ifa, ifi, istem] = v.imp;
      put('ب' + ifa, ifi, `${base}!${tag}`);
      put('ن' + ifa, 'na' + istem, `don't ${base}!${tag}`);
    }
  }

  const api = {
    lookup: (word) => map.get(word.replace(/‌/g, '')) || null,
    size: map.size,
    VERBS,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PersianVerbs = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
