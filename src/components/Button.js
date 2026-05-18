import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/colors';

const Button = ({ title, onPress, loading, variant = 'primary', style, textStyle }) => {
  const isOutline = variant === 'outline';
  
  return (
    <TouchableOpacity 
      className={`min-h-[56px] py-4 rounded-2xl justify-center items-center my-2.5 w-full flex-row ${
        isOutline ? 'bg-transparent border-2 border-primary' : 'bg-primary shadow-lg shadow-green-500/30'
      } ${loading ? 'opacity-60' : ''}`}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? COLORS.primary : COLORS.white} />
      ) : (
        <Text 
          className={`text-base font-bold text-center ${
            isOutline ? 'text-primary' : 'text-white'
          }`}
          style={textStyle}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
