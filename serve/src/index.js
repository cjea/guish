init();

function init() {
  setTitle("the title");
  setDescription("the description");
  setCommand(
    `curl http://httpbin.org/post -H content-type:\\ application/json`
  );
  setFlag_Flag1(`--data`);
  setFlag1(`'{"Hello": "world"}'`);

  /**
   * TODO: clicking the button once triggers two POSTs.
   */
  getSave().addEventListener("click", handleSave, false);
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

const httpPostBuffer = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { cmd: "" },
};

function setPostBody(body) {
  httpPostBuffer.body = body;
  return httpPostBuffer;
}

function isEnter(code) {
  return code === "Enter";
}

function serverUrl() {
  return "http://localhost:3000";
}

function getSave() {
  return document.getElementById("save");
}

function getForm() {
  return document.getElementById("cmdForm");
}

function dispatchSubmitForm() {
  const submitOptions = { bubbles: true, cancelable: true };
  const submitEvent = new Event("submit", submitOptions);

  getForm().dispatchEvent(submitEvent);
}

function getTitle() {
  return document.getElementById("title");
}

function readTitle() {
  return getTitle().value;
}

function setTitle(str) {
  getTitle().value = str;
}

function getDescription() {
  return document.getElementById("description");
}

function readDescription() {
  return getDescription().value;
}

function setDescription(str) {
  getDescription().value = str;
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

function allFlags() {
  return {
    [readFlag_Flag1().trim()]: readFlag1().trim(),
  };
}

function getOutput() {
  return document.getElementById("output");
}

function setOutput(innerText) {
  getOutput().innerText = innerText;
}

function formatCommandAndFlags() {
  let ret = [readCommand()];
  for (const [key, val] of Object.entries(allFlags())) {
    ret.push(key);
    ret.push(val);
  }

  return ret.join(" ");
}

function setRunRequestBuffer() {
  return setPostBody(
    JSON.stringify({
      title: readTitle(),
      description: readDescription(),
      cmd: formatCommandAndFlags(),
    })
  );
}

function setSaveBuffer() {
  return setPostBody(
    JSON.stringify({
      title: readTitle(),
      description: readDescription(),
      cmd: readCommand(),
      flags: allFlags(),
    })
  );
}

function handleSave(evt) {
  evt.preventDefault();
  return save();
}

function save() {
  return fetch(serverUrl() + "/save", setSaveBuffer());
}

function loadAll() {
  return fetch(serverUrl() + "/load");
}

function issueRunRequestHttp() {
  return fetch(serverUrl(), setRunRequestBuffer());
}
