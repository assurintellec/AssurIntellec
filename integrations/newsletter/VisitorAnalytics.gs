/* Add this file to the SAME Apps Script project as newsletter/Code.gs.
   Set ANALYTICS_BRIDGE_TOKEN privately in both this project's Script Properties
   and the main website Worker's secrets. Never put that token in site.json. */
const VA_SHEET = 'Website Visits';
const VA_HEADERS = ['Page View ID', 'Session ID', 'Started At', 'Last Seen At', 'Page Path', 'Page Title', 'Active Seconds', 'IP Address', 'City', 'Region', 'Country', 'Timezone', 'Referrer Origin', 'Device', 'Sections Viewed', 'Consent', 'Sequence'];
function setupVisitorAnalytics() {
  const book = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(NL_SHEET_PROPERTY));
  const sheet = book.getSheetByName(VA_SHEET) || book.insertSheet(VA_SHEET);
  if (sheet.getMaxColumns() < VA_HEADERS.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), VA_HEADERS.length - sheet.getMaxColumns());
  const existing = sheet.getRange(1, 1, 1, VA_HEADERS.length).getValues()[0];
  if (existing.some((value, i) => value && value !== VA_HEADERS[i])) throw new Error('Website Visits headers do not match. Rename the existing tab before setup.');
  sheet.getRange(1, 1, 1, VA_HEADERS.length).setValues([VA_HEADERS]);
  vaStyle_(sheet, VA_HEADERS.length); sheet.setFrozenRows(1);
  sheet.getRange('C:D').setNumberFormat('dd-mmm-yyyy hh:mm:ss');
  sheet.getRange('H:Q').setNumberFormat('@'); sheet.getRange('Q:Q').setNumberFormat('0');
  sheet.getRange('G:G').setNumberFormat('0'); sheet.hideColumns(17);
  if (!sheet.getFilter()) sheet.getRange(1, 1, sheet.getMaxRows(), VA_HEADERS.length).createFilter();
  book.setSpreadsheetTimeZone('Asia/Kolkata');
  book.setRecalculationInterval(SpreadsheetApp.RecalculationInterval.MINUTE);
  const dashboard = book.getSheetByName('Visitor Dashboard') || book.insertSheet('Visitor Dashboard');
  dashboard.getRange('A1:G1').setValues([['Period', 'Page Views', 'Sessions', 'Active Minutes', 'Average Seconds / Page', 'From (IST)', 'To (IST)']]);
  const periods = [['Last 1 hour', 1 / 24], ['Last 2 hours', 2 / 24], ['Last 12 hours', 12 / 24], ['Last 24 hours', 1], ['Last 15 days', 15], ['Last 30 days', 30], ['Last 365 days', 365]];
  const r = "'" + VA_SHEET + "'!";
  periods.forEach((period, i) => {
    const n = i + 2;
    dashboard.getRange(n, 1).setValue(period[0]);
    dashboard.getRange(n, 6).setFormula('=NOW()-' + period[1]);
    dashboard.getRange(n, 7).setFormula('=NOW()');
    const condition = r + 'C2:C,">="&F' + n + ',' + r + 'C2:C,"<="&G' + n;
    dashboard.getRange(n, 2).setFormula('=COUNTIFS(' + condition + ')');
    dashboard.getRange(n, 3).setFormula('=IFERROR(COUNTUNIQUE(FILTER(' + r + 'B2:B,' + r + 'C2:C>=F' + n + ',' + r + 'C2:C<=G' + n + ',' + r + 'B2:B<>"")),0)');
    dashboard.getRange(n, 4).setFormula('=SUMIFS(' + r + 'G2:G,' + condition + ')/60');
    dashboard.getRange(n, 5).setFormula('=IFERROR(SUMIFS(' + r + 'G2:G,' + condition + ')/B' + n + ',0)');
  });
  dashboard.getRange('D2:E8').setNumberFormat('0.0'); dashboard.getRange('F2:G8').setNumberFormat('dd-mmm-yyyy hh:mm:ss');
  dashboard.getRange('A10').setValue('Counts use page views started within each rolling period. Sessions group pages from the same browser tab (reset after a 30-minute gap between recorded updates).');
  dashboard.getRange('A11').setValue('Active time counts visible pages with activity in the last 60 seconds; it is an estimate. Hidden and idle time is excluded.');
  dashboard.getRange('A12').setValue('Only tracked visits are included; consent choices, blockers and failed requests can reduce totals. IP location is approximate.');
  dashboard.getRange('A13').setValue('Use the date filters on Website Visits for any date/time range. All timestamps display in India Standard Time.');
  vaStyle_(dashboard, 7); dashboard.setFrozenRows(1); dashboard.autoResizeColumns(1, 7);
  const areas = book.getSheetByName('Visits By Area') || book.insertSheet('Visits By Area');
  areas.getRange('A1').setValue('Visits by country, region and city — all recorded dates');
  areas.getRange('A2').setFormula('=IFERROR(QUERY(\'' + VA_SHEET + '\'!A2:Q,"select K,J,I,count(A),sum(G) where A is not null group by K,J,I order by count(A) desc label K \'Country\',J \'Region\',I \'City\',count(A) \'Page Views\',sum(G) \'Active Seconds\'",0),"No visits yet")');
  vaStyle_(areas, 5); areas.setFrozenRows(2); areas.autoResizeColumns(1, 5);
  const pages = book.getSheetByName('Visits By Page') || book.insertSheet('Visits By Page');
  pages.getRange('A1').setValue('Visits by page — all recorded dates');
  pages.getRange('A2').setFormula('=IFERROR(QUERY(\'' + VA_SHEET + '\'!A2:Q,"select E,count(A),sum(G),avg(G) where A is not null group by E order by count(A) desc label E \'Page\',count(A) \'Page Views\',sum(G) \'Active Seconds\',avg(G) \'Average Seconds\'",0),"No visits yet")');
  vaStyle_(pages, 4); pages.setFrozenRows(2); pages.autoResizeColumns(1, 4);
  SpreadsheetApp.flush();
}
function vaStyle_(sheet, columns) { sheet.getRange(1, 1, 1, columns).setFontWeight('bold').setBackground('#0b1f3a').setFontColor('#ffffff'); }
function vaSafeCell_(value) { const text = String(value || '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, 3500); return /^[=+\-@]/.test(text) ? "'" + text : text; }
function vaRecord_(data) {
  const secret = PropertiesService.getScriptProperties().getProperty('ANALYTICS_BRIDGE_TOKEN') || '';
  if (secret.length < 32 || String(data.bridge_secret || '') !== secret) throw new Error('Unauthorized.');
  const payload = String(data.payload || '');
  if (payload.length > 8192) throw new Error('Too large.');
  const p = JSON.parse(payload), validId = /^[a-zA-Z0-9_-]{16,80}$/;
  if (!p || !validId.test(p.page_id || '') || !validId.test(p.session_id || '') || p.consent !== 'yes' || !Number.isInteger(p.sequence) || p.sequence < 1 || !Number.isFinite(p.started_at) || !Number.isFinite(p.active_seconds) || p.active_seconds < 0) throw new Error('Invalid visit.');
  if (!String(p.path || '').startsWith('/') || String(p.path).startsWith('//')) throw new Error('Invalid page.');
  const now = new Date(), started = new Date(p.started_at);
  if (started.getTime() > now.getTime() + 60000 || started.getTime() < now.getTime() - 7 * 86400000) throw new Error('Invalid start time.');
  const seconds = Math.floor(Math.min(p.active_seconds, Math.max(0, (now.getTime() - started.getTime()) / 1000), 7 * 86400));
  const sections = Array.isArray(p.sections) ? [...new Set(p.sections.slice(0, 35).map(value => String(value).slice(0, 90)))].join(' | ') : '';
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const book = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(NL_SHEET_PROPERTY));
    const sheet = book.getSheetByName(VA_SHEET);
    if (!sheet) throw new Error('Run setupVisitorAnalytics first.');
    const match = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(p.page_id).matchEntireCell(true).findNext() : null;
    if (match) {
      const row = match.getRow(), previous = sheet.getRange(row, 1, 1, VA_HEADERS.length).getValues()[0];
      if (String(previous[1]) !== p.session_id) throw new Error('Session mismatch.');
      // Cumulative duration + monotonically increasing sequence make unload retries safe.
      if (Number(previous[16]) >= p.sequence) return { success: true };
      previous[3] = now; previous[6] = Math.max(Number(previous[6]) || 0, seconds);
      previous[14] = vaSafeCell_([...new Set(String(previous[14] || '').replace(/^'/, '').split(' | ').concat(sections.split(' | ')).filter(Boolean))].slice(0, 35).join(' | '));
      previous[16] = p.sequence;
      sheet.getRange(row, 1, 1, VA_HEADERS.length).setValues([previous]);
    } else {
      sheet.appendRow([p.page_id, p.session_id, started, now, vaSafeCell_(p.path.split(/[?#]/)[0]), vaSafeCell_(p.title), seconds, vaSafeCell_(p.ip), vaSafeCell_(p.city), vaSafeCell_(p.region), vaSafeCell_(p.country), vaSafeCell_(p.timezone), vaSafeCell_(p.referrer), vaSafeCell_(p.device), vaSafeCell_(sections), 'Yes', p.sequence]);
    }
    SpreadsheetApp.flush();
    return { success: true };
  } finally { lock.releaseLock(); }
}
