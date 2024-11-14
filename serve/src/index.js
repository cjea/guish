let STORE = {};
let _GUISH_QUERY = "";
init();

function init() {
  refreshBrowse();
  /**
   * TODO: clicking the button once triggers `handleSave` twice.
   */
  getSave().addEventListener("click", handleSave, false);
  getQuery().addEventListener("keyup", handleUpdateQuery);
  getTitle().addEventListener("keydown", handleSaveOnEnter, false);
  getForm().addEventListener("submit", handleSubmitRunRequest);
  getForm().addEventListener("keydown", handleSubmitOnEnter);
  getAddFlag().addEventListener("click", renderNewEmptyFlag);
  getTrash().addEventListener("click", handleTrashCommand);
}

async function refreshBrowse() {
  const res = await loadAllJson();
  STORE = res.sort(sortByTitle);
  renderBrowse();

  return res;
}

function renderBrowse() {
  function toLi({ title }) {
    return `<li class="toc-item"><a onclick="browseTitle(\`${title}\`)">${title}</a></li>`;
  }
  const lis = STORE.filter(fuzzyMatchesGlobalSearch).map(toLi);
  setBrowse("<div>" + lis.join("\n") + "</div>");
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
  /** Hitting enter to run a command only works if a textbox is in focus. */
  getCommand().focus();
}

function handleSubmitRunRequest(evt) {
  evt.preventDefault();
  issueRunRequestHttp()
    .then((res) => res.json())
    .then((res) => setOutput(res.output))
    .catch((err) => alert("ERROR: " + err));
}

function handleSubmitOnEnter(evt) {
  if (isEnter(evt.code)) {
    evt.preventDefault();
    dispatchSubmitForm();
  }
}

function handleSaveOnEnter(evt) {
  if (isEnter(evt.code)) return handleSave(evt);
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

function handleTrashCommand(evt) {
  evt.preventDefault();
  issueTrashCommandHttp()
    .then((res) => res.json())
    .then((body) => setOutput(body.output))
    .then(refreshBrowse)
    .catch((err) => alert("ERROR: " + err));
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

function setPostBodyJson(body) {
  return setPostBody(JSON.stringify(body));
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
  getBrowse().innerHTML = html;
}

function getSave() {
  return document.getElementById("save");
}

function getQuery() {
  return document.getElementById("query");
}

function readQuery() {
  return getQuery().value;
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

function getTrash() {
  return document.getElementById("trash");
}

function readFlags() {
  const names = document.querySelectorAll("#cmdLineArgs .name");
  const values = document.querySelectorAll("#cmdLineArgs .val");
  const ret = [];
  for (let i = 0; i < names.length; ++i) {
    const { value: name } = names[i];
    const { value: val } = values[i];
    ret.push({ name, val });
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
  return setPostBodyJson({
    title: readTitle(),
    description: readDescription(),
    cmd: formatCommandAndFlags(),
  });
}

function setSaveBuffer() {
  return setPostBodyJson({
    title: readTitle(),
    description: readDescription(),
    cmd: readCommand(),
    flags: readFlags(),
  });
}

function setTrashBuffer() {
  return setPostBodyJson({ title: readTitle() });
}

function handleSave(evt) {
  evt.preventDefault();
  issueSaveCommandHttp().then(refreshBrowse);
}

function handleUpdateQuery(evt) {
  _GUISH_QUERY = readQuery();
  renderBrowse();
}

async function loadAllJson() {
  try {
    const resp = await fetch(serverUrl() + "/load");
    return resp.json();
  } catch (err) {
    alert("failed to load: " + err);
  }
}

function issueRunRequestHttp() {
  return fetch(serverUrl() + "/", setRunRequestBuffer());
}

function issueSaveCommandHttp() {
  return fetch(serverUrl() + "/save", setSaveBuffer());
}

function issueTrashCommandHttp() {
  return fetch(serverUrl() + "/trash", setTrashBuffer());
}

function sortByTitle(a, b) {
  return a.title.localeCompare(b.title);
}

function fuzzyMatchesGlobalSearch({ title }) {
  let globalSearch = readQuery();
  return fuzzyMatch(title, globalSearch);
}

function fuzzyMatch(str, query) {
  const { length: queryLength } = query;
  const { length: strLength } = str;
  let pos, numMatches;
  for (
    pos = 0, numMatches = 0;
    pos < strLength && numMatches < queryLength;
    ++pos
  ) {
    const match = str[pos].toLowerCase() === query[numMatches].toLowerCase();
    if (match) ++numMatches;
  }

  return numMatches === queryLength;
}
