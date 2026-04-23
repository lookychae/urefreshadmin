/**
 * 일정 관리 (CRUD + 페이지네이션 + 서버 동기화)
 * 전역: renderSchedule, openAddSchedule, addSchedule, editSchedule, saveSchedule,
 *       deleteSchedule, loadSchedulesFromSheet, _syncSchedules
 */

var schPage = 0;
var SCH_PER_PAGE = 10;
var editingScheduleIdx = null;
var schSelected = {};   // key: 원본 index, value: true

// 빈 값은 '—' 로, 그 외는 utils.js 의 toDotDate 사용
function _fmtSchDate(v){
  return v ? toDotDate(v) : '—';
}

// ── 서버 동기화: SCHEDULES 배열 전체를 Google Sheets 에 저장 ──
function _syncSchedules(){
  apiSaveSchedules(SCHEDULES).catch(function(e){
    console.warn('일정 서버 저장 실패', e);
  });
}

// ── 서버에서 일정 로드 ──
// 초기 호출 시엔 localStorage 에 있던 옛날 데이터를 먼저 그리지 않도록
// 로딩 중 플레이스홀더 → 서버 응답 → 실제 렌더 순서로 처리
function loadSchedulesFromSheet(){
  var sl = document.getElementById('schedule-list');
  if(sl){
    sl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink4);font-size:13px;">일정을 불러오는 중...</div>';
  }

  apiGetSchedules()
    .then(function(rows){
      if(!Array.isArray(rows)){
        SCHEDULES = [];
      } else {
        SCHEDULES = rows.map(function(r){
          return {
            date: toIsoDate(r.date),
            day:  r.day  || '',
            room: r.room || '',
            cap:  Number(r.cap || 0),
            maxPeople: Number(r.maxPeople || 0),
            color: r.color || '',
            slots: Number(r.slots || 0),
            start: toIsoDate(r.start),
            end:   toIsoDate(r.end)
          };
        });
      }
      saveSchedulesData();
      schSelected = {};
      renderSchedule();
      renderLottery();
      if(typeof updateTopbarBadge === 'function') updateTopbarBadge();
    })
    .catch(function(e){
      console.warn('일정 불러오기 실패', e);
      // 서버 실패 시에만 localStorage fallback
      renderSchedule();
    });
}

