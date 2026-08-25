const $=id=>document.getElementById(id);
const pages=[...document.querySelectorAll('.page')];
const drawer=$('drawer'),overlay=$('overlay');
function openDrawer(){drawer.classList.add('open');overlay.classList.add('show')}
function closeDrawer(){drawer.classList.remove('open');overlay.classList.remove('show')}
function showPage(id){const target=$(id);if(!target)return;pages.forEach(p=>p.classList.toggle('active',p===target));closeDrawer();window.scrollTo({top:0,behavior:'smooth'});history.replaceState(null,'','#'+id)}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$('menuBtn').addEventListener('click',openDrawer);overlay.addEventListener('click',closeDrawer);
function bug(){window.open('https://t.me/key270811','_blank','noopener,noreferrer')}
$('bugTop').addEventListener('click',bug);$('bugDrawer').addEventListener('click',bug);$('bugGuide').addEventListener('click',bug);
function setStep(n){for(let i=1;i<=3;i++){const el=$('st'+i);el.classList.toggle('on',i===n);el.classList.toggle('done',i<n)}}
function notice(text,ok=false){const n=$('notice');n.textContent=text;n.className='notice show'+(ok?' ok':'')}
function clearNotice(){$('notice').className='notice';$('notice').textContent=''}
function busy(btn,on,label){btn.disabled=on;if(on){btn.dataset.original=btn.textContent;btn.textContent=label}else btn.textContent=btn.dataset.original||btn.textContent}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
function validLink(v){return /^https?:\/\//i.test(v)}
async function api(path,payload){let response;try{response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});}catch(e){throw new Error('Tidak bisa terhubung ke server web. Coba refresh atau laporkan bug.')};let data=null;try{data=await response.json()}catch{}if(!response.ok){throw new Error(data?.message||`Server mengembalikan HTTP ${response.status}.`)}return data||{}}
$('sendBtn').addEventListener('click',async()=>{const email=$('email').value.trim();if(!validEmail(email)){notice('❌ Email belum valid. Contoh: nama@gmail.com');return}const btn=$('sendBtn');busy(btn,true,'Mengirim...');notice('⏳ Mengirim login link...');setStep(1);try{const d=await api('/api/am/sendv2',{email});if(d.success===false)throw new Error(d.message||'Gagal mengirim login link.');$('emailBox').hidden=true;$('verifyBox').hidden=false;setStep(2);notice('✅ Login link berhasil dikirim. Cek inbox dan folder spam.',true)}catch(e){notice('❌ '+e.message)}finally{busy(btn,false)}});
$('verifyBtn').addEventListener('click',async()=>{const email=$('email').value.trim(),link=$('link').value.trim();if(!validEmail(email)){notice('❌ Email tidak valid.');return}if(!validLink(link)){notice('❌ Link belum valid. Masukkan link lengkap yang diawali http:// atau https://');return}const btn=$('verifyBtn');busy(btn,true,'Memverifikasi...');notice('⏳ Memproses verifikasi Premium...');try{const d=await api('/api/am/verifv2',{email,link});const msg=String(d.message||'').trim();if(d.success!==true&&msg!=='Premium berhasil diterapkan')throw new Error(msg||'Verifikasi gagal.');$('verifyBox').hidden=true;$('doneBox').hidden=false;setStep(3);notice('✅ Premium berhasil diaktifkan.',true)}catch(e){notice('❌ '+e.message)}finally{busy(btn,false)}});
$('resetBtn').addEventListener('click',()=>{$('email').value='';$('link').value='';$('emailBox').hidden=false;$('verifyBox').hidden=true;$('doneBox').hidden=true;clearNotice();setStep(1)});
async function health(){try{const r=await fetch('/api/health',{cache:'no-store'});const d=await r.json();$('systemStatus').textContent=d.success?'Online':'Offline';$('systemTime').textContent=d.success?new Date(d.time).toLocaleTimeString('id-ID'):''}catch{$('systemStatus').textContent='Gangguan';$('systemTime').textContent='cek koneksi'}}
setInterval(health,30000);health();
const initial=location.hash.replace('#','');if(initial&&$(initial))showPage(initial);else showPage('home');
setTimeout(()=>{const l=$('loader');l.style.opacity='0';setTimeout(()=>l.remove(),550)},1200);
