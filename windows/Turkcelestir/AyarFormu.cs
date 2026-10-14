// Kısayol ayarı: kutuya tıkla, istediğin tuş birleşimine bas.
using System;
using System.Drawing;
using System.Windows.Forms;

namespace Turkcelestir
{
    sealed class AyarFormu : Form
    {
        readonly KisayolKutusu karakter, tam;

        public AyarFormu()
        {
            Text = "Türkçeleştir — Kısayollar";
            Icon = new Icon(typeof(AyarFormu).Assembly.GetManifestResourceStream("ikon.ico"));
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = MinimizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            AutoScaleMode = AutoScaleMode.Dpi;
            Font = SystemFonts.MessageBoxFont;
            ClientSize = new Size(460, 250);
            TopMost = true;

            var aciklama = new Label
            {
                Text = "Kutuya tıklayıp istediğin tuş birleşimine bas (ör. Ctrl+Alt+T). En az Ctrl ya da Alt olmalı.\n" +
                       "Not: AltGr = Ctrl+Alt. Türkçe Q klavyede AltGr+T \"₺\" yazar; o klavyeyi kullanıyorsan başka harf seç.",
                Location = new Point(14, 12), Size = new Size(432, 54)
            };
            karakter = new KisayolKutusu(Ayarlar.KarakterKisayolu) { Location = new Point(240, 80), Width = 200 };
            tam = new KisayolKutusu(Ayarlar.TamKisayolu) { Location = new Point(240, 118), Width = 200 };
            var tamam = new Button { Text = "Kaydet", DialogResult = DialogResult.OK, Location = new Point(250, 200), Width = 90 };
            var iptal = new Button { Text = "Vazgeç", DialogResult = DialogResult.Cancel, Location = new Point(350, 200), Width = 90 };
            var sifirla = new Button { Text = "Varsayılan", Location = new Point(14, 200), Width = 100 };
            sifirla.Click += (s, e) => { karakter.Tus = Keys.Control | Keys.Alt | Keys.T; tam.Tus = Keys.Control | Keys.Alt | Keys.Y; };
            Controls.AddRange(new Control[] {
                aciklama,
                new Label { Text = "Sadece Türkçe karakterler:", Location = new Point(14, 83), AutoSize = true }, karakter,
                new Label { Text = "Karakter + büyük harf + noktalama:", Location = new Point(14, 121), AutoSize = true }, tam,
                sifirla, tamam, iptal });
            AcceptButton = tamam;
            CancelButton = iptal;
            FormClosing += (s, e) =>
            {
                if (DialogResult != DialogResult.OK) return;
                if (karakter.Tus != Keys.None && karakter.Tus == tam.Tus)
                {
                    MessageBox.Show(this, "İki kısayol aynı olamaz.", Text);
                    e.Cancel = true;
                    return;
                }
                Ayarlar.KarakterKisayolu = karakter.Tus;
                Ayarlar.TamKisayolu = tam.Tus;
            };
        }

        sealed class KisayolKutusu : TextBox
        {
            Keys tus;
            public Keys Tus { get => tus; set { tus = value; Text = Kisayollar.Yazi(value); } }
            public KisayolKutusu(Keys k) { ReadOnly = true; BackColor = SystemColors.Window; Tus = k; ShortcutsEnabled = false; }

            protected override bool ProcessCmdKey(ref Message m, Keys k)
            {
                var anahtar = k & Keys.KeyCode;
                if (anahtar == Keys.Back || anahtar == Keys.Delete) { Tus = Keys.None; return true; }
                if (anahtar == Keys.ControlKey || anahtar == Keys.Menu || anahtar == Keys.ShiftKey) return true;
                if ((k & (Keys.Control | Keys.Alt)) == 0) return base.ProcessCmdKey(ref m, k); // Tab, Enter, Esc normal
                Tus = k;
                return true;
            }
        }
    }
}
