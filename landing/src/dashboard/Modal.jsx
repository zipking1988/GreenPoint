import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react/dist/csr/X';

export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current,
      before = document.activeElement;
    dialog.showModal();
    const close = () => {
      if (!dialog.open) closeRef.current();
    };
    dialog.addEventListener('close', close);
    return () => {
      dialog.removeEventListener('close', close);
      dialog.close();
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`gp-dialog ${wide ? 'gp-dialog-wide' : ''}`}
      aria-labelledby="gp-dialog-title"
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="gp-dialog-heading">
        <h2 id="gp-dialog-title">{title}</h2>
        <button
          type="button"
          className="gp-icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
