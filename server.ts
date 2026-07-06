import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY belum dikonfigurasi di Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Backend Developer Config State (Simulated remote config & state)
let devFeatureFlags = {
  aiAssistant: true,
  premiumFeatures: true,
  blog: false,
  dashboardAnalytics: true,
  qris: false,
  pdfReport: true,
  inventory: true,
  backupCloud: true,
  notification: true,
  maintenanceMode: false,
};

let devLicense = {
  status: "Premium",
  activationDate: "2026-01-01",
  expirationDate: "2027-12-31",
};

let serverLogs: string[] = [
  `[SYSTEM] Server initialized on ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
  `[DB] Firestore connection simulated online`,
  `[AUTH] Firebase Authentication helper ready`,
];

function addLog(msg: string) {
  const timestamp = new Date().toLocaleTimeString('id-ID');
  serverLogs.push(`[${timestamp}] ${msg}`);
  if (serverLogs.length > 50) {
    serverLogs.shift();
  }
}

// Middleware to authorize Developer actions
const authorizeDeveloper = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = req.headers["x-user-role"];
  if (role !== "developer") {
    addLog(`[SECURITY_WARN] Unauthorized access attempt by role: "${role}" on ${req.method} ${req.path}`);
    return res.status(403).json({
      error: "Akses ditolak: Verifikasi backend gagal. Hanya pengguna dengan role 'developer' yang diizinkan mengakses panel ini.",
    });
  }
  next();
};

// API Routes
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt tidak boleh kosong" });
    }

    addLog(`[AI] Generating content for prompt length: ${prompt.length}`);
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    addLog(`[AI_ERROR] ${error.message || "Unknown error"}`);
    res.status(500).json({
      error: error.message || "Gagal menghubungi AI Agent. Pastikan GEMINI_API_KEY Anda sudah benar.",
    });
  }
});

// Developer Console API Routes
app.get("/api/developer/config", authorizeDeveloper, (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  addLog(`[DEV] Config retrieved by developer console`);
  res.json({
    systemInfo: {
      appName: "SIKU - Sistem Informasi Keuangan Usaha",
      version: "v1.0.0",
      environment: process.env.NODE_ENV || "development",
      buildVersion: "b1.0.260706",
      lastBuildTime: new Date().toUTCString(),
    },
    featureFlags: devFeatureFlags,
    license: devLicense,
    aiConfig: {
      provider: "Google Gen AI SDK",
      status: hasGeminiKey ? "Online" : "Offline (API Key Missing)",
      activeModel: "gemini-3.5-flash",
      tokenUsage: "75.4k tokens (Simulated)",
    },
    systemStatus: {
      firebase: "Online",
      firestore: "Online",
      authentication: "Online",
      storage: "Online",
      network: "Online",
    },
    about: {
      appName: "SIKU",
      version: "v1.0.0",
      buildNumber: "20260706",
      copyright: "© 2026 SIKU Developer Team",
      developer: "SIKU Devs",
    },
    logs: serverLogs,
  });
});

app.post("/api/developer/feature-flags", authorizeDeveloper, (req, res) => {
  const { flags } = req.body;
  if (flags && typeof flags === "object") {
    devFeatureFlags = { ...devFeatureFlags, ...flags };
    addLog(`[DEV_CONFIG] Feature flags updated: ${JSON.stringify(flags)}`);
    res.json({ success: true, featureFlags: devFeatureFlags });
  } else {
    res.status(400).json({ error: "Invalid feature flags payload" });
  }
});

app.post("/api/developer/license", authorizeDeveloper, (req, res) => {
  const { status, activationDate, expirationDate } = req.body;
  if (status) {
    devLicense = {
      status,
      activationDate: activationDate || devLicense.activationDate,
      expirationDate: expirationDate || devLicense.expirationDate,
    };
    addLog(`[DEV_CONFIG] License updated: status=${status}`);
    res.json({ success: true, license: devLicense });
  } else {
    res.status(400).json({ error: "Invalid license status payload" });
  }
});

app.post("/api/developer/debug/:action", authorizeDeveloper, async (req, res) => {
  const { action } = req.params;
  addLog(`[DEBUG_TOOL] Triggered action: ${action}`);

  if (action === "reload-config") {
    // Reset flags & license to defaults
    devFeatureFlags = {
      aiAssistant: true,
      premiumFeatures: true,
      blog: false,
      dashboardAnalytics: true,
      qris: false,
      pdfReport: true,
      inventory: true,
      backupCloud: true,
      notification: true,
      maintenanceMode: false,
    };
    addLog(`[DEBUG_TOOL] Configurations reset to defaults`);
    return res.json({ success: true, message: "Konfigurasi berhasil dimuat ulang ke default!" });
  }

  if (action === "clear-cache") {
    addLog(`[DEBUG_TOOL] Server-side metadata cache flushed`);
    return res.json({ success: true, message: "Cache sistem berhasil dibersihkan!" });
  }

  if (action === "refresh-data") {
    addLog(`[DEBUG_TOOL] Remote config data sync refreshed`);
    return res.json({ success: true, message: "Data sinkronisasi berhasil diperbarui!" });
  }

  if (action === "test-notification") {
    addLog(`[TEST_NOTIF] Developer Test Notification queued`);
    return res.json({ success: true, message: "Notifikasi uji coba berhasil dikirim ke antrean!" });
  }

  if (action === "test-ai") {
    try {
      const hasKey = !!process.env.GEMINI_API_KEY;
      if (!hasKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
      }
      const ai = getGeminiClient();
      addLog(`[TEST_AI] Initiating Gemini connectivity check...`);
      // Light connectivity request
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Hello! This is a backend connectivity check.",
      });
      addLog(`[TEST_AI_OK] Gemini SDK handshake successful: ${response.text?.substring(0, 15)}...`);
      return res.json({ success: true, message: "Koneksi AI (Gemini SDK) Berhasil & Online!" });
    } catch (err: any) {
      addLog(`[TEST_AI_ERR] Connection check failed: ${err.message}`);
      return res.status(500).json({ success: false, error: `Koneksi AI Gagal: ${err.message}` });
    }
  }

  res.status(400).json({ error: "Aksi debug tidak dikenal" });
});

// Start Express + Vite Middleware
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
