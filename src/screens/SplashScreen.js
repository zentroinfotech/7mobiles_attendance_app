import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  Animated, 
  Dimensions, 
  StatusBar,
  Text,
  StyleSheet
} from 'react-native';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Elegant fade-in and subtle scale-up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Transition to main app after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>ATTENDANCE SYSTEM</Text>
          <View style={styles.underline} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.6, // Prominent center at 60% width
    height: 180,
    // No shadows, boxes, or rounded containers as requested
  },
  textContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  title: {
    color: '#D0D0D0',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 10, // Wide letter spacing (8-12px range)
    textAlign: 'center',
  },
  underline: {
    height: 1,
    width: 60,
    backgroundColor: '#DFF5E8', // Mint-green line
    marginTop: 15,
  },
});

export default SplashScreen;
