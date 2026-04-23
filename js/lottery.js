/**
 * 추첨 관리 (목록 렌더 + 1회성 추첨 실행)
 * 전역: renderLottery, runLottery
 *
 * 중복 추첨 방지:
 *   완료된 일정의 key(date|room) 를 localStorage 에 기록.
 *   페이지 새로고침 후에도 '추첨 완료' 상태 유지됨.
 */

function _lotteryKey(s){
  return (s.date || '') + '|' + (s.room || '');
}

function _getDoneLotteries(){
  try { return JSON.parse(localStorage.getItem('ufresh_lotteries_done')) || {}; }
  catch(e) { return {}; }
}

function _setLotteryDone(key){
  var done = _getDoneLotteries();
  done[key] = new Date().toISOString();
  localStorage.setItem('ufresh_lotteries_done', JSON.stringify(done));
}

function _isLotteryDone(key){
  return !!_getDoneLotteries()[key];
}

function renderLottery(){
  var c = document.getElementById('lottery-list');
  c.innerHTML = '';
  if(!SCHEDULES.length){
    c.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink4);font-size:13px;">등록된 일정이 없습니다.</div>';
    return;
  }
  var wrap = document.createElement('div');
  wrap.className = 'lottery-table';

  var head = document.createElement('div');
  head.className = 'lottery-table-head';
  head.innerHTML =
    '<span>이용일 · 룸타입</span>' +
    '<span>총 신청</span>' +
    '<span>당첨 구좌</span>' +
    '<span>당첨자</span>' +
    '<span>대기자</span>' +
    '<span>관리</span>';
  wrap.appendChild(head);

  var doneMap = _getDoneLotteries();

  SCHEDULES.forEach(function(s){
    var col = COLOR_MAP[s.color] || '#3182F6';
    var datePart = (s.date || '').slice(5);
    var month = parseInt((datePart.split('-')[0] || 0)) + '월';
    var day   = parseInt((datePart.split('-')[1] || 0)) + '일';
    var year  = (s.date || '').split('-')[0];
    var key   = _lotteryKey(s);
    var isDone = !!doneMap[key];

    var row = document.createElement('div');
    row.className = 'lottery-row';

    var runBtnHtml = isDone
      ? '<button class="btn btn-green" style="font-size:12px;padding:5px 12px" disabled>추첨 완료</button>'
      : '<button class="btn btn-primary" style="font-size:12px;padding:5px 12px" data-key="' + _escAttr(key) + '" onclick="runLottery(this)">추첨 실행</button>';

    row.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div style="width:8px;height:8px;border-radius:50%;background:' + col + ';flex-shrink:0"></div>' +
        '<div>' +
          '<div style="font-weight:600;color:var(--ink)">' + month + ' ' + day + ' (' + s.day + ')</div>' +
          '<div style="font-size:12px;color:var(--ink3);margin-top:1px">' + year + '년 · ' + s.room + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-weight:700;color:var(--ink)">12</div>' +
      '<div style="font-weight:700;color:var(--blue)">' + s.slots + '</div>' +
      '<div style="font-weight:700;color:var(--green-dk)">0</div>' +
      '<div style="font-weight:700;color:var(--orange-dk)">0</div>' +
      '<div class="lp-actions">' +
        runBtnHtml +
        '<button class="btn btn-outline" style="font-size:12px;padding:5px 12px">결과 보기</button>' +
        '<button class="btn btn-outline" style="font-size:12px;padding:5px 12px">SMS 발송</button>' +
      '</div>';
    wrap.appendChild(row);
  });
  c.appendChild(wrap);
}

function _escAttr(v){
  return String(v).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function runLottery(btn){
  var key = btn.getAttribute('data-key') || '';
  if(!key){ alert('일정 정보를 찾을 수 없습니다.'); return; }
  if(_isLotteryDone(key)){
    alert('이미 추첨이 완료된 일정입니다.');
    return;
  }
  if(!confirm('추첨을 실행하시겠습니까?\n실행 후 되돌릴 수 없고, 같은 일정은 다시 추첨할 수 없습니다.')) return;

  _setLotteryDone(key);
  btn.textContent = '추첨 완료';
  btn.className = 'btn btn-green';
  btn.disabled = true;
  btn.onclick = null;
  btn.removeAttribute('data-key');
}
