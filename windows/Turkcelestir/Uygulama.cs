// Saatin yanındaki simge, menü ve kısayolların bağlandığı yer.
using System;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;

namespace Turkcelestir
{
    sealed class Uygulama : ApplicationContext
    {
        readonly NotifyIcon simge;
        readonly Kisayollar kisayollar = new Kisayollar();
        readonly Duzeltici duzeltici = new Duzeltici();
        readonly ToolStripMenuItem duraklat, acilis, bilgi1, bilgi2;
        bool durakli;

        public Uygulama()
        {
            var menu = new ContextMenuStrip();
            menu.Items.Add(new ToolStripMenuItem("Türkçeleştir") { Enabled = false, Font = new Font(SystemFonts.MenuFont, FontStyle.Bold) });
            bilgi1 = new ToolStripMenuItem { Enabled = false };
            bilgi2 = new ToolStripMenuItem { Enabled = false };
            menu.Items.Add(bilgi1);
            menu.Items.Add(bilgi2);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(new ToolStripMenuItem("Kısayolları değiştir…", null, (s, e) => AyarlariAc()));
            acilis = new ToolStripMenuItem("Windows açılınca başlat", null, (s, e) => { Ayarlar.AcilistaBaslat = !Ayarlar.AcilistaBaslat; acilis.Checked = Ayarlar.AcilistaBaslat; });
            menu.Items.Add(acilis);
            duraklat = new ToolStripMenuItem("Duraklat", null, (s, e) => Duraklat(!durakli));
            menu.Items.Add(duraklat);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(new ToolStripMenuItem("Nasıl kullanılır / GitHub", null, (s, e) => Ac("https://github.com/aladagli04/turkcelestir")));
            menu.Items.Add(new ToolStripMenuItem("Çıkış", null, (s, e) => Cik()));
            menu.Opening += (s, e) => acilis.Checked = Ayarlar.AcilistaBaslat;

            simge = new NotifyIcon
            {
                Icon = new Icon(typeof(Uygulama).Assembly.GetManifestResourceStream("ikon.ico")),
                ContextMenuStrip = menu,
                Visible = true,
                Text = "Türkçeleştir"
            };
            simge.MouseClick += (s, e) => { if (e.Button == MouseButtons.Left) Bildir(KisaAciklama(), ToolTipIcon.Info); };

            Gunluk.Yaz("Başladı " + Application.ProductVersion);
            KisayollariKaydet();

            if (Ayarlar.IlkCalisma)
            {
                Ayarlar.IlkCalisma = false;
                Bildir("Türkçeleştir çalışıyor.\n" + KisaAciklama() +
                       "\nSağ tık menüsünden \"Windows açılınca başlat\"ı açabilirsin.", ToolTipIcon.Info);
            }
        }

        string KisaAciklama() =>
            "Yazı kutusundayken: " + Kisayollar.Yazi(Ayarlar.KarakterKisayolu) + " = Türkçe karakterler, " +
            Kisayollar.Yazi(Ayarlar.TamKisayolu) + " = + büyük harf ve noktalama. Seçim yoksa kutunun tamamı.";

        void KisayollariKaydet()
        {
            kisayollar.Temizle();
            bilgi1.Text = Kisayollar.Yazi(Ayarlar.KarakterKisayolu) + "   Sadece Türkçe karakterler";
            bilgi2.Text = Kisayollar.Yazi(Ayarlar.TamKisayolu) + "   Karakter + büyük harf + noktalama";
            if (durakli) return;
            string sorun = "";
            if (!kisayollar.Ekle(Ayarlar.KarakterKisayolu, () => Duzelt("karakter"))) sorun += " " + Kisayollar.Yazi(Ayarlar.KarakterKisayolu);
            if (!kisayollar.Ekle(Ayarlar.TamKisayolu, () => Duzelt("tam"))) sorun += " " + Kisayollar.Yazi(Ayarlar.TamKisayolu);
            Gunluk.Yaz("Kısayollar kaydedildi" + (sorun == "" ? "" : ", kullanılamayan:" + sorun));
            if (sorun != "")
                Bildir("Bu kısayol başka bir program tarafından kullanılıyor:" + sorun + "\nSimgeye sağ tıkla → Kısayolları değiştir.", ToolTipIcon.Warning);
        }

        async void Duzelt(string mod)
        {
            var s = await duzeltici.Calistir(mod);
            Gunluk.Yaz("Sonuç: " + s.Mesaj);
            simge.Text = Kisalt("Türkçeleştir — son: " + s.Mesaj);
            if (!s.Tamam) Bildir(s.Mesaj, ToolTipIcon.Warning);
        }

        void Duraklat(bool evet)
        {
            durakli = evet;
            duraklat.Checked = evet;
            KisayollariKaydet();
            simge.Text = evet ? "Türkçeleştir (duraklatıldı)" : "Türkçeleştir";
        }

        void AyarlariAc()
        {
            using (var f = new AyarFormu())
            {
                kisayollar.Temizle(); // pencere açıkken kısayollar tetiklenmesin
                f.ShowDialog();
                KisayollariKaydet();
            }
        }

        void Bildir(string mesaj, ToolTipIcon tur) => simge.ShowBalloonTip(4000, "Türkçeleştir", mesaj, tur);
        static string Kisalt(string s) => s.Length > 63 ? s.Substring(0, 62) + "…" : s; // NotifyIcon.Text sınırı
        static void Ac(string adres) { try { Process.Start(adres); } catch { } }

        void Cik()
        {
            simge.Visible = false;
            kisayollar.Dispose();
            ExitThread();
        }
    }
}
