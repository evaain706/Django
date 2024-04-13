document.addEventListener("DOMContentLoaded", function () {
  var sidebar = document.getElementById("sidebar");
  var content = document.getElementById("content"); // 페이지 주 내용에 대한 참조 추가
  var button = document.getElementById("toggle-btn");
  

  button.addEventListener("click", function () {
    sidebar.classList.toggle("active");
    button.classList.toggle("active");

    // 사이드바가 활성화되면 페이지 내용을 오른쪽으로, 비활성화되면 왼쪽으로 옮깁니다.
    if (sidebar.classList.contains("active")) {
      content.style.marginLeft = "250px";
    } else {
      content.style.marginLeft = "0px";
    }
  });
});

function recordFunction() {
  window.location.href = '/alchemy/history'; // 사용자를 history.html로 리디렉션
}

// 기존의 JavaScript 코드...

