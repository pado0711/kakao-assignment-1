let activeModal = null;
let activeCloseHandler = null;
let closeOnEscape;

export const closeModal = (result = false) => {
  if (!activeModal) return;
  const closeHandler = activeCloseHandler;
  activeModal.remove();
  activeModal = null;
  activeCloseHandler = null;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', closeOnEscape);
  if (closeHandler) closeHandler(result);
};

closeOnEscape = (event) => {
  if (event.key === 'Escape') closeModal();
};

const createModal = (message, title) => {
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

  modal.append(heading, body);
  overlay.append(modal);

  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', closeOnEscape);
  activeModal = overlay;

  return { overlay, modal };
};

export const showModal = (message, title = '알림') => {
  const { modal } = createModal(message, title);
  const button = document.createElement('button');
  button.className = 'modal-button';
  button.type = 'button';
  button.textContent = '확인';
  button.addEventListener('click', closeModal);

  modal.append(button);
  button.focus();
};

export const showConfirmModal = (message, title = '확인') => new Promise((resolve) => {
  const { overlay, modal } = createModal(message, title);
  activeCloseHandler = resolve;

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelButton = document.createElement('button');
  cancelButton.className = 'modal-button modal-button--secondary';
  cancelButton.type = 'button';
  cancelButton.textContent = '취소';
  cancelButton.addEventListener('click', () => closeModal(false));

  const confirmButton = document.createElement('button');
  confirmButton.className = 'modal-button';
  confirmButton.type = 'button';
  confirmButton.textContent = '삭제';
  confirmButton.addEventListener('click', () => closeModal(true));

  actions.append(cancelButton, confirmButton);
  modal.append(actions);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal(false);
  });
  cancelButton.focus();
});
