import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  useFonts,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';

// Context Providers
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { ToastProvider } from './src/hooks/useToast';

// Styles
import { colors, typography, shadows } from './src/styles/theme';

// Screens
import { LoginScreen, RegisterScreen } from './src/screens/AuthScreens';
import DashboardScreen from './src/screens/DashboardScreen';
import WardrobeCollectionScreen from './src/screens/WardrobeCollectionScreen';
import LooksScreen from './src/screens/LooksScreen';
import TipsScreen from './src/screens/TipsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'wardrobe', 'accessories', 'looks', 'tips', 'profile'

  if (authLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashBrand}>AURA</Text>
        <ActivityIndicator size="large" color={colors.roseDeep} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // ── Protected routing ──
  if (!user) {
    return authScreen === 'login' ? (
      <LoginScreen
        onSwitch={() => setAuthScreen('register')}
        onLoginSuccess={() => setActiveTab('dashboard')}
      />
    ) : (
      <RegisterScreen onSwitch={() => setAuthScreen('login')} />
    );
  }

  // Render current tab screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen navigateTo={setActiveTab} />;
      case 'wardrobe':
        return (
          <WardrobeCollectionScreen
            kind="wardrobe"
            pageTag="Гардероб"
            title={
              <Text>
                Мой <Text style={styles.titleItalic}>гардероб</Text>
              </Text>
            }
            subtitle="Храни основные вещи, фильтруй по категориям и быстро собирай образы."
          />
        );
      case 'accessories':
        return (
          <WardrobeCollectionScreen
            kind="accessories"
            pageTag="Аксессуары"
            title={
              <Text>
                Мои <Text style={styles.titleItalic}>аксессуары</Text>
              </Text>
            }
            subtitle="Украшения, часы, ремни и очки теперь живут в отдельном разделе."
          />
        );
      case 'looks':
        return <LooksScreen />;
      case 'tips':
        return <TipsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen navigateTo={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.protectedContainer}>
      <ExpoStatusBar style="dark" />
      <View style={styles.mainContent}>{renderScreen()}</View>

      {/* Premium Bottom Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={styles.tabIcon}>✨</Text>
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Главная</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'wardrobe' && styles.tabItemActive]}
          onPress={() => setActiveTab('wardrobe')}
        >
          <Text style={styles.tabIcon}>👗</Text>
          <Text style={[styles.tabLabel, activeTab === 'wardrobe' && styles.tabLabelActive]}>Вещи</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'accessories' && styles.tabItemActive]}
          onPress={() => setActiveTab('accessories')}
        >
          <Text style={styles.tabIcon}>👜</Text>
          <Text style={[styles.tabLabel, activeTab === 'accessories' && styles.tabLabelActive]}>Декор</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'looks' && styles.tabItemActive]}
          onPress={() => setActiveTab('looks')}
        >
          <Text style={styles.tabIcon}>🗂️</Text>
          <Text style={[styles.tabLabel, activeTab === 'looks' && styles.tabLabelActive]}>Образы</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tips' && styles.tabItemActive]}
          onPress={() => setActiveTab('tips')}
        >
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[styles.tabLabel, activeTab === 'tips' && styles.tabLabelActive]}>Чат</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Профиль</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    CormorantGaramond_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashBrand}>AURA</Text>
        <ActivityIndicator size="small" color={colors.roseDeep} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ToastProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ToastProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  splashBrand: {
    fontSize: 54,
    fontFamily: 'CormorantGaramond_700Bold',
    color: colors.roseDeep,
    letterSpacing: 12,
  },
  protectedContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  titleItalic: {
    fontFamily: 'CormorantGaramond_600SemiBold_Italic',
    fontStyle: 'italic',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shadows.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: colors.blush,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.roseDeep,
    fontWeight: '700',
  },
});