function renderSchedule(){
  var sl = document.getElementById('schedule-list');
  sl.innerHTML = '';
  var total = SCHEDULES.length;
  var totalPages = Math.ceil(total / SCH_PER_PAGE);
  if(schPage >= totalPages && schPage > 0) schPage = totalPages - 1;
  var start = schPage * SCH_PER_PAGE;
  var pageItems = SCHEDULES.slice(start, start + SCH_PER_PAGE);

  // 년도별 그룹핑
  var yearGroups = {};
  pageItems.forEach(function(s, pi){
    var year = s.date.split('-')[0];
    if(!yearGroups[year]) yearGroups[year] = [];
    yearGroups[year].push({ s:s, i: start + pi });
  });

  Object.keys(yearGroups).sort().forEach(function(year){
    var yearHeader = document.createElement('div');
    yearHeader.style.cssText = 'padding:10px 20px 6px;font-size:12px;font-weight:700;color:var(--ink3);background:var(--page);border-bottom:1px solid var(--sep);letter-spacing:.3px;';
    yearHeader.textContent = year + '년';
    sl.appendChild(yearHeader);

    yearGroups[year].forEach(function(item){
      var s = item.s, i = item.i;
      var row = document.createElement('div');
      row.className = 'sch-row';
      var c = COLOR_MAP[s.color] || '#3182F6';
      var datePart = s.date.slice(5);
      var month = datePart.split('-')[0] + '월';
      var day   = datePart.split('-')[1] + '일';

      var periodHtml;
      if(s.start || s.end){
        periodHtml =
          '<div class="sch-period">' +
            '<div class="sch-period-row"><span class="sch-period-lbl">신청일</span><span class="sch-period-val">' + _fmtSchDate(s.start) + '</span></div>' +
            '<div class="sch-period-row"><span class="sch-period-lbl">마감일</span><span class="sch-period-val">' + _fmtSchDate(s.end) + '</span></div>' +
          '</div>';
      } else {
        periodHtml = '<div class="sch-period sch-period-empty">신청 기간 미설정</div>';
      }

      var checked = schSelected[i] ? 'checked' : '';
      row.innerHTML =
        '<label class="sch-check"><input type="checkbox" ' + checked + ' data-idx="' + i + '" onchange="toggleScheduleSelection(this)"></label>' +
        '<div class="sch-date">' + month + ' ' + day + ' <span class="sch-day">(' + s.day + ')</span></div>' +
        '<div class="sch-rooms">' +
          '<div class="sch-room-tag">' +
            '<div class="sch-room-dot" style="background:' + c + '"></div>' +
            '<span class="sch-room-name">' + s.room + '</span>' +
            '<span class="sch-room-cap">최대 ' + s.maxPeople + '명 · 구좌 ' + s.slots + '개</span>' +
          '</div>' +
        '</div>' +
        periodHtml +
        '<div class="sch-actions">' +
          '<button class="btn btn-outline" style="font-size:12px;padding:5px 10px" onclick="editSchedule(' + i + ')">수정</button>' +
          '<button class="btn btn-danger" style="font-size:12px;padding:5px 10px" onclick="deleteSchedule(' + i + ')">삭제</button>' +
        '</div>';
      sl.appendChild(row);
    });
  });

  // 선택 UI (전체선택/선택삭제) 동기화
  _syncSchSelectionUI();

  // 페이지네이션
  var pg = document.getElementById('schedule-pagination');
  if(totalPages <= 1){ pg.style.display = 'none'; return; }
  pg.style.display = 'flex';
  pg.innerHTML = '';

  var prev = document.createElement('button');
  prev.className = 'sch-nav-btn';
  prev.innerHTML = '&#8249;';
  prev.disabled = schPage === 0;
  prev.onclick = function(){ schPage--; renderSchedule(); };
  pg.appendChild(prev);

  for(var p = 0; p < totalPages; p++){
    var btn = document.createElement('button');
    btn.className = 'sch-nav-btn' + (p === schPage ? ' on' : '');
    btn.textContent = p + 1;
    btn.setAttribute('data-p', p);
    btn.onclick = function(){ schPage = parseInt(this.getAttribute('data-p')); renderSchedule(); };
    pg.appendChild(btn);
  }

  var next = document.createElement('button');
  next.className = 'sch-nav-btn';
  next.innerHTML = '&#8250;';
  next.disabled = schPage === totalPages - 1;
  next.onclick = function(){ schPage++; renderSchedule(); };
  pg.appendChild(next);
}

function openAddSchedule(){
  editingScheduleIdx = null;
  document.getElementById('modal-sch-title').textContent = '날짜별 룸타입 배정';
  document.getElementById('modal-sch-save-btn').textContent = '배정하기';
  document.getElementById('modal-sch-save-btn').onclick = addSchedule;
  document.getElementById('sch-date').value  = '';
  document.getElementById('sch-start').value = '';
  document.getElementById('sch-end').value   = '';
  openModal('modal-schedule');
}

function editSchedule(i){
  var s = SCHEDULES[i];
  if(!s) return;
  editingScheduleIdx = i;
  document.getElementById('modal-sch-title').textContent = '일정 수정';
  document.getElementById('modal-sch-save-btn').textContent = '저장하기';
  document.getElementById('modal-sch-save-btn').onclick = saveSchedule;
  document.getElementById('sch-date').value      = s.date;
  document.getElementById('sch-room-type').value = s.room;
  document.getElementById('sch-start').value     = s.start || '';
  document.getElementById('sch-end').value       = s.end   || '';
  openModal('modal-schedule');
}

function _buildScheduleEntry(){
  var date     = document.getElementById('sch-date').value;
  var roomName = document.getElementById('sch-room-type').value;
  if(!date || !roomName){
    alert('날짜와 룸타입을 선택해 주세요.');
    return null;
  }
  var room = ROOMS.find(function(r){ return r.name === roomName; });
  var days = ['일','월','화','수','목','금','토'];
  var d = new Date(date);
  return {
    date: date,
    day:  days[d.getDay()],
    room: roomName,
    cap:  room ? room.cap : 0,
    maxPeople: room ? room.cap : 4,
    color: room ? room.color : 'blue',
    slots: room ? room.slots : 0,
    start: document.getElementById('sch-start').value,
    end:   document.getElementById('sch-end').value
  };
}

