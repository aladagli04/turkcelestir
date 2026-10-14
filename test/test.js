// node test/test.js
var T = require('../eklenti/lib/turkce.js');
var hata = 0;
function esit(ad, gelen, beklenen) {
  if (gelen === beklenen) { console.log('  ok  ' + ad); return; }
  hata++;
  console.log('HATA  ' + ad + '\n   gelen:    ' + JSON.stringify(gelen) + '\n   beklenen: ' + JSON.stringify(beklenen));
}

console.log('Karakterler');
esit('basit', T.duzelt('Yarin aksam size ugrayacagim, cok selam soyle'), 'Yarın akşam size uğrayacağım, çok selam söyle');
esit('almanca klavye karışık', T.duzelt('Bugün cok güzel bir gün, disari cikalim mi?'), 'Bugün çok güzel bir gün, dışarı çıkalım mı?');
esit('yazılmış ü/ö korunur', T.duzelt('düsük ögle'), 'düşük öğle');
esit('adres korunur', T.duzelt('sitesi www.google.com/search?q=cocuk ve mail ali.cig@gmail.com'),
  'sitesi www.google.com/search?q=cocuk ve mail ali.cig@gmail.com');
esit('soru eki uyumu', T.duzelt('olur mu, var mi, gelir mi, gordun mu, guzel misiniz'),
  'olur mu, var mı, gelir mi, gördün mü, güzel misiniz');
esit('seçim aralığı', T.duzelt('cok guzel cok guzel', 10, 19), 'çok güzel');

console.log('Kurallar (tam)');
var tam = function (s) { return T.duzelt(s, 0, s.length, 'tam'); };
esit('cümle başı', tam('merhaba. bugun nasilsin? iyiyim!'), 'Merhaba. Bugün nasılsın? İyiyim!');
esit('i -> İ', tam('istanbul guzel'), 'İstanbul güzel');
esit('boşluklar', tam('Selam  ,  nasilsin   abi .'), 'Selam, nasılsın abi.');
esit('nokta sonrası boşluk', tam('Geldim.Sonra gittim,ama donecegim'), 'Geldim. Sonra gittim, ama döneceğim');
esit('bölünmez boşluk', tam('yapamazmiyiz  sadece'), 'Yapamazmıyız sadece');
esit('ters boşluk', tam('guzel bir gun .yarin gel ,olur mu'), 'Güzel bir gün. Yarın gel, olur mu?');
esit('soru eki sonda', tam('yarin geliyor musun'), 'Yarın geliyor musun?');
esit('soru eki nokta', tam('Geliyor musun. Ben geliyorum.'), 'Geliyor musun? Ben geliyorum.');
esit('soru eki ortada', tam('gelir mi bilmiyorum'), 'Gelir mi bilmiyorum');
esit('sıra sayısı', tam('ayin 3. gunu geldi'), 'Ayın 3. günü geldi');
esit('kısaltma', tam('elma, armut vb. meyveler'), 'Elma, armut vb. meyveler');
esit('üç nokta', tam('bilmem... belki gelirim'), 'Bilmem... belki gelirim');
esit('özel isim', tam('almanyada yasiyorum ama turkiyeye gidecegim, istanbulda kalacagim'),
  'Almanya\'da yaşıyorum ama Türkiye\'ye gideceğim, İstanbul\'da kalacağım');
esit('kesmeli yazılmış', tam("istanbul'a gittim"), "İstanbul'a gittim");
esit('dil eki kesmesiz', tam('turkcede boyle denir'), 'Türkçede böyle denir');
esit('yapım eki', tam('o istanbullu biri'), 'O İstanbullu biri');
esit('dil adı', tam('ben almanca ve turkce konusuyorum'), 'Ben Almanca ve Türkçe konuşuyorum');
esit('almanı değişmez', tam('bunu almani istiyorum'), 'Bunu almanı istiyorum');
esit('satır başları', tam('merhaba,\nnasilsiniz\n\nselamlar'), 'Merhaba,\nNasılsınız\n\nSelamlar');
esit('iPhone', tam('iPhone aldim'), 'iPhone aldım');
esit('gülümseme', tam('cok iyi :) sagol'), 'Çok iyi :) sağol');
esit('saat ve ondalık', tam('saat 14:30 da 3,5 km yuruduk'), 'Saat 14:30 da 3,5 km yürüdük');
esit('adres tam', tam('bak google.com sitesine'), 'Bak google.com sitesine');
esit('seçim cümle ortası', T.duzelt('Ben de geldim', 7, 13, 'tam'), 'geldim');
esit('seçim yeni cümle', T.duzelt('Tamam. geldim', 7, 13, 'tam'), 'Geldim');

