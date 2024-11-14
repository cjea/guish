const fs = require("node:fs");
const path = require("path");
const express = require("express");
const { promisify } = require("util");

const exec = promisify(require("child_process").exec);

const app = express().use(express.json());
const port = 3000;

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/src/index.js", async (req, res) => {
  res.sendFile(path.join(__dirname, "src/index.js"));
});

const STORE_PATH = path.join(__dirname, "store");
if (!fs.existsSync(STORE_PATH)) {
  console.log("Initializing store directory since none exists.");
  fs.mkdirSync(STORE_PATH);
  console.log("Initialized store directory at " + STORE_PATH);
}

app.get("/load", async (req, res) => {
  const { readdirSync, readFileSync } = fs;
  const data = readdirSync(STORE_PATH)
    .map((rel) => path.join(STORE_PATH, rel))
    .map((fd) => JSON.parse(readFileSync(fd)));

  return res.status(200).send(data);
});

app.post("/save", async (req, res) => {
  const { title, description, cmd, flags } = req.body;
  if (!fs.existsSync(STORE_PATH)) fs.mkdirSync(STORE_PATH);

  fs.writeFileSync(
    titlePath(STORE_PATH, title),
    JSON.stringify({ title, description, cmd, flags })
  );
  res.status(201).send({
    level: "success",
    title,
    description,
    cmd,
  });
});

app.post("/trash", async (req, res) => {
  const { title } = req.body;
  const fd = titlePath(STORE_PATH, title);
  if (!fs.existsSync(fd)) return fail(res, 404, `Nothing to delete.`);

  fs.rmSync(fd);
  res.status(201).send({ level: "success", title });
});

app.post("/", async (req, res) => {
  const { title, description, cmd } = req.body;
  try {
    return exec(cmd)
      .then(({ stdout }) =>
        res.json({ title, description, cmd, output: stdout.trim() })
      )
      .catch((err) => fail(res, 400, `Failed to execute: ${err.message}`));
  } catch (err) {
    return fail(res, 400, `Failed to execute: ${err.message}`);
  }
});

function titlePath(basePath, title) {
  return path.join(basePath, title + ".json");
}

function fail(res, status, body) {
  console.error({ level: "error", body });
  return res.status(status).json({ level: "error", output: body });
}

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
