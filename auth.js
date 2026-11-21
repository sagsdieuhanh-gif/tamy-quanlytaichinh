/* Mộc Finance · Supabase Auth + personal cloud backup.
   Uses a public publishable key. Never place service_role/secret keys in the browser. */
(() => {
  'use strict';
  const config = window.MOC_SUPABASE_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url || '') && /^sb_publishable_/.test(config.publishableKey || '');
  if (!configured) {
    window.MocCloud = { enabled: false, accountPanel: () => '', boot: () => {} };
    return;
  }
  document.documentElement.classList.add('cloud-locked');
  if (typeof window.supabase?.createClient !== 'function') {
    window.MocCloud = {enabled:true, save:()=>false, accountPanel:()=>'', boot:()=>{
      const g=document.createElement('div');g.id='moc-account-gate';
      g.innerHTML='<div class="account-loading"><div class="account-mark">m.</div><h2>Không kết nối được hệ thống đăng nhập</h2><p>Hãy kết nối Internet rồi tải lại trang để sử dụng Mộc Finance.</p><button class="auth-submit" onclick="location.reload()" style="max-width:240px">Tải lại trang</button></div>';
      document.body.appendChild(g);
    }};
    return;
  }
  const supa = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  const redirect = location.origin + location.pathname;
  const escape = x => String(x || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[c]));
  const CACHE_PREFIX = 'moc-finance-cloud-';
  const sync = { status:'Đang kết nối', user:null, bridge:null, loading:null, ready:false, pending:false, inFlight:false, version:0, timer:null, gate:'signin', notice:'', error:'' };
  let root = null;

  function ensureGate(){
    if(!root){
      root = document.createElement('div');
      root.id = 'moc-account-gate';
      document.body.appendChild(root);
    }
    return root;
  }
  function message(kind=''){
    if(sync.error) return '<div class="account-message account-error" role="alert">' + escape(sync.error) + '</div>';
    if(sync.notice) return '<div class="account-message" role="status">' + escape(sync.notice) + '</div>';
    if(kind === 'signin') return '<p class="account-helper">Đăng nhập để xem ví, ngân sách và giao dịch trên mọi thiết bị.</p>';
    return '';
  }
  function form(mode){
    const signup=mode==='signup', recover=mode==='recover', reset=mode==='reset';
    const title=signup?'Tạo tài khoản':recover?'Quên mật khẩu?':reset?'Đặt mật khẩu mới':'Chào mừng quay lại';
    const subtitle=signup?'Dành một nơi riêng tư cho tài chính của bạn.':recover?'Nhập email để nhận liên kết đặt lại mật khẩu.':reset?'Tạo mật khẩu đủ mạnh để bảo vệ tài khoản.':'Đăng nhập để quản lý tiền thật dễ dàng.';
    const pwd = recover ? '' : '<label class="auth-label" for="account-password">Mật khẩu</label><div class="auth-password"><input id="account-password" type="password" name="password" minlength="8" autocomplete="'+(signup||reset?'new-password':'current-password')+'" placeholder="Tối thiểu 8 ký tự" required /><button type="button" data-cloud-action="reveal" aria-label="Hiển thị mật khẩu">Hiện</button></div>';
    const mail = reset ? '' : '<label class="auth-label" for="account-email">Email</label><input id="account-email" type="email" name="email" placeholder="tenban@email.com" autocomplete="email" required maxlength="254" />';
    const bottom=reset?'':recover?'<button type="button" class="auth-text-btn" data-cloud-action="mode" data-mode="signin">Trở lại đăng nhập</button>':'<div class="auth-switch">'+(signup?'Đã có tài khoản?':'Chưa có tài khoản?')+' <button type="button" data-cloud-action="mode" data-mode="'+(signup?'signin':'signup')+'">'+(signup?'Đăng nhập':'Đăng ký ngay')+'</button></div>';
    ensureGate().innerHTML = '<main class="account-layout"><section class="account-art" aria-hidden="true"><div class="account-brand">m.</div><div class="account-art-center"><div class="account-art-symbol">✳</div><p class="account-kicker">SỐNG NHẸ HƠN MỖI NGÀY</p><h2>Hiểu tiền bạc.<br>Thảnh thơi sống.</h2><p>Một khoản nhỏ được ghi lại hôm nay. Một tương lai vững vàng được xây nên.</p></div><div class="account-art-bottom"><span>✦ Bảo mật theo tài khoản</span><span>✦ Đồng bộ đám mây</span></div></section><section class="account-main"><div class="account-mobile-brand"><span>m.</span> mộc finance</div><div class="account-card"><div class="account-eyebrow">MỘC FINANCE / TÀI KHOẢN</div><h1>'+title+'</h1><p class="account-subtitle">'+subtitle+'</p><div class="account-tabs"><button type="button" data-cloud-action="mode" data-mode="signin" class="'+(mode==='signin'?'selected':'')+'">Đăng nhập</button><button type="button" data-cloud-action="mode" data-mode="signup" class="'+(signup?'selected':'')+'">Đăng ký</button></div>'+message(mode)+'<form id="moc-auth-form"><div class="auth-fields">'+mail+pwd+'</div>'+(mode==='signin'?'<button type="button" class="auth-forgot" data-cloud-action="mode" data-mode="recover">Quên mật khẩu?</button>':'')+'<button type="submit" class="auth-submit">'+(signup?'Tạo tài khoản':recover?'Gửi email khôi phục':reset?'Cập nhật mật khẩu':'Đăng nhập')+' <span>↗</span></button></form>'+bottom+'<p class="auth-privacy">🔒 Dữ liệu được phân tách và bảo vệ bằng quyền truy cập Supabase. Không liên kết trực tiếp ngân hàng.</p></div></section></main>';
  }
  function cover(text){
    ensureGate().innerHTML='<div class="account-loading"><div class="account-mark">m.</div><div class="account-spinner"></div><h2>'+escape(text||'Đang mở sổ thu chi...')+'</h2><p>Mộc đang chuẩn bị không gian riêng của bạn.</p></div>';
  }
  function displayError(err){
    const msg=String(err?.message||err||'Có lỗi xảy ra. Vui lòng thử lại.');
    if(/invalid login credentials/i.test(msg)) return 'Email hoặc mật khẩu không chính xác.';
    if(/email not confirmed/i.test(msg)) return 'Bạn cần xác nhận email trước khi đăng nhập.';
    if(/already registered/i.test(msg)) return 'Email đã được đăng ký.';
    if(/rate limit|over_email_send_rate_limit|security purposes/i.test(msg)) return 'Thử quá nhiều lần. Vui lòng đợi ít phút.';
    if(/password.*(6|weak|short)/i.test(msg)) return 'Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự.';
    if(/network|failed to fetch/i.test(msg)) return 'Không thể kết nối máy chủ. Hãy kiểm tra Internet.';
    return msg.slice(0,170);
  }
  function showStatus(){
    const el=document.getElementById('moc-sync-status');
    if(el)el.textContent=sync.status;
  }
  function cacheKey(){return CACHE_PREFIX+sync.user?.id;}
  function cacheLocal(payload, isPending){
    try { localStorage.setItem(cacheKey(),JSON.stringify({data:payload,pending:isPending,time:Date.now()})); } catch (_){}
  }
  function readCache(){
    try { return JSON.parse(localStorage.getItem(cacheKey())||'null'); } catch(_){return null;}
  }
  function queueSave(){
    if(!sync.ready || !sync.user) return false;
    sync.version++;
    sync.pending=true;
    sync.status='Đang chờ đồng bộ';showStatus();
    cacheLocal(sync.bridge.getState(),true);
    clearTimeout(sync.timer);
    sync.timer=setTimeout(flush,550);
    return true;
  }
  async function flush(){
    if(!sync.ready || !sync.user || !sync.pending || sync.inFlight || !navigator.onLine)return;
    clearTimeout(sync.timer);
    sync.inFlight=true;
    const uid=sync.user.id, version=sync.version, doc=sync.bridge.getState();
    sync.pending=false;sync.status='Đang đồng bộ...';showStatus();
    const {error}=await supa.from('finance_states').upsert({user_id:uid,document:doc,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(sync.user?.id !== uid){sync.inFlight=false;return;}
    sync.inFlight=false;
    if(error){
      sync.pending=true;
      sync.status='Chưa đồng bộ • ' + displayError(error);
      showStatus();
      cacheLocal(sync.bridge.getState(),true);
    }else if(sync.version===version && !sync.pending){
      sync.status='Đã đồng bộ với đám mây';showStatus();cacheLocal(doc,false);
    }else{
      sync.pending=true;
      sync.status='Đang cập nhật...';showStatus();
      sync.timer=setTimeout(flush,350);
    }
  }
  async function activate(user){
    if(!user || !sync.bridge) return;
    if(sync.user?.id===user.id && (sync.ready||sync.loading))return;
    sync.user=user;sync.ready=false;sync.status='Đang tải dữ liệu';sync.pending=false;
    cover('Đang tải dữ liệu của bạn...');
    const req=(async()=>{
      const {data,error}=await supa.from('finance_states').select('document').eq('user_id',user.id).maybeSingle();
      if(sync.user?.id!==user.id)return;
      const cache=readCache();
      if(error && !(cache && sync.bridge.validate(cache.data))) throw error;
      let doc=data?.document;
      if(cache?.pending && sync.bridge.validate(cache.data)){
        doc=cache.data;
        sync.pending=true;
      }else if(!sync.bridge.validate(doc)){
        if(cache && sync.bridge.validate(cache.data))doc=cache.data;
        else doc=sync.bridge.emptyState();
        sync.pending=!data;
      }
      sync.bridge.setState(doc);
      sync.ready=true;sync.status=sync.pending?'Đang chờ đồng bộ':'Đã đồng bộ với đám mây';
      document.documentElement.classList.remove('cloud-locked');
      ensureGate().replaceChildren();
      if(sync.pending){sync.version++;cacheLocal(doc,true);sync.timer=setTimeout(flush,250);}
      window.addEventListener('online',flush);
    })();
    sync.loading=req;
    try{await req;}catch(error){
      sync.error='Không mở được dữ liệu: '+displayError(error)+'. Hãy thử tải lại trang.';
      sync.ready=false;form('signin');
    }finally{sync.loading=null;}
  }
  function lock(){
    clearTimeout(sync.timer);
    sync.user=null;sync.ready=false;sync.pending=false;sync.version=0;
    document.documentElement.classList.add('cloud-locked');
    sync.status='Chưa đăng nhập';
    sync.gate='signin';sync.error='';
    form('signin');
  }
  async function signout(){
    if(sync.inFlight || sync.pending){
      await flush();
      if(sync.pending){sync.error='Có dữ liệu chưa đồng bộ. Hãy kết nối Internet trước khi đăng xuất.';sync.gate='signin';form('signin');return;}
    }
    const uid=sync.user?.id;
    const {error}=await supa.auth.signOut();
    if(error){sync.bridge.toast('Chưa đăng xuất: '+displayError(error),'alert');return;}
    if(uid)try{localStorage.removeItem(CACHE_PREFIX+uid);}catch(_){}
    lock();
  }
  function accountPanel(){
    if(!sync.ready||!sync.user)return '';
    return '<section class="card space-bottom cloud-account-panel"><div class="section-head"><div><h2>☁️ Tài khoản & đồng bộ</h2><p>Mộc lưu dữ liệu riêng cho tài khoản Supabase của bạn.</p></div><span class="cloud-chip">Đã đăng nhập</span></div><div class="settings-row"><div class="settings-row-content"><span class="settings-icon">✉</span><div><strong>'+escape(sync.user.email)+'</strong><p id="moc-sync-status">'+escape(sync.status)+'</p></div></div><button class="btn btn-outline btn-small" data-cloud-action="sync">Đồng bộ</button></div><div class="settings-row"><div class="settings-row-content"><span class="settings-icon">⇥</span><div><strong>Đăng xuất</strong><p>Thoát khỏi tài khoản trên thiết bị này.</p></div></div><button class="btn btn-danger btn-small" data-cloud-action="signout">Đăng xuất</button></div><p class="cloud-help">Bạn có thể nhập tệp JSON đã xuất trước đây để chuyển lịch sử từ bản cũ lên tài khoản mới. Nếu dùng trên nhiều thiết bị đồng thời, lần cập nhật gần nhất sẽ ghi đè dữ liệu trước đó.</p></section>';
  }
  function setMode(mode){sync.error='';sync.notice='';sync.gate=mode;form(mode);}
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-cloud-action]');if(!button)return;
    event.preventDefault();
    const action=button.dataset.cloudAction;
    if(action==='mode')return setMode(button.dataset.mode);
    if(action==='reveal'){const inp=document.getElementById('account-password');if(inp){inp.type=inp.type==='password'?'text':'password';button.textContent=inp.type==='password'?'Hiện':'Ẩn';}return;}
    if(action==='signout'){signout();return;}
    if(action==='sync'){sync.pending=true;sync.version++;flush();return;}
  });
  document.addEventListener('submit',async event=>{
    if(event.target.id!=='moc-auth-form')return;
    event.preventDefault();
    const formEl=event.target, button=formEl.querySelector('[type=submit]');
    const email=String(formEl.elements.email?.value||'').trim().toLowerCase();
    const password=String(formEl.elements.password?.value||'');
    const mode=sync.gate;
    if(mode!=='recover'&&password.length<8){sync.error='Mật khẩu phải có ít nhất 8 ký tự.';form(mode);return;}
    button.disabled=true;button.textContent='Đang xử lý...';sync.error='';sync.notice='';
    try{
      if(mode==='signup'){
        const {data,error}=await supa.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
        if(error)throw error;
        if(!data.session){
          sync.gate='signin';sync.notice='Đã gửi email xác nhận nếu địa chỉ hợp lệ. Hãy kiểm tra hộp thư (cả mục Spam), xác nhận và đăng nhập.';form('signin');
        }else{
          sync.notice='Đăng ký thành công!';await activate(data.user);
        }
      }else if(mode==='signin'){
        const {error}=await supa.auth.signInWithPassword({email,password});
        if(error)throw error;
      }else if(mode==='recover'){
        const {error}=await supa.auth.resetPasswordForEmail(email,{redirectTo:redirect});
        if(error)throw error;
        sync.gate='signin';sync.notice='Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.';form('signin');
      }else if(mode==='reset'){
        const {error}=await supa.auth.updateUser({password});
        if(error)throw error;
        sync.gate='signin';sync.notice='Mật khẩu đã được cập nhật.';form('signin');
        const {data}=await supa.auth.getUser();
        if(data.user) await activate(data.user);
      }
    }catch(error){sync.error=displayError(error);form(mode);}
  });
  async function boot(bridge){
    sync.bridge=bridge;cover('Đang kết nối tài khoản...');
    supa.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){sync.gate='reset';sync.error='';sync.notice='';form('reset');return;}
      if(event==='SIGNED_OUT'){lock();return;}
      if(session?.user && sync.gate!=='reset') setTimeout(()=>activate(session.user),0);
    });
    try{
      const {data,error}=await supa.auth.getSession();
      if(error)throw error;
      if(data.session?.user && sync.gate!=='reset')await activate(data.session.user);
      else if(sync.gate!=='reset')lock();
    }catch(err){sync.error=displayError(err);form('signin');}
  }
  window.MocCloud={enabled:true,boot,save:queueSave,accountPanel};
})();