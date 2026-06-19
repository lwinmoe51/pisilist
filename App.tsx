import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CardsProvider } from './src/contexts/CardsContext';
import { InvitationsProvider } from './src/contexts/InvitationsContext';
import { setupNotifications } from './src/services/notifications';
import RootNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    setupNotifications();
  }, []);
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <CardsProvider>
            <InvitationsProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </InvitationsProvider>
          </CardsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
