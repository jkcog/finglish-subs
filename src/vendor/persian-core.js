// Vendored build of github.com/jkcog/persian-core (dist/persian-core.global.js),
// commit 0a31c7b. Shared lexicon/transliteration logic also used by noghteh and
// harf-bezan. Do not hand-edit: regenerate with `npm run build` in that repo and
// copy dist/persian-core.global.js here.
var PersianCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all2) => {
    for (var name in all2)
      __defProp(target, name, { get: all2[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var src_exports = {};
  __export(src_exports, {
    SHORT_VOWELS: () => SHORT_VOWELS,
    alignVowels: () => alignVowels,
    all: () => all,
    lookup: () => lookup,
    normalizeKey: () => normalizeKey,
    primaryLatinSound: () => primaryLatinSound,
    subjunctivePrefix: () => subjunctivePrefix,
    toAscii: () => toAscii,
    toMacron: () => toMacron,
    validateEntry: () => validateEntry
  });

  // src/translit/vowelSlots.js
  var SHORT_VOWELS = ["a", "e", "o"];
  var consonant = (...latin) => latin.map((l) => ({ latin: l, kind: "consonant" }));
  var long = (...latin) => latin.map((l) => ({ latin: l, kind: "long" }));
  var SOUNDS = {
    // NB: ا's long sound is deliberately *not* extended to plain 'a' the way
    // و/ه are to 'o'/'e' below - ا already matches plain 'a' word-initially as
    // a short-vowel carrier (اسب "asb"), and extending its long option too
    // would make every such word ambiguous between "short a" and "long ā"
    // with no way to tell them apart. The handful of words this leaves
    // unaligned (خواست-family, آمد-family - و silent before a long ا spelled
    // plain "a") fail honestly instead, and get flagged in seed.notes.md.
    \u0627: long("\u0101"),
    \u0622: long("\u0101"),
    \u0628: consonant("b"),
    \u067E: consonant("p"),
    \u062A: consonant("t"),
    \u062B: consonant("s"),
    \u062C: consonant("j"),
    \u0686: consonant("ch"),
    \u062D: consonant("h"),
    \u062E: consonant("kh"),
    \u062F: consonant("d"),
    \u0630: consonant("z"),
    \u0631: consonant("r"),
    \u0632: consonant("z"),
    \u0698: consonant("zh"),
    \u0633: consonant("s"),
    \u0634: consonant("sh"),
    \u0635: consonant("s"),
    \u0636: consonant("z"),
    \u0637: consonant("t"),
    \u0638: consonant("z"),
    \u0639: [
      { latin: "'", kind: "consonant" },
      { latin: "", kind: "silent" }
    ],
    \u063A: consonant("gh"),
    \u0641: consonant("f"),
    \u0642: consonant("gh", "q"),
    \u06A9: consonant("k"),
    \u06AF: consonant("g"),
    \u0644: consonant("l"),
    \u0645: consonant("m"),
    \u0646: consonant("n"),
    \u0648: [
      ...consonant("v"),
      ...long("\u016B", "oo", "u"),
      // 'u': extension, harf-bezan's "unjā" convention
      // extension: a bare 'o' is genuinely ambiguous between long and short -
      // both options match the identical input, so alignVowels's widened
      // ambiguity check (below) correctly flags it rather than silently
      // picking one. Long listed first so an existing caller that ignores
      // `ambiguous` keeps today's output where it happened to be right.
      { latin: "o", kind: "long" },
      { latin: "o", kind: "short" },
      { latin: "", kind: "silent" }
    ],
    \u0647: [
      ...consonant("h"),
      { latin: "eh", kind: "long" },
      { latin: "e", kind: "long" }
    ],
    // 'iy' is the glide in پیاز "Piyāz"; the short i is unwritten but fused with ی.
    \u06CC: [...consonant("y", "iy"), ...long("\u012B", "i")]
  };
  var KNOWN_LETTERS = new Set(Object.keys(SOUNDS));
  var primaryLatinSound = (ch) => SOUNDS[ch][0].latin;
  var optionsFor = (ch, index, next) => {
    const sounds = SOUNDS[ch];
    if (!sounds) throw new Error(`No sounds defined for "${ch}"`);
    const out = [];
    for (const s of sounds) {
      out.push(s);
      if (s.kind === "consonant" && s.latin) {
        out.push({ latin: s.latin + s.latin, kind: "consonant", doubled: true });
      }
    }
    if (index === 0 && (ch === "\u0627" || ch === "\u0639")) {
      for (const v of SHORT_VOWELS) out.push({ latin: v, kind: "carrier", vowel: v });
      if (ch === "\u0627" && next === "\u06CC") out.push({ latin: "", kind: "silent" });
      if (ch === "\u0627" && next === "\u0648") out.push({ latin: "", kind: "silent" });
    }
    return out;
  };
  var normalise = (s) => s.toLowerCase().replace(/[’‘]/g, "'");
  var alignAll = (chars, latin) => {
    const walk = (i, j) => {
      if (i === chars.length) return j === latin.length ? [{ letters: [], slots: [] }] : [];
      const results = [];
      const starts = [{ j, slot: null }];
      if (i > 0 && SHORT_VOWELS.includes(latin[j])) {
        starts.push({ j: j + 1, slot: { on: i - 1, vowel: latin[j] } });
      }
      for (const start of starts) {
        for (const opt of optionsFor(chars[i], i, chars[i + 1])) {
          if (!latin.startsWith(opt.latin, start.j)) continue;
          for (const rest of walk(i + 1, start.j + opt.latin.length)) {
            const letter = { kind: opt.kind, latin: opt.latin };
            if (opt.doubled) letter.doubled = true;
            const slots = [];
            if (start.slot) slots.push(start.slot);
            if (opt.kind === "carrier") slots.push({ on: i, vowel: opt.vowel });
            results.push({
              letters: [letter, ...rest.letters],
              slots: [...slots, ...rest.slots]
            });
          }
        }
      }
      return results;
    };
    return walk(0, 0);
  };
  var alignVowels = (persian, transliteration) => {
    const chars = [...persian];
    const alignments = alignAll(chars, normalise(transliteration));
    if (alignments.length === 0) return { ok: false, slots: [], letters: [], ambiguous: false };
    const fewest = Math.min(...alignments.map((a) => a.slots.length));
    const best = alignments.filter((a) => a.slots.length === fewest);
    const normaliseForTie = (l) => l.kind === "carrier" ? { kind: "silent", latin: "" } : l;
    const key = (a) => JSON.stringify([a.letters.map(normaliseForTie), a.slots]);
    const distinct = new Set(best.map(key));
    return { ok: true, ...best[0], ambiguous: distinct.size > 1 };
  };

  // src/translit/macron.js
  var ASCII_MAP = { \u0101: "a", \u012B: "ee", \u016B: "oo" };
  var toAscii = (canonical) => canonical.normalize("NFC").replace(/[āīū]/g, (ch) => ASCII_MAP[ch]);
  var LONG_VOWEL_FOR = { \u0627: "\u0101", \u0622: "\u0101", \u0648: "\u016B", \u06CC: "\u012B", \u0647: "eh" };
  var toMacron = (persian, transliteration) => {
    const clean = persian.normalize("NFC").replace(/‌/g, "");
    const chars = [...clean];
    const aligned = alignVowels(clean, transliteration);
    if (!aligned.ok) return { ok: false, canonical: null, ambiguous: false };
    let canonical = "";
    chars.forEach((ch, i) => {
      const letter = aligned.letters[i];
      const slot = aligned.slots.find((s) => s.on === i);
      if (letter.kind === "carrier") {
        canonical += slot ? slot.vowel : "";
        return;
      }
      if (letter.kind === "consonant") canonical += letter.latin;
      else if (letter.kind === "long") canonical += LONG_VOWEL_FOR[ch];
      else if (letter.kind === "short") canonical += letter.latin;
      if (slot) canonical += slot.vowel;
    });
    return { ok: true, canonical, ambiguous: aligned.ambiguous };
  };

  // src/translit/prefixHarmony.js
  var BO_STEMS = /* @__PURE__ */ new Set(["kon", "khor"]);
  var subjunctivePrefix = (stemLatin) => BO_STEMS.has(stemLatin) ? "bo" : "be";

  // src/lexicon/schema.js
  var REGISTERS = /* @__PURE__ */ new Set(["formal", "colloquial"]);
  var PART_ROLES = /* @__PURE__ */ new Set(["prefix", "stem", "ending", "neg", "plain"]);
  var isString = (v) => typeof v === "string";
  var isNonEmptyString = (v) => isString(v) && v.length > 0;
  var validateParts = (parts, errors) => {
    if (parts === void 0) return;
    if (!Array.isArray(parts)) {
      errors.push("parts must be an array when present");
      return;
    }
    parts.forEach((part, i) => {
      if (!part || typeof part !== "object") {
        errors.push(`parts[${i}] must be an object`);
        return;
      }
      if (!isNonEmptyString(part.fin)) errors.push(`parts[${i}].fin must be a non-empty string`);
      if (!PART_ROLES.has(part.role)) {
        errors.push(`parts[${i}].role must be one of ${[...PART_ROLES].join("|")}, got ${JSON.stringify(part.role)}`);
      }
      if (!isNonEmptyString(part.gloss)) errors.push(`parts[${i}].gloss must be a non-empty string`);
    });
  };
  var validateSources = (sources, errors) => {
    if (sources === void 0) return;
    if (!sources || typeof sources !== "object") {
      errors.push("sources must be an object when present");
      return;
    }
    if (sources.noghteh !== void 0 && typeof sources.noghteh !== "number") {
      errors.push("sources.noghteh must be a number (words.json id)");
    }
    if (sources.harfBezan !== void 0 && !isNonEmptyString(sources.harfBezan)) {
      errors.push("sources.harfBezan must be a string (lesson step id)");
    }
  };
  var validateEntry = (entry) => {
    const errors = [];
    if (!entry || typeof entry !== "object") {
      return { ok: false, errors: ["entry must be an object"] };
    }
    if (!isNonEmptyString(entry.persian)) errors.push("persian must be a non-empty string");
    if (!isNonEmptyString(entry.canonical)) errors.push("canonical must be a non-empty string");
    if (!isNonEmptyString(entry.pos)) errors.push("pos must be a non-empty string");
    if (!isNonEmptyString(entry.gloss)) errors.push("gloss must be a non-empty string");
    if (!REGISTERS.has(entry.register)) {
      errors.push(`register must be one of ${[...REGISTERS].join("|")}, got ${JSON.stringify(entry.register)}`);
    }
    if (typeof entry.reviewed !== "boolean") errors.push("reviewed must be a boolean");
    if (isString(entry.persian) && entry.persian.normalize("NFC") !== entry.persian) {
      errors.push("persian must be NFC-normalised");
    }
    validateParts(entry.parts, errors);
    validateSources(entry.sources, errors);
    return { ok: errors.length === 0, errors };
  };

  // src/lexicon/seed.json
  var seed_default = [
    {
      persian: "\u0622\u0628",
      canonical: "\u0101b",
      register: "formal",
      pos: "noun",
      gloss: "water",
      reviewed: false,
      sources: {
        noghteh: 12
      }
    },
    {
      persian: "\u0622\u0628\u06CC",
      canonical: "\u0101b\u012B",
      register: "formal",
      pos: "noun",
      gloss: "blue",
      reviewed: false,
      sources: {
        noghteh: 230
      }
    },
    {
      persian: "\u0622\u062A\u0634",
      canonical: "\u0101tash",
      register: "formal",
      pos: "noun",
      gloss: "fire",
      reviewed: false,
      sources: {
        noghteh: 212
      }
    },
    {
      persian: "\u0622\u062E\u0631",
      canonical: "akhar",
      register: "formal",
      pos: "other",
      gloss: "last/end",
      reviewed: false
    },
    {
      persian: "\u0622\u062E\u0631\u06CC\u0646",
      canonical: "akharin",
      register: "formal",
      pos: "other",
      gloss: "last",
      reviewed: false
    },
    {
      persian: "\u0622\u062F\u0645",
      canonical: "adam",
      register: "formal",
      pos: "other",
      gloss: "person/man",
      reviewed: false
    },
    {
      persian: "\u0622\u0631\u0647",
      canonical: "\u0101reh",
      register: "colloquial",
      pos: "other",
      gloss: "yes",
      reviewed: false,
      sources: {
        harfBezan: "l05-05"
      }
    },
    {
      persian: "\u0622\u0633\u0645\u0627\u0646",
      canonical: "\u0101sem\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "sky",
      reviewed: false,
      sources: {
        noghteh: 201
      }
    },
    {
      persian: "\u0622\u0641\u062A\u0627\u0628",
      canonical: "\u0101ft\u0101b",
      register: "formal",
      pos: "noun",
      gloss: "sunshine",
      reviewed: false,
      sources: {
        noghteh: 40
      }
    },
    {
      persian: "\u0622\u0642\u0627",
      canonical: "agha",
      register: "formal",
      pos: "other",
      gloss: "mister/sir",
      reviewed: false
    },
    {
      persian: "\u0622\u0642\u0627\u06CC",
      canonical: "aghaye",
      register: "formal",
      pos: "other",
      gloss: "Mr.",
      reviewed: false
    },
    {
      persian: "\u0622\u0645\u062F",
      canonical: "amad",
      register: "formal",
      pos: "other",
      gloss: "came",
      reviewed: false
    },
    {
      persian: "\u0622\u0645\u062F\u0645",
      canonical: "amadam",
      register: "formal",
      pos: "other",
      gloss: "I came",
      reviewed: false
    },
    {
      persian: "\u0622\u0645\u062F\u0646",
      canonical: "amadan",
      register: "formal",
      pos: "verb",
      gloss: "to come",
      reviewed: false
    },
    {
      persian: "\u0622\u0646",
      canonical: "an",
      register: "formal",
      pos: "other",
      gloss: "that",
      reviewed: false
    },
    {
      persian: "\u0622\u0646\u062C\u0627",
      canonical: "anja",
      register: "formal",
      pos: "other",
      gloss: "there",
      reviewed: false
    },
    {
      persian: "\u0622\u0646\u0647\u0627",
      canonical: "anha",
      register: "formal",
      pos: "other",
      gloss: "they",
      reviewed: false
    },
    {
      persian: "\u0622\u06CC\u0646\u0647",
      canonical: "\u0101yeneh",
      register: "formal",
      pos: "noun",
      gloss: "mirror",
      reviewed: false,
      sources: {
        noghteh: 164
      }
    },
    {
      persian: "\u0627\u0628\u0631",
      canonical: "abr",
      register: "formal",
      pos: "noun",
      gloss: "cloud",
      reviewed: false,
      sources: {
        noghteh: 199
      }
    },
    {
      persian: "\u0627\u0628\u0631\u0648",
      canonical: "abr\u016B",
      register: "formal",
      pos: "noun",
      gloss: "eyebrow",
      reviewed: false,
      sources: {
        noghteh: 189
      }
    },
    {
      persian: "\u0627\u062A\u0627\u0642",
      canonical: "ot\u0101gh",
      register: "formal",
      pos: "noun",
      gloss: "room",
      reviewed: false,
      sources: {
        noghteh: 170
      }
    },
    {
      persian: "\u0627\u0632",
      canonical: "az",
      register: "formal",
      pos: "other",
      gloss: "from/of",
      reviewed: false
    },
    {
      persian: "\u0627\u0633\u0628",
      canonical: "asb",
      register: "formal",
      pos: "noun",
      gloss: "horse",
      reviewed: false,
      sources: {
        noghteh: 9
      }
    },
    {
      persian: "\u0627\u0633\u062A",
      canonical: "ast",
      register: "formal",
      pos: "other",
      gloss: "is",
      reviewed: false
    },
    {
      persian: "\u0627\u0633\u0645",
      canonical: "esm",
      register: "formal",
      pos: "noun",
      gloss: "name",
      reviewed: false,
      sources: {
        noghteh: 71
      }
    },
    {
      persian: "\u0627\u06AF\u0631",
      canonical: "agar",
      register: "formal",
      pos: "other",
      gloss: "if",
      reviewed: false
    },
    {
      persian: "\u0627\u06AF\u0647",
      canonical: "ageh",
      register: "colloquial",
      pos: "other",
      gloss: "if",
      reviewed: false
    },
    {
      persian: "\u0627\u0644\u0627\u0646",
      canonical: "al\u0101n",
      register: "colloquial",
      pos: "other",
      gloss: "right now",
      reviewed: false,
      sources: {
        harfBezan: "l03-22"
      }
    },
    {
      persian: "\u0627\u0644\u0628\u062A\u0647",
      canonical: "albateh",
      register: "formal",
      pos: "other",
      gloss: "of course",
      reviewed: false
    },
    {
      persian: "\u0627\u0645\u0627",
      canonical: "amma",
      register: "formal",
      pos: "other",
      gloss: "but",
      reviewed: false
    },
    {
      persian: "\u0627\u0645\u0631\u0648\u0632",
      canonical: "emr\u016Bz",
      register: "formal",
      pos: "noun",
      gloss: "today",
      reviewed: false,
      sources: {
        noghteh: 72,
        harfBezan: "l03-30"
      }
    },
    {
      persian: "\u0627\u0645\u0634\u0628",
      canonical: "emshab",
      register: "colloquial",
      pos: "other",
      gloss: "tonight",
      reviewed: false,
      sources: {
        harfBezan: "l03-32"
      }
    },
    {
      persian: "\u0627\u0645\u06CC\u062F",
      canonical: "om\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "hope",
      reviewed: false
    },
    {
      persian: "\u0627\u0646\u0627\u0631",
      canonical: "an\u0101r",
      register: "formal",
      pos: "noun",
      gloss: "pomegranate",
      reviewed: false,
      sources: {
        noghteh: 121
      }
    },
    {
      persian: "\u0627\u0646\u062C\u06CC\u0631",
      canonical: "anj\u012Br",
      register: "formal",
      pos: "noun",
      gloss: "fig",
      reviewed: false,
      sources: {
        noghteh: 55
      }
    },
    {
      persian: "\u0627\u0646\u06AF\u0634\u062A",
      canonical: "angosht",
      register: "formal",
      pos: "noun",
      gloss: "finger",
      reviewed: false,
      sources: {
        noghteh: 184
      }
    },
    {
      persian: "\u0627\u0646\u06AF\u0634\u062A\u0631",
      canonical: "angoshtar",
      register: "formal",
      pos: "noun",
      gloss: "ring",
      reviewed: false,
      sources: {
        noghteh: 174
      }
    },
    {
      persian: "\u0627\u0646\u06AF\u0644\u06CC\u0633\u06CC",
      canonical: "engel\u012Bs\u012B",
      register: "formal",
      pos: "other",
      gloss: "English",
      reviewed: false
    },
    {
      persian: "\u0627\u0646\u06AF\u0648\u0631",
      canonical: "ang\u016Br",
      register: "formal",
      pos: "noun",
      gloss: "grape",
      reviewed: false,
      sources: {
        noghteh: 122
      }
    },
    {
      persian: "\u0627\u0648",
      canonical: "\u016B",
      register: "formal",
      pos: "other",
      gloss: "he/she",
      reviewed: false
    },
    {
      persian: "\u0627\u0648\u0644",
      canonical: "avval",
      register: "formal",
      pos: "noun",
      gloss: "first",
      reviewed: false,
      sources: {
        noghteh: 267
      }
    },
    {
      persian: "\u0627\u0648\u0644\u06CC\u0646",
      canonical: "aval\u012Bn",
      register: "formal",
      pos: "other",
      gloss: "first",
      reviewed: false
    },
    {
      persian: "\u0627\u0648\u0645\u062F",
      canonical: "\u016Bmad",
      register: "colloquial",
      pos: "other",
      gloss: "came",
      reviewed: false
    },
    {
      persian: "\u0627\u0648\u0645\u062F\u0645",
      canonical: "\u016Bmadam",
      register: "colloquial",
      pos: "verb",
      gloss: "I came",
      reviewed: false,
      parts: [
        {
          fin: "omad",
          role: "stem",
          gloss: "came (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-18"
      }
    },
    {
      persian: "\u0627\u0648\u0645\u062F\u0646",
      canonical: "\u016Bmadan",
      register: "colloquial",
      pos: "verb",
      gloss: "to come",
      reviewed: false
    },
    {
      persian: "\u0627\u0648\u0645\u062F\u06CC",
      canonical: "\u016Bmad\u012B",
      register: "formal",
      pos: "other",
      gloss: "you came",
      reviewed: false
    },
    {
      persian: "\u0627\u0648\u0645\u062F\u06CC\u0645",
      canonical: "\u016Bmad\u012Bm",
      register: "colloquial",
      pos: "verb",
      gloss: "came (past stem) + we",
      reviewed: false,
      parts: [
        {
          fin: "omad",
          role: "stem",
          gloss: "came (past stem)"
        },
        {
          fin: "im",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l04-27"
      }
    },
    {
      persian: "\u0627\u0648\u0646",
      canonical: "\u016Bn",
      register: "colloquial",
      pos: "other",
      gloss: "that",
      reviewed: false,
      parts: [
        {
          fin: "un",
          role: "plain",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-27"
      }
    },
    {
      persian: "\u0627\u0648\u0646\u0627",
      canonical: "oona",
      register: "colloquial",
      pos: "other",
      gloss: "they",
      reviewed: false
    },
    {
      persian: "\u0627\u0648\u0646\u062C\u0627",
      canonical: "\u016Bnj\u0101",
      register: "colloquial",
      pos: "other",
      gloss: "there",
      reviewed: false,
      sources: {
        harfBezan: "l01-16"
      }
    },
    {
      persian: "\u0627\u0648\u0646\u0647\u0627",
      canonical: "oonha",
      register: "colloquial",
      pos: "other",
      gloss: "they",
      reviewed: false
    },
    {
      persian: "\u0627\u06CC\u0631\u0627\u0646",
      canonical: "\u012Br\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "Iran",
      reviewed: false,
      sources: {
        noghteh: 75
      }
    },
    {
      persian: "\u0627\u06CC\u0634\u0627\u0646",
      canonical: "ishan",
      register: "formal",
      pos: "other",
      gloss: "he/she(formal)",
      reviewed: false
    },
    {
      persian: "\u0627\u06CC\u0646",
      canonical: "\u012Bn",
      register: "formal",
      pos: "other",
      gloss: "this",
      reviewed: false
    },
    {
      persian: "\u0627\u06CC\u0646\u062C\u0627",
      canonical: "\u012Bnj\u0101",
      register: "colloquial",
      pos: "other",
      gloss: "here",
      reviewed: false,
      sources: {
        harfBezan: "l01-15"
      }
    },
    {
      persian: "\u0627\u06CC\u0646\u06A9\u0647",
      canonical: "\u012Bnkeh",
      register: "formal",
      pos: "other",
      gloss: "the fact that",
      reviewed: false
    },
    {
      persian: "\u0627\u06CC\u0646\u0647\u0627",
      canonical: "inha",
      register: "formal",
      pos: "other",
      gloss: "these",
      reviewed: false
    },
    {
      persian: "\u0628\u0627",
      canonical: "ba",
      register: "formal",
      pos: "other",
      gloss: "with",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0628\u0627",
      canonical: "b\u0101b\u0101",
      register: "formal",
      pos: "noun",
      gloss: "dad",
      reviewed: false,
      sources: {
        noghteh: 1
      }
    },
    {
      persian: "\u0628\u0627\u062F",
      canonical: "b\u0101d",
      register: "formal",
      pos: "noun",
      gloss: "wind",
      reviewed: false,
      sources: {
        noghteh: 200
      }
    },
    {
      persian: "\u0628\u0627\u062F\u0627\u0645",
      canonical: "b\u0101d\u0101m",
      register: "formal",
      pos: "noun",
      gloss: "almond",
      reviewed: false,
      sources: {
        noghteh: 25
      }
    },
    {
      persian: "\u0628\u0627\u0631\u0627\u0646",
      canonical: "b\u0101r\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "rain",
      reviewed: false,
      sources: {
        noghteh: 20
      }
    },
    {
      persian: "\u0628\u0627\u0632",
      canonical: "baz",
      register: "formal",
      pos: "other",
      gloss: "again/open",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0632\u0645",
      canonical: "bazam",
      register: "colloquial",
      pos: "other",
      gloss: "again",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0632\u0648",
      canonical: "b\u0101z\u016B",
      register: "formal",
      pos: "noun",
      gloss: "arm",
      reviewed: false,
      sources: {
        noghteh: 190
      }
    },
    {
      persian: "\u0628\u0627\u0634",
      canonical: "bash",
      register: "formal",
      pos: "other",
      gloss: "be!",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0634\u062F",
      canonical: "bashad",
      register: "formal",
      pos: "other",
      gloss: "may be",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0634\u0645",
      canonical: "basham",
      register: "formal",
      pos: "other",
      gloss: "I may be",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0634\u0646\u062F",
      canonical: "bashand",
      register: "formal",
      pos: "other",
      gloss: "they may be",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0634\u0647",
      canonical: "basheh",
      register: "formal",
      pos: "other",
      gloss: "okay/may be",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0634\u06CC",
      canonical: "bashi",
      register: "formal",
      pos: "other",
      gloss: "you may be",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u0634\u06CC\u062F",
      canonical: "bashid",
      register: "formal",
      pos: "other",
      gloss: "you (pl.) may be",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u063A",
      canonical: "b\u0101gh",
      register: "formal",
      pos: "noun",
      gloss: "garden",
      reviewed: false,
      sources: {
        noghteh: 194
      }
    },
    {
      persian: "\u0628\u0627\u0644\u0627",
      canonical: "bala",
      register: "formal",
      pos: "other",
      gloss: "up/above",
      reviewed: false
    },
    {
      persian: "\u0628\u0627\u06CC\u062F",
      canonical: "b\u0101yad",
      register: "colloquial",
      pos: "other",
      gloss: "must/should",
      reviewed: false,
      parts: [
        {
          fin: "b\u0101yad",
          role: "stem",
          gloss: "must / have to"
        }
      ],
      sources: {
        harfBezan: "l06-01"
      }
    },
    {
      persian: "\u0628\u0628\u062E\u0634\u06CC\u062F",
      canonical: "bebakhsh\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "excuse me/sorry",
      reviewed: false
    },
    {
      persian: "\u0628\u0628\u0631",
      canonical: "babr",
      register: "formal",
      pos: "noun",
      gloss: "tiger",
      reviewed: false,
      sources: {
        noghteh: 137
      }
    },
    {
      persian: "\u0628\u0628\u06CC\u0646",
      canonical: "beb\u012Bn",
      register: "formal",
      pos: "other",
      gloss: "look!/see!",
      reviewed: false
    },
    {
      persian: "\u0628\u0628\u06CC\u0646\u0645",
      canonical: "beb\u012Bnam",
      register: "formal",
      pos: "other",
      gloss: "(that) I see",
      reviewed: false
    },
    {
      persian: "\u0628\u0686\u0647",
      canonical: "bacheh",
      register: "formal",
      pos: "noun",
      gloss: "child",
      reviewed: false,
      sources: {
        noghteh: 66
      }
    },
    {
      persian: "\u0628\u062E\u0648\u0631",
      canonical: "bokhor",
      register: "formal",
      pos: "other",
      gloss: "eat!",
      reviewed: false
    },
    {
      persian: "\u0628\u062E\u0648\u0631\u0645",
      canonical: "bokhoram",
      register: "colloquial",
      pos: "verb",
      gloss: "(that) I eat",
      reviewed: true,
      parts: [
        {
          fin: "bo",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "khor",
          role: "stem",
          gloss: "eat"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-32"
      }
    },
    {
      persian: "\u0628\u062E\u0648\u0631\u0646",
      canonical: "bokhoran",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + eat + they",
      reviewed: false,
      parts: [
        {
          fin: "bo",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "khor",
          role: "stem",
          gloss: "eat"
        },
        {
          fin: "an",
          role: "ending",
          gloss: "they"
        }
      ],
      sources: {
        harfBezan: "l02-35"
      }
    },
    {
      persian: "\u0628\u062E\u0648\u0631\u0647",
      canonical: "bokhoreh",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + eat + he/she",
      reviewed: false,
      parts: [
        {
          fin: "bo",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "khor",
          role: "stem",
          gloss: "eat"
        },
        {
          fin: "e",
          role: "ending",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-23"
      }
    },
    {
      persian: "\u0628\u062E\u0648\u0631\u06CC",
      canonical: "bokhor\u012B",
      register: "colloquial",
      pos: "verb",
      gloss: "(that) you eat",
      reviewed: false,
      parts: [
        {
          fin: "bo",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "khor",
          role: "stem",
          gloss: "eat"
        },
        {
          fin: "i",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-10"
      }
    },
    {
      persian: "\u0628\u062E\u0648\u0631\u06CC\u0645",
      canonical: "bokhor\u012Bm",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + eat + we",
      reviewed: false,
      parts: [
        {
          fin: "bo",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "khor",
          role: "stem",
          gloss: "eat"
        },
        {
          fin: "im",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l02-32"
      }
    },
    {
      persian: "\u0628\u062F",
      canonical: "bad",
      register: "formal",
      pos: "other",
      gloss: "bad",
      reviewed: false
    },
    {
      persian: "\u0628\u062F\u0645",
      canonical: "bedam",
      register: "formal",
      pos: "other",
      gloss: "(that) I give",
      reviewed: false
    },
    {
      persian: "\u0628\u062F\u0647",
      canonical: "bedeh",
      register: "formal",
      pos: "other",
      gloss: "give!",
      reviewed: false
    },
    {
      persian: "\u0628\u062F\u0648\u0646",
      canonical: "bed\u016Bn",
      register: "formal",
      pos: "other",
      gloss: "without",
      reviewed: false
    },
    {
      persian: "\u0628\u062F\u06CC",
      canonical: "bed\u012B",
      register: "formal",
      pos: "other",
      gloss: "(that) you give",
      reviewed: false
    },
    {
      persian: "\u0628\u0631",
      canonical: "bar",
      register: "formal",
      pos: "other",
      gloss: "on/upon",
      reviewed: false
    },
    {
      persian: "\u0628\u0631\u0627\u062F\u0631",
      canonical: "bar\u0101dar",
      register: "formal",
      pos: "noun",
      gloss: "brother",
      reviewed: false,
      sources: {
        noghteh: 69
      }
    },
    {
      persian: "\u0628\u0631\u0627\u06CC",
      canonical: "baraye",
      register: "formal",
      pos: "other",
      gloss: "for",
      reviewed: false
    },
    {
      persian: "\u0628\u0631\u0641",
      canonical: "barf",
      register: "formal",
      pos: "noun",
      gloss: "snow",
      reviewed: false,
      sources: {
        noghteh: 14
      }
    },
    {
      persian: "\u0628\u0631\u06AF",
      canonical: "barg",
      register: "formal",
      pos: "noun",
      gloss: "leaf",
      reviewed: false,
      sources: {
        noghteh: 211
      }
    },
    {
      persian: "\u0628\u0631\u0645",
      canonical: "beram",
      register: "colloquial",
      pos: "verb",
      gloss: "(that) I go",
      reviewed: false,
      parts: [
        {
          fin: "be",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-04"
      }
    },
    {
      persian: "\u0628\u0631\u0646",
      canonical: "beran",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + go + they",
      reviewed: false,
      parts: [
        {
          fin: "be",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "an",
          role: "ending",
          gloss: "they"
        }
      ],
      sources: {
        harfBezan: "l02-36"
      }
    },
    {
      persian: "\u0628\u0631\u0646\u062C",
      canonical: "berenj",
      register: "formal",
      pos: "noun",
      gloss: "rice",
      reviewed: false,
      sources: {
        noghteh: 47
      }
    },
    {
      persian: "\u0628\u0631\u0647",
      canonical: "barreh",
      register: "formal",
      pos: "noun",
      gloss: "lamb",
      reviewed: false,
      sources: {
        noghteh: 144
      }
    },
    {
      persian: "\u0628\u0631\u0647",
      canonical: "bereh",
      register: "colloquial",
      pos: "verb",
      gloss: "(that) he/she goes",
      reviewed: false,
      parts: [
        {
          fin: "be",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "e",
          role: "ending",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-17"
      }
    },
    {
      persian: "\u0628\u0631\u0648",
      canonical: "bor\u016B",
      register: "formal",
      pos: "other",
      gloss: "go!",
      reviewed: false
    },
    {
      persian: "\u0628\u0631\u06CC",
      canonical: "ber\u012B",
      register: "colloquial",
      pos: "verb",
      gloss: "(that) you go",
      reviewed: false,
      parts: [
        {
          fin: "be",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "i",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-05"
      }
    },
    {
      persian: "\u0628\u0631\u06CC\u062F",
      canonical: "ber\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "go!(pl.)",
      reviewed: false
    },
    {
      persian: "\u0628\u0631\u06CC\u0645",
      canonical: "ber\u012Bm",
      register: "colloquial",
      pos: "verb",
      gloss: "let's go",
      reviewed: false,
      parts: [
        {
          fin: "be",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "im",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l02-28"
      }
    },
    {
      persian: "\u0628\u0631\u06CC\u0646",
      canonical: "ber\u012Bn",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + go + you all",
      reviewed: false,
      parts: [
        {
          fin: "be",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "in",
          role: "ending",
          gloss: "you all"
        }
      ],
      sources: {
        harfBezan: "l02-33"
      }
    },
    {
      persian: "\u0628\u0632",
      canonical: "boz",
      register: "formal",
      pos: "noun",
      gloss: "goat",
      reviewed: false,
      sources: {
        noghteh: 127
      }
    },
    {
      persian: "\u0628\u0632\u0631\u06AF",
      canonical: "bozorg",
      register: "formal",
      pos: "noun",
      gloss: "big",
      reviewed: false,
      sources: {
        noghteh: 86
      }
    },
    {
      persian: "\u0628\u0633\u06CC\u0627\u0631",
      canonical: "besyar",
      register: "formal",
      pos: "other",
      gloss: "very",
      reviewed: false
    },
    {
      persian: "\u0628\u0634\u0645",
      canonical: "besham",
      register: "formal",
      pos: "other",
      gloss: "(that) I become",
      reviewed: false
    },
    {
      persian: "\u0628\u0634\u0647",
      canonical: "besheh",
      register: "formal",
      pos: "other",
      gloss: "(that) it becomes",
      reviewed: false
    },
    {
      persian: "\u0628\u0634\u0648\u062F",
      canonical: "beshavad",
      register: "formal",
      pos: "other",
      gloss: "(that) it becomes",
      reviewed: false
    },
    {
      persian: "\u0628\u0639\u062F",
      canonical: "ba'd",
      register: "formal",
      pos: "noun",
      gloss: "after",
      reviewed: false,
      sources: {
        noghteh: 259
      }
    },
    {
      persian: "\u0628\u06AF\u0645",
      canonical: "begam",
      register: "formal",
      pos: "other",
      gloss: "(that) I say",
      reviewed: false
    },
    {
      persian: "\u0628\u06AF\u0648",
      canonical: "beg\u016B",
      register: "formal",
      pos: "other",
      gloss: "say!/tell!",
      reviewed: false
    },
    {
      persian: "\u0628\u06AF\u06CC",
      canonical: "beg\u012B",
      register: "formal",
      pos: "other",
      gloss: "(that) you say",
      reviewed: false
    },
    {
      persian: "\u0628\u06AF\u06CC\u0631",
      canonical: "beg\u012Br",
      register: "formal",
      pos: "other",
      gloss: "take!",
      reviewed: false
    },
    {
      persian: "\u0628\u06AF\u06CC\u0631\u0645",
      canonical: "beg\u012Bram",
      register: "formal",
      pos: "other",
      gloss: "(that) I take",
      reviewed: false
    },
    {
      persian: "\u0628\u0644\u0647",
      canonical: "baleh",
      register: "formal",
      pos: "noun",
      gloss: "yes",
      reviewed: false,
      sources: {
        noghteh: 65
      }
    },
    {
      persian: "\u0628\u0646\u0641\u0634",
      canonical: "banafsh",
      register: "formal",
      pos: "noun",
      gloss: "purple",
      reviewed: false,
      sources: {
        noghteh: 232
      }
    },
    {
      persian: "\u0628\u0647",
      canonical: "beh",
      register: "formal",
      pos: "other",
      gloss: "to/at",
      reviewed: false
    },
    {
      persian: "\u0628\u0647\u0627\u0631",
      canonical: "bah\u0101r",
      register: "formal",
      pos: "noun",
      gloss: "spring",
      reviewed: false,
      sources: {
        noghteh: 205
      }
    },
    {
      persian: "\u0628\u0647\u062A\u0631",
      canonical: "behtar",
      register: "formal",
      pos: "other",
      gloss: "better",
      reviewed: false
    },
    {
      persian: "\u0628\u0647\u062A\u0631\u06CC\u0646",
      canonical: "behtar\u012Bn",
      register: "formal",
      pos: "other",
      gloss: "best",
      reviewed: false
    },
    {
      persian: "\u0628\u0648\u062F",
      canonical: "b\u016Bd",
      register: "formal",
      pos: "other",
      gloss: "was",
      reviewed: false
    },
    {
      persian: "\u0628\u0648\u062F\u0645",
      canonical: "b\u016Bdam",
      register: "formal",
      pos: "other",
      gloss: "I was",
      reviewed: false
    },
    {
      persian: "\u0628\u0648\u062F\u0646",
      canonical: "b\u016Bdan",
      register: "formal",
      pos: "verb",
      gloss: "to be/being",
      reviewed: false
    },
    {
      persian: "\u0628\u0648\u062F\u0646\u062F",
      canonical: "b\u016Bdand",
      register: "formal",
      pos: "other",
      gloss: "they were",
      reviewed: false
    },
    {
      persian: "\u0628\u0648\u062F\u0647",
      canonical: "b\u016Bdeh",
      register: "formal",
      pos: "other",
      gloss: "has been",
      reviewed: false
    },
    {
      persian: "\u0628\u0648\u062F\u06CC",
      canonical: "b\u016Bd\u012B",
      register: "formal",
      pos: "other",
      gloss: "you were",
      reviewed: false
    },
    {
      persian: "\u0628\u0648\u062F\u06CC\u0645",
      canonical: "b\u016Bd\u012Bm",
      register: "formal",
      pos: "other",
      gloss: "we were",
      reviewed: false
    },
    {
      persian: "\u0628\u06CC",
      canonical: "b\u012B",
      register: "formal",
      pos: "other",
      gloss: "without/un-",
      reviewed: false
    },
    {
      persian: "\u0628\u06CC\u0627",
      canonical: "biya",
      register: "formal",
      pos: "other",
      gloss: "come!",
      reviewed: false
    },
    {
      persian: "\u0628\u06CC\u0627\u062F",
      canonical: "biy\u0101d",
      register: "colloquial",
      pos: "verb",
      gloss: "(that) he/she comes",
      reviewed: false,
      parts: [
        {
          fin: "bi",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "d",
          role: "ending",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-20"
      }
    },
    {
      persian: "\u0628\u06CC\u0627\u0645",
      canonical: "biy\u0101m",
      register: "colloquial",
      pos: "verb",
      gloss: "(that) I come",
      reviewed: false,
      parts: [
        {
          fin: "bi",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "m",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l01-09"
      }
    },
    {
      persian: "\u0628\u06CC\u0627\u0646",
      canonical: "biy\u0101n",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + come + they",
      reviewed: false,
      parts: [
        {
          fin: "bi",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "n",
          role: "ending",
          gloss: "they"
        }
      ],
      sources: {
        harfBezan: "l02-37"
      }
    },
    {
      persian: "\u0628\u06CC\u0627\u06CC",
      canonical: "biy\u0101y",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + come + you",
      reviewed: false,
      parts: [
        {
          fin: "bi",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "y",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-22"
      }
    },
    {
      persian: "\u0628\u06CC\u0627\u06CC\u0645",
      canonical: "biy\u0101ym",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + come + we",
      reviewed: false,
      parts: [
        {
          fin: "bi",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "ym",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l06-40"
      }
    },
    {
      persian: "\u0628\u06CC\u0627\u06CC\u0646",
      canonical: "biy\u0101yn",
      register: "colloquial",
      pos: "verb",
      gloss: "'to' (subjunctive) + come + you all",
      reviewed: false,
      parts: [
        {
          fin: "bi",
          role: "prefix",
          gloss: "'to' (subjunctive)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "yn",
          role: "ending",
          gloss: "you all"
        }
      ],
      sources: {
        harfBezan: "l02-34"
      }
    },
    {
      persian: "\u0628\u06CC\u0627\u06CC\u06CC\u062F",
      canonical: "biyayid",
      register: "formal",
      pos: "other",
      gloss: "come!(pl.)",
      reviewed: false
    },
    {
      persian: "\u0628\u06CC\u0633\u062A",
      canonical: "b\u012Bst",
      register: "formal",
      pos: "noun",
      gloss: "twenty",
      reviewed: false,
      sources: {
        noghteh: 35
      }
    },
    {
      persian: "\u0628\u06CC\u0634\u062A\u0631",
      canonical: "b\u012Bshtar",
      register: "formal",
      pos: "other",
      gloss: "more",
      reviewed: false
    },
    {
      persian: "\u0628\u06CC\u0646",
      canonical: "beyn",
      register: "formal",
      pos: "other",
      gloss: "between",
      reviewed: false
    },
    {
      persian: "\u0628\u06CC\u0646\u0645",
      canonical: "b\u012Bnam",
      register: "formal",
      pos: "other",
      gloss: "I see",
      reviewed: false
    },
    {
      persian: "\u0628\u06CC\u0646\u06CC",
      canonical: "b\u012Bn\u012B",
      register: "formal",
      pos: "noun",
      gloss: "nose",
      reviewed: false,
      sources: {
        noghteh: 5
      }
    },
    {
      persian: "\u067E\u0627",
      canonical: "p\u0101",
      register: "formal",
      pos: "noun",
      gloss: "foot",
      reviewed: false,
      sources: {
        noghteh: 3
      }
    },
    {
      persian: "\u067E\u0627\u06A9",
      canonical: "p\u0101k",
      register: "formal",
      pos: "noun",
      gloss: "clean",
      reviewed: false,
      sources: {
        noghteh: 264
      }
    },
    {
      persian: "\u067E\u0627\u06CC\u06CC\u0632",
      canonical: "p\u0101y\u012Bz",
      register: "formal",
      pos: "noun",
      gloss: "autumn",
      reviewed: false,
      sources: {
        noghteh: 206
      }
    },
    {
      persian: "\u067E\u0627\u06CC\u06CC\u0646",
      canonical: "paeen",
      register: "formal",
      pos: "other",
      gloss: "down/below",
      reviewed: false
    },
    {
      persian: "\u067E\u062A\u0648",
      canonical: "pat\u016B",
      register: "formal",
      pos: "noun",
      gloss: "blanket",
      reviewed: false,
      sources: {
        noghteh: 165
      }
    },
    {
      persian: "\u067E\u062F\u0631",
      canonical: "pedar",
      register: "formal",
      pos: "noun",
      gloss: "father",
      reviewed: false,
      sources: {
        noghteh: 62
      }
    },
    {
      persian: "\u067E\u0631\u062F\u0647",
      canonical: "pardeh",
      register: "formal",
      pos: "noun",
      gloss: "curtain",
      reviewed: false,
      sources: {
        noghteh: 163
      }
    },
    {
      persian: "\u067E\u0631\u0646\u062F\u0647",
      canonical: "parandeh",
      register: "formal",
      pos: "noun",
      gloss: "bird",
      reviewed: false,
      sources: {
        noghteh: 129
      }
    },
    {
      persian: "\u067E\u0631\u0648\u0627\u0646\u0647",
      canonical: "parv\u0101neh",
      register: "formal",
      pos: "noun",
      gloss: "butterfly",
      reviewed: false,
      sources: {
        noghteh: 139
      }
    },
    {
      persian: "\u067E\u0633\u062A\u0647",
      canonical: "pesteh",
      register: "formal",
      pos: "noun",
      gloss: "pistachio",
      reviewed: false,
      sources: {
        noghteh: 52
      }
    },
    {
      persian: "\u067E\u0633\u0631",
      canonical: "pesar",
      register: "formal",
      pos: "noun",
      gloss: "boy",
      reviewed: false,
      sources: {
        noghteh: 13
      }
    },
    {
      persian: "\u067E\u0634\u062A",
      canonical: "posht",
      register: "formal",
      pos: "noun",
      gloss: "back",
      reviewed: false,
      sources: {
        noghteh: 187
      }
    },
    {
      persian: "\u067E\u0644\u0646\u06AF",
      canonical: "palang",
      register: "formal",
      pos: "noun",
      gloss: "leopard",
      reviewed: false,
      sources: {
        noghteh: 143
      }
    },
    {
      persian: "\u067E\u0646\u062C",
      canonical: "panj",
      register: "formal",
      pos: "noun",
      gloss: "five",
      reviewed: false,
      sources: {
        noghteh: 220
      }
    },
    {
      persian: "\u067E\u0646\u062C\u0631\u0647",
      canonical: "panjereh",
      register: "formal",
      pos: "noun",
      gloss: "window",
      reviewed: false,
      sources: {
        noghteh: 31
      }
    },
    {
      persian: "\u067E\u0646\u062C\u0634\u0646\u0628\u0647",
      canonical: "panjshanbeh",
      register: "formal",
      pos: "noun",
      gloss: "Thursday",
      reviewed: false,
      sources: {
        noghteh: 280
      }
    },
    {
      persian: "\u067E\u0646\u0686\u0631",
      canonical: "panchar",
      register: "formal",
      pos: "noun",
      gloss: "flat tyre",
      reviewed: false,
      sources: {
        noghteh: 242
      }
    },
    {
      persian: "\u067E\u0646\u06CC\u0631",
      canonical: "pan\u012Br",
      register: "formal",
      pos: "noun",
      gloss: "cheese",
      reviewed: false,
      sources: {
        noghteh: 19
      }
    },
    {
      persian: "\u067E\u0648\u0644",
      canonical: "p\u016Bl",
      register: "formal",
      pos: "noun",
      gloss: "money",
      reviewed: false,
      sources: {
        noghteh: 50
      }
    },
    {
      persian: "\u067E\u06CC\u0627\u0632",
      canonical: "piy\u0101z",
      register: "formal",
      pos: "noun",
      gloss: "onion",
      reviewed: false,
      sources: {
        noghteh: 109
      }
    },
    {
      persian: "\u067E\u06CC\u0686",
      canonical: "p\u012Bch",
      register: "formal",
      pos: "noun",
      gloss: "screw",
      reviewed: false,
      sources: {
        noghteh: 239
      }
    },
    {
      persian: "\u062A\u0627",
      canonical: "ta",
      register: "formal",
      pos: "other",
      gloss: "until/to",
      reviewed: false
    },
    {
      persian: "\u062A\u0627\u0628\u0633\u062A\u0627\u0646",
      canonical: "t\u0101best\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "summer",
      reviewed: false,
      sources: {
        noghteh: 41
      }
    },
    {
      persian: "\u062A\u0627\u062C",
      canonical: "t\u0101j",
      register: "formal",
      pos: "noun",
      gloss: "crown",
      reviewed: false,
      sources: {
        noghteh: 237
      }
    },
    {
      persian: "\u062A\u0627\u0631\u06CC\u062E",
      canonical: "t\u0101r\u012Bkh",
      register: "formal",
      pos: "noun",
      gloss: "history",
      reviewed: false,
      sources: {
        noghteh: 270
      }
    },
    {
      persian: "\u062A\u0628\u0644\u06CC\u063A",
      canonical: "tabl\u012Bgh",
      register: "formal",
      pos: "noun",
      gloss: "advertisement",
      reviewed: false,
      sources: {
        noghteh: 257
      }
    },
    {
      persian: "\u062A\u062E\u062A",
      canonical: "takht",
      register: "formal",
      pos: "noun",
      gloss: "bed",
      reviewed: false,
      sources: {
        noghteh: 161
      }
    },
    {
      persian: "\u062A\u0644\u0641\u0646",
      canonical: "telefon",
      register: "formal",
      pos: "noun",
      gloss: "telephone",
      reviewed: false,
      sources: {
        noghteh: 155
      }
    },
    {
      persian: "\u062A\u0645\u06CC\u0632",
      canonical: "tam\u012Bz",
      register: "formal",
      pos: "noun",
      gloss: "clean",
      reviewed: false,
      sources: {
        noghteh: 82
      }
    },
    {
      persian: "\u062A\u0648",
      canonical: "t\u016B",
      register: "colloquial",
      pos: "other",
      gloss: "you(sg.)",
      reviewed: false,
      parts: [
        {
          fin: "to",
          role: "plain",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-27"
      }
    },
    {
      persian: "\u062A\u0648\u0627\u0646\u0645",
      canonical: "tavanam",
      register: "formal",
      pos: "other",
      gloss: "I can",
      reviewed: false
    },
    {
      persian: "\u062A\u0648\u067E",
      canonical: "t\u016Bp",
      register: "formal",
      pos: "noun",
      gloss: "ball",
      reviewed: false,
      sources: {
        noghteh: 7
      }
    },
    {
      persian: "\u062A\u0648\u062A",
      canonical: "t\u016Bt",
      register: "formal",
      pos: "noun",
      gloss: "berry",
      reviewed: false,
      sources: {
        noghteh: 2
      }
    },
    {
      persian: "\u062A\u0648\u0646\u0645",
      canonical: "t\u016Bnam",
      register: "colloquial",
      pos: "other",
      gloss: "I can",
      reviewed: false
    },
    {
      persian: "\u062A\u0648\u0646\u0647",
      canonical: "t\u016Bneh",
      register: "colloquial",
      pos: "other",
      gloss: "can",
      reviewed: false
    },
    {
      persian: "\u062A\u0648\u0646\u06CC",
      canonical: "t\u016Bn\u012B",
      register: "colloquial",
      pos: "other",
      gloss: "you can",
      reviewed: false
    },
    {
      persian: "\u062A\u0648\u06CC",
      canonical: "tooye",
      register: "formal",
      pos: "other",
      gloss: "inside",
      reviewed: false
    },
    {
      persian: "\u062B\u0627\u0646\u06CC\u0647",
      canonical: "s\u0101niyeh",
      register: "formal",
      pos: "noun",
      gloss: "second",
      reviewed: false,
      sources: {
        noghteh: 92
      }
    },
    {
      persian: "\u062C\u0627",
      canonical: "ja",
      register: "formal",
      pos: "other",
      gloss: "place",
      reviewed: false
    },
    {
      persian: "\u062C\u0627\u0646",
      canonical: "jan",
      register: "formal",
      pos: "other",
      gloss: "life/dear",
      reviewed: false
    },
    {
      persian: "\u062C\u0627\u06CC",
      canonical: "j\u0101y",
      register: "formal",
      pos: "noun",
      gloss: "place",
      reviewed: false,
      sources: {
        noghteh: 266
      }
    },
    {
      persian: "\u062C\u062F\u06CC\u062F",
      canonical: "jad\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "new",
      reviewed: false
    },
    {
      persian: "\u062C\u0644\u0648",
      canonical: "jel\u016B",
      register: "formal",
      pos: "other",
      gloss: "front/ahead",
      reviewed: false
    },
    {
      persian: "\u062C\u0645\u0639\u0647",
      canonical: "jom'eh",
      register: "formal",
      pos: "noun",
      gloss: "Friday",
      reviewed: false,
      sources: {
        noghteh: 281
      }
    },
    {
      persian: "\u062C\u0646\u06AF\u0644",
      canonical: "jangal",
      register: "formal",
      pos: "noun",
      gloss: "forest",
      reviewed: false,
      sources: {
        noghteh: 203
      }
    },
    {
      persian: "\u062C\u0648\u0627\u0628",
      canonical: "javab",
      register: "formal",
      pos: "other",
      gloss: "answer",
      reviewed: false
    },
    {
      persian: "\u062C\u0648\u062C\u0647",
      canonical: "j\u016Bjeh",
      register: "formal",
      pos: "noun",
      gloss: "chicken",
      reviewed: false,
      sources: {
        noghteh: 22
      }
    },
    {
      persian: "\u0686\u0627\u0642\u0648",
      canonical: "ch\u0101gh\u016B",
      register: "formal",
      pos: "noun",
      gloss: "knife",
      reviewed: false,
      sources: {
        noghteh: 153
      }
    },
    {
      persian: "\u0686\u0627\u06CC",
      canonical: "ch\u0101y",
      register: "formal",
      pos: "noun",
      gloss: "tea",
      reviewed: false,
      sources: {
        noghteh: 16
      }
    },
    {
      persian: "\u0686\u067E",
      canonical: "chap",
      register: "formal",
      pos: "noun",
      gloss: "left",
      reviewed: false,
      sources: {
        noghteh: 244
      }
    },
    {
      persian: "\u0686\u062A\u0631",
      canonical: "chatr",
      register: "formal",
      pos: "noun",
      gloss: "umbrella",
      reviewed: false,
      sources: {
        noghteh: 49
      }
    },
    {
      persian: "\u0686\u0631\u0627",
      canonical: "cher\u0101",
      register: "colloquial",
      pos: "other",
      gloss: "why",
      reviewed: false,
      sources: {
        harfBezan: "l05-20"
      }
    },
    {
      persian: "\u0686\u0631\u0627\u063A",
      canonical: "cher\u0101gh",
      register: "formal",
      pos: "noun",
      gloss: "lamp",
      reviewed: false,
      sources: {
        noghteh: 145
      }
    },
    {
      persian: "\u0686\u0634\u0645",
      canonical: "cheshm",
      register: "formal",
      pos: "noun",
      gloss: "eye",
      reviewed: false,
      sources: {
        noghteh: 36
      }
    },
    {
      persian: "\u0686\u0637\u0648\u0631",
      canonical: "chet\u016Br",
      register: "formal",
      pos: "other",
      gloss: "how",
      reviewed: false
    },
    {
      persian: "\u0686\u0642\u062F\u0631",
      canonical: "cheghadr",
      register: "formal",
      pos: "other",
      gloss: "how much",
      reviewed: false
    },
    {
      persian: "\u0686\u06AF\u0648\u0646\u0647",
      canonical: "cheg\u016Bneh",
      register: "formal",
      pos: "other",
      gloss: "how",
      reviewed: false
    },
    {
      persian: "\u0686\u0645\u062F\u0627\u0646",
      canonical: "chamed\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "suitcase",
      reviewed: false,
      sources: {
        noghteh: 154
      }
    },
    {
      persian: "\u0686\u0646\u062F",
      canonical: "chand",
      register: "formal",
      pos: "other",
      gloss: "how many/several",
      reviewed: false
    },
    {
      persian: "\u0686\u0647",
      canonical: "cheh",
      register: "formal",
      pos: "other",
      gloss: "what",
      reviewed: false
    },
    {
      persian: "\u0686\u0647\u0627\u0631",
      canonical: "chah\u0101r",
      register: "formal",
      pos: "noun",
      gloss: "four",
      reviewed: false,
      sources: {
        noghteh: 219
      }
    },
    {
      persian: "\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647",
      canonical: "chah\u0101rshanbeh",
      register: "formal",
      pos: "noun",
      gloss: "Wednesday",
      reviewed: false,
      sources: {
        noghteh: 44
      }
    },
    {
      persian: "\u0686\u0648\u0646",
      canonical: "chon",
      register: "colloquial",
      pos: "conjunction",
      gloss: "because",
      reviewed: true,
      sources: {
        harfBezan: "l06-21"
      }
    },
    {
      persian: "\u0686\u06CC",
      canonical: "ch\u012B",
      register: "colloquial",
      pos: "other",
      gloss: "what",
      reviewed: false,
      sources: {
        harfBezan: "l05-15"
      }
    },
    {
      persian: "\u0686\u06CC\u0632",
      canonical: "ch\u012Bz",
      register: "formal",
      pos: "other",
      gloss: "thing",
      reviewed: false
    },
    {
      persian: "\u0686\u06CC\u0632\u06CC",
      canonical: "ch\u012Bz\u012B",
      register: "formal",
      pos: "other",
      gloss: "something",
      reviewed: false
    },
    {
      persian: "\u062D\u0627\u0636\u0631",
      canonical: "h\u0101zer",
      register: "formal",
      pos: "noun",
      gloss: "ready",
      reviewed: false,
      sources: {
        noghteh: 84
      }
    },
    {
      persian: "\u062D\u0627\u0644\u0627",
      canonical: "hala",
      register: "formal",
      pos: "other",
      gloss: "now",
      reviewed: false
    },
    {
      persian: "\u062D\u062A\u0645\u0627",
      canonical: "hatman",
      register: "formal",
      pos: "other",
      gloss: "definitely",
      reviewed: false
    },
    {
      persian: "\u062D\u062A\u06CC",
      canonical: "hatta",
      register: "formal",
      pos: "other",
      gloss: "even",
      reviewed: false
    },
    {
      persian: "\u062D\u0631\u0641",
      canonical: "harf",
      register: "formal",
      pos: "noun",
      gloss: "letter / Word",
      reviewed: false,
      sources: {
        noghteh: 234
      }
    },
    {
      persian: "\u062D\u0641\u0638",
      canonical: "hefz",
      register: "formal",
      pos: "noun",
      gloss: "memorise",
      reviewed: false,
      sources: {
        noghteh: 256
      }
    },
    {
      persian: "\u062D\u0645\u0627\u0645",
      canonical: "hamm\u0101m",
      register: "formal",
      pos: "noun",
      gloss: "bath",
      reviewed: false,
      sources: {
        noghteh: 233
      }
    },
    {
      persian: "\u062D\u06CC\u0648\u0627\u0646",
      canonical: "heyv\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "animal",
      reviewed: false,
      sources: {
        noghteh: 235
      }
    },
    {
      persian: "\u062E\u0627\u06A9",
      canonical: "kh\u0101k",
      register: "formal",
      pos: "noun",
      gloss: "soil",
      reviewed: false,
      sources: {
        noghteh: 265
      }
    },
    {
      persian: "\u062E\u0627\u0646\u0645",
      canonical: "khanom",
      register: "formal",
      pos: "other",
      gloss: "lady/Mrs.",
      reviewed: false
    },
    {
      persian: "\u062E\u0627\u0646\u0647",
      canonical: "kh\u0101neh",
      register: "formal",
      pos: "noun",
      gloss: "house",
      reviewed: false,
      sources: {
        noghteh: 28
      }
    },
    {
      persian: "\u062E\u0627\u0646\u0648\u0627\u062F\u0647",
      canonical: "khanevadeh",
      register: "formal",
      pos: "other",
      gloss: "family",
      reviewed: false
    },
    {
      persian: "\u062E\u0628",
      canonical: "khob",
      register: "formal",
      pos: "other",
      gloss: "well/okay",
      reviewed: false
    },
    {
      persian: "\u062E\u062F\u0627",
      canonical: "khoda",
      register: "formal",
      pos: "other",
      gloss: "God",
      reviewed: false
    },
    {
      persian: "\u062E\u062F\u0627\u062D\u0627\u0641\u0638",
      canonical: "khodahafez",
      register: "formal",
      pos: "other",
      gloss: "goodbye",
      reviewed: false
    },
    {
      persian: "\u062E\u062F\u0627\u06CC\u0627",
      canonical: "khodaya",
      register: "formal",
      pos: "other",
      gloss: "oh God",
      reviewed: false
    },
    {
      persian: "\u062E\u0631",
      canonical: "khar",
      register: "formal",
      pos: "noun",
      gloss: "donkey",
      reviewed: false,
      sources: {
        noghteh: 136
      }
    },
    {
      persian: "\u062E\u0631\u0633",
      canonical: "khers",
      register: "formal",
      pos: "noun",
      gloss: "bear",
      reviewed: false,
      sources: {
        noghteh: 56
      }
    },
    {
      persian: "\u062E\u0631\u06AF\u0648\u0634",
      canonical: "kharg\u016Bsh",
      register: "formal",
      pos: "noun",
      gloss: "rabbit",
      reviewed: false,
      sources: {
        noghteh: 39
      }
    },
    {
      persian: "\u062E\u0637",
      canonical: "khat",
      register: "formal",
      pos: "noun",
      gloss: "line",
      reviewed: false,
      sources: {
        noghteh: 173
      }
    },
    {
      persian: "\u062E\u0644\u0627\u0635",
      canonical: "khal\u0101s",
      register: "formal",
      pos: "noun",
      gloss: "finished",
      reviewed: false,
      sources: {
        noghteh: 252
      }
    },
    {
      persian: "\u062E\u0648\u0627\u0633\u062A",
      canonical: "khast",
      register: "formal",
      pos: "other",
      gloss: "wanted",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0627\u0633\u062A\u0645",
      canonical: "khastam",
      register: "formal",
      pos: "other",
      gloss: "I wanted",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0627\u0633\u062A\u0646",
      canonical: "khastan",
      register: "formal",
      pos: "verb",
      gloss: "to want",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0627\u0645",
      canonical: "khaam",
      register: "colloquial",
      pos: "other",
      gloss: "I want",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0627\u0647\u062F",
      canonical: "khahad",
      register: "formal",
      pos: "other",
      gloss: "will/wants",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0627\u0647\u0631",
      canonical: "kh\u0101har",
      register: "formal",
      pos: "noun",
      gloss: "sister",
      reviewed: false,
      sources: {
        noghteh: 70
      }
    },
    {
      persian: "\u062E\u0648\u0627\u0647\u0634",
      canonical: "khahesh",
      register: "formal",
      pos: "other",
      gloss: "please/request",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0627\u0647\u0645",
      canonical: "khaham",
      register: "formal",
      pos: "other",
      gloss: "I will/want",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0627\u0647\u06CC",
      canonical: "khahi",
      register: "formal",
      pos: "other",
      gloss: "you will/want",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0628",
      canonical: "kh\u016Bb",
      register: "formal",
      pos: "noun",
      gloss: "good",
      reviewed: false,
      sources: {
        noghteh: 29
      }
    },
    {
      persian: "\u062E\u0648\u0628\u0647",
      canonical: "kh\u016Bbeh",
      register: "formal",
      pos: "other",
      gloss: "it's good",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0628\u06CC",
      canonical: "kh\u016Bb\u012B",
      register: "formal",
      pos: "other",
      gloss: "you're good/goodness",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u062F",
      canonical: "kh\u016Bd",
      register: "formal",
      pos: "other",
      gloss: "self",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u062F\u062A",
      canonical: "kh\u016Bdat",
      register: "formal",
      pos: "other",
      gloss: "yourself",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u062F\u0634",
      canonical: "kh\u016Bdash",
      register: "formal",
      pos: "other",
      gloss: "himself/herself",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u062F\u0645",
      canonical: "kh\u016Bdam",
      register: "formal",
      pos: "other",
      gloss: "myself",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0631\u062F",
      canonical: "khord",
      register: "formal",
      pos: "other",
      gloss: "ate",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0631\u062F\u0645",
      canonical: "khordam",
      register: "colloquial",
      pos: "verb",
      gloss: "I ate",
      reviewed: false,
      parts: [
        {
          fin: "khord",
          role: "stem",
          gloss: "ate (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-22"
      }
    },
    {
      persian: "\u062E\u0648\u0631\u062F\u0646",
      canonical: "khordan",
      register: "formal",
      pos: "verb",
      gloss: "to eat/drink",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0631\u0634\u06CC\u062F",
      canonical: "khorsh\u012Bd",
      register: "formal",
      pos: "noun",
      gloss: "sun",
      reviewed: true,
      sources: {
        noghteh: 43
      }
    },
    {
      persian: "\u062E\u0648\u0634\u062D\u0627\u0644",
      canonical: "khoshhal",
      register: "formal",
      pos: "other",
      gloss: "happy",
      reviewed: false
    },
    {
      persian: "\u062E\u0648\u0646\u0647",
      canonical: "kh\u016Bneh",
      register: "colloquial",
      pos: "other",
      gloss: "house",
      reviewed: false
    },
    {
      persian: "\u062E\u06CC\u0627\u0631",
      canonical: "khiy\u0101r",
      register: "formal",
      pos: "noun",
      gloss: "cucumber",
      reviewed: false,
      sources: {
        noghteh: 111
      }
    },
    {
      persian: "\u062E\u06CC\u0644\u06CC",
      canonical: "khe\u012Bl\u012B",
      register: "formal",
      pos: "other",
      gloss: "very/a lot",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u062F",
      canonical: "dad",
      register: "formal",
      pos: "other",
      gloss: "gave",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u062F\u0645",
      canonical: "dadam",
      register: "formal",
      pos: "other",
      gloss: "I gave",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u062F\u0647",
      canonical: "dadeh",
      register: "formal",
      pos: "other",
      gloss: "given",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0631\u062F",
      canonical: "darad",
      register: "formal",
      pos: "other",
      gloss: "he/she has",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0631\u0645",
      canonical: "d\u0101ram",
      register: "colloquial",
      pos: "verb",
      gloss: "I have",
      reviewed: false,
      parts: [
        {
          fin: "d\u0101r",
          role: "stem",
          gloss: "have / be in the middle of"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l03-36"
      }
    },
    {
      persian: "\u062F\u0627\u0631\u0646\u062F",
      canonical: "darand",
      register: "formal",
      pos: "other",
      gloss: "they have",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0631\u0647",
      canonical: "dareh",
      register: "colloquial",
      pos: "other",
      gloss: "has",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0631\u06CC",
      canonical: "dari",
      register: "formal",
      pos: "other",
      gloss: "you have",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0631\u06CC\u062F",
      canonical: "darid",
      register: "formal",
      pos: "other",
      gloss: "you (pl.) have",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0631\u06CC\u0645",
      canonical: "darim",
      register: "formal",
      pos: "other",
      gloss: "we have",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0646\u0645",
      canonical: "danam",
      register: "formal",
      pos: "other",
      gloss: "I know",
      reviewed: false
    },
    {
      persian: "\u062F\u0627\u0646\u06CC",
      canonical: "dani",
      register: "formal",
      pos: "other",
      gloss: "you know",
      reviewed: false
    },
    {
      persian: "\u062F\u062E\u062A\u0631",
      canonical: "dokhtar",
      register: "formal",
      pos: "noun",
      gloss: "girl",
      reviewed: false,
      sources: {
        noghteh: 68
      }
    },
    {
      persian: "\u062F\u0631",
      canonical: "dar",
      register: "formal",
      pos: "noun",
      gloss: "door",
      reviewed: false,
      sources: {
        noghteh: 162
      }
    },
    {
      persian: "\u062F\u0631\u0628\u0627\u0631\u0647",
      canonical: "darbareh",
      register: "formal",
      pos: "other",
      gloss: "about",
      reviewed: false
    },
    {
      persian: "\u062F\u0631\u062E\u062A",
      canonical: "derakht",
      register: "formal",
      pos: "noun",
      gloss: "tree",
      reviewed: false,
      sources: {
        noghteh: 23
      }
    },
    {
      persian: "\u062F\u0631\u0633\u062A",
      canonical: "dorost",
      register: "formal",
      pos: "noun",
      gloss: "correct",
      reviewed: false,
      sources: {
        noghteh: 80
      }
    },
    {
      persian: "\u062F\u0631\u0648\u063A",
      canonical: "dor\u016Bgh",
      register: "formal",
      pos: "noun",
      gloss: "lie",
      reviewed: false,
      sources: {
        noghteh: 78
      }
    },
    {
      persian: "\u062F\u0631\u06CC\u0627",
      canonical: "dary\u0101",
      register: "formal",
      pos: "noun",
      gloss: "sea",
      reviewed: false,
      sources: {
        noghteh: 18
      }
    },
    {
      persian: "\u062F\u0633\u062A",
      canonical: "dast",
      register: "formal",
      pos: "noun",
      gloss: "hand",
      reviewed: false,
      sources: {
        noghteh: 51
      }
    },
    {
      persian: "\u062F\u0642\u06CC\u0642\u0647",
      canonical: "dagh\u012Bgheh",
      register: "formal",
      pos: "noun",
      gloss: "minute",
      reviewed: false,
      sources: {
        noghteh: 93
      }
    },
    {
      persian: "\u062F\u06A9\u062A\u0631",
      canonical: "doktor",
      register: "formal",
      pos: "other",
      gloss: "doctor",
      reviewed: false
    },
    {
      persian: "\u062F\u0644",
      canonical: "del",
      register: "formal",
      pos: "noun",
      gloss: "heart (informal)",
      reviewed: false,
      sources: {
        noghteh: 268
      }
    },
    {
      persian: "\u062F\u0646\u062F\u0627\u0646",
      canonical: "dand\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "tooth",
      reviewed: false,
      sources: {
        noghteh: 180
      }
    },
    {
      persian: "\u062F\u0646\u06CC\u0627",
      canonical: "donya",
      register: "formal",
      pos: "other",
      gloss: "world",
      reviewed: false
    },
    {
      persian: "\u062F\u0647",
      canonical: "dah",
      register: "formal",
      pos: "noun",
      gloss: "ten",
      reviewed: false,
      sources: {
        noghteh: 225
      }
    },
    {
      persian: "\u062F\u0647\u0627\u0646",
      canonical: "dah\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "mouth",
      reviewed: false,
      sources: {
        noghteh: 176
      }
    },
    {
      persian: "\u062F\u0648",
      canonical: "do",
      register: "formal",
      pos: "noun",
      gloss: "two",
      reviewed: true,
      sources: {
        noghteh: 217
      }
    },
    {
      persian: "\u062F\u0648\u0628\u0627\u0631\u0647",
      canonical: "dobareh",
      register: "formal",
      pos: "other",
      gloss: "again",
      reviewed: false
    },
    {
      persian: "\u062F\u0648\u0633\u062A",
      canonical: "d\u016Bst",
      register: "formal",
      pos: "noun",
      gloss: "friend",
      reviewed: false,
      sources: {
        noghteh: 26
      }
    },
    {
      persian: "\u062F\u0648\u0634\u0646\u0628\u0647",
      canonical: "doshanbeh",
      register: "formal",
      pos: "noun",
      gloss: "Monday",
      reviewed: true,
      sources: {
        noghteh: 279
      }
    },
    {
      persian: "\u06A9\u0646\u062F\u0646",
      canonical: "kandan",
      register: "formal",
      pos: "verb",
      gloss: "to dig/pull/pluck",
      reviewed: false
    },
    {
      persian: "\u062F\u0648\u063A",
      canonical: "d\u016Bgh",
      register: "formal",
      pos: "noun",
      gloss: "yogurt drink",
      reviewed: false,
      sources: {
        noghteh: 119
      }
    },
    {
      persian: "\u062F\u0648\u0646\u0645",
      canonical: "d\u016Bnam",
      register: "colloquial",
      pos: "other",
      gloss: "I know",
      reviewed: false
    },
    {
      persian: "\u062F\u0648\u0646\u06CC",
      canonical: "d\u016Bn\u012B",
      register: "colloquial",
      pos: "other",
      gloss: "you know",
      reviewed: false
    },
    {
      persian: "\u062F\u06CC\u062F",
      canonical: "d\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "saw",
      reviewed: false
    },
    {
      persian: "\u062F\u06CC\u062F\u0645",
      canonical: "d\u012Bdam",
      register: "formal",
      pos: "other",
      gloss: "I saw",
      reviewed: false
    },
    {
      persian: "\u062F\u06CC\u062F\u0646",
      canonical: "d\u012Bdan",
      register: "formal",
      pos: "verb",
      gloss: "to see",
      reviewed: false
    },
    {
      persian: "\u062F\u06CC\u062F\u06CC",
      canonical: "d\u012Bd\u012B",
      register: "formal",
      pos: "other",
      gloss: "you saw",
      reviewed: false
    },
    {
      persian: "\u062F\u06CC\u0631",
      canonical: "d\u012Br",
      register: "formal",
      pos: "noun",
      gloss: "late",
      reviewed: false,
      sources: {
        noghteh: 95
      }
    },
    {
      persian: "\u062F\u06CC\u0631\u0648\u0632",
      canonical: "d\u012Br\u016Bz",
      register: "colloquial",
      pos: "other",
      gloss: "yesterday",
      reviewed: false,
      sources: {
        harfBezan: "l04-10"
      }
    },
    {
      persian: "\u062F\u06CC\u0634\u0628",
      canonical: "d\u012Bshab",
      register: "formal",
      pos: "noun",
      gloss: "last Night",
      reviewed: false,
      sources: {
        noghteh: 45,
        harfBezan: "l04-20"
      }
    },
    {
      persian: "\u062F\u06CC\u06AF\u0631",
      canonical: "d\u012Bgar",
      register: "formal",
      pos: "other",
      gloss: "else/other",
      reviewed: false
    },
    {
      persian: "\u062F\u06CC\u06AF\u0647",
      canonical: "d\u012Bgeh",
      register: "colloquial",
      pos: "other",
      gloss: "else/anymore",
      reviewed: false
    },
    {
      persian: "\u0630\u0631\u062A",
      canonical: "zorat",
      register: "formal",
      pos: "noun",
      gloss: "corn",
      reviewed: false,
      sources: {
        noghteh: 107
      }
    },
    {
      persian: "\u0631\u0627",
      canonical: "ra",
      register: "formal",
      pos: "other",
      gloss: "(object marker)",
      reviewed: false
    },
    {
      persian: "\u0631\u0627\u0633\u062A",
      canonical: "r\u0101st",
      register: "formal",
      pos: "noun",
      gloss: "right",
      reviewed: false,
      sources: {
        noghteh: 245
      }
    },
    {
      persian: "\u0631\u0627\u0647",
      canonical: "rah",
      register: "formal",
      pos: "other",
      gloss: "way/road",
      reviewed: false
    },
    {
      persian: "\u0631\u0641\u062A",
      canonical: "raft",
      register: "colloquial",
      pos: "other",
      gloss: "went",
      reviewed: false,
      parts: [
        {
          fin: "raft",
          role: "stem",
          gloss: "went (past stem)"
        }
      ],
      sources: {
        harfBezan: "l04-25"
      }
    },
    {
      persian: "\u0631\u0641\u062A\u0645",
      canonical: "raftam",
      register: "colloquial",
      pos: "verb",
      gloss: "I went",
      reviewed: false,
      parts: [
        {
          fin: "raft",
          role: "stem",
          gloss: "went (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-08"
      }
    },
    {
      persian: "\u0631\u0641\u062A\u0646",
      canonical: "raftan",
      register: "colloquial",
      pos: "verb",
      gloss: "to go",
      reviewed: false,
      parts: [
        {
          fin: "raft",
          role: "stem",
          gloss: "went (past stem)"
        },
        {
          fin: "an",
          role: "ending",
          gloss: "they"
        }
      ],
      sources: {
        harfBezan: "l04-31"
      }
    },
    {
      persian: "\u0631\u0641\u062A\u0647",
      canonical: "rafteh",
      register: "formal",
      pos: "other",
      gloss: "gone",
      reviewed: false
    },
    {
      persian: "\u0631\u0641\u062A\u06CC",
      canonical: "raft\u012B",
      register: "colloquial",
      pos: "verb",
      gloss: "you went",
      reviewed: false,
      parts: [
        {
          fin: "raft",
          role: "stem",
          gloss: "went (past stem)"
        },
        {
          fin: "i",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l04-29"
      }
    },
    {
      persian: "\u0631\u0641\u062A\u06CC\u0645",
      canonical: "raft\u012Bm",
      register: "formal",
      pos: "other",
      gloss: "we went",
      reviewed: false
    },
    {
      persian: "\u0631\u0642\u0635",
      canonical: "raghs",
      register: "formal",
      pos: "noun",
      gloss: "dance",
      reviewed: false,
      sources: {
        noghteh: 97
      }
    },
    {
      persian: "\u0631\u0645",
      canonical: "ram",
      register: "colloquial",
      pos: "other",
      gloss: "I go",
      reviewed: false
    },
    {
      persian: "\u0631\u0648",
      canonical: "r\u016B",
      register: "formal",
      pos: "other",
      gloss: "(object marker/colloq.)",
      reviewed: false
    },
    {
      persian: "\u0631\u0648\u0628\u0627\u0647",
      canonical: "r\u016Bb\u0101h",
      register: "formal",
      pos: "noun",
      gloss: "fox",
      reviewed: false,
      sources: {
        noghteh: 132
      }
    },
    {
      persian: "\u0631\u0648\u062D",
      canonical: "r\u016Bh",
      register: "formal",
      pos: "noun",
      gloss: "spirit",
      reviewed: false,
      sources: {
        noghteh: 236
      }
    },
    {
      persian: "\u0631\u0648\u062F",
      canonical: "r\u016Bd",
      register: "formal",
      pos: "noun",
      gloss: "river",
      reviewed: false,
      sources: {
        noghteh: 202
      }
    },
    {
      persian: "\u0631\u0648\u062F",
      canonical: "ravad",
      register: "formal",
      pos: "verb",
      gloss: "goes",
      reviewed: false
    },
    {
      persian: "\u0631\u0648\u0632",
      canonical: "r\u016Bz",
      register: "formal",
      pos: "noun",
      gloss: "day",
      reviewed: false,
      sources: {
        noghteh: 208
      }
    },
    {
      persian: "\u0631\u0648\u0645",
      canonical: "ravam",
      register: "formal",
      pos: "other",
      gloss: "I go",
      reviewed: false
    },
    {
      persian: "\u0631\u0648\u06CC",
      canonical: "rooye",
      register: "formal",
      pos: "other",
      gloss: "on/face",
      reviewed: false
    },
    {
      persian: "\u0632\u0627\u0646\u0648",
      canonical: "z\u0101n\u016B",
      register: "formal",
      pos: "noun",
      gloss: "knee",
      reviewed: false,
      sources: {
        noghteh: 182
      }
    },
    {
      persian: "\u0632\u0628\u0627\u0646",
      canonical: "zab\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "tongue",
      reviewed: false,
      sources: {
        noghteh: 21
      }
    },
    {
      persian: "\u0632\u0631\u062F",
      canonical: "zard",
      register: "formal",
      pos: "noun",
      gloss: "yellow",
      reviewed: false,
      sources: {
        noghteh: 229
      }
    },
    {
      persian: "\u0632\u0645\u0633\u062A\u0627\u0646",
      canonical: "zemest\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "winter",
      reviewed: false,
      sources: {
        noghteh: 207
      }
    },
    {
      persian: "\u0632\u0645\u06CC\u0646",
      canonical: "zam\u012Bn",
      register: "formal",
      pos: "noun",
      gloss: "earth",
      reviewed: false,
      sources: {
        noghteh: 197
      }
    },
    {
      persian: "\u0632\u0646",
      canonical: "zan",
      register: "formal",
      pos: "noun",
      gloss: "woman",
      reviewed: false,
      sources: {
        noghteh: 8
      }
    },
    {
      persian: "\u0632\u0646\u0628\u0648\u0631",
      canonical: "zanb\u016Br",
      register: "formal",
      pos: "noun",
      gloss: "bee",
      reviewed: false,
      sources: {
        noghteh: 38
      }
    },
    {
      persian: "\u0632\u0646\u062F\u06AF\u06CC",
      canonical: "zendeg\u012B",
      register: "formal",
      pos: "other",
      gloss: "life",
      reviewed: false
    },
    {
      persian: "\u0632\u0648\u062F",
      canonical: "z\u016Bd",
      register: "formal",
      pos: "noun",
      gloss: "early",
      reviewed: false,
      sources: {
        noghteh: 96
      }
    },
    {
      persian: "\u0632\u06CC\u0627\u062F",
      canonical: "ziyad",
      register: "formal",
      pos: "other",
      gloss: "a lot/many",
      reviewed: false
    },
    {
      persian: "\u0632\u06CC\u0631",
      canonical: "z\u012Br",
      register: "formal",
      pos: "other",
      gloss: "under",
      reviewed: false
    },
    {
      persian: "\u0698\u0627\u06A9\u062A",
      canonical: "zh\u0101ket",
      register: "formal",
      pos: "noun",
      gloss: "jacket",
      reviewed: false,
      sources: {
        noghteh: 158
      }
    },
    {
      persian: "\u0698\u0644\u0647",
      canonical: "zhaleh",
      register: "formal",
      pos: "noun",
      gloss: "jelly",
      reviewed: false,
      sources: {
        noghteh: 112
      }
    },
    {
      persian: "\u0633\u0627\u0639\u062A",
      canonical: "s\u0101'at",
      register: "formal",
      pos: "noun",
      gloss: "clock",
      reviewed: false,
      sources: {
        noghteh: 147
      }
    },
    {
      persian: "\u0633\u0627\u0644",
      canonical: "sal",
      register: "formal",
      pos: "other",
      gloss: "year",
      reviewed: false
    },
    {
      persian: "\u0633\u0628\u0632",
      canonical: "sabz",
      register: "formal",
      pos: "noun",
      gloss: "green",
      reviewed: false,
      sources: {
        noghteh: 46
      }
    },
    {
      persian: "\u0633\u067E\u0627\u0633",
      canonical: "sep\u0101s",
      register: "formal",
      pos: "noun",
      gloss: "thanks",
      reviewed: false,
      sources: {
        noghteh: 243
      }
    },
    {
      persian: "\u0633\u062A\u0627\u0631\u0647",
      canonical: "set\u0101reh",
      register: "formal",
      pos: "noun",
      gloss: "star",
      reviewed: false,
      sources: {
        noghteh: 191
      }
    },
    {
      persian: "\u0633\u062E\u062A",
      canonical: "sakht",
      register: "formal",
      pos: "noun",
      gloss: "hard",
      reviewed: false,
      sources: {
        noghteh: 269
      }
    },
    {
      persian: "\u0633\u0631",
      canonical: "sar",
      register: "formal",
      pos: "noun",
      gloss: "head",
      reviewed: false,
      sources: {
        noghteh: 175
      }
    },
    {
      persian: "\u0633\u0631\u062E",
      canonical: "sorkh",
      register: "formal",
      pos: "noun",
      gloss: "red",
      reviewed: false,
      sources: {
        noghteh: 228
      }
    },
    {
      persian: "\u0633\u0631\u062F",
      canonical: "sard",
      register: "formal",
      pos: "noun",
      gloss: "cold",
      reviewed: false,
      sources: {
        noghteh: 89
      }
    },
    {
      persian: "\u0633\u0631\u06CC\u0639",
      canonical: "sar\u012B'",
      register: "formal",
      pos: "noun",
      gloss: "fast",
      reviewed: false,
      sources: {
        noghteh: 261
      }
    },
    {
      persian: "\u0633\u0637\u062D",
      canonical: "sath",
      register: "formal",
      pos: "noun",
      gloss: "surface",
      reviewed: false,
      sources: {
        noghteh: 254
      }
    },
    {
      persian: "\u0633\u0637\u0644",
      canonical: "satl",
      register: "formal",
      pos: "noun",
      gloss: "bucket",
      reviewed: false,
      sources: {
        noghteh: 152
      }
    },
    {
      persian: "\u0633\u0641\u06CC\u062F",
      canonical: "sef\u012Bd",
      register: "formal",
      pos: "noun",
      gloss: "white",
      reviewed: false,
      sources: {
        noghteh: 226
      }
    },
    {
      persian: "\u0633\u06AF",
      canonical: "sag",
      register: "formal",
      pos: "noun",
      gloss: "dog",
      reviewed: false,
      sources: {
        noghteh: 130
      }
    },
    {
      persian: "\u0633\u0644\u0627\u0645",
      canonical: "sal\u0101m",
      register: "formal",
      pos: "noun",
      gloss: "hello",
      reviewed: false,
      sources: {
        noghteh: 64
      }
    },
    {
      persian: "\u0633\u0646\u06AF",
      canonical: "sang",
      register: "formal",
      pos: "noun",
      gloss: "stone",
      reviewed: false,
      sources: {
        noghteh: 198
      }
    },
    {
      persian: "\u0633\u0647",
      canonical: "seh",
      register: "formal",
      pos: "noun",
      gloss: "three",
      reviewed: false,
      sources: {
        noghteh: 218
      }
    },
    {
      persian: "\u0633\u0648\u0627\u0644",
      canonical: "soal",
      register: "formal",
      pos: "other",
      gloss: "question",
      reviewed: false
    },
    {
      persian: "\u0633\u0648\u067E",
      canonical: "s\u016Bp",
      register: "formal",
      pos: "noun",
      gloss: "soup",
      reviewed: false,
      sources: {
        noghteh: 114
      }
    },
    {
      persian: "\u0633\u06CC\u0627\u0647",
      canonical: "siy\u0101h",
      register: "formal",
      pos: "noun",
      gloss: "black",
      reviewed: false,
      sources: {
        noghteh: 227
      }
    },
    {
      persian: "\u0633\u06CC\u0628",
      canonical: "s\u012Bb",
      register: "formal",
      pos: "noun",
      gloss: "apple",
      reviewed: false,
      sources: {
        noghteh: 10
      }
    },
    {
      persian: "\u0634\u0627\u062E",
      canonical: "sh\u0101kh",
      register: "formal",
      pos: "noun",
      gloss: "horn",
      reviewed: false,
      sources: {
        noghteh: 271
      }
    },
    {
      persian: "\u0634\u0627\u0645",
      canonical: "sh\u0101m",
      register: "formal",
      pos: "noun",
      gloss: "dinner",
      reviewed: false,
      sources: {
        noghteh: 116
      }
    },
    {
      persian: "\u0634\u0627\u06CC\u062F",
      canonical: "shayad",
      register: "formal",
      pos: "other",
      gloss: "maybe",
      reviewed: false
    },
    {
      persian: "\u0634\u0628",
      canonical: "shab",
      register: "formal",
      pos: "noun",
      gloss: "night",
      reviewed: false,
      sources: {
        noghteh: 15
      }
    },
    {
      persian: "\u0634\u062A\u0631",
      canonical: "shotor",
      register: "formal",
      pos: "noun",
      gloss: "camel",
      reviewed: false,
      sources: {
        noghteh: 135
      }
    },
    {
      persian: "\u0634\u062F",
      canonical: "shod",
      register: "formal",
      pos: "other",
      gloss: "became/happened",
      reviewed: false
    },
    {
      persian: "\u0634\u062F\u0645",
      canonical: "shodam",
      register: "formal",
      pos: "other",
      gloss: "I became",
      reviewed: false
    },
    {
      persian: "\u0634\u062F\u0646",
      canonical: "shodan",
      register: "formal",
      pos: "verb",
      gloss: "to become",
      reviewed: false
    },
    {
      persian: "\u0634\u062F\u0646\u062F",
      canonical: "shodand",
      register: "formal",
      pos: "other",
      gloss: "they became",
      reviewed: false
    },
    {
      persian: "\u0634\u062F\u0647",
      canonical: "shodeh",
      register: "formal",
      pos: "other",
      gloss: "become/been",
      reviewed: false
    },
    {
      persian: "\u0634\u062F\u06CC",
      canonical: "shod\u012B",
      register: "formal",
      pos: "other",
      gloss: "you became",
      reviewed: false
    },
    {
      persian: "\u0634\u0634",
      canonical: "shesh",
      register: "formal",
      pos: "noun",
      gloss: "six",
      reviewed: false,
      sources: {
        noghteh: 221
      }
    },
    {
      persian: "\u0634\u0639\u0631",
      canonical: "she'r",
      register: "formal",
      pos: "noun",
      gloss: "poem",
      reviewed: false,
      sources: {
        noghteh: 258
      }
    },
    {
      persian: "\u0634\u06A9\u0631",
      canonical: "shekar",
      register: "formal",
      pos: "noun",
      gloss: "sugar",
      reviewed: false,
      sources: {
        noghteh: 124
      }
    },
    {
      persian: "\u0634\u06A9\u0644\u0627\u062A",
      canonical: "shokol\u0101t",
      register: "formal",
      pos: "noun",
      gloss: "chocolate",
      reviewed: false,
      sources: {
        noghteh: 113
      }
    },
    {
      persian: "\u0634\u06A9\u0645",
      canonical: "shekam",
      register: "formal",
      pos: "noun",
      gloss: "stomach",
      reviewed: false,
      sources: {
        noghteh: 188
      }
    },
    {
      persian: "\u0634\u0645\u0627",
      canonical: "shom\u0101",
      register: "colloquial",
      pos: "other",
      gloss: "you(pl./formal)",
      reviewed: false,
      parts: [
        {
          fin: "shom\u0101",
          role: "plain",
          gloss: "you all"
        }
      ],
      sources: {
        harfBezan: "l02-33"
      }
    },
    {
      persian: "\u0634\u0645\u0639",
      canonical: "sham'",
      register: "formal",
      pos: "noun",
      gloss: "candle",
      reviewed: false,
      sources: {
        noghteh: 167
      }
    },
    {
      persian: "\u0634\u0646\u0628\u0647",
      canonical: "shanbeh",
      register: "formal",
      pos: "noun",
      gloss: "Saturday",
      reviewed: false,
      sources: {
        noghteh: 277
      }
    },
    {
      persian: "\u0634\u0647",
      canonical: "sheh",
      register: "colloquial",
      pos: "other",
      gloss: "becomes",
      reviewed: false
    },
    {
      persian: "\u0634\u0647\u0631",
      canonical: "shahr",
      register: "formal",
      pos: "other",
      gloss: "city",
      reviewed: false
    },
    {
      persian: "\u0634\u0648\u062F",
      canonical: "shavad",
      register: "formal",
      pos: "other",
      gloss: "becomes",
      reviewed: false
    },
    {
      persian: "\u0634\u06CC\u067E\u0648\u0631",
      canonical: "sh\u012Bp\u016Br",
      register: "formal",
      pos: "noun",
      gloss: "trumpet",
      reviewed: false,
      sources: {
        noghteh: 172
      }
    },
    {
      persian: "\u0634\u06CC\u0631",
      canonical: "sh\u012Br",
      register: "formal",
      pos: "noun",
      gloss: "lion/Milk",
      reviewed: false,
      sources: {
        noghteh: 27
      }
    },
    {
      persian: "\u0634\u06CC\u0631\u06CC\u0646",
      canonical: "sh\u012Br\u012Bn",
      register: "formal",
      pos: "noun",
      gloss: "sweet",
      reviewed: false,
      sources: {
        noghteh: 42
      }
    },
    {
      persian: "\u0635\u0627\u0628\u0648\u0646",
      canonical: "s\u0101b\u016Bn",
      register: "formal",
      pos: "noun",
      gloss: "soap",
      reviewed: false,
      sources: {
        noghteh: 166
      }
    },
    {
      persian: "\u0635\u0628\u062D",
      canonical: "sobh",
      register: "formal",
      pos: "noun",
      gloss: "morning",
      reviewed: false,
      sources: {
        noghteh: 209
      }
    },
    {
      persian: "\u0635\u0628\u062D\u0627\u0646\u0647",
      canonical: "sobh\u0101neh",
      register: "formal",
      pos: "noun",
      gloss: "breakfast",
      reviewed: false,
      sources: {
        noghteh: 115
      }
    },
    {
      persian: "\u0635\u062D\u0631\u0627",
      canonical: "sahr\u0101",
      register: "formal",
      pos: "noun",
      gloss: "desert",
      reviewed: false,
      sources: {
        noghteh: 204
      }
    },
    {
      persian: "\u0635\u062F",
      canonical: "sad",
      register: "formal",
      pos: "other",
      gloss: "hundred",
      reviewed: false
    },
    {
      persian: "\u0635\u062F\u0627",
      canonical: "sed\u0101",
      register: "formal",
      pos: "noun",
      gloss: "sound",
      reviewed: false,
      sources: {
        noghteh: 274
      }
    },
    {
      persian: "\u0635\u0641\u0631",
      canonical: "sefr",
      register: "formal",
      pos: "noun",
      gloss: "zero",
      reviewed: false,
      sources: {
        noghteh: 215
      }
    },
    {
      persian: "\u0635\u0646\u062F\u0644\u06CC",
      canonical: "sandal\u012B",
      register: "formal",
      pos: "noun",
      gloss: "chair",
      reviewed: false,
      sources: {
        noghteh: 150
      }
    },
    {
      persian: "\u0635\u0646\u062F\u0648\u0642",
      canonical: "sand\u016Bgh",
      register: "formal",
      pos: "noun",
      gloss: "box",
      reviewed: false,
      sources: {
        noghteh: 151
      }
    },
    {
      persian: "\u0635\u0648\u0631\u062A",
      canonical: "s\u016Brat",
      register: "formal",
      pos: "noun",
      gloss: "face",
      reviewed: false,
      sources: {
        noghteh: 185
      }
    },
    {
      persian: "\u0636\u0639\u06CC\u0641",
      canonical: "za'\u012Bf",
      register: "formal",
      pos: "noun",
      gloss: "weak",
      reviewed: false,
      sources: {
        noghteh: 85
      }
    },
    {
      persian: "\u0637\u0644\u0627",
      canonical: "tal\u0101",
      register: "formal",
      pos: "noun",
      gloss: "gold",
      reviewed: false,
      sources: {
        noghteh: 168
      }
    },
    {
      persian: "\u0637\u0644\u0648\u0639",
      canonical: "tol\u016B'",
      register: "formal",
      pos: "noun",
      gloss: "sunrise",
      reviewed: false,
      sources: {
        noghteh: 210
      }
    },
    {
      persian: "\u0638\u0631\u0641",
      canonical: "zarf",
      register: "formal",
      pos: "noun",
      gloss: "dish",
      reviewed: false,
      sources: {
        noghteh: 148
      }
    },
    {
      persian: "\u0638\u0647\u0631",
      canonical: "zohr",
      register: "formal",
      pos: "noun",
      gloss: "noon",
      reviewed: false,
      sources: {
        noghteh: 255
      }
    },
    {
      persian: "\u0639\u0633\u0644",
      canonical: "asal",
      register: "formal",
      pos: "noun",
      gloss: "honey",
      reviewed: false,
      sources: {
        noghteh: 102
      }
    },
    {
      persian: "\u0639\u0634\u0642",
      canonical: "eshgh",
      register: "formal",
      pos: "noun",
      gloss: "love",
      reviewed: false,
      sources: {
        noghteh: 77
      }
    },
    {
      persian: "\u0639\u0635\u0631",
      canonical: "asr",
      register: "formal",
      pos: "other",
      gloss: "afternoon",
      reviewed: false
    },
    {
      persian: "\u0639\u0636\u0648",
      canonical: "ozv",
      register: "formal",
      pos: "noun",
      gloss: "member",
      reviewed: false,
      sources: {
        noghteh: 248
      }
    },
    {
      persian: "\u0639\u0642\u0627\u0628",
      canonical: "ogh\u0101b",
      register: "formal",
      pos: "noun",
      gloss: "eagle",
      reviewed: false,
      sources: {
        noghteh: 140
      }
    },
    {
      persian: "\u0639\u06A9\u0633",
      canonical: "aks",
      register: "formal",
      pos: "noun",
      gloss: "photo",
      reviewed: false,
      sources: {
        noghteh: 156
      }
    },
    {
      persian: "\u0639\u0646\u06A9\u0628\u0648\u062A",
      canonical: "ankab\u016Bt",
      register: "formal",
      pos: "noun",
      gloss: "spider",
      reviewed: false,
      sources: {
        noghteh: 60
      }
    },
    {
      persian: "\u0639\u0648\u0636",
      canonical: "avaz",
      register: "formal",
      pos: "noun",
      gloss: "instead",
      reviewed: false,
      sources: {
        noghteh: 247
      }
    },
    {
      persian: "\u0639\u06CC\u0646\u06A9",
      canonical: "eynak",
      register: "formal",
      pos: "noun",
      gloss: "glasses",
      reviewed: false,
      sources: {
        noghteh: 171
      }
    },
    {
      persian: "\u063A\u0630\u0627",
      canonical: "ghaz\u0101",
      register: "formal",
      pos: "noun",
      gloss: "food",
      reviewed: false,
      sources: {
        noghteh: 106
      }
    },
    {
      persian: "\u063A\u0631\u0648\u0628",
      canonical: "ghor\u016Bb",
      register: "formal",
      pos: "noun",
      gloss: "sunset",
      reviewed: false,
      sources: {
        noghteh: 213
      }
    },
    {
      persian: "\u063A\u0644\u0637",
      canonical: "ghalat",
      register: "formal",
      pos: "noun",
      gloss: "wrong",
      reviewed: false,
      sources: {
        noghteh: 79
      }
    },
    {
      persian: "\u0641\u0627\u0631\u0633\u06CC",
      canonical: "f\u0101rs\u012B",
      register: "formal",
      pos: "noun",
      gloss: "Persian",
      reviewed: false,
      sources: {
        noghteh: 76
      }
    },
    {
      persian: "\u0641\u0631\u062F\u0627",
      canonical: "fard\u0101",
      register: "formal",
      pos: "noun",
      gloss: "tomorrow",
      reviewed: false,
      sources: {
        noghteh: 73,
        harfBezan: "l03-25"
      }
    },
    {
      persian: "\u0641\u0631\u0634",
      canonical: "farsh",
      register: "formal",
      pos: "noun",
      gloss: "carpet",
      reviewed: false,
      sources: {
        noghteh: 24
      }
    },
    {
      persian: "\u0641\u0636\u0627",
      canonical: "faz\u0101",
      register: "formal",
      pos: "noun",
      gloss: "space",
      reviewed: false,
      sources: {
        noghteh: 249
      }
    },
    {
      persian: "\u0641\u0642\u0637",
      canonical: "faghat",
      register: "formal",
      pos: "other",
      gloss: "only",
      reviewed: false
    },
    {
      persian: "\u0641\u06CC\u0644",
      canonical: "f\u012Bl",
      register: "formal",
      pos: "noun",
      gloss: "elephant",
      reviewed: false,
      sources: {
        noghteh: 125
      }
    },
    {
      persian: "\u0641\u06CC\u0644\u0645",
      canonical: "f\u012Blm",
      register: "formal",
      pos: "other",
      gloss: "movie",
      reviewed: false
    },
    {
      persian: "\u0642\u0628\u0644",
      canonical: "ghabl",
      register: "formal",
      pos: "other",
      gloss: "before",
      reviewed: false
    },
    {
      persian: "\u0642\u062F\u06CC\u0645\u06CC",
      canonical: "ghad\u012Bm\u012B",
      register: "formal",
      pos: "other",
      gloss: "old",
      reviewed: false
    },
    {
      persian: "\u0642\u0635\u0647",
      canonical: "gheseh",
      register: "formal",
      pos: "noun",
      gloss: "story",
      reviewed: false,
      sources: {
        noghteh: 251
      }
    },
    {
      persian: "\u0642\u0644\u0628",
      canonical: "ghalb",
      register: "formal",
      pos: "noun",
      gloss: "heart",
      reviewed: false,
      sources: {
        noghteh: 57
      }
    },
    {
      persian: "\u0642\u0644\u0645",
      canonical: "ghalam",
      register: "formal",
      pos: "noun",
      gloss: "pen",
      reviewed: false,
      sources: {
        noghteh: 273
      }
    },
    {
      persian: "\u0642\u0646\u062F",
      canonical: "ghand",
      register: "formal",
      pos: "noun",
      gloss: "sugar cubes",
      reviewed: false,
      sources: {
        noghteh: 101
      }
    },
    {
      persian: "\u0642\u0647\u0648\u0647",
      canonical: "ghahveh",
      register: "formal",
      pos: "noun",
      gloss: "coffee",
      reviewed: false,
      sources: {
        noghteh: 104
      }
    },
    {
      persian: "\u0642\u0648\u0631\u0628\u0627\u063A\u0647",
      canonical: "gh\u016Brb\u0101gheh",
      register: "formal",
      pos: "noun",
      gloss: "frog",
      reviewed: false,
      sources: {
        noghteh: 134
      }
    },
    {
      persian: "\u06A9\u0627\u062C",
      canonical: "k\u0101j",
      register: "formal",
      pos: "noun",
      gloss: "pine tree",
      reviewed: false,
      sources: {
        noghteh: 238
      }
    },
    {
      persian: "\u06A9\u0627\u0631",
      canonical: "k\u0101r",
      register: "formal",
      pos: "noun",
      gloss: "work",
      reviewed: false,
      sources: {
        noghteh: 74
      }
    },
    {
      persian: "\u06A9\u0628\u0627\u0628",
      canonical: "kab\u0101b",
      register: "formal",
      pos: "noun",
      gloss: "kebab",
      reviewed: false,
      sources: {
        noghteh: 59
      }
    },
    {
      persian: "\u06A9\u0628\u0648\u062A\u0631",
      canonical: "kab\u016Btar",
      register: "formal",
      pos: "noun",
      gloss: "pigeon",
      reviewed: false,
      sources: {
        noghteh: 133
      }
    },
    {
      persian: "\u06A9\u062A\u0627\u0628",
      canonical: "ket\u0101b",
      register: "formal",
      pos: "noun",
      gloss: "book",
      reviewed: false,
      sources: {
        noghteh: 30
      }
    },
    {
      persian: "\u06A9\u062B\u06CC\u0641",
      canonical: "kas\u012Bf",
      register: "formal",
      pos: "noun",
      gloss: "dirty",
      reviewed: false,
      sources: {
        noghteh: 81
      }
    },
    {
      persian: "\u06A9\u062C\u0627",
      canonical: "koj\u0101",
      register: "colloquial",
      pos: "other",
      gloss: "where",
      reviewed: false,
      sources: {
        harfBezan: "l05-10"
      }
    },
    {
      persian: "\u06A9\u062F\u0627\u0645",
      canonical: "kodam",
      register: "formal",
      pos: "other",
      gloss: "which",
      reviewed: false
    },
    {
      persian: "\u06A9\u062F\u0648\u0645",
      canonical: "kod\u016Bm",
      register: "colloquial",
      pos: "other",
      gloss: "which",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F",
      canonical: "kard",
      register: "formal",
      pos: "other",
      gloss: "did/made",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F\u0645",
      canonical: "kardam",
      register: "formal",
      pos: "other",
      gloss: "I did/made",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F\u0646",
      canonical: "kardan",
      register: "formal",
      pos: "verb",
      gloss: "to do/make",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F\u0646\u062F",
      canonical: "kardand",
      register: "formal",
      pos: "other",
      gloss: "they did",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F\u0647",
      canonical: "kardeh",
      register: "formal",
      pos: "other",
      gloss: "done",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F\u06CC",
      canonical: "kard\u012B",
      register: "formal",
      pos: "other",
      gloss: "you did",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F\u06CC\u062F",
      canonical: "kard\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "you (pl.) did",
      reviewed: false
    },
    {
      persian: "\u06A9\u0631\u062F\u06CC\u0645",
      canonical: "kard\u012Bm",
      register: "formal",
      pos: "other",
      gloss: "we did",
      reviewed: false
    },
    {
      persian: "\u06A9\u0633",
      canonical: "kas",
      register: "formal",
      pos: "other",
      gloss: "person",
      reviewed: false
    },
    {
      persian: "\u06A9\u0633\u06CC",
      canonical: "kas\u012B",
      register: "formal",
      pos: "other",
      gloss: "someone",
      reviewed: false
    },
    {
      persian: "\u06A9\u0634\u0648\u0631",
      canonical: "keshvar",
      register: "formal",
      pos: "other",
      gloss: "country",
      reviewed: false
    },
    {
      persian: "\u06A9\u0641\u0634",
      canonical: "kafsh",
      register: "formal",
      pos: "noun",
      gloss: "shoe",
      reviewed: false,
      sources: {
        noghteh: 37
      }
    },
    {
      persian: "\u06A9\u0644\u0627\u0633",
      canonical: "kel\u0101s",
      register: "formal",
      pos: "noun",
      gloss: "class",
      reviewed: false,
      sources: {
        noghteh: 272
      }
    },
    {
      persian: "\u06A9\u0644\u0627\u063A",
      canonical: "kal\u0101gh",
      register: "formal",
      pos: "noun",
      gloss: "crow",
      reviewed: false,
      sources: {
        noghteh: 141
      }
    },
    {
      persian: "\u06A9\u0644\u0627\u0647",
      canonical: "kol\u0101h",
      register: "formal",
      pos: "noun",
      gloss: "hat",
      reviewed: false,
      sources: {
        noghteh: 159
      }
    },
    {
      persian: "\u06A9\u0644\u0645\u0647",
      canonical: "kalameh",
      register: "formal",
      pos: "other",
      gloss: "word",
      reviewed: false
    },
    {
      persian: "\u06A9\u0644\u06CC\u062F",
      canonical: "kel\u012Bd",
      register: "formal",
      pos: "noun",
      gloss: "key",
      reviewed: false,
      sources: {
        noghteh: 146
      }
    },
    {
      persian: "\u06A9\u0645",
      canonical: "kam",
      register: "formal",
      pos: "other",
      gloss: "little/few",
      reviewed: false
    },
    {
      persian: "\u06A9\u0645\u062A\u0631",
      canonical: "kamtar",
      register: "formal",
      pos: "other",
      gloss: "less",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646",
      canonical: "kon",
      register: "formal",
      pos: "other",
      gloss: "do!/make!",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u0627\u0631",
      canonical: "kenar",
      register: "formal",
      pos: "other",
      gloss: "beside",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u062F",
      canonical: "konad",
      register: "formal",
      pos: "other",
      gloss: "does",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u0645",
      canonical: "konam",
      register: "formal",
      pos: "other",
      gloss: "I do",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u0646\u062F",
      canonical: "konand",
      register: "formal",
      pos: "other",
      gloss: "they do",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u0647",
      canonical: "koneh",
      register: "colloquial",
      pos: "other",
      gloss: "does",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u06CC",
      canonical: "kon\u012B",
      register: "formal",
      pos: "other",
      gloss: "you do",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u06CC\u062F",
      canonical: "kon\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "you (pl.) do",
      reviewed: false
    },
    {
      persian: "\u06A9\u0646\u06CC\u0645",
      canonical: "kon\u012Bm",
      register: "formal",
      pos: "other",
      gloss: "we do",
      reviewed: false
    },
    {
      persian: "\u06A9\u0647",
      canonical: "keh",
      register: "formal",
      pos: "other",
      gloss: "that/which",
      reviewed: false
    },
    {
      persian: "\u06A9\u0648\u0686\u06A9",
      canonical: "k\u016Bchak",
      register: "formal",
      pos: "noun",
      gloss: "small",
      reviewed: false,
      sources: {
        noghteh: 87
      }
    },
    {
      persian: "\u06A9\u0648\u0686\u06CC\u06A9",
      canonical: "k\u016Bch\u012Bk",
      register: "colloquial",
      pos: "other",
      gloss: "small",
      reviewed: false
    },
    {
      persian: "\u06A9\u0648\u0647",
      canonical: "k\u016Bh",
      register: "formal",
      pos: "noun",
      gloss: "mountain",
      reviewed: false,
      sources: {
        noghteh: 193
      }
    },
    {
      persian: "\u06A9\u06CC",
      canonical: "key",
      register: "colloquial",
      pos: "other",
      gloss: "who/when",
      reviewed: false,
      sources: {
        harfBezan: "l05-24"
      }
    },
    {
      persian: "\u06A9\u06CC\u0641",
      canonical: "k\u012Bf",
      register: "formal",
      pos: "noun",
      gloss: "bag",
      reviewed: false,
      sources: {
        noghteh: 58
      }
    },
    {
      persian: "\u06AF\u0627\u0648",
      canonical: "g\u0101v",
      register: "formal",
      pos: "noun",
      gloss: "cow",
      reviewed: false,
      sources: {
        noghteh: 126
      }
    },
    {
      persian: "\u06AF\u067E",
      canonical: "gap",
      register: "formal",
      pos: "noun",
      gloss: "chat",
      reviewed: false,
      sources: {
        noghteh: 98
      }
    },
    {
      persian: "\u06AF\u0631\u0628\u0647",
      canonical: "gorbeh",
      register: "formal",
      pos: "noun",
      gloss: "cat",
      reviewed: false,
      sources: {
        noghteh: 53
      }
    },
    {
      persian: "\u06AF\u0631\u062F\u0646",
      canonical: "gardan",
      register: "formal",
      pos: "noun",
      gloss: "neck",
      reviewed: false,
      sources: {
        noghteh: 181
      }
    },
    {
      persian: "\u06AF\u0631\u062F\u0648",
      canonical: "gerd\u016B",
      register: "formal",
      pos: "noun",
      gloss: "walnut",
      reviewed: false,
      sources: {
        noghteh: 120
      }
    },
    {
      persian: "\u06AF\u0631\u0641\u062A",
      canonical: "gereft",
      register: "formal",
      pos: "other",
      gloss: "took/got",
      reviewed: false
    },
    {
      persian: "\u06AF\u0631\u0641\u062A\u0645",
      canonical: "gereftam",
      register: "formal",
      pos: "other",
      gloss: "I took",
      reviewed: false
    },
    {
      persian: "\u06AF\u0631\u06AF",
      canonical: "gorg",
      register: "formal",
      pos: "noun",
      gloss: "wolf",
      reviewed: false,
      sources: {
        noghteh: 131
      }
    },
    {
      persian: "\u06AF\u0631\u0645",
      canonical: "garm",
      register: "formal",
      pos: "noun",
      gloss: "hot",
      reviewed: false,
      sources: {
        noghteh: 88
      }
    },
    {
      persian: "\u06AF\u0641\u062A",
      canonical: "goft",
      register: "formal",
      pos: "other",
      gloss: "said",
      reviewed: false
    },
    {
      persian: "\u06AF\u0641\u062A\u0645",
      canonical: "goftam",
      register: "formal",
      pos: "other",
      gloss: "I said",
      reviewed: false
    },
    {
      persian: "\u06AF\u0641\u062A\u0646",
      canonical: "goftan",
      register: "formal",
      pos: "verb",
      gloss: "to say",
      reviewed: false
    },
    {
      persian: "\u06AF\u0641\u062A\u0647",
      canonical: "gofteh",
      register: "formal",
      pos: "other",
      gloss: "said(p.p.)",
      reviewed: false
    },
    {
      persian: "\u06AF\u0641\u062A\u06CC",
      canonical: "goft\u012B",
      register: "formal",
      pos: "other",
      gloss: "you said",
      reviewed: false
    },
    {
      persian: "\u06AF\u0644",
      canonical: "gol",
      register: "formal",
      pos: "noun",
      gloss: "flower",
      reviewed: false,
      sources: {
        noghteh: 195
      }
    },
    {
      persian: "\u06AF\u0645",
      canonical: "gam",
      register: "colloquial",
      pos: "other",
      gloss: "I say",
      reviewed: false
    },
    {
      persian: "\u06AF\u0648\u062C\u0647",
      canonical: "g\u016Bjeh",
      register: "formal",
      pos: "noun",
      gloss: "tomato",
      reviewed: false,
      sources: {
        noghteh: 103
      }
    },
    {
      persian: "\u06AF\u0648\u0634",
      canonical: "g\u016Bsh",
      register: "formal",
      pos: "noun",
      gloss: "ear",
      reviewed: false,
      sources: {
        noghteh: 34
      }
    },
    {
      persian: "\u0644\u0628",
      canonical: "lab",
      register: "formal",
      pos: "noun",
      gloss: "lip",
      reviewed: false,
      sources: {
        noghteh: 177
      }
    },
    {
      persian: "\u0644\u0628\u0627\u0633",
      canonical: "leb\u0101s",
      register: "formal",
      pos: "noun",
      gloss: "clothes",
      reviewed: false,
      sources: {
        noghteh: 160
      }
    },
    {
      persian: "\u0644\u067E",
      canonical: "lop",
      register: "formal",
      pos: "noun",
      gloss: "cheek",
      reviewed: false,
      sources: {
        noghteh: 246
      }
    },
    {
      persian: "\u0644\u062D\u0638\u0647",
      canonical: "lahzeh",
      register: "formal",
      pos: "noun",
      gloss: "moment",
      reviewed: false,
      sources: {
        noghteh: 94
      }
    },
    {
      persian: "\u0644\u0637\u0641\u0627",
      canonical: "lotfan",
      register: "colloquial",
      pos: "other",
      gloss: "please",
      reviewed: false,
      sources: {
        harfBezan: "l05-32"
      }
    },
    {
      persian: "\u0644\u06CC\u0645\u0648",
      canonical: "l\u012Bm\u016B",
      register: "formal",
      pos: "noun",
      gloss: "lemon",
      reviewed: false,
      sources: {
        noghteh: 118
      }
    },
    {
      persian: "\u0645\u0627",
      canonical: "ma",
      register: "formal",
      pos: "other",
      gloss: "we/us",
      reviewed: false
    },
    {
      persian: "\u0645\u0627\u062F\u0631",
      canonical: "m\u0101dar",
      register: "formal",
      pos: "noun",
      gloss: "mother",
      reviewed: false,
      sources: {
        noghteh: 61
      }
    },
    {
      persian: "\u0645\u0627\u0631",
      canonical: "m\u0101r",
      register: "formal",
      pos: "noun",
      gloss: "snake",
      reviewed: false,
      sources: {
        noghteh: 138
      }
    },
    {
      persian: "\u0645\u0627\u0698\u06CC\u06A9",
      canonical: "m\u0101zh\u012Bk",
      register: "formal",
      pos: "noun",
      gloss: "marker",
      reviewed: false,
      sources: {
        noghteh: 157
      }
    },
    {
      persian: "\u0645\u0627\u0633\u062A",
      canonical: "m\u0101st",
      register: "formal",
      pos: "noun",
      gloss: "yogurt",
      reviewed: false,
      sources: {
        noghteh: 108
      }
    },
    {
      persian: "\u0645\u0627\u0634\u06CC\u0646",
      canonical: "m\u0101sh\u012Bn",
      register: "formal",
      pos: "noun",
      gloss: "car",
      reviewed: false,
      sources: {
        noghteh: 54
      }
    },
    {
      persian: "\u0645\u0627\u0645\u0627\u0646",
      canonical: "maman",
      register: "formal",
      pos: "other",
      gloss: "mom",
      reviewed: false
    },
    {
      persian: "\u0645\u0627\u0646\u0646\u062F",
      canonical: "manand",
      register: "formal",
      pos: "other",
      gloss: "like/as",
      reviewed: false
    },
    {
      persian: "\u0645\u0627\u0647",
      canonical: "m\u0101h",
      register: "formal",
      pos: "noun",
      gloss: "moon",
      reviewed: false,
      sources: {
        noghteh: 192
      }
    },
    {
      persian: "\u0645\u0627\u0647\u06CC",
      canonical: "m\u0101h\u012B",
      register: "formal",
      pos: "noun",
      gloss: "fish",
      reviewed: false,
      sources: {
        noghteh: 105
      }
    },
    {
      persian: "\u0645\u0627\u0647\u06CC\u0686\u0647",
      canonical: "m\u0101h\u012Bcheh",
      register: "formal",
      pos: "noun",
      gloss: "muscle",
      reviewed: false,
      sources: {
        noghteh: 241
      }
    },
    {
      persian: "\u0645\u062A\u0634\u06A9\u0631\u0645",
      canonical: "motshakkeram",
      register: "formal",
      pos: "other",
      gloss: "thank you",
      reviewed: false
    },
    {
      persian: "\u0645\u062B\u0644",
      canonical: "mesl",
      register: "formal",
      pos: "other",
      gloss: "like",
      reviewed: false
    },
    {
      persian: "\u0645\u062B\u0644\u0627",
      canonical: "masalan",
      register: "formal",
      pos: "other",
      gloss: "for example",
      reviewed: false
    },
    {
      persian: "\u0645\u062B\u0644\u062B",
      canonical: "mosallas",
      register: "formal",
      pos: "noun",
      gloss: "triangle",
      reviewed: false,
      sources: {
        noghteh: 262
      }
    },
    {
      persian: "\u0645\u0686",
      canonical: "mach",
      register: "formal",
      pos: "noun",
      gloss: "wrist",
      reviewed: false,
      sources: {
        noghteh: 240
      }
    },
    {
      persian: "\u0645\u062F\u0627\u062F",
      canonical: "med\u0101d",
      register: "formal",
      pos: "noun",
      gloss: "pencil",
      reviewed: false,
      sources: {
        noghteh: 149
      }
    },
    {
      persian: "\u0645\u062F\u0631\u0633\u0647",
      canonical: "madreseh",
      register: "formal",
      pos: "noun",
      gloss: "school",
      reviewed: false,
      sources: {
        noghteh: 276
      }
    },
    {
      persian: "\u0645\u0631\u062F",
      canonical: "mard",
      register: "formal",
      pos: "noun",
      gloss: "man",
      reviewed: false,
      sources: {
        noghteh: 67
      }
    },
    {
      persian: "\u0645\u0631\u062F\u0645",
      canonical: "mardom",
      register: "formal",
      pos: "other",
      gloss: "people",
      reviewed: false
    },
    {
      persian: "\u0645\u0631\u0633\u06CC",
      canonical: "mers\u012B",
      register: "colloquial",
      pos: "other",
      gloss: "thanks",
      reviewed: false
    },
    {
      persian: "\u0645\u0631\u063A",
      canonical: "morgh",
      register: "formal",
      pos: "noun",
      gloss: "hen",
      reviewed: false,
      sources: {
        noghteh: 142
      }
    },
    {
      persian: "\u0645\u0631\u06CC\u0636",
      canonical: "mar\u012Bz",
      register: "formal",
      pos: "noun",
      gloss: "sick",
      reviewed: false,
      sources: {
        noghteh: 83
      }
    },
    {
      persian: "\u0645\u0698\u0647",
      canonical: "mozheh",
      register: "formal",
      pos: "noun",
      gloss: "eyelash",
      reviewed: false,
      sources: {
        noghteh: 183
      }
    },
    {
      persian: "\u0645\u0634\u06A9\u0644",
      canonical: "moshkel",
      register: "formal",
      pos: "other",
      gloss: "problem",
      reviewed: false
    },
    {
      persian: "\u0645\u063A\u0632",
      canonical: "maghz",
      register: "formal",
      pos: "noun",
      gloss: "brain",
      reviewed: false,
      sources: {
        noghteh: 186
      }
    },
    {
      persian: "\u0645\u06AF\u0633",
      canonical: "magas",
      register: "formal",
      pos: "noun",
      gloss: "fly",
      reviewed: false,
      sources: {
        noghteh: 128
      }
    },
    {
      persian: "\u0645\u0645\u0646\u0648\u0646",
      canonical: "mamn\u016Bn",
      register: "formal",
      pos: "other",
      gloss: "thanks",
      reviewed: false
    },
    {
      persian: "\u0645\u0646",
      canonical: "man",
      register: "formal",
      pos: "noun",
      gloss: "i / Me",
      reviewed: false,
      parts: [
        {
          fin: "man",
          role: "plain",
          gloss: "I"
        }
      ],
      sources: {
        noghteh: 63,
        harfBezan: "l02-26"
      }
    },
    {
      persian: "\u0645\u0647\u0645",
      canonical: "mohem",
      register: "formal",
      pos: "other",
      gloss: "important",
      reviewed: false
    },
    {
      persian: "\u0645\u0648",
      canonical: "m\u016B",
      register: "formal",
      pos: "noun",
      gloss: "hair",
      reviewed: false,
      sources: {
        noghteh: 179
      }
    },
    {
      persian: "\u0645\u0648\u0632",
      canonical: "m\u016Bz",
      register: "formal",
      pos: "noun",
      gloss: "banana",
      reviewed: false,
      sources: {
        noghteh: 123
      }
    },
    {
      persian: "\u0645\u0648\u0634",
      canonical: "m\u016Bsh",
      register: "formal",
      pos: "noun",
      gloss: "mouse",
      reviewed: false,
      sources: {
        noghteh: 11
      }
    },
    {
      persian: "\u0645\u06CC",
      canonical: "m\u012B",
      register: "formal",
      pos: "other",
      gloss: "(present tense prefix)",
      reviewed: false
    },
    {
      persian: "\u0645\u06CC\u0627\u062F",
      canonical: "miy\u0101d",
      register: "colloquial",
      pos: "verb",
      gloss: "present (replaces be-) + come + he / she",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "d",
          role: "ending",
          gloss: "he / she"
        }
      ],
      sources: {
        harfBezan: "l03-34"
      }
    },
    {
      persian: "\u0645\u06CC\u0627\u0645",
      canonical: "miy\u0101m",
      register: "colloquial",
      pos: "verb",
      gloss: "I come / I'm coming",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "m",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l03-03"
      }
    },
    {
      persian: "\u0645\u06CC\u0627\u06CC\u0645",
      canonical: "miy\u0101ym",
      register: "colloquial",
      pos: "verb",
      gloss: "present (replaces be-) + come + we",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "ym",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l03-35"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062A\u0648\u0646\u0645",
      canonical: "m\u012Bt\u016Bnam",
      register: "colloquial",
      pos: "verb",
      gloss: "I can",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l01-19"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062A\u0648\u0646\u0647",
      canonical: "m\u012Bt\u016Bneh",
      register: "colloquial",
      pos: "verb",
      gloss: "ongoing / present + can + he/she",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "e",
          role: "ending",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-23"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062A\u0648\u0646\u06CC",
      canonical: "m\u012Bt\u016Bn\u012B",
      register: "colloquial",
      pos: "verb",
      gloss: "you can",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "i",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-09"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062A\u0648\u0646\u06CC\u0645",
      canonical: "m\u012Bt\u016Bn\u012Bm",
      register: "colloquial",
      pos: "verb",
      gloss: "we can",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "im",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l02-30"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0627\u062F",
      canonical: "m\u012Bkh\u0101d",
      register: "colloquial",
      pos: "verb",
      gloss: "he/she wants",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "d",
          role: "ending",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-14"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0627\u0633\u062A\u0645",
      canonical: "m\u012Bkh\u0101stam",
      register: "colloquial",
      pos: "verb",
      gloss: "I wanted",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing"
        },
        {
          fin: "kh\u0101st",
          role: "stem",
          gloss: "wanted (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-01"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0627\u0645",
      canonical: "m\u012Bkh\u0101m",
      register: "colloquial",
      pos: "verb",
      gloss: "I want",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "m",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l01-01"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0627\u0646",
      canonical: "m\u012Bkh\u0101n",
      register: "colloquial",
      pos: "verb",
      gloss: "ongoing / present + want + they",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "n",
          role: "ending",
          gloss: "they"
        }
      ],
      sources: {
        harfBezan: "l02-35"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0627\u06CC",
      canonical: "m\u012Bkh\u0101y",
      register: "colloquial",
      pos: "verb",
      gloss: "you want",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "y",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-01"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0627\u06CC\u0645",
      canonical: "m\u012Bkh\u0101ym",
      register: "colloquial",
      pos: "verb",
      gloss: "ongoing / present + want + we",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "ym",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l02-28"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0627\u06CC\u0646",
      canonical: "m\u012Bkh\u0101yn",
      register: "colloquial",
      pos: "verb",
      gloss: "ongoing / present + want + you all",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "yn",
          role: "ending",
          gloss: "you all"
        }
      ],
      sources: {
        harfBezan: "l02-33"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u062E\u0648\u0631\u0645",
      canonical: "m\u012Bkhoram",
      register: "colloquial",
      pos: "verb",
      gloss: "I eat / I'm eating",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "khor",
          role: "stem",
          gloss: "eat"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l03-05"
      }
    },
    {
      persian: "\u0645\u06CC\u0631\u0627\u062B",
      canonical: "m\u012Br\u0101s",
      register: "formal",
      pos: "noun",
      gloss: "inheritance",
      reviewed: false,
      sources: {
        noghteh: 263
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u0631\u0645",
      canonical: "m\u012Bram",
      register: "colloquial",
      pos: "verb",
      gloss: "I go / I'm going",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l03-01"
      }
    },
    {
      persian: "\u0645\u06CC\u200C\u0631\u06CC",
      canonical: "m\u012Br\u012B",
      register: "colloquial",
      pos: "verb",
      gloss: "ongoing / present + go + you",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "i",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l05-27"
      }
    },
    {
      persian: "\u0645\u06CC\u0632",
      canonical: "m\u012Bz",
      register: "formal",
      pos: "noun",
      gloss: "table",
      reviewed: false,
      sources: {
        noghteh: 48
      }
    },
    {
      persian: "\u0645\u06CC\u0634\u0647",
      canonical: "m\u012Bsheh",
      register: "colloquial",
      pos: "verb",
      gloss: "ongoing / present + become + it",
      reviewed: false,
      parts: [
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "sh",
          role: "stem",
          gloss: "become"
        },
        {
          fin: "e",
          role: "ending",
          gloss: "it"
        }
      ],
      sources: {
        harfBezan: "l05-28"
      }
    },
    {
      persian: "\u0645\u06CC\u0648\u0647",
      canonical: "m\u012Bveh",
      register: "formal",
      pos: "other",
      gloss: "fruit",
      reviewed: false
    },
    {
      persian: "\u0646\u0627",
      canonical: "na",
      register: "formal",
      pos: "other",
      gloss: "un-/not",
      reviewed: false
    },
    {
      persian: "\u0646\u0627\u062E\u0646",
      canonical: "n\u0101khon",
      register: "formal",
      pos: "noun",
      gloss: "fingernail",
      reviewed: false,
      sources: {
        noghteh: 178
      }
    },
    {
      persian: "\u0646\u0627\u0631\u0627\u062D\u062A",
      canonical: "narahat",
      register: "formal",
      pos: "other",
      gloss: "upset",
      reviewed: false
    },
    {
      persian: "\u0646\u0627\u0631\u0646\u062C\u06CC",
      canonical: "n\u0101renj\u012B",
      register: "formal",
      pos: "noun",
      gloss: "orange",
      reviewed: false,
      sources: {
        noghteh: 231
      }
    },
    {
      persian: "\u0646\u0627\u0645",
      canonical: "nam",
      register: "formal",
      pos: "other",
      gloss: "name",
      reviewed: false
    },
    {
      persian: "\u0646\u0627\u0646",
      canonical: "n\u0101n",
      register: "formal",
      pos: "noun",
      gloss: "bread",
      reviewed: false,
      sources: {
        noghteh: 4
      }
    },
    {
      persian: "\u0646\u0627\u0647\u0627\u0631",
      canonical: "n\u0101h\u0101r",
      register: "formal",
      pos: "noun",
      gloss: "lunch",
      reviewed: false,
      sources: {
        noghteh: 117
      }
    },
    {
      persian: "\u0646\u0628\u0627\u06CC\u062F",
      canonical: "nab\u0101yad",
      register: "colloquial",
      pos: "other",
      gloss: "must not",
      reviewed: false,
      parts: [
        {
          fin: "na",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "b\u0101yad",
          role: "stem",
          gloss: "must / have to"
        }
      ],
      sources: {
        harfBezan: "l06-13"
      }
    },
    {
      persian: "\u0646\u0628\u0648\u062F",
      canonical: "nab\u016Bd",
      register: "formal",
      pos: "other",
      gloss: "was not",
      reviewed: false
    },
    {
      persian: "\u0646\u062E\u0648\u0631\u062F\u0645",
      canonical: "nakhordam",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ate (past stem) + I",
      reviewed: false,
      parts: [
        {
          fin: "na",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "khord",
          role: "stem",
          gloss: "ate (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-23"
      }
    },
    {
      persian: "\u0646\u062F\u0627\u0631\u062F",
      canonical: "nadarad",
      register: "formal",
      pos: "other",
      gloss: "doesn't have",
      reviewed: false
    },
    {
      persian: "\u0646\u062F\u0627\u0631\u0645",
      canonical: "nadaram",
      register: "formal",
      pos: "other",
      gloss: "I don't have",
      reviewed: false
    },
    {
      persian: "\u0646\u062F\u0627\u0631\u0647",
      canonical: "nadareh",
      register: "colloquial",
      pos: "other",
      gloss: "doesn't have",
      reviewed: false
    },
    {
      persian: "\u0646\u062F\u0627\u0631\u06CC",
      canonical: "nadari",
      register: "formal",
      pos: "other",
      gloss: "you don't have",
      reviewed: false
    },
    {
      persian: "\u0646\u0631\u0641\u062A\u0645",
      canonical: "naraftam",
      register: "colloquial",
      pos: "verb",
      gloss: "I didn't go",
      reviewed: false,
      parts: [
        {
          fin: "na",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "raft",
          role: "stem",
          gloss: "went (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-14"
      }
    },
    {
      persian: "\u0646\u0634\u0627\u0637",
      canonical: "nesh\u0101t",
      register: "formal",
      pos: "noun",
      gloss: "joy",
      reviewed: false,
      sources: {
        noghteh: 253
      }
    },
    {
      persian: "\u0646\u0635\u0641",
      canonical: "nesf",
      register: "formal",
      pos: "noun",
      gloss: "half",
      reviewed: false,
      sources: {
        noghteh: 250
      }
    },
    {
      persian: "\u0646\u0638\u0631",
      canonical: "nazar",
      register: "formal",
      pos: "noun",
      gloss: "opinion",
      reviewed: false,
      sources: {
        noghteh: 275
      }
    },
    {
      persian: "\u0646\u0639\u0646\u0627",
      canonical: "na'n\u0101",
      register: "formal",
      pos: "noun",
      gloss: "mint",
      reviewed: false,
      sources: {
        noghteh: 260
      }
    },
    {
      persian: "\u0646\u0642\u0634\u0647",
      canonical: "naghsheh",
      register: "formal",
      pos: "noun",
      gloss: "map",
      reviewed: false,
      sources: {
        noghteh: 169
      }
    },
    {
      persian: "\u0646\u06A9\u0646",
      canonical: "nakon",
      register: "formal",
      pos: "other",
      gloss: "don't!",
      reviewed: false
    },
    {
      persian: "\u0646\u0645\u06A9",
      canonical: "namak",
      register: "formal",
      pos: "noun",
      gloss: "salt",
      reviewed: false,
      sources: {
        noghteh: 32
      }
    },
    {
      persian: "\u0646\u0645\u06CC",
      canonical: "nem\u012B",
      register: "formal",
      pos: "other",
      gloss: "(negative present prefix)",
      reviewed: false
    },
    {
      persian: "\u0646\u0645\u06CC\u0627\u0645",
      canonical: "nemiy\u0101m",
      register: "colloquial",
      pos: "verb",
      gloss: "I don't come / I'm not coming",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "y\u0101",
          role: "stem",
          gloss: "come"
        },
        {
          fin: "m",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l03-18"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0646\u0633\u062A\u0645",
      canonical: "nem\u012Bt\u016Bnestam",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing + could (past stem) + I",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing"
        },
        {
          fin: "t\u016Bnest",
          role: "stem",
          gloss: "could (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-32"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0646\u0645",
      canonical: "nem\u012Bt\u016Bnam",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing / present + can + I",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l01-21"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0646\u0646",
      canonical: "nem\u012Bt\u016Bnan",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing / present + can + they",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "an",
          role: "ending",
          gloss: "they"
        }
      ],
      sources: {
        harfBezan: "l02-36"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0646\u0647",
      canonical: "nem\u012Bt\u016Bneh",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing / present + can + he/she",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "e",
          role: "ending",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-24"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0646\u06CC",
      canonical: "nem\u012Bt\u016Bn\u012B",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing / present + can + you",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "i",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-12"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0646\u06CC\u0645",
      canonical: "nem\u012Bt\u016Bn\u012Bm",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing / present + can + we",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "im",
          role: "ending",
          gloss: "we"
        }
      ],
      sources: {
        harfBezan: "l02-31"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0646\u06CC\u0646",
      canonical: "nem\u012Bt\u016Bn\u012Bn",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing / present + can + you all",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "t\u016Bn",
          role: "stem",
          gloss: "can"
        },
        {
          fin: "in",
          role: "ending",
          gloss: "you all"
        }
      ],
      sources: {
        harfBezan: "l02-34"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062E\u0648\u0627\u062F",
      canonical: "nem\u012Bkh\u0101d",
      register: "colloquial",
      pos: "verb",
      gloss: "he doesn't want",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "d",
          role: "ending",
          gloss: "he/she"
        }
      ],
      sources: {
        harfBezan: "l02-16"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062E\u0648\u0627\u0633\u062A\u0645",
      canonical: "nem\u012Bkh\u0101stam",
      register: "colloquial",
      pos: "verb",
      gloss: "not + ongoing + wanted (past stem) + I",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing"
        },
        {
          fin: "kh\u0101st",
          role: "stem",
          gloss: "wanted (past stem)"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l04-06"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062E\u0648\u0627\u0645",
      canonical: "nem\u012Bkh\u0101m",
      register: "colloquial",
      pos: "verb",
      gloss: "I don't want",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "m",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l01-06"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062E\u0648\u0627\u06CC",
      canonical: "nem\u012Bkh\u0101y",
      register: "colloquial",
      pos: "verb",
      gloss: "you don't want",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "ongoing / present"
        },
        {
          fin: "kh\u0101",
          role: "stem",
          gloss: "want"
        },
        {
          fin: "y",
          role: "ending",
          gloss: "you"
        }
      ],
      sources: {
        harfBezan: "l02-04"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u062E\u0648\u0631\u0645",
      canonical: "nem\u012Bkhoram",
      register: "colloquial",
      pos: "verb",
      gloss: "I don't eat / I'm not eating",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "khor",
          role: "stem",
          gloss: "eat"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l03-20"
      }
    },
    {
      persian: "\u0646\u0645\u06CC\u200C\u0631\u0645",
      canonical: "nem\u012Bram",
      register: "colloquial",
      pos: "verb",
      gloss: "I don't go / I'm not going",
      reviewed: false,
      parts: [
        {
          fin: "ne",
          role: "neg",
          gloss: "not"
        },
        {
          fin: "mi",
          role: "prefix",
          gloss: "present (replaces be-)"
        },
        {
          fin: "r",
          role: "stem",
          gloss: "go"
        },
        {
          fin: "am",
          role: "ending",
          gloss: "I"
        }
      ],
      sources: {
        harfBezan: "l03-16"
      }
    },
    {
      persian: "\u0646\u0647",
      canonical: "noh",
      register: "formal",
      pos: "number",
      gloss: "nine",
      reviewed: false,
      sources: {
        noghteh: 224
      }
    },
    {
      persian: "\u0646\u0647",
      canonical: "na",
      register: "colloquial",
      pos: "particle",
      gloss: "no",
      reviewed: false,
      sources: {
        harfBezan: "l05-06"
      }
    },
    {
      persian: "\u0646\u06CC\u0633\u062A",
      canonical: "n\u012Bst",
      register: "formal",
      pos: "other",
      gloss: "is not",
      reviewed: false
    },
    {
      persian: "\u0647\u0627",
      canonical: "ha",
      register: "formal",
      pos: "other",
      gloss: "(plural marker)",
      reviewed: false
    },
    {
      persian: "\u0647\u0631",
      canonical: "har",
      register: "formal",
      pos: "other",
      gloss: "every",
      reviewed: false
    },
    {
      persian: "\u0647\u0632\u0627\u0631",
      canonical: "hezar",
      register: "formal",
      pos: "other",
      gloss: "thousand",
      reviewed: false
    },
    {
      persian: "\u0647\u0633\u062A",
      canonical: "hast",
      register: "formal",
      pos: "other",
      gloss: "is/exists",
      reviewed: false
    },
    {
      persian: "\u0647\u0633\u062A\u0645",
      canonical: "hastam",
      register: "formal",
      pos: "other",
      gloss: "I am",
      reviewed: false
    },
    {
      persian: "\u0647\u0633\u062A\u0646\u062F",
      canonical: "hastand",
      register: "formal",
      pos: "other",
      gloss: "they are",
      reviewed: false
    },
    {
      persian: "\u0647\u0633\u062A\u06CC",
      canonical: "hast\u012B",
      register: "formal",
      pos: "other",
      gloss: "you are",
      reviewed: false
    },
    {
      persian: "\u0647\u0633\u062A\u06CC\u062F",
      canonical: "hast\u012Bd",
      register: "formal",
      pos: "other",
      gloss: "you (pl.) are",
      reviewed: false
    },
    {
      persian: "\u0647\u0633\u062A\u06CC\u0645",
      canonical: "hast\u012Bm",
      register: "formal",
      pos: "other",
      gloss: "we are",
      reviewed: false
    },
    {
      persian: "\u0647\u0634\u062A",
      canonical: "hasht",
      register: "formal",
      pos: "noun",
      gloss: "eight",
      reviewed: false,
      sources: {
        noghteh: 223
      }
    },
    {
      persian: "\u0647\u0641\u062A",
      canonical: "haft",
      register: "formal",
      pos: "noun",
      gloss: "seven",
      reviewed: false,
      sources: {
        noghteh: 222
      }
    },
    {
      persian: "\u0647\u0641\u062A\u0647",
      canonical: "hafteh",
      register: "formal",
      pos: "other",
      gloss: "week",
      reviewed: false
    },
    {
      persian: "\u0647\u0645",
      canonical: "ham",
      register: "formal",
      pos: "other",
      gloss: "also/too",
      reviewed: false
    },
    {
      persian: "\u0647\u0645\u0627\u0646",
      canonical: "haman",
      register: "formal",
      pos: "other",
      gloss: "that very",
      reviewed: false
    },
    {
      persian: "\u0647\u0645\u0647",
      canonical: "hameh",
      register: "formal",
      pos: "noun",
      gloss: "all",
      reviewed: false,
      sources: {
        noghteh: 91
      }
    },
    {
      persian: "\u0647\u0645\u06CC\u0634\u0647",
      canonical: "ham\u012Bsheh",
      register: "formal",
      pos: "other",
      gloss: "always",
      reviewed: false
    },
    {
      persian: "\u0647\u0645\u06CC\u0646",
      canonical: "ham\u012Bn",
      register: "formal",
      pos: "other",
      gloss: "this very",
      reviewed: false
    },
    {
      persian: "\u0647\u0646\u0648\u0632",
      canonical: "han\u016Bz",
      register: "formal",
      pos: "other",
      gloss: "still/yet",
      reviewed: false
    },
    {
      persian: "\u0647\u0648\u0627",
      canonical: "hav\u0101",
      register: "formal",
      pos: "noun",
      gloss: "air",
      reviewed: false,
      sources: {
        noghteh: 196
      }
    },
    {
      persian: "\u0647\u0648\u06CC\u062C",
      canonical: "hav\u012Bj",
      register: "formal",
      pos: "noun",
      gloss: "carrot",
      reviewed: false,
      sources: {
        noghteh: 110
      }
    },
    {
      persian: "\u0647\u06CC\u0686",
      canonical: "h\u012Bch",
      register: "formal",
      pos: "noun",
      gloss: "none",
      reviewed: false,
      sources: {
        noghteh: 90
      }
    },
    {
      persian: "\u0647\u06CC\u0686\u06A9\u0633",
      canonical: "h\u012Bchkas",
      register: "formal",
      pos: "other",
      gloss: "nobody",
      reviewed: false
    },
    {
      persian: "\u0647\u06CC\u0686\u0648\u0642\u062A",
      canonical: "h\u012Bchvaght",
      register: "formal",
      pos: "other",
      gloss: "never",
      reviewed: false
    },
    {
      persian: "\u0648",
      canonical: "va",
      register: "formal",
      pos: "conjunction",
      gloss: "and",
      reviewed: false
    },
    {
      persian: "\u0648",
      canonical: "o",
      register: "colloquial",
      pos: "conjunction",
      gloss: "and",
      reviewed: false,
      sources: {
        harfBezan: "l06-29"
      }
    },
    {
      persian: "\u0648\u0627\u0642\u0639\u0627",
      canonical: "vaghean",
      register: "formal",
      pos: "other",
      gloss: "really",
      reviewed: false
    },
    {
      persian: "\u0648\u0642\u062A",
      canonical: "vaght",
      register: "formal",
      pos: "other",
      gloss: "time",
      reviewed: false
    },
    {
      persian: "\u0648\u0644\u06CC",
      canonical: "val\u012B",
      register: "colloquial",
      pos: "other",
      gloss: "but",
      reviewed: false,
      sources: {
        harfBezan: "l03-40"
      }
    },
    {
      persian: "\u06CC\u0627",
      canonical: "y\u0101",
      register: "colloquial",
      pos: "other",
      gloss: "or",
      reviewed: false,
      sources: {
        harfBezan: "l06-26"
      }
    },
    {
      persian: "\u06CC\u062E",
      canonical: "yakh",
      register: "formal",
      pos: "noun",
      gloss: "ice",
      reviewed: false,
      sources: {
        noghteh: 17
      }
    },
    {
      persian: "\u06CC\u0639\u0646\u06CC",
      canonical: "yan\u012B",
      register: "formal",
      pos: "other",
      gloss: "meaning/I mean",
      reviewed: false
    },
    {
      persian: "\u06CC\u06A9",
      canonical: "yek",
      register: "formal",
      pos: "noun",
      gloss: "one",
      reviewed: false,
      sources: {
        noghteh: 216
      }
    },
    {
      persian: "\u06CC\u06A9\u0634\u0646\u0628\u0647",
      canonical: "yekshanbeh",
      register: "formal",
      pos: "noun",
      gloss: "Sunday",
      reviewed: false,
      sources: {
        noghteh: 278
      }
    }
  ];

  // src/lexicon/key.js
  var ZWNJ = /‌/g;
  var normalizeKey = (persian) => persian.normalize("NFC").replace(ZWNJ, "").replace(/ي/g, "\u06CC").replace(/ك/g, "\u06A9");

  // src/lexicon/index.js
  var all = () => seed_default;
  var lookup = (persian, { pos, register } = {}) => {
    const key = normalizeKey(persian);
    return seed_default.filter(
      (entry) => normalizeKey(entry.persian) === key && (pos === void 0 || entry.pos === pos) && (register === void 0 || entry.register === register)
    );
  };
  return __toCommonJS(src_exports);
})();
