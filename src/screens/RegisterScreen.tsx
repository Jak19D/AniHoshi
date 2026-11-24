import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { getAuthErrorMessage, registerWithEmail } from '../services/authService';
import LegalConsent from '../components/LegalConsent';

type RegisterFormData = {
    email: string;
    password: string;
    confirmPassword: string;
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [legalAccepted, setLegalAccepted] = useState(false);

    const handleRegister = async (data: RegisterFormData) => {
        setIsSubmitting(true);
        try {
            const { session } = await registerWithEmail(data.email, data.password);
            if (session) {
                Alert.alert('Conta criada', 'Sua conta foi criada com sucesso.');
                navigation.replace('SplashLogin');
            } else {
                Alert.alert('Confirme seu e-mail', 'Enviamos um link de confirmação. Confirme seu e-mail para entrar.');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Não foi possível criar a conta', getAuthErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

            <LegalConsent accepted={legalAccepted} onAcceptedChange={setLegalAccepted} />

            <TouchableOpacity disabled={!isValid || !legalAccepted || isSubmitting} style={[styles.button, (!isValid || !legalAccepted || isSubmitting) && styles.buttonDisabled]} onPress={handleSubmit(handleRegister)}>
                <Text style={styles.buttonText}>{isSubmitting ? 'Criando conta...' : 'Cadastrar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Voltar para o Login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: COLORS.background.primary, padding: 20, justifyContent: 'center' },
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
