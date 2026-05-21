import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, useWindowDimensions, SafeAreaView } from 'react-native';
import { CheckCircle, XCircle, Calendar, Clock, MapPin } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const AttendanceSuccessScreen = ({ navigation, route }) => {
  const { width, height } = useWindowDimensions();
  const successAnim = useRef(new Animated.Value(0)).current;
  
  const { success = true, data, errorMessage } = route.params || {};

  const isSmallDevice = width < 375;
  const isVerySmallDevice = width < 330;

  // Celebration Particles
  const particles = useRef([...Array(20)].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(1),
    color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)]
  }))).current;

  useEffect(() => {
    // Start success/error spring animation
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7
    }).start();

    if (success) {
      // Start particle animation
      particles.forEach((p) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 150;
        
        Animated.parallel([
          Animated.timing(p.x, {
            toValue: Math.cos(angle) * distance,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(p.y, {
            toValue: Math.sin(angle) * distance,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(p.scale, {
            toValue: 0.5 + Math.random(),
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 1000,
            delay: 200,
            useNativeDriver: true
          })
        ]).start();
      });

      // Auto-navigate back to Dashboard after 3.5 seconds
      const timer = setTimeout(() => {
        navigation.navigate('Dashboard');
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full max-w-[450px] items-center">
          <View className="items-center justify-center relative w-full h-[200px]">
            {/* Celebration Particles - Success Mode Only */}
            {success && particles.map((p, i) => (
              <Animated.View 
                key={i}
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: p.color,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { scale: p.scale }
                  ],
                  opacity: p.opacity
                }}
              />
            ))}

            <Animated.View 
              style={{ 
                width: isVerySmallDevice ? 110 : 140,
                height: isVerySmallDevice ? 110 : 140,
                transform: [{ 
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  }) 
                }] 
              }}
              className={`rounded-full justify-center items-center border-4 ${
                success 
                  ? 'bg-primary/10 border-primary/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              {success ? (
                <CheckCircle 
                  color={COLORS.primary} 
                  size={isVerySmallDevice ? 50 : (isSmallDevice ? 70 : 80)} 
                  strokeWidth={3} 
                />
              ) : (
                <XCircle 
                  color="#ef4444" 
                  size={isVerySmallDevice ? 50 : (isSmallDevice ? 70 : 80)} 
                  strokeWidth={3} 
                />
              )}
            </Animated.View>
          </View>
          
          <Animated.Text 
            style={{ 
              opacity: successAnim,
              fontSize: isVerySmallDevice ? 24 : 32,
            }}
            className={`font-black mb-4 tracking-tight text-center ${
              success ? 'text-black' : 'text-red-500'
            }`} 
          >
            {success ? 'Check-In Successful' : 'Outside Branch Store'}
          </Animated.Text>
          
          <Animated.Text 
            style={{ 
              opacity: successAnim,
              fontSize: isVerySmallDevice ? 14 : 17,
            }}
            className="text-gray-500 font-semibold text-center px-4 leading-7 mb-4" 
          >
            {success 
              ? 'Your attendance has been successfully recorded for today. Have a great shift!'
              : 'Attendance check-in was rejected by the system due to a distance boundary mismatch.'
            }
          </Animated.Text>

          {success ? (
            /* Success Details Card */
            <Animated.View 
              style={{ opacity: successAnim }}
              className="w-full bg-primary/5 border border-primary/10 rounded-3xl p-5 gap-y-4"
            >
              <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
                <View className="flex-row items-center gap-x-2">
                  <Calendar size={18} color={COLORS.primary} />
                  <Text className="text-gray-500 font-bold text-sm">Date</Text>
                </View>
                <Text className="text-black font-black text-sm">
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>

              <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
                <View className="flex-row items-center gap-x-2">
                  <Clock size={18} color={COLORS.primary} />
                  <Text className="text-gray-500 font-bold text-sm">Check-In Time</Text>
                </View>
                <Text className="text-black font-black text-sm">
                  {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-2">
                  <MapPin size={18} color={COLORS.primary} />
                  <Text className="text-gray-500 font-bold text-sm">Location Status</Text>
                </View>
                <Text className="text-green-600 font-black text-sm">Verified Store Bounds</Text>
              </View>
            </Animated.View>
          ) : (
            /* Failure details Card */
            <Animated.View 
              style={{ opacity: successAnim }}
              className="w-full bg-red-50 border border-red-100 rounded-3xl p-5 gap-y-4"
            >
              <View className="flex-row items-center gap-x-2 border-b border-red-100 pb-3">
                <MapPin size={18} color="#ef4444" />
                <Text className="text-red-500 font-bold text-sm">Location Verification Failed</Text>
              </View>
              <Text className="text-gray-700 font-bold text-center text-[15px] leading-6 px-2">
                {errorMessage || "Attendance marking was blocked because you are outside the geofencing bounds of your assigned branch store."}
              </Text>
            </Animated.View>
          )}

          <Animated.View 
            className="mt-10 w-full px-4" 
            style={{ 
              opacity: successAnim,
              transform: [{
                translateY: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }}
          >
            <TouchableOpacity 
              className={`py-4 rounded-2xl items-center justify-center w-full shadow-lg ${
                success 
                  ? 'bg-primary shadow-green-500/30' 
                  : 'bg-red-500 shadow-red-500/30'
              }`}
              onPress={() => navigation.navigate('Dashboard')}
              activeOpacity={0.8}
            >
              <Text 
                numberOfLines={1}
                style={{ fontSize: isVerySmallDevice ? 16 : 20 }}
                className="text-white font-black"
              >
                Back to Dashboard
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <View className="absolute bottom-10 items-center">
          <Text className="text-gray-400 font-bold tracking-[3px] text-[10px] uppercase">
            Seven Mobiles
          </Text>
          <View className="h-[1.5px] w-6 bg-gray-100 mt-2" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AttendanceSuccessScreen;
