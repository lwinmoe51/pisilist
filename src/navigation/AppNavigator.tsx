import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import InvitationsScreen from '../screens/InvitationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  CardDetail: { cardId: string };
  Invitations: undefined;
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AppStack.Screen name="Dashboard" component={DashboardScreen} />
      <AppStack.Screen name="CardDetail" component={CardDetailScreen} />
      <AppStack.Screen name="Invitations" component={InvitationsScreen} />
      <AppStack.Screen name="Settings" component={SettingsScreen} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}
