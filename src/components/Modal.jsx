import { useEffect } from 'react';

const Modal = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-title">알림</h2>
        <p id="modal-message">{message}</p>
        <button className="modal-button" type="button" onClick={onClose}>
          확인
        </button>
      </section>
    </div>
  );
};

export default Modal;
