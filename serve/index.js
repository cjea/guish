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

app.get("/load", async (req, res) => {
  return res
    .status(200)
    .send(
      fs
        .readdirSync(STORE_PATH)
        .map((f) => JSON.parse(fs.readFileSync(path.join(STORE_PATH, f))))
    );
});

app.post("/save", async (req, res) => {
  const { title, description, cmd, flags } = req.body;
  if (!fs.existsSync(STORE_PATH)) fs.mkdirSync(STORE_PATH);

  fs.writeFileSync(
    path.join(STORE_PATH, title + ".json"),
    JSON.stringify({
      title,
      description,
      cmd,
      flags,
    })
  );
  res.status(201).send({
    level: "success",
    title,
    description,
    cmd,
  });
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

function fail(res, status, body) {
  console.error({ level: "error", body });
  return res.status(status).json({ level: "error", output: body });
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
