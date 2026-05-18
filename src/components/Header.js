import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, LogOut, User, RefreshCw } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const Header = ({ title, showBack, onBack, showLogout, onLogout, showProfile, onProfile, showRefresh, onRefresh, showLogo = true }) => {
  return (
    <SafeAreaView className="bg-white">
      <View className="h-[60px] flex-row items-center justify-between px-4 border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          {showBack && (
            <TouchableOpacity onPress={onBack} className="p-1">
              <ChevronLeft color={COLORS.black} size={28} />
            </TouchableOpacity>
          )}
          
          <View className={`${showBack ? 'ml-2' : 'items-center flex-1'}`}>
            {showLogo ? (
              <Image 
                source={require('../assets/logo.png')} 
                style={{ width: 100, height: 35 }}
                resizeMode="contain"
              />
            ) : (
              <Text className="text-lg font-bold text-black" numberOfLines={1}>{title}</Text>
            )}
          </View>
        </View>
        
        <View className="flex-row items-center">
          {showRefresh && (
            <TouchableOpacity onPress={onRefresh} className="p-1 mr-2">
              <RefreshCw color={COLORS.primary} size={22} />
            </TouchableOpacity>
          )}
          {showProfile && (
            <TouchableOpacity onPress={onProfile} className="p-1">
              <User color={COLORS.primary} size={24} />
            </TouchableOpacity>
          )}
          {showLogout && (
            <TouchableOpacity onPress={onLogout} className="p-1">
              <LogOut color={COLORS.error} size={24} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Header;
