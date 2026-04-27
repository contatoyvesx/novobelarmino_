import "./loadEnv";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import { registrarRotasDeAgenda } from "./schedule";
import { registrarRotasAdmin } from "./admin";
import { sql } from "./supabase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // =========================
  // MIDDLEWARES
  // =========================
  app.use(express.json());

  // =========================
  // HEALTHCHECK
  // =========================
  app.get("/api/health", async (_req, res) => {
    try {
      await sql`select 1`;

      res.json({ status: "ok", db: "connected" });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        db: "disconnected",
        message: error?.message ?? "Erro ao conectar no banco",
      });
    }
  });

  // =========================
  // ROTAS DE API
  // =========================
  registrarRotasDeAgenda(app);
  registrarRotasAdmin(app);

  // =========================
  // FRONTEND (SPA)
  // =========================
  const finalStaticPath = fs.existsSync(path.resolve(__dirname, "..", "frontend"))
    ? path.resolve(__dirname, "..", "frontend")
    : path.resolve(__dirname, "..", "dist", "frontend");

  if (fs.existsSync(finalStaticPath)) {
    app.use(express.static(finalStaticPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(finalStaticPath, "index.html"));
    });
  }

  // =========================
  // START SERVER
  // =========================
  const port = Number(process.env.PORT) || 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});
