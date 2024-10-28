toggleMenu = function(x) {
  let sidebar = document.getElementsByClassName("sidebar")[0];
  sidebar.classList.toggle("expand");
}

window.onload = () => {
  let testimonials = document.getElementsByClassName("testimonial-scroll")[0]
  testimonials.scrollLeft =  (testimonials.scrollWidth - testimonials.clientWidth ) / 2;
  document.getElementsByClassName("form-alt")[0].addEventListener("submit", onSubmitForm);
}

function onSubmitForm(e) {
  e.preventDefault();
  console.log("subbed")
  document.getElementsByClassName("form-success")[0].classList.add("show");
  document.getElementsByClassName("form-alt")[0].classList.add("hide");
  this.submit();
}

