import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, Dimensions, Animated, Easing, ActivityIndicator, Linking, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, RefreshCw, Info } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import api from '../services/api';
import Loader from '../components/Loader';
import toast from '../utils/toast';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const scannerSize = width * 0.75;

const QRScannerScreen = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Synchronizing data...");
  
  // Location States
  const [scannerLocation, setScannerLocation] = useState(route.params?.location || null);
  const [locLoading, setLocLoading] = useState(!route.params?.location);
  
  const scanAnim = useRef(new Animated.Value(0)).current;
  const isFetchingRef = useRef(false);

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

  // Fallback / Active GPS coordinates fetcher inside the scanner
  useEffect(() => {
    if (!scannerLocation) {
      const getScannerLocation = async () => {
        if (isFetchingRef.current) {
          console.log('[Scanner GPS] Fetch already in progress. Skipping duplicate fetch.');
          return;
        }
        isFetchingRef.current = true;
        try {
          setLocLoading(true);
          // Check/Request Foreground Permission
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              "Permission Denied",
              "GPS location is required to verify your store bounds. Please enable location permissions.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
            return;
          }

          // 2. Try Cached Last Known Position first for speed and absolute crash-safety
          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: 60000, // 1 minute fresh
          });
          if (lastKnown && lastKnown.coords) {
            const coords = {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude
            };
            setScannerLocation(coords);
            console.log('[Scanner GPS] Using fast cached last-known position:', coords);
            return;
          }

          let locationResolved = false;
          let popupShown = false;

          // Start the 7-second timer for the enable location popup
          const popupTimeout = setTimeout(async () => {
            if (!locationResolved) {
              popupShown = true;
              const servicesEnabled = await Location.hasServicesEnabledAsync();
              if (!servicesEnabled) {
                Alert.alert(
                  "GPS Disabled",
                  "Location services (GPS) are turned off. Please enable location services to verify your store bounds.",
                  [
                    { 
                      text: "Cancel", 
                      style: "cancel", 
                      onPress: () => navigation.goBack() 
                    },
                    { 
                      text: "Enable", 
                      onPress: async () => {
                        try {
                          setLocLoading(true);
                          if (Platform.OS === 'android') {
                            await Location.enableNetworkProviderAsync();
                          } else {
                            await Linking.openSettings();
                          }
                        } catch (err) {
                          console.log('[Scanner GPS] Enable provider error:', err.message);
                          await Linking.openSettings();
                        } finally {
                          isFetchingRef.current = false;
                          setScannerLocation(null);
                        }
                      }
                    }
                  ]
                );
              }
            }
          }, 7000);

          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Scanner location fetch timed out")), 8000)
          );

          const pos = await Promise.race([locationPromise, timeoutPromise]);

          locationResolved = true;
          clearTimeout(popupTimeout);

          if (pos && pos.coords) {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            };
            setScannerLocation(coords);
            console.log('[Scanner GPS] Coordinates resolved:', coords);
          }
        } catch (err) {
          console.log('[Scanner GPS] Error acquiring location:', err.message);
          // Only show error or popup if we haven't already prompted the user via the 7-second timer
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            Alert.alert(
              "GPS Disabled",
              "Location services (GPS) are turned off. Please enable location services to verify your store bounds.",
              [
                { text: "Cancel", style: "cancel", onPress: () => navigation.goBack() },
                {
                  text: "Enable",
                  onPress: async () => {
                    try {
                      setLocLoading(true);
                      if (Platform.OS === 'android') {
                        await Location.enableNetworkProviderAsync();
                      } else {
                        await Linking.openSettings();
                      }
                    } catch (e) {
                      console.log('[Scanner GPS] Enable provider error:', e.message);
                      await Linking.openSettings();
                    } finally {
                      isFetchingRef.current = false;
                      setScannerLocation(null);
                    }
                  }
                }
              ]
            );
          } else {
            Alert.alert(
              "GPS Error",
              "Could not acquire your precise GPS location. Please retry from the dashboard.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          }
        } finally {
          setLocLoading(false);
          isFetchingRef.current = false;
        }
      };
      getScannerLocation();
    }
  }, [scannerLocation]);

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
    
    // Retrieve resolved coordinates
    const location = scannerLocation;

    if (!location) {
      Alert.alert(
        "Location Missing",
        "Could not find valid location coordinates. Please wait for the GPS coordinates to resolve.",
        [{ text: "OK" }]
      );
      return;
    }

    setScanned(true);
    setLoading(true);
    setLoaderMessage("Verifying Attendance...");

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
        androidId: deviceId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      };

      // 2. Send to backend
      console.log('[Attendance Scan] Sending Payload:', JSON.stringify(payload, null, 2));
      const response = await api.post('/staff/mark-attendance', payload);

      // Clear coordinates immediately upon receiving response to ensure fresh fetching next time
      setScannerLocation(null);

      if (response.data.success) {
        navigation.replace('AttendanceSuccess', { success: true, data: response.data.data });
      } else {
        setScanned(false);
      }
    } catch (error) {
      console.log('[Attendance Scan] Scan failed:', error.message);
      
      // Clear coordinates immediately upon receiving failure response to force fresh re-fetching
      setScannerLocation(null);

      const errorMessage = error.response?.data?.message || "An error occurred while marking attendance.";
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'LOCATION_OUT_OF_BOUNDS' || errorCode === 'LOCATION_REQUIRED') {
        navigation.replace('AttendanceSuccess', { success: false, errorMessage: errorMessage });
      } else {
        toast.error(errorMessage, { title: "Verification Failed" });
        setScanned(false);
      }
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
        onBarcodeScanned={scanned || locLoading ? undefined : handleBarCodeScanned}
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
              
              {!scanned && !locLoading && (
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
            disabled={loading}
          >
            <X color={COLORS.white} size={24} />
          </TouchableOpacity>
          
          <View className="items-center">
            <Text className="text-white text-base font-black tracking-[3px] uppercase">Scan QR Code</Text>
            {scannerLocation ? (
              <View className="flex-row bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full items-center gap-x-1.5 mt-2">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <Text className="text-green-500 text-[9px] font-black uppercase tracking-wider">
                  GPS Active: {scannerLocation.latitude.toFixed(5)}, {scannerLocation.longitude.toFixed(5)}
                </Text>
              </View>
            ) : (
              <View className="flex-row bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full items-center gap-x-1.5 mt-2">
                <View className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <Text className="text-amber-500 text-[9px] font-black uppercase tracking-wider">
                  GPS Fetching...
                </Text>
              </View>
            )}
          </View>
          
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
      
      {/* Fallback GPS Fetching Overlay (Loading Circle) */}
      {locLoading && (
        <View style={StyleSheet.absoluteFillObject} className="bg-black/90 justify-center items-center z-50">
          <View className="bg-white/10 p-8 rounded-[40px] items-center border border-white/20">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-white font-black mt-5 text-base tracking-[2px] uppercase">Fetching GPS...</Text>
            <Text className="text-gray-400 text-xs mt-2 text-center max-w-[200px] leading-5">
              Please wait while we resolve your exact location coordinates.
            </Text>
          </View>
        </View>
      )}

      {/* Backend Scan dispatch Loader Overlay */}
      {loading && (
        <View style={StyleSheet.absoluteFillObject} className="bg-black/80 justify-center items-center z-[60]">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-white font-black mt-5 text-[15px] tracking-[2px] uppercase">{loaderMessage}</Text>
        </View>
      )}
    </View>
  );
};

export default QRScannerScreen;
