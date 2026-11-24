import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { getAuthErrorMessage, signInWithEmail } from '../services/authService';
import LegalConsent from '../components/LegalConsent';

type LoginFormData = {
    email: string;
    password: string;
};

const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Use no mínimo 6 caracteres'),
});

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
    const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: { email: '', password: '' },
    });
    const email = watch('email');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [legalAccepted, setLegalAccepted] = useState(false);

    const handleLogin = async (data: LoginFormData) => {
        setIsSubmitting(true);
        try {
            await signInWithEmail(data.email, data.password);
            navigation.replace('SplashLogin');
        } catch (error) {
            Alert.alert('Não foi possível entrar', getAuthErrorMessage(error));
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
            <Text style={styles.passwordHint}>A senha deve ter no mínimo 6 caracteres.</Text>
            {errors.password && <Text style={styles.error}>{String(errors.password.message)}</Text>}

            <LegalConsent accepted={legalAccepted} onAcceptedChange={setLegalAccepted} />

            <TouchableOpacity disabled={!isValid || !legalAccepted || isSubmitting} style={[styles.button, (!isValid || !legalAccepted || isSubmitting) && styles.buttonDisabled]} onPress={handleSubmit(handleLogin)}>
                <Text style={styles.buttonText}>{isSubmitting ? 'Entrando...' : 'Entrar'}</Text>
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
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
    },
    passwordHint: { color: COLORS.text.muted, fontSize: 12, marginLeft: 5, marginBottom: 8 },
});
