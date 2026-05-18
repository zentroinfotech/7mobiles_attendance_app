import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  Switch,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated
} from 'react-native';
import { User, Mail, Shield, Bell, CircleHelp, ChevronRight, LogOut, Camera, Calendar, Phone, Pencil, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import Loader from '../components/Loader';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut, updateUser } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutScale] = useState(new Animated.Value(0.85));

  useEffect(() => {
    if (logoutModalVisible) {
      logoutScale.setValue(0.85);
      Animated.spring(logoutScale, {
        toValue: 1,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }).start();
    }
  }, [logoutModalVisible]);

  useEffect(() => {
    if (user?.phoneNumber) {
      setNewPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  const handleUpdatePhone = async () => {
    if (!newPhoneNumber || newPhoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put('/staff/update-profile', { phoneNumber: newPhoneNumber });
      if (response.data.success) {
        await updateUser({ phoneNumber: newPhoneNumber });
        setIsEditModalOpen(false);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Phone number updated successfully'
        });
      }
    } catch (error) {
      console.error('Update Phone Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update phone number');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to update your profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleUploadImage(result.assets[0].uri);
    }
  };

  const handleUploadImage = async (uri) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image/jpeg`;
      
      // Standardize jpg/jpeg mime types
      if (type === 'image/jpg') {
        type = 'image/jpeg';
      }

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('avatar', blob, filename);
      } else {
        formData.append('avatar', {
          uri: uri, // Keeping the full file:// schema is required by Axios to read local device assets in React Native
          name: filename,
          type,
        });
      }

      const response = await api.put('/staff/update-profile', formData);

      if (response.data.success) {
        await updateUser({ avatar: response.data.data.avatar });
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your profile picture has been updated.'
        });
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const SettingItem = ({ icon: Icon, label, value, onPress, showChevron = true, isLast = false, color = COLORS.textSecondary }) => (
    <TouchableOpacity 
      className={`flex-row items-center justify-between p-4 ${isLast ? '' : 'border-b border-[#F2F2F7]'}`}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row items-center">
        <View className="w-9 h-9 rounded-xl justify-center items-center mr-3" style={{ backgroundColor: color + '15' }}>
          <Icon color={color} size={20} />
        </View>
        <Text className="text-base text-black font-semibold">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value && <Text className="text-sm text-gray-500 mr-2">{value}</Text>}
        {showChevron && <ChevronRight color="#C7C7CC" size={20} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      <Header 
        title="Profile" 
        showBack 
        onBack={() => navigation.goBack()} 
        showLogo={false}
      />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ID Card Style Profile */}
        <View className="p-6 items-center">
          <View className="w-full bg-white rounded-[24px] overflow-hidden border border-[#E1E1E1] shadow-xl">
            {/* ID Card Top Bar */}
            <View className="bg-primary flex-row justify-between items-center px-5 py-4">
              <View className="flex-row items-center">
                <Shield color={COLORS.white} size={20} />
                <Text className="text-white text-sm font-[800] ml-2 tracking-widest">SEVEN MOBILES</Text>
              </View>
              <Text className="text-white/80 text-[11px] font-bold tracking-[2px]">EMPLOYEE ID</Text>
            </View>

            {/* ID Card Body */}
            <View className="flex-row p-6 pb-4">
              <View className="items-center mr-6 relative">
                <TouchableOpacity 
                  onPress={() => user?.avatar && setIsPreviewOpen(true)}
                  className="w-[100px] h-[120px] bg-[#F8F9FA] rounded-xl justify-center items-center border border-[#E1E1E1] overflow-hidden"
                >
                  {user?.avatar ? (
                    <Image 
                      source={{ uri: user.avatar }} 
                      style={{ width: '100%', height: '100%' }} 
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-3xl font-bold text-gray-400">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handlePickImage}
                  className="absolute top-[-10] right-[-8] bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-lg z-20"
                >
                  <Pencil color="white" size={14} />
                </TouchableOpacity>

                <View className="flex-row items-center bg-[#22c55e] px-2 py-1 rounded-md -mt-3 shadow-sm z-10">
                  <Shield color={COLORS.white} size={10} />
                  <Text className="text-white text-[9px] font-bold ml-1">VERIFIED</Text>
                </View>
              </View>

              <View className="flex-1 justify-center">
                <View className="mb-3">
                  <Text className="text-[10px] text-gray-400 font-bold tracking-wider mb-0.5 uppercase">Name</Text>
                  <Text className="text-sm font-bold text-black">{user?.name ? user.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'User'}</Text>
                </View>
                <View className="mb-3">
                  <Text className="text-[10px] text-gray-400 font-bold tracking-wider mb-0.5 uppercase">Employee ID</Text>
                  <Text className="text-sm font-bold text-black">{user?.employeeId || '7M-EMP-XXXX'}</Text>
                </View>
                <View className="mb-3">
                  <Text className="text-[10px] text-gray-400 font-bold tracking-wider mb-0.5 uppercase">Joined Date</Text>
                  <Text className="text-sm font-bold text-black">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</Text>
                </View>
                <View className="mb-3">
                  <Text className="text-[10px] text-gray-400 font-bold tracking-wider mb-0.5 uppercase">Department</Text>
                  <Text className="text-sm font-bold text-black">{user?.branch || 'N/A'}</Text>
                </View>
                <View className="mb-0">
                  <Text className="text-[10px] text-gray-400 font-bold tracking-wider mb-0.5 uppercase">Shift Timing</Text>
                  <Text className="text-sm font-bold text-primary">{user?.shiftIn || '09:00'} | {user?.eveningShiftIn || '13:00'} | {user?.shiftOut || '19:00'}</Text>
                </View>
              </View>
            </View>

            {/* ID Card Footer (Barcode Placeholder) */}
            <View className="p-4 items-center bg-[#F8F9FA] border-t border-[#F0F0F0]">
              <View className="flex-row h-[30px] items-center opacity-80">
                {[...Array(30)].map((_, i) => (
                  <View 
                    key={i} 
                    className="h-full bg-black rounded-[1px]"
                    style={{ width: Math.random() * 3 + 1, marginLeft: Math.random() * 2 }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className="mt-6 px-6">
          <Text className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Attendance</Text>
          <View className="bg-white rounded-[20px] overflow-hidden">
            <SettingItem 
              icon={Calendar} 
              label="Full Attendance Details" 
              onPress={() => navigation.navigate('AttendanceHistory')}
              isLast={true}
              color={COLORS.primary}
            />
          </View>
        </View>

        <View className="mt-6 px-6">
          <Text className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Account Details</Text>
          <View className="bg-white rounded-[20px] overflow-hidden">
            <SettingItem 
              icon={Mail} 
              label="Email" 
              value={user?.email || 'N/A'} 
              showChevron={false}
            />
            <SettingItem 
              icon={Phone} 
              label="Mobile Number" 
              value={user?.phoneNumber || 'N/A'} 
              color="#5856D6"
              isLast={true}
              onPress={() => setIsEditModalOpen(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '15' }]}>
                  <Bell color={COLORS.primary} size={20} />
                </View>
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: '#767577', true: COLORS.primary + '80' }}
                thumbColor={notifications ? COLORS.primary : '#f4f3f4'}
              />
            </View>
            <SettingItem 
              icon={CircleHelp} 
              label="Help & Support" 
              color="#FF9500"
              isLast={true}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={COLORS.error} size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0 • Seven Mobiles</Text>
      </ScrollView>

      {/* Edit Phone Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white w-full rounded-3xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">Edit Mobile Number</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <ChevronRight color="#94a3b8" size={24} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Phone Number</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-900"
                value={newPhoneNumber}
                onChangeText={setNewPhoneNumber}
                placeholder="Enter 10-digit number"
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setIsEditModalOpen(false)}
                className="flex-1 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-600 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleUpdatePhone}
                disabled={isUpdating}
                className={`flex-1 ${isUpdating ? 'bg-primary/50' : 'bg-primary'} py-3.5 rounded-xl items-center flex-row justify-center`}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-bold">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Preview */}
      <Modal
        visible={isPreviewOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPreviewOpen(false)}
      >
        <View className="flex-1 bg-black/95 justify-center items-center">
          <TouchableOpacity 
            onPress={() => setIsPreviewOpen(false)}
            className="absolute top-12 right-6 z-50 p-2 bg-white/10 rounded-full"
          >
            <X color="white" size={28} />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: user?.avatar }} 
            className="w-full h-full"
            resizeMode="contain"
          />
          
          <View className="absolute bottom-12 w-full items-center">
            <Text className="text-white text-lg font-bold">{user?.name}</Text>
            <Text className="text-white/60 text-sm">{user?.employeeId}</Text>
          </View>
        </View>
      </Modal>

      {/* Custom Logout Confirmation Popup Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <Animated.View style={{ transform: [{ scale: logoutScale }] }} className="bg-white p-6 rounded-2xl w-full max-w-[300px] items-center border border-slate-100 shadow-2xl">
            <View className="bg-red-50 p-3.5 rounded-full mb-4 border border-red-100">
              <LogOut color="#DC2626" size={28} />
            </View>
            
            <Text className="text-lg font-black text-slate-800 mb-1.5">Log Out</Text>
            <Text className="text-slate-500 text-xs text-center mb-5 leading-4">
              Are you sure you want to log out of your account?
            </Text>
            
            <View className="flex-row w-full justify-between gap-x-3">
              <TouchableOpacity 
                className="flex-1 bg-slate-100 py-3 rounded-xl justify-center items-center border border-slate-200"
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text className="text-slate-600 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 bg-[#DC2626] py-3 rounded-xl justify-center items-center shadow-lg shadow-red-500/20"
                onPress={() => {
                  setLogoutModalVisible(false);
                  Toast.show({
                    type: 'info',
                    text1: 'Logging out...',
                    position: 'bottom'
                  });
                  signOut();
                }}
              >
                <Text className="text-white font-extrabold text-sm">Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Full Screen Loading Overlay */}
      <Loader visible={isUpdating} message="Updating profile..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  idCardContainer: {
    padding: 24,
    alignItems: 'center',
  },
  idCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    boxShadow: '0px 10px 25px rgba(0,0,0,0.1)',
    elevation: 10,
  },
  idCardHeader: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  companyLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 1,
  },
  idCardType: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 2,
  },
  idCardBody: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 16,
  },
  idCardLeft: {
    alignItems: 'center',
    marginRight: 24,
  },
  idAvatar: {
    width: 100,
    height: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginBottom: 12,
  },
  idAvatarText: {
    fontSize: 46,
    fontWeight: '800',
    color: COLORS.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: {
    color: COLORS.white,
    fontSize: 7.5,
    fontWeight: '800',
    marginLeft: 4,
  },
  idCardRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoGroup: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.black,
  },
  idCardFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  barcodeContainer: {
    flexDirection: 'row',
    height: 30,
    alignItems: 'center',
    opacity: 0.8,
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: COLORS.black,
    borderRadius: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15.5,
    color: COLORS.black,
    fontWeight: '600',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginTop: 32,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 15.5,
    fontWeight: '700',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
});

export default ProfileScreen;
