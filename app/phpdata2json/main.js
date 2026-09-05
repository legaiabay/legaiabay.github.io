(function (root) {
  'use strict';

  class PhpSerializeError extends Error {
    constructor(message, byteOffset) {
      super(`${message} (byte ${byteOffset})`);
      this.name = 'PhpSerializeError';
      this.byteOffset = byteOffset;
    }
  }

  class PhpSerializer {
    constructor(source) {
      this.source = source;
      this.bytes = new TextEncoder().encode(source);
      this.decoder = new TextDecoder('utf-8', { fatal: true });
      this.position = 0;
    }

    parse() {
      if (this.bytes.length === 0) {
        throw new PhpSerializeError('Input is empty', 0);
      }

      const value = this.parseValue();
      this.skipWhitespace();
      if (this.position !== this.bytes.length) {
        throw this.error('Unexpected data after the serialized value');
      }
      return value;
    }

    parseValue() {
      const type = this.readAscii(1);
      switch (type) {
        case 'N': return this.parseNull();
        case 'b': return this.parseBoolean();
        case 'i': return this.parseInteger();
        case 'd': return this.parseFloat();
        case 's': return this.parseString();
        case 'a': return this.parseArray();
        case 'O': return this.parseObject();
        default:
          if (type === 'R' || type === 'r') {
            throw this.error('PHP references are not supported');
          }
          throw this.error(`Unknown serialized type "${type || 'end of input'}"`);
      }
    }

    parseNull() {
      this.expect(';');
      return null;
    }

    parseBoolean() {
      this.expect(':');
      const value = this.readUntil(';');
      if (value !== '0' && value !== '1') {
        throw this.error('A boolean must be 0 or 1');
      }
      return value === '1';
    }

    parseInteger() {
      this.expect(':');
      const value = this.readUntil(';');
      if (!/^-?\d+$/.test(value)) {
        throw this.error(`Invalid integer "${value}"`);
      }
      const number = Number(value);
      if (!Number.isSafeInteger(number)) {
        throw this.error(`Integer "${value}" exceeds JSON's safe integer range`);
      }
      return number;
    }

    parseFloat() {
      this.expect(':');
      const value = this.readUntil(';');
      if (!/^(?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?|INF|-INF|NAN)$/.test(value)) {
        throw this.error(`Invalid float "${value}"`);
      }
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw this.error(`Float "${value}" cannot be represented in JSON`);
      }
      return number;
    }

    parseString() {
      this.expect(':');
      const byteLength = this.readLength();
      this.expect(':');
      this.expect('"');
      const value = this.readUtf8(byteLength);
      this.expect('"');
      this.expect(';');
      return value;
    }

    parseArray() {
      this.expect(':');
      const itemCount = this.readLength();
      this.expect(':');
      this.expect('{');

      const entries = [];
      for (let index = 0; index < itemCount; index += 1) {
        const key = this.parseValue();
        if (typeof key !== 'string' && typeof key !== 'number') {
          throw this.error('Array keys must be strings or integers');
        }
        entries.push([key, this.parseValue()]);
      }
      this.expect('}');

      const sequential = entries.every(([key], index) => typeof key === 'number' && key === index);
      if (sequential) return entries.map((entry) => entry[1]);

      const object = {};
      for (const [key, value] of entries) object[String(key)] = value;
      return object;
    }

    parseObject() {
      this.expect(':');
      const classByteLength = this.readLength();
      this.expect(':');
      this.expect('"');
      const className = this.readUtf8(classByteLength);
      this.expect('"');
      this.expect(':');
      const propertyCount = this.readLength();
      this.expect(':');
      this.expect('{');

      const object = { __php_class_name: className };
      for (let index = 0; index < propertyCount; index += 1) {
        const key = this.parseValue();
        if (typeof key !== 'string') {
          throw this.error('Object property names must be strings');
        }
        object[this.normalizePropertyName(key)] = this.parseValue();
      }
      this.expect('}');
      return object;
    }

    normalizePropertyName(name) {
      if (!name.startsWith('\0')) return name;
      const parts = name.split('\0');
      return parts.length >= 3 ? parts.slice(2).join('\0') : name;
    }

    readLength() {
      const raw = this.readUntil(':', false);
      if (!/^\d+$/.test(raw)) throw this.error(`Invalid length "${raw}"`);
      return Number(raw);
    }

    readUtf8(byteLength) {
      const end = this.position + byteLength;
      if (end > this.bytes.length) {
        throw this.error(`String declares ${byteLength} bytes but the input ends early`);
      }
      const chunk = this.bytes.slice(this.position, end);
      this.position = end;
      try {
        return this.decoder.decode(chunk);
      } catch (_error) {
        throw this.error('String length cuts through an invalid UTF-8 sequence');
      }
    }

    readUntil(delimiter, consumeDelimiter = true) {
      const delimiterByte = delimiter.charCodeAt(0);
      const start = this.position;
      while (this.position < this.bytes.length && this.bytes[this.position] !== delimiterByte) {
        this.position += 1;
      }
      if (this.position >= this.bytes.length) throw this.error(`Expected "${delimiter}"`);
      const value = this.decoder.decode(this.bytes.slice(start, this.position));
      if (consumeDelimiter) this.position += 1;
      return value;
    }

    readAscii(length) {
      const end = Math.min(this.position + length, this.bytes.length);
      const value = String.fromCharCode(...this.bytes.slice(this.position, end));
      this.position = end;
      return value;
    }

    expect(value) {
      const actual = this.readAscii(value.length);
      if (actual !== value) throw this.error(`Expected "${value}" but found "${actual || 'end of input'}"`);
    }

    skipWhitespace() {
      while (this.position < this.bytes.length && /\s/.test(String.fromCharCode(this.bytes[this.position]))) {
        this.position += 1;
      }
    }

    error(message) {
      return new PhpSerializeError(message, this.position);
    }
  }

  function parsePhpSerialized(source) {
    return new PhpSerializer(source.trim()).parse();
  }

  function entriesToValue(entries) {
    const sequential = entries.every(([key], index) => typeof key === 'number' && key === index);
    if (sequential) return entries.map((entry) => entry[1]);
    return Object.fromEntries(entries.map(([key, value]) => [String(key), value]));
  }

  class PhpArrayParser {
    constructor(source) {
      this.source = source;
      this.position = 0;
    }

    parse() {
      const value = this.parseValue();
      this.skipWhitespace();
      if (this.position !== this.source.length) throw this.error('Unexpected data after the PHP array');
      return value;
    }

    parseValue() {
      this.skipWhitespace();
      if (this.peek('array') && !/[A-Za-z0-9_]/.test(this.source[this.position + 5] || '')) {
        this.position += 5;
        return this.parseArray('(', ')');
      }
      if (this.peek('[')) return this.parseArray('[', ']');
      if (this.peek('"') || this.peek("'")) return this.parseString();
      if (this.consumeKeyword('true')) return true;
      if (this.consumeKeyword('false')) return false;
      if (this.consumeKeyword('null')) return null;
      const number = this.source.slice(this.position).match(/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/);
      if (number) {
        this.position += number[0].length;
        return Number(number[0]);
      }
      throw this.error('Expected a PHP array value');
    }

    parseArray(open, close) {
      this.expect(open);
      const entries = [];
      let nextIndex = 0;
      this.skipWhitespace();
      while (!this.peek(close)) {
        const first = this.parseValue();
        this.skipWhitespace();
        let key = nextIndex;
        let value = first;
        if (this.peek('=>')) {
          this.position += 2;
          key = first;
          value = this.parseValue();
          if (typeof key !== 'string' && typeof key !== 'number') throw this.error('Array keys must be strings or numbers');
          if (typeof key === 'number' && Number.isInteger(key)) nextIndex = Math.max(nextIndex, key + 1);
        } else {
          nextIndex += 1;
        }
        entries.push([key, value]);
        this.skipWhitespace();
        if (this.peek(',')) {
          this.position += 1;
          this.skipWhitespace();
        } else if (!this.peek(close)) {
          throw this.error(`Expected "," or "${close}"`);
        }
      }
      this.expect(close);
      return entriesToValue(entries);
    }

    parseString() {
      const quote = this.source[this.position++];
      let value = '';
      while (this.position < this.source.length) {
        const character = this.source[this.position++];
        if (character === quote) return value;
        if (character !== '\\') { value += character; continue; }
        const escaped = this.source[this.position++];
        if (escaped === undefined) throw this.error('Unterminated string');
        const escapes = { n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'" };
        value += Object.prototype.hasOwnProperty.call(escapes, escaped) ? escapes[escaped] : escaped;
      }
      throw this.error('Unterminated string');
    }

    consumeKeyword(keyword) {
      if (!this.peek(keyword)) return false;
      const boundary = this.source[this.position + keyword.length] || '';
      if (/[A-Za-z0-9_]/.test(boundary)) return false;
      this.position += keyword.length;
      return true;
    }

    expect(value) {
      this.skipWhitespace();
      if (!this.peek(value)) throw this.error(`Expected "${value}"`);
      this.position += value.length;
    }

    peek(value) { return this.source.slice(this.position, this.position + value.length) === value; }
    skipWhitespace() { while (/\s/.test(this.source[this.position] || '')) this.position += 1; }
    error(message) { return new SyntaxError(`${message} (character ${this.position})`); }
  }

  class PhpVarDumpParser {
    constructor(source) { this.source = source; this.position = 0; }

    parse() {
      const value = this.parseValue();
      this.skipWhitespace();
      if (this.position !== this.source.length) throw this.error('Unexpected data after var_dump output');
      return value;
    }

    parseValue() {
      this.skipWhitespace();
      if (this.consume('NULL')) return null;
      const boolean = this.match(/^bool\((true|false)\)/);
      if (boolean) return boolean[1] === 'true';
      const integer = this.match(/^int\((-?\d+)\)/);
      if (integer) return Number(integer[1]);
      const float = this.match(/^float\((-?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)\)/);
      if (float) return Number(float[1]);
      const string = this.match(/^string\((\d+)\)\s*/);
      if (string) return this.parseQuotedByteString(Number(string[1]));
      const array = this.match(/^array\(\d+\)\s*/);
      if (array) return this.parseEntries('{', '}');
      const object = this.match(/^object\([^)]*\)(?:#\d+)?\s*\(\d+\)\s*/);
      if (object) return this.parseEntries('{', '}');
      throw this.error('Unsupported var_dump value');
    }

    parseEntries(open, close) {
      this.expect(open);
      const entries = [];
      while (true) {
        this.skipWhitespace();
        if (this.consume(close)) return entriesToValue(entries);
        this.expect('[');
        const key = this.parseDumpKey();
        this.expect(']');
        this.expect('=>');
        entries.push([key, this.parseValue()]);
      }
    }

    parseDumpKey() {
      this.skipWhitespace();
      if (this.peek('"')) return this.parseQuotedByteString(null);
      const number = this.match(/^-?\d+/);
      if (number) return Number(number[0]);
      throw this.error('Unsupported var_dump array key');
    }

    parseQuotedByteString(byteLength) {
      this.expect('"');
      const start = this.position;
      if (byteLength === null) {
        const end = this.source.indexOf('"', start);
        if (end === -1) throw this.error('Unterminated string');
        this.position = end + 1;
        return this.source.slice(start, end);
      }
      while (this.position < this.source.length) {
        const character = this.source.codePointAt(this.position);
        const width = String.fromCodePoint(character).length;
        const value = this.source.slice(start, this.position + width);
        if (new TextEncoder().encode(value).length > byteLength) break;
        this.position += width;
        if (new TextEncoder().encode(this.source.slice(start, this.position)).length === byteLength) {
          const result = this.source.slice(start, this.position);
          this.expect('"');
          return result;
        }
      }
      throw this.error('String does not match its declared byte length');
    }

    match(expression) {
      const match = this.source.slice(this.position).match(expression);
      if (match) this.position += match[0].length;
      return match;
    }

    consume(value) { if (!this.peek(value)) return false; this.position += value.length; return true; }
    expect(value) { this.skipWhitespace(); if (!this.consume(value)) throw this.error(`Expected "${value}"`); }
    peek(value) { return this.source.slice(this.position, this.position + value.length) === value; }
    skipWhitespace() { while (/\s/.test(this.source[this.position] || '')) this.position += 1; }
    error(message) { return new SyntaxError(`${message} (character ${this.position})`); }
  }

  function parsePhpArray(source) { return new PhpArrayParser(source).parse(); }
  function parsePhpVarDump(source) { return new PhpVarDumpParser(source).parse(); }

  function serializePhp(value) {
    if (value === null) return 'N;';
    if (typeof value === 'boolean') return `b:${value ? 1 : 0};`;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new TypeError('JSON numbers must be finite');
      if (Number.isSafeInteger(value)) return `i:${value};`;
      return `d:${value};`;
    }
    if (typeof value === 'string') {
      return `s:${new TextEncoder().encode(value).length}:"${value}";`;
    }
    if (Array.isArray(value)) {
      return `a:${value.length}:{${value.map((item, index) => `i:${index};${serializePhp(item)}`).join('')}}`;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      return `a:${entries.length}:{${entries.map(([key, item]) => `${serializePhp(key)}${serializePhp(item)}`).join('')}}`;
    }
    throw new TypeError(`Unsupported JSON value type "${typeof value}"`);
  }

  function escapePhpString(value) {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  }

  function formatPhpArray(value, depth = 0) {
    const indent = '  '.repeat(depth);
    const childIndent = '  '.repeat(depth + 1);
    if (value === null) return 'null';
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    if (typeof value === 'string') return `'${escapePhpString(value)}'`;
    const entries = Array.isArray(value) ? value.map((item, index) => [index, item]) : Object.entries(value);
    if (entries.length === 0) return '[]';
    return `[\n${entries.map(([key, item]) => `${childIndent}${typeof key === 'number' ? key : formatPhpArray(String(key))} => ${formatPhpArray(item, depth + 1)},`).join('\n')}\n${indent}]`;
  }

  function formatPhpVarDump(value, depth = 0) {
    const indent = '  '.repeat(depth);
    const childIndent = '  '.repeat(depth + 1);
    if (value === null) return 'NULL';
    if (typeof value === 'boolean') return `bool(${value ? 'true' : 'false'})`;
    if (typeof value === 'number') return `${Number.isInteger(value) ? 'int' : 'float'}(${value})`;
    if (typeof value === 'string') return `string(${new TextEncoder().encode(value).length}) "${value}"`;
    const entries = Array.isArray(value) ? value.map((item, index) => [index, item]) : Object.entries(value);
    return `array(${entries.length}) {\n${entries.map(([key, item]) => `${childIndent}[${typeof key === 'number' ? key : `"${key}"`}]=>\n${childIndent}${formatPhpVarDump(item, depth + 1)}`).join('\n')}\n${indent}}`;
  }

  root.PhpSerializer = PhpSerializer;
  root.parsePhpSerialized = parsePhpSerialized;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhpSerializer, PhpSerializeError, parsePhpSerialized, parsePhpArray, parsePhpVarDump, serializePhp, formatPhpArray, formatPhpVarDump };
  }

  if (typeof document === 'undefined') return;

  // Removes the pre-history selector when this page is updated in a live preview without a full reload.
  document.querySelectorAll('.direction-switcher').forEach((element) => element.remove());

  const phpInput = document.getElementById('phpInput');
  const phpHighlight = document.getElementById('phpHighlight');
  const jsonOutput = document.getElementById('jsonOutput');
  const jsonHighlight = document.getElementById('jsonHighlight');
  const inputTitle = document.getElementById('inputTitle');
  const inputLabel = document.getElementById('inputLabel');
  const outputTitle = document.getElementById('outputTitle');
  const outputLabel = document.getElementById('outputLabel');
  const convertLabel = document.getElementById('convertLabel');
  const formatSwitcher = document.getElementById('formatSwitcher');
  const convertButton = document.getElementById('convertButton');
  const reverseButton = document.getElementById('reverseButton');
  const clearButton = document.getElementById('clearButton');
  const copyButton = document.getElementById('copyButton');
  const exampleButton = document.getElementById('exampleButton');
  const inputCount = document.getElementById('inputCount');
  const status = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');
  const clearHistoryButton = document.getElementById('clearHistoryButton');
  const outputWrap = document.querySelector('.output-wrap');
  const formatInputs = document.querySelectorAll('input[name="format"]');
  const formatTypeInputs = document.querySelectorAll('input[name="formatType"]');
  let reversed = false;
  let parsedValue;
  let hasParsedValue = false;

  const phpExample = 'a:5:{s:4:"name";s:4:"Abay";s:6:"active";b:1;s:5:"roles";a:2:{i:0;s:9:"developer";i:1;s:8:"designer";}s:7:"profile";a:2:{s:4:"city";s:7:"Jakarta";s:8:"language";s:10:"JavaScript";}s:5:"score";d:98.5;}';
  const phpArrayExample = "[\n  'name' => 'Abay',\n  'active' => true,\n  'roles' => ['developer', 'designer'],\n  'score' => 98.5,\n]";
  const varDumpExample = 'array(3) {\n  ["name"]=>\n  string(4) "Abay"\n  ["active"]=>\n  bool(true)\n  ["roles"]=>\n  array(2) {\n    [0]=>\n    string(9) "developer"\n    [1]=>\n    string(8) "designer"\n  }\n}';
  const jsonExample = '{\n  "name": "Abay",\n  "active": true,\n  "roles": ["developer", "designer"],\n  "profile": {\n    "city": "Jakarta",\n    "language": "JavaScript"\n  },\n  "score": 98.5\n}';
  const HISTORY_KEY = 'legaiabay.php-data-json.history.v1';
  const HISTORY_LIMIT = 20;

  function historyLabel(entry) {
    const formats = { serialized: 'PHP serialize', array: 'PHP array', vardump: 'PHP var_dump' };
    const phpFormat = formats[entry.formatType] || 'PHP data';
    return entry.reversed ? `JSON → ${phpFormat}` : `${phpFormat} → JSON`;
  }

  function getHistory() {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(history)
        ? history.filter((entry) => entry && typeof entry.id === 'string' && typeof entry.createdAt === 'number' && typeof entry.input === 'string' && typeof entry.output === 'string' && ['serialized', 'array', 'vardump'].includes(entry.formatType))
        : [];
    } catch (_error) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
    } catch (_error) {
      setStatus('error', 'Conversion succeeded, but history could not be saved');
    }
  }

  function renderHistory() {
    const history = getHistory();
    historyList.replaceChildren();
    historyEmpty.hidden = history.length > 0;
    clearHistoryButton.disabled = history.length === 0;

    history.forEach((entry) => {
      const button = document.createElement('button');
      const main = document.createElement('span');
      const label = document.createElement('span');
      const preview = document.createElement('span');
      const timestamp = document.createElement('time');
      const arrow = document.createElement('span');
      button.type = 'button';
      button.className = 'history-entry';
      button.dataset.historyId = entry.id;
      main.className = 'history-entry-main';
      label.className = 'history-entry-label';
      preview.className = 'history-entry-preview';
      timestamp.dateTime = new Date(entry.createdAt).toISOString();
      arrow.className = 'history-entry-arrow';
      label.textContent = historyLabel(entry);
      preview.textContent = entry.input.replace(/\s+/g, ' ').trim();
      timestamp.textContent = new Date(entry.createdAt).toLocaleString();
      arrow.textContent = '↗';
      main.append(label, preview);
      button.append(main, timestamp, arrow);
      historyList.append(button);
    });
  }

  function addHistory() {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      reversed,
      formatType: selectedFormatType(),
      jsonFormat: selectedFormat(),
      input: phpInput.value,
      output: jsonOutput.value,
    };
    const history = getHistory().filter((item) => item.input !== entry.input || item.output !== entry.output || item.reversed !== entry.reversed || item.formatType !== entry.formatType);
    history.unshift(entry);
    saveHistory(history);
    renderHistory();
  }

  function restoreHistory(entry) {
    const formatInput = document.querySelector(`input[name="formatType"][value="${entry.formatType}"]`);
    const jsonFormatInput = document.querySelector(`input[name="format"][value="${entry.jsonFormat}"]`);
    if (formatInput) formatInput.checked = true;
    if (jsonFormatInput) jsonFormatInput.checked = true;
    reversed = Boolean(entry.reversed);
    updateDirection();
    phpInput.value = entry.input;
    jsonOutput.value = entry.output;
    hasParsedValue = true;
    copyButton.disabled = false;
    outputWrap.classList.add('has-output');
    updateCount();
    renderInputHighlight();
    renderOutputHighlight();
    setStatus('success', 'History entry restored');
    phpInput.focus();
  }

  function selectedFormatType() {
    return document.querySelector('input[name="formatType"]:checked').value;
  }

  function selectedFormat() {
    return document.querySelector('input[name="format"]:checked').value;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[character]));
  }

  function highlightPhpSerialized(value) {
    return escapeHtml(value).replace(/(^|[;{])([NbisdaO])(?=[:;])/g, '$1<span class="token-type">$2</span>')
      .replace(/(?<=:)(-?\d+(?:\.\d+)?)(?=[:;{])/g, '<span class="token-number">$1</span>')
      .replace(/(&quot;)(.*?)(?=&quot;)/g, '$1<span class="token-string">$2</span>')
      .replace(/([:{};])/g, '<span class="token-punctuation">$1</span>');
  }

  function highlightJson(value) {
    return escapeHtml(value).replace(/(&quot;(?:\\.|[^&])*?&quot;)(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?/g, (match, string, key, boolean) => {
      if (string) return `<span class="${key ? 'token-key' : 'token-string'}">${string}</span>${key || ''}`;
      if (boolean) return `<span class="token-boolean">${boolean}</span>`;
      if (match === 'null') return '<span class="token-null">null</span>';
      return `<span class="token-number">${match}</span>`;
    }).replace(/([{}\[\],:])/g, '<span class="token-punctuation">$1</span>');
  }

  function syncHighlight(textarea, highlight) {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  }

  function isJsonToPhp() {
    return reversed;
  }

  function renderInputHighlight() {
    const isJsonInput = isJsonToPhp();
    phpHighlight.innerHTML = (isJsonInput ? highlightJson(phpInput.value) : highlightPhpSerialized(phpInput.value)) || ' ';
    syncHighlight(phpInput, phpHighlight);
  }

  function renderOutputHighlight() {
    const isPhpOutput = isJsonToPhp();
    jsonHighlight.innerHTML = (isPhpOutput ? highlightPhpSerialized(jsonOutput.value) : highlightJson(jsonOutput.value)) || ' ';
    syncHighlight(jsonOutput, jsonHighlight);
  }

  function renderOutput() {
    if (!hasParsedValue) return;
    jsonOutput.value = isJsonToPhp()
      ? ({ serialized: serializePhp, array: formatPhpArray, vardump: formatPhpVarDump }[selectedFormatType()](parsedValue))
      : JSON.stringify(parsedValue, null, selectedFormat() === 'tidy' ? 2 : 0);
    renderOutputHighlight();
    outputWrap.classList.add('has-output');
  }

  function setStatus(type, message) {
    status.className = `status${type ? ` ${type}` : ''}`;
    statusText.textContent = message;
  }

  function updateCount() {
    const count = Array.from(phpInput.value).length;
    inputCount.textContent = `${count.toLocaleString()} ${count === 1 ? 'character' : 'characters'}`;
  }

  function convert() {
    if (!phpInput.value.trim()) {
      hasParsedValue = false;
      jsonOutput.value = '';
      renderOutputHighlight();
      outputWrap.classList.remove('has-output');
      copyButton.disabled = true;
      setStatus('error', `Paste ${isJsonToPhp() ? 'valid JSON' : 'the selected PHP data'} first`);
      phpInput.focus();
      return;
    }

    try {
      const parsers = {
        serialized: parsePhpSerialized,
        array: parsePhpArray,
        vardump: parsePhpVarDump,
      };
      parsedValue = isJsonToPhp() ? JSON.parse(phpInput.value) : parsers[selectedFormatType()](phpInput.value);
      hasParsedValue = true;
      renderOutput();
      copyButton.disabled = false;
      addHistory();
      setStatus('success', isJsonToPhp() ? 'Serialized to PHP successfully' : 'Converted to JSON successfully');
    } catch (error) {
      hasParsedValue = false;
      jsonOutput.value = '';
      renderOutputHighlight();
      outputWrap.classList.remove('has-output');
      copyButton.disabled = true;
      setStatus('error', error instanceof Error ? error.message : 'Unable to parse the input');
    }
  }

  async function copyOutput() {
    if (!jsonOutput.value) return;
    try {
      await navigator.clipboard.writeText(jsonOutput.value);
      copyButton.textContent = 'Copied!';
      setStatus('success', 'JSON copied to clipboard');
      window.setTimeout(() => { copyButton.textContent = 'Copy'; }, 1400);
    } catch (_error) {
      jsonOutput.select();
      document.execCommand('copy');
      copyButton.textContent = 'Copied!';
      window.setTimeout(() => { copyButton.textContent = 'Copy'; }, 1400);
    }
  }

  function clearAll() {
    phpInput.value = '';
    jsonOutput.value = '';
    renderInputHighlight();
    renderOutputHighlight();
    parsedValue = undefined;
    hasParsedValue = false;
    copyButton.disabled = true;
    outputWrap.classList.remove('has-output');
    setStatus('', 'Ready to convert');
    updateCount();
    phpInput.focus();
  }

  function updateDirection() {
    const type = selectedFormatType();
    const phpFormats = {
      serialized: { name: 'PHP serialized', output: 'PHP serialized output', button: 'Convert to JSON', placeholder: 'a:2:{s:4:"name";s:4:"Abay";s:6:"active";b:1;}', example: phpExample },
      array: { name: 'PHP array', output: 'PHP array output', button: 'Convert to JSON', placeholder: "['name' => 'Abay', 'active' => true]", example: phpArrayExample },
      vardump: { name: 'PHP var_dump', output: 'PHP var_dump output', button: 'Convert to JSON', placeholder: 'array(1) {\n  ["name"]=>\n  string(4) "Abay"\n}', example: varDumpExample },
    };
    const format = phpFormats[type];
    const jsonToPhp = isJsonToPhp();
    inputTitle.textContent = jsonToPhp ? 'JSON input' : `${format.name} input`;
    inputLabel.textContent = inputTitle.textContent;
    outputTitle.textContent = jsonToPhp ? format.output : 'JSON output';
    outputLabel.textContent = outputTitle.textContent;
    convertLabel.textContent = jsonToPhp ? `Create ${format.name}` : format.button;
    phpInput.placeholder = jsonToPhp ? '{\n  "name": "Abay",\n  "active": true\n}' : format.placeholder;
    jsonOutput.placeholder = jsonToPhp ? `Your ${format.name.toLowerCase()} will appear here...` : 'Your converted JSON will appear here...';
    formatSwitcher.disabled = jsonToPhp;
    exampleButton.dataset.example = jsonToPhp ? jsonExample : format.example;
    reverseButton.setAttribute('aria-pressed', String(jsonToPhp));
    reverseButton.lastElementChild.textContent = jsonToPhp ? 'Forward' : 'Reverse';
    clearAll();
  }

  convertButton.addEventListener('click', convert);
  clearButton.addEventListener('click', clearAll);
  copyButton.addEventListener('click', copyOutput);
  phpInput.addEventListener('input', () => {
    updateCount();
    renderInputHighlight();
  });
  phpInput.addEventListener('scroll', () => syncHighlight(phpInput, phpHighlight));
  jsonOutput.addEventListener('scroll', () => syncHighlight(jsonOutput, jsonHighlight));
  exampleButton.addEventListener('click', () => {
    phpInput.value = exampleButton.dataset.example;
    updateCount();
    renderInputHighlight();
    convert();
  });
  formatInputs.forEach((input) => input.addEventListener('change', renderOutput));
  reverseButton.addEventListener('click', () => {
    reversed = !reversed;
    updateDirection();
  });
  formatTypeInputs.forEach((input) => input.addEventListener('change', updateDirection));
  clearHistoryButton.addEventListener('click', () => {
    try { localStorage.removeItem(HISTORY_KEY); } catch (_error) { /* storage may be unavailable */ }
    renderHistory();
    setStatus('', 'History cleared');
  });
  historyList.addEventListener('click', (event) => {
    const button = event.target.closest('.history-entry');
    if (!button) return;
    const entry = getHistory().find((item) => item.id === button.dataset.historyId);
    if (entry) restoreHistory(entry);
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      convert();
    }
  });

  updateDirection();
  renderHistory();
  renderInputHighlight();
  renderOutputHighlight();
}(typeof window !== 'undefined' ? window : globalThis));
