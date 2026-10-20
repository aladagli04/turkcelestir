// Türkçeleştir — sözlükle düzeltme: bitişik yazılmış kelimeleri ayırma ve tek harflik yazım hataları.
// Sözlük: kelime -> sıklık (OpenSubtitles 2018, bkz. LICENSE-sozluk.txt). Altyazı verisi yanlış yazımlar da
// içerir (herşey, yanlız), o yüzden "sözlükte var = doğru" denmez; düzeltme ancak doğru biçim çok daha
// sıksa ya da kelime hiç görülmemişse yapılır. İki biçim de yaygınsa (sık/şık) dokunulmaz.
// Arka planda (service worker) çalışır; Node testlerinde de.
(function (kok) {
  if (kok.TurkceSozluk) return;

  var UZ = '0123456789abcdefghijklmnopqrstuvwxyz';
  // sozluk.txt (önek kodlu) -> Map(kelime -> yaklaşık sıklık)
  function yukle(veri) {
    var harita = new Map(), onceki = '', bas = 0;
    while (bas < veri.length) {
      var son = veri.indexOf('\n', bas);
      if (son < 0) son = veri.length;
      var bitis = veri.charAt(son - 1) === '\r' ? son - 1 : son;           // CRLF'ye çevrilmiş kopya
      if (bitis - bas >= 3) {
        var n = UZ.indexOf(veri.charAt(bas));
        var kelime = onceki.slice(0, n) + veri.slice(bas + 1, bitis - 1);
        harita.set(kelime, Math.pow(2, (veri.charCodeAt(bitis - 1) - 48) / 2));
        onceki = kelime;
      }
      bas = son + 1;
    }
    return harita;
  }

  function kucult(s) { return s.toLocaleLowerCase('tr'); }
  function buyut(s) { return s.toLocaleUpperCase('tr'); }
  var ALFABE = 'abcçdefgğhıijklmnoöprsştuüvyz';
  var GORULMEMIS = 2; // sözlükte yoksa (< 5 kez geçmiş)

  // Ayırma: "olmasada" -> "olmasa da" yalnız şart kipinden sonra ("masada" gibi bulunma halini ayırmaz).
  var DA = new Set(['da', 'de', 'ta', 'te']);
  var SART = /(?:[^aeıioöuü]s[ae]|m[ae]s[ae])$/;
  // Genel ayırmada ikinci parça ek gibi başlamamalı: internetsiz, ayarlarda, çözücüden, hatırlatmasında.
  var EK_GIBI = /^(?:l[ae]r|l[ıiuü]k|s[ıiuü]z|s[ıiuü]n|[ıiuü]n|[dt][ae]|[ıiuü]?nd[ae]|s[ıiuü]nd|y[ae]|y[ıiuü]|c[ıiuü]|ç[ıiuü]|m[ıiuü]ş|m[ae]k|m[ae]z|[ıiuü]m|[ıiuü]z)/;
  // İlk parça 3 harfliyse yalnız bunlar (çokgüzel, birgün...).
  var KISA_ON = new Set('çok bir her hiç iyi pek daha çok tam son ilk'.split(' '));

  function ayir(k, say, sk) {
    var en = null, enPuan = 0;
    for (var i = 2; i <= k.length - 2; i++) {
      var a = k.slice(0, i), b = k.slice(i), puan;
      if (DA.has(b)) {
        if (!SART.test(a) || a.length < 4) continue;
        puan = say(a);
        if (puan < 256 || puan < 30 * sk) continue;
      } else {
        // Yalnız hiç görülmemiş kelime (kuşburnu, zeytinyağı gibi derlemde geçen birleşik kelimeler korunur).
        if (sk > GORULMEMIS || b.length < 4 || EK_GIBI.test(b)) continue;
        if (a.length < 4 && !KISA_ON.has(a)) continue;
        puan = Math.min(say(a), say(b));
        if (puan < 300) continue;
      }
      if (puan > enPuan) { enPuan = puan; en = a + ' ' + b; }
    }
    return en;
  }

  // Eksik harf (kelmeleri -> kelimeleri) ya da yer değiştirmiş iki harf (teşkekkür) düzeltmesi; en sık aday açık
  // ara öndeyse. Yalnız hiç görülmemiş kelimede, ilk harfe ve son iki harfe dokunmadan. Fazla/yanlış harf
  // düzeltilmez: Türkçede bir harf eksiltmek ya da değiştirmek çoğu zaman başka bir doğru kelime yapar
  // (ölçümüyle -> ölümüyle, repoda -> depoda, kamerasız -> kamerası).
  function yazim(k, say, sk) {
    // Sonda fazla harf: iki ünsüzle biten kelime, son harfi atılınca çok daha yaygınsa (değilm, geldimm).
    var kisa = k.slice(0, -1);
    if (/[^aeıioöuüâîû]{2}$/.test(k) && say(kisa) >= Math.max(10000, 1000 * sk)) return kisa;
    if (sk > GORULMEMIS) return null;
    // Son harfi atılınca yaygın bir kelime kalıyorsa karar verilemez (yapaya = yapay+a, yapmaya değil).
    if (say(kisa) >= 1000) return null;
    var sinir = k.length - 2;
    var enIyi = null, en = 0, ikinci = 0, gor = new Set();
    function dene(c) {
      if (c === k || gor.has(c)) return;
      gor.add(c);
      var s = say(c);
      if (s > en) { ikinci = en; en = s; enIyi = c; } else if (s > ikinci) ikinci = s;
    }
    for (var i = 1; i < sinir; i++) {
      if (i + 1 < sinir) dene(k.slice(0, i) + k.charAt(i + 1) + k.charAt(i) + k.slice(i + 2));
      for (var j = 0; j < ALFABE.length; j++) dene(k.slice(0, i) + ALFABE.charAt(j) + k.slice(i));
    }
    if (!enIyi || en < Math.max(1000, 50 * sk) || ikinci * 4 > en) return null;
    return enIyi;
  }

  // Kelime düzeltmesi; null = dokunma.
  function kelime(k, say) {
    if (k.length < 4) return null;
    var sk = say(k) || GORULMEMIS;
    return ayir(k, say, sk) || (k.length >= 5 ? yazim(k, say, sk) : null);
  }

  // Metindeki kelimeleri düzelt. Adres/e-posta/@/#, rakam ve kesmeye bitişik kelimeler, cümle ortasında
  // büyük harfle başlayan (özel isim) ve içinde büyük harf olan (iPhone) kelimeler atlanır.
  function duzelt(metin, harita) {
    var say = function (k) { return harita.get(k) || 0; };
    return metin.replace(/\S+/g, function (parca, ofset) {
      if (/[@#/\\:=_`\d]|\.\p{L}/u.test(parca)) return parca;            // adres, e-posta, kod
      return parca.replace(/\p{L}+/gu, function (k, konum, hepsi) {
        var once = hepsi.charAt(konum - 1), sonra = hepsi.charAt(konum + k.length);
        if (/['’-]/.test(once) || /['’-]/.test(sonra)) return k;
        var kk = kucult(k);
        if (kk.slice(1) !== k.slice(1)) return k;                            // iPhone, NATO
        if (kk !== k && !cumleBasi(metin, ofset + konum)) return k;       // özel isim
        var yeni = kelime(kk, say);
        if (!yeni) return k;
        return kk !== k ? buyut(yeni.charAt(0)) + yeni.slice(1) : yeni;
      });
    });
  }
  function cumleBasi(metin, i) {
    var once = metin.slice(0, i).replace(/[\s"'“(«]+$/, '');
    return !once || /[.!?…:\n]$/.test(once) || /\n\s*$/.test(metin.slice(0, i));
  }

  var TurkceSozluk = { yukle: yukle, duzelt: duzelt, kelime: kelime };
  kok.TurkceSozluk = TurkceSozluk;
  if (typeof module !== 'undefined' && module.exports) module.exports = TurkceSozluk;
})(typeof globalThis !== 'undefined' ? globalThis : this);
