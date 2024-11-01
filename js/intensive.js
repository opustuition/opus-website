window.onload = () => {
    document.getElementsByClassName("intensive-form")[0].addEventListener("submit", onSubmitForm);
}

function onSubmitForm(e) {
    e.preventDefault();
    document.getElementsByClassName("form-success")[0].classList.add("show");
    document.getElementsByClassName("form-success")[0].scrollIntoView({ behavior: "instant", block: "end" });
    document.getElementsByClassName("intensive-form")[0].classList.add("hide");
    this.submit();
}
  
  