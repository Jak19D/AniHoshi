import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SHA256 from 'crypto-js/sha256';
import { Ionicons } from '@expo/vector-icons';

type LoginFormData = {
    email: string;
    password: string;
};

type User = {
    email: string;
    password: string;
};

const PASSWORD_SALT = 'anihoshi.local.v1';
const hashPassword = (password: string) => SHA256(`${PASSWORD_SALT}:${password}`).toString();
const legacyHashPassword = (password: string) => SHA256(password).toString();

const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha obrigatória'),
});

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
    const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        defaultValues: { email: '', password: '' },
    });
    const email = watch('email');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (data: LoginFormData) => {
        try {
            const existingUsers = await AsyncStorage.getItem('users');
            let users: User[] = [];
            if (existingUsers) {
                try {
                    users = JSON.parse(existingUsers);
                } catch (parseError) {
                    console.error('Erro ao fazer parse dos usuários:', parseError);
                    Alert.alert('Erro', 'Dados corrompidos. Por favor, registre-se novamente.');
                    return;
                }
            }

            const email = data.email.toLowerCase();
            const hashedPassword = hashPassword(data.password);
            const legacyHash = legacyHashPassword(data.password);

            const userIndex = users.findIndex((u: User) => {
                if (u.email !== email) return false;
                return u.password === hashedPassword || u.password === legacyHash;
            });

            if (userIndex >= 0) {
                const user = users[userIndex];
                if (user.password === legacyHash && user.password !== hashedPassword) {
                    users[userIndex] = { ...user, password: hashedPassword };
                    await AsyncStorage.setItem('users', JSON.stringify(users));
                }
                await AsyncStorage.setItem('currentUser', user.email);
                navigation.replace('SplashLogin');
            } else {
                Alert.alert('Erro', 'E-mail ou senha incorretos');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível fazer login');
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/logo2.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.appNameContainer}>
                <Text style={styles.appNameAni}>Ani</Text>
                <Text style={styles.appNameHoshi}>Hoshi</Text>
            </View>

            <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                <TextInput 
                    style={styles.input} 
                    placeholder="exemplo@gmail.com" 
                    placeholderTextColor={COLORS.text.muted} 
                    onChangeText={(text) => onChange(text.toLowerCase())} 
                    value={value} 
                    autoCapitalize="none"
                />
            )} />
            {errors.email && <Text style={styles.error}>{String(errors.email.message)}</Text>}

            <View style={styles.passwordContainer}>
                <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Senha" 
                        secureTextEntry={!showPassword} 
                        placeholderTextColor={COLORS.text.muted} 
                        onChangeText={onChange} 
                        value={value} 
                    />
                )} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={COLORS.text.muted} />
                </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.error}>{String(errors.password.message)}</Text>}

            <TouchableOpacity disabled={!isValid} style={[styles.button, !isValid && styles.buttonDisabled]} onPress={handleSubmit(handleLogin)}>
                <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.linksRow}>
                <TouchableOpacity onPress={() => navigation.navigate('ResetPassword', { email: email ?? '' })}>
                    <Text style={styles.link}>Esqueceu a senha?</Text>
                </TouchableOpacity>
                <Text style={styles.linkSeparator}>|</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}>Cadastre-se</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
        padding: 20,
        justifyContent: 'center'
    },
    logo: {
        width: 350,
        height: 120,
        alignSelf: 'center',
        marginBottom: 10
    },
    appNameContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    appNameAni: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    appNameHoshi: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 2,
    },
    input: {
        backgroundColor: COLORS.surface.primary,
        color: COLORS.text.main,
        padding: 15,
        borderRadius: 25,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: COLORS.text.muted
    },
    passwordContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface.primary,
        borderRadius: 25,
        marginBottom: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.text.muted
    },
    passwordInput: {
        flex: 1,
        color: COLORS.text.main,
        padding: 15,
    },
    eyeIcon: {
        padding: 15,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 15,
        height: 50,
        justifyContent: 'center'
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: {
        color: COLORS.background.primary,
        fontWeight: 'bold',
        fontSize: 16
    },
    link: {
        color: COLORS.text.link,
        textAlign: 'center',
        fontSize: 16
    },
    linksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 10 },
    linkSeparator: { color: COLORS.text.muted, fontSize: 16 },
    error: {
        color: COLORS.error,
        marginBottom: 10,
        marginLeft: 5,
        fontSize: 12
    }
});
