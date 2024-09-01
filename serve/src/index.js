let STORE = {};
init();

function init() {
  loadAllJson().then((res) => {
    STORE = res.sort((a, b) => a.title.localeCompare(b.title));
    /**
     * TODO: clicking the button once triggers two POSTs.
     */
    getSave().addEventListener("click", handleSave, false);
    getForm().addEventListener("submit", handleSubmitForm);
    getForm().addEventListener("keydown", dispatchSubmitOnEnter);
    getAddFlag().addEventListener("click", renderNewEmptyFlag);

    setBrowse(
      "<div>" +
        STORE.map(({ title }) => {
          return `<li><a onclick="browseTitle(\`${title}\`)">${title}</a></li>`;
        }).join("\n") +
        "</div>"
    );
  });
}

function browseTitle(title) {
  const el = STORE.find((s) => s.title === title);
  if (!el) {
    alert("bad browse: " + title);
    return;
  }

  const { description, cmd, flags } = el;
  setTitle(title);
  setDescription(description);
  setCommand(cmd);
  renderFlags(flags);
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

function renderNewEmptyFlag(evt) {
  evt.preventDefault();
  const flag = { name: "TODO", val: "TODO" };
  renderFlags(addFlag(flag));
}

function addFlag(flag) {
  const flags = readFlags();
  flags.push(flag);

  return flags;
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

function getBrowse() {
  return document.getElementById("toc");
}

function setBrowse(html) {
  document.getElementById("toc").innerHTML = html;
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

function getAddFlag() {
  return document.getElementById("addFlag");
}

function readFlags() {
  const names = document.querySelectorAll("#cmdLineArgs .name");
  const values = document.querySelectorAll("#cmdLineArgs .val");
  const ret = [];
  for (let i = 0; i < names.length; ++i) {
    ret.push({
      name: names[i].value,
      val: values[i].value,
    });
  }

  return ret;
}

function dequote(str) {
  return str.replaceAll('"', "&quot;");
}

function encodeFlagHtml({ name, val }) {
  return `
<div class="cmdLineArgsRow">
  <input type="text" class="name" value="${dequote(name)}" />
  <input type="text" class="val" value="${dequote(val)}" />
  <button onclick="removeRow(event)">X</button>
</div>
  `;
}

function removeRow(evt) {
  evt.target.closest(".cmdLineArgsRow").remove();
}

function renderFlags(flags) {
  const node = document.getElementById("cmdLineArgs");
  node.innerHTML = flags.map(encodeFlagHtml).join("\n");
}

function getOutput() {
  return document.getElementById("output");
}

function setOutput(innerText) {
  getOutput().innerText = innerText;
}

function formatCommandAndFlags() {
  let ret = [readCommand()];
  for (const { name, val } of readFlags()) {
    ret.push(name);
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
      flags: readFlags(),
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

function loadAllJson() {
  return fetch(serverUrl() + "/load").then((res) => res.json());
}

function issueRunRequestHttp() {
  return fetch(serverUrl(), setRunRequestBuffer());
}
