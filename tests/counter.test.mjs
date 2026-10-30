import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync } from 'node:fs';
import assert from 'node:assert/strict';
import { handleCounter } from '../lib/visitor-counter.mjs';
const file='/tmp/assurintellec-counter-test.sqlite';try{rmSync(file);}catch{}
let sqlite;
function open(){sqlite=new DatabaseSync(file);}
open();sqlite.exec(readFileSync('drizzle/0000_wild_joshua_kane.sql','utf8').replaceAll('--> statement-breakpoint',''));
const db={
  prepare(sql){return {bind(...args){return {sql,args,async first(){return sqlite.prepare(sql).get(...args);}};}};},
  async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const result=statements.map(({sql,args})=>{const stmt=sqlite.prepare(sql);if(sql.startsWith('SELECT'))return {results:stmt.all(...args)};stmt.run(...args);return {results:[]};});sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}
};
const cfg={enabled:true,start_value:148160,namespace:'assurintellec.in',action:'view',key:'website-visitors'};
const token=n=>`test-visit-${String(n).padStart(24,'0')}`;
const request=(id,options={})=>new Request('https://private.test/api/visitor-count',{method:'POST',headers:{'content-type':'application/json',origin:'https://private.test',...options.headers},body:JSON.stringify({visit_id:id})});
let now=1000000;
async function post(id,config=cfg,time=now,opts){return handleCounter(request(id,opts),db,config,time);}
const body=async r=>{assert.equal(r.status,200);return r.json();};
assert.deepEqual(await body(await handleCounter(new Request('https://private.test/api/visitor-count'),db,cfg)),{value:0,start_value:148160,total:148160});
let first=await post(token(1));assert.match(first.headers.get('set-cookie'),/HttpOnly; SameSite=Lax; Secure/);assert.equal((await body(first)).total,148161);
assert.equal((await body(await post(token(1)))).value,1);
const simultaneous=await Promise.all(Array.from({length:20},(_,i)=>post(token(i+2))));
await Promise.all(simultaneous.map(body));assert.equal((await body(await post(token(1)))).value,21);
await Promise.all(Array.from({length:20},()=>post(token(1))));assert.equal((await body(await post(token(1)))).value,21);
assert.equal((await body(await post(token(90),cfg,now,{headers:{cookie:`assurintellec_visit=${token(1)}`}}))).value,21);
sqlite.close();open();assert.equal((await body(await post(token(1)))).value,21);
assert.equal((await body(await post(token(1),{...cfg,start_value:200000}))).total,200021);
assert.equal((await body(await post(token(1),{...cfg,key:'separate'}))).value,1);
assert.equal((await body(await post(token(1),cfg,now+29*60000))).value,21);
assert.equal((await body(await post(token(1),cfg,now+31*60000))).value,21);
assert.equal((await body(await post(token(1),cfg,now+62*60000))).value,22);
assert.deepEqual(await body(await post(token(100),{...cfg,enabled:false})),{enabled:false});
assert.equal((await post('short')).status,400);
assert.equal((await post(token(1),cfg,now,{headers:{origin:'https://elsewhere.test'}})).status,403);
assert.equal((await post(token(1),cfg,now,{headers:{'content-type':'text/plain'}})).status,415);
assert.equal((await handleCounter(new Request('https://private.test/api/visitor-count',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(1025)}),db,cfg)).status,413);
assert.equal((await handleCounter(new Request('https://private.test/api/visitor-count',{method:'POST',headers:{'content-type':'application/json'},body:'{'}),db,cfg)).status,400);
assert.equal((await handleCounter(new Request('https://private.test/api/visitor-count',{method:'DELETE'}),db,cfg)).status,405);
sqlite.close();rmSync(file);
console.log('PASS: starting offset, GET, new visits, concurrent increments, duplicates, cookies, restart persistence, edited offset, namespace, sliding expiry, disabled state, and invalid/cross-origin/oversized requests.');
