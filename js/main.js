toggleMenu = function(x) {
  let sidebar = document.getElementsByClassName("sidebar")[0];
  sidebar.classList.toggle("expand");
}

window.onload = () => {
  let testimonials = document.getElementsByClassName("testimonial-scroll")[0]
  testimonials.scrollLeft =  (testimonials.scrollWidth - testimonials.clientWidth ) / 2;
}
