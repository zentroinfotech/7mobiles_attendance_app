import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, useWindowDimensions, SafeAreaView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const AttendanceSuccessScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const successAnim = useRef(new Animated.Value(0)).current;
  
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
    // Start success animation
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7
    }).start();

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
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full max-w-[450px] items-center">
          <View className="items-center justify-center relative w-full h-[200px]">
            {/* Celebration Particles */}
            {particles.map((p, i) => (
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
              className="rounded-full bg-primary/10 justify-center items-center border-4 border-primary/20"
            >
              <CheckCircle 
                color={COLORS.primary} 
                size={isVerySmallDevice ? 50 : (isSmallDevice ? 70 : 80)} 
                strokeWidth={3} 
              />
            </Animated.View>
          </View>
          
          <Animated.Text 
            style={{ 
              opacity: successAnim,
              fontSize: isVerySmallDevice ? 24 : 32,
            }}
            className="text-black font-black mb-4 tracking-tight text-center" 
          >
            Check-In Successful
          </Animated.Text>
          
          <Animated.Text 
            style={{ 
              opacity: successAnim,
              fontSize: isVerySmallDevice ? 14 : 18,
            }}
            className="text-gray-500 font-semibold text-center px-4 leading-7" 
          >
            Your attendance has been successfully recorded for today. Have a great shift!
          </Animated.Text>

          <Animated.View 
            className="mt-12 w-full px-4" 
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
              className="bg-primary py-4 rounded-2xl shadow-lg shadow-green-500/30 items-center justify-center w-full"
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
