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



// 파일 선택 시 이미지를 서버로 전송하는 이벤트 처리
document.getElementById('imageInput').addEventListener('change', function() {
    const imageInput = this;
    const file = imageInput.files[0];

    onAuthStateChanged(auth, (user) => {
        if (user) {
            getIdToken(user,  true)
                .then(idToken => {
                    sendImageToServer(file, idToken);
                })
                .catch(error => {
                    // getIdToken 오류 처리
                });
        } else {
            // 사용자가 로그인되어 있지 않음
        }
    });
});

// 이미지 파일을 Base64 데이터로 변환하여 서버로 전송
function sendImageToServer(imageFile, idToken) {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = function(event) {
      const imageData = event.target.result;
      const data = {
        imageData: imageData,
        idToken: idToken
      };
      fetch('/alchemy/sketchmode_view/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
          const imageUrl = data.processedImageUrl;
          displayImage(imageUrl);
        })
        .catch(error => {
          // 오류 처리
        });
    };
  }
  
  function displayImage(imageUrl) {
    const resultPreview = document.getElementById('result');
  
    // 이미지 엘리먼트 생성
    const img = new Image();
    img.src = imageUrl;
  
    // 이미지 스타일 설정
    // 이미지를 resultPreview에 추가
    resultPreview.innerHTML = ''; // resultPreview 내용 초기화
    resultPreview.appendChild(img);
  
    // 이미지 로드 후 다운로드 버튼 추가
    img.onload = function() {
      const downloadButton = document.createElement('button');
      downloadButton.textContent = '결과이미지 다운로드';
      downloadButton.addEventListener('click', function() {
        downloadImage(imageUrl, 'result_image.png');
      });
      resultPreview.appendChild(downloadButton);
    };
  }
  
  // 이미지 다운로드 함수
  function downloadImage(imageUrl, filename) {
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // 'download' 속성을 사용하여 파일 이름 설정
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch(error => {
        // 오류 처리
      });
  }