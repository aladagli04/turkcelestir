// Ayarlar kullanıcının kayıt defterinde (HKCU\Software\Turkcelestir); "Windows açılınca başlat" HKCU\...\Run.
using System;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Turkcelestir
{
    static class Ayarlar
    {
        const string Yol = @"Software\Turkcelestir";
        const string Calistir = @"Software\Microsoft\Windows\CurrentVersion\Run";

        public static Keys KarakterKisayolu
        {
            get => Oku("KarakterKisayolu", Keys.Control | Keys.Alt | Keys.T);
            set => Yaz("KarakterKisayolu", value);
        }
        public static Keys TamKisayolu
        {
            get => Oku("TamKisayolu", Keys.Control | Keys.Alt | Keys.Y);
            set => Yaz("TamKisayolu", value);
        }

        static Keys Oku(string ad, Keys varsayilan)
        {
            using (var k = Registry.CurrentUser.OpenSubKey(Yol))
                return k?.GetValue(ad) is int v ? (Keys)v : varsayilan;
        }
        static void Yaz(string ad, Keys deger)
        {
            using (var k = Registry.CurrentUser.CreateSubKey(Yol)) k.SetValue(ad, (int)deger, RegistryValueKind.DWord);
        }

        public static bool AcilistaBaslat
        {
            get { using (var k = Registry.CurrentUser.OpenSubKey(Calistir)) return k?.GetValue("Turkcelestir") != null; }
            set
            {
                using (var k = Registry.CurrentUser.CreateSubKey(Calistir))
                {
                    if (value) k.SetValue("Turkcelestir", "\"" + Application.ExecutablePath + "\"");
                    else k.DeleteValue("Turkcelestir", false);
                }
            }
        }

        public static bool IlkCalisma
        {
            get { using (var k = Registry.CurrentUser.OpenSubKey(Yol)) return k?.GetValue("Kuruldu") == null; }
            set { using (var k = Registry.CurrentUser.CreateSubKey(Yol)) k.SetValue("Kuruldu", value ? 0 : 1); }
        }
    }
}
