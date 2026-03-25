import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

// Load Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Telegram Alert Helper
async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === "YOUR_BOT_TOKEN") {
    console.warn("Telegram configuration missing. Skipping alert.");
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

async function startServer() {
  const app = express();
  const PORT = 3000;

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

      // Save to Firestore
      const docRef = await addDoc(collection(db, "signals"), {
        symbol: signalData.symbol,
        timeframe: signalData.timeframe || "1h",
        signal_type: signalData.signal_type,
        confidence: signalData.confidence || 70,
        raw_data: signalData,
        source: signalData.source || "External_Webhook",
        created_at: serverTimestamp()
      });

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
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
