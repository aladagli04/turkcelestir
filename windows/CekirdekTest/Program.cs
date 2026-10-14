// Eklentinin test/test.js dosyasını Jint içinde çalıştırır: dotnet run --project windows/CekirdekTest
using System;
using System.IO;
using System.Text;
using Jint;
using Jint.Native;

class Program
{
    static int Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        var c = new Turkcelestir.Cekirdek();
        var js = c.Motor;
        int cikis = 0;
        js.SetValue("require", new Func<string, JsValue>(_ => js.GetValue("Turkce")));
        js.SetValue("__yaz", new Action<string>(s => Console.WriteLine(s)));
        js.SetValue("__cik", new Action<int>(k => cikis = k));
        js.Execute("var console = { log: function (s) { __yaz(String(s)); } };" +
                   "var process = { exit: function (k) { __cik(k); } };");
        var yol = args.Length > 0 ? args[0] : Path.Combine("..", "..", "test", "test.js");
        js.Execute(File.ReadAllText(yol, Encoding.UTF8), "test.js");

        Console.WriteLine("Örnek: " + c.Duzelt("yarin aksam size ugrayacagim,\r\ncok selam soyle", "tam").Replace("\r\n", "⏎"));
        return cikis;
    }
}
