import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/routes/AppNavigator';
import { getPersistedSession } from './src/services/authService';
import { COLORS } from './src/theme/colors';
import { RootStackParamList } from './src/routes/types';

type InitialRoute = keyof RootStackParamList;

export default function App() {
    const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);

    useEffect(() => {
        let mounted = true;
        void getPersistedSession()
            .then(async (session) => {
                if (session?.user.email) await AsyncStorage.setItem('currentUser', session.user.email.toLowerCase());
                else await AsyncStorage.removeItem('currentUser');
                if (mounted) setInitialRoute(session ? 'SplashLogin' : 'Login');
            })
            .catch((error) => {
                console.error('Erro ao restaurar sessão:', error);
                if (mounted) setInitialRoute('Login');
            });
        return () => { mounted = false; };
    }, []);

    return (
        <SafeAreaProvider>
            {initialRoute ? <NavigationContainer linking={{
                prefixes: ['anihoshi://'],
                config: { screens: { ResetPassword: { path: 'reset-password', parse: { code: (value: string) => value } } } },
            }}>
                <StatusBar style="light" />
                <AppNavigator initialRouteName={initialRoute} />
            </NavigationContainer> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background.primary }}>
                <ActivityIndicator color={COLORS.primary} />
            </View>}
        </SafeAreaProvider>
    );
}
