/**
 * 배너 설정 (앱 메인 히어로)
 * - 신청 시작/마감일은 [일정 관리] 로 이관되어 여기서는 다루지 않음
 * - 저장 필드: heroTitle, heroSub
 * - 미리보기 실시간 반영
 * - 상단 badge 는 SCHEDULES 기반 상태 표시
 *
 * 전역: saveSettings, loadSettings, updateTopbarBadge
 */

function saveSettings(){
  var heroTitle = document.getElementById('setting-hero-title').value;
  var heroSub   = document.getElementById('setting-hero-sub').value;
  var settings  = { heroTitle: heroTitle, heroSub: heroSub };
  localStorage.setItem('urefresh_settings', JSON.stringify(settings));
  updateTopbarBadge();

  // 서버는 heroTitle 만 저장 (기간은 일정에서 계산됨)
  apiSaveSettings({ heroTitle: heroTitle }).catch(function(){});

  var msg = document.getElementById('setting-saved-msg');
  msg.style.display = 'flex';
  setTimeout(function(){ msg.style.display = 'none'; }, 2000);
}

function loadSettings(){
  try {
    var s = JSON.parse(localStorage.getItem('urefresh_settings'));
    if(s){
      if(s.heroTitle) document.getElementById('setting-hero-title').value = s.heroTitle;
      if(s.heroSub)   document.getElementById('setting-hero-sub').value   = s.heroSub;
    }
    _refreshBannerPreview();
    _bindBannerPreview();
    updateTopbarBadge();
  } catch(e){}
}

// 입력 이벤트로 미리보기 실시간 반영
function _bindBannerPreview(){
  var t = document.getElementById('setting-hero-title');
  var s = document.getElementById('setting-hero-sub');
  if(t && !t._pvBound){ t.addEventListener('input', _refreshBannerPreview); t._pvBound = true; }
  if(s && !s._pvBound){ s.addEventListener('input', _refreshBannerPreview); s._pvBound = true; }
}

function _refreshBannerPreview(){
  var t = (document.getElementById('setting-hero-title') || {}).value || '';
  var s = (document.getElementById('setting-hero-sub')   || {}).value || '';
  var tEl = document.getElementById('banner-preview-title');
  var sEl = document.getElementById('banner-preview-sub');
  if(tEl) tEl.textContent = t || '휴양소 추첨';
  if(sEl) sEl.textContent = s;
}

// 상단 배지: 일정(SCHEDULES)의 신청 기간 합집합 기반
function updateTopbarBadge(){
  var badge = document.getElementById('topbar-badge');
  if(!badge) return;
  if(!Array.isArray(SCHEDULES) || !SCHEDULES.length){
    badge.textContent = '일정 등록 필요';
    return;
  }
  var starts = [], ends = [];
  SCHEDULES.forEach(function(x){
    if(x.start) starts.push(x.start);
    if(x.end)   ends.push(x.end);
  });
  if(!starts.length || !ends.length){
    badge.textContent = '신청 기간 미설정';
    return;
  }
  starts.sort();
  ends.sort();
  var earliestStart = starts[0];
  var latestEnd     = ends[ends.length - 1];
  var today = todayIso();
  if(today < earliestStart)   badge.textContent = '신청 대기 중';
  else if(today > latestEnd)  badge.textContent = '신청 마감됨';
  else                        badge.textContent = '신청 진행 중';
}
