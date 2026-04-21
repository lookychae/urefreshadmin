/**
 * 정적 데이터 (기본값, 컬러/상태 매핑)
 * - 다른 모든 모듈에서 참조됨
 */

var DEFAULT_ROOMS = [
  {id:1, name:'스탠다드룸', cap:4, slots:10, color:'blue',   infant:'impossible', note:''},
  {id:2, name:'패밀리룸',   cap:8, slots:5,  color:'green',  infant:'impossible', note:'넓은 거실 포함'},
  {id:3, name:'디럭스룸',   cap:6, slots:5,  color:'orange', infant:'impossible', note:'오션뷰 제공'},
];

var DEFAULT_SCHEDULES = [
  {date:'2025-08-04', day:'월', room:'스탠다드룸', cap:4, maxPeople:4, color:'blue',   slots:10},
  {date:'2025-08-11', day:'월', room:'패밀리룸',   cap:8, maxPeople:8, color:'green',  slots:5},
  {date:'2025-08-18', day:'월', room:'스탠다드룸', cap:4, maxPeople:4, color:'blue',   slots:10},
  {date:'2025-08-25', day:'월', room:'디럭스룸',   cap:6, maxPeople:6, color:'orange', slots:5},
];

var DEFAULT_APPLICANTS = [
  {eno:'12345', name:'김민준', date:'8월 18일', room:'스탠다드룸', fam:2, infant:true,  toddler:false, at:'07.29 09:12', status:'selected',   rank:'—'},
  {eno:'23456', name:'이서연', date:'8월 18일', room:'스탠다드룸', fam:1, infant:false, toddler:false, at:'07.29 09:45', status:'selected',   rank:'—'},
  {eno:'34567', name:'박지훈', date:'8월 18일', room:'스탠다드룸', fam:3, infant:false, toddler:true,  at:'07.29 10:02', status:'waitlisted', rank:'1'},
  {eno:'45678', name:'최수아', date:'8월 11일', room:'패밀리룸',   fam:5, infant:true,  toddler:true,  at:'07.29 10:30', status:'selected',   rank:'—'},
  {eno:'56789', name:'정도윤', date:'8월 11일', room:'패밀리룸',   fam:4, infant:false, toddler:true,  at:'07.29 11:05', status:'waitlisted', rank:'2'},
  {eno:'67890', name:'한예진', date:'8월 25일', room:'디럭스룸',   fam:2, infant:false, toddler:false, at:'07.30 08:20', status:'cancelled',  rank:'—'},
  {eno:'78901', name:'오민서', date:'8월 4일',  room:'스탠다드룸', fam:1, infant:false, toddler:false, at:'07.30 09:00', status:'selected',   rank:'—'},
];

var COLOR_LIST = [
  {value:'red',    hex:'#F04452'},
  {value:'orange', hex:'#FF6B00'},
  {value:'yellow', hex:'#F5C500'},
  {value:'green',  hex:'#05C072'},
  {value:'blue',   hex:'#3182F6'},
  {value:'navy',   hex:'#3D4FE0'},
  {value:'purple', hex:'#9B51E0'},
];

var COLOR_MAP = {
  red:'#F04452', orange:'#FF6B00', yellow:'#F5C500',
  green:'#05C072', blue:'#3182F6', navy:'#3D4FE0', purple:'#9B51E0'
};

var STATUS_MAP = {
  applied:    '<span class="chip chip-gray">신청완료</span>',
  selected:   '<span class="chip chip-blue">당첨</span>',
  waitlisted: '<span class="chip chip-orange">대기</span>',
  cancelled:  '<span class="chip chip-red">취소</span>',
  confirmed:  '<span class="chip chip-green">확정</span>',
};
