init();

function init() {
  setCommand(
    `curl http://httpbin.org/post -H content-type:\\ application/json`
  );
  setFlag_Flag1(`--data`);
  setFlag1(`'{"Hello": "world"}'`);

  getForm().addEventListener("submit", handleSubmitForm);
  getForm().addEventListener("keydown", dispatchSubmitOnEnter);
}

function handleSubmitForm(evt) {
  evt.preventDefault();
  issueRunRequestHttp()
    .then((res) => res.json())
    .then((res) => setOutput(res.output))
    .catch((err) => alert("ERROR: " + err));
}

function dispatchSubmitOnEnter(evt) {
  if (isEnter(evt.code)) {
    evt.preventDefault();
    dispatchSubmitForm();
  }
}

const runRequestBuffer = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { cmd: "" },
};

function setRunRequestBody(body) {
  runRequestBuffer.body = body;
  return runRequestBuffer;
}

function isEnter(code) {
  return code === "Enter";
}

function serverUrl() {
  return "http://localhost:3000";
}

function getForm() {
  return document.getElementById("cmdForm");
}

function dispatchSubmitForm() {
  const submitOptions = { bubbles: true, cancelable: true };
  const submitEvent = new Event("submit", submitOptions);

  getForm().dispatchEvent(submitEvent);
}

function getCommand() {
  return document.getElementById("cmd");
}

function readCommand() {
  return getCommand().value;
}

function setCommand(str) {
  getCommand().value = str;
}

function getFlag1() {
  return document.getElementById("flag1");
}

function readFlag1() {
  return getFlag1().value;
}

function setFlag1(str) {
  getFlag1().value = str;
}

function getFlag_Flag1() {
  return document.getElementById("flag_flag1");
}

function readFlag_Flag1() {
  return getFlag_Flag1().value;
}

function setFlag_Flag1(str) {
  getFlag_Flag1().value = str;
}

function getOutput() {
  return document.getElementById("output");
}

function setOutput(innerText) {
  getOutput().innerText = innerText;
}

function setRunRequestBuffer() {
  let cmd = readCommand();
  const flag1 = readFlag1().trim();
  if (flag1) {
    cmd += ` ${readFlag_Flag1()} ${flag1}`;
  }

  return setRunRequestBody(JSON.stringify({ cmd }));
}

function issueRunRequestHttp() {
  return fetch(serverUrl(), setRunRequestBuffer());
}
