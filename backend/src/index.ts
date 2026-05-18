import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { portfolio } from "./data/portfolio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/portfolio", (_req, res) => {
  res.json(portfolio);
});

const frontendDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) res.status(404).json({ error: "Not found" });
  });
});

app.listen(PORT, () => {
  console.log(`Portfolio API running at http://localhost:${PORT}`);
});
