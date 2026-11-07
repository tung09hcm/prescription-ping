import express from "express";
import axios from "axios";
import cors from "cors";

import { config } from "./config/env.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  return res.status(200).send("OK");
});

// Prescription API
app.use("/api/v1/prescriptions", prescriptionRoutes);

// Error handler
app.use(errorMiddleware);

// Start server
const server = app.listen(config.port, () => {
  console.log("=================================");
  console.log("Prescription Scanner is running");
  console.log("Port:", config.port);
  console.log("Running mode:", config.isProduction ? "production" : "local");
  console.log("=================================");

  startSelfPing();
});

// Self ping
function startSelfPing() {
  const { enabled, publicOrigin, interval } = config.selfPing;

  if (!config.isProduction || !enabled || !publicOrigin) {
    console.log("Self ping disabled");
    return;
  }

  console.log("Self ping enabled");
  console.log("Interval:", interval / 1000, "seconds");

  let isPinging = false;

  const targets = [
    {
      name: "Backend",
      url: `${publicOrigin}/api/health`,
    },
    {
      name: "Frontend",
      url: "https://medicine-frontend-1-0.onrender.com/drugs-info",
    },
  ];

  const ping = async () => {
    if (isPinging) return;

    isPinging = true;

    try {
      const results = await Promise.allSettled(
        targets.map(async ({ name, url }) => {
          const response = await axios.get(url, {
            timeout: 10000,
          });

          console.log(
            `[${new Date().toISOString()}] ${name} ping success:`,
            response.status,
          );
        }),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `[${new Date().toISOString()}] ${targets[index].name} ping failed:`,
            result.reason.message,
          );
        }
      });
    } finally {
      isPinging = false;
    }
  };

  const timer = setInterval(ping, interval);

  timer.unref();
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown");
    process.exit(1);
  }, 25000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
