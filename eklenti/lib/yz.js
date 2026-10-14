// Chrome'un yerleşik yapay zekâsı (Gemini Nano, Prompt API) ile noktalama/yazım düzeltme.
// Eklenti sayfasında (ayarlar) ve arka plan service worker'ında çalışır.
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

  // Kuralları geçmiş metne yalnız modelin noktalamasını uygular. Satır satır (satır sonları korunur);
  // kelimeler her zaman girdiden gelir (Turkce.birlestir), model anlamı değiştiremez.
  async function yzUygula(metin, ilerleme) {
    var o = await oturumAc(ilerleme);
    var satirlar = metin.split('\n');
    for (var i = 0; i < satirlar.length; i++) {
      var satir = satirlar[i];
      if (!/\p{L}/u.test(satir)) continue;
      var k = await o.clone(); // her satır temiz bağlamla (örnekler korunur)
      try {
        var cevap = (await k.prompt(satir.trim())).trim()
          .replace(/^```[a-z]*\n?|\n?```$/g, '').replace(/\s*\n+\s*/g, ' ');
        var bas = satir.match(/^\s*/)[0], son = satir.match(/\s*$/)[0];
        satirlar[i] = bas + kok.Turkce.birlestir(satir.trim(), cevap) + son;
      } finally { k.destroy(); }
    }
    return satirlar.join('\n');
  }

  // Deneme sayfası için: önce ücretsiz kurallar (karakter + büyük harf), sonra model.
  async function duzelt(metin, ilerleme) {
    var on = kok.Turkce.duzelt(metin, 0, metin.length, 'tam');
    return { kurallar: on, yz: await yzUygula(on, ilerleme) };
  }

  kok.TurkceYZ = { durum: durum, oturumAc: oturumAc, duzelt: duzelt, yzUygula: yzUygula };
})(globalThis);
