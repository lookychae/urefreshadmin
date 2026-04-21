/**
 * 룸타입 관리 (CRUD + 색상 피커)
 * 전역: renderColorPicker, renderRooms, openAddRoom, addRoom, editRoom, saveRoom, deleteRoom
 */

var editingRoomId = null;

function renderColorPicker(currentRoomId){
  var wrap = document.getElementById('color-picker-wrap');
  if(!wrap) return;
  wrap.innerHTML = '';

  var usedMap = {};
  ROOMS.forEach(function(r){
    if(r.id !== currentRoomId && r.color) usedMap[r.color] = r.name;
  });

  var currentColor = 'blue';
  if(currentRoomId){
    var cur = ROOMS.find(function(r){ return r.id === currentRoomId; });
    if(cur) currentColor = cur.color || 'blue';
  }

  COLOR_LIST.forEach(function(c){
    var isUsed = !!usedMap[c.value];
    var wrapDiv = document.createElement('div');
    wrapDiv.className = 'color-label-wrap';

    var lbl = document.createElement('label');
    lbl.style.cssText = 'cursor:' + (isUsed ? 'not-allowed' : 'pointer') + ';position:relative';

    var inp = document.createElement('input');
    inp.type = 'radio'; inp.name = 'room-color'; inp.value = c.value;
    inp.style.display = 'none';
    if(c.value === currentColor) inp.checked = true;
    if(isUsed) inp.disabled = true;

    var dot = document.createElement('span');
    dot.className = 'color-dot' + (isUsed ? ' used' : '');
    dot.style.background = isUsed ? '#D1D6DB' : c.hex;

    lbl.appendChild(inp);
    lbl.appendChild(dot);

    var nameEl = document.createElement('span');
    nameEl.className = 'color-used-label' + (isUsed ? '' : ' active');
    nameEl.textContent = isUsed ? usedMap[c.value] : '';
    nameEl.title       = isUsed ? usedMap[c.value] : '';

    wrapDiv.appendChild(lbl);
    wrapDiv.appendChild(nameEl);
    wrap.appendChild(wrapDiv);
  });
}

function renderRooms(){
  var g = document.getElementById('room-grid');
  g.innerHTML = '';

  var legend = document.getElementById('color-legend');
  if(legend){
    var used = {};
    ROOMS.forEach(function(r){
      if(r.color){
        if(!used[r.color]) used[r.color] = [];
        used[r.color].push(r.name);
      }
    });
    var html = '<span style="font-weight:600;color:var(--ink4)">색상 구분</span>';
    Object.keys(used).forEach(function(c){
      var hex = COLOR_MAP[c] || '#ccc';
      html += '<span style="display:inline-flex;align-items:center;gap:5px">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + hex + ';display:inline-block;flex-shrink:0"></span>' +
        '<span style="color:var(--ink2)">' + used[c].join(', ') + '</span>' +
      '</span>';
    });
    legend.innerHTML = html;
  }

  ROOMS.forEach(function(r){
    var d = document.createElement('div');
    d.className = 'room-card';
    d.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;width:220px;flex-shrink:0;background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,0.08);padding:20px;position:relative';
    var infantOk = r.infant === 'possible';
    var ibg = infantOk ? '#E8FAF2' : '#FFF0F1';
    var itx = infantOk ? '#027A48' : '#7D1B16';
    var idc = infantOk ? '#05C072' : '#F04452';
    d.innerHTML =
      '<div class="room-card-name">' + r.name + '</div>' +
      '<div style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;background:' + ibg + ';color:' + itx + ';margin-bottom:8px"><span style="width:6px;height:6px;border-radius:50%;background:' + idc + ';display:inline-block;flex-shrink:0"></span>영유아 ' + (infantOk ? '가능' : '불가') + '</div>' +
      '<div style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;background:#EBF3FF;color:#1B64DA;margin-bottom:8px"><span style="width:6px;height:6px;border-radius:50%;background:#3182F6;display:inline-block;flex-shrink:0"></span>구좌 ' + r.slots + '개</div>' +
      '<div class="room-card-meta">최대 ' + r.cap + '명' + (r.note ? ' · ' + r.note : '') + '</div>' +
      '<div class="room-card-actions">' +
        '<button class="btn btn-outline" style="font-size:12px;padding:5px 10px" onclick="editRoom(' + r.id + ')">수정</button>' +
        '<button class="btn btn-danger" style="font-size:12px;padding:5px 10px" onclick="deleteRoom(' + r.id + ')">삭제</button>' +
      '</div>';
    g.appendChild(d);
  });

  // 룸타입 select 동기화 (일정 추가 모달용)
  var sel = document.getElementById('sch-room-type');
  sel.innerHTML = '';
  ROOMS.forEach(function(r){
    var o = document.createElement('option');
    o.value = r.name;
    o.textContent = r.name + ' (최대 ' + r.cap + '명)';
    sel.appendChild(o);
  });
}

