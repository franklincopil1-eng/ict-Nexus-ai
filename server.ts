import express from "express";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import fs from 'fs';

async function startServer() {
  console.time("Server Startup");
  const app = express();
  const PORT = 3000;

  // Load Firebase config (needed for both client and server)
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

  // Lazy load Firebase Admin helper
  let db: any = null;
  let FieldValue: any = null;

  async function getFirestore() {
    if (db) return { db, FieldValue };
    
    console.time("Firebase Admin Lazy Init");
    const { initializeApp, getApps } = await import('firebase-admin/app');
    const { getFirestore: getFS, FieldValue: FV } = await import('firebase-admin/firestore');
    FieldValue = FV;

    const apps = getApps();
    let adminApp;
    console.log(`[FIREBASE] Initializing with Project: ${firebaseConfig.projectId}, Database: ${firebaseConfig.firestoreDatabaseId}`);
    
    if (!apps.length) {
      try {
        // Prioritize the provisioned project ID from the config
        if (firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
          adminApp = initializeApp({
            projectId: firebaseConfig.projectId,
          });
          console.log(`[FIREBASE] App initialized with provisioned project: ${firebaseConfig.projectId}`);
        } else {
          // Fallback to default credentials if no valid config
          adminApp = initializeApp();
          console.log("[FIREBASE] App initialized with default credentials");
        }
      } catch (e: any) {
        console.error("[FIREBASE] Initialization failed:", e.message);
        throw e;
      }
    } else {
      adminApp = apps[0];
      console.log("[FIREBASE] Using existing app");
    }
    
    try {
      // Use the specific database ID if provided, fallback to default if it fails
      const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
      db = getFS(adminApp, dbId);
      console.log(`[FIREBASE] Firestore instance created for database: ${dbId}`);
    } catch (e: any) {
      console.error("[FIREBASE] Firestore instance error:", e.message);
      // Try fallback to default database if specific one fails
      try {
        console.log("[FIREBASE] Attempting fallback to (default) database");
        db = getFS(adminApp);
        console.log("[FIREBASE] Fallback Firestore instance created");
      } catch (fallbackErr: any) {
        console.error("[FIREBASE] Fallback failed:", fallbackErr.message);
        throw fallbackErr;
      }
    }
    console.timeEnd("Firebase Admin Lazy Init");
    return { db, FieldValue };
  }

  // Telegram Alert Helper
  async function sendTelegramAlert(message: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || token === "YOUR_BOT_TOKEN") {
      console.warn("Telegram configuration missing. Skipping alert.");
      return;
    }

    // Ensure fetch is available (Node 18+)
    if (typeof fetch === 'undefined') {
      console.error("Global fetch is not available. Please use Node.js 18 or higher.");
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });
      const data = await response.json();
      if (!data.ok) {
        console.error("Telegram API error:", data.description);
      }
    } catch (error) {
      console.error("Failed to send Telegram alert:", error);
    }
  }

  app.use(cors());
  app.use(bodyParser.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint for frontend to trigger Telegram alerts (e.g., after AI analysis)
  app.post("/api/telegram/alert", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message required" });
      await sendTelegramAlert(message);
      res.json({ status: "alert_sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send alert" });
    }
  });

  // Webhook endpoint for TradingView signals
  app.post("/api/webhook/signal", async (req, res) => {
    try {
      const signalData = req.body;
      console.log("Received signal:", signalData);
      
      // Validation
      if (!signalData.symbol || !signalData.signal_type) {
        return res.status(400).json({ error: "Invalid signal data" });
      }

      // Lazy load Firestore
      let { db: firestore, FieldValue: FV } = await getFirestore();

      // Save to Firestore with a retry mechanism for database ID issues
      let docRef;
      try {
        docRef = await firestore.collection("signals").add({
          symbol: signalData.symbol,
          timeframe: signalData.timeframe || "1h",
          signal_type: signalData.signal_type,
          confidence: signalData.confidence || 70,
          raw_data: signalData,
          source: signalData.source || "External_Webhook",
          created_at: FV.serverTimestamp()
        });
      } catch (writeErr: any) {
        console.error("[WEBHOOK] Initial write failed:", writeErr.message);
        
        // If it's a permission or database error, try the default database
        if (writeErr.message.includes('PERMISSION_DENIED') || writeErr.message.includes('NOT_FOUND')) {
          console.log("[WEBHOOK] Attempting fallback to default database for write...");
          const { getFirestore: getFS } = await import('firebase-admin/firestore');
          const { getApps } = await import('firebase-admin/app');
          const adminApp = getApps()[0];
          const defaultDb = getFS(adminApp); // No database ID = (default)
          
          docRef = await defaultDb.collection("signals").add({
            symbol: signalData.symbol,
            timeframe: signalData.timeframe || "1h",
            signal_type: signalData.signal_type,
            confidence: signalData.confidence || 70,
            raw_data: signalData,
            source: signalData.source || "External_Webhook",
            created_at: FV.serverTimestamp()
          });
          console.log("[WEBHOOK] Fallback write successful");
        } else {
          throw writeErr;
        }
      }

      console.log(`[WEBHOOK] Signal saved with ID: ${docRef.id}`);

      // Send Telegram Alert for new signal
      const alertMsg = `🚀 <b>NEW ICT SIGNAL DETECTED</b>\n\n` +
                       `📈 <b>Symbol:</b> ${signalData.symbol}\n` +
                       `⏱ <b>Timeframe:</b> ${signalData.timeframe || "1h"}\n` +
                       `⚡️ <b>Type:</b> ${signalData.signal_type}\n` +
                       `🎯 <b>Confidence:</b> ${signalData.confidence || 70}%\n` +
                       `🌐 <b>Source:</b> ${signalData.source || "External"}\n\n` +
                       `<i>AI Analysis in progress...</i>`;
      await sendTelegramAlert(alertMsg);
      
      res.json({ status: "signal_received", id: docRef.id });
    } catch (error: any) {
      console.error("Webhook error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ 
        error: "Internal server error", 
        details: error.message,
        code: error.code 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.time("Vite Init");
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.timeEnd("Vite Init");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 SERVER READY`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🛠  Mode: ${process.env.NODE_ENV || 'development'}`);
    console.timeEnd("Server Startup");
    console.log("------------------------------------------\n");
  });
}

startServer();
