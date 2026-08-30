using System;
using System.Diagnostics;
using System.IO;

namespace OrderClient
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.Title = "Order Flow Launcher";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("==================================================");
            Console.WriteLine("          Order Flow System Starter               ");
            Console.WriteLine("==================================================");
            Console.ResetColor();
            Console.WriteLine();

            // Locate solution directory
            string baseDir = AppContext.BaseDirectory;
            string solutionDir = "";
            
            // Move up to find the folder containing both Order and OrderClient
            var dir = new DirectoryInfo(baseDir);
            while (dir != null)
            {
                if (Directory.Exists(Path.Combine(dir.FullName, "Order")) && 
                    Directory.Exists(Path.Combine(dir.FullName, "OrderClient")))
                {
                    solutionDir = dir.FullName;
                    break;
                }
                dir = dir.Parent;
            }

            if (string.IsNullOrEmpty(solutionDir))
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Error: Could not locate the solution root directory containing 'Order' and 'OrderClient'.");
                Console.ResetColor();
                Console.ReadLine();
                return;
            }

            string backendPath = Path.Combine(solutionDir, "Order", "Order.csproj");
            string frontendDir = Path.Combine(solutionDir, "OrderClient");

            Console.WriteLine($"Solution Directory found: {solutionDir}");
            Console.WriteLine();

            // 1. Launch Backend API
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("1. Spawning Backend API (ASP.NET Core)...");
            Console.ResetColor();
            
            try
            {
                var backendStartInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/k dotnet run --project \"{backendPath}\"",
                    WorkingDirectory = Path.Combine(solutionDir, "Order"),
                    UseShellExecute = true
                };
                Process.Start(backendStartInfo);
                Console.WriteLine("✔ Backend console window spawned.");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Failed to start Backend: {ex.Message}");
                Console.ResetColor();
            }

            Console.WriteLine();

            // 2. Launch Frontend Dev Server
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("2. Spawning Frontend Dev Server (Vite)...");
            Console.ResetColor();
            
            try
            {
                var frontendStartInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/k npm run dev",
                    WorkingDirectory = frontendDir,
                    UseShellExecute = true
                };
                Process.Start(frontendStartInfo);
                Console.WriteLine("✔ Frontend console window spawned.");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"Failed to start Frontend: {ex.Message}");
                Console.ResetColor();
            }

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine();
            Console.WriteLine("==================================================");
            Console.WriteLine("🚀 Both projects are starting up in separate windows!");
            Console.WriteLine("==================================================");
            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine("- Backend Swagger URL:  https://localhost:7073/");
            Console.WriteLine("- Frontend Client URL:  http://localhost:5173/");
            Console.WriteLine();
            Console.WriteLine("Keep this window open to maintain Visual Studio debug state.");
            Console.WriteLine("Press any key to close this launcher...");
            Console.ReadKey();
        }
    }
}
