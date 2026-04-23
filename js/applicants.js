/**
 * 신청자 명단 (렌더 / 필터 / 검색 / 정렬 / 삭제 / 엑셀 / 시트 동기화)
 * 전역: renderApplicants, filterApplicants, searchApplicants, exportExcel,
 *       loadApplicantsFromSheet, toggleApplicantSort, deleteApplicantRow
 */

var curFilter = 'all';
var applicantSort = { field: 'date', dir: 'desc' };   // 기본: 이용일 내림차순
var _lastFilteredApps = null;                         // 검색/필터 결과 캐시

// ── 날짜 포맷: 시간 제거, 'YYYY년 M월 D일' ──
function _fmtDateOnly(v){
  if(!v) return '';
  var s = String(v).trim();
  // 이미 한국어 포맷
  var mKor = s.match(/(\d+)년\s*(\d+)월\s*(\d+)일/);
  if(mKor) return mKor[1] + '년 ' + mKor[2] + '월 ' + mKor[3] + '일';
  // ISO / Long Date → 파싱
  var d = new Date(s);
  if(isNaN(d.getTime())) return s;
  return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
}

// 정렬 비교용 키 (YYYY-MM-DD)
function _dateSortKey(v){
  if(!v) return '';
  var s = String(v);
  var mKor = s.match(/(\d+)년\s*(\d+)월\s*(\d+)일/);
  if(mKor) return mKor[1] + '-' + String(mKor[2]).padStart(2, '0') + '-' + String(mKor[3]).padStart(2, '0');
  var d = new Date(s);
  if(isNaN(d.getTime())) return s;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function _sortApplicants(list){
  var sorted = list.slice();
  if(applicantSort.field === 'date'){
    sorted.sort(function(a, b){
      var ka = _dateSortKey(a.date);
      var kb = _dateSortKey(b.date);
      if(ka === kb) return 0;
      var cmp = ka > kb ? 1 : -1;
      return applicantSort.dir === 'asc' ? cmp : -cmp;
    });
  }
  return sorted;
}

function _applySortArrow(){
  var el = document.getElementById('sort-date-arrow');
  if(el) el.textContent = applicantSort.dir === 'asc' ? '▲' : '▼';
}

// 헤더 클릭 시 호출
function toggleApplicantSort(field){
  if(applicantSort.field === field){
    applicantSort.dir = applicantSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    applicantSort.field = field;
    applicantSort.dir = 'asc';
  }
  // 현재 필터 적용된 리스트 재렌더
  var list = _lastFilteredApps || APPLICANTS;
  renderApplicants(list);
}

function _escAttr(v){ return String(v == null ? '' : v).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

function renderApplicants(list){
  _lastFilteredApps = list;
  var tb = document.getElementById('applicant-tbody');
  tb.innerHTML = '';
  var sorted = _sortApplicants(list);
  sorted.forEach(function(a){
    var tr = document.createElement('tr');
    var infantBadge  = a.infant  ? '<span class="chip chip-blue">영아</span>'  : '<span style="color:var(--ink4);font-size:12px">—</span>';
    var toddlerBadge = a.toddler ? '<span class="chip chip-green">유아</span>' : '<span style="color:var(--ink4);font-size:12px">—</span>';
    var delBtn = '<button class="btn btn-danger" style="font-size:11px;padding:4px 10px" onclick="deleteApplicantRow(\'' + _escAttr(a.eno) + '\', \'' + _escAttr(a.at) + '\')">삭제</button>';
    tr.innerHTML =
      '<td style="font-family:monospace;font-size:12px">' + a.eno + '</td>' +
      '<td style="font-weight:600">' + a.name + '</td>' +
      '<td>' + _fmtDateOnly(a.date) + '</td>' +
      '<td>' + a.room + '</td>' +
      '<td>' + a.fam + '명</td>' +
      '<td>' + infantBadge  + '</td>' +
      '<td>' + toddlerBadge + '</td>' +
      '<td style="color:var(--ink3)">' + a.at + '</td>' +
      '<td>' + (STATUS_MAP[a.status] || a.status) + '</td>' +
      '<td style="color:var(--ink3);text-align:center">' + a.rank + '</td>' +
      '<td style="text-align:center">' + delBtn + '</td>';
    tb.appendChild(tr);
  });
  _applySortArrow();
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
    return [a.at, a.eno, a.name, _fmtDateOnly(a.date), a.room, a.fam, a.infant?'예':'아니오', a.toddler?'예':'아니오', a.status, a.rank];
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
      // 현재 필터에 맞춰 재렌더
      var list = curFilter === 'all' ? APPLICANTS : APPLICANTS.filter(function(a){ return a.status === curFilter; });
      renderApplicants(list);
      renderLottery();
    })
    .catch(function(e){ console.warn('시트 불러오기 실패', e); });
}

// ── 삭제 (서버 반영) ──────────────────────────────────────
function deleteApplicantRow(eno, at){
  if(!confirm('이 신청자를 명단에서 삭제하시겠습니까?\n삭제 후 되돌릴 수 없고 Google Sheets 에서도 제거됩니다.')) return;

  apiDeleteApplicant(eno, at)
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res && res.ok){
        APPLICANTS = APPLICANTS.filter(function(a){
          return !(String(a.eno) === String(eno) && String(a.at) === String(at));
        });
        saveApplicantsData();
        var list = curFilter === 'all' ? APPLICANTS : APPLICANTS.filter(function(a){ return a.status === curFilter; });
        renderApplicants(list);
        renderLottery();
      } else {
        alert('삭제 실패: ' + (res && res.error ? res.error : '서버 응답 오류'));
      }
    })
    .catch(function(err){
      alert('네트워크 오류: ' + err.message);
    });
}
