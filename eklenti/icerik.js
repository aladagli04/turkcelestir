// Sayfaya yalnız kullanıcı menüye/kısayola bastığında enjekte edilir (activeTab).
// Odaktaki yazı kutusunu bulur, seçim varsa onu, yoksa tamamını düzeltir.
// Değişiklikler execCommand('insertText') ile yapılır: Ctrl+Z çalışır, site (Gmail, React...) değişikliği görür.
(function () {
  if (window.TurkceCalistir) return;

  var METIN_INPUT = /^(text|search|)$/;
  // Gmail vb.: alıntılanan eski mesaj ve imza düzeltilmez.
  var ATLA = 'blockquote, .gmail_quote, .gmail_signature, [class*="signature"], script, style, [contenteditable="false"]';
  var BLOK = /^(DIV|P|LI|UL|OL|H[1-6]|TR|TD|PRE|SECTION|ARTICLE|BLOCKQUOTE|TABLE)$/;

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

  function kutuyuDuzelt(el, mod) {
    var deger = el.value, bas = el.selectionStart, son = el.selectionEnd, imlec = son;
    var secimVar = son > bas;
    if (!secimVar) { bas = 0; son = deger.length; }
    var eski = deger.slice(bas, son), yeni = Turkce.duzelt(deger, bas, son, mod);
    if (yeni === eski) return 0;
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

  function editoruDuzelt(kok, mod) {
    var sec = window.getSelection();
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
        if (s > b) { bas = b; son = s; secimVar = true; }
      } else if (r.collapsed && r.startContainer.nodeType === 3) {
        imlec = { dugum: r.startContainer, ofset: r.startOffset };
      }
    }
    var eski = metin.slice(bas, son), yeni = Turkce.duzelt(metin, bas, son, mod);
    if (yeni === eski) return 0;

    // Değişiklikleri düğümlere dağıt; aynı düğümdekileri tek değişiklikte birleştir.
    var gruplar = [];
    Turkce.fark(eski, yeni).forEach(function (h) {
      var a0 = h.a0 + bas, a1 = h.a1 + bas;
      // İki düğümün sınırına ekleme olursa öncekinin sonuna eklenir (find ilkini döndürür).
      var p = parcalar.find(function (p) { return a0 >= p.bas && a1 <= p.son; });
      if (!p) return; // düğüm sınırını aşan değişiklik (ör. iki satır arası) atlanır
      var g = gruplar.length && gruplar[gruplar.length - 1];
      if (g && g.p === p) {
        g.yeni += metin.slice(g.a1, a0) + h.yeni;
        g.a1 = a1;
      } else gruplar.push({ p: p, a0: a0, a1: a1, yeni: h.yeni });
    });

    for (var i = gruplar.length - 1; i >= 0; i--) {
      var g = gruplar[i], dugum = g.p.dugum, o0 = g.a0 - g.p.bas, o1 = g.a1 - g.p.bas;
      var aralik = document.createRange();
      aralik.setStart(dugum, o0);
      aralik.setEnd(dugum, o1);
      sec.removeAllRanges();
      sec.addRange(aralik);
      var tamam = g.yeni ? document.execCommand('insertText', false, g.yeni) : document.execCommand('delete');
      if (!tamam) {
        dugum.data = dugum.data.slice(0, o0) + g.yeni + dugum.data.slice(o1);
        kok.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // İmleci olabildiğince eski yerine koy.
    sec.removeAllRanges();
    var son_ = document.createRange();
    if (imlec && imlec.dugum.isConnected) {
      son_.setStart(imlec.dugum, Math.min(imlec.ofset, imlec.dugum.data.length));
    } else if (secimVar && gruplar.length) {
      var gs = gruplar[gruplar.length - 1].p.dugum;
      son_.setStart(gs, gs.isConnected ? gs.data.length : 0);
    } else {
      son_.selectNodeContents(kok);
      son_.collapse(false);
    }
    son_.collapse(true);
    sec.addRange(son_);
    return gruplar.length;
  }

  // kaynak: 'menu' (sağ tık; tıklanan çerçeve) veya 'kisayol' (tüm çerçeveler; yalnız odaktaki çalışır)
  window.TurkceCalistir = function (mod, kaynak) {
    if (kaynak === 'kisayol' && !document.hasFocus()) return null;
    var el = odaktakiAlan();
    if (!el) return null;
    try {
      return el.isContentEditable ? editoruDuzelt(el, mod) : kutuyuDuzelt(el, mod);
    } catch (e) {
      console.warn('Türkçeleştir:', e);
      return -1;
    }
  };
})();
