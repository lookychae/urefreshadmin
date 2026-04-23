/**
 * 공지사항 관리 (CRUD)
 * 전역: NOTICES, renderNotices, openAddNotice, addNotice, editNotice, saveNotice,
 *       deleteNotice, loadNoticesFromSheet
 *
 * 서버(Google Sheets)를 기준으로 하되, 실패 시 localStorage 캐시 사용.
 */

var NOTICES = [];
var editingNoticeId = null;

// ── 로컬 캐시 ──
function _loadNoticesLocal(){
  try { return JSON.parse(localStorage.getItem('ufresh_notices')) || []; }
  catch(e){ return []; }
}

function _saveNoticesLocal(){
  localStorage.setItem('ufresh_notices', JSON.stringify(NOTICES));
}

// ── 서버 동기화 ──
function loadNoticesFromSheet(){
  // 먼저 로컬 캐시 적용 (빠른 렌더)
  NOTICES = _loadNoticesLocal();
  renderNotices();

  apiGetNotices()
    .then(function(rows){
      if(!Array.isArray(rows)) return;
      NOTICES = rows.map(function(r){
        return {
          id:        String(r.id || ''),
          title:     r.title || '',
          content:   r.content || '',
          author:    r.author || '',
          createdAt: r.createdAt || ''
        };
      });
      _saveNoticesLocal();
      renderNotices();
    })
    .catch(function(e){ console.warn('공지 불러오기 실패', e); });
}

// ── 렌더 ──
function renderNotices(){
  var tb = document.getElementById('notice-tbody');
  if(!tb) return;
  tb.innerHTML = '';
  if(!NOTICES.length){
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--ink4)">등록된 공지사항이 없습니다.</td></tr>';
    return;
  }
  // 최신순 정렬 (createdAt 내림차순)
  var sorted = NOTICES.slice().sort(function(a, b){
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
  sorted.forEach(function(n){
    var tr = document.createElement('tr');
    var title = (n.title || '').replace(/</g, '&lt;');
    var author = (n.author || '').replace(/</g, '&lt;');
    tr.innerHTML =
      '<td style="font-weight:600">' + title + '</td>' +
      '<td style="color:var(--ink3)">' + author + '</td>' +
      '<td style="color:var(--ink3)">' + toDotDate(n.createdAt) + '</td>' +
      '<td style="text-align:right">' +
        '<button class="btn btn-outline" style="font-size:12px;padding:5px 10px" onclick="editNotice(\'' + n.id + '\')">수정</button> ' +
        '<button class="btn btn-danger" style="font-size:12px;padding:5px 10px;margin-left:4px" onclick="deleteNotice(\'' + n.id + '\')">삭제</button>' +
      '</td>';
    tb.appendChild(tr);
  });
}

// ── 모달 열기 ──
function openAddNotice(){
  editingNoticeId = null;
  document.getElementById('modal-notice-title').textContent = '공지사항 등록';
  document.getElementById('modal-notice-save-btn').textContent = '등록하기';
  document.getElementById('modal-notice-save-btn').onclick = addNotice;
  document.getElementById('notice-title').value   = '';
  document.getElementById('notice-content').value = '';
  document.getElementById('notice-author').value  = '총무팀';
  openModal('modal-notice');
}

function editNotice(id){
  var n = NOTICES.find(function(x){ return String(x.id) === String(id); });
  if(!n) return;
  editingNoticeId = id;
  document.getElementById('modal-notice-title').textContent = '공지사항 수정';
  document.getElementById('modal-notice-save-btn').textContent = '저장하기';
  document.getElementById('modal-notice-save-btn').onclick = saveNotice;
  document.getElementById('notice-title').value   = n.title   || '';
  document.getElementById('notice-content').value = n.content || '';
  document.getElementById('notice-author').value  = n.author  || '총무팀';
  openModal('modal-notice');
}

// ── 폼 읽기 ──
function _readNoticeForm(){
  var title   = document.getElementById('notice-title').value.trim();
  var content = document.getElementById('notice-content').value.trim();
  var author  = document.getElementById('notice-author').value.trim() || '총무팀';
  if(!title || !content){
    alert('제목과 내용을 입력해 주세요.');
    return null;
  }
  return { title:title, content:content, author:author };
}

// ── 등록 ──
function addNotice(){
  var v = _readNoticeForm();
  if(!v) return;
  var btn = document.getElementById('modal-notice-save-btn');
  btn.disabled = true; btn.textContent = '등록 중...';

  apiSaveNotice(v)
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res && res.ok){
        closeModal('modal-notice');
        loadNoticesFromSheet();
      } else {
        alert('등록 실패: ' + (res && res.error ? res.error : '알 수 없는 오류'));
      }
    })
    .catch(function(err){
      alert('네트워크 오류: ' + err.message);
    })
    .finally(function(){
      btn.disabled = false; btn.textContent = '등록하기';
    });
}

// ── 수정 저장 (편집 모달에서 사용) ──
function saveNotice(){
  var v = _readNoticeForm();
  if(!v) return;
  v.id = editingNoticeId;
  var btn = document.getElementById('modal-notice-save-btn');
  btn.disabled = true; btn.textContent = '저장 중...';

  apiSaveNotice(v)
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res && res.ok){
        closeModal('modal-notice');
        loadNoticesFromSheet();
      } else {
        alert('저장 실패: ' + (res && res.error ? res.error : '알 수 없는 오류'));
      }
    })
    .catch(function(err){
      alert('네트워크 오류: ' + err.message);
    })
    .finally(function(){
      btn.disabled = false; btn.textContent = '저장하기';
    });
}

// ── 삭제 ──
function deleteNotice(id){
  if(!confirm('이 공지사항을 삭제하시겠습니까?')) return;
  apiDeleteNotice(id)
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res && res.ok){
        loadNoticesFromSheet();
      } else {
        alert('삭제 실패: ' + (res && res.error ? res.error : '알 수 없는 오류'));
      }
    })
    .catch(function(err){
      alert('네트워크 오류: ' + err.message);
    });
}
