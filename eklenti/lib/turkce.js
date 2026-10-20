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
  var SADE = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  function sade(k) { return k.toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, function (c) { return SADE[c]; }).replace(/['’]/g, ''); }

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
  // Markalar kendi yazılışıyla; ek kesmeyle ayrılır (whatsappta -> WhatsApp'ta).
  var MARKA = {};
  ('WhatsApp YouTube Instagram Facebook Google Twitter TikTok Netflix Amazon eBay iPhone iPad Samsung Apple ' +
    'Android Windows Telegram Gmail Chrome Firefox Spotify LinkedIn PayPal Skype Microsoft Huawei Xiaomi ' +
    'Mercedes BMW Volkswagen Toyota IKEA Lidl Trendyol Hepsiburada Getir Yemeksepeti').split(' ')
    .forEach(function (m) { MARKA[sade(m)] = m; });
  // Sık kişi adları (sözlükte başka anlamı olanlar alınmadı: can, deniz, umut, barış, metin, onur, gül...).
  var KISI = {};
  ('Ahmet Mehmet Mustafa Hüseyin Hasan İbrahim İsmail Osman Yusuf Murat Ömer Halil Süleyman Abdullah Mahmut ' +
    'Recep Ali Fatma Ayşe Emine Hatice Zeynep Elif Meryem Şerife Zehra Hanife Merve Büşra Esra Özge Gamze Tuğba ' +
    'Kübra Rabia Seda Aylin Selin Ebru Ceren Ezgi İrem Melike Buse Hakan Serkan Volkan Burak Emre Erkan Gökhan ' +
    'Orhan Kenan Kaan Tolga Oğuz Arda Kerem Furkan Enes Yunus Yasin Batuhan Berkay Cihan Fatih Selim Levent ' +
    'Serdar Sinan Tarık Taner Hüsnü Nihat Necati Cemal Kemal Celal Bilal Adem İlyas İdris İlhan Ercan Ertan ' +
    'Erdal Erol Ferhat Fikret Haluk Hamza Harun Kadir Kazım Lütfi Mert Nuri Okan Özcan Samet Selçuk Sercan ' +
    'Şükrü Taylan Tunahan Turgut Vedat Yakup Ayten Aysel Aynur Birsen Canan Dilara Esma Feride Gülay Gülsüm ' +
    'Hacer Havva İlknur Kevser Leyla Melis Nermin Nesrin Nilay Nihan Nurcan Sibel Şule Şeyma Tülay Türkan ' +
    'Ümran Yeliz Yeşim Zübeyde Sevim Songül Gülşen Nazan Neslihan Beyza Sude Azra Ecrin Nisa Miray Kübra ' +
    'Emine Muhammet Muhammed Abdurrahman Tuncay Özgür Erhan Hilmi Fuat Nevzat Rukiye Saliha Sevgül Hülya')
    .split(' ').forEach(function (a) { KISI[sade(a)] = a; });
  var ARKA = /[aıou]/;
  // Ad + ek: "mehmetin" -> "Mehmet'in", "aliye" -> "Ali'ye". Ek, adın ünlü uyumuyla yeniden yazılır.
  function kisi(k) {
    var sk = sade(k);
    if (KISI[sk]) return KISI[sk];
    for (var i = 0; i < ISIM_EKLERI.length; i++) {
      var ek = sade(ISIM_EKLERI[i]), govde = sk.slice(0, -ek.length), ad = KISI[govde];
      // Yumuşamış ünsüz: zeynebe -> Zeynep'e, muradı -> Murat'ı
      if (!ad && /^[aeiu]/.test(ek)) ad = KISI[govde.slice(0, -1) + ({ b: 'p', d: 't', c: 'c', g: 'k' })[govde.slice(-1)]];
      if (!ad || sk.length <= ek.length || sk.slice(-ek.length) !== ek || KESMESIZ_EK.has(ISIM_EKLERI[i])) continue;
      var unluler = kucult(ad).match(/[aıeioöuü]/g), son = unluler[unluler.length - 1], arka = ARKA.test(son);
      if (ek.indexOf(arka ? 'e' : 'a') >= 0) continue;                    // Ahmet'a olmaz
      // Ünlüyle biten ada kaynaştırmalı (Ali'ye, Ali'nin), ünsüzle bitene kaynaştırmasız ek (Ahmet'e, Ahmet'in).
      var unluyleBiter = /[aıeioöuü]$/.test(kucult(ad));
      if (unluyleBiter ? /^[aeiu]/.test(ek) : /^(y|n[iu]n$)/.test(ek)) continue;
      var yeni = ek.replace(/[iu]/g, UYUM[son]).replace(/[ae]/g, arka ? 'a' : 'e');
      if (/^[dt]/.test(yeni)) yeni = (/[çfhkpsşt]$/.test(kucult(ad)) ? 't' : 'd') + yeni.slice(1); // Ahmet'te
      return ad + '\'' + yeni;
    }
    return null;
  }
  // Marka + ek: hal ekleri ve iyelik (iPhone'umu, Windows'u); ek kullanıcının yazdığı gibi kalır.
  var MARKA_EKI = /^(?:[iu]?m(?:[iu]z)?|[iu]?n(?:[iu]z)?|s[iu])(?:[iu]|n[iu]n|[dt][ae]n?|y?[ae]|l[ae])?$/;
  function marka(k) {
    var kk = sade(k);
    if (MARKA[kk]) return MARKA[kk];
    for (var n = Math.min(5, kk.length - 2); n >= 1; n--) {
      var m = MARKA[kk.slice(0, -n)], ek = kk.slice(-n);
      if (m && (SAYI_EKI.test(ek) || MARKA_EKI.test(ek)) && !/^l[iu]/.test(ek)) return m + '\'' + k.slice(-n);
    }
    return null;
  }

  function ozelIsim(kelime) {
    var k = kucult(kelime);
    var ilk = function (s) { return buyut(s.charAt(0)) + s.slice(1); };
    var mk = marka(k) || kisi(k);
    if (mk) return mk;
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

  // ---------- Kelime düzeltmeleri (tam mod) ----------
  // Anahtarlar sade (Türkçe harfsiz, küçük) yazılır; böylece deasciifier'ın tahmini ne olursa olsun eşleşir.
  // '+' ile bitenler ek alabilir (herkeze -> herkese, herşeyi -> her şeyi).
  var TABLO = {};
  ('herkez+=herkes yalnis+=yanlış yanliz+=yalnız malesef=maalesef orjinal+=orijinal deyil+=değil ' +
    'sofor+=şoför antreman+=antrenman laboratuar+=laboratuvar supriz+=sürpriz egzos+=egzoz tras+=tıraş ' +
    'esortman+=eşofman assagi+=aşağı yukarda=yukarıda hersey+=her_şey birsey+=bir_şey hicbirsey+=hiçbir_şey ' +
    'herzaman=her_zaman hicbirzaman=hiçbir_zaman birsuru=bir_sürü suan+=şu_an pekcok=pek_çok birtek=bir_tek ' +
    'hosgeldin+=hoş_geldin hosbulduk=hoş_bulduk gecmisolsun=geçmiş_olsun birdaha=bir_daha yada=ya_da ' +
    'tabiki=tabii_ki iyiki=iyi_ki oyleki=öyle_ki boyleki=böyle_ki hickimse=hiç_kimse herhangibir=herhangi_bir ' +
    'nerde+=nerede').split(' ').forEach(function (s) {
    var p = s.split('='), ek = p[0].slice(-1) === '+';
    TABLO[ek ? p[0].slice(0, -1) : p[0]] = { yeni: p[1].replace(/_/g, ' '), ek: ek };
  });
  // Ayrı yazılmış ama bitişik olması gereken iki kelime.
  var IKILI = { 'hic bir': 'hiçbir', 'bir kac': 'birkaç', 'tabi ki': 'tabii ki', 'her kes': 'herkes',
    'bir cok': 'birçok', 'her hangi': 'herhangi', 'bir az': 'biraz', 'hic biri': 'hiçbiri' };

  // Soru eki (sade): mi, mu, misin, muyuz...
  var SORU_SADE = [];
  SORU.forEach(function (s) { var x = sade(s); if (SORU_SADE.indexOf(x) < 0) SORU_SADE.push(x); });
  SORU_SADE.sort(function (a, b) { return b.length - a.length; });
  // Bitişik "mi" önündeki kelime kesin yüklemse ayrılır (geliyor, gelecek, yapamaz, gördün, var, değil...).
  var YUKLEM = /(yor|acak|ecek|m[iu]s|(?:abil|ebil)ir|maz|mez|[dt][iu](?:m|n|k|n[iu]z))$/;
  var YUKLEM_KELIME = new Set('var yok degil olur olmaz lazim gerek tamam mumkun dogru boyle oyle'.split(' '));
  var MELI = /(mali|meli)$/;
  // Yalnız cümle sonundaysa ayrılır (geldimi, olurmu): ortada "kendimi, kartımı" gibi isim olabilir.
  var YUKLEM_ZAYIF = /([dt][iu]|[aeiu]r)$/;
  var ZAYIF_DEGIL = new Set('kendi simdi kedi vadi hindi yedi adi tadi kadi ordu yir'.split(' '));
  // Bitişik "ki" önündeki kelime fiilse ayrılır (diyorki, dedimki); sanki/belki/halbuki/şimdiki değil.
  var KI_KOK = /(yor|[dt][iu]|m[iu]s|acak|ecek)(um|im|sun|sin|uz|iz|sunuz|siniz|lar|ler|m|n|k)?$/;
  var KI_DEGIL = new Set(['simdi']);
  // Zamir + bağlaç de/da bitişik: arkasındaki ya da yan cümlenin sonundaki fiilin kişisi zamire uyuyorsa
  // ayrılır (bende geliyorum, bende yarın gidiyorum).
  // "Kitap bende kaldı", "Sende kalsın", "Bizde böyle bir adet yok" ayrılmaz.
  var ZAMIR_DE = {
    bende: /(m[iu]y[iu]m|yorum|(acag|eceg)[iu]m|[dt][iu]m|m[iu]s[iu]m|[aeiu]r[iu]m|y[iu]m|[ae]l[iu]m)$/,
    sende: /(m[iu]s[iu]n|yorsun|acaksin|eceksin|[aeiu]rs[iu]n|[dt][iu]n|m[iu]ss[iu]n|malisin|melisin)$/,
    oda: /(yor|yorlar|acak|ecek|acaklar|ecekler|bilir|s[iu]n)$/,
    bizde: /(m[iu]y[iu]z|yoruz|(acag|eceg)[iu]z|[dt][iu]k|[aeiu]r[iu]z|[ae]l[iu]m|m[iu]s[iu]z|bilir[iu]z)$/,
    sizde: /(m[iu]s[iu]n[iu]z|yorsunuz|acaksiniz|eceksiniz|[aeiu]rs[iu]n[iu]z|[dt][iu]n[iu]z|malisiniz|melisiniz)$/,
    onlarda: /(yorlar|acaklar|ecekler|[dt][iu]l[ae]r|s[iu]nl[ae]r)$/
  };
  // "sende gel": 2. tekil emir; yalnız cümle sonunda ve bilinen fiillerle.
  var EMIR = new Set('gel git yap bak gor soyle ye ic otur dur ver oku yaz bekle sus kos calis uyu dinle'.split(' '));

  function ilkBuyukse(orijinal, yeni) {
    var c = orijinal.charAt(0);
    return c !== kucult(c) ? buyut(yeni.charAt(0)) + yeni.slice(1) : yeni;
  }
  // Soru ekini öndeki kelimenin son ünlüsüne göre yaz: gelecek misin, var mı, gördün mü.
  function soruEki(govde, sadeEk) {
    var unluler = kucult(govde).match(/[aıeioöuü]/g);
    var ek = sadeEk.replace(/[iu]/g, UYUM[unluler[unluler.length - 1]]);
    return /ym.ş?s$/.test(ek) ? ek.slice(0, -1) + 'ş' : ek; // mıymış
  }

  // Tek kelime: tablo, bitişik ki, bitişik soru eki. sonda = cümlenin son kelimesi.
  function kelimeDuzelt(k, sonda) {
    var sk = sade(k), t = TABLO[sk];
    if (t) return ilkBuyukse(k, t.yeni);
    for (var anahtar in TABLO) {
      t = TABLO[anahtar];
      if (t.ek && sk.length > anahtar.length && sk.indexOf(anahtar) === 0) {
        return ilkBuyukse(k, t.yeni) + k.slice(anahtar.length);
      }
    }
    if (sk.length > 4 && sk.slice(-2) === 'ki') {
      var kok = sk.slice(0, -2);
      if (KI_KOK.test(kok) && !KI_DEGIL.has(kok)) return k.slice(0, -2) + ' ki';
    }
    for (var i = 0; i < SORU_SADE.length; i++) {
      var ek = SORU_SADE[i];
      if (sk.length <= ek.length + 1 || sk.slice(-ek.length) !== ek) continue;
      var govde = sk.slice(0, -ek.length);
      if (!/[aeiou]/.test(govde)) continue;
      var ayir = ek.length > 2 ? govde.length >= 3
        : YUKLEM.test(govde) || YUKLEM_KELIME.has(govde) || (MELI.test(govde) && govde.length >= 6) ||
          (sonda && govde.length >= 4 && YUKLEM_ZAYIF.test(govde) && !ZAYIF_DEGIL.has(govde));
      if (ayir) { var g = k.slice(0, govde.length); return g + ' ' + soruEki(g, ek); }
      break;
    }
    return null;
  }

  var CUMLE_SONU = /[.!?…,;]/;
  function kelimeler(satir) {
    var t = [], m, re = /\p{L}+/gu;
    while ((m = re.exec(satir))) t.push({ k: m[0], b: m.index, s: m.index + m[0].length });
    var araSonra = function (i) { return i + 1 < t.length ? satir.slice(t[i].s, t[i + 1].b) : satir.slice(t[i].s); };
    var degis = [];
    for (var i = 0; i < t.length; i++) {
      if (/['’]$/.test(satir.slice(0, t[i].b))) continue;              // kesmeden sonraki ek
      var ara = araSonra(i);
      if (/^['’]/.test(ara)) continue;                                  // İstanbul'a: özel isim
      var sk = sade(t[i].k), yeni = null;
      if (i + 1 < t.length && /^[ \t]+$/.test(ara)) {
        var sonraki = sade(t[i + 1].k), ikili = IKILI[sk + ' ' + sonraki];
        if (ikili) { degis.push([t[i].b, t[i + 1].s, ilkBuyukse(t[i].k, ikili)]); i++; continue; }
        var zamir = ZAMIR_DE[sk];
        var sonrakiSonda = i + 2 === t.length || CUMLE_SONU.test(araSonra(i + 1));
        var j = i + 1;
        while (j + 1 < t.length && !CUMLE_SONU.test(araSonra(j))) j++;  // yan cümlenin son kelimesi
        if (zamir && (zamir.test(sonraki) || zamir.test(sade(t[j].k)) ||
            (sk === 'sende' && sonrakiSonda && EMIR.has(sonraki)))) {
          yeni = t[i].k.slice(0, -2) + ' ' + t[i].k.slice(-2);
        }
      }
      if (!yeni) yeni = kelimeDuzelt(t[i].k, i + 1 === t.length || CUMLE_SONU.test(ara));
      if (yeni && yeni !== t[i].k) degis.push([t[i].b, t[i].s, yeni]);
    }
    for (i = degis.length - 1; i >= 0; i--) satir = satir.slice(0, degis[i][0]) + degis[i][2] + satir.slice(degis[i][1]);
    return satir;
  }

  // Sayıya bitişik ek kesmeyle ayrılır: 5te -> 5'te, 2024te -> 2024'te, 15inde -> 15'inde (km, kg değil).
  var SAYI_EKI = /^(?:y?[aeiu]|[dt][ae](?:n|ki)?|n?[iu]n|[iu]nc[iu]\p{L}*|[iu]?nd[ae]n?|l[ae]r\p{L}*|l[iu]k\p{L}*|l[iu]|s[iu]|y[iu]n?|y[ae]|[iu]ne)$/u;
  function sayiKesmesi(satir) {
    return satir.replace(/(?<![\p{L}\d])(\d+)(\p{Ll}+)(?![\p{L}\d])/gu, function (tam, sayi, ek) {
      return SAYI_EKI.test(sade(ek)) ? sayi + '\'' + ek : tam;
    });
  }

  // Soru sözcüğü olan cümleye soru işareti: "ne zaman geliyorsun" -> "...?"; "nasıl olduğunu bilmiyorum" değil.
  var SORU_SOZ = /^(ne|neden|niye|nicin|neyi|neye|neyle|neler|nedir|nesi|nasil\p{L}*|kim|kime|kimi|kimin|kimden|kimle|kiminle|hangi\p{L}*|kac|kacta|kaci|kacinci|nere(?!deyse)\p{L}*)$/u;
  var YAN_CUMLE = /([dt][iu]g[iu]|acag[iu]|eceg[iu])\p{L}*$|[aeiu]rs[ae](n|n[iu]z|k)?$|^(bilmiyorum|bilmem|bilmiyoruz|bilmiyor|merak|olursa|anlamadim)$/u;
  var UNLEM = new Set('guzel hos iyi kotu buyuk tatli sacma ayip yazik guzelmis'.split(' '));
  function soruCumlesi(metin) {
    var k = (metin.match(/\p{L}+/gu) || []).map(sade);
    var soru = false, ne = 0;
    if ((k[0] === 'kim' && k[1] === 'bilir') || (k[0] === 'her' && k[1] === 'ne') ||
      (k[0] === 'kimi' && k[1] === 'zaman')) return false;
    for (var i = 0; i < k.length; i++) {
      if (YAN_CUMLE.test(k[i])) return false;
      if (k[i] === 'ne') {
        ne++;
        if (UNLEM.has(k[i + 1]) || (k[i + 1] === 'kadar' && UNLEM.has(k[i + 2]))) return false;
      }
      if (SORU_SOZ.test(k[i]) || (i > 0 && k[i].length > 2 && SORU_SADE.indexOf(k[i]) >= 0)) soru = true;
    }
    return soru && ne < 2;
  }
  function soruIsareti(satir) {
    var parcalar = [], bas = 0, i;
    for (i = 0; i < satir.length; i++) {
      var c = satir.charAt(i);
      if (c === '…' || ((c === '.' || c === '!' || c === '?') && cumleBitiyor(satir, i))) {
        var son = i;
        while (i + 1 < satir.length && /[.!?…]/.test(satir.charAt(i + 1))) i++;
        parcalar.push([bas, son, satir.slice(son, i + 1)]);
        bas = i + 1;
      }
    }
    if (bas < satir.length) parcalar.push([bas, satir.length, '']);
    for (var p = parcalar.length - 1; p >= 0; p--) {
      var a = parcalar[p][0], b = parcalar[p][1], isaret = parcalar[p][2];
      var duz = satir.slice(a, b).replace(/\s+$/, '');
      if ((isaret !== '.' && isaret !== '') || !/\p{L}$/u.test(duz) || !soruCumlesi(duz)) continue;
      // Selamlamadan sonra virgül: "merhaba nasılsın" -> "merhaba, nasılsın?"
      var sel = /^(\s*(?:merhaba|selam))([ \t]+)(\p{L}+)/iu.exec(duz);
      if (sel && SORU_SOZ.test(sade(sel[3]))) duz = sel[1] + ',' + duz.slice(sel[1].length);
      satir = satir.slice(0, a) + duz + '?' + satir.slice(b + isaret.length);
    }
    return satir;
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
      satir = kelimeler(satir);
      // Soru eki son kelimeyse: "geliyor musun" -> "geliyor musun?"
      satir = satir.replace(new RegExp('(?<=[ \\t])(' + L + '+)(\\.?)(?=$|[ \\t]+' + L + ')', 'gu'),
        function (tam, kelime, nokta, konum, hepsi) {
          if (!SORU.has(kucult(kelime))) return tam;
          var sonra = hepsi.slice(konum + tam.length);
          if (sonra === '' || nokta) return kelime + '?';
          return tam;
        });
      satir = sayiKesmesi(satir);
      satir = soruIsareti(satir);
      return satir;
    }).join('\n');

    // Özel isimler (yalnız tamamen küçük yazılmışsa).
    s = s.replace(new RegExp(L + '+', 'gu'), function (k) {
      if (k !== kucult(k)) return (k.slice(1) === kucult(k.slice(1)) && marka(kucult(k))) || k; // Whatsapp
      return ozelIsim(k) || k;
    });
    // Bayram ve özel günler: Ramazan Bayramı, Anneler Günü.
    s = s.replace(/(^|[^\p{L}])(ramazan|kurban|şeker|anneler|babalar|sevgililer|öğretmenler)([ \t]+)(bayram|gün)(\p{L}*)/giu,
      function (t, on, a, b, c, ek) {
        if (c.toLocaleLowerCase('tr') === 'gün' && !/^[üu]/.test(ek)) return t;  // "anneler gününe" ama "babalar gün..." değil
        return on + buyut(a.charAt(0)) + a.slice(1) + b + buyut(c.charAt(0)) + c.slice(1) + ek;
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
