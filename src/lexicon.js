// Common Persian words -> fixed Finglish spelling + short English gloss.
// Format: whitespace-separated triples "persian finglish gloss"; use _ for spaces in the gloss.
// Keys must use Persian ی (U+06CC) and ک (U+06A9), no diacritics, no ZWNJ.
// Add words freely; test.js checks for duplicates, bad keys and missing glosses.
(function (root) {
  const RAW = `
  من man I/me تو to you(sg.) او oo he/she آنها anha they اونا oona they(colloq.) اونها oonha they(colloq.)
  ما ma we/us شما shoma you(pl./formal) ایشان ishan he/she(formal)
  این in this آن an that اون oon that(colloq.) همین hamin this_very همان haman that_very
  اینجا inja here آنجا anja there اونجا oonja there(colloq.) اینها inha these
  است ast is هست hast is/exists هستم hastam I_am هستی hasti you_are هستیم hastim we_are
  هستید hastid you_(pl.)_are هستند hastand they_are نیست nist is_not
  بود bood was بودم boodam I_was بودی boodi you_were بودیم boodim we_were بودند boodand they_were
  بودن boodan to_be/being نبود nabood was_not بوده boodeh has_been
  باشد bashad may_be باشه basheh okay/may_be باشم basham I_may_be باشی bashi you_may_be
  باشید bashid you_(pl.)_may_be باشند bashand they_may_be باش bash be!
  می mi (present_tense_prefix) نمی nemi (negative_present_prefix) بی bi without/un- نا na un-/not
  دارم daram I_have داری dari you_have دارد darad he/she_has داره dareh has(colloq.)
  داریم darim we_have دارید darid you_(pl.)_have دارند darand they_have
  ندارم nadaram I_don't_have نداری nadari you_don't_have ندارد nadarad doesn't_have
  نداره nadareh doesn't_have(colloq.)
  خواهم khaham I_will/want خوام khaam I_want(colloq.) خواهی khahi you_will/want
  خواهد khahad will/wants خواستم khastam I_wanted خواست khast wanted خواستن khastan to_want
  کردم kardam I_did/made کردی kardi you_did کرد kard did/made کردیم kardim we_did
  کردید kardid you_(pl.)_did کردند kardand they_did کردن kardan to_do/make کرده kardeh done
  کن kon do!/make! کنم konam I_do کنی koni you_do کند konad does کنه koneh does(colloq.)
  کنیم konim we_do کنید konid you_(pl.)_do کنند konand they_do نکن nakon don't!
  رفتم raftam I_went رفت raft went رفتی rafti you_went رفتیم raftim we_went
  رفتن raftan to_go رفته rafteh gone
  برو boro go! برم baram (that)_I_go بریم berim let's_go بره bareh (that)_he/she_goes برید berid go!(pl.)
  رم ram I_go(colloq.) روم ravam I_go رود ravad goes
  آمد amad came اومد oomad came(colloq.) آمدم amadam I_came اومدم oomadam I_came(colloq.)
  اومدی oomadi you_came آمدن amadan to_come اومدن oomadan to_come(colloq.)
  بیا biya come! بیاد biyad (that)_he/she_comes بیام biyam (that)_I_come بیایید biyayid come!(pl.)
  گفت goft said گفتم goftam I_said گفتی gofti you_said گفتن goftan to_say گفته gofteh said(p.p.)
  بگو bego say!/tell! بگم begam (that)_I_say بگی begi (that)_you_say گم gam I_say(colloq.)
  دیدم didam I_saw دید did saw دیدی didi you_saw دیدن didan to_see ببین bebin look!/see!
  ببینم bebinam (that)_I_see بینم binam I_see
  داد dad gave دادم dadam I_gave داده dadeh given بده bedeh give! بدم bedam (that)_I_give
  بدی bedi (that)_you_give
  گرفت gereft took/got گرفتم gereftam I_took بگیر begir take! بگیرم begiram (that)_I_take
  شد shod became/happened شدم shodam I_became شدی shodi you_became شدن shodan to_become
  شده shodeh become/been شدند shodand they_became
  شه sheh becomes(colloq.) شود shavad becomes بشه besheh (that)_it_becomes
  بشم besham (that)_I_become بشود beshavad (that)_it_becomes
  خورد khord ate خوردم khordam I_ate خوردن khordan to_eat/drink بخور bekhor eat! بخورم bekhoram (that)_I_eat
  دانم danam I_know دونم doonam I_know(colloq.) دونی dooni you_know(colloq.) دانی dani you_know
  باید bayad must/should نباید nabayad must_not تونم toonam I_can(colloq.) توانم tavanam I_can
  تونی tooni you_can(colloq.) تونه tooneh can(colloq.)
  خوب khoob good خوبه khoobeh it's_good خوبی khoobi you're_good/goodness بد bad bad
  بزرگ bozorg big کوچک koochak small کوچیک koochik small(colloq.)
  خیلی kheili very/a_lot کم kam little/few زیاد ziyad a_lot/many همه hameh all/everyone
  هیچ hich none/no هر har every چند chand how_many/several
  چه che what چی chi what(colloq.) چرا chera why کی ki who/when کجا koja where
  کدام kodam which کدوم kodoom which(colloq.) چطور chetor how چگونه chegooneh how چقدر cheghadr how_much
  چون choon because اگر agar if اگه age if(colloq.) ولی vali but اما amma but یا ya or و va and هم ham also/too
  هنوز hanooz still/yet همیشه hamisheh always هیچوقت hichvaght never حالا hala now الان alan right_now
  امروز emrooz today دیروز dirooz yesterday فردا farda tomorrow امشب emshab tonight
  دیشب dishab last_night صبح sobh morning ظهر zohr noon عصر asr afternoon
  شب shab night روز rooz day وقت vaght time سال sal year ماه mah month/moon
  هفته hafteh week ساعت saat hour/clock دقیقه daghigheh minute
  بعد baad after/later قبل ghabl before دوباره dobareh again باز baz again/open
  بازم bazam again(colloq.) فقط faghat only حتما hatman definitely شاید shayad maybe
  واقعا vaghean really البته albateh of_course مثلا masalan for_example یعنی yani meaning/I_mean
  بله baleh yes آره areh yes(colloq.) نه na no
  از az from/of به be to/at در dar in/door با ba with برای baraye for بر bar on/upon
  تا ta until/to روی rooye on/face زیر zir under بالا bala up/above پایین paeen down/below
  جلو jelo front/ahead پشت posht behind کنار kenar beside بین beyn between
  مثل mesl like مانند manand like/as بدون bedoon without درباره darbareh about توی tooye inside
  آدم adam person/man مردم mardom people مرد mard man زن zan woman بچه bacheh child
  دختر dokhtar girl/daughter پسر pesar boy/son مادر madar mother پدر pedar father
  برادر baradar brother خواهر khahar sister دوست doost friend خانواده khanevadeh family
  خانه khaneh house خونه khooneh house(colloq.) کار kar work/job زندگی zendegi life
  دنیا donya world کشور keshvar country شهر shahr city آب ab water غذا gheza food
  نان nan bread چای chai tea کتاب ketab book فیلم film movie حرف harf word/talk
  کلمه kalameh word اسم esm name نام nam name پول pool money جا ja place چیز chiz thing
  چیزی chizi something سر sar head دست dast hand چشم cheshm eye دل del heart/stomach
  عشق eshgh love امید omid hope خدا khoda God خدایا khodaya oh_God قلب ghalb heart
  جان jan life/dear صدا seda sound/voice ماشین mashin car راه rah way/road
  ایران iran Iran فارسی farsi Persian انگلیسی engelisi English
  سلام salam hello خداحافظ khodahafez goodbye ممنون mamnoon thanks مرسی mersi thanks(colloq.)
  متشکرم motshakkeram thank_you ببخشید bebakhshid excuse_me/sorry لطفا lotfan please
  خواهش khahesh please/request مشکل moshkel problem سوال soal question جواب javab answer
  یک yek one دو do two سه se three چهار chahar four پنج panj five شش shesh six
  هفت haft seven هشت hasht eight ده dah ten صد sad hundred هزار hezar thousand
  بسیار besyar very خوشحال khoshhal happy ناراحت narahat upset مهم mohem important
  درست dorost correct/right غلط ghalat wrong راست rast right/true دروغ dorogh lie
  جدید jadid new قدیمی ghadimi old اول avval first/first_of_all اولین avalin first
  آخر akhar last/end آخرین akharin last بیشتر bishtar more کمتر kamtar less
  بهتر behtar better بهترین behtarin best
  کسی kasi someone کس kas person هیچکس hichkas nobody خب khob well/okay
  دیگه digeh else/anymore(colloq.) دیگر digar else/other حتی hatta even
  خودم khodam myself خودت khodat yourself خودش khodash himself/herself خود khod self
  بابا baba dad مامان maman mom آقا agha mister/sir خانم khanom lady/Mrs. دکتر doktor doctor آقای aghaye Mr.
  که ke that/which را ra (object_marker) رو ro (object_marker/colloq.) اینکه inke the_fact_that
  میز miz table میوه miveh fruit ها ha (plural_marker)
  `;

  const toks = RAW.trim().split(/\s+/);
  const map = Object.create(null);
  const gloss = Object.create(null);
  for (let i = 0; i + 2 < toks.length; i += 3) {
    map[toks[i]] = toks[i + 1];
    gloss[toks[i]] = toks[i + 2].replace(/_/g, ' ');
  }

  const api = { RAW, toks, map, gloss };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PersianLexicon = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
