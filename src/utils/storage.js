import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const DASHBOARD_KEY = 'dashboard_data';

const isWeb = Platform.OS === 'web';

export const storage = {
  async saveToken(token) {
    try {
      if (isWeb) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error saving token', error);
    }
  },

  async getToken() {
    try {
      if (isWeb) {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting token', error);
      return null;
    }
  },

  async removeToken() {
    try {
      if (isWeb) {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error removing token', error);
    }
  },

  async saveUser(user) {
    try {
      const userStr = JSON.stringify(user);
      if (isWeb) {
        localStorage.setItem(USER_KEY, userStr);
      } else {
        await SecureStore.setItemAsync(USER_KEY, userStr);
      }
    } catch (error) {
      console.error('Error saving user data', error);
    }
  },

  async getUser() {
    try {
      const user = isWeb ? localStorage.getItem(USER_KEY) : await SecureStore.getItemAsync(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user data', error);
      return null;
    }
  },

  async saveDashboardData(data) {
    try {
      const dataStr = JSON.stringify(data);
      if (isWeb) {
        localStorage.setItem(DASHBOARD_KEY, dataStr);
      } else {
        await SecureStore.setItemAsync(DASHBOARD_KEY, dataStr);
      }
    } catch (error) {
      console.error('Error saving dashboard data', error);
    }
  },

  async getDashboardData() {
    try {
      const data = isWeb ? localStorage.getItem(DASHBOARD_KEY) : await SecureStore.getItemAsync(DASHBOARD_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting dashboard data', error);
      return null;
    }
  },

  async clearAll() {
    try {
      if (isWeb) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(DASHBOARD_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        await SecureStore.deleteItemAsync(DASHBOARD_KEY);
      }
    } catch (error) {
      console.error('Error clearing storage', error);
    }
  }
};
