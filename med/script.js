function showPage(pageName, button) {

  // Hide all pages
  const pages = document.querySelectorAll(".page");

  pages.forEach(function(page) {
    page.classList.add("hidden");
  });


  // Show selected page
  document.getElementById(pageName)
    .classList.remove("hidden");


  // Remove active from all buttons
  const buttons = document.querySelectorAll(".menu");

  buttons.forEach(function(btn) {
    btn.classList.remove("active");
  });


  // Make clicked button active
  button.classList.add("active");
}


function takeMedicine(button, medicineName) {

  button.innerHTML = "✓ Medicine Taken";

  button.style.background = "#126f3b";

  button.disabled = true;

  alert(medicineName + " has been marked as taken.");
}