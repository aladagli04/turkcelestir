// Türkçeleştir — metin düzeltme çekirdeği.
// 1) karakterler(): Deniz Yüret'in deasciifier'ı ile c/g/i/o/s/u -> ç/ğ/ı/ö/ş/ü (uzunluk değişmez).
// 2) kurallar(): boşluk, cümle başı büyük harf, soru işareti, özel isimler (kural tabanlı, çevrimdışı).
// Hem eklentide (içerik betiği) hem Node testlerinde çalışır.
(function (kok) {
  if (kok.Turkce) return;
  var Deasciifier = kok.Deasciifier || (typeof require !== 'undefined' ? require('./deasciifier.js') : null);

  // ---------- Korunan alanlar: adres, e-posta, @kullanıcı, #etiket, alan adı ----------
  var KORUNAN = /(?:https?:\/\/|www\.)[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|[@#][\wÀ-ɏ]+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|net|org|de|tr|at|ch|eu|io|info|edu|gov|nl|fr|uk|co|biz|me|tv|app|dev)\b(?:\/[^\s<>"']*)?/gi;

  function korunanlar(metin) {
    var alanlar = [], m;
    KORUNAN.lastIndex = 0;
    while ((m = KORUNAN.exec(metin))) alanlar.push([m.index, m.index + m[0].length]);
    return alanlar;
  }

  // ---------- 1) Türkçe karakterler ----------
  var ASCII = 'cgiosuCGIOSU';
  var d = null;

  // metin içinde yalnız [bas, son) aralığını düzeltir; bağlam için metnin tamamına bakar.
  function karakterler(metin, bas, son) {
    if (!metin) return metin;
    if (bas == null) bas = 0;
    if (son == null) son = metin.length;
    if (!d) d = new Deasciifier();
    var alanlar = korunanlar(metin), ai = 0;
    d.text = metin;
    for (var i = bas; i < son; i++) {
      while (ai < alanlar.length && alanlar[ai][1] <= i) ai++;
      if (ai < alanlar.length && alanlar[ai][0] <= i) continue;
      // Yalnız ASCII harfe dokun: kullanıcının yazdığı ü/ö/ş... asla geri alınmaz.
      if (ASCII.indexOf(metin.charAt(i)) < 0) continue;
      if (d.turkish_need_correction(i)) d.turkish_toggle_accent(i);
    }
    return soruUyumu(d.text, bas, son);
  }

  // Soru eki ünlü uyumu: olur mu, gelir mi, var mı, gör mü (deasciifier bazen karıştırıyor).
  var UYUM = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' };
  function soruUyumu(metin, bas, son) {
    return metin.replace(/(\p{L}+)([ \t]+)(m[ıiuü]\p{Ll}*)/gu, function (tam, onceki, bosluk, ek, konum) {
      var ekKonum = konum + onceki.length + bosluk.length;
      if (ekKonum < bas || ekKonum >= son || !SORU.has(ek)) return tam;
      var unluler = onceki.toLocaleLowerCase('tr').match(/[aıeioöuü]/g);
      if (!unluler) return tam;
      var v = UYUM[unluler[unluler.length - 1]], eski = ek.charAt(1);
      return onceki + bosluk + ek.split(eski).join(v);
    });
  }

  // ---------- 2) Kurallar ----------
  var HARF = /\p{L}/u;
  function buyut(h) { return h.toLocaleUpperCase('tr'); }
  function kucult(s) { return s.toLocaleLowerCase('tr'); }

  // Nokta sonrası yeni cümle sayılmayan kısaltmalar (küçük harf, noktasız).
  var KISALTMA = new Set(('vb vs vd örn bkz sn dr prof doç av müh yrd no nr st str tel cad sok mah apt ' +
    'ltd şti bzw usw ca etc yy tic san').split(' '));

  // Soru eki: mı/mi/mu/mü ve çekimli halleri.
  var SORU = new Set();
  [['ı', 'ı'], ['i', 'i'], ['u', 'u'], ['ü', 'ü']].forEach(function (p) {
    var v = p[0];
    ['', 's#n', 'y#m', 'y#z', 's#n#z', 'd#r', 'yd#', 'yd#m', 'yd#n', 'yd#k', 'yd#n#z', 'ym#ş', 'yken']
      .forEach(function (ek) { SORU.add('m' + v + ek.replace(/#/g, v)); });
  });

  // Her zaman büyük harfle başlayan, başka anlamı olmayan özel isimler (ek alabilir).
  var ISIM = ('türkiye almanya avusturya isviçre hollanda belçika fransa ingiltere italya ispanya portekiz ' +
    'yunanistan bulgaristan romanya macaristan polonya çekya rusya ukrayna gürcistan azerbaycan ermenistan ' +
    'iran irak suriye lübnan ürdün mısır libya tunus cezayir fas arabistan katar kuveyt filistin israil ' +
    'amerika kanada meksika brezilya arjantin japonya kore hindistan pakistan afganistan endonezya malezya ' +
    'avustralya kıbrıs danimarka isveç norveç finlandiya irlanda sırbistan bosna hırvatistan arnavutluk ' +
    'makedonya kosova karadağ özbekistan kazakistan türkmenistan kırgızistan tataristan kırım ' +
    'avrupa asya afrika anadolu trakya balkanlar kafkasya ortadoğu akdeniz karadeniz marmara ege ' +
    'istanbul ankara izmir bursa antalya adana konya kayseri mersin gaziantep antep diyarbakır şanlıurfa ' +
    'urfa malatya erzurum erzincan trabzon samsun sinop kastamonu zonguldak karabük edirne tekirdağ ' +
    'kırklareli çanakkale balıkesir manisa eskişehir bilecik sakarya kocaeli izmit yalova sivas ' +
    'yozgat çorum amasya nevşehir niğde karaman osmaniye kahramanmaraş maraş adıyaman hakkari şırnak ' +
    'tunceli bitlis giresun gümüşhane çankırı isparta burdur muğla denizli kütahya kırıkkale kırşehir ' +
    'hatay mardin elazığ bayburt artvin bodrum alanya kapadokya ' +
    'berlin hamburg münchen köln frankfurt stuttgart düsseldorf dortmund essen bremen hannover nürnberg ' +
    'duisburg bochum wuppertal bielefeld bonn mannheim karlsruhe wiesbaden augsburg aachen ' +
    'gelsenkirchen mönchengladbach krefeld oberhausen kiel lübeck dresden leipzig wien zürich ' +
    'londra paris roma viyana brüksel amsterdam moskova bakü tahran bağdat şam kahire mekke medine kudüs ' +
    'türkçe almanca ingilizce fransızca arapça kürtçe rusça farsça italyanca ispanyolca ' +
    'allah kuran ramazan').split(/\s+/);
  var ISIM_SET = new Set(ISIM);
  // "alman", "türk" gibi kısa kökler yalnız güvenli eklerle (almanı/türkü başka kelime olabilir).
  var KOK_GUVENLI = { 'türk': ['', 'ler', 'lerin', 'lere', 'leri', 'lerde', 'lerden', 'ün', 'e', 'ten', 'te'],
    'alman': ['', 'lar', 'ların', 'lara', 'ları', 'larda', 'lardan'],
    'ingiliz': ['', 'ler', 'lerin', 'lere', 'leri'], 'fransız': ['', 'lar', 'ların', 'lara', 'ları'] };
  // Ülke/şehir/dil adlarına kesmesiz yazılmış ekler (Almanyada, Türkçede...).
  var ISIM_EKLERI = ['da', 'de', 'ta', 'te', 'dan', 'den', 'tan', 'ten', 'ya', 'ye', 'yı', 'yi', 'nın', 'nin',
    'a', 'e', 'ı', 'i', 'ın', 'in', 'yla', 'yle', 'la', 'le', 'lı', 'li', 'lu', 'lü', 'lılar', 'liler', 'lular', 'lüler', 'daki', 'deki',
    'dır', 'dir', 'dur', 'dür'];

  // Yapım ekleri kesmeyle ayrılmaz (İstanbullu); dil ve millet adları da (Türkçede, Almanlar).
  var KESMESIZ_EK = new Set(['lı', 'li', 'lu', 'lü', 'lılar', 'liler', 'lular', 'lüler']);

  // Özel isimse yeni yazılışını döndürür (büyük harf + gerekirse kesme), değilse null.
  function ozelIsim(kelime) {
    var k = kucult(kelime);
    var ilk = function (s) { return buyut(s.charAt(0)) + s.slice(1); };
    if (ISIM_SET.has(k)) return ilk(k);
    for (var kok in KOK_GUVENLI) {
      if (k.indexOf(kok) === 0 && KOK_GUVENLI[kok].indexOf(k.slice(kok.length)) >= 0) return ilk(k);
    }
    for (var i = 0; i < ISIM_EKLERI.length; i++) {
      var ek = ISIM_EKLERI[i], govde = k.slice(0, -ek.length);
      if (k.length > ek.length + 3 && k.slice(-ek.length) === ek && ISIM_SET.has(govde)) {
        var dil = /(ça|çe|ca|ce)$/.test(govde);
        return ilk(govde) + (dil || KESMESIZ_EK.has(ek) ? '' : '\'') + ek;
      }
    }
    return null;
  }

  // Korunan alanları tek harf olmayan yer tutucularla değiştir:  + sıra.
  function maskele(metin) {
    var liste = [];
    var yeni = metin.replace(KORUNAN, function (m) {
      liste.push(m);
      return '' + String.fromCharCode(0xE100 + liste.length - 1);
    });
    return { metin: yeni, liste: liste };
  }
  function maskeyiAc(metin, liste) {
    return metin.replace(/([-])/g, function (_, c) { return liste[c.charCodeAt(0) - 0xE100]; });
  }

  // Nokta bu konumda cümle bitiriyor mu? (sayı sonrası sıra noktası, üç nokta, kısaltma değil)
  function cumleBitiyor(metin, i) {
    var c = metin.charAt(i);
    if (c === '!' || c === '?') return true;
    if (c !== '.') return false;
    if (metin.charAt(i - 1) === '.' || metin.charAt(i + 1) === '.') return false; // ...
    if (/\d/.test(metin.charAt(i - 1))) return false;                            // 3. gün
    var m = /(\p{L}+)$/u.exec(metin.slice(Math.max(0, i - 12), i));
    if (m && (m[1].length === 1 || KISALTMA.has(kucult(m[1])))) return false;   // T.C. / vb.
    return true;
  }

  function onceCumleBasiMi(onceki) {
    if (!onceki) return true;
    var t = onceki.replace(/[ \t]+$/, '');
    if (!t || t.slice(-1) === '\n') return true;
    if (t.length === onceki.length) return false; // seçim kelimenin ortasında başlıyor
    return cumleBitiyor(t, t.length - 1);
  }

  function kurallar(metin, onceki) {
    if (!metin) return metin;
    var mk = maskele(metin);
    var s = mk.metin;
    var L = '\\p{L}';

    s = s.split('\n').map(function (satir) {
      satir = satir.replace(/[ \t ]+$/, '');                             // satır sonu boşluk
      satir = satir.replace(/(\S)[ \t ]* [ \t ]*(?=\S)/g, '$1 '); // editörün &nbsp;'si
      satir = satir.replace(/(\S)[ \t]{2,}(?=\S)/g, '$1 ');                   // çift boşluk
      satir = satir.replace(/(\S)[ \t]+([,;:!?.…]+)(?=\s|$)/g, '$1$2');       // "kelime ," -> "kelime,"
      satir = satir.replace(new RegExp('(?<=' + L + ')[ \\t]+([,;!?.])(?=' + L + '{2,})', 'gu'), '$1'); // "gün .yarın"
      satir = satir.replace(new RegExp('(?<=' + L + '|\\))([,;!?:])(?=' + L + ')', 'gu'), '$1 ');
      satir = satir.replace(new RegExp('(?<=' + L + '{2,}|\\))\\.(?=' + L + '{2,})', 'gu'), '. ');
      satir = satir.replace(new RegExp('(\\.\\.\\.|…)(?=' + L + ')', 'gu'), '$1 ');
      // Soru eki son kelimeyse: "geliyor musun" -> "geliyor musun?"
      satir = satir.replace(new RegExp('(?<=[ \\t])(' + L + '+)(\\.?)(?=$|[ \\t]+' + L + ')', 'gu'),
        function (tam, kelime, nokta, konum, hepsi) {
          if (!SORU.has(kucult(kelime))) return tam;
          var sonra = hepsi.slice(konum + tam.length);
          if (sonra === '' || nokta) return kelime + '?';
          return tam;
        });
      return satir;
    }).join('\n');

    // Özel isimler (yalnız tamamen küçük yazılmışsa).
    s = s.replace(new RegExp(L + '+', 'gu'), function (k) {
      if (k !== kucult(k)) return k;
      return ozelIsim(k) || k;
    });

    // Cümle başı büyük harf.
    var bas = onceCumleBasiMi(onceki), cikti = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (bas && HARF.test(c)) {
        // iPhone, eBay gibi içinde büyük harf olan kelimelere dokunma.
        var kelime = /^\p{L}+/u.exec(s.slice(i))[0];
        if (kelime.slice(1) === kucult(kelime.slice(1))) c = buyut(c);
        bas = false;
      } else if (c === '\n') {
        bas = true;
      } else if (/[.!?]/.test(c)) {
        if (cumleBitiyor(s, i) && /\s/.test(s.charAt(i + 1))) bas = true;
      } else if (/[\d]/.test(c)) {
        bas = false;
      }
      cikti += c;
    }
    return maskeyiAc(cikti, mk.liste);
  }

  // Tam metin + aralık -> aralığın yeni hali.
  function duzelt(metin, bas, son, mod) {
    if (bas == null) bas = 0;
    if (son == null) son = metin.length;
    var t = karakterler(metin, bas, son);
    var parca = t.slice(bas, son);
    if (mod === 'tam') parca = kurallar(parca, t.slice(0, bas));
    return parca;
  }

  // ---------- Fark (Myers): a -> b için değişen parçalar [{a0, a1, yeni}] ----------
  function fark(a, b) {
    var p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    var s = 0;
    while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
    var A = a.slice(p, a.length - s), B = b.slice(p, b.length - s);
    var n = A.length, m = B.length;
    if (n + m === 0) return [];
    var V = { 1: 0 }, iz = [], d, k, x, y;
    bul: for (d = 0; d <= n + m; d++) {
      var Vd = {};
      for (k = -d; k <= d; k += 2) {
        x = (k === -d || (k !== d && V[k - 1] < V[k + 1])) ? V[k + 1] : V[k - 1] + 1;
        y = x - k;
        while (x < n && y < m && A[x] === B[y]) { x++; y++; }
        Vd[k] = x;
        if (x >= n && y >= m) { iz.push(Vd); break bul; }
      }
      iz.push(Vd);
      V = Vd;
    }
    var islemler = [];
    x = n; y = m;
    for (d = iz.length - 1; d > 0; d--) {
      var Vp = iz[d - 1];
      k = x - y;
      var pk = (k === -d || (k !== d && Vp[k - 1] < Vp[k + 1])) ? k + 1 : k - 1;
      var px = Vp[pk], py = px - pk;
      islemler.push(pk === k + 1 ? { ekle: true, ax: px, by: py } : { ekle: false, ax: px, by: py });
      x = px; y = py;
    }
    islemler.reverse();
    var parcalar = [], h = null;
    islemler.forEach(function (o) {
      var a0 = o.ax, a1 = o.ekle ? o.ax : o.ax + 1, b0 = o.by, b1 = o.ekle ? o.by + 1 : o.by;
      if (h && a0 <= h.a1 && b0 <= h.b1) { h.a1 = Math.max(h.a1, a1); h.b1 = Math.max(h.b1, b1); }
      else { h = { a0: a0, a1: a1, b0: b0, b1: b1 }; parcalar.push(h); }
    });
    return parcalar.map(function (h) { return { a0: h.a0 + p, a1: h.a1 + p, yeni: B.slice(h.b0, h.b1) }; });
  }

  // ---------- Yapay zekâ çıktısını güvenle birleştir ----------
  // Kelimeler girdiden gelir; modelden yalnız şunlar alınır: aynı kelimenin yazılışı (büyük harf, şapka,
  // Türkçe harf, kesme), küçük yazım düzeltmesi (1-2 harf), bitişik yazılmışı ayırma (yapamazmıyız ->
  // yapamaz mıyız) ve kelimeler arası noktalama. Model kelime ekleyemez, silemez, başka kelime koyamaz.
  var KELIME = /[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu;
  var SADE = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  function sade(k) { return k.toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, function (c) { return SADE[c]; }).replace(/['’]/g, ''); }
  function parcala(s) {
    var k = [], a = [], son = 0, m;
    KELIME.lastIndex = 0;
    while ((m = KELIME.exec(s))) { a.push(s.slice(son, m.index)); k.push(m[0]); son = m.index + m[0].length; }
    a.push(s.slice(son));
    return { k: k, a: a }; // a[i] = k[i]'den önceki ara, a[k.length] = sondaki ara
  }
  function uzaklik(x, y) { // Levenshtein
    var o = [], i, j;
    for (j = 0; j <= y.length; j++) o.push(j);
    for (i = 1; i <= x.length; i++) {
      var sol = i, kose = i - 1;
      for (j = 1; j <= y.length; j++) {
        var u = Math.min(o[j] + 1, sol + 1, kose + (x[i - 1] === y[j - 1] ? 0 : 1));
        kose = o[j]; o[j] = sol = u;
      }
    }
    return o[y.length];
  }
  // Yazım düzeltmesi mi, başka kelime mi? Kısa kelimede 1, uzunda 2 harf farka izin.
  function yakin(a, b) {
    if (/\d/.test(a + b)) return a === b;
    return uzaklik(a, b) <= (Math.min(a.length, b.length) >= 6 ? 2 : Math.min(a.length, b.length) >= 3 ? 1 : 0);
  }
  // Dil adları ve küçük harfli (cins) isimler kesme almaz: "Türkçe'leştir" -> "Türkçeleştir".
  function kesmeDuzelt(k) {
    var m = /^(\p{L}+)['’](\p{L}+)$/u.exec(k);
    if (!m) return k;
    if (/(ça|çe|ca|ce)$/.test(kucult(m[1]))) return m[1] + m[2];
    return k;
  }
  function birlestir(girdi, model) {
    var G = parcala(girdi), M = parcala(model), n = G.k.length, m = M.k.length;
    var gs = G.k.map(sade), ms = M.k.map(sade);
    // 1) En uzun ortak alt dizi (aynı kelimeler) -> çapalar
    var L = [];
    for (var i = 0; i <= n; i++) { L.push(new Int32Array(m + 1)); }
    for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--)
      L[i][j] = gs[i] === ms[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var es = new Array(n).fill(-1), eb = new Array(n).fill(-1); // girdi kelimesi -> model [es..eb]
    i = 0; j = 0;
    while (i < n && j < m) {
      if (gs[i] === ms[j]) { es[i] = eb[i] = j; i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
    }
    // 2) Çapalar arasındaki boşluklarda yazım düzeltmesi ve kelime ayırma
    var gi = 0, mj = 0;
    while (gi < n) {
      if (es[gi] >= 0) { mj = eb[gi] + 1; gi++; continue; }
      var gSon = gi; while (gSon < n && es[gSon] < 0) gSon++;          // girdi boşluğu [gi, gSon)
      var mSon = gSon < n ? es[gSon] : m;                              // model boşluğu [mj, mSon)
      for (; gi < gSon; gi++) {
        if (mj < mSon && yakin(gs[gi], ms[mj])) { es[gi] = eb[gi] = mj++; continue; }
        if (mj + 1 < mSon && !/[\p{L}\p{N}]/u.test(M.a[mj + 1]) && ms[mj].length >= 2 && ms[mj + 1].length >= 2 &&
            yakin(gs[gi], ms[mj] + ms[mj + 1])) { es[gi] = mj; eb[gi] = mj + 1; mj += 2; continue; }
      }
      mj = mSon;
    }
    // 3) Yaz: kelime modelden (eşleştiyse) ya da girdiden; ara modelden yalnız komşuluk korunuyorsa.
    var araAl = function (mj, gAra) { return (mj != null && !/[\p{L}\p{N}]/u.test(M.a[mj])) ? M.a[mj] : gAra; };
    var cikti = araAl(n && es[0] === 0 ? 0 : null, G.a[0]);
    for (i = 0; i < n; i++) {
      if (es[i] >= 0 && eb[i] > es[i]) cikti += ayir(G.k[i], es[i]);
      else if (es[i] >= 0) cikti += kesmeDuzelt(M.k[es[i]]);
      else cikti += G.k[i];
      var sonraki = i + 1 < n ? (es[i] >= 0 && es[i + 1] === eb[i] + 1 ? eb[i] + 1 : null)
        : (eb[i] === m - 1 ? m : null);
      cikti += araAl(sonraki, G.a[i + 1]);
    }
    // Bitişik kelimeyi ayır: model harf yutmuş olabilir ("yazınıntürkçe" -> "yazını Türkçe"), bu yüzden
    // girdinin kelimesi modelin ikinci kelimesinin uzunluğuna göre bölünür; o parça aynıysa modelin yazılışı.
    function ayir(kelime, mj) {
      var ikinci = M.k[mj + 1], k = kelime.length - ikinci.length;
      if (k < 1 || sade(kelime) === ms[mj] + ms[mj + 1]) return kesmeDuzelt(M.k[mj]) + M.a[mj + 1] + kesmeDuzelt(ikinci);
      var sol = kelime.slice(0, k), sag = kelime.slice(k);
      if (sade(sol) === ms[mj]) sol = M.k[mj];
      if (sade(sag) === ms[mj + 1]) sag = ikinci;
      return kesmeDuzelt(sol) + ' ' + kesmeDuzelt(sag);
    }
    // Model son kelimeyi sildiyse de cümle sonu işaretini (? . !) koru: "mantıklı mı sizce?"
    if (n && eb[n - 1] !== m - 1 && /^[.?!…]+\s*$/.test(M.a[m]) && !/[.?!…]\s*$/.test(cikti)) {
      cikti = cikti.replace(/\s*$/, function (bosluk) { return M.a[m].trim() + bosluk; });
    }
    return n ? cikti : girdi;
  }

  var Turkce = { karakterler: karakterler, kurallar: kurallar, duzelt: duzelt, fark: fark, birlestir: birlestir };
  kok.Turkce = Turkce;
  if (typeof module !== 'undefined' && module.exports) module.exports = Turkce;
})(typeof globalThis !== 'undefined' ? globalThis : this);
