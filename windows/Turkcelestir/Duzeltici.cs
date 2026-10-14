// Odaktaki programda: seçili metni (yoksa Ctrl+A ile tamamını) kopyala → düzelt → yapıştır.
// Kullanıcının panosu önce saklanır, iş bitince geri konur.
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Turkcelestir
{
    sealed class Duzeltici
    {
        readonly Cekirdek cekirdek = new Cekirdek();
        bool calisiyor;

        public sealed class Sonuc
        {
            public bool Tamam; public int Degisen; public string Mesaj;
        }

        public async Task<Sonuc> Calistir(string mod)
        {
            if (calisiyor) return new Sonuc { Mesaj = "Önceki işlem sürüyor" };
            calisiyor = true;
            Gunluk.Yaz("Kısayol: " + mod);
            var yedek = PanoyuSakla();
            try
            {
                // Kullanıcı kısayolun tuşlarını bırakmadan Ctrl+C gönderirsek Ctrl+Alt+C olur.
                for (int i = 0; i < 100 && Yerel.DegistiriciBasili(); i++) await Task.Delay(10);
                if (Yerel.DegistiriciBasili()) return new Sonuc { Mesaj = "Kısayol tuşları bırakılmadı" };

                bool secim = true;
                string metin = await Kopyala();
                Gunluk.Yaz("Seçim kopyası: " + (metin == null ? "yok" : metin.Length + " harf"));
                if (string.IsNullOrEmpty(metin))
                {
                    secim = false;
                    Yerel.CtrlIle(Keys.A);
                    await Task.Delay(60);
                    metin = await Kopyala();
                    Gunluk.Yaz("Ctrl+A kopyası: " + (metin == null ? "yok" : metin.Length + " harf"));
                }
                if (string.IsNullOrEmpty(metin))
                    return new Sonuc { Mesaj = "Metin alınamadı (odakta yazı kutusu yok ya da boş)" };

                string yeni = cekirdek.Duzelt(metin, mod);
                if (yeni == metin)
                {
                    if (!secim) Yerel.Bas(Keys.Right); // Ctrl+A seçimini kaldır
                    return new Sonuc { Tamam = true, Mesaj = "Metin zaten düzgün" };
                }

                PanoyaYaz(yeni);
                await Task.Delay(40);
                Yerel.CtrlIle(Keys.V);
                await Task.Delay(400); // yapıştırma bitmeden pano geri konursa eski içerik yapışabilir
                int sayi = SayDegisen(metin, yeni);
                return new Sonuc { Tamam = true, Degisen = sayi, Mesaj = sayi + " kelime düzeltildi" };
            }
            catch (Exception e)
            {
                Gunluk.Yaz("HATA " + e);
                return new Sonuc { Mesaj = "Hata: " + e.Message };
            }
            finally
            {
                PanoyuGeriKoy(yedek);
                calisiyor = false;
            }
        }

        // Ctrl+C gönder; pano gerçekten değişene kadar (en çok ~0,5 sn) bekle.
        static async Task<string> Kopyala()
        {
            uint once = Yerel.GetClipboardSequenceNumber();
            Yerel.CtrlIle(Keys.C);
            for (int i = 0; i < 25; i++)
            {
                await Task.Delay(20);
                if (Yerel.GetClipboardSequenceNumber() != once)
                {
                    await Task.Delay(20);
                    return Dene(() => Clipboard.ContainsText() ? Clipboard.GetText(TextDataFormat.UnicodeText) : null);
                }
            }
            return null;
        }

        // Geçici içeriğin Windows pano geçmişine (Win+V) ve buluta düşmemesi için.
        const string GecmiseYazma = "ExcludeClipboardContentFromMonitorProcessing";

        static void PanoyaYaz(string metin)
        {
            var d = new DataObject();
            d.SetText(metin, TextDataFormat.UnicodeText);
            d.SetData(GecmiseYazma, new System.IO.MemoryStream(new byte[] { 0, 0, 0, 0 }));
            Dene(() => { Clipboard.SetDataObject(d, true, 5, 50); return true; });
        }

        static Dictionary<string, object> PanoyuSakla()
        {
            var yedek = new Dictionary<string, object>();
            Dene(() =>
            {
                var d = Clipboard.GetDataObject();
                if (d == null) return true;
                foreach (var bicim in d.GetFormats(false))
                {
                    try { var v = d.GetData(bicim, false); if (v != null) yedek[bicim] = v; }
                    catch { /* bazı biçimler okunamaz; atla */ }
                }
                return true;
            });
            return yedek;
        }

        static void PanoyuGeriKoy(Dictionary<string, object> yedek)
        {
            Dene(() =>
            {
                if (yedek.Count == 0) { Clipboard.Clear(); return true; }
                var d = new DataObject();
                foreach (var kv in yedek) d.SetData(kv.Key, false, kv.Value);
                d.SetData(GecmiseYazma, new System.IO.MemoryStream(new byte[] { 0, 0, 0, 0 }));
                Clipboard.SetDataObject(d, true, 5, 50);
                return true;
            });
        }

        // Pano başka bir program tarafından kısa süre kilitli olabilir.
        static T Dene<T>(Func<T> is_)
        {
            for (int i = 0; ; i++)
            {
                try { return is_(); }
                catch (ExternalException) when (i < 5) { System.Threading.Thread.Sleep(30); }
            }
        }

        static int SayDegisen(string a, string b)
        {
            var x = a.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            var y = b.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            int n = Math.Min(x.Length, y.Length), s = Math.Abs(x.Length - y.Length);
            for (int i = 0; i < n; i++) if (x[i] != y[i]) s++;
            return s;
        }
    }
}
