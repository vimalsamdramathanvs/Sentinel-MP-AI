import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Lazy-initialized Gemini API client
  let genAIClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    if (!genAIClient) {
      const key = process.env.GEMINI_API_KEY;
      if (key) {
        genAIClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      }
    }
    return genAIClient;
  }

  // Gemini AI endpoint with resilient multi-model fallback
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getGenAI();
      if (!ai) {
        return res.json({ text: null, fallback: true, reason: "api_key_unconfigured" });
      }

      // Try primary model (gemini-3.8-flash), fallback to gemini-3.1-flash-lite and gemini-flash-latest on demand/quota spikes
      const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
      let lastErr: any = null;
      let generatedText: string | null = null;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt || "Hello",
          });
          generatedText = response.text || "";
          break;
        } catch (modelErr: any) {
          lastErr = modelErr;
          console.warn(`Model ${model} request failed, attempting fallback:`, modelErr?.message || modelErr);
        }
      }

      if (generatedText !== null) {
        return res.json({ text: generatedText });
      }

      // Return clean 200 fallback so client deterministic engine activates without 429/500 console errors
      return res.json({
        text: null,
        fallback: true,
        quotaExceeded:
          lastErr?.status === 429 ||
          lastErr?.message?.includes("quota") ||
          lastErr?.message?.includes("resource_exhausted"),
      });
    } catch (err: any) {
      console.warn("AI generation error:", err?.message || err);
      res.json({
        text: null,
        fallback: true,
        quotaExceeded: err?.message?.includes("quota") || err?.message?.includes("resource_exhausted"),
      });
    }
  });

  // Vite middleware for development vs static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true, hmr: false, watch: null },
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
