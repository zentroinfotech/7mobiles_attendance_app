import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, BackHandler, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCw, LogOut } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const NetworkCheck = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setShowModal(!state.isConnected);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setShowModal(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const handleTryAgain = () => {
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setShowModal(!state.isConnected);
      if (state.isConnected) {
        // Optional: Could trigger a refresh of current screen data here
      }
    });
  };

  const handleExit = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      // iOS doesn't allow exiting the app programmatically in a way that passes App Store review,
      // but we can at least show a message or just close the modal if they "exit" back to the system.
      // For now, we'll just keep the modal open or handle it gracefully.
      setShowModal(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-6">
          <View className="bg-white w-full max-w-sm rounded-[32px] p-8 items-center shadow-2xl">
            <View className="bg-red-50 p-6 rounded-full mb-6">
              <WifiOff color="#EF4444" size={48} strokeWidth={2.5} />
            </View>
            
            <Text className="text-[22.8px] font-[900] text-black mb-3 text-center">
              No Internet Connection
            </Text>
            
            <Text className="text-gray-500 text-center text-[15.2px] font-medium leading-6 mb-10">
              Please check your internet connection and try again to continue using the app.
            </Text>
            
            <View className="w-full gap-y-4">
              <TouchableOpacity 
                className="bg-primary w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-green-500/20"
                onPress={handleTryAgain}
              >
                <RefreshCw color="white" size={20} className="mr-3" />
                <Text className="text-white font-bold text-[17.1px]">Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-gray-100 w-full py-4 rounded-2xl flex-row items-center justify-center"
                onPress={handleExit}
              >
                <LogOut color="#6B7280" size={20} className="mr-3" />
                <Text className="text-gray-500 font-bold text-[17.1px]">Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NetworkCheck;
