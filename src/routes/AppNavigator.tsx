import React, { useState, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DesignSystemScreen from '../screens/DesignSystemScreen';
import SplashLoginScreen from '../screens/SplashLoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MangasScreen from '../screens/MangasScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import AnimeDetailScreen from '../screens/AnimeDetailScreen';
import AnimeSeasonsScreen from '../screens/AnimeSeasonsScreen';
import AnimeRatingScreen from '../screens/AnimeRatingScreen';
import CategoryScreen from '../screens/CategoryScreen';
import MangaDetailsScreen from '../screens/MangaDetailsScreen';
import MangaReaderScreen from '../screens/MangaReaderScreen';
import AnimePlayerScreen from '../screens/AnimePlayerScreen';
import { RootStackParamList, MainTabParamList } from './types';
import { COLORS } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    const [profileImage, setProfileImage] = useState<string | null>(null);

    const loadProfileImage = useCallback(async () => {
        try {
            const currentUserEmail = await AsyncStorage.getItem('currentUser');
            if (currentUserEmail) {
                const savedProfileImage = await AsyncStorage.getItem(`profileImage_${currentUserEmail}`);
                setProfileImage(savedProfileImage);
            } else {
                setProfileImage(null);
            }
        } catch (error) {
            console.error('Erro ao carregar imagem de perfil:', error);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        void loadProfileImage();
    }, [loadProfileImage]));

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: { backgroundColor: COLORS.background.primary, borderTopColor: COLORS.surface.primary },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.text.muted,
                tabBarIcon: ({ color, size, focused }) => {
                    if (route.name === 'Profile') {
                        if (profileImage) {
                            return (
                                <Image 
                                    source={{ uri: profileImage }} 
                                    style={{ 
                                        width: size + 4, 
                                        height: size + 4, 
                                        borderRadius: (size + 4) / 2,
                                        borderWidth: focused ? 2 : 0,
                                        borderColor: COLORS.primary,
                                    }} 
                                />
                            );
                        }
                        return <Image
                            source={require('../../assets/icon.png')}
                            style={{
                                width: size + 4,
                                height: size + 4,
                                borderRadius: (size + 4) / 2,
                                borderWidth: focused ? 2 : 0,
                                borderColor: COLORS.primary,
                            }}
                        />;
                    }
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';
                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'Search') iconName = 'search';
                    else if (route.name === 'Mangas') iconName = 'book';
                    else if (route.name === 'Favorites') iconName = 'star';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ tabBarLabel: 'Início' }}
                listeners={{
                    focus: () => loadProfileImage(),
                }}
            />
            <Tab.Screen 
                name="Search" 
                component={SearchScreen} 
                options={{ tabBarLabel: 'Explorar' }}
                listeners={{
                    focus: () => loadProfileImage(),
                }}
            />
            <Tab.Screen 
                name="Mangas" 
                component={MangasScreen} 
                options={{ tabBarLabel: 'Mangás' }}
                listeners={{
                    focus: () => loadProfileImage(),
                }}
            />
            <Tab.Screen 
                name="Favorites" 
                component={FavoritesScreen} 
                options={{ tabBarLabel: 'Favoritos' }}
                listeners={{
                    focus: () => loadProfileImage(),
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ tabBarLabel: 'Perfil' }}
                listeners={{
                    focus: () => loadProfileImage(),
                    blur: () => loadProfileImage(),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="DesignSystem" component={DesignSystemScreen} />
            <Stack.Screen name="SplashLogin" component={SplashLoginScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AnimeDetail" component={AnimeDetailScreen} />
            <Stack.Screen name="AnimeSeasons" component={AnimeSeasonsScreen} />
            <Stack.Screen name="AnimeRating" component={AnimeRatingScreen} />
            <Stack.Screen name="AnimePlayer" component={AnimePlayerScreen} />
            <Stack.Screen name="MangaDetail" component={MangaDetailsScreen} />
            <Stack.Screen name="MangaReader" component={MangaReaderScreen} />
            <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
        </Stack.Navigator>
    );
}
