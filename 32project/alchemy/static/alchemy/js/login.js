document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("signupModal");
  const btn = document.getElementById("signupBtn");
  const span = document.getElementsByClassName("close-btn")[0];

  btn.onclick = function () {
    modal.style.display = "block";
  };

  span.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
});
