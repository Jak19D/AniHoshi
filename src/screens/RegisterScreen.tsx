import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SHA256 from 'crypto-js/sha256';
import { Ionicons } from '@expo/vector-icons';

type RegisterFormData = {
    email: string;
    password: string;
    confirmPassword: string;
};

type User = {
    email: string;
    password: string;
};

const registerSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'No mínimo 6 caracteres').regex(/[A-Z]/, 'Mínimo 1 letra maiúscula').regex(/[0-9]/, 'Mínimo 1 número'),
    confirmPassword: z.string().min(6, 'No mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: { email: '', password: '', confirmPassword: '' },
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRegister = async (data: RegisterFormData) => {
        try {
            const existingUsers = await AsyncStorage.getItem('users');
            let users: User[] = [];
            if (existingUsers) {
                try {
                    users = JSON.parse(existingUsers);
                } catch (parseError) {
                    console.error('Erro ao fazer parse dos usuários:', parseError);
                    users = [];
                }
            }

            const emailExists = users.some((user: User) => user.email === data.email.toLowerCase());
            if (emailExists) {
                Alert.alert('Erro', 'E-mail já cadastrado');
                return;
            }

            const emailToSave = data.email.toLowerCase();
            const PASSWORD_SALT = 'anihoshi.local.v1';
            const hashedPassword = SHA256(`${PASSWORD_SALT}:${data.password}`).toString();
            users.push({ email: emailToSave, password: hashedPassword });
            await AsyncStorage.setItem('users', JSON.stringify(users));
            Alert.alert('Sucesso', 'Conta criada com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            Alert.alert('Erro', 'Não foi possível criar a conta. Verifique os dados e tente novamente.');
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/logo2.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.appNameContainer}>
                <Text style={styles.appNameAni}>Ani</Text>
                <Text style={styles.appNameHoshi}>Hoshi</Text>
            </View>
            <Text style={styles.title}>Criar Conta</Text>


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
                        placeholder="Senha (6+ carac., 1 maiús., 1 num.)" 
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

            <View style={styles.passwordContainer}>
                <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Confirmar Senha" 
                        secureTextEntry={!showConfirmPassword} 
                        placeholderTextColor={COLORS.text.muted} 
                        onChangeText={onChange} 
                        value={value} 
                    />
                )} />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={COLORS.text.muted} />
                </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.error}>{String(errors.confirmPassword.message)}</Text>}

            <TouchableOpacity disabled={!isValid} style={[styles.button, !isValid && styles.buttonDisabled]} onPress={handleSubmit(handleRegister)}>
                <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Voltar para o Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background.primary, padding: 20, justifyContent: 'center' },
    logo: { width: 280, height: 90, alignSelf: 'center', marginBottom: 10 },
    appNameContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
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
    title: { fontSize: 28, color: COLORS.text.main, fontWeight: 'bold', marginBottom: 30 },
    input: { backgroundColor: COLORS.surface.primary, color: COLORS.text.main, padding: 15, borderRadius: 25, marginBottom: 15 },
    passwordContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface.primary,
        borderRadius: 25,
        marginBottom: 15,
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        color: COLORS.text.main,
        padding: 15,
    },
    eyeIcon: {
        padding: 15,
    },
    button: { backgroundColor: COLORS.success, padding: 15, borderRadius: 25, alignItems: 'center' },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: COLORS.background.primary, fontWeight: 'bold', fontSize: 16 },
    link: { color: COLORS.text.link, textAlign: 'center', marginTop: 20, fontSize: 16 },
    error: { color: COLORS.error, marginBottom: 10, marginLeft: 5 }
});
