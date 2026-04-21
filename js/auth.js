/**
 * 관리자 로그인 / 로그아웃
 * 전역: doLogin, doLogout, checkAutoLogin
 */

function doLogin(){
  var id = document.getElementById('login-id').value;
  var pw = document.getElementById('login-pw').value;
  if(id === 'admin' && pw === '1234'){
    var keep = document.getElementById('keep-login').checked;
    if(keep) localStorage.setItem('ufresh_auth', '1');
    else     sessionStorage.setItem('ufresh_auth', '1');
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard').style.display  = 'block';
    renderAll();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

function doLogout(){
  localStorage.removeItem('ufresh_auth');
  sessionStorage.removeItem('ufresh_auth');
  document.getElementById('dashboard').style.display  = 'none';
  document.getElementById('login-page').style.display = 'block';
  document.getElementById('login-id').value = '';
  document.getElementById('login-pw').value = '';
}

function checkAutoLogin(){
  if(localStorage.getItem('ufresh_auth') === '1' || sessionStorage.getItem('ufresh_auth') === '1'){
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard').style.display  = 'block';
    renderAll();
  }
}
