const path = require("path");
const express = require("express");
const { promisify } = require("util");

const exec = promisify(require("child_process").exec);

const app = express().use(express.json());
const port = 3000;

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/", async (req, res) => {
  function fail(status, body) {
    console.error({ level: "error", body });
    return res.status(status).json({ level: "error", output: body });
  }

  const { cmd } = req.body;
  try {
    return exec(cmd)
      .then(({ stdout }) => res.json({ output: stdout.trim() }))
      .catch((err) => fail(400, `Failed to execute: ${err.message}`));
  } catch (err) {
    return fail(400, `Failed to execute: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
