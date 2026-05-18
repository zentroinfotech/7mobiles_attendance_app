import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from '../utils/toast';

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/staff/login', {
        email: username,
        password
      });
      
      if (response.data.success) {
        if (response.data.otpSent) {
          setShowOTP(true);
          toast.info('Please check your email for the OTP.', { title: 'Verification Code Sent' });
        } else {
          // Direct login fallback (if OTP is disabled)
          const { token, data: user } = response.data;
          await signIn(token, user);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unable to connect to the server.';
      toast.error(errorMessage, { title: 'Login Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/staff/verify-otp', {
        email: username,
        otp
      });
      
      if (response.data.success) {
        const { token, data: user } = response.data;
        toast.success(`Welcome back, ${user.name}!`);
        await signIn(token, user);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid or expired OTP.';
      toast.error(errorMessage, { title: 'Verification Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-10">
          <Image 
            source={require('../assets/logo.png')} 
            style={{ width: 300, height: 140 }}
            resizeMode="contain"
            className="mb-6"
          />
          <Text className="text-[32px] font-black text-black mb-2 text-center">
            {showOTP ? 'Verify Identity' : 'Welcome Back'}
          </Text>
          <Text className="text-[18px] text-gray-500 text-center px-4 leading-7">
            {showOTP 
              ? `Enter the 6-digit code sent to ${username}` 
              : 'Sign in to track your attendance and manage your shifts.'}
          </Text>
        </View>

        <View className="w-full">
          {!showOTP ? (
            <>
              <View className="flex-row items-center bg-[#F8F9FA] rounded-2xl px-4 h-[64px] mb-4 border border-[#EFEFEF]">
                <User color={COLORS.textSecondary} size={22} className="mr-3" />
                <TextInput
                  className="flex-1 text-[18px] text-black"
                  placeholder="Email or Username"
                  placeholderTextColor="#999999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View className="flex-row items-center bg-[#F8F9FA] rounded-2xl px-4 h-[64px] mb-4 border border-[#EFEFEF]">
                <Lock color={COLORS.textSecondary} size={22} className="mr-3" />
                <TextInput
                  className="flex-1 text-[18px] text-black"
                  placeholder="Password"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <Eye color={COLORS.textSecondary} size={22} />
                  ) : (
                    <EyeOff color={COLORS.textSecondary} size={22} />
                  )}
                </TouchableOpacity>
              </View>


              <Button 
                title="Sign In" 
                onPress={handleLogin} 
                loading={loading} 
                className="mt-4"
              />
            </>
          ) : (
            <>
              <View className="flex-row items-center bg-[#F8F9FA] rounded-2xl px-4 h-[70px] mb-8 border border-[#EFEFEF]">
                <ShieldCheck color={COLORS.primary} size={26} className="mr-4" />
                <TextInput
                  className="flex-1 text-[23px] text-black font-black tracking-[15px] pl-8"
                  placeholder="000000"
                  placeholderTextColor="#999999"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <Button 
                title="Verify & Login" 
                onPress={handleVerifyOTP} 
                loading={loading} 
                className="mt-4"
              />

              <TouchableOpacity 
                onPress={() => {
                  setShowOTP(false);
                  setOtp('');
                }}
                className="mt-8 flex-row items-center justify-center"
              >
                <ArrowLeft color={COLORS.textSecondary} size={18} />
                <Text className="text-gray-500 text-[16px] font-bold ml-2">Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
 

export default LoginScreen;
