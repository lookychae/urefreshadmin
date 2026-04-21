/**
 * 신청자 명단 (렌더 / 필터 / 검색 / 엑셀 다운로드 / 시트 동기화)
 * 전역: renderApplicants, filterApplicants, searchApplicants, exportExcel, loadApplicantsFromSheet
 */

var curFilter = 'all';

function renderApplicants(list){
  var tb = document.getElementById('applicant-tbody');
  tb.innerHTML = '';
  list.forEach(function(a){
    var tr = document.createElement('tr');
    var infantBadge  = a.infant  ? '<span class="chip chip-blue">영아</span>'  : '<span style="color:var(--ink4);font-size:12px">—</span>';
    var toddlerBadge = a.toddler ? '<span class="chip chip-green">유아</span>' : '<span style="color:var(--ink4);font-size:12px">—</span>';
    tr.innerHTML =
      '<td style="font-family:monospace;font-size:12px">' + a.eno + '</td>' +
      '<td style="font-weight:600">' + a.name + '</td>' +
      '<td>' + a.date + '</td>' +
      '<td>' + a.room + '</td>' +
      '<td>' + a.fam + '명</td>' +
      '<td>' + infantBadge  + '</td>' +
      '<td>' + toddlerBadge + '</td>' +
      '<td style="color:var(--ink3)">' + a.at + '</td>' +
      '<td>' + (STATUS_MAP[a.status] || a.status) + '</td>' +
      '<td style="color:var(--ink3);text-align:center">' + a.rank + '</td>';
    tb.appendChild(tr);
  });
}

function filterApplicants(f, el){
  curFilter = f;
  document.querySelectorAll('.filter-chip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
  var list = f === 'all' ? APPLICANTS : APPLICANTS.filter(function(a){ return a.status === f; });
  renderApplicants(list);
}

function searchApplicants(q){
  q = q.toLowerCase();
  var list = APPLICANTS.filter(function(a){ return a.name.includes(q) || a.eno.includes(q); });
  renderApplicants(list);
}

function exportExcel(){
  var headers = ['신청일시','사번','성명','이용일','룸타입','동반가족수','영아동반','유아동반','상태','대기순'];
  var rows = APPLICANTS.map(function(a){
    return [a.at, a.eno, a.name, a.date, a.room, a.fam, a.infant?'예':'아니오', a.toddler?'예':'아니오', a.status, a.rank];
  });
  var csv = [headers].concat(rows).map(function(r){
    return r.map(function(v){ return '"' + (v || '').toString().replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var bom = '﻿';
  var blob = new Blob([bom + csv], { type:'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '신청자명단_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function loadApplicantsFromSheet(){
  apiGetAllApps()
    .then(function(rows){
      if(!rows || !rows.length) return;
      APPLICANTS = rows.map(function(r, i){
        return {
          eno:     r['사번'] || '',
          name:    r['성명'] || '',
          date:    r['이용일'] || '',
          room:    r['룸타입'] || '',
          fam:     r['동반가족수'] || r['동반가족'] || 0,
          infant:  r['영아동반'] === '예',
          toddler: r['유아동반'] === '예',
          at:      r['신청일시'] || '',
          status:  r['상태'] === '신청완료' ? 'applied' : 'applied',
          rank:    '—'
        };
      });
      saveApplicantsData();
      renderApplicants(APPLICANTS);
      renderLottery();
    })
    .catch(function(e){ console.warn('시트 불러오기 실패', e); });
}
