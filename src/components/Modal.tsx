import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/darkTheme.css';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onClose: () => void;
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryAction,
  onSecondaryAction,
  onClose,
  variant = 'primary',
  size = 'md',
  closeOnEsc = true,
  closeOnOutsideClick = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, closeOnEsc, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-backdrop d-block dark-theme"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div className="modal d-block" tabIndex={-1} role="dialog">
        <div
          className={`modal-dialog modal-dialog-centered modal-${size}`}
          role="document"
        >
          <div
            className="modal-content bg-dark border-secondary"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header border-secondary">
              <h5 className="modal-title text-light">{title}</h5>
              {showCloseButton && (
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={onClose}
                ></button>
              )}
            </div>
            <div className="modal-body">{children}</div>
            {(primaryButtonText || secondaryButtonText) && (
              <div className="modal-footer border-secondary">
                {secondaryButtonText && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onSecondaryAction || onClose}
                  >
                    {secondaryButtonText}
                  </button>
                )}
                {primaryButtonText && (
                  <button
                    type="button"
                    className={`btn btn-${variant}`}
                    onClick={onPrimaryAction}
                  >
                    {primaryButtonText}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