function saveSchedule(){
  var entry = _buildScheduleEntry();
  if(!entry) return;
  SCHEDULES[editingScheduleIdx] = Object.assign({}, SCHEDULES[editingScheduleIdx], entry);
  SCHEDULES.sort(function(a, b){ return a.date > b.date ? 1 : -1; });
  saveSchedulesData();
  _syncSchedules();
  closeModal('modal-schedule');
  renderSchedule();
  renderLottery();
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof updateTopbarBadge === 'function') updateTopbarBadge();
}

function addSchedule(){
  var entry = _buildScheduleEntry();
  if(!entry) return;
  SCHEDULES.push(entry);
  SCHEDULES.sort(function(a, b){ return a.date > b.date ? 1 : -1; });
  saveSchedulesData();
  _syncSchedules();
  closeModal('modal-schedule');
  renderSchedule();
  renderLottery();
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof updateTopbarBadge === 'function') updateTopbarBadge();
}

function deleteSchedule(i){
  if(!confirm('삭제하시겠습니까?')) return;
  SCHEDULES.splice(i, 1);
  saveSchedulesData();
  _syncSchedules();
  // 삭제로 인덱스가 밀리므로 선택 상태 초기화
  schSelected = {};
  renderSchedule();
  renderLottery();
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof updateTopbarBadge === 'function') updateTopbarBadge();
}

// ── 다중 선택 ──────────────────────────────────────────────
function toggleScheduleSelection(input){
  var idx = parseInt(input.getAttribute('data-idx'));
  if(isNaN(idx)) return;
  if(input.checked) schSelected[idx] = true;
  else              delete schSelected[idx];
  _syncSchSelectionUI();
}

function toggleSelectAllSchedules(input){
  if(input.checked){
    // 전체 선택: 모든 원본 인덱스를 선택 상태로
    schSelected = {};
    for(var i = 0; i < SCHEDULES.length; i++) schSelected[i] = true;
  } else {
    schSelected = {};
  }
  // 체크박스들 재렌더 없이 상태만 반영
  var boxes = document.querySelectorAll('.sch-check input[type=checkbox]');
  for(var j = 0; j < boxes.length; j++){
    var idx = parseInt(boxes[j].getAttribute('data-idx'));
    boxes[j].checked = !!schSelected[idx];
  }
  _syncSchSelectionUI();
}

function _syncSchSelectionUI(){
  var keys = Object.keys(schSelected).filter(function(k){ return schSelected[k]; });
  var count = keys.length;

  var btn = document.getElementById('sch-delete-selected-btn');
  var countEl = document.getElementById('sch-selected-count');
  if(btn){
    btn.style.display = count > 0 ? 'inline-flex' : 'none';
  }
  if(countEl) countEl.textContent = count;

  var selAll = document.getElementById('sch-select-all');
  if(selAll){
    if(SCHEDULES.length === 0){
      selAll.checked = false;
      selAll.indeterminate = false;
    } else if(count === SCHEDULES.length){
      selAll.checked = true;
      selAll.indeterminate = false;
    } else if(count === 0){
      selAll.checked = false;
      selAll.indeterminate = false;
    } else {
      selAll.checked = false;
      selAll.indeterminate = true;
    }
  }
}

function deleteSelectedSchedules(){
  var keys = Object.keys(schSelected)
    .filter(function(k){ return schSelected[k]; })
    .map(function(k){ return parseInt(k); })
    .filter(function(n){ return !isNaN(n); });
  if(!keys.length) return;
  if(!confirm('선택한 ' + keys.length + '건의 일정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;

  // 인덱스 밀림 방지 위해 내림차순으로 splice
  keys.sort(function(a, b){ return b - a; });
  keys.forEach(function(i){ SCHEDULES.splice(i, 1); });

  schSelected = {};
  saveSchedulesData();
  _syncSchedules();
  renderSchedule();
  renderLottery();
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof updateTopbarBadge === 'function') updateTopbarBadge();
}
