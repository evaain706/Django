import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js"; // Firebase Storage 모듈 import



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
const auth = getAuth(app);
const storage = getStorage(app); // Storage 모듈 초기화

const uploadButton = document.getElementById('uploadButton');
const sendButton = document.getElementById('sendButton');
const imageForm = document.getElementById('imageForm');

let formData = null;

// 이미지 선택 (업로드) 버튼 클릭 이벤트
uploadButton.addEventListener('click', function(event) {
    const input = document.getElementById('imageInput');
    input.click(); // 파일 선택 창 열기
});

// 파일 선택 시 이벤트
imageForm.addEventListener('change', function(event) {
    const input = document.getElementById('imageInput');
    const files = input.files;

    if (!formData) {
        formData = new FormData();
    }

    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]); // 이미 있는 formData에 이미지 추가
    }
    console.log(formData.getAll('images')); // 이미지 파일 목록 확인
});

// 서버로 전송 버튼 클릭 이벤트
sendButton.addEventListener('click', function(event) {
    if (formData) {
        // Firebase 사용자 인증 정보 가져오기
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // 현재 로그인된 사용자의 UID 가져오기
                const uid = user.uid;

                // FormData에 이미지 파일과 사용자 UID 추가
                formData.append('uid', uid);

                fetch('/alchemy/panorama_view/', {
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
                        
                        // Firebase Storage에서 이미지 URL 가져오기
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
            } else {
                console.error('User not logged in');
            }
        });
    } else {
        console.error('No images selected');
    }
});
