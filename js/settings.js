/**
 * 신청 설정 (저장/로드 + 토픽바 상태 뱃지)
 * 전역: saveSettings, loadSettings, updateTopbarBadge
 */

function saveSettings(){
  var start     = document.getElementById('setting-start').value;
  var end       = document.getElementById('setting-end').value;
  var heroTitle = document.getElementById('setting-hero-title').value;
  var heroSub   = document.getElementById('setting-hero-sub').value;
  var settings  = { start:start, end:end, heroTitle:heroTitle, heroSub:heroSub };
  localStorage.setItem('urefresh_settings', JSON.stringify(settings));
  updateTopbarBadge();

  apiSaveSettings({ start:start, end:end, heroTitle:heroTitle }).catch(function(){});

  var msg = document.getElementById('setting-saved-msg');
  msg.style.display = 'flex';
  setTimeout(function(){ msg.style.display = 'none'; }, 2000);
}

function loadSettings(){
  try {
    var s = JSON.parse(localStorage.getItem('urefresh_settings'));
    if(!s) return;
    if(s.start)     document.getElementById('setting-start').value       = s.start;
    if(s.end)       document.getElementById('setting-end').value         = s.end;
    if(s.heroTitle) document.getElementById('setting-hero-title').value  = s.heroTitle;
    if(s.heroSub)   document.getElementById('setting-hero-sub').value    = s.heroSub;
    updateTopbarBadge();
  } catch(e){}
}

function updateTopbarBadge(){
  try {
    var s = JSON.parse(localStorage.getItem('urefresh_settings'));
    var badge = document.getElementById('topbar-badge');
    if(!badge) return;
    if(!s || !s.end){ badge.textContent = '신청 설정 필요'; return; }
    var now = Date.now();
    var start = s.start ? new Date(s.start).getTime() : 0;
    var end   = s.end   ? new Date(s.end).getTime()   : 0;
    if(now < start)                     badge.textContent = '신청 대기 중';
    else if(now >= start && now <= end) badge.textContent = '신청 진행 중';
    else                                badge.textContent = '신청 마감됨';
  } catch(e){}
}
