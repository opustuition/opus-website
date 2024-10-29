window.onload = () => {
    document.getElementsByClassName("form-alt")[0].addEventListener("submit", onSubmitForm);
}

function onSubmitForm(e) {
    e.preventDefault();
    document.getElementsByClassName("form-success")[0].classList.add("show");
    document.getElementsByClassName("form-alt")[0].classList.add("hide");
    this.submit();
}
  
  