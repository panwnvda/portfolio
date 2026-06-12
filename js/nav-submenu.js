function toggleSubmenu(event) {
  event.preventDefault();
  const submenu = event.currentTarget.nextElementSibling;
  const arrow = event.currentTarget.querySelector('.arrow');
  submenu.classList.toggle('open');
  if (submenu.classList.contains('open')) {
      arrow.style.transform = 'rotate(90deg)';
  } else {
      arrow.style.transform = 'rotate(0deg)';
  }
}
