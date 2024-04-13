import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";

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

// Firebase 인증 객체 생성
const auth = getAuth(app);
const storage = getStorage(app);

document.getElementById('imageForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var contentImage = document.getElementById('contentImage').files[0];
    var styleImage = document.getElementById('styleImage').files[0];

    // Firebase에서 현재 로그인된 사용자 정보 가져오기
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // 현재 로그인된 사용자의 UID 가져오기
            var uid = user.uid;

            // FormData에 이미지 파일과 사용자 UID 추가
            var formData = new FormData();
            formData.append('content_image', contentImage);
            formData.append('style_image', styleImage);
            formData.append('uid', uid);

            
            fetch('/alchemy/nst_view/', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error:', data.error);
                } else if (data.resultImageUrl) {
                    var resultContainer = document.getElementById('resultContainer');
                    var resultImage = document.createElement('img');
                    
                    
                    getDownloadURL(ref(storage, data.resultImageUrl))
                        .then((imageUrl) => {
                            resultImage.src = imageUrl;
                            resultImage.alt = 'Result Image';
                            resultContainer.innerHTML = '';
                            resultContainer.appendChild(resultImage);
                            
              
                                function downloadImage() {
                                    var link = document.createElement('a');
                                    link.href = imageUrl;
                                    link.download = 'result_image.png'; // 이미지의 다운로드할 이름 설정

                                    document.body.appendChild(link);
                                    link.click();

                                    document.body.removeChild(link);
                             }

                                // 이미지 로드 후에 버튼을 표시
                                var downloadButton = document.createElement('button');
                                downloadButton.textContent = '결과이미지 다운로드';
                                downloadButton.addEventListener('click', downloadImage);
                                resultContainer.appendChild(downloadButton);

                        })
                        .catch((error) => {
                            console.error('Error getting image URL:', error);
                        });
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    });
});
