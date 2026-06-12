let allOpen = false; // Track the state of the dropdowns

function toggleIndex() {
  const index = document.getElementById('index');
  index.classList.toggle('open');
}

function toggleAll() {
  const dropdownContainers = document.querySelectorAll('.dropdown-container, .nested-dropdown-container');
  const buttons = document.querySelectorAll('.dropdown-btn, .nested-dropdown-btn');

  // Set the new state based on the current state
  allOpen = !allOpen;

  for (let i = 0; i < dropdownContainers.length; i++) {
    const container = dropdownContainers[i];
    const btn = buttons[i];
    if (allOpen) {
      container.style.display = 'block';
      btn.classList.add('active');
    } else {
      container.style.display = 'none';
      btn.classList.remove('active');
    }
  }
}

const dropdownBtns = document.getElementsByClassName("dropdown-btn");
for (let i = 0; i < dropdownBtns.length; i++) {
  dropdownBtns[i].addEventListener("click", function () {
    this.classList.toggle("active");
    const dropdownContent = this.nextElementSibling;
    if (dropdownContent.style.display === "block") {
      dropdownContent.style.display = "none";
    } else {
      dropdownContent.style.display = "block";
    }
  });
}

const nestedDropdownBtns = document.getElementsByClassName("nested-dropdown-btn");
for (let i = 0; i < nestedDropdownBtns.length; i++) {
  nestedDropdownBtns[i].addEventListener("click", function () {
    this.classList.toggle("active");
    const nestedDropdownContent = this.nextElementSibling;
    if (nestedDropdownContent.style.display === "block") {
      nestedDropdownContent.style.display = "none";
    } else {
      nestedDropdownContent.style.display = "block";
    }
  });
}

setTimeout(function() {
  var alert = document.querySelector('.alert-warning');
  if (alert) {
    var bootstrapAlert = new bootstrap.Alert(alert);
    bootstrapAlert.close();
  }
}, 7000); // 7 seconds

function removeHighlights(element) {
    element.innerHTML = element.innerHTML.replace(/<\/?strong>/gi, "");
  }

function highlightTerm(element, term) {
  const regex = new RegExp(`(${term})`, 'gi');
  element.innerHTML = element.innerHTML.replace(regex, "<strong>$1</strong>");
}

document.getElementById("search-input").addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase();
  const headings = document.querySelectorAll(".cheatsheet-content h2, .cheatsheet-content h3, .cheatsheet-content h4, .cheatsheet-content h5, .cheatsheet-content h6");
  let anyMatch = false;

  headings.forEach((heading) => {
    const text = heading.textContent.toLowerCase();
    const sectionContent = [];

    // Get all sibling elements until the next heading
    let sibling = heading.nextElementSibling;
    while (sibling && !sibling.matches("h2, h3, h4, h5, h6")) {
      sectionContent.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    // Remove existing highlights
    removeHighlights(heading);

    // Only show headings and content that match the search term
    if (text.includes(searchTerm)) {
      heading.style.display = "";
      sectionContent.forEach((elem) => (elem.style.display = ""));
      if (searchTerm) {
        highlightTerm(heading, searchTerm);
      }

      anyMatch = true;
    } else {
      // Hide non-matching headings and content
      heading.style.display = "none";
      sectionContent.forEach((elem) => (elem.style.display = "none"));
    }
  });

  const noMatchMessage = document.getElementById("no-match-message");
  if (!anyMatch) {
    if (!noMatchMessage) {
      const message = document.createElement("p");
      message.id = "no-match-message";
      message.className = "text-danger mt-3";
      message.textContent = "No matches found.";
      document.querySelector(".cheatsheet-content").appendChild(message);
    }
  } else if (noMatchMessage) {
    noMatchMessage.remove();
  }
});

function toggleSubmenu(event) {
  event.preventDefault(); // Prevents navigation
  const submenu = event.currentTarget.nextElementSibling;
  const arrow = event.currentTarget.querySelector('.arrow');

  submenu.classList.toggle('open'); // Toggle the submenu visibility
  // Rotate the arrow based on whether the submenu is open
  if (submenu.classList.contains('open')) {
      arrow.style.transform = 'rotate(0deg)'; // Arrow points right when closed
  } else {
      arrow.style.transform = 'rotate(-90deg)';  // Arrow points down when open
  }
}
