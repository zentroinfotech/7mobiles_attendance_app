import { Platform } from 'react-native';
import ToastMessage from 'react-native-toast-message';

// Note: react-hot-toast only works on Web. 
// For Native, we use the customized react-native-toast-message which we've styled to look identical.
let hotToast;
if (Platform.OS === 'web') {
  try {
    hotToast = require('react-hot-toast').default;
  } catch (e) {
    hotToast = null;
  }
}

const toast = {
  success: (message, options = {}) => {
    if (Platform.OS === 'web' && hotToast) {
      hotToast.success(message, options);
    } else {
      ToastMessage.show({
        type: 'success',
        text1: options.title || 'Success',
        text2: message,
        position: options.position || 'top',
        ...options
      });
    }
  },
  error: (message, options = {}) => {
    if (Platform.OS === 'web' && hotToast) {
      hotToast.error(message, options);
    } else {
      ToastMessage.show({
        type: 'error',
        text1: options.title || 'Error',
        text2: message,
        position: options.position || 'top',
        ...options
      });
    }
  },
  info: (message, options = {}) => {
    if (Platform.OS === 'web' && hotToast) {
      hotToast(message, { icon: 'ℹ️', ...options });
    } else {
      ToastMessage.show({
        type: 'success', // Use success type but customize if needed
        text1: options.title || 'Info',
        text2: message,
        position: options.position || 'top',
        ...options
      });
    }
  },
  loading: (message, options = {}) => {
    if (Platform.OS === 'web' && hotToast) {
      return hotToast.loading(message, options);
    } else {
      ToastMessage.show({
        type: 'success',
        text1: 'Processing...',
        text2: message,
        ...options
      });
      return 'native-toast-id';
    }
  },
  dismiss: (id) => {
    if (Platform.OS === 'web' && hotToast) {
      hotToast.dismiss(id);
    } else {
      ToastMessage.hide();
    }
  }
};

export default toast;
