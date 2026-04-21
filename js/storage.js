/**
 * 로컬 데이터 저장소
 * - 전역 상태: ROOMS, SCHEDULES, APPLICANTS
 * - localStorage 로드/저장
 */

var ROOMS      = [];
var SCHEDULES  = [];
var APPLICANTS = [];

function loadData(){
  try { ROOMS      = JSON.parse(localStorage.getItem('ufresh_rooms'))      || DEFAULT_ROOMS; }      catch(e){ ROOMS      = DEFAULT_ROOMS; }
  try { SCHEDULES  = JSON.parse(localStorage.getItem('ufresh_schedules'))  || DEFAULT_SCHEDULES; }  catch(e){ SCHEDULES  = DEFAULT_SCHEDULES; }
  try { APPLICANTS = JSON.parse(localStorage.getItem('ufresh_applicants')) || DEFAULT_APPLICANTS; } catch(e){ APPLICANTS = DEFAULT_APPLICANTS; }
}

function saveRoomsData(){      localStorage.setItem('ufresh_rooms',      JSON.stringify(ROOMS)); }
function saveSchedulesData(){  localStorage.setItem('ufresh_schedules',  JSON.stringify(SCHEDULES)); }
function saveApplicantsData(){ localStorage.setItem('ufresh_applicants', JSON.stringify(APPLICANTS)); }

// 초기 로드 (data.js 뒤에 로드됨을 가정)
loadData();
