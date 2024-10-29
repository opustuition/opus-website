let studyLevelVal = "Primary School";

window.onload = () => {
  document.getElementsByClassName("waitlist-form")[0].addEventListener("submit", onSubmitForm);
  document.getElementsByClassName("waitlist-add-subject")[0].addEventListener("click", onAddSubject);
  document.getElementsByClassName("study-level-select")[0].addEventListener("change", onChangeStudyLevel);
}

// When "addSubject" button is clicked
// Adds subject field (DOM element) to form according to corresponding study level
function onAddSubject(e) {
  e.preventDefault();

  // Stores templates for subject fields
  const hidden = document.getElementsByClassName("waitlist-subjects-templates")[0];

  // Elem which stores subject fields within form
  const waitlistFormSubjectsElem = document.getElementsByClassName("waitlist-subject-fields")[0];

  // Elem stores child study level
  const studyLevelElem = document.getElementsByClassName("study-level-select")[0];
  let studyLevel = studyLevelElem.value;
  let subjectMold;
  if (studyLevel == "Primary School") {
    subjectMold = hidden.getElementsByClassName("waitlist-subjects-primary")[0];
  }
  else if (studyLevel == "Lower Secondary School") {
    subjectMold = hidden.getElementsByClassName("waitlist-subjects-secondary-lower")[0];
  }
  else if (studyLevel == "Upper Secondary School") {
    subjectMold = hidden.getElementsByClassName("waitlist-subjects-secondary-upper")[0];
  }

  if (subjectMold) {
    waitlistFormSubjectsElem.appendChild(subjectMold.cloneNode(true));
  }
}

// X: Remove button clicked, DOM element
function onRemoveSubject(x) {
  let parentField = x.closest(".waitlist-subject-field");
  parentField.remove();
}

function onChangeStudyLevel(e) {
  var level = e.target.value;
  if (level != studyLevelVal) {
    let subjectsBox = document.getElementsByClassName("waitlist-subject-fields")[0];
    subjectsBox.innerHTML = '';
  }
}

function onSubmitForm(e) {
  e.preventDefault();
  const form = document.getElementsByClassName("waitlist-form")[0];
  let formSubjects = new Map();
  let subjectFields = form.getElementsByClassName("waitlist-subject-field");
  for (let i = 0; i < subjectFields.length; i++) {
    let subjectField = subjectFields[i];
    let str = "";
    let subjectSelect = subjectField.getElementsByClassName("waitlist-subject-select")[0];
    let bandSelect = subjectField.getElementsByClassName("waitlist-band-select")[0];
    str += subjectSelect.value;
    if (bandSelect) {
      str += " (" + bandSelect.value + ")"
    }
    formSubjects.set(str);
  }

  // Construct subjects input and inject into DOM
  subjectStr = "";
  for (let [key] of formSubjects) {
    subjectStr += key + ","
  }
  if (subjectStr != "") {
    subjectStr = subjectStr.substring(0, subjectStr.length - 1);
  }
  document.getElementsByClassName("waitlist-subjects-hidden")[0].value = subjectStr;

  document.getElementsByClassName("form-success")[0].classList.add("show");
  document.getElementsByClassName("form-alt")[0].classList.add("hide");
  this.submit();
}
