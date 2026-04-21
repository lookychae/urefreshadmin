/**
 * 관리자 앱 엔트리 (네비게이션 + 모달 + 전체 초기화)
 * - 모든 다른 JS 파일이 먼저 로드된 후 마지막에 로드됨
 * 전역: goPage, openModal, closeModal, renderAll
 */

// ── NAVIGATION ──
function goPage(id, el){
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('on'); });
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('on'); });
  document.getElementById(id).classList.add('on');
  el.classList.add('on');
  var titles = {
    'pg-overview':   '대시보드',
    'pg-rooms':      '룸타입 설정',
    'pg-schedule':   '일정 관리',
    'pg-applicants': '신청자 명단',
    'pg-lottery':    '추첨 관리',
    'pg-notices':    '공지사항',
    'pg-settings':   '신청 설정'
  };
  document.getElementById('topbar-title').textContent = titles[id] || '';
}

// ── MODAL ──
function openModal(id){  document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

// ── 전체 초기 렌더 (로그인 성공 시 or 자동 로그인 시 호출) ──
function renderAll(){
  loadData();
  renderRooms();
  renderSchedule();
  renderApplicants(APPLICANTS);
  renderLottery();
  loadSettings();
  loadApplicantsFromSheet();
  loadNoticesFromSheet();
}

// ── 자동 로그인 체크 (페이지 로드 직후) ──
checkAutoLogin();
