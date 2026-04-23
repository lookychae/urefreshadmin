/**
 * 대시보드 렌더러
 * - 상단 KPI 4종: 전체 신청, 전체 구좌, 평균 경쟁률, 대기 인원
 * - 날짜별 신청 현황 테이블 (일정 기준)
 * - 상단 기간 문구 (일정들의 이용일 범위)
 *
 * 전역: renderDashboard
 */

function renderDashboard(){
  _dashRenderPeriod();
  _dashRenderKpi();
  _dashRenderTable();
}

// ── 신청자 date → 'YYYY-MM-DD' 정규화 ──
function _dashNormAppDate(v){
  if(!v) return '';
  var s = String(v).trim();
  var mKor = s.match(/(\d+)년\s*(\d+)월\s*(\d+)일/);
  if(mKor) return mKor[1] + '-' + String(mKor[2]).padStart(2, '0') + '-' + String(mKor[3]).padStart(2, '0');
  var d = new Date(s);
  if(isNaN(d.getTime())) return s;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function _dashIsCancelled(a){
  var st = String(a.status || '');
  return st === 'cancelled' || st === '취소됨';
}

function _dashCountAppsFor(schedule){
  var target = schedule.date || '';
  return APPLICANTS.filter(function(a){
    if(_dashIsCancelled(a)) return false;
    return _dashNormAppDate(a.date) === target;
  }).length;
}

function _dashStatusChip(apply, slots){
  if(slots === 0)  return { text:'일정 없음', cls:'chip-gray' };
  var rate = apply / slots;
  if(apply === 0)  return { text:'신청 전',   cls:'chip-gray' };
  if(rate >= 4)    return { text:'경쟁 과열', cls:'chip-red' };
  if(rate >= 2.5)  return { text:'경쟁 높음', cls:'chip-orange' };
  if(rate >= 1.5)  return { text:'경쟁 보통', cls:'chip-blue' };
  return { text:'여유', cls:'chip-green' };
}

function _dashSetText(id, v){
  var el = document.getElementById(id);
  if(el) el.textContent = v;
}

// ── KPI 렌더 ──────────────────────────────────────────────
function _dashRenderKpi(){
  var totalApps = APPLICANTS.filter(function(a){ return !_dashIsCancelled(a); }).length;
  var cancelled = APPLICANTS.length - totalApps;

  var totalSlots = SCHEDULES.reduce(function(sum, s){ return sum + (Number(s.slots) || 0); }, 0);

  // 평균 경쟁률 = 총 유효 신청 / 총 구좌
  var avgRate = totalSlots > 0 ? (totalApps / totalSlots) : 0;

  // 최고 경쟁률 (일정 단위)
  var maxRate = 0;
  SCHEDULES.forEach(function(s){
    var a = _dashCountAppsFor(s);
    var sl = Number(s.slots) || 0;
    if(sl > 0) maxRate = Math.max(maxRate, a / sl);
  });

  // 대기 인원 = 일정별 구좌 초과분의 합
  var totalWait = SCHEDULES.reduce(function(sum, s){
    var a = _dashCountAppsFor(s);
    var sl = Number(s.slots) || 0;
    return sum + Math.max(0, a - sl);
  }, 0);

  _dashSetText('kpi-total-apps',  totalApps);
  _dashSetText('kpi-total-slots', totalSlots);
  _dashSetText('kpi-avg-rate',    avgRate.toFixed(1) + ':1');
  _dashSetText('kpi-wait',        totalWait);

  _dashSetText('kpi-total-apps-sub',  cancelled > 0 ? '취소 제외 · 취소 ' + cancelled + '건' : '취소 제외');
  _dashSetText('kpi-total-slots-sub', '일정 ' + SCHEDULES.length + '건');
  _dashSetText('kpi-avg-rate-sub',    '최고 ' + maxRate.toFixed(1) + ':1');
  _dashSetText('kpi-wait-sub',        '구좌 초과분 합계');
}

// ── 날짜별 신청 현황 테이블 ──────────────────────────────
function _dashRenderTable(){
  var tb = document.getElementById('dash-table-body');
  if(!tb) return;
  tb.innerHTML = '';

  if(!SCHEDULES.length){
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ink4)">등록된 일정이 없습니다.</td></tr>';
    return;
  }

  var sorted = SCHEDULES.slice().sort(function(a, b){
    return (a.date || '') < (b.date || '') ? -1 : 1;
  });

  sorted.forEach(function(s){
    var apply = _dashCountAppsFor(s);
    var slots = Number(s.slots) || 0;
    var rate  = slots > 0 ? (apply / slots) : 0;
    var info  = _dashStatusChip(apply, slots);

    var parts = String(s.date || '').split('-');
    var dateLabel = (parts.length === 3)
      ? (parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일')
      : (s.date || '—');
    var dayLabel = s.day ? ' (' + s.day + ')' : '';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + dateLabel + dayLabel + '</td>' +
      '<td>' + (s.room || '—') + '</td>' +
      '<td>' + (s.maxPeople || s.cap || 0) + '명</td>' +
      '<td>' + apply + '명</td>' +
      '<td>' + rate.toFixed(1) + ':1</td>' +
      '<td><span class="chip ' + info.cls + '">' + info.text + '</span></td>';
    tb.appendChild(tr);
  });
}

// ── 상단 기간 문구 ──────────────────────────────────────
function _dashRenderPeriod(){
  var el = document.getElementById('dash-period');
  if(!el) return;
  if(!SCHEDULES.length){
    el.textContent = '아직 등록된 일정이 없습니다. [일정 관리] 에서 이용일을 추가해주세요.';
    return;
  }
  var dates = SCHEDULES.map(function(s){ return s.date; }).filter(Boolean).sort();
  if(!dates.length){
    el.textContent = '일정의 이용일 정보가 없습니다.';
    return;
  }
  var earliest = dates[0];
  var latest   = dates[dates.length - 1];
  var ep = earliest.split('-');
  var lp = latest.split('-');
  var txt;
  if(earliest === latest){
    txt = ep[0] + '년 ' + parseInt(ep[1]) + '월 ' + parseInt(ep[2]) + '일';
  } else if(ep[0] === lp[0] && ep[1] === lp[1]){
    txt = ep[0] + '년 ' + parseInt(ep[1]) + '월';
  } else if(ep[0] === lp[0]){
    txt = ep[0] + '년 ' + parseInt(ep[1]) + '월 ~ ' + parseInt(lp[1]) + '월';
  } else {
    txt = ep[0] + '년 ' + parseInt(ep[1]) + '월 ~ ' + lp[0] + '년 ' + parseInt(lp[1]) + '월';
  }
  el.textContent = txt + ' 신청 현황을 한눈에 확인하세요.';
}
