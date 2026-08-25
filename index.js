const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
// API key is kept server-side. Do not put it in public/ files.
// The supplied Telegram SC uses the same header for sendv2.
const AM_API_KEY = process.env.AM_API_KEY || 'ISI_API_KEY_SEND_LINK_ANDA';
const SEND_LINK_URL = 'https://api.alwayscodex.eu.cc/api/am/sendv2';
const VERIF_URL = 'https://api.alwayscodex.eu.cc/api/am/verifv2';
const TELEGRAM_BUG_URL = 'https://t.me/key270811';
const PUBLIC = __dirname;

const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.ico':'image/x-icon'
};

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let raw='';
    req.on('data', c => { raw += c; if(raw.length > 64*1024) { req.destroy(); reject(new Error('Payload terlalu besar')); } });
    req.on('end',()=>{ try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON tidak valid')); } });
    req.on('error',reject);
  });
}
async function forward(url, payload, headers={}) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 20000);
  try {
    const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json', ...headers}, body:JSON.stringify(payload), signal:controller.signal});
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw:text }; }
    return { status:r.status, ok:r.ok, data };
  } finally { clearTimeout(timer); }
}
function validateEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validateLink(link){ return /^https?:\/\//i.test(link); }

const server = http.createServer(async (req,res)=>{
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if(req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}); return res.end(); }
  if(req.method === 'GET' && u.pathname === '/api/health') return json(res,200,{success:true,status:'online',service:'KEY AM PREMIUM',time:new Date().toISOString()});
  if(req.method === 'GET' && u.pathname === '/api/config') return json(res,200,{success:true,telegramBug:TELEGRAM_BUG_URL});
  if(req.method === 'POST' && u.pathname === '/api/am/sendv2') {
    try {
      const body = await readBody(req); const email=String(body.email||'').trim();
      if(!validateEmail(email)) return json(res,400,{success:false,message:'Email belum valid.'});
      if(!AM_API_KEY || AM_API_KEY === 'ISI_API_KEY_SEND_LINK_ANDA') return json(res,503,{success:false,message:'API Premium belum dikonfigurasi di server. Isi AM_API_KEY pada environment server atau index.js.'});
      const out=await forward(SEND_LINK_URL,{email},{'x-api-key':AM_API_KEY});
      return json(res,out.status || 502, out.data && typeof out.data==='object' ? out.data : {success:false,message:'Respons API tidak valid.'});
    } catch(e) { console.error('sendv2:',e); return json(res,502,{success:false,message:e.name==='AbortError'?'API timeout. Coba lagi.':'Gagal terhubung ke API Premium.'}); }
  }
  if(req.method === 'POST' && u.pathname === '/api/am/verifv2') {
    try {
      const body=await readBody(req); const email=String(body.email||'').trim(); const link=String(body.link||'').trim();
      if(!validateEmail(email)) return json(res,400,{success:false,message:'Email belum valid.'});
      if(!validateLink(link)) return json(res,400,{success:false,message:'Link login belum valid.'});
      const out=await forward(VERIF_URL,{email,link});
      return json(res,out.status || 502, out.data && typeof out.data==='object' ? out.data : {success:false,message:'Respons API tidak valid.'});
    } catch(e) { console.error('verifv2:',e); return json(res,502,{success:false,message:e.name==='AbortError'?'Verifikasi timeout. Coba lagi.':'Gagal terhubung ke API verifikasi.'}); }
  }
  if(req.method !== 'GET') return json(res,405,{success:false,message:'Method tidak diizinkan.'});
  let pathname = decodeURIComponent(u.pathname); if(pathname === '/') pathname='/index.html';
  const file = path.normalize(path.join(PUBLIC, pathname));
  if(!file.startsWith(PUBLIC + path.sep) && file !== PUBLIC) return json(res,403,{success:false,message:'Forbidden'});
  fs.readFile(file,(err,data)=>{ if(err) return json(res,404,{success:false,message:'Halaman tidak ditemukan.'}); const ext=path.extname(file).toLowerCase(); res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':ext==='.html'?'no-store':'public,max-age=3600'}); res.end(data); });
});
server.listen(PORT,()=>console.log(`KEY AM PREMIUM aktif di http://localhost:${PORT}`));
