import toast from 'react-hot-toast';

// Configuración de estilos personalizados
const toastStyles = {
  success: {
    style: {
      background: '#16a135',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#16a135',
    },
  },
  error: {
    style: {
      background: '#dc2626',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#dc2626',
    },
  },
  info: {
    style: {
      background: '#3b82f6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#3b82f6',
    },
  },
  loading: {
    style: {
      background: '#16a135',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  },
};

export const notify = {
  success: (message: string) => {
    toast.success(message, toastStyles.success);
  },

  error: (message: string) => {
    toast.error(message, toastStyles.error);
  },

  info: (message: string) => {
    toast(message, toastStyles.info);
  },

  warning: (message: string) => {
    toast(message, {
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#f59e0b',
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, toastStyles.loading);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        success: toastStyles.success,
        error: toastStyles.error,
        loading: toastStyles.loading,
      }
    );
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};
