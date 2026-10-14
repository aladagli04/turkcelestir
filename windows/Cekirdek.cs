// Eklentinin düzeltme kodunu (eklenti/lib/*.js) olduğu gibi Jint JavaScript motorunda çalıştırır.
// Böylece Chrome eklentisi ve Windows aracı tek bir kodu paylaşır.
using System;
using System.IO;
using System.Text;
using Jint;

namespace Turkcelestir
{
    public sealed class Cekirdek
    {
        public Engine Motor { get; }

        public Cekirdek()
        {
            Motor = new Engine(o => o.LimitRecursion(512));
            Motor.Execute(Kaynak("deasciifier.js"), "deasciifier.js");
            Motor.Execute(Kaynak("turkce.js"), "turkce.js");
        }

        static string Kaynak(string ad)
        {
            using (var s = typeof(Cekirdek).Assembly.GetManifestResourceStream(ad))
            {
                if (s == null) throw new InvalidOperationException("Gömülü dosya yok: " + ad);
                using (var r = new StreamReader(s, Encoding.UTF8, true)) return r.ReadToEnd().TrimStart('﻿');
            }
        }

        /// <summary>mod: "karakter" ya da "tam". Windows satır sonları (\r\n) korunur.</summary>
        public string Duzelt(string metin, string mod)
        {
            if (string.IsNullOrEmpty(metin)) return metin;
            bool crlf = metin.Contains("\r\n");
            Motor.SetValue("__metin", metin.Replace("\r\n", "\n"));
            Motor.SetValue("__mod", mod);
            var sonuc = Motor.Evaluate("Turkce.duzelt(__metin, 0, __metin.length, __mod)").AsString();
            return crlf ? sonuc.Replace("\n", "\r\n") : sonuc;
        }
    }
}
