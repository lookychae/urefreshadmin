/**
 * 추첨 관리 (목록 렌더 + 추첨 실행)
 * 전역: renderLottery, runLottery
 */

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

  SCHEDULES.forEach(function(s){
    var col = COLOR_MAP[s.color] || '#3182F6';
    var datePart = s.date.slice(5);
    var month = parseInt(datePart.split('-')[0]) + '월';
    var day   = parseInt(datePart.split('-')[1]) + '일';
    var year  = s.date.split('-')[0];
    var row = document.createElement('div');
    row.className = 'lottery-row';
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
        '<button class="btn btn-primary" style="font-size:12px;padding:5px 12px" onclick="runLottery(this)">추첨 실행</button>' +
        '<button class="btn btn-outline" style="font-size:12px;padding:5px 12px">결과 보기</button>' +
        '<button class="btn btn-outline" style="font-size:12px;padding:5px 12px">SMS 발송</button>' +
      '</div>';
    wrap.appendChild(row);
  });
  c.appendChild(wrap);
}

function runLottery(btn){
  if(!confirm('추첨을 실행하시겠습니까? 실행 후 되돌릴 수 없습니다.')) return;
  btn.textContent = '추첨 완료';
  btn.className = 'btn btn-green';
  btn.disabled = true;
}
