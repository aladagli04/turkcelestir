// node test/olcum.js [-v]
// Kalite ölçümü: gerçekçi hatalı cümleler, tam mod (Alt+Y) çıktısı beklenenle birebir aynı mı?
// test.js'ten farkı: burada hepsinin geçmesi beklenmez; amaç hangi hata türünü kaçırdığımızı görmek.
// "kontrol" kategorisi: zaten doğru metin — bozulmamalı.
var T = require('../eklenti/lib/turkce.js');
var ayrinti = process.argv.indexOf('-v') >= 0;

var VAKALAR = [
  // --- Türkçe karakter (deasciifier) ---
  ['karakter', 'bugun hava cok guzel, disari cikalim', 'Bugün hava çok güzel, dışarı çıkalım'],
  ['karakter', 'cocuklari okula goturdum, simdi isteyim', 'Çocukları okula götürdüm, şimdi işteyim'],
  ['karakter', 'aksam yemeginde balik pisirdim', 'Akşam yemeğinde balık pişirdim'],
  ['karakter', 'isik yanmiyor, sigorta atmis olabilir', 'Işık yanmıyor, sigorta atmış olabilir'],
  ['karakter', 'gozlugumu unuttum, ogretmene soyle', 'Gözlüğümü unuttum, öğretmene söyle'],
  ['karakter', 'kus ucuyor, agacin ustunde', 'Kuş uçuyor, ağacın üstünde'],
  ['karakter', 'ogle yemegi icin sirkete dondum', 'Öğle yemeği için şirkete döndüm'],
  ['karakter', 'universiteyi bitirdikten sonra is buldum', 'Üniversiteyi bitirdikten sonra iş buldum'],
  ['karakter', 'sut ictim, karnim agriyor', 'Süt içtim, karnım ağrıyor'],
  ['karakter', 'cay demledim, sicak sicak icelim', 'Çay demledim, sıcak sıcak içelim'],
  ['karakter', 'kizim dun dogum gununu kutladi', 'Kızım dün doğum gününü kutladı'],
  ['karakter', 'bu cok sik bir elbise', 'Bu çok şık bir elbise'],
  ['karakter', 'cok sik geliyor buraya', 'Çok sık geliyor buraya'],
  ['karakter', 'aci bir haber aldik', 'Acı bir haber aldık'],
  ['karakter', 'ucgenin ic acilarinin toplami', 'Üçgenin iç açılarının toplamı'],
  ['karakter', 'carsamba gunu bulusalim', 'Çarşamba günü buluşalım'],

  // --- Soru eki bitişik yazılmış ---
  ['soru eki', 'yarin gelecekmisin', 'Yarın gelecek misin?'],
  ['soru eki', 'evde ekmek varmi', 'Evde ekmek var mı?'],
  ['soru eki', 'bu aksam olurmu', 'Bu akşam olur mu?'],
  ['soru eki', 'bunu biliyormusun', 'Bunu biliyor musun?'],
  ['soru eki', 'guzel degilmi', 'Güzel değil mi?'],
  ['soru eki', 'yapamazmiyiz', 'Yapamaz mıyız?'],
  ['soru eki', 'gordunmu', 'Gördün mü?'],

  // --- Bağlaç de/da (bitişik yazılmış) ---
  ['de/da', 'bende geliyorum', 'Ben de geliyorum'],
  ['de/da', 'sende gel', 'Sen de gel'],
  ['de/da', 'oda biliyor', 'O da biliyor'],
  ['de/da', 'bizde gidelim', 'Biz de gidelim'],
  ['de/da', 'onlarda gelsin', 'Onlar da gelsin'],

  // --- Bağlaç ki ---
  ['ki', 'diyorki yarin gelecekmis', 'Diyor ki yarın gelecekmiş'],
  ['ki', 'oyleki inanamazsin', 'Öyle ki inanamazsın'],
  ['ki', 'tabiki gelirim', 'Tabii ki gelirim'],
  ['ki', 'iyiki varsin', 'İyi ki varsın'],
  ['ki', 'tabi ki gelirim', 'Tabii ki gelirim'],

  // --- Bitişik / ayrı yazılan kalıplar ---
  ['bitişik/ayrı', 'hersey yolunda', 'Her şey yolunda'],
  ['bitişik/ayrı', 'birsey soyleyecegim', 'Bir şey söyleyeceğim'],
  ['bitişik/ayrı', 'hicbirsey olmadi', 'Hiçbir şey olmadı'],
  ['bitişik/ayrı', 'hic bir zaman', 'Hiçbir zaman'],
  ['bitişik/ayrı', 'yada yarin gel', 'Ya da yarın gel'],
  ['bitişik/ayrı', 'bir kac gun sonra', 'Birkaç gün sonra'],
  ['bitişik/ayrı', 'herzaman boyle', 'Her zaman böyle'],
  ['bitişik/ayrı', 'birsuru is var', 'Bir sürü iş var'],
  ['bitişik/ayrı', 'suan evdeyim', 'Şu an evdeyim'],
  ['bitişik/ayrı', 'bircok insan geldi', 'Birçok insan geldi'],
  ['bitişik/ayrı', 'pekcok kisi', 'Pek çok kişi'],
  ['bitişik/ayrı', 'birtek sen kaldin', 'Bir tek sen kaldın'],
  ['bitişik/ayrı', 'hosgeldin', 'Hoş geldin'],
  ['bitişik/ayrı', 'gecmisolsun', 'Geçmiş olsun'],
  ['bitişik/ayrı', 'birdaha yapma', 'Bir daha yapma'],
  ['bitişik/ayrı', 'herkese iyi aksamlar', 'Herkese iyi akşamlar'],

  // --- Sık yazım hataları ---
  ['yazım', 'herkez geldi', 'Herkes geldi'],
  ['yazım', 'yalnis anladin', 'Yanlış anladın'],
  ['yazım', 'yanliz kaldim', 'Yalnız kaldım'],
  ['yazım', 'malesef gelemiyorum', 'Maalesef gelemiyorum'],
  ['yazım', 'orjinal parca aldim', 'Orijinal parça aldım'],
  ['yazım', 'oyle deyil', 'Öyle değil'],
  ['yazım', 'şöför bekliyor', 'Şoför bekliyor'],
  ['yazım', 'antreman yaptim', 'Antrenman yaptım'],
  ['yazım', 'laboratuar sonuclari', 'Laboratuvar sonuçları'],
  ['yazım', 'supriz yaptik', 'Sürpriz yaptık'],
  ['yazım', 'egzos patladi', 'Egzoz patladı'],
  ['yazım', 'tras oldum', 'Tıraş oldum'],
  ['yazım', 'yanlız degilsin', 'Yalnız değilsin'],
  ['yazım', 'kirbac', 'Kırbaç'],
  ['yazım', 'yapcam yarin', 'Yapacağım yarın'],

  // --- Sayı / özel ad + ek (kesme) ---
  ['kesme', 'saat 5te gel', 'Saat 5\'te gel'],
  ['kesme', '2024te tasindik', '2024\'te taşındık'],
  ['kesme', 'ayin 15inde maas yatar', 'Ayın 15\'inde maaş yatar'],
  ['kesme', 'ahmet ve aliye selam soyle', 'Ahmet ve Ali\'ye selam söyle'],
  ['kesme', 'mehmetin arabasi bozuldu', 'Mehmet\'in arabası bozuldu'],

  // --- Soru işareti (soru sözcükleri) / noktalama ---
  ['noktalama', 'nasilsin', 'Nasılsın?'],
  ['noktalama', 'ne zaman geliyorsun', 'Ne zaman geliyorsun?'],
  ['noktalama', 'neden aramadin', 'Neden aramadın?'],
  ['noktalama', 'nerdesin', 'Neredesin?'],
  ['noktalama', 'kim geldi', 'Kim geldi?'],
  ['noktalama', 'merhaba nasilsin', 'Merhaba, nasılsın?'],

  // --- Büyük harf ---
  ['büyük harf', 'ramazan bayraminiz mubarek olsun', 'Ramazan Bayramınız mübarek olsun'],
  ['büyük harf', 'kurban bayraminda geliyoruz', 'Kurban Bayramında geliyoruz'],
  ['büyük harf', 'ataturk', 'Atatürk'],
  ['büyük harf', 'whatsappta yazdim', 'WhatsApp\'ta yazdım'],
  ['büyük harf', 'mehmet abi geldi', 'Mehmet abi geldi'],

  // --- Kontrol: doğru metin bozulmamalı ---
  ['kontrol', 'Kitap bende kaldı.', 'Kitap bende kaldı.'],
  ['kontrol', 'Evde yokum, sonra ararım.', 'Evde yokum, sonra ararım.'],
  ['kontrol', 'Belki gelirim.', 'Belki gelirim.'],
  ['kontrol', 'Sanki rüya gibi.', 'Sanki rüya gibi.'],
  ['kontrol', 'Odada kimse yok.', 'Odada kimse yok.'],
  ['kontrol', 'Sende kalsın.', 'Sende kalsın.'],
  ['kontrol', 'Herkes geldi mi?', 'Herkes geldi mi?'],
  ['kontrol', 'Bizde böyle bir adet yok.', 'Bizde böyle bir adet yok.'],
  ['kontrol', 'Hala Ankara\'da oturuyor.', 'Hala Ankara\'da oturuyor.'],
  ['kontrol', 'Evdeki hesap çarşıya uymaz.', 'Evdeki hesap çarşıya uymaz.'],

  // --- Yanlış pozitif avı: kuralların dokunmaması gereken doğru cümleler (Türkçe harfsiz yazılmış) ---
  ['bozmama', 'kendimi cok iyi hissediyorum', 'Kendimi çok iyi hissediyorum'],
  ['bozmama', 'cok iyi hissediyorum kendimi', 'Çok iyi hissediyorum kendimi'],
  ['bozmama', 'durumu anlattim', 'Durumu anlattım'],
  ['bozmama', 'bu onun durumu', 'Bu onun durumu'],
  ['bozmama', 'filmi izledin mi', 'Filmi izledin mi?'],
  ['bozmama', 'telefonumu kaybettim', 'Telefonumu kaybettim'],
  ['bozmama', 'yirmi lira verdim', 'Yirmi lira verdim'],
  ['bozmama', 'resmi tatil', 'Resmi tatil'],
  ['bozmama', 'kalemi masaya koy', 'Kalemi masaya koy'],
  ['bozmama', 'yorumu okudum', 'Yorumu okudum'],
  ['bozmama', 'evdeki herkes uyuyor', 'Evdeki herkes uyuyor'],
  ['bozmama', 'yarinki toplanti iptal', 'Yarınki toplantı iptal'],
  ['bozmama', 'benimki daha iyi', 'Benimki daha iyi'],
  ['bozmama', 'simdiki aklim olsaydi', 'Şimdiki aklım olsaydı'],
  ['bozmama', 'halbuki soylemistim', 'Halbuki söylemiştim'],
  ['bozmama', 'bende para yok', 'Bende para yok'],
  ['bozmama', 'onlarda araba var', 'Onlarda araba var'],
  ['bozmama', 'oda cok guzel olmus', 'Oda çok güzel olmuş'],
  ['bozmama', 'bizde kalabilirsin', 'Bizde kalabilirsin'],
  ['bozmama', 'sizde kaldi galiba', 'Sizde kaldı galiba'],
  ['bozmama', 'ne guzel bir gun', 'Ne güzel bir gün'],
  ['bozmama', 'nasil oldugunu bilmiyorum', 'Nasıl olduğunu bilmiyorum'],
  ['bozmama', 'neden geldigini anlamadim', 'Neden geldiğini anlamadım'],
  ['bozmama', 'kimse gelmedi', 'Kimse gelmedi'],
  ['bozmama', 'ne o ne bu', 'Ne o ne bu'],
  ['bozmama', 'kimi zaman gelir', 'Kimi zaman gelir'],
  ['bozmama', 'ne zaman istersen gel', 'Ne zaman istersen gel'],
  ['bozmama', 'nasil istersen', 'Nasıl istersen'],
  ['bozmama', '5 km yurudum, 3kg verdim', '5 km yürüdüm, 3kg verdim'],
  ['bozmama', 'mp3 dosyasi', 'Mp3 dosyası'],
  ['bozmama', 'bunu yapmadim ki', 'Bunu yapmadım ki'],
  ['bozmama', 'hic kimse bilmiyor', 'Hiç kimse bilmiyor'],
  ['bozmama', 'her sey yolunda', 'Her şey yolunda'],
  ['bozmama', 'gelir mi bilmiyorum', 'Gelir mi bilmiyorum'],
  ['bozmama', 'bir kac kelime', 'Birkaç kelime'],
  ['bozmama', 'sanki kimse yokmus gibi', 'Sanki kimse yokmuş gibi'],
  ['bozmama', 'ne kadar guzel olmus', 'Ne kadar güzel olmuş'],
  ['bozmama', 'kac yasindasin', 'Kaç yaşındasın?'],
  ['bozmama', 'odami topladim', 'Odamı topladım'],
  ['bozmama', 'neredeyse bitti', 'Neredeyse bitti'],
];

var tam = function (s) { return T.duzelt(s, 0, s.length, 'tam'); };
var kat = {}, sira = [], toplam = 0, gecen = 0, kacan = [];
VAKALAR.forEach(function (v) {
  var gelen = tam(v[1]), ok = gelen === v[2];
  if (!kat[v[0]]) { kat[v[0]] = [0, 0]; sira.push(v[0]); }
  kat[v[0]][1]++; toplam++;
  if (ok) { kat[v[0]][0]++; gecen++; } else kacan.push([v[0], v[1], gelen, v[2]]);
});

console.log('Kategori'.padEnd(14) + 'Doğru');
sira.forEach(function (k) {
  var a = kat[k];
  console.log(k.padEnd(14) + (a[0] + '/' + a[1]).padStart(6) + '  ' + Math.round(100 * a[0] / a[1]) + '%');
});
console.log('TOPLAM'.padEnd(14) + (gecen + '/' + toplam).padStart(6) + '  ' + Math.round(100 * gecen / toplam) + '%');

if (ayrinti) {
  console.log('\nKaçanlar:');
  kacan.forEach(function (k) {
    console.log('[' + k[0] + '] ' + k[1] + '\n   gelen:    ' + k[2] + '\n   beklenen: ' + k[3]);
  });
}
