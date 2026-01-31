const express = require("express");
const cors = require("cors");
require("dotenv").config();

const ingestionRoutes = require("./src/routes/ingestionRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

app.use("/api/ingest", ingestionRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ status: "Online", service: "AutoSense AI Backend" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Server Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    details: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`
  🚗 ========================================
  🚗 AutoSense AI Backend Active
  🚗 Port:    ${PORT}
  🚗 Client:  http://localhost:5173
  🚗 ========================================
  `);
});
