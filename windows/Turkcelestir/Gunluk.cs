// Kısa günlük: %LOCALAPPDATA%\Turkcelestir\gunluk.txt (sorun bildirirken eklenebilir; metin içeriği yazılmaz).
using System;
using System.IO;

namespace Turkcelestir
{
    static class Gunluk
    {
        static readonly string Yol = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Turkcelestir", "gunluk.txt");

        public static string Dosya => Yol;

        public static void Yaz(string s)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Yol));
                if (File.Exists(Yol) && new FileInfo(Yol).Length > 200_000) File.Delete(Yol);
                File.AppendAllText(Yol, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + "  " + s + Environment.NewLine);
            }
            catch { }
        }
    }
}
