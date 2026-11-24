import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { RootStackParamList } from '../routes/types';
import { exchangePasswordRecoveryCode, getAuthErrorMessage, requestPasswordReset, signOut, updatePassword, verifyPasswordRecoveryCode } from '../services/authService';

type FormData = { email: string; recoveryCode?: string; password?: string; confirmPassword?: string };
type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
    route: RouteProp<RootStackParamList, 'ResetPassword'>;
};

const resetSchema = z.object({
    email: z.string().email('Digite um e-mail válido'),
    recoveryCode: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
});

export default function ResetPasswordScreen({ navigation, route }: Props) {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { control, handleSubmit, setError, setValue, formState: { errors, isValid } } = useForm<FormData>({
        resolver: zodResolver(resetSchema),
        mode: 'onChange',
        defaultValues: { email: route.params?.email ?? '', recoveryCode: '', password: '', confirmPassword: '' },
    });

    useEffect(() => {
        const code = route.params?.code;
        if (!code) return;
        let mounted = true;
        setIsSubmitting(true);
        void exchangePasswordRecoveryCode(code)
            .then(({ user }) => {
                if (!mounted) return;
                if (user.email) setValue('email', user.email);
                setIsRecoveryMode(true);
            })
            .catch((error) => {
                if (mounted) Alert.alert('Link inválido ou expirado', getAuthErrorMessage(error));
            })
            .finally(() => { if (mounted) setIsSubmitting(false); });
        return () => { mounted = false; };
    }, [route.params?.code, setValue]);

    const handleReset = async ({ email, recoveryCode, password, confirmPassword }: FormData) => {
        setIsSubmitting(true);
        try {
            if (!isRecoveryMode && !emailSent) {
                await requestPasswordReset(email);
                setEmailSent(true);
                Alert.alert('E-mail enviado', 'Confira a caixa de entrada e o spam. Digite o código de 8 dígitos ou cole o link do e-mail para continuar.');
                return;
            }

            if (!isRecoveryMode) {
                if (!recoveryCode?.trim()) {
                    setError('recoveryCode', { message: 'Digite o código de 8 dígitos ou cole o link do e-mail.' });
                    return;
                }
                await verifyPasswordRecoveryCode(email, recoveryCode);
                setIsRecoveryMode(true);
                Alert.alert('Código confirmado', 'Agora escolha sua nova senha.');
                return;
            }

            if (!password || password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
                setError('password', { message: 'Use 6 ou mais caracteres, uma letra maiúscula e um número.' });
                return;
            }
            if (password !== confirmPassword) {
                setError('confirmPassword', { message: 'As senhas não coincidem.' });
                return;
            }

            await updatePassword(password);
            await signOut('local');
            Alert.alert('Senha redefinida', 'Sua senha foi alterada com sucesso.');
            navigation.replace('Login');
        } catch (error) {
            Alert.alert('Não foi possível continuar', getAuthErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/logo2.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>{isRecoveryMode ? 'Escolha uma nova senha' : emailSent ? 'Confirme seu e-mail' : 'Redefinir senha'}</Text>
            <Text style={styles.description}>{isRecoveryMode
                ? 'Defina uma senha nova para sua conta.'
                : emailSent
                    ? 'Enviamos um e-mail de recuperação. Digite o código de 8 dígitos ou cole o link completo abaixo.'
                    : 'Enviaremos um código de recuperação para o e-mail da sua conta.'}</Text>

            <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isRecoveryMode && !emailSent}
                    value={value}
                    onChangeText={(text) => onChange(text.toLowerCase())}
                />
            )} />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

            {emailSent && !isRecoveryMode && <>
                <Controller control={control} name="recoveryCode" render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Código ou link do e-mail"
                        placeholderTextColor={COLORS.text.muted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        onChangeText={onChange}
                    />
                )} />
                {errors.recoveryCode && <Text style={styles.error}>{errors.recoveryCode.message}</Text>}
            </>}

            {isRecoveryMode && <>
                <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} placeholder="Digite sua nova senha" placeholderTextColor={COLORS.text.muted} secureTextEntry value={value} onChangeText={onChange} />
                )} />
                {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} placeholder="Confirme sua nova senha" placeholderTextColor={COLORS.text.muted} secureTextEntry value={value} onChangeText={onChange} />
                )} />
                {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}
            </>}

            <TouchableOpacity disabled={!isValid || isSubmitting} style={[styles.button, (!isValid || isSubmitting) && styles.buttonDisabled]} onPress={handleSubmit(handleReset)}>
                <Text style={styles.buttonText}>{isSubmitting ? 'Aguarde...' : isRecoveryMode ? 'Redefinir senha' : emailSent ? 'Validar código' : 'Enviar código'}</Text>
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
    title: { color: COLORS.text.main, fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
    description: { color: COLORS.text.muted, fontSize: 14, marginBottom: 16 },
    input: { backgroundColor: COLORS.surface.primary, color: COLORS.text.main, padding: 15, borderRadius: 25, marginBottom: 12 },
    button: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: COLORS.background.primary, fontWeight: 'bold', fontSize: 16 },
    link: { color: COLORS.text.link, textAlign: 'center', marginTop: 20, fontSize: 16 },
    error: { color: COLORS.error, marginBottom: 10, marginLeft: 5, fontSize: 12 },
});
