/**
 * 신청자 명단 (렌더 / 필터 / 검색 / 정렬 / 삭제 / 엑셀 / 시트 동기화)
 * 전역: renderApplicants, filterApplicants, searchApplicants, exportExcel,
 *       loadApplicantsFromSheet, toggleApplicantSort, deleteApplicantRow
 */

var curFilter = 'all';
var applicantSort = { field: 'date', dir: 'desc' };   // 기본: 이용일 내림차순
var _lastFilteredApps = null;                         // 검색/필터 결과 캐시
var applicantsSelected = {};                          // key: eno|at, value: true

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

function _applicantKey(a){
  return String(a.eno) + '|' + String(a.at);
}

function renderApplicants(list){
  _lastFilteredApps = list;
  var tb = document.getElementById('applicant-tbody');
  tb.innerHTML = '';
  var sorted = _sortApplicants(list);
  sorted.forEach(function(a){
    var tr = document.createElement('tr');
    var key = _applicantKey(a);
    var checked = applicantsSelected[key] ? 'checked' : '';
    var infantBadge  = a.infant  ? '<span class="chip chip-blue">영아</span>'  : '<span style="color:var(--ink4);font-size:12px">—</span>';
    var toddlerBadge = a.toddler ? '<span class="chip chip-green">유아</span>' : '<span style="color:var(--ink4);font-size:12px">—</span>';
    var delBtn = '<button class="btn btn-danger" style="font-size:11px;padding:4px 10px" onclick="deleteApplicantRow(\'' + _escAttr(a.eno) + '\', \'' + _escAttr(a.at) + '\')">삭제</button>';
    // 동반가족: 값이 이미 "2명", "본인 포함 1명" 처럼 '명' 포함하면 그대로, 숫자면 '명' 붙임
    var famStr = String(a.fam == null ? '' : a.fam).trim();
    var famDisplay = (famStr && famStr.indexOf('명') === -1) ? (famStr + '명') : (famStr || '—');

    tr.innerHTML =
      '<td class="app-check" style="text-align:center"><input type="checkbox" ' + checked + ' data-key="' + _escAttr(key) + '" onchange="toggleApplicantSelection(this)" style="accent-color:var(--blue);cursor:pointer"></td>' +
      '<td style="font-family:monospace;font-size:12px">' + a.eno + '</td>' +
      '<td style="font-weight:600">' + a.name + '</td>' +
      '<td>' + _fmtDateOnly(a.date) + '</td>' +
      '<td>' + a.room + '</td>' +
      '<td>' + famDisplay + '</td>' +
      '<td>' + infantBadge  + '</td>' +
      '<td>' + toddlerBadge + '</td>' +
      '<td style="color:var(--ink3)">' + a.at + '</td>' +
      '<td>' + (STATUS_MAP[a.status] || a.status) + '</td>' +
      '<td style="color:var(--ink3);text-align:center">' + a.rank + '</td>' +
      '<td style="text-align:center">' + delBtn + '</td>';
    tb.appendChild(tr);
  });
  _applySortArrow();
  _syncApplicantsSelectionUI();
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
      if(typeof renderDashboard === 'function') renderDashboard();
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
        if(typeof renderDashboard === 'function') renderDashboard();
      } else {
        alert('삭제 실패: ' + (res && res.error ? res.error : '서버 응답 오류'));
      }
    })
    .catch(function(err){
      alert('네트워크 오류: ' + err.message);
    });
}

// ── 다중 선택 / 일괄 삭제 ────────────────────────────────
function toggleApplicantSelection(input){
  var key = input.getAttribute('data-key');
  if(!key) return;
  if(input.checked) applicantsSelected[key] = true;
  else              delete applicantsSelected[key];
  _syncApplicantsSelectionUI();
}

function toggleSelectAllApplicants(input){
  var list = _lastFilteredApps || APPLICANTS;
  if(input.checked){
    // 현재 필터/검색 결과 전체 선택
    applicantsSelected = {};
    list.forEach(function(a){ applicantsSelected[_applicantKey(a)] = true; });
  } else {
    applicantsSelected = {};
  }
  // 표시중인 체크박스들 상태 동기화
  var boxes = document.querySelectorAll('#applicant-tbody .app-check input[type=checkbox]');
  for(var i = 0; i < boxes.length; i++){
    var key = boxes[i].getAttribute('data-key');
    boxes[i].checked = !!applicantsSelected[key];
  }
  _syncApplicantsSelectionUI();
}

function _syncApplicantsSelectionUI(){
  var keys = Object.keys(applicantsSelected).filter(function(k){ return applicantsSelected[k]; });
  var count = keys.length;

  var btn = document.getElementById('app-delete-selected-btn');
  var countEl = document.getElementById('app-selected-count');
  if(btn) btn.style.display = count > 0 ? 'inline-flex' : 'none';
  if(countEl) countEl.textContent = count;

  var selAll = document.getElementById('app-select-all');
  if(selAll){
    var total = _lastFilteredApps ? _lastFilteredApps.length : 0;
    if(total === 0){
      selAll.checked = false; selAll.indeterminate = false;
    } else if(count >= total){
      selAll.checked = true;  selAll.indeterminate = false;
    } else if(count === 0){
      selAll.checked = false; selAll.indeterminate = false;
    } else {
      selAll.checked = false; selAll.indeterminate = true;
    }
  }
}

function deleteSelectedApplicants(){
  var selected = [];
  Object.keys(applicantsSelected).forEach(function(k){
    if(!applicantsSelected[k]) return;
    var parts = k.split('|');
    selected.push({ key: k, eno: parts[0], at: parts.slice(1).join('|') });
  });
  if(!selected.length) return;
  if(!confirm('선택한 ' + selected.length + '건의 신청자를 삭제하시겠습니까?\n삭제 후 되돌릴 수 없고 Google Sheets 에서도 제거됩니다.')) return;

  var promises = selected.map(function(s){
    return apiDeleteApplicant(s.eno, s.at)
      .then(function(r){ return r.json(); })
      .then(function(res){ return { item:s, ok: !!(res && res.ok), res:res }; })
      .catch(function(err){ return { item:s, ok:false, err:err }; });
  });

  Promise.all(promises).then(function(results){
    var okItems   = results.filter(function(r){ return r.ok; });
    var failCount = results.length - okItems.length;

    // 성공한 것만 APPLICANTS 에서 제거
    okItems.forEach(function(r){
      APPLICANTS = APPLICANTS.filter(function(a){
        return !(String(a.eno) === String(r.item.eno) && String(a.at) === String(r.item.at));
      });
    });

    applicantsSelected = {};
    saveApplicantsData();
    var list = curFilter === 'all' ? APPLICANTS : APPLICANTS.filter(function(a){ return a.status === curFilter; });
    renderApplicants(list);
    renderLottery();
    if(typeof renderDashboard === 'function') renderDashboard();

    if(failCount > 0){
      alert('삭제 완료: ' + okItems.length + '건\n삭제 실패: ' + failCount + '건');
    }
  });
}
