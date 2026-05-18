import React, { useState } from 'react';
import "./src/global.css";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import NetworkCheck from './src/components/NetworkCheck';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { LogBox, Platform } from 'react-native';

// Import react-hot-toast Toaster for Web support
let Toaster = () => null;
if (Platform.OS === 'web') {
  try {
    Toaster = require('react-hot-toast').Toaster;
  } catch (e) {}
}

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: '#22c55e', 
        height: 60, 
        width: '90%', 
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '700',
        color: '#000'
      }}
      text2Style={{
        fontSize: 13,
        color: '#666'
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ 
        borderLeftColor: '#ef4444', 
        height: 60, 
        width: '90%', 
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: '700'
      }}
      text2Style={{
        fontSize: 13
      }}
    />
  )
};

// Silence specific deprecation warnings from third-party libraries
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  '"shadow*" style props are deprecated',
  'Blocked aria-hidden on an element'
]);

// Handle web console warnings specifically
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
       (args[0].includes('shadow*') || 
        args[0].includes('pointerEvents') || 
        args[0].includes('aria-hidden'))) {
      return;
    }
    originalWarn(...args);
  };
}

import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  if (!isAppReady) {
    return <SplashScreen onFinish={() => setIsAppReady(true)} />;
  }
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NetworkCheck>
          <View className="flex-1 bg-white">
            <StatusBar style="auto" />
            <AppNavigator />
            <Toaster position="top-center" />
            <Toast config={toastConfig} />
          </View>
        </NetworkCheck>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
