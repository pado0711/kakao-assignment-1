import { useCallback, useState } from 'react';

const useModal = () => {
  const [message, setMessage] = useState(null);

  const showModal = useCallback((nextMessage) => {
    setMessage(nextMessage);
  }, []);

  const closeModal = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    showModal,
    closeModal,
  };
};

export default useModal;
