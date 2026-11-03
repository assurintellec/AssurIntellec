const test = require('node:test');
const assert = require('node:assert/strict');
const { measureViewport, init } = require('../assets/responsive-layout.js');

test('Visible area follows a keyboard without subtracting it twice', () => {
  assert.deepEqual(measureViewport(844, {height: 480, offsetTop: 0, scale: 1}), {height: 480, top: 0, bottom: 364});
  assert.deepEqual(measureViewport(480, {height: 480, offsetTop: 0, scale: 1}), {height: 480, top: 0, bottom: 0});
});
test('Panned visual area and rotation stay within the current layout viewport', () => {
  assert.deepEqual(measureViewport(844, {height: 410, offsetTop: 120, scale: 1}), {height: 410, top: 120, bottom: 314});
  assert.deepEqual(measureViewport(390, {height: 390, offsetTop: 120, scale: 1}), {height: 390, top: 0, bottom: 0});
  assert.deepEqual(measureViewport(390, {height: 900, offsetTop: -10, scale: 1}), {height: 390, top: 0, bottom: 0});
});
test('Missing or inactive viewport data has a usable fallback; pinch zoom is left alone', () => {
  assert.deepEqual(measureViewport(640), {height: 640, top: 0, bottom: 0});
  assert.deepEqual(measureViewport(640, {height: 0, offsetTop: NaN}), {height: 640, top: 0, bottom: 0});
  assert.equal(measureViewport(0), null);
  assert.equal(measureViewport(NaN), null);
  assert.equal(measureViewport(844, {height: 400, scale: 2}), null);
});
test('Viewport updates coalesce and recover after back navigation, without network work', () => {
  const values = {}, events = {}, docEvents = {}, viewportEvents = {}, frames = [];
  const html = {dataset:{}, clientHeight:844, style:{setProperty:(k,v)=>values[k]=v}, classList:{toggle:(k,v)=>values[k]=v}};
  const doc = {documentElement:html, activeElement:{matches:()=>false}, addEventListener:(k,v)=>docEvents[k]=v};
  const win = {document:doc, innerHeight:844, visualViewport:{height:844,scale:1,offsetTop:0,addEventListener:(k,v)=>viewportEvents[k]=v}, addEventListener:(k,v)=>events[k]=v, requestAnimationFrame:fn=>frames.push(fn)};
  init(win); init(win);
  assert.equal(values['--visible-viewport-height'],'844px');
  win.visualViewport.height=480; doc.activeElement={matches:()=>true};
  viewportEvents.resize(); docEvents.focusin();
  assert.equal(frames.length,1); frames.shift()();
  assert.equal(values['--visible-viewport-height'],'480px');
  assert.equal(values['--visual-viewport-bottom'],'364px');
  assert.equal(values['is-editing-field'],true);
  win.innerHeight=390;win.visualViewport.height=390;doc.activeElement={matches:()=>false};events.pageshow();frames.shift()();
  assert.equal(values['--visible-viewport-height'],'390px');
  assert.equal(values['--visual-viewport-bottom'],'0px');
  assert.equal(values['is-editing-field'],false);
});
