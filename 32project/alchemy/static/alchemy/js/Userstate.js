import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, getIdToken } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

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

// Firebase 사용자 상태 변경 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 사용자가 로그인되어 있다면 getIdToken 호출
    getIdToken(user, /* forceRefresh */ true)
      .then(idToken => {
        // 받아온 ID 토큰을 fetch를 사용하여 views.py의 receive_token함수로 전송
        fetch('receive_token/', {
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
      .catch(error => {
        // getIdToken 오류 처리
      });
  } else {
    // 사용자가 로그인되어 있지 않음
  }
});
