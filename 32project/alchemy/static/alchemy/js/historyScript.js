
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBnJClEe_mGG1uCy8Yv9gUFJQbdnlU07z4",
    authDomain: "mypro-95832.firebaseapp.com",
    projectId: "mypro-95832",
    storageBucket: "mypro-95832.appspot.com",
    messagingSenderId: "1001721183920",
    appId: "1:1001721183920:web:bfa8decdadf09d6a22c575"
  };
 
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  

  let user;

  auth.onAuthStateChanged((authUser) => {
      user = authUser;
      console.log("현재 사용자:", user);
      if (user) {
          getImageDataFromFirestore(user.uid);
      }
  });


 
async function getImageDataFromFirestore(userUid) {
    const imagesCollection = collection(db, `users/${userUid}/images`);
    const querySnapshot = await getDocs(imagesCollection);
    const imageContainer = document.getElementById('imageContainer');
  
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.processedImageUrl && data.timestamp && data.mode) {
        const pimageUrl = data.processedImageUrl;
        const timestamp = data.timestamp;
        const mode = data.mode;
        displayImageWithTimestamp(imageContainer, pimageUrl, timestamp, mode);
      } else {
        console.error('문서 구조가 잘못되었습니다:', data);
        }
    });
}

function formatDate(timestamp) {
    const date = timestamp.toDate(); 
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년-${month}월-${day}일`;
}

function displayImageWithTimestamp(container, processedImageUrl, timestamp, mode) {
    const imageDiv = document.createElement('div');
    imageDiv.classList.add('history-item');

    const processedImageElement = document.createElement('img');
    processedImageElement.src = processedImageUrl;
    processedImageElement.alt = 'Processed Image';
    processedImageElement.classList.add('result-image');

    const timestampElement = document.createElement('p');
    timestampElement.classList.add('processed-time');
    const formattedTimestamp = formatDate(timestamp); 
    timestampElement.textContent = `처리 시간: ${formattedTimestamp}`;

    const modeElement = document.createElement('p');
    modeElement.classList.add('used-feature');
    modeElement.textContent = `사용된 기능: ${mode}`;

    imageDiv.appendChild(processedImageElement);
    imageDiv.appendChild(timestampElement);
    imageDiv.appendChild(modeElement);

    container.appendChild(imageDiv);
}

    iamgeDiv.appendchild(modeElement)
   