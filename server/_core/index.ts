import "dotenv/config";
import express from "express";
import multer from "multer";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createCorsMiddleware } from "./cors";
import { clearLegacySessionCookie } from "./cookies";
import { sdk } from "./sdk";
import { createReel } from "../db";
import { storagePut } from "../storage";

const reelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("video/"));
  },
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(createCorsMiddleware());
  app.use(clearLegacySessionCookie());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.post("/api/reels/upload", reelUpload.single("video"), async (req, res) => {
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Authentication required to publish a Reel" });
      return;
    }

    const file = req.file;
    const kind = req.body?.kind;
    if (!file) {
      res.status(400).json({ error: "A video file is required" });
      return;
    }
    if (kind !== "entertainment" && kind !== "study") {
      res.status(400).json({ error: "Choose entertainment or study for this Reel" });
      return;
    }

    try {
      const safeName = (file.originalname || "reel.mp4").replace(/[^a-zA-Z0-9._-]/g, "-");
      const stored = await storagePut(
        `reels/${user.id}/${Date.now()}-${safeName}`,
        file.buffer,
        file.mimetype,
      );
      const reel = await createReel({
        authorId: user.id,
        kind,
        storageKey: stored.key,
        mediaUrl: stored.url,
        contentType: file.mimetype,
        caption: typeof req.body?.caption === "string" ? req.body.caption.trim().slice(0, 500) : null,
        fileSize: file.size,
      });
      res.status(201).json({ reel });
    } catch (error) {
      console.error("[BLISS] Reel upload failed", error);
      res.status(500).json({ error: "Reel upload failed. Please try again." });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log("[api] server listening");
  });
}

startServer().catch(() => {
  console.error("[api] server failed to start");
});
