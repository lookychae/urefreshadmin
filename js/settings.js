/**
 * 배너 설정 (앱 메인 히어로 제목)
 * - 신청 시작/마감일은 [일정 관리] 로 이관되어 여기서는 다루지 않음
 * - 저장 필드: heroTitle 만 (25자 이내)
 * - 미리보기 실시간 반영 + 글자수 카운터
 *
 * 전역: saveSettings, loadSettings, updateTopbarBadge, _refreshBannerPreview
 */

var HERO_TITLE_MAX = 20;

function saveSettings(){
  var heroTitle = (document.getElementById('setting-hero-title').value || '').slice(0, HERO_TITLE_MAX);
  var settings  = { heroTitle: heroTitle };
  localStorage.setItem('urefresh_settings', JSON.stringify(settings));
  updateTopbarBadge();

  apiSaveSettings({ heroTitle: heroTitle }).catch(function(){});

  var msg = document.getElementById('setting-saved-msg');
  msg.style.display = 'flex';
  setTimeout(function(){ msg.style.display = 'none'; }, 2000);
}

function loadSettings(){
  try {
    var s = JSON.parse(localStorage.getItem('urefresh_settings'));
    if(s && s.heroTitle){
      document.getElementById('setting-hero-title').value = s.heroTitle;
    }
    _refreshBannerPreview();
    updateTopbarBadge();
  } catch(e){}
}

function _refreshBannerPreview(){
  var t = (document.getElementById('setting-hero-title') || {}).value || '';
  var tEl = document.getElementById('banner-preview-title');
  var cntEl = document.getElementById('setting-hero-title-count');
  if(tEl)   tEl.textContent = t || '휴양소 추첨';
  if(cntEl) cntEl.textContent = t.length + ' / ' + HERO_TITLE_MAX;
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
