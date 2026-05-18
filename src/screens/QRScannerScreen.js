import React, { useState, useEffect, useRef } from 'react';
import {Text,View,StyleSheet,TouchableOpacity,Alert,Dimensions,Animated,Easing  } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, RefreshCw, Info, CheckCircle } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import axios from 'axios';
import api from '../services/api';
import Loader from '../components/Loader';
import toast from '../utils/toast';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const scannerSize = width * 0.75;

const QRScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);
  
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (!scanned) {
      startAnimation();
    } else {
      scanAnim.stopAnimation();
    }
  }, [scanned]);



  const startAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  if (!permission) {
    return <Loader visible={true} />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-5">
        <Text className="text-gray-500 text-center text-lg mb-5">Camera access is required to scan QR codes</Text>
        <TouchableOpacity 
          className="bg-primary px-8 py-3 rounded-2xl"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold text-base">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // 1. Get or Generate Persistent Device ID
      let deviceId = null;
      if (Platform.OS === 'android') {
        deviceId = Application.androidId;
      } else if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync();
      }
      
      // If native ID is not available (e.g., in Expo Go or Web), use a persistent UUID
      if (!deviceId) {
        try {
          if (Platform.OS === 'web' || !SecureStore.getItemAsync) {
            deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
              deviceId = `web_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
              localStorage.setItem('device_id', deviceId);
            }
          } else {
            deviceId = await SecureStore.getItemAsync('device_id');
            if (!deviceId) {
              deviceId = `dev_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
              await SecureStore.setItemAsync('device_id', deviceId);
            }
          }
        } catch (storageError) {
          deviceId = `temp_${Math.random().toString(36).substring(2, 15)}`;
        }
      }

      const payload = {
        token: data,
        androidId: deviceId
      };

      // 2. Send to backend
      console.log('[Attendance Scan] Sending Payload:', JSON.stringify(payload, null, 2));
      const response = await api.post('/staff/mark-attendance', payload);

      if (response.data.success) {
        navigation.replace('AttendanceSuccess');
      } else {
        // Most errors (401/403) are handled by the interceptor
        // Only handle other success=false cases here if any
        setScanned(false);
      }
    } catch (error) {
      // Interceptor handles 401/403 (logout + toast)
      // We just need to reset the scanner state if it wasn't a logout error
      console.log('[Attendance Scan] Scan failed:', error.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scannerSize],
  });

  return (
    <View className="flex-1 bg-black">
      <CameraView 
        className="flex-1"
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Dark Overlay with Transparent Hole */}
      <View className="absolute inset-0">
        <View className="flex-1 bg-black/60" />
        <View className="flex-row" style={{ height: scannerSize }}>
          <View className="flex-1 bg-black/60" />
          <View className="relative" style={{ width: scannerSize }}>
            <View className="flex-1 border-2 border-white/30 rounded-[15px] overflow-hidden">
              <View className="absolute top-0 left-0 w-[30px] h-[30px] border-t-4 border-l-4 border-primary rounded-tl-[15px]" />
              <View className="absolute top-0 right-0 w-[30px] h-[30px] border-t-4 border-r-4 border-primary rounded-tr-[15px]" />
              <View className="absolute bottom-0 left-0 w-[30px] h-[30px] border-b-4 border-l-4 border-primary rounded-bl-[15px]" />
              <View className="absolute bottom-0 right-0 w-[30px] h-[30px] border-b-4 border-r-4 border-primary rounded-br-[15px]" />
              
              {!scanned && (
                <Animated.View 
                  className="h-[2px] bg-primary w-full absolute shadow-lg shadow-green-500"
                  style={{ transform: [{ translateY }] }}
                >
                  <View className="h-[40px] w-full bg-transparent opacity-20 absolute -top-[20px]" />
                </Animated.View>
              )}
            </View>
          </View>
          <View className="flex-1 bg-black/60" />
        </View>
        <View className="flex-1 bg-black/60" />
      </View>

      {/* UI Elements */}
      <View className="absolute inset-0 justify-between py-[50px] px-5">
        <View className="flex-row justify-between items-center mt-5">
          <TouchableOpacity 
            className="w-12 h-12 rounded-full bg-white/15 justify-center items-center border border-white/20"
            onPress={() => navigation.goBack()}
          >
            <X color={COLORS.white} size={24} />
          </TouchableOpacity>
          
          <Text className="text-white text-base font-black tracking-[3px] uppercase">Scan QR Code</Text>
          
          <TouchableOpacity 
            className={`w-12 h-12 rounded-full justify-center items-center border border-white/20 ${
              torch ? 'bg-green-500/20 border-primary' : 'bg-white/15'
            }`}
            onPress={() => setTorch(!torch)}
          >
            <Zap color={torch ? COLORS.primary : COLORS.white} size={24} />
          </TouchableOpacity>
        </View>

        <View className="items-center mb-10 w-full">
          <View className="flex-row bg-black/80 p-5 rounded-3xl items-center w-full border border-white/10 gap-x-4">
            <View className="bg-primary/20 p-2.5 rounded-2xl">
              <Info color={COLORS.primary} size={22} />
            </View>
            <Text className="text-white text-[15px] flex-1 leading-6 opacity-95 font-medium">
              Point your camera at the attendance QR code displayed on the screen.
            </Text>
          </View>
          
          {scanned && !loading && (
            <TouchableOpacity 
              className="flex-row items-center bg-primary px-6 py-3.5 rounded-full mt-6 shadow-xl shadow-green-500/30"
              onPress={() => setScanned(false)}
            >
              <RefreshCw color={COLORS.white} size={20} />
              <Text className="text-white font-bold text-base ml-2.5">Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Loader visible={loading} />
    </View>
  );
};

export default QRScannerScreen;
