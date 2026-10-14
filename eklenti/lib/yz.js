// Chrome'un yerleşik yapay zekâsı (Gemini Nano, Prompt API) ile noktalama/yazım düzeltme.
// Yalnız eklenti sayfalarında çalışır (ayarlar sayfası, ileride offscreen belge).
(function (kok) {
  if (kok.TurkceYZ) return;

  var TALIMAT =
    'You are a careful Turkish proofreader. The user sends Turkish text. Return the same text with ONLY these fixes:\n' +
    '- punctuation: add missing commas, periods and question marks; split run-on sentences with periods\n' +
    '- capital letter at the start of each sentence and for proper nouns\n' +
    '- Turkish letters (ç ğ ı ö ş ü İ) where they are missing, and obvious spelling mistakes\n' +
    '- write the conjunctions "de/da" and "ki" and the question particle "mi/mı/mu/mü" separately when needed\n' +
    'Never change, add, remove or reorder words. Never rephrase. Never translate. Keep line breaks.\n' +
    'Answer with the corrected text only, no explanations, no quotes.';

  var ORNEKLER = [
    ['bugun hava cok guzel disari cikalim mi ne dersin',
      'Bugün hava çok güzel, dışarı çıkalım mı? Ne dersin?'],
    ['Ben de geldim ama sen yoktun neredeydin acaba haber verseydin keske',
      'Ben de geldim ama sen yoktun. Neredeydin acaba? Haber verseydin keşke.']
  ];

  var DIL = { expectedInputs: [{ type: 'text', languages: ['tr'] }], expectedOutputs: [{ type: 'text', languages: ['tr'] }] };
  var DIL_EN = { expectedInputs: [{ type: 'text', languages: ['en'] }], expectedOutputs: [{ type: 'text', languages: ['en'] }] };

  function var_() { return typeof LanguageModel !== 'undefined'; }

  // Türkçe resmi olarak desteklenmiyorsa İngilizce bildirip yine Türkçe metin veriyoruz.
  async function durum() {
    if (!var_()) return { durum: 'yok', dil: null };
    var tr = await LanguageModel.availability(DIL).catch(function () { return 'unavailable'; });
    if (tr !== 'unavailable') return { durum: tr, dil: 'tr' };
    var en = await LanguageModel.availability(DIL_EN).catch(function () { return 'unavailable'; });
    return { durum: en, dil: en === 'unavailable' ? null : 'en' };
  }

  var oturum = null;
  // ilerleme(0..1): model indirilirken çağrılır. İlk indirme kullanıcı tıklamasıyla başlamalı.
  async function oturumAc(ilerleme) {
    if (oturum) return oturum;
    var d = await durum();
    if (!d.dil) throw new Error('Bu bilgisayarda/Chrome\'da yerleşik yapay zekâ kullanılamıyor (' + d.durum + ')');
    var bas = [{ role: 'system', content: TALIMAT }];
    ORNEKLER.forEach(function (o) { bas.push({ role: 'user', content: o[0] }, { role: 'assistant', content: o[1] }); });
    var secenek = Object.assign({
      initialPrompts: bas,
      monitor: function (m) {
        m.addEventListener('downloadprogress', function (e) { if (ilerleme) ilerleme(e.loaded); });
      }
    }, d.dil === 'tr' ? DIL : DIL_EN);
    // Düşük sıcaklık: yaratıcılık değil, sadık düzeltme istiyoruz.
    try {
      oturum = await LanguageModel.create(Object.assign({ temperature: 0.1, topK: 1 }, secenek));
    } catch (e) {
      oturum = await LanguageModel.create(secenek); // sıcaklık ayarı desteklenmiyorsa varsayılanla
    }
    return oturum;
  }

  // Metni düzeltir. Önce ücretsiz kurallar (karakter + büyük harf), sonra model.
  async function duzelt(metin, ilerleme) {
    var on = kok.Turkce ? kok.Turkce.duzelt(metin, 0, metin.length, 'tam') : metin;
    var o = await oturumAc(ilerleme);
    var k = await o.clone(); // her metin temiz bağlamla (örnekler korunur)
    try {
      var cevap = (await k.prompt(on)).trim();
      return { kurallar: on, yz: temizle(cevap, on) };
    } finally { k.destroy(); }
  }

  // Modelin olası süslerini ayıkla; metni çok değiştirdiyse güvenme.
  function temizle(cevap, girdi) {
    cevap = cevap.replace(/^```[a-z]*\n?|\n?```$/g, '').replace(/^["“”']|["“”']$/g, '').trim();
    var kelime = function (s) { return s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean); };
    var a = kelime(girdi), b = kelime(cevap);
    if (Math.abs(a.length - b.length) > Math.max(2, a.length * 0.15)) {
      throw new Error('Model metni fazla değiştirdi (kelime sayısı ' + a.length + ' → ' + b.length + '), kullanılmadı');
    }
    return cevap;
  }

  kok.TurkceYZ = { durum: durum, oturumAc: oturumAc, duzelt: duzelt };
})(globalThis);
