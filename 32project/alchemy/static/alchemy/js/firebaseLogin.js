
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,getIdToken } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// Firebase 초기화
const firebaseConfig = {
  apiKey: "AIzaSyBnJClEe_mGG1uCy8Yv9gUFJQbdnlU07z4",
  authDomain: "mypro-95832.firebaseapp.com",
  projectId: "mypro-95832",
  storageBucket: "mypro-95832.appspot.com",
  messagingSenderId: "1001721183920",
  appId: "1:1001721183920:web:bfa8decdadf09d6a22c575"
};
const app = initializeApp(firebaseConfig);

// Firebase Authentication 객체 생성
const auth = getAuth(app);



// 회원 가입
const signupForm = document.getElementById('signupForm');
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const signupEmail = document.getElementById('signupEmail').value;
  const signupPassword = document.getElementById('signupPassword').value;

  createUserWithEmailAndPassword(auth, signupEmail, signupPassword)
    .then((userCredential) => {
        alert("회원가입이 완료되었습니다!");
      console.log('회원 가입 성공');
    })
    .catch((error) => {
      console.error('회원가입과정에서 오류가 발생하엿습니다:', error);
    });
});





// 로그인
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const loginEmail = document.getElementById('loginEmail').value;
  const loginPassword = document.getElementById('loginPassword').value;

  signInWithEmailAndPassword(auth, loginEmail, loginPassword)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log('로그인 성공, 사용자 정보:', user);

      // 사용자가 로그인한 경우 index.html로 리디렉션
      window.location.href = '/alchemy/index';
    
    })
    .catch((error) => {
        alert("아이디나 비밀번호를 다시 확인해주세요.");
      console.error('로그인 오류:', error);
    });

    // Firebase SDK를 사용하여 사용자가 로그인한 후 ID 토큰을 받아옴
firebase.auth().currentUser.getIdToken(/* forceRefresh */ true)
.then(function(idToken) {
  // 받아온 ID 토큰을  body에 담아 json형식으로 fetch를 통해 views.py로 전송
  fetch('/receive_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken: idToken }),
  })
  .then(response => {
    // 서버 응답 처리
  })
  .catch(error => {
    // 오류 처리
  });
})
.catch(function(error) {
  // 오류 처리
});

   
});



