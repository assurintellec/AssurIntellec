// D1 implementation for the private Sites deployment. The original Cloudflare
// Durable Object implementation is retained in website/visitor-counter.js.
const WINDOW_MS = 30 * 60 * 1000;
const COOKIE = 'assurintellec_visit';
const tokenOK = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{20,100}$/.test(value);
const whole = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
export const json = (body, status=200, extra={}) => new Response(JSON.stringify(body), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff',...extra}});
export async function handleCounter(request, db, cfg={}, now=Date.now()) {
  if (!['GET','POST'].includes(request.method)) return json({error:'Method not allowed'},405,{allow:'GET, POST'});
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return json({error:'Origin not allowed'},403);
  if (cfg.enabled === false) return json({enabled:false});
  const identity = JSON.stringify([cfg.namespace || 'assurintellec.in',cfg.action || 'view',cfg.key || 'website-visitors']);
  let token;
  if (request.method === 'POST') {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'JSON required'},415);
    if (Number(request.headers.get('content-length')) > 1024) return json({error:'Request too large'},413);
    let body='';
    if(request.body) {
      const reader=request.body.getReader(); const decoder=new TextDecoder(); let size=0;
      while(true) {
        const part=await reader.read(); if(part.done)break;
        size+=part.value.byteLength;
        if(size>1024){await reader.cancel();return json({error:'Request too large'},413);}
        body+=decoder.decode(part.value,{stream:true});
      }
      body+=decoder.decode();
    }
    let data; try {data=JSON.parse(body);} catch {return json({error:'Invalid JSON'},400);}
    const cookie=(request.headers.get('cookie') || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
    token=tokenOK(cookie)?cookie:data?.visit_id;
    if(!tokenOK(token))return json({error:'Invalid visit token'},400);
  }
  if(!db)return json({error:'Visitor storage unavailable'},503);
  try {
    let value;
    if(token) {
      // D1 batch is transactional. A unique receipt marks the winning insert;
      // duplicate requests cannot increment twice and simultaneous visits add up.
      const receipt=crypto.randomUUID();
      const results=await db.batch([
        db.prepare('INSERT OR IGNORE INTO visit_totals(identity, visits) VALUES (?, 0)').bind(identity),
        db.prepare('DELETE FROM visit_sessions WHERE identity = ? AND expires <= ?').bind(identity,now),
        db.prepare('INSERT OR IGNORE INTO visit_sessions(identity, token, expires, receipt) VALUES (?, ?, ?, ?)').bind(identity,token,now+WINDOW_MS,receipt),
        db.prepare('UPDATE visit_totals SET visits = visits + (SELECT count(*) FROM visit_sessions WHERE identity = ? AND token = ? AND receipt = ?) WHERE identity = ?').bind(identity,token,receipt,identity),
        db.prepare('UPDATE visit_sessions SET expires = ? WHERE identity = ? AND token = ?').bind(now+WINDOW_MS,identity,token),
        db.prepare('SELECT visits FROM visit_totals WHERE identity = ?').bind(identity),
      ]);
      value=results.at(-1).results[0].visits;
    } else {
      value=(await db.prepare('SELECT visits FROM visit_totals WHERE identity = ?').bind(identity).first())?.visits || 0;
    }
    const start=whole(cfg.start_value);
    if(!Number.isSafeInteger(value)||value<0||!Number.isSafeInteger(start+value))throw new Error('Invalid total');
    return json({value,start_value:start,total:start+value},200,token?{'set-cookie':`${COOKIE}=${token}; Path=/; Max-Age=1800; HttpOnly; SameSite=Lax${url.protocol==='https:'?'; Secure':''}`}:{ });
  } catch(error) {
    console.error('Visitor counter:',error instanceof Error?error.message:'Storage error');
    return json({error:'Visitor count is being refreshed'},503);
  }
}