console.log('Yapay zekâ birleştirme');
var B = T.birlestir;
esit('silinen kelime geri gelir', B('Bir de Almanya\'da parça bulmak çok zor Türkiye\'den getirtmek mantıklı mı sizce',
  'Bir de Almanya\'da parça bulmak çok zor. Türkiye\'den getirtmek mantıklı mı?'),
  'Bir de Almanya\'da parça bulmak çok zor. Türkiye\'den getirtmek mantıklı mı sizce?');
esit('eklenen kelime atılır', B('yarin gelirim', 'Yarın kesinlikle gelirim.'), 'Yarın gelirim.');
esit('değişen kelime girdiden', B('araba aldim', 'Otomobil aldım.'), 'araba aldım.');
esit('şapka/harf modelden', B('hala gelmedi', 'Hâlâ gelmedi.'), 'Hâlâ gelmedi.');
esit('aynısı', B('Merhaba arkadaşlar geçen hafta', 'Merhaba arkadaşlar, geçen hafta'), 'Merhaba arkadaşlar, geçen hafta');
esit('model tırnak/süs', B('tamam geliyorum', '"Tamam, geliyorum."'), '"Tamam, geliyorum."');

esit('yazım düzeltmesi', B('bior eklenti, faydalli olacaktir', 'Bir eklenti, faydalı olacaktır.'), 'Bir eklenti, faydalı olacaktır.');
esit('başka kelime reddedilir', B('dun geldi', 'Dün gitti.'), 'Dün geldi.');
esit('bitişik ayırma', B('sorum böyle bir eklentiyi yapamazmiyiz  sadece', 'Sorum böyle bir eklentiyi yapamaz mıyız? Sadece'),
  'Sorum böyle bir eklentiyi yapamaz mıyız? Sadece');
esit('bitişik ayırma 2', B('dedigim gibiforumlarda yazinintürkce karekterlerinin', 'dediğim gibi forumlarda yazının Türkçe karakterlerinin'),
  'dediğim gibi forumlarda yazının Türkçe karakterlerinin');
esit('kesme', B('galiba firefoxta idi', "Galiba Firefox'ta idi."), "Galiba Firefox'ta idi.");
esit('sayı değişmez', B('saat 14 te', "Saat 15'te"), 'Saat 14 te');

esit('dil adı kesme almaz', B('turkcelestir diye', "Türkçe'leştir diye"), 'Türkçeleştir diye');
esit('ayırmada yutulan harf', B('yazinintürkce karakter', 'yazını Türkçe karakter'), 'yazinin Türkçe karakter');

console.log('Fark');
function uygula(a, parcalar) {
  for (var i = parcalar.length - 1; i >= 0; i--) a = a.slice(0, parcalar[i].a0) + parcalar[i].yeni + a.slice(parcalar[i].a1);
  return a;
}
[['abc', 'abc'], ['', 'xyz'], ['xyz', ''], ['Selam  ,  nasilsin', 'Selam, nasılsın'], ['kitten', 'sitting'],
  ['aaa bbb ccc', 'Aaa bbb? ccc.']].forEach(function (c) {
  esit(c[0] + ' -> ' + c[1], uygula(c[0], T.fark(c[0], c[1])), c[1]);
});

console.log(hata ? '\n' + hata + ' HATA' : '\nHepsi geçti');
process.exit(hata ? 1 : 0);
