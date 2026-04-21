/**
 * Google Apps Script 통신 계층
 * 전역: SCRIPT_URL, apiGetAllApps, apiSaveSettings
 */

var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTy_KocCq4ebppa4Gd1ni_AACZ4kLvkkmRuObC6mZXC6QWzoU0kiZQ_kxXin-oY7n-Pg/exec';

function apiGetAllApps(){
  return fetch(SCRIPT_URL).then(function(r){ return r.json(); });
}

function apiSaveSettings(payload){
  return fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ action:'saveSettings' }, payload))
  });
}
