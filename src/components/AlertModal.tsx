import React from 'react';
import Modal from './Modal';

type AlertType = 'info' | 'success' | 'warning' | 'danger' | 'confirmation';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const getIconByType = (type: AlertType) => {
  switch (type) {
    case 'info':
      return <i className="bi bi-info-circle-fill text-info fs-1 me-2"></i>;
    case 'success':
      return <i className="bi bi-check-circle-fill text-success fs-1 me-2"></i>;
    case 'warning':
      return (
        <i className="bi bi-exclamation-triangle-fill text-warning fs-1 me-2"></i>
      );
    case 'danger':
      return <i className="bi bi-x-circle-fill text-danger fs-1 me-2"></i>;
    case 'confirmation':
      return (
        <i className="bi bi-question-circle-fill text-primary fs-1 me-2"></i>
      );
    default:
      return null;
  }
};

const getVariantByType = (
  type: AlertType
): 'primary' | 'danger' | 'success' | 'warning' | 'info' => {
  switch (type) {
    case 'info':
      return 'info';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'danger':
      return 'danger';
    case 'confirmation':
      return 'primary';
    default:
      return 'primary';
  }
};

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  type,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  const isConfirmation = type === 'confirmation';

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      primaryButtonText={isConfirmation ? confirmText : 'OK'}
      secondaryButtonText={isConfirmation ? cancelText : undefined}
      onPrimaryAction={isConfirmation ? onConfirm : onClose}
      onSecondaryAction={onClose}
      variant={getVariantByType(type)}
      size="sm"
      closeOnEsc={!isConfirmation}
      closeOnOutsideClick={!isConfirmation}
      showCloseButton={!isConfirmation}
    >
      <div className="d-flex align-items-center">
        {getIconByType(type)}
        <div className="text-light">{message}</div>
      </div>
    </Modal>
  );
};

export default AlertModal;
