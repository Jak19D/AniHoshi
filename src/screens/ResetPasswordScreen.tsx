import React from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SHA256 from 'crypto-js/sha256';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { RootStackParamList } from '../routes/types';

type FormData = { email: string; password: string; confirmPassword: string };
type User = { email: string; password: string };
type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
    route: RouteProp<RootStackParamList, 'ResetPassword'>;
};

const resetSchema = z.object({
    email: z.string().email('Digite um e-mail válido'),
    password: z.string()
        .min(6, 'Use no mínimo 6 caracteres')
        .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
        .regex(/[0-9]/, 'Inclua pelo menos um número'),
    confirmPassword: z.string().min(1, 'Confirme sua nova senha'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

const PASSWORD_SALT = 'anihoshi.local.v1';

export default function ResetPasswordScreen({ navigation, route }: Props) {
    const { control, handleSubmit, formState: { errors, isValid, dirtyFields } } = useForm<FormData>({
        resolver: zodResolver(resetSchema),
        mode: 'onChange',
        defaultValues: { email: route.params.email, password: '', confirmPassword: '' },
    });

    const handleResetPassword = async ({ email, password }: FormData) => {
        try {
            const storedUsers = await AsyncStorage.getItem('users');
            const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
            const normalizedEmail = email.trim().toLowerCase();
            const userIndex = users.findIndex((user) => user.email === normalizedEmail);

            if (userIndex === -1) {
                Alert.alert('E-mail não encontrado', 'Confira o e-mail informado ou crie uma conta.');
                return;
            }

            users[userIndex] = {
                ...users[userIndex],
                password: SHA256(`${PASSWORD_SALT}:${password}`).toString(),
            };
            await AsyncStorage.setItem('users', JSON.stringify(users));
            Alert.alert('Senha redefinida', 'Sua senha foi alterada. Entre com a nova senha.');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            Alert.alert('Erro', 'Não foi possível redefinir sua senha. Tente novamente.');
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/logo2.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Redefinir senha</Text>

            <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={(text) => onChange(text.toLowerCase())}
                />
            )} />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

            <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua nova senha"
                    placeholderTextColor={COLORS.text.muted}
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                />
            )} />
            {dirtyFields.password && errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

            <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => (
                <TextInput
                    style={styles.input}
                    placeholder="Confirme sua nova senha"
                    placeholderTextColor={COLORS.text.muted}
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                />
            )} />
            {dirtyFields.confirmPassword && errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}

            <TouchableOpacity
                disabled={!isValid}
                style={[styles.button, !isValid && styles.buttonDisabled]}
                onPress={handleSubmit(handleResetPassword)}
            >
                <Text style={styles.buttonText}>Redefinir senha</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Voltar para o login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background.primary, padding: 20, justifyContent: 'center' },
    logo: { width: 280, height: 100, alignSelf: 'center', marginBottom: 20 },
    title: { color: COLORS.text.main, fontSize: 26, fontWeight: 'bold', marginBottom: 24 },
    input: { backgroundColor: COLORS.surface.primary, color: COLORS.text.main, padding: 15, borderRadius: 25, marginBottom: 12 },
    button: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: COLORS.background.primary, fontWeight: 'bold', fontSize: 16 },
    link: { color: COLORS.text.link, textAlign: 'center', marginTop: 20, fontSize: 16 },
    error: { color: COLORS.error, marginBottom: 10, marginLeft: 5, fontSize: 12 },
});
