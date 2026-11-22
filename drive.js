/* Tamy Ví tài chính — Google Drive backup integration.
 * Uses Google Identity Services token client in-browser and Drive API with the
 * least-privileged drive.file scope. Tokens never go to localStorage.
 * A Drive snapshot is a backup, not a real-time multi-device database.
 */
(() => {
  'use strict';
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
  const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
  const BACKUP_NAME = 'Tamy-Vi-Tai-Chinh-Backup.json';
  const CLIENT_KEY = 'tamy-google-drive-oauth-client-id';
  const AUTO_KEY = 'tamy-google-drive-auto-backup';
  const MAX_SIZE = 5 * 1024 * 1024;
  let integration = null, token = '', expiresAt = 0, oauthClient = null;
  let pending = false, remote = null, remoteKnown = false, trusted = false, conflict = false;
  let autoTimer = null, writeInProgress = false, writeQueued = false, suppressNextAuto = false;
  let statusText = 'Chưa kết nối Google Drive';
  let lastSuccessfulBackup = null;

  function escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  }
  function getClientId() {
    try {
      return String(window.TAMY_GOOGLE_DRIVE_CONFIG?.clientId || localStorage.getItem(CLIENT_KEY) || '').trim();
    } catch (_) {
      return String(window.TAMY_GOOGLE_DRIVE_CONFIG?.clientId || '').trim();
    }
  }
  function isValidClientId(value) {
    return /^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(value);
  }
  function isConnected() { return !!token && Date.now() < expiresAt; }
  function isAutoEnabled() { try { return localStorage.getItem(AUTO_KEY) === 'yes'; } catch (_) { return false; } }
  function refresh() { if (integration?.refresh) integration.refresh(); }
  function say(message, icon='check') { if (integration?.toast) integration.toast(message,icon); }
  function setStatus(message, shouldRefresh=true) { statusText=message; if (shouldRefresh) refresh(); }
  function dateLabel(value) {
    if (!value) return 'Chưa có';
    const dt=new Date(value);
    return Number.isFinite(dt.getTime()) ? dt.toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'}) : 'Chưa xác định';
  }
  function errorMessage(error) {
    const info=String(error?.message || error || 'Lỗi không xác định');
    if (/popup_closed|access_denied|user_cancelled/i.test(info)) return 'Bạn đã đóng hoặc từ chối yêu cầu đăng nhập Google.';
    if (/invalid_client|origin_mismatch|idpiframe_initialization_failed/i.test(info)) return 'OAuth Client ID hoặc Authorized JavaScript Origin chưa đúng.';
    if (/accessnotconfigured|has not been used|not enabled/i.test(info)) return 'Google Drive API chưa được bật trong Google Cloud.';
    if (/invalid_token|unauthorized|token.*expir|http 401/i.test(info)) return 'Phiên Google đã hết hạn. Hãy kết nối lại rồi thử tiếp.';
    if (/insufficient|scope|403/i.test(info)) return 'Google chưa cấp đủ quyền Drive hoặc dự án OAuth chưa cho phép tài khoản này.';
    return info.length>180 ? info.slice(0,180)+'…' : info;
  }
  function isUsable() { return isConnected() && !pending; }
  function disconnect(withMessage=true) {
    if (token && window.google?.accounts?.oauth2?.revoke) {
      try { window.google.accounts.oauth2.revoke(token,()=>{}); } catch (_) { /* ignore */ }
    }
    token='';expiresAt=0;oauthClient=null;remote=null;remoteKnown=false;trusted=false;conflict=false;
    clearTimeout(autoTimer);setStatus('Đã ngắt kết nối Google Drive');
    if (withMessage) say('Đã ngắt kết nối. Dữ liệu trên máy và tệp sao lưu Drive vẫn được giữ.');
  }
  function panel() {
    const id=getClientId();
    const connected=isConnected();
    const cloudStatus=connected ? (conflict ? 'Phát hiện bản trên Drive thay đổi ở nơi khác' : statusText) : 'Chưa kết nối Google Drive';
    const remoteLabel=remote ? `Bản gần nhất trên Drive: ${dateLabel(remote.modifiedTime)}` : remoteKnown ? 'Drive chưa có bản sao lưu của Tamy.' : 'Chưa kiểm tra bản sao lưu trên Drive.';
    const actionDisabled=!connected || pending;
    return `<section class="card tamy-drive-panel" aria-labelledby="drive-settings-title">
      <div class="tamy-drive-heading"><div class="tamy-drive-mark">☁</div><div><div class="tamy-drive-eyebrow">SAO LƯU ĐÁM MÂY</div><h2 id="drive-settings-title">Google Drive</h2><p>Giữ một bản sao của ví, giao dịch, ngân sách và thẻ tín dụng trong Drive của bạn.</p></div></div>
      <div class="tamy-drive-state"><span class="tamy-drive-dot ${connected?'connected':''}"></span><div><strong>${escapeText(cloudStatus)}</strong><small>${escapeText(remoteLabel)}</small></div></div>
      ${!isValidClientId(id) ? `<div class="tamy-drive-onboarding"><label for="tamy-drive-client-id">OAuth Client ID cho Tamy</label><input id="tamy-drive-client-id" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="123456789-abc.apps.googleusercontent.com" aria-describedby="tamy-drive-help"/><p id="tamy-drive-help">Google yêu cầu một mã OAuth của website để kết nối Drive. Mã Client ID là công khai; <strong>không nhập Client Secret</strong> hoặc mật khẩu Google vào đây.</p>
        <details class="tamy-drive-guide"><summary>Xem hướng dẫn tạo mã kết nối (một lần)</summary><ol>
          <li>Mở <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a> và tạo hoặc chọn một dự án.</li>
          <li>Trong <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener noreferrer">Google Drive API</a>, chọn <strong>Enable</strong>.</li>
          <li>Vào <a href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noopener noreferrer">Google Auth Platform</a>, cấu hình màn hình đồng ý OAuth. Nếu ứng dụng ở chế độ Testing, thêm email của bạn vào Test users.</li>
          <li>Trong <a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noopener noreferrer">OAuth Clients</a>, tạo client loại <strong>Web application</strong>. Authorized JavaScript origin: <code>${escapeText(location.origin)}</code> (chỉ tên miền, không có đường dẫn).</li>
          <li>Sao chép <strong>Client ID</strong> kết thúc bằng <code>apps.googleusercontent.com</code> và dán ở ô bên trên.</li>
        </ol></details><button type="button" class="btn btn-primary" data-drive-action="save-client">Lưu mã kết nối</button></div>` : `<div class="tamy-drive-actions">
          ${connected ? `<button type="button" class="btn btn-primary" data-drive-action="backup" ${actionDisabled?'disabled':''}>${pending?'Đang xử lý…':'Sao lưu lên Drive'}</button><button type="button" class="btn btn-outline" data-drive-action="restore" ${actionDisabled||!remote?'disabled':''}>Khôi phục từ Drive</button><button type="button" class="btn btn-outline" data-drive-action="disconnect" ${pending?'disabled':''}>Ngắt kết nối</button>` : `<button type="button" class="btn btn-primary" data-drive-action="connect">Kết nối tài khoản Google</button>`}
        </div>
        <div class="tamy-drive-auto"><label><input id="tamy-drive-autobackup" type="checkbox" ${isAutoEnabled()?'checked':''} ${!connected?'disabled':''}/><span>Tự sao lưu sau khi sửa dữ liệu (khi đang kết nối)</span></label><p>Tính năng tự sao lưu chỉ chạy khi trang đang mở, phiên Google còn hạn và bạn đã thiết lập bản lưu đầu tiên.</p></div>
        ${!window.TAMY_GOOGLE_DRIVE_CONFIG?.clientId ? `<details class="tamy-drive-advanced"><summary>Thay đổi OAuth Client ID</summary><div><input id="tamy-drive-client-id" type="text" value="${escapeText(id)}" autocomplete="off" spellcheck="false" aria-label="OAuth Client ID"/><button type="button" class="btn btn-outline btn-small" data-drive-action="save-client">Lưu mã</button></div></details>` : ''}
        `}
      ${conflict ? `<p class="tamy-drive-warning">Bản sao Drive đã thay đổi từ thiết bị khác. Tự sao lưu được tạm dừng để tránh ghi đè. Hãy kiểm tra và khôi phục trước nếu cần.</p>`:''}
      <p class="tamy-drive-footnote">Ứng dụng chỉ yêu cầu quyền với các tệp Drive mà Tamy tạo hoặc được bạn cho phép dùng. Dữ liệu trong tệp JSON không được mã hóa đầu cuối; hãy bảo mật tài khoản Google. Drive là bản sao lưu, không phải đồng bộ thời gian thực.</p>
    </section>`;
  }

  async function driveRequest(url,options={}) {
    if(!isConnected()) throw new Error('Phiên Google hết hạn. Hãy kết nối lại.');
    const headers=new Headers(options.headers||{});
    headers.set('Authorization','Bearer '+token);
    const response=await fetch(url,{...options,headers});
    if(!response.ok){
      let reason='';
      try {const body=await response.json();reason=body.error?.message||JSON.stringify(body.error||{});}catch(_){}
      if(response.status===401){token='';expiresAt=0;trusted=false;}
      throw new Error(`HTTP ${response.status}: ${reason||response.statusText}`);
    }
    return response;
  }
  async function listBackup() {
    const query=new URLSearchParams({
      q:`name = '${BACKUP_NAME}' and trashed = false`,
      spaces:'drive',
      pageSize:'30',
      fields:'nextPageToken,files(id,name,mimeType,modifiedTime,version,size,webViewLink),incompleteSearch',
      orderBy:'modifiedTime desc'
    });
    const response=await driveRequest(`${DRIVE_API}?${query}`);
    const json=await response.json();
    const backups=(json.files||[]).filter(f=>f.name===BACKUP_NAME&&f.mimeType==='application/json');
    remote=backups[0]||null;remoteKnown=true;
    return remote;
  }
  function multipartBody(metadata,payload){
    const boundary='tamy_upload_'+Math.random().toString(36).slice(2);
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${payload}\r\n--${boundary}--`;
    return {body,headers:{'Content-Type':'multipart/related; boundary='+boundary}};
  }
  async function refreshRemote() {
    const previous=remote?.modifiedTime;
    const entry=await listBackup();
    if(trusted && previous && entry?.modifiedTime!==previous){trusted=false;conflict=true;clearTimeout(autoTimer);}
    return entry;
  }
  async function upload({manual=false}={}) {
    if(writeInProgress){writeQueued=true;return;}
    if(!isConnected()){if(manual)say('Hãy kết nối lại với Google trước khi sao lưu.','alert');return;}
    if(!integration)return;
    writeInProgress=true;pending=manual;refresh();
    try{
      const before=remote ? {id:remote.id,modifiedTime:remote.modifiedTime,version:remote.version} : null;
      const file=await listBackup();
      if(trusted && before && (!file || file.id!==before.id || (before.version && file.version && file.version!==before.version) || file.modifiedTime!==before.modifiedTime)){
        trusted=false;conflict=true;setStatus('Bản sao lưu Drive đã được sửa trên thiết bị khác.');
        say('Tự sao lưu đã dừng vì Drive có bản mới hơn.','alert');return;
      }
      if(!manual && (!trusted || conflict))return;
      if(manual && file){
        const warning=conflict ? 'Bản trên Drive đã được thay đổi trên thiết bị khác.' : 'Drive đã có bản sao lưu của Tamy.';
        if(!window.confirm(warning+' Bạn chắc chắn muốn thay thế bằng dữ liệu hiện trên thiết bị này?'))return;
      }
      const state=integration.getState();
      const payload=JSON.stringify({app:'Tamy Ví tài chính',format:'tamy-drive-backup',formatVersion:1,savedAt:new Date().toISOString(),data:state});
      if(new Blob([payload]).size>MAX_SIZE)throw new Error('Dữ liệu quá 5 MB. Hãy xuất JSON để lưu thủ công.');
      let result;
      if(file){
        const response=await driveRequest(`${UPLOAD_API}/${encodeURIComponent(file.id)}?uploadType=media&fields=id,name,modifiedTime,version,webViewLink`,{method:'PATCH',headers:{'Content-Type':'application/json; charset=UTF-8'},body:payload});
        result=await response.json();
      } else {
        const part=multipartBody({name:BACKUP_NAME,mimeType:'application/json',description:'Bản sao lưu Tamy Ví tài chính. Không chia sẻ công khai.'},payload);
        const response=await driveRequest(`${UPLOAD_API}?uploadType=multipart&fields=id,name,modifiedTime,version,webViewLink`,{method:'POST',headers:part.headers,body:part.body});
        result=await response.json();
      }
      // Drive's returned modifiedTime is authoritative for subsequent conflict checks.
      remote={id:result.id||file?.id,name:BACKUP_NAME,mimeType:'application/json',modifiedTime:result.modifiedTime,version:result.version,webViewLink:result.webViewLink};
      remoteKnown=true;trusted=true;conflict=false;
      lastSuccessfulBackup=new Date();
      setStatus('Đã sao lưu thành công lúc '+dateLabel(lastSuccessfulBackup));
      if(manual)say('Đã lưu bản sao Tamy vào Google Drive.');
    }catch(error){
      setStatus('Sao lưu chưa thành công: '+errorMessage(error));
      if(manual)say(errorMessage(error),'alert');
    }finally{
      writeInProgress=false;pending=false;refresh();
      if(writeQueued){writeQueued=false;if(isAutoEnabled()&&trusted&&!conflict)scheduleBackup();}
    }
  }
  async function restore() {
    if(!isUsable())return;
    pending=true;refresh();
    try{
      const entry=await listBackup();
      if(!entry){say('Google Drive chưa có bản sao lưu của Tamy.','alert');return;}
      const size=Number(entry.size||0);
      if(size>MAX_SIZE)throw new Error('Tệp sao lưu vượt quá 5 MB.');
      const res=await driveRequest(`${DRIVE_API}/${encodeURIComponent(entry.id)}?alt=media`);
      const raw=await res.text();
      if(new Blob([raw]).size>MAX_SIZE)throw new Error('Tệp sao lưu quá lớn.');
      const doc=JSON.parse(raw);
      if(doc.format!=='tamy-drive-backup'||doc.formatVersion!==1)throw new Error('Tệp Drive không đúng định dạng sao lưu Tamy.');
      trusted=false;conflict=false; // Only trust this cloud revision after user confirms replacing the local data.
      if(!integration.prepareRestore)throw new Error('Chưa thể khôi phục trên phiên bản ứng dụng này.');
      integration.prepareRestore(doc.data);
      setStatus('Đã tải dữ liệu từ Drive, đang chờ bạn xác nhận khôi phục.');
    }catch(error){setStatus('Không thể khôi phục: '+errorMessage(error));say(errorMessage(error),'alert');}
    finally{pending=false;refresh();}
  }
  async function connect(){
    if(pending)return;
    const clientId=getClientId();
    if(!isValidClientId(clientId)){say('Cần nhập OAuth Client ID hợp lệ trước khi kết nối.','alert');return;}
    if(!window.google?.accounts?.oauth2){say('Chưa tải được Google Sign-In. Kiểm tra kết nối mạng và tải lại trang.','alert');return;}
    try {
      oauthClient=window.google.accounts.oauth2.initTokenClient({
        client_id:clientId,
        scope:SCOPE,
        callback:async response=>{
          if(response?.error){setStatus(errorMessage(response.error));say(errorMessage(response.error),'alert');return;}
          if(!response?.access_token){setStatus('Google chưa cấp quyền kết nối.');return;}
          token=response.access_token;expiresAt=Date.now()+(Math.max(1,Number(response.expires_in||3600))-60)*1000;
          remote=null;remoteKnown=false;trusted=false;conflict=false;
          pending=true;setStatus('Đang kiểm tra bản sao lưu trên Drive...');
          try{await listBackup();setStatus(remote?'Đã kết nối. Drive có bản sao lưu để khôi phục.':'Đã kết nối. Bạn có thể tạo bản sao lưu đầu tiên.');}
          catch(err){setStatus('Kết nối Google thành công, nhưng không đọc được Drive.');say(errorMessage(err),'alert');}
          finally{pending=false;refresh();}
        },
        error_callback:()=>{setStatus('Không thể mở cửa sổ Google. Hãy kiểm tra trình duyệt.');}
      });
      // The OAuth popup is opened directly from this user click.
      oauthClient.requestAccessToken({prompt:'consent'});
    }catch(error){setStatus('Kết nối thất bại: '+errorMessage(error));say(errorMessage(error),'alert');}
  }
  function scheduleBackup(){
    if(suppressNextAuto){suppressNextAuto=false;return;}
    if(!isAutoEnabled()||!isConnected()||!trusted||conflict)return;
    clearTimeout(autoTimer);
    autoTimer=setTimeout(()=>upload({manual:false}),2500);
  }
  async function handleClick(ev){
    const button=ev.target.closest('[data-drive-action]');
    if(!button)return;
    ev.preventDefault();
    const action=button.dataset.driveAction;
    if(action==='save-client'){
      const value=document.getElementById('tamy-drive-client-id')?.value.trim()||'';
      if(!isValidClientId(value)){say('Mã Client ID không hợp lệ. Mã cần kết thúc bằng apps.googleusercontent.com.','alert');return;}
      try{localStorage.setItem(CLIENT_KEY,value);}catch(_){say('Trình duyệt không cho lưu mã kết nối.','alert');return;}
      if(isConnected())disconnect(false);
      setStatus('Đã lưu mã kết nối. Hãy chọn Kết nối tài khoản Google.');
      say('Đã lưu Google OAuth Client ID trên thiết bị này.');
    }
    if(action==='connect')connect();
    if(action==='disconnect')disconnect();
    if(action==='backup')upload({manual:true});
    if(action==='restore')restore();
  }
  function handleChange(ev){
    if(ev.target.id!=='tamy-drive-autobackup')return;
    try{localStorage.setItem(AUTO_KEY,ev.target.checked?'yes':'no');}catch(_){}
    if(ev.target.checked && !trusted) say('Đã bật tùy chọn. Hãy tạo bản sao lưu đầu tiên bằng tay để kích hoạt tự sao lưu.','alert');
    if(!ev.target.checked)clearTimeout(autoTimer);
    refresh();
  }
  function init(cfg){
    integration=cfg;
    document.addEventListener('click',handleClick);
    document.addEventListener('change',handleChange);
  }
  window.TamyDrive={init,panel,scheduleBackup,disconnect,markRestored:()=>{trusted=true;conflict=false;suppressNextAuto=true;}};
})();