function _readRoomForm(){
  var name    = document.getElementById('room-name').value.trim();
  var cap     = parseInt(document.getElementById('room-cap').value) || 0;
  var slots   = parseInt(document.getElementById('room-slots').value) || 0;
  var colorEl = document.querySelector('input[name="room-color"]:checked');
  var color   = colorEl ? colorEl.value : 'blue';
  var infant  = document.querySelector('input[name="room-infant"]:checked');
  var infantVal = infant ? infant.value : 'impossible';
  var note    = document.getElementById('room-note').value.trim();
  if(!name || !cap || !slots){
    alert('이름, 최대 인원, 구좌 수를 입력해 주세요.');
    return null;
  }
  return { name:name, cap:cap, slots:slots, color:color, infant:infantVal, note:note };
}

function addRoom(){
  var v = _readRoomForm();
  if(!v) return;
  ROOMS.push(Object.assign({ id: Date.now() }, v));
  saveRoomsData();
  closeModal('modal-room');
  renderRooms();
}

function openAddRoom(){
  editingRoomId = null;
  document.getElementById('modal-room-title').textContent = '룸타입 추가';
  document.getElementById('modal-room-save-btn').textContent = '추가하기';
  document.getElementById('modal-room-save-btn').onclick = addRoom;
  document.getElementById('room-name').value = '';
  document.getElementById('room-slots').value = '';
  document.getElementById('room-cap').value = '';
  renderColorPicker(null);
  document.getElementById('room-infant-no').checked = true;
  document.getElementById('room-note').value = '';
  openModal('modal-room');
}

function editRoom(id){
  var r = ROOMS.find(function(x){ return x.id === id; });
  if(!r) return;
  editingRoomId = id;
  document.getElementById('modal-room-title').textContent = '룸타입 수정';
  document.getElementById('modal-room-save-btn').textContent = '저장하기';
  document.getElementById('modal-room-save-btn').onclick = saveRoom;
  document.getElementById('room-name').value = r.name;
  document.getElementById('room-slots').value = r.slots;
  document.getElementById('room-cap').value = r.cap;
  renderColorPicker(r.id);
  if(r.infant === 'possible') document.getElementById('room-infant-ok').checked = true;
  else                        document.getElementById('room-infant-no').checked = true;
  document.getElementById('room-note').value = r.note || '';
  openModal('modal-room');
}

function saveRoom(){
  var v = _readRoomForm();
  if(!v) return;
  var idx = ROOMS.findIndex(function(x){ return x.id === editingRoomId; });
  if(idx === -1) return;
  ROOMS[idx] = Object.assign({}, ROOMS[idx], v);
  saveRoomsData();
  closeModal('modal-room');
  renderRooms();
}

function deleteRoom(id){
  if(!confirm('삭제하시겠습니까?')) return;
  ROOMS = ROOMS.filter(function(r){ return r.id !== id; });
  saveRoomsData();
  renderRooms();
}
