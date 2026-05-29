import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { colors, shadows } from '../styles/theme';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [fadeAnim]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
            toast.type === 'error' ? styles.errorToast : toast.type === 'info' ? styles.infoToast : styles.successToast,
          ]}
        >
          <TouchableOpacity onPress={hideToast} activeOpacity={0.8} style={styles.toastContent}>
            <Text style={styles.toastText}>
              {toast.type === 'error' ? '⚠️ ' : toast.type === 'info' ? 'ℹ️ ' : '✨ '}
              {toast.message}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    zIndex: 9999,
  },
  successToast: {
    backgroundColor: '#4A9C6D',
  },
  errorToast: {
    backgroundColor: '#C94C4C',
  },
  infoToast: {
    backgroundColor: '#8A4F4F',
  },
  toastContent: {
    width: '100%',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    textAlign: 'center',
  },
});
