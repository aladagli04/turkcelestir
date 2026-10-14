// Genel klavye kısayolları (her programda çalışır) ve "Ctrl+Alt+T" gibi metinlerle dönüşüm.
using System;
using System.Collections.Generic;
using System.Windows.Forms;

namespace Turkcelestir
{
    sealed class Kisayollar : NativeWindow, IDisposable
    {
        readonly Dictionary<int, Action> islemler = new Dictionary<int, Action>();
        int sonraki = 1;

        public Kisayollar() { CreateHandle(new CreateParams()); }

        /// <summary>Kaydeder; başka program kullanıyorsa false.</summary>
        public bool Ekle(Keys tus, Action islem)
        {
            if (tus == Keys.None) return true;
            uint mod = Yerel.MOD_NOREPEAT;
            if ((tus & Keys.Control) != 0) mod |= Yerel.MOD_CONTROL;
            if ((tus & Keys.Alt) != 0) mod |= Yerel.MOD_ALT;
            if ((tus & Keys.Shift) != 0) mod |= Yerel.MOD_SHIFT;
            int id = sonraki++;
            if (!Yerel.RegisterHotKey(Handle, id, mod, (uint)(tus & Keys.KeyCode))) return false;
            islemler[id] = islem;
            return true;
        }

        public void Temizle()
        {
            foreach (var id in islemler.Keys) Yerel.UnregisterHotKey(Handle, id);
            islemler.Clear();
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == Yerel.WM_HOTKEY && islemler.TryGetValue(m.WParam.ToInt32(), out var islem)) islem();
            base.WndProc(ref m);
        }

        public void Dispose() { Temizle(); DestroyHandle(); }

        public static string Yazi(Keys k)
        {
            if (k == Keys.None) return "(yok)";
            var p = new List<string>();
            if ((k & Keys.Control) != 0) p.Add("Ctrl");
            if ((k & Keys.Alt) != 0) p.Add("Alt");
            if ((k & Keys.Shift) != 0) p.Add("Shift");
            var anahtar = k & Keys.KeyCode;
            p.Add(anahtar >= Keys.D0 && anahtar <= Keys.D9 ? ((int)anahtar - (int)Keys.D0).ToString() : anahtar.ToString());
            return string.Join("+", p);
        }
    }
}
