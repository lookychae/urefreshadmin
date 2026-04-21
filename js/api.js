/**
 * Google Apps Script 통신 계층
 * 전역: SCRIPT_URL, apiGetAllApps, apiSaveSettings,
 *       apiGetNotices, apiSaveNotice, apiDeleteNotice
 */

var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyVx3lQqozqixGQWHLaYpFMlqS8NbPiUCgAyEjoDxFEnrdQJcfnlS4vA-JK8RXGoIoc_g/exec';

function apiGetAllApps(){
  return fetch(SCRIPT_URL).then(function(r){ return r.json(); });
}

function apiSaveSettings(payload){
  return fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ action:'saveSettings' }, payload))
  });
}

// ── 공지사항 ──
function apiGetNotices(){
  return fetch(SCRIPT_URL + '?action=getNotices').then(function(r){ return r.json(); });
}

function apiSaveNotice(payload){
  return fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ action:'saveNotice' }, payload))
  });
}

function apiDeleteNotice(id){
  return fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action:'deleteNotice', id: id })
  });
}
