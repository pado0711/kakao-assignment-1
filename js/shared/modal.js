let activeModal = null;

const closeOnEscape = (event) => {
  if (event.key === 'Escape') closeModal();
};

export function closeModal() {
  if (!activeModal) return;
  activeModal.remove();
  activeModal = null;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', closeOnEscape);
}

export const showModal = (message, title = '알림') => {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('section');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const heading = document.createElement('h2');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = message;
  const button = document.createElement('button');
  button.className = 'modal-button';
  button.type = 'button';
  button.textContent = '확인';
  button.addEventListener('click', closeModal);

  modal.append(heading, body, button);
  overlay.append(modal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', closeOnEscape);
  button.focus();
  activeModal = overlay;
};
