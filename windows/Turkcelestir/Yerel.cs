// Win32 çağrıları: genel kısayol, tuş gönderme, pano sıra numarası.
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace Turkcelestir
{
    static class Yerel
    {
        public const int WM_HOTKEY = 0x0312;
        public const uint MOD_ALT = 1, MOD_CONTROL = 2, MOD_SHIFT = 4, MOD_WIN = 8, MOD_NOREPEAT = 0x4000;

        [DllImport("user32.dll", SetLastError = true)] public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint mod, uint vk);
        [DllImport("user32.dll")] public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
        [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vk);
        [DllImport("user32.dll")] public static extern uint GetClipboardSequenceNumber();
        [DllImport("user32.dll", SetLastError = true)] static extern uint SendInput(uint n, INPUT[] girdiler, int boyut);

        // INPUT birliği, en büyük üye (MOUSEINPUT) ile: 32 ve 64 bitte doğru boyut.
        [StructLayout(LayoutKind.Sequential)]
        struct INPUT { public uint type; public BIRLIK u; }
        [StructLayout(LayoutKind.Explicit)]
        struct BIRLIK { [FieldOffset(0)] public MOUSEINPUT mi; [FieldOffset(0)] public KEYBDINPUT ki; }
        [StructLayout(LayoutKind.Sequential)]
        struct MOUSEINPUT { public int dx, dy; public uint mouseData, dwFlags, time; public IntPtr dwExtraInfo; }
        [StructLayout(LayoutKind.Sequential)]
        struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
        const uint KEYEVENTF_KEYUP = 2, KEYEVENTF_EXTENDEDKEY = 1;

        static INPUT Tus(Keys k, bool birak)
        {
            uint bayrak = birak ? KEYEVENTF_KEYUP : 0;
            if (k == Keys.Right || k == Keys.Left || k == Keys.End || k == Keys.Home) bayrak |= KEYEVENTF_EXTENDEDKEY;
            return new INPUT { type = 1, u = new BIRLIK { ki = new KEYBDINPUT { wVk = (ushort)k, dwFlags = bayrak } } };
        }

        /// <summary>Ctrl+harf (ör. Ctrl+C) gönderir.</summary>
        public static void CtrlIle(Keys harf)
        {
            var g = new[] { Tus(Keys.ControlKey, false), Tus(harf, false), Tus(harf, true), Tus(Keys.ControlKey, true) };
            uint n = SendInput((uint)g.Length, g, Marshal.SizeOf(typeof(INPUT)));
            if (n != g.Length) Gunluk.Yaz("SendInput " + n + "/" + g.Length + " hata " + Marshal.GetLastWin32Error() + " boyut " + Marshal.SizeOf(typeof(INPUT)));
        }

        public static void Bas(Keys k)
        {
            var g = new[] { Tus(k, false), Tus(k, true) };
            SendInput((uint)g.Length, g, Marshal.SizeOf(typeof(INPUT)));
        }

        /// <summary>Kullanıcı kısayolun tuşlarını hâlâ basılı tutuyor mu?</summary>
        public static bool DegistiriciBasili()
        {
            foreach (var vk in new[] { 0x10, 0x11, 0x12, 0x5B, 0x5C }) // Shift, Ctrl, Alt, Win sol/sağ
                if ((GetAsyncKeyState(vk) & 0x8000) != 0) return true;
            return false;
        }
    }
}
