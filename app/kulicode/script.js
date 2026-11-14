/* KuliCode landing page. No dependencies: everything on the page is a scripted
   animation. Sections:
   1. helpers and the cancellable runner
   2. tiny syntax highlighter
   3. command bar component
   4. shared lists
   5. sample files (one per command bar command)
   6. editor model and rendering
   7. window chrome (tree, tabs, toast, previews)
   8. command simulations
   9. boot */
"use strict";

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rand = (a, b) => a + Math.random() * (b - a);
  
  /* ---------- 1. runner ----------
     A run is a chain of awaited sleeps. Starting a new run or calling stop()
     makes the pending sleep of the old run reject, which unwinds it. */

  class Cancelled extends Error {}

  function createRunner() {
    let id = 0;
    return {
      run(fn) {
        const mine = ++id;
        const ctx = {
          sleep: (ms) => new Promise((resolve, reject) =>
            setTimeout(() => (mine === id ? resolve() : reject(new Cancelled())), ms)),
        };
        return fn(ctx).catch((e) => { if (!(e instanceof Cancelled)) console.error(e); });
      },
      stop() { id++; },
    };
  }

  /* ---------- 2. syntax highlighter ---------- */

  const KEYWORDS = new Set((
    "function const let var return if else for foreach while new class extends public private protected static " +
    "use namespace import from export default await async func package type struct interface go defer range " +
    "switch case break continue true false null nil this self echo throw try catch finally in of void " +
    "readonly then fi do done"
  ).split(" "));

  const GROUP_CLASS = {
    com: "tk-com", str: "tk-str", num: "tk-num", at: "tk-kw", prop: "tk-prop",
    head: "tk-kw", sel: "tk-type", varn: "tk-var",
  };

  const CODE_RULE = /(?<com>\/\/.*|\/\*.*?\*\/)|(?<str>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?<num>\b\d+(?:\.\d+)?\b)|(?<id>\$?[A-Za-z_]\w*)/g;
  const RULES = {
    js: CODE_RULE, ts: CODE_RULE, php: CODE_RULE, go: CODE_RULE,
    json: /(?<prop>"(?:[^"\\]|\\.)*"(?=\s*:))|(?<str>"(?:[^"\\]|\\.)*")|(?<num>-?\b\d+(?:\.\d+)?\b)|(?<id>[A-Za-z_]+)/g,
    css: /(?<com>\/\*.*?\*\/)|(?<str>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<at>@[\w-]+)|(?<num>#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|em|rem|vh|vw|%)?)|(?<prop>[a-z-]+(?=\s*:))|(?<varn>--[\w-]+)|(?<sel>[.#][A-Za-z_-][\w-]*)/g,
  };

  const classCache = new Map();

  /* Returns one CSS class name per character of `line`. */
  function classify(line, lang) {
    const key = lang + "\0" + line;
    const hit = classCache.get(key);
    if (hit) return hit;

    const cls = new Array(line.length).fill("");
    const paint = (from, to, c) => { for (let i = from; i < to; i++) cls[i] = c; };

    for (const m of line.matchAll(RULES[lang] || RULES.js)) {
      const start = m.index;
      const end = start + m[0].length;
      const g = m.groups;
      if (g.id !== undefined) {
        const w = g.id;
        let c = "";
        if (KEYWORDS.has(w)) c = "tk-kw";
        else if (lang === "json") c = "";
        else if (/^\s*\(/.test(line.slice(end))) c = "tk-fn";
        else if (w[0] === "$") c = "tk-var";
        else if (/^[A-Z]/.test(w)) c = "tk-type";
        if (c) paint(start, end, c);
        continue;
      }
      for (const name in GROUP_CLASS) {
        if (g[name] !== undefined) { paint(start, end, GROUP_CLASS[name]); break; }
      }
    }

    if (classCache.size > 3000) classCache.clear();
    classCache.set(key, cls);
    return cls;
  }

  /* HTML for one line. `marks` are {from, to, kind} on this line, `carets` are columns. */
  function lineHTML(text, lang, marks, carets) {
    const cls = classify(text, lang);
    const deco = new Array(text.length).fill("");
    for (const m of marks || []) {
      for (let c = m.from; c < m.to && c < text.length; c++) deco[c] += " " + m.kind;
    }
    let out = "";
    let run = "";
    let runKey = null;
    const flush = () => {
      if (run !== "") out += '<span class="' + runKey.trim() + '">' + esc(run) + "</span>";
      run = "";
    };
    for (let c = 0; c <= text.length; c++) {
      if (carets && carets.includes(c)) { flush(); runKey = null; out += '<i class="caret"></i>'; }
      if (c === text.length) break;
      const key = cls[c] + deco[c];
      if (key !== runKey) { flush(); runKey = key; }
      run += text[c];
    }
    flush();
    return out;
  }

  /* ---------- 3. command bar component ---------- */

  function highlightCommands(text) {
    return esc(text).replace(/(^|\s)([\/#][a-z][a-z-]*)/g, '$1<span class="cb-cmd">$2</span>');
  }

  function createCommandBar(host) {
    host.innerHTML =
      '<div class="cb" hidden><div class="cb-input"><span class="cb-text"></span><i class="cb-caret"></i></div>' +
      '<ul class="cb-rows"></ul></div>';
    const root = host.firstElementChild;
    const textEl = root.querySelector(".cb-text");
    const rowsEl = root.querySelector(".cb-rows");
    let text = "";
    let rows = [];
    let sel = -1;

    function draw() {
      rowsEl.innerHTML = rows.map((r, i) =>
        '<li class="cb-row' + (i === sel ? " on" : "") + '"><span class="t">' + esc(r.t) + "</span>" +
        (r.s ? '<span class="s">' + esc(r.s) + "</span>" : "") +
        (r.k ? '<span class="k">' + esc(r.k) + "</span>" : "") + "</li>").join("");
    }

    const bar = {
      onSelect: null,
      get text() { return text; },
      open() { root.hidden = false; },
      close() { root.hidden = true; bar.setText(""); bar.setRows([]); bar.onSelect = null; },
      setText(t) { text = t; textEl.innerHTML = highlightCommands(t); },
      setRows(list, select = -1) { rows = list; sel = select; draw(); },
      select(i) { sel = i; draw(); if (bar.onSelect) bar.onSelect(i, rows[i]); },
      /* Types `target`. If the current text is not a prefix of it, backspaces first. */
      async typeTo(ctx, target, speed = 45) {
        while (!target.startsWith(text)) { bar.setText(text.slice(0, -1)); await ctx.sleep(22); }
        while (text.length < target.length) {
          bar.setText(target.slice(0, text.length + 1));
          await ctx.sleep(speed + rand(0, 35));
        }
      },
    };
    return bar;
  }

  /* ---------- 4. shared lists ---------- */

  const THEMES = ["default", "midnight", "paper", "ocean"];
  const SYNTAX_THEMES = ["default", "ember", "forest", "lavender"];
  const row = (t, s, k, extra) => Object.assign({ t, s, k }, extra);

  /* ---------- 5. sample files ----------
     Every file in the explorer is named after a command bar command and its
     simulation runs that command. Files with `hidden: true` are only opened by
     simulations (they show up as tabs, never in the explorer). */

  const GULP_CODE = [
    'const gulp = require("gulp");',
    'const sass = require("gulp-sass");',
    "",
    "function styles() {",
    '  return gulp.src("src/scss/*.scss")',
    "    .pipe(sass())",
    '    .pipe(gulp.dest("dist/css"));',
    "}",
    "",
    "function watch() {",
    '  gulp.watch("src/scss/*.scss", styles);',
    "}",
    "",
    "exports.default = gulp.series(styles, watch);",
  ].join("\n");

  const TS_CODE = [
    'import { readFileSync, writeFileSync } from "fs";',
    "",
    "interface Config {",
    "  name: string;",
    "  port: number;",
    "  debug: boolean;",
    "}",
    "",
    "const defaults: Config = {",
    '  name: "app",',
    "  port: 3000,",
    "  debug: false,",
    "};",
    "",
    "export function load(path: string): Config {",
    '  const raw = readFileSync(path, "utf8");',
    "  const data = JSON.parse(raw);",
    "  return { ...defaults, ...data };",
    "}",
    "",
    "export function validate(config: Config): string[] {",
    "  const errors: string[] = [];",
    "  if (!config.name) {",
    '    errors.push("name is required");',
    "  }",
    "  if (config.port < 1 || config.port > 65535) {",
    '    errors.push("port out of range");',
    "  }",
    "  return errors;",
    "}",
    "",
    "export function describe(config: Config): string {",
    '  const mode = config.debug ? "debug" : "production";',
    '  return config.name + " on :" + config.port + " (" + mode + ")";',
    "}",
    "",
    "export function save(path: string, config: Config): void {",
    "  const errors = validate(config);",
    "  if (errors.length > 0) {",
    '    throw new Error(errors.join(", "));',
    "  }",
    "  writeFileSync(path, JSON.stringify(config, null, 2));",
    "}",
  ].join("\n");

  const PHP_CODE = [
    "<?php",
    "",
    "class LoginController",
    "{",
    "    public function store(Request $request)",
    "    {",
    "        $user = $this->handleLogin($request);",
    "",
    "        return redirect()->route('dashboard');",
    "    }",
    "",
    "    public function api(Request $request)",
    "    {",
    "        return $this->handleLogin($request);",
    "    }",
    "",
    "    private function handleLogin(Request $request)",
    "    {",
    "        return Auth::attempt($request->only('email', 'password'));",
    "    }",
    "}",
  ].join("\n");

  const CSS_CODE = [
    ":root {",
    "  --brand: #f4501e;",
    "  --accent: #fdb10b;",
    "  --bg: #1c1613;",
    "}",
    "",
    ".button {",
    "  padding: 8px 16px;",
    "  color: var(--bg);",
    "  background: var(--brand);",
    "  border-radius: 6px;",
    "}",
    "",
    ".button:hover {",
    "  background: var(--accent);",
    "}",
    "",
    "@media (max-width: 600px) {",
    "  .button { width: 100%; }",
    "}",
  ].join("\n");

  const FILES = [
    {
      name: "chain.json", lang: "json", color: "#e8a838", sim: simChain,
      code: [
        "{",
        '  "name": "kulicode-site",',
        '  "scripts": {',
        '    "build": "gulp build",',
        '    "watch": "gulp watch"',
        "  },",
        '  "devDependencies": {',
        '    "gulp": "^4.0.2",',
        '    "gulp-sass": "^5.1.0"',
        "  }",
        "}",
      ].join("\n"),
    },
    { name: "definition.php", lang: "php", color: "#8892bf", sim: simDefinition, code: PHP_CODE },
    {
      name: "file.php", lang: "php", color: "#8892bf", sim: simFile,
      code: [
        "<?php",
        "",
        "require __DIR__ . '/vendor/autoload.php';",
        "",
        "$app = new App();",
        "$app->run();",
      ].join("\n"),
    },
    { name: "find.js", lang: "js", color: "#f0c040", sim: simFind, code: GULP_CODE },
    {
      name: "folder.php", lang: "php", color: "#8892bf", sim: simFolder,
      code: [
        "<?php",
        "",
        "return [",
        "    'name' => 'KuliCode',",
        "    'env' => 'local',",
        "    'debug' => true,",
        "    'url' => 'http://localhost',",
        "];",
      ].join("\n"),
    },
    { name: "line.ts", lang: "ts", color: "#3178c6", sim: simLine, code: TS_CODE },
    { name: "minimap.ts", lang: "ts", color: "#3178c6", sim: simMinimap, code: TS_CODE },
    {
      name: "multifind.js", lang: "js", color: "#f0c040", sim: simMultifind,
      code: [
        "function greet(user) {",
        "  const name = user.name;",
        "  const mail = user.email;",
        '  return "Hi " + name + ", " + mail;',
        "}",
        "",
        "const user = fetchProfile();",
        "console.log(greet(user));",
      ].join("\n"),
    },
    { name: "references.php", lang: "php", color: "#8892bf", sim: simReferences, code: PHP_CODE },
    { name: "replace-one.js", lang: "js", color: "#f0c040", sim: simReplaceOne, code: GULP_CODE },
    { name: "syntax-theme.css", lang: "css", color: "#a77bf3", sim: simSyntaxTheme, code: CSS_CODE },
    { name: "theme.css", lang: "css", color: "#a77bf3", sim: simTheme, code: CSS_CODE },
    {
      name: "type.go", lang: "go", color: "#00add8", sim: simType,
      code: [
        "package main",
        "",
        "type Account struct {",
        "    ID   int",
        "    Name string",
        "}",
        "",
        "func rename(acct Account, name string) Account {",
        "    acct.Name = name",
        "    return acct",
        "}",
        "",
        "func main() {",
        '    a := Account{ID: 1, Name: "kuli"}',
        '    a = rename(a, "fox")',
        "}",
      ].join("\n"),
    },

    // opened only by simulations
    {
      name: "LoginController.php", lang: "php", color: "#8892bf", hidden: true,
      code: [
        "<?php",
        "",
        "namespace App\\Http\\Controllers\\Auth;",
        "",
        "class LoginController extends Controller",
        "{",
        "    public function login(Request $request)",
        "    {",
        "        $user = $this->attemptLogin($request);",
        "",
        "        return redirect()->intended('dashboard');",
        "    }",
        "",
        "    protected function attemptLogin(Request $request)",
        "    {",
        "        return Auth::attempt($request->only('email', 'password'));",
        "    }",
        "}",
      ].join("\n"),
    },
    {
      name: "login.blade.php", lang: "php", color: "#8892bf", hidden: true,
      code: [
        '<form method="POST" action="/login">',
        '    <input type="email" name="email">',
        '    <input type="password" name="password">',
        "    <button>Log in</button>",
        "</form>",
      ].join("\n"),
    },
    {
      name: "LoginTest.php", lang: "php", color: "#8892bf", hidden: true,
      code: [
        "<?php",
        "",
        "class LoginTest extends TestCase",
        "{",
        "    public function test_user_can_login()",
        "    {",
        "        $this->post('/login', $this->credentials())",
        "            ->assertRedirect('/dashboard');",
        "    }",
        "}",
      ].join("\n"),
    },
  ];
  const fileByName = (n) => FILES.find((f) => f.name === n);

  /* ---------- 6. editor model and rendering ---------- */

  const LH = 20; // line height in px, same as --lh in CSS
  const LANG_NAMES = { js: "JavaScript", ts: "TypeScript", php: "PHP", go: "Go", css: "CSS", json: "JSON" };

  const E = { lines: [], lang: "js", sels: [], marks: [], minimap: true };

  const appWin = $("appWin");
  const scroller = $("scroller");
  const linesEl = $("lines");
  const gutterEl = $("gutter");
  const mmBody = $("mmBody");
  const mmSlider = $("mmSlider");

  function groupBy(list) {
    const by = {};
    for (const item of list) (by[item.line] = by[item.line] || []).push(item);
    return by;
  }

  function render() {
    const marks = E.marks.slice();
    const carets = [];
    for (const s of E.sels) {
      if (s.to > s.from) marks.push({ line: s.line, from: s.from, to: s.to, kind: "sel" });
      carets.push({ line: s.line, col: s.to });
    }
    const marksBy = groupBy(marks);
    const caretsBy = groupBy(carets);
    const single = E.sels.length === 1 ? E.sels[0].line : -1;

    let html = "";
    let nums = "";
    E.lines.forEach((t, i) => {
      const cur = i === single ? " cur" : "";
      const cols = (caretsBy[i] || []).map((c) => c.col);
      html += '<div class="ln' + cur + '">' + lineHTML(t, E.lang, marksBy[i], cols) + "</div>";
      nums += '<div class="gn' + cur + '">' + (i + 1) + "</div>";
    });
    linesEl.innerHTML = html;
    gutterEl.innerHTML = nums;

    if (E.minimap) renderMinimap();
    const first = E.sels[0];
    $("stPos").textContent = E.sels.length > 1
      ? E.sels.length + " cursors"
      : "Ln " + (first.line + 1) + ", Col " + (first.to + 1);
    $("stLang").textContent = LANG_NAMES[E.lang] || "";
  }

  function renderMinimap() {
    mmBody.innerHTML = E.lines.map((t) => {
      const trimmed = t.trimStart();
      if (!trimmed) return '<i style="width:0"></i>';
      const indent = t.length - trimmed.length;
      const c = classify(t, E.lang)[indent];
      return '<i class="' + c + '" style="width:' + Math.min(trimmed.length * 1.2, 66) + "px;margin-left:" + indent * 1.2 + 'px"></i>';
    }).join("");
    syncSlider();
  }

  function syncSlider() {
    const visible = Math.min(scroller.clientHeight / LH, E.lines.length);
    mmSlider.style.height = visible * 3 + "px";
    mmSlider.style.top = 12 + (scroller.scrollTop / LH) * 3 + "px";
  }

  scroller.addEventListener("scroll", syncSlider);
  if (window.ResizeObserver) new ResizeObserver(syncSlider).observe(scroller);

  function loadFile(file) {
    E.lines = file.code.split("\n");
    E.lang = file.lang;
    E.sels = [{ line: 0, from: 0, to: 0 }];
    E.marks = [];
    scroller.scrollTop = 0;
    render();
  }

  function setSels(list) {
    E.sels = list.map((s) => ({ line: s.line, from: s.from, to: s.to }));
    render();
  }
  function setCaret(line, col) { setSels([{ line, from: col, to: col }]); }

  function revealLine(line) {
    const top = line * LH;
    const view = scroller.clientHeight;
    if (top < scroller.scrollTop || top + 2 * LH > scroller.scrollTop + view) {
      scroller.scrollTo({ top: Math.max(0, top - view / 3), behavior: "smooth" });
    }
  }

  /* All matches of `needle` in the editor text. Options follow the app's @case, @whole, @regex. */
  function findAll(needle, { caseSens = false, whole = false, regex = false } = {}) {
    let src = regex ? needle : needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (whole) src = "\\b(?:" + src + ")\\b";
    const re = new RegExp(src, caseSens ? "g" : "gi");
    const out = [];
    E.lines.forEach((t, line) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(t)) !== null) {
        if (m[0] === "") { re.lastIndex++; continue; }
        out.push({ line, from: m.index, to: m.index + m[0].length });
      }
    });
    return out;
  }

  function replaceMatches(matches, replacement) {
    for (const m of matches.slice().sort((a, b) => b.line - a.line || b.from - a.from)) {
      const t = E.lines[m.line];
      E.lines[m.line] = t.slice(0, m.from) + replacement + t.slice(m.to);
    }
    E.marks = [];
    render();
  }

  /* Insert `str` at every cursor, replacing selections. Edits are applied left to
     right with a running offset per line so cursors on the same line stay correct. */
  function multiInsert(str) {
    const sels = E.sels.slice().sort((a, b) => a.line - b.line || a.from - b.from);
    const shift = {};
    const out = [];
    for (const s of sels) {
      const o = shift[s.line] || 0;
      const start = s.from + o;
      const end = s.to + o;
      const t = E.lines[s.line];
      E.lines[s.line] = t.slice(0, start) + str + t.slice(end);
      shift[s.line] = o + str.length - (end - start);
      const c = start + str.length;
      out.push({ line: s.line, from: c, to: c });
    }
    E.sels = out;
    E.marks = [];
    render();
  }

  async function typeText(ctx, text, speed = 70) {
    for (const ch of text) {
      multiInsert(ch);
      await ctx.sleep(speed + rand(0, 40));
    }
  }

  /* Mark every match, select the one at `idx`, scroll to it. */
  function focusMatch(all, idx) {
    E.marks = all.filter((_, i) => i !== idx).map((m) => Object.assign({ kind: "mk" }, m));
    setSels([all[idx]]);
    revealLine(all[idx].line);
  }

  /* ---------- 7. window chrome ---------- */

  const appCb = createCommandBar($("appCb"));
  const appRunner = createRunner();
  const toastEl = $("toast");
  let toastTimer = 0;

  let openTabs = ["chain.json"];
  let active = "chain.json";
  let saved = null; // editor state while a command bar preview is showing

  function toast(keys) {
    toastEl.innerHTML = keys.map((k) => "<kbd>" + esc(k) + "</kbd>").join("");
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("on"), 1500);
  }

  function renderTree() {
    $("tree").innerHTML = FILES.filter((f) => !f.hidden).map((f) =>
      '<li data-name="' + f.name + '"><span class="fi" style="--c:' + f.color + '"></span>' +
      '<span class="nm">' + f.name + "</span></li>").join("");
    updateTreeState();
  }

  function updateTreeState() {
    for (const li of $("tree").children) li.classList.toggle("active", li.dataset.name === active);
  }

  function renderTabs() {
    $("tabs").innerHTML = openTabs.map((n) =>
      '<div class="tab' + (n === active ? " active" : "") + '" data-name="' + n + '"><span>' + n +
      '</span><span class="x" data-close="1">×</span></div>').join("");
  }

  function openTab(name) { if (!openTabs.includes(name)) openTabs.push(name); }

  /* Show a file without touching the running simulation. */
  function switchTo(name) {
    active = name;
    loadFile(fileByName(name));
    renderTabs();
    updateTreeState();
    $("winTitle").textContent = name + " — kulicode";
  }

  /* Command bar preview: show a file over the editor without opening a tab.
     The editor state comes back with endPreview(). */
  function previewFile(name, line, needle) {
    const f = fileByName(name);
    if (!f) { endPreview(); return; }
    if (!saved) saved = { lines: E.lines, lang: E.lang, sels: E.sels, marks: E.marks, top: scroller.scrollTop };
    E.lines = f.code.split("\n");
    E.lang = f.lang;
    E.marks = [];
    E.sels = [{ line: 0, from: 0, to: 0 }];
    scroller.scrollTop = 0;
    if (line !== undefined) showHit(line, needle, false);
    else render();
  }

  function endPreview() {
    if (!saved) return;
    Object.assign(E, saved);
    scroller.scrollTop = saved.top;
    saved = null;
    render();
  }

  /* Mark the matches of `needle` in the editor text and select the one on `line`. */
  function showHit(line, needle, smooth) {
    const all = needle ? findAll(needle) : [];
    const idx = all.findIndex((m) => m.line === line);
    if (idx >= 0) {
      E.marks = all.filter((_, i) => i !== idx).map((m) => Object.assign({ kind: "mk" }, m));
      setSels([all[idx]]);
    } else {
      E.marks = [];
      setCaret(line, 0);
    }
    if (smooth) revealLine(line);
    else scroller.scrollTop = Math.max(0, line * LH - scroller.clientHeight / 3);
  }

  function setMinimap(on) {
    E.minimap = on;
    appWin.dataset.minimap = on ? "on" : "off";
    render();
  }

  /* Put the window back to a clean state before a simulation starts. */
  function resetEnv() {
    appCb.close();
    appWin.dataset.theme = "default";
    appWin.dataset.syntax = "default";
    toastEl.classList.remove("on");
    saved = null;
    E.minimap = true;
    appWin.dataset.minimap = "on";
  }

  let simState = "idle"; // idle | running | done

  function startSim() {
    resetEnv();
    const file = fileByName(active);
    loadFile(file);
    if (!file.sim) { simState = "done"; return; }
    simState = "running";
    appRunner.run(async (ctx) => {
      await ctx.sleep(500);
      await file.sim(ctx);
      simState = "done";
    });
  }

  function activate(name, { fresh = false } = {}) {
    if (!fileByName(name)) return;
    appRunner.stop();
    if (fresh) openTabs = [];
    openTab(name);
    switchTo(name);
    startSim();
  }

  $("tree").addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) activate(li.dataset.name, { fresh: true });
  });

  $("tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    const name = tab.dataset.name;
    if (e.target.dataset.close) {
      if (openTabs.length < 2) return;
      const wasActive = name === active;
      openTabs = openTabs.filter((n) => n !== name);
      if (wasActive) activate(openTabs[openTabs.length - 1]);
      else renderTabs();
      return;
    }
    activate(name);
  });

  /* ---------- 8. command simulations ---------- */

  const uniqueLines = (hits) => [...new Set(hits.map((h) => h.line))];
  const lineRows = (lines) => lines.map((l) => row(E.lines[l].trim(), "Ln " + (l + 1)));

  /* /file x /find y /replace-all z, chained in one go. */
  async function simChain(ctx) {
    toast(["⌘", "P"]);
    await ctx.sleep(500);
    appCb.open();
    await appCb.typeTo(ctx, "/file chain.json");
    appCb.setRows([row("chain.json", ".")], 0);
    await ctx.sleep(800);
    appCb.setRows([]);
    await appCb.typeTo(ctx, "/file chain.json /find gulp");
    const hits = findAll("gulp");
    focusMatch(hits, 0);
    await ctx.sleep(1000);
    await appCb.typeTo(ctx, "/file chain.json /find gulp /replace-all webpack");
    appCb.setRows([row("Replace " + hits.length + " matches", "“gulp” → “webpack” in chain.json", "⏎")], 0);
    await ctx.sleep(1400);
    appCb.close();
    replaceMatches(hits, "webpack");
    E.marks = findAll("webpack").map((m) => Object.assign({ kind: "mk" }, m));
    render();
    await ctx.sleep(2400);
    E.marks = [];
    render();
  }

  /* /definition name: one hit opens directly. */
  async function simDefinition(ctx) {
    const refs = findAll("handleLogin", { caseSens: true });
    const use = refs[0];
    const def = refs[refs.length - 1];
    await ctx.sleep(300);
    setCaret(use.line, use.from + 4);
    await ctx.sleep(900);
    toast(["F12"]);
    await ctx.sleep(500);
    appCb.open();
    appCb.setText("/definition handleLogin");
    appCb.setRows([row(E.lines[def.line].trim(), "Ln " + (def.line + 1))], 0);
    await ctx.sleep(1100);
    appCb.close();
    E.marks = [];
    setSels([def]);
    revealLine(def.line);
    await ctx.sleep(2200);
  }

  /* /file: fuzzy find, the highlighted row previews in the editor, Enter opens it. */
  async function simFile(ctx) {
    const preview = (i, r) => { if (r && r.file) previewFile(r.file); else endPreview(); };
    await ctx.sleep(300);
    toast(["⌘", "P"]);
    await ctx.sleep(500);
    appCb.open();
    appCb.onSelect = preview;
    await appCb.typeTo(ctx, "/file lo");
    appCb.setRows([
      row("LoginController.php", "app/Http/Controllers/Auth", null, { file: "LoginController.php" }),
      row("login.blade.php", "resources/views/auth", null, { file: "login.blade.php" }),
      row("logger.php", "config"),
      row("LoginTest.php", "tests/Feature", null, { file: "LoginTest.php" }),
    ], -1);
    appCb.select(0);
    await ctx.sleep(1000);

    appCb.setRows([]);
    await appCb.typeTo(ctx, "/file login");
    appCb.setRows([
      row("LoginController.php", "app/Http/Controllers/Auth", null, { file: "LoginController.php" }),
      row("login.blade.php", "resources/views/auth", null, { file: "login.blade.php" }),
      row("LoginTest.php", "tests/Feature", null, { file: "LoginTest.php" }),
    ], -1);
    appCb.select(0);
    await ctx.sleep(1000);
    for (const i of [1, 2, 0]) { appCb.select(i); await ctx.sleep(1000); }

    toast(["⏎"]);
    await ctx.sleep(400);
    endPreview();
    appCb.close();
    openTab("LoginController.php");
    switchTo("LoginController.php");
    await ctx.sleep(2200);
  }

  /* /find: lines list, arrows move the cursor, options go right after /find. */
  async function simFind(ctx) {
    toast(["⌘", "F"]);
    await ctx.sleep(500);
    appCb.open();
    await appCb.typeTo(ctx, "/find gulp");
    let hits = findAll("gulp");
    let lines = uniqueLines(hits);
    appCb.setRows(lineRows(lines), -1);
    await ctx.sleep(700);
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      appCb.select(i);
      focusMatch(hits, hits.findIndex((h) => h.line === lines[i]));
      await ctx.sleep(800);
    }

    appCb.setRows([]);
    E.marks = [];
    setCaret(0, 0);
    await appCb.typeTo(ctx, "/find @regex gulp\\.\\w+");
    hits = findAll("gulp\\.\\w+", { regex: true });
    lines = uniqueLines(hits);
    appCb.setRows(lineRows(lines), -1);
    await ctx.sleep(700);
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      appCb.select(i);
      focusMatch(hits, hits.findIndex((h) => h.line === lines[i]));
      await ctx.sleep(800);
    }
    await ctx.sleep(1200);
  }

  /* /folder x /find y: hits from a whole folder, each one previews, Enter opens it at the line. */
  async function simFolder(ctx) {
    const path = "app/Http/Controllers/Auth/LoginController.php";
    const src = fileByName("LoginController.php").code.split("\n");
    const hits = [];
    src.forEach((t, i) => { if (/login/i.test(t)) hits.push(row(t.trim(), path + ":" + (i + 1), null, { file: "LoginController.php", line: i })); });

    toast(["⌘", "P"]);
    await ctx.sleep(500);
    appCb.open();
    await appCb.typeTo(ctx, "/folder app");
    appCb.setRows([row("app", "."), row("app/Http", "app"), row("app/Models", "app")], 0);
    await ctx.sleep(800);
    appCb.setRows([]);
    await appCb.typeTo(ctx, "/folder app /find login");
    appCb.setRows(hits, -1);
    appCb.onSelect = (i, r) => { if (r) previewFile(r.file, r.line, "login"); };
    await ctx.sleep(800);
    for (let i = 0; i < hits.length; i++) { appCb.select(i); await ctx.sleep(1000); }

    toast(["⏎"]);
    await ctx.sleep(400);
    const last = hits[hits.length - 1];
    endPreview();
    appCb.close();
    openTab(last.file);
    switchTo(last.file);
    showHit(last.line, "login", false);
    await ctx.sleep(2400);
  }

  /* /line n and its alias /ln. */
  async function simLine(ctx) {
    toast(["⌘", "P"]);
    await ctx.sleep(500);
    appCb.open();
    await appCb.typeTo(ctx, "/line 40");
    appCb.setRows([row("Go to line 40", "", "⏎")], 0);
    await ctx.sleep(900);
    appCb.close();
    setCaret(39, 0);
    revealLine(39);
    await ctx.sleep(1800);

    toast(["⌘", "P"]);
    appCb.open();
    await appCb.typeTo(ctx, "/ln 4");
    appCb.setRows([row("Go to line 4", "alias of /line", "⏎")], 0);
    await ctx.sleep(900);
    appCb.close();
    setCaret(3, 0);
    revealLine(3);
    await ctx.sleep(1800);
  }

  function smoothScroll(top) { scroller.scrollTo({ top, behavior: "smooth" }); }

  /* #minimap on|off: the slider follows the scroll, the setting hides it. */
  async function simMinimap(ctx) {
    await ctx.sleep(500);
    smoothScroll(scroller.scrollHeight);
    await ctx.sleep(1700);
    smoothScroll(0);
    await ctx.sleep(1400);

    toast(["⌘", "P"]);
    appCb.open();
    await appCb.typeTo(ctx, "#minimap ");
    appCb.setRows([row("on"), row("off")], -1);
    await ctx.sleep(800);
    appCb.select(1);
    await ctx.sleep(800);
    appCb.close();
    setMinimap(false);
    await ctx.sleep(1500);

    appCb.open();
    await appCb.typeTo(ctx, "#minimap ");
    appCb.setRows([row("on"), row("off")], -1);
    await ctx.sleep(600);
    appCb.select(0);
    await ctx.sleep(700);
    appCb.close();
    setMinimap(true);
    await ctx.sleep(1500);
  }

  /* /multifind text (alias /mf): a cursor on every match. */
  async function simMultifind(ctx) {
    toast(["⌘", "P"]);
    await ctx.sleep(500);
    appCb.open();
    await appCb.typeTo(ctx, "/mf user");
    const all = findAll("user");
    appCb.setRows([row("Cursor on every match", all.length + " matches of “user”", "⏎")], 0);
    await ctx.sleep(1300);
    appCb.close();
    setSels(all);
    await ctx.sleep(1100);
    await typeText(ctx, "account", 110);
    await ctx.sleep(2200);
  }

  /* /references name: every use, the arrows move through them. */
  async function simReferences(ctx) {
    const refs = findAll("handleLogin", { caseSens: true });
    await ctx.sleep(300);
    const use = refs[0];
    setCaret(use.line, use.from + 4);
    await ctx.sleep(800);
    toast(["⇧", "F12"]);
    await ctx.sleep(500);
    appCb.open();
    appCb.setText("/references handleLogin");
    appCb.setRows(refs.map((r) => row(E.lines[r.line].trim(), "Ln " + (r.line + 1))), -1);
    await ctx.sleep(900);
    for (let i = 0; i < refs.length; i++) {
      appCb.select(i);
      focusMatch(refs, i);
      await ctx.sleep(1000);
    }
    await ctx.sleep(700);
    appCb.close();
  }

  /* /find x /replace-one y: replaces the selected match, selects the next, bar stays open. */
  async function simReplaceOne(ctx) {
    toast(["⌥", "⌘", "F"]);
    await ctx.sleep(500);
    appCb.open();
    await appCb.typeTo(ctx, "/find gulp /replace-one webpack");
    let left = findAll("gulp");
    focusMatch(left, 0);
    for (let n = 0; n < 4 && left.length; n++) {
      appCb.setRows([row("Replace this match", "“gulp” → “webpack” · " + left.length + " left", "⏎")], 0);
      await ctx.sleep(900);
      toast(["⏎"]);
      await ctx.sleep(300);
      replaceMatches([left[0]], "webpack");
      left = findAll("gulp");
      if (left.length) focusMatch(left, 0);
      await ctx.sleep(500);
    }
    await ctx.sleep(1200);
    appCb.close();
  }

  /* One theme list: arrows preview, Enter keeps the choice. */
  async function pickTheme(ctx, command, names, attr, order) {
    appCb.open();
    await appCb.typeTo(ctx, command);
    appCb.setRows(names.map((n, i) => row((i + 1) + "  " + n)), -1);
    appCb.onSelect = (i) => { appWin.dataset[attr] = names[i]; };
    await ctx.sleep(700);
    for (const i of order) { appCb.select(i); await ctx.sleep(1000); }
    appCb.close();
  }

  async function simTheme(ctx) {
    toast(["⌘", "P"]);
    await ctx.sleep(500);
    await pickTheme(ctx, "#theme ", THEMES, "theme", [1, 2, 3, 2]);
    await ctx.sleep(2200);
  }

  async function simSyntaxTheme(ctx) {
    toast(["⌘", "P"]);
    await ctx.sleep(500);
    await pickTheme(ctx, "#syntax-theme ", SYNTAX_THEMES, "syntax", [1, 2, 3, 2]);
    await ctx.sleep(2200);
  }

  /* /type name (alias /ty): jumps to the declared type of a variable. */
  async function simType(ctx) {
    const line = E.lines.findIndex((l) => l.includes("acct.Name"));
    await ctx.sleep(300);
    setCaret(line, E.lines[line].indexOf("acct") + 2);
    await ctx.sleep(900);
    toast(["⌘", "P"]);
    await ctx.sleep(500);
    appCb.open();
    await appCb.typeTo(ctx, "/type acct");
    const def = findAll("Account", { caseSens: true })[0];
    appCb.setRows([row(E.lines[def.line].trim(), "Ln " + (def.line + 1))], 0);
    await ctx.sleep(1100);
    appCb.close();
    setSels([def]);
    revealLine(def.line);
    await ctx.sleep(2200);
  }

  /* ---------- 9. boot ---------- */

  renderTree();
  renderTabs();
  loadFile(fileByName(active));

  // the simulation only runs while it is on screen and the tab is visible
  let appVisible = false;

  function syncPlayback() {
    if (appVisible && !document.hidden) {
      if (simState !== "done" && simState !== "running") startSim();
    } else if (simState === "running") {
      appRunner.stop();
      simState = "idle";
    }
  }

  const viewObserver = new IntersectionObserver((entries) => {
    for (const e of entries) appVisible = e.isIntersecting;
    syncPlayback();
  }, { threshold: 0.35 });
  viewObserver.observe(appWin);
  document.addEventListener("visibilitychange", syncPlayback);
})();
