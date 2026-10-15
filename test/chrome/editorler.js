// Lexical (Reddit), gölge DOM ve iç içe çerçeve (GMX benzeri) denemesi.
const puppeteer = require('puppeteer');
const http = require('http');
const EKLENTI = 'D:/Projects/turkcelestir/eklenti';
const METIN = 'merhaba arkadaslar,  bugun cok guzel bir gun .yarin istanbula gidiyorum\\nsiz de gelecek misiniz';

const LEXICAL = `<!doctype html><meta charset="utf-8"><body>
<div id="light" contenteditable="true" style="border:1px solid #999;min-height:60px"></div>
<div id="host"></div>
<script type="module">
import { createEditor, $getRoot, $createParagraphNode, $createTextNode } from 'https://esm.sh/lexical@0.17.1';
import { registerRichText } from 'https://esm.sh/@lexical/rich-text@0.17.1?deps=lexical@0.17.1';
function kur(el, ad) {
  const ed = createEditor({ namespace: ad, onError: e => console.error(e) });
  ed.setRootElement(el);
  registerRichText(ed);
  ed.update(() => {
    const kok = $getRoot();
    "${METIN}".split('\\n').forEach(s => { const p = $createParagraphNode(); p.append($createTextNode(s)); kok.append(p); });
  });
  window['ed_' + ad] = ed;
}
window.durum = ad => new Promise(r => window['ed_' + ad].getEditorState().read(() => r($getRoot().getTextContent())));
kur(document.getElementById('light'), 'light');
const sr = document.getElementById('host').attachShadow({ mode: 'open' });
const d = document.createElement('div'); d.contentEditable = 'true'; d.style.minHeight = '60px'; sr.appendChild(d);
kur(d, 'shadow');
window.hazir = true;
</script></body>`;

// GMX benzeri: ana sayfa (8811) -> başka köken iframe (8812) -> içinde about:blank iframe, gövdesi düzenlenebilir
const ANA = `<!doctype html><body><iframe id="dis" src="http://127.0.0.1:8812/" style="width:700px;height:260px"></iframe></body>`;
const DIS = `<!doctype html><meta charset="utf-8"><body><iframe id="ic" style="width:650px;height:200px"></iframe><script>
const ic = document.getElementById('ic'); const d = ic.contentDocument;
d.open(); d.write('<html><body contenteditable="true"><p>merhaba, bugun cok guzel</p><p>gorusuruz</p></body></html>'); d.close();
</script></body>`;

http.createServer((q, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(q.url.startsWith('/lex') ? LEXICAL : ANA); }).listen(8811);
http.createServer((q, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(DIS); }).listen(8812);

(async () => {
  const tarayici = await puppeteer.launch({
    headless: true, pipe: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: __dirname + '/profil',
    enableExtensions: [EKLENTI],
  });
  const sw = await (await tarayici.waitForTarget(t => t.type() === 'service_worker' && t.url().includes('arka.js'))).worker();
  const calistir = (mod, kaynak, cerceve) => sw.evaluate(async (mod, kaynak, cerceve) => {
    const [sekme] = await chrome.tabs.query({ active: true });
    return await calistir(sekme, mod, kaynak, cerceve);
  }, mod, kaynak, cerceve);
  // Sağ tık menüsü tıklanan çerçevenin frameId'sini verir; burada odaktaki çerçeveyi bulup onu kullanıyoruz.
  const odakCercevesi = () => sw.evaluate(async () => {
    const [sekme] = await chrome.tabs.query({ active: true });
    const s = await chrome.scripting.executeScript({ target: { tabId: sekme.id, allFrames: true }, func: () => document.hasFocus() && !(document.activeElement instanceof HTMLIFrameElement) });
    return s.filter(x => x.result).map(x => x.frameId);
  });

  const sayfa = await tarayici.newPage();
  sayfa.on('console', m => { if (m.type() === 'error') console.log('  [sayfa hata]', m.text()); });
  await sayfa.goto('http://localhost:8811/lex', { waitUntil: 'networkidle0' });
  await sayfa.waitForFunction('window.hazir');

  for (const [ad, secici] of [['light', '#light'], ['shadow', null]]) {
    if (secici) await sayfa.click(secici);
    else await sayfa.evaluate(() => document.getElementById('host').shadowRoot.querySelector('div').focus());
    console.log(ad + ' (seçimsiz):', JSON.stringify(await calistir('tam', 'menu', { frameIds: [0] })));
    console.log('   ->', JSON.stringify(await sayfa.evaluate(a => window.durum(a), ad)));
    console.log('   DOM', JSON.stringify(await sayfa.evaluate(a => (a==='light'?document.getElementById('light'):document.getElementById('host').shadowRoot.querySelector('div')).innerHTML, ad)));
  }

  // Seçimli: light editörde ilk paragrafı seç (Lexical'e özgü: ham karakterli metinle yeniden doldur)
  await sayfa.evaluate(() => {
    const el = document.getElementById('light');
    window.ed_light.update(() => {}, {});
  });

  await sayfa.goto('http://localhost:8811/', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));
  const dis = sayfa.frames().find(f => f.url().includes('8812'));
  const ic = dis.childFrames()[0];
  await ic.click('body');
  const idler = await odakCercevesi();
  console.log('iç içe çerçeve frameId:', idler);
  console.log('iç içe (menü):', JSON.stringify(await calistir('tam', 'menu', { frameIds: idler.length ? idler : [0] })));
  console.log('   ->', JSON.stringify(await ic.evaluate(() => document.body.innerText)));

  await tarayici.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
