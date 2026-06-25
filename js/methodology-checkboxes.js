// Persist methodology checklist state (per session) and style checked items
function toggleCheckedClass(checkbox) {
  const li = checkbox.parentElement;
  if (checkbox.checked) { li.classList.add('checked'); } else { li.classList.remove('checked'); }
}
window.addEventListener('DOMContentLoaded', () => {
  const boxes = document.querySelectorAll('ul li input[type="checkbox"]');
  boxes.forEach((cb, i) => {
    cb.checked = sessionStorage.getItem(`checkbox-${i}`) === 'true';
    toggleCheckedClass(cb);
    cb.addEventListener('change', () => {
      sessionStorage.setItem(`checkbox-${i}`, cb.checked);
      toggleCheckedClass(cb);
    });
  });
});
