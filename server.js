const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Future backend/LLM routes can live under /api.
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "pomodoro-me" });
});

app.use(express.static(path.join(__dirname)));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Pomodoro app running on port ${PORT}`);
});
