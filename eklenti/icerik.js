// Sayfaya yalnız kullanıcı menüye/kısayola bastığında enjekte edilir (activeTab).
// Odaktaki yazı kutusunu bulur, seçim varsa onu, yoksa tamamını düzeltir.
// Değişiklikler execCommand('insertText') ile yapılır: Ctrl+Z çalışır, site (Gmail, React...) değişikliği görür.
(function () {
  if (window.TurkceCalistir) return;

  var METIN_INPUT = /^(text|search|)$/;
  // Gmail vb.: alıntılanan eski mesaj ve imza düzeltilmez.
  var ATLA = 'blockquote, .gmail_quote, .gmail_signature, [class*="signature"], script, style, [contenteditable="false"]';
  var BLOK = /^(DIV|P|LI|UL|OL|H[1-6]|TR|TD|PRE|SECTION|ARTICLE|BLOCKQUOTE|TABLE)$/;

  // Chrome sağ tıkta yazım hatalı (kırmızı çizili) kelimeyi kendiliğinden seçer; ASCII Türkçe
  // kelimelerin hepsi öyle. Tek kelimelik seçimi kullanıcı seçimi saymıyoruz: kutunun tamamı düzelir.
  function tekKelime(s) { return !/\s/.test(s.trim()); }

  function odaktakiAlan() {
    var el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    if (!el) return null;
    if (el.tagName === 'TEXTAREA') return el;
    if (el.tagName === 'INPUT' && METIN_INPUT.test((el.getAttribute('type') || '').toLowerCase())) return el;
    if (el.isContentEditable) {
      while (el.parentElement && el.parentElement.isContentEditable) el = el.parentElement;
      return el;
    }
    return null;
  }

  // Yeni metni hesapla. 'yz': önce ücretsiz kurallar burada, sonra noktalama arka plandaki modelde.
  async function hesapla(metin, bas, son, mod) {
    var on = Turkce.duzelt(metin, bas, son, mod === 'yz' ? 'tam' : mod);
    if (mod !== 'yz' || !/\p{L}/u.test(on)) return on;
    var c = await chrome.runtime.sendMessage({ tur: 'yz', metin: on });
    if (!c || c.hata) throw new Error(c ? c.hata : 'Arka plandan cevap gelmedi');
    return c.metin;
  }
  var DEGISTI = 'Metin, yapay zekâ çalışırken değişti; dokunulmadı. Tekrar deneyin.';

  async function kutuyuDuzelt(el, mod) {
    var deger = el.value, bas = el.selectionStart, son = el.selectionEnd, imlec = son;
    var secimVar = son > bas && !tekKelime(deger.slice(bas, son));
    if (!secimVar) { bas = 0; son = deger.length; imlec = el.selectionStart; }
    var eski = deger.slice(bas, son), yeni = await hesapla(deger, bas, son, mod);
    if (yeni === eski) return 0;
    if (el.value !== deger) throw new Error(DEGISTI);
    el.focus();
    el.setSelectionRange(bas, son);
    if (!document.execCommand('insertText', false, yeni) || el.value.slice(bas, bas + yeni.length) !== yeni) {
      el.setRangeText(yeni, bas, son, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (secimVar) el.setSelectionRange(bas, bas + yeni.length);
    else { var p = imlec >= deger.length ? el.value.length : Math.min(imlec, el.value.length); el.setSelectionRange(p, p); }
    return Turkce.fark(eski, yeni).length;
  }

  // contenteditable: metin düğümlerini sırayla topla, bloklar arasına sanal "\n" koy.
  function dugumleriTopla(kok) {
    var parcalar = [], metin = '';
    function satirSonu() { if (metin && metin.slice(-1) !== '\n') metin += '\n'; }
    (function gez(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          parcalar.push({ dugum: c, bas: metin.length, son: metin.length + c.data.length });
          metin += c.data;
        } else if (c.nodeType === 1) {
          if (c.matches(ATLA)) { satirSonu(); continue; }
          if (c.tagName === 'BR') { metin += '\n'; continue; }
          var blok = BLOK.test(c.tagName);
          if (blok) satirSonu();
          gez(c);
          if (blok) satirSonu();
        }
      }
    })(kok);
    return { parcalar: parcalar, metin: metin };
  }

  // Gölge DOM'daki editörlerde (web bileşenleri) seçim kendi kökünden alınır.
  function secimAl(kok) {
    var r = kok.getRootNode();
    return (r !== document && r.getSelection) ? r.getSelection() : window.getSelection();
  }
  // Lexical/Draft gibi editörler seçimi "selectionchange" olayıyla (eşzamansız) okur;
  // her adımda kısa bekleme olmazsa art arda değişikliklerin çoğu kaybolur.
  function bekle() { return new Promise(function (r) { setTimeout(r, 15); }); }

  async function editoruDuzelt(kok, mod) {
    var sec = secimAl(kok);
    var t = dugumleriTopla(kok), parcalar = t.parcalar, metin = t.metin;
    var bas = 0, son = metin.length, secimVar = false, imlec = null;
    if (sec.rangeCount) {
      var r = sec.getRangeAt(0);
      if (!r.collapsed && kok.contains(r.commonAncestorContainer)) {
        var b = Infinity, s = -1;
        parcalar.forEach(function (p) {
          if (!r.intersectsNode(p.dugum)) return;
          var pb = p.dugum === r.startContainer ? r.startOffset : 0;
          var ps = p.dugum === r.endContainer ? r.endOffset : p.dugum.data.length;
          if (pb < ps) { b = Math.min(b, p.bas + pb); s = Math.max(s, p.bas + ps); }
        });
        if (s > b && !tekKelime(metin.slice(b, s))) { bas = b; son = s; secimVar = true; }
      } else if (r.collapsed) {
        imlec = metindekiYer(parcalar, r.startContainer, r.startOffset);
      }
    }
    var eski = metin.slice(bas, son), yeni = await hesapla(metin, bas, son, mod);
    if (yeni === eski) return { sayi: 0 };
    if (dugumleriTopla(kok).metin !== metin) throw new Error(DEGISTI);

    // Değişiklikleri düğümlere dağıt; aynı düğümdekileri tek değişiklikte birleştir.
    var gruplar = [];
    Turkce.fark(eski, yeni).forEach(function (h) {
      var a0 = h.a0 + bas, a1 = h.a1 + bas;
      // İki düğümün sınırına ekleme olursa öncekinin sonuna eklenir (find ilkini döndürür).
      var p = parcalar.find(function (p) { return a0 >= p.bas && a1 <= p.son; });
      if (!p) { gruplar.push({ atla: true }); return; } // düğüm sınırını aşan değişiklik
      var g = gruplar.length && gruplar[gruplar.length - 1];
      if (g && g.p === p) {
        g.yeni += metin.slice(g.a1, a0) + h.yeni;
        g.a1 = a1;
      } else gruplar.push({ p: p, a0: a0, a1: a1, yeni: h.yeni });
    });

    // Sondan başa uygula: önceki metin değişmediği için konumlar geçerli kalır. Editör düğümleri
    // yeniden oluşturabildiğinden her adımda düğümler baştan toplanır.
    var yapilan = 0, atlanan = 0;
    for (var i = gruplar.length - 1; i >= 0; i--) {
      var g = gruplar[i];
      if (g.atla) { atlanan++; continue; }
      var t2 = dugumleriTopla(kok);
      var p = t2.parcalar.find(function (p) { return g.a0 >= p.bas && g.a1 <= p.son; });
      if (!p || t2.metin.slice(g.a0, g.a1) !== metin.slice(g.a0, g.a1)) { atlanan++; continue; }
      var tamam = false, oldu = false;
      for (var deneme = 1; deneme <= 3 && !oldu; deneme++) {
        if (deneme > 1) {
          // Editör ilk denemeyi yutmuş olabilir: biraz daha bekleyip düğümleri yeniden bul.
          await bekle(); await bekle();
          t2 = dugumleriTopla(kok);
          p = t2.parcalar.find(function (p) { return g.a0 >= p.bas && g.a1 <= p.son; });
          if (!p || t2.metin.slice(g.a0, g.a1) !== metin.slice(g.a0, g.a1)) break;
        }
        var aralik = document.createRange();
        aralik.setStart(p.dugum, g.a0 - p.bas);
        aralik.setEnd(p.dugum, g.a1 - p.bas);
        sec.removeAllRanges();
        sec.addRange(aralik);
        await bekle();
        tamam = g.yeni ? document.execCommand('insertText', false, g.yeni) : document.execCommand('delete');
        await bekle();
        oldu = dugumleriTopla(kok).metin.slice(g.a0, g.a0 + g.yeni.length) === g.yeni;
      }
      if (oldu) { yapilan++; continue; }
      if (!p) { atlanan++; continue; }
      if (!tamam) {
        p.dugum.data = p.dugum.data.slice(0, g.a0 - p.bas) + g.yeni + p.dugum.data.slice(g.a1 - p.bas);
        kok.dispatchEvent(new Event('input', { bubbles: true }));
        yapilan++;
      } else atlanan++;
    }

    // İmleci eski yerine koy (yoksa düzeltilen alanın sonuna).
    var t4 = dugumleriTopla(kok), hedef = imlec != null ? imlec + (t4.metin.length - metin.length)
      : secimVar ? son + (yeni.length - eski.length) : t4.metin.length;
    var yer = dugumdekiYer(t4.parcalar, Math.max(0, hedef));
    sec.removeAllRanges();
    var son_ = document.createRange();
    if (yer) son_.setStart(yer.dugum, yer.ofset); else { son_.selectNodeContents(kok); son_.collapse(false); }
    son_.collapse(true);
    sec.addRange(son_);
    return { sayi: yapilan, atlanan: atlanan };
  }

  function metindekiYer(parcalar, dugum, ofset) {
    var p = parcalar.find(function (p) { return p.dugum === dugum; });
    return p ? p.bas + ofset : null;
  }
  function dugumdekiYer(parcalar, konum) {
    for (var i = parcalar.length - 1; i >= 0; i--) {
      var p = parcalar[i];
      if (konum >= p.bas && konum <= p.son) return { dugum: p.dugum, ofset: konum - p.bas };
      if (konum > p.son) return { dugum: p.dugum, ofset: p.dugum.data.length };
    }
    return null;
  }

  // kaynak: 'menu' (sağ tık; tıklanan çerçeve) veya 'kisayol' (tüm çerçeveler; yalnız odaktaki çalışır)
  window.TurkceCalistir = async function (mod, kaynak) {
    if (kaynak === 'kisayol' && !document.hasFocus()) return null;
    var el = odaktakiAlan();
    if (!el) return null;
    try {
      var s = el.isContentEditable ? await editoruDuzelt(el, mod) : { sayi: await kutuyuDuzelt(el, mod) };
      return { durum: 'tamam', sayi: s.sayi, atlanan: s.atlanan || 0, alan: el.tagName.toLowerCase() };
    } catch (e) {
      console.warn('Türkçeleştir:', e);
      return { durum: 'hata', hata: String(e && e.message || e).slice(0, 400), alan: el.tagName.toLowerCase() };
    }
  };
})();
