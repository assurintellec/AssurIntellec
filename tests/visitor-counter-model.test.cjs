const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'integrations', 'Code.gs'), 'utf8');
const properties = new Map();
const sheets = new Map();
let publishedCounterConfig = {
  enabled: true,
  label: 'Website Visitors',
  starting_count: 0,
  baseline_version: '',
  counting_policy: 'session',
  number_format: 'thousands',
  counter_animation: true,
  animation_duration_ms: 500,
  legacy_import_enabled: true,
  namespace: 'assurintellec.in',
  action: 'view',
  key: 'website-visitors'
};
let lockAcquireCount = 0;

class MockSheet {
  constructor(name) { this.name = name; this.rows = []; }
  getLastRow() { return this.rows.length; }
  setFrozenRows() {}
  getRange(row, col, rowCount, colCount) {
    const self = this;
    return {
      setValues(values) {
        values.forEach((valuesRow, i) => {
          const target = row - 1 + i;
          while (self.rows.length <= target) self.rows.push([]);
          valuesRow.forEach((value, j) => { self.rows[target][col - 1 + j] = value; });
        });
      },
      createTextFinder(needle) {
        const finder = {
          matchEntireCell() { return finder; },
          findNext() {
            for (let i = row - 1; i < self.rows.length; i += 1) {
              if (String(self.rows[i]?.[col - 1] ?? '') === String(needle)) return { row: i + 1 };
            }
            return null;
          }
        };
        return finder;
      }
    };
  }
  appendRow(values) { this.rows.push(values.slice()); }
}
const spreadsheet = {
  getSheetByName(name) { return sheets.get(name) || null; },
  insertSheet(name) { const sheet = new MockSheet(name); sheets.set(name, sheet); return sheet; }
};
const lock = {
  waitLock() { lockAcquireCount += 1; },
  releaseLock() {}
};
const ctx = {
  console,
  Date,
  JSON,
  Math,
  String,
  Number,
  Boolean,
  Object,
  Array,
  RegExp,
  Error,
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty: key => properties.has(key) ? properties.get(key) : null,
        setProperty: (key, value) => { properties.set(key, String(value)); },
        deleteProperty: key => properties.delete(key)
      };
    }
  },
  LockService: { getScriptLock: () => lock },
  SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
  Session: { getScriptTimeZone: () => 'Asia/Kolkata' },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF-8' },
    computeDigest(_algorithm, input) { return [...crypto.createHash('sha256').update(String(input), 'utf8').digest()].map(x => x > 127 ? x - 256 : x); },
    formatDate() { return '2026-10-14'; }
  },
  UrlFetchApp: {
    fetch(url) {
      const text = String(url);
      if (text.includes('/content/site.json')) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ visitor_counter: publishedCounterConfig }) };
      if (text.startsWith('https://counterapi.com/api/')) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ value: 12850 }) };
      throw new Error('Unexpected mocked URL: ' + text);
    }
  }
};
vm.createContext(ctx);
vm.runInContext(source, ctx, { filename: 'Code.gs' });
const req = (sessionId, extra = {}) => ctx.processVisitorCounterRequest({ session_id: sessionId, counting_policy: 'session', ...extra });
const assert = (condition, message) => { if (!condition) throw new Error('ASSERTION FAILED: ' + message); };

assert(ctx.normalizeMailWorkerBaseUrl('https://mail.example.workers.dev') === 'https://mail.example.workers.dev', 'base Worker URL should remain unchanged');
assert(ctx.normalizeMailWorkerBaseUrl('https://mail.example.workers.dev/send') === 'https://mail.example.workers.dev', 'a saved /send route should normalize to the Worker base');
assert(ctx.normalizeMailWorkerBaseUrl('https://mail.example.workers.dev/health/') === 'https://mail.example.workers.dev', 'a saved /health route should normalize to the Worker base');

const a = 'session-token-00000000000001';
const b = 'session-token-00000000000002';
const c = 'session-token-00000000000003';
const first = req(a);
assert(first.success && first.count === 12851, 'one-time legacy import plus first counted visit should yield 12,851');
const refresh = req(a);
assert(refresh.success && refresh.count === 12851, 'same session refresh should not increment again');
const secondSession = req(b);
assert(secondSession.success && secondSession.count === 12852, 'a second session should increment the shared total');

publishedCounterConfig = { ...publishedCounterConfig, starting_count: 13020, baseline_version: '2026-10-14-manual-reset' };
const afterReset = req(a);
assert(afterReset.success && afterReset.count === 13021, 'new baseline must apply once, then count this as the first visit');
const afterReset2 = req(c);
assert(afterReset2.success && afterReset2.count === 13022, 'next visit after baseline reset should increment once');

publishedCounterConfig = { ...publishedCounterConfig, starting_count: 7777 };
const noResetWithoutVersionChange = req('session-token-00000000000004');
assert(noResetWithoutVersionChange.success && noResetWithoutVersionChange.count === 13023, 'changing starting_count without changing baseline_version must not reset total');
const forgedAdminParams = req('session-token-00000000000005', { starting_count: 1, baseline_version: 'forged-reset' });
assert(forgedAdminParams.success && forgedAdminParams.count === 13024, 'anonymous request parameters must not control the baseline');
assert(lockAcquireCount >= 6, 'each count operation must acquire the lock around the read/modify/write sequence');
const sessionSheet = sheets.get('Visitor Sessions');
assert(sessionSheet && sessionSheet.rows.length === 7, 'sheet should contain header plus six distinct counted session/baseline records');
console.log(JSON.stringify({
  result: 'PASS',
  workerUrlNormalization: 'PASS',
  legacyImportAndIncrement: first.count,
  refreshDeduplication: refresh.count,
  secondSession: secondSession.count,
  baselineReset: afterReset.count,
  nextVisitAfterReset: afterReset2.count,
  unchangedVersionDoesNotReset: noResetWithoutVersionChange.count,
  clientSuppliedBaselineIgnored: forgedAdminParams.count,
  lockAcquisitions: lockAcquireCount,
  visitorSessionRowsIncludingHeader: sessionSheet.rows.length,
  caveat: 'Mocked Apps Script services validate local logic only; deploy/live Google Sheets, real concurrency, browser behavior, and mail delivery still require live checks.'
}, null, 2));
