using System;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Windows.Forms;

namespace Turkcelestir
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            // Gömülü DLL'ler (Jint vb.) diskte yoksa exe'nin içinden yüklenir: tek dosya dağıtım.
            AppDomain.CurrentDomain.AssemblyResolve += (s, e) =>
            {
                var ad = "dll." + new AssemblyName(e.Name).Name + ".dll";
                using (var akis = typeof(Program).Assembly.GetManifestResourceStream(ad))
                {
                    if (akis == null) return null;
                    var veri = new byte[akis.Length];
                    akis.Read(veri, 0, veri.Length);
                    return Assembly.Load(veri);
                }
            };
            Baslat();
        }

        [MethodImpl(MethodImplOptions.NoInlining)] // Jint türleri AssemblyResolve kurulduktan sonra yüklensin
        static void Baslat()
        {
            using (var tek = new Mutex(true, "Turkcelestir.TekKopya", out bool ilk))
            {
                if (!ilk)
                {
                    MessageBox.Show("Türkçeleştir zaten çalışıyor (saatin yanındaki kırmızı ş simgesi).",
                        "Türkçeleştir", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new Uygulama());
            }
        }
    }
}
