import toast, { Toast, Toaster } from "react-hot-toast";

/**
 * BuildLight Toast Notification System
 * Branded toast notifications with Swiss minimal design
 */

// BuildLight Brand Colors
const COLORS = {
  graphiteBlack: "#121212",
  buildLightGreen: "#6BF178",
  white: "#FFFFFF",
  concreteGray: "#E5E5E5",
  errorRed: "#EF4444",
  warningYellow: "#F59E0B",
} as const;

// Default toast styling configuration
const defaultToastOptions = {
  // Success toasts
  success: {
    duration: 4000,
    style: {
      background: COLORS.graphiteBlack,
      color: COLORS.white,
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    iconTheme: {
      primary: COLORS.buildLightGreen,
      secondary: COLORS.graphiteBlack,
    },
  },
  // Error toasts
  error: {
    duration: 6000,
    style: {
      background: COLORS.graphiteBlack,
      color: COLORS.white,
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    iconTheme: {
      primary: COLORS.errorRed,
      secondary: COLORS.white,
    },
  },
  // Loading toasts
  loading: {
    style: {
      background: COLORS.graphiteBlack,
      color: COLORS.white,
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
      fontWeight: "500",
    },
    iconTheme: {
      primary: COLORS.buildLightGreen,
      secondary: COLORS.graphiteBlack,
    },
  },
  // Default toast
  default: {
    duration: 4000,
    style: {
      background: COLORS.graphiteBlack,
      color: COLORS.white,
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
      fontWeight: "500",
    },
  },
};

/**
 * Show success toast notification
 * @param message - Success message to display
 * @param options - Optional toast configuration
 */
export const showSuccess = (message: string, options?: Partial<typeof defaultToastOptions.success>) => {
  return toast.success(message, {
    ...defaultToastOptions.success,
    ...options,
  });
};

/**
 * Show error toast notification
 * @param message - Error message to display
 * @param options - Optional toast configuration
 */
export const showError = (message: string, options?: Partial<typeof defaultToastOptions.error>) => {
  return toast.error(message, {
    ...defaultToastOptions.error,
    ...options,
  });
};

/**
 * Show loading toast notification
 * @param message - Loading message to display
 * @param options - Optional toast configuration
 */
export const showLoading = (message: string, options?: Partial<typeof defaultToastOptions.loading>) => {
  return toast.loading(message, {
    ...defaultToastOptions.loading,
    ...options,
  });
};

/**
 * Show custom toast notification
 * @param message - Message to display
 * @param options - Optional toast configuration
 */
export const show = (message: string, options?: any) => {
  return toast(message, {
    ...defaultToastOptions.default,
    ...options,
  });
};

/**
 * Show promise-based toast with loading, success, and error states
 * @param promise - Promise to track
 * @param messages - Messages for each state
 */
export const showPromise = <T,>(
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
      loading: defaultToastOptions.loading,
      success: defaultToastOptions.success,
      error: defaultToastOptions.error,
    }
  );
};

/**
 * Dismiss a specific toast or all toasts
 * @param toastId - Optional toast ID to dismiss (dismisses all if not provided)
 */
export const dismiss = (toastId?: string) => {
  toast.dismiss(toastId);
};

/**
 * Remove a specific toast or all toasts (clears from DOM)
 * @param toastId - Optional toast ID to remove (removes all if not provided)
 */
export const remove = (toastId?: string) => {
  toast.remove(toastId);
};

/**
 * Show confirmation toast with action buttons
 * @param message - Confirmation message
 * @param onConfirm - Callback when confirmed
 * @param onCancel - Optional callback when cancelled
 * @param options - Optional configuration
 */
export const showConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }
) => {
  const {
    confirmText = "Confirm",
    cancelText = "Cancel",
    destructive = false,
  } = options || {};

  return toast.custom(
    (t) => (
      <div
        style={{
          background: COLORS.graphiteBlack,
          color: COLORS.white,
          borderRadius: "8px",
          padding: "16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          maxWidth: "400px",
        }}
      >
        <p style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "500" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              if (onCancel) onCancel();
              toast.dismiss(t.id);
            }}
            style={{
              padding: "8px 16px",
              background: COLORS.concreteGray,
              color: COLORS.graphiteBlack,
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              toast.dismiss(t.id);
            }}
            style={{
              padding: "8px 16px",
              background: destructive ? COLORS.errorRed : COLORS.buildLightGreen,
              color: destructive ? COLORS.white : COLORS.graphiteBlack,
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
    }
  );
};

// Export the original toast object for advanced usage
export { toast };

// Export Toaster component for use in layout
export { Toaster };

// Default export with all utilities
export default {
  success: showSuccess,
  error: showError,
  loading: showLoading,
  show,
  promise: showPromise,
  confirm: showConfirm,
  dismiss,
  remove,
  toast,
  Toaster,
};
