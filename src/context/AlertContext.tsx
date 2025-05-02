import React, { createContext, useState, useContext, ReactNode } from 'react';
import AlertModal from '../components/AlertModal';

type AlertType = 'info' | 'success' | 'warning' | 'danger' | 'confirmation';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirmation: (options: AlertOptions, onConfirm: () => void) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    type: AlertType;
    confirmText: string;
    cancelText: string;
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
  });

  const closeAlert = () => {
    setIsOpen(false);
  };

  const showAlert = ({
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
  }: AlertOptions) => {
    setAlertData({
      title,
      message,
      type,
      confirmText,
      cancelText,
    });
    setIsOpen(true);
  };

  const showConfirmation = (
    {
      title,
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
    }: AlertOptions,
    onConfirm: () => void
  ) => {
    setAlertData({
      title,
      message,
      type: 'confirmation',
      confirmText,
      cancelText,
      onConfirm,
    });
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (alertData.onConfirm) {
      alertData.onConfirm();
    }
    closeAlert();
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showConfirmation,
        closeAlert,
      }}
    >
      {children}

      <AlertModal
        isOpen={isOpen}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onClose={closeAlert}
        onConfirm={handleConfirm}
        confirmText={alertData.confirmText}
        cancelText={alertData.cancelText}
      />
    </AlertContext.Provider>
  );
};

export default AlertContext;
