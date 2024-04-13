import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyBnJClEe_mGG1uCy8Yv9gUFJQbdnlU07z4",
  authDomain: "mypro-95832.firebaseapp.com",
  projectId: "mypro-95832",
  storageBucket: "mypro-95832.appspot.com",
  messagingSenderId: "1001721183920",
  appId: "1:1001721183920:web:bfa8decdadf09d6a22c575"
};


const firebaseApp = initializeApp(firebaseConfig);


const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", () => {
  const auth = getAuth(firebaseApp);

  signOut(auth).then(() => {
    // 로그아웃 성공 시 로그아웃되면서 처음화면으로 이동
    window.location.href = '/alchemy';
    console.log("로그아웃되었습니다.");

  }).catch((error) => {
    // 로그아웃 실패 시 
    console.error("로그아웃 중 오류가 발생했습니다.", error);
  });
});


