import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { deleteLocalAccountData } from '../utils/accountData';

type User = {
    email: string;
    password: string;
};

type Props = {
    navigation?: NavigationProp<MainTabParamList>;
};

export function ProfileScreen({navigation: tabNavigation}: Props) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deleteEmailConfirmation, setDeleteEmailConfirmation] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const syncTabAvatar = (imageUri: string) => {
        tabNavigation?.setOptions({
            tabBarIcon: ({ size, focused }: { size: number; focused: boolean }) => (
                <Image
                    source={{ uri: imageUri }}
                    style={{
                        width: size + 4,
                        height: size + 4,
                        borderRadius: (size + 4) / 2,
                        borderWidth: focused ? 2 : 0,
                        borderColor: COLORS.primary,
                    }}
                />
            ),
        });
    };

    useFocusEffect(useCallback(() => {
        void loadUserData();
    }, []));

    const loadUserData = async () => {
        try {
            const currentUserEmail = await AsyncStorage.getItem('currentUser');
            if (currentUserEmail) {
                const avatarRestoreKey = `profileImageDefaultRestored_${currentUserEmail}`;
                const avatarWasRestored = await AsyncStorage.getItem(avatarRestoreKey);
                if (!avatarWasRestored) {
                    await AsyncStorage.removeItem(`profileImage_${currentUserEmail}`);
                    await AsyncStorage.setItem(avatarRestoreKey, 'true');
                }
                const existingUsers = await AsyncStorage.getItem('users');
                if (existingUsers) {
                    const users: User[] = JSON.parse(existingUsers);
                    const user = users.find((u: User) => u.email === currentUserEmail);
                    if (user) {
                        setEmail(user.email);
                    }
                }
                const userName = await AsyncStorage.getItem(`userName_${currentUserEmail}`);
                setName(userName ?? '');
                const savedProfileImage = await AsyncStorage.getItem(`profileImage_${currentUserEmail}`);
                setProfileImage(savedProfileImage);
                const savedCoverImage = await AsyncStorage.getItem(`coverImage_${currentUserEmail}`);
                setCoverImage(savedCoverImage);
            } else {
                setEmail('');
                setName('');
                setProfileImage(null);
                setCoverImage(null);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('currentUser');
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const confirmLogout = () => Alert.alert('Sair da conta', 'Deseja realmente sair?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => { void handleLogout(); } },
    ]);

    const handleDeleteAccount = async () => {
        if (!email || deleteEmailConfirmation.trim().toLowerCase() !== email.toLowerCase()) return;
        setIsDeletingAccount(true);
        try {
            await deleteLocalAccountData(email);
            setShowDeleteAccount(false);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            Alert.alert('Não foi possível excluir a conta', 'Tente novamente. Seus dados não foram removidos por completo.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleSaveName = async () => {
        try {
            const currentUserEmail = await AsyncStorage.getItem('currentUser');
            if (currentUserEmail) {
                await AsyncStorage.setItem(`userName_${currentUserEmail}`, name);
                setIsEditingName(false);
            }
        } catch (error) {
            console.error('Erro ao salvar nome:', error);
        }
    };

    const pickProfileImage = async () => {
        Alert.alert(
            'Alterar Foto de Perfil',
            'Escolha uma opção:',
            [
                {
                    text: 'Câmera',
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar a câmera');
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ['images'],
                                allowsEditing: true,
                                aspect: [1, 1],
                                quality: 1,
                            });
                            if (!result.canceled && result.assets[0]) {
                                const currentUserEmail = await AsyncStorage.getItem('currentUser');
                                if (currentUserEmail) {
                                    await AsyncStorage.setItem(`profileImage_${currentUserEmail}`, result.assets[0].uri);
                                    setProfileImage(result.assets[0].uri);
                                    syncTabAvatar(result.assets[0].uri);
                                }
                            }
                        } catch (error) {
                            console.error('Erro ao tirar foto:', error);
                            Alert.alert('Erro', 'Não foi possível tirar a foto');
                        }
                    }
                },
                {
                    text: 'Galeria',
                    onPress: async () => {
                        try {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ['images'],
                                allowsEditing: true,
                                aspect: [1, 1],
                                quality: 1,
                            });
                            if (!result.canceled && result.assets[0]) {
                                const currentUserEmail = await AsyncStorage.getItem('currentUser');
                                if (currentUserEmail) {
                                    await AsyncStorage.setItem(`profileImage_${currentUserEmail}`, result.assets[0].uri);
                                    setProfileImage(result.assets[0].uri);
                                    syncTabAvatar(result.assets[0].uri);
                                }
                            }
                        } catch (error) {
                            console.error('Erro ao selecionar imagem:', error);
                            Alert.alert('Erro', 'Não foi possível selecionar a imagem');
                        }
                    }
                },
                {
                    text: 'Cancelar',
                    style: 'cancel'
                }
            ]
        );
    };

    const pickCoverImage = async () => {
        Alert.alert(
            'Alterar Foto de Capa',
            'Escolha uma opção:',
            [
                {
                    text: 'Câmera',
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar a câmera');
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ['images'],
                                allowsEditing: true,
                                aspect: [16, 9],
                                quality: 1,
                            });
                            if (!result.canceled && result.assets[0]) {
                                const currentUserEmail = await AsyncStorage.getItem('currentUser');
                                if (currentUserEmail) {
                                    await AsyncStorage.setItem(`coverImage_${currentUserEmail}`, result.assets[0].uri);
                                    setCoverImage(result.assets[0].uri);
                                }
                            }
                        } catch (error) {
                            console.error('Erro ao tirar foto:', error);
                            Alert.alert('Erro', 'Não foi possível tirar a foto');
                        }
                    }
                },
                {
                    text: 'Galeria',
                    onPress: async () => {
                        try {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ['images'],
                                allowsEditing: true,
                                aspect: [16, 9],
                                quality: 1,
                            });
                            if (!result.canceled && result.assets[0]) {
                                const currentUserEmail = await AsyncStorage.getItem('currentUser');
                                if (currentUserEmail) {
                                    await AsyncStorage.setItem(`coverImage_${currentUserEmail}`, result.assets[0].uri);
                                    setCoverImage(result.assets[0].uri);
                                }
                            }
                        } catch (error) {
                            console.error('Erro ao selecionar imagem:', error);
                            Alert.alert('Erro', 'Não foi possível selecionar a imagem');
                        }
                    }
                },
                {
                    text: 'Cancelar',
                    style: 'cancel'
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={pickCoverImage} style={styles.coverImageContainer}>
                    <Image
                        source={coverImage ? { uri: coverImage } : {uri: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&q=80'}}
                        style={styles.coverImage}
                    />
                    <View pointerEvents="none" style={styles.coverShade} />
                    <View style={styles.editCoverIcon}>
                        <Ionicons name="camera" size={20} color={COLORS.text.main} />
                    </View>
                </TouchableOpacity>
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickProfileImage}>
                        <Image
                            source={profileImage ? { uri: profileImage } : require('../../assets/icon.png')}
                            style={styles.avatar}
                        />
                        <View style={styles.editAvatarIcon}>
                            <Ionicons name="camera" size={16} color={COLORS.text.main} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.nameContainer}>
                    <Text style={styles.label}>Nome de Exibição (opcional)</Text>
                    <View style={styles.nameInputContainer}>
                        <TextInput 
                            accessibilityLabel="Nome de exibição"
                            style={[styles.input, styles.nameInput]} 
                            value={name} 
                            onChangeText={setName} 
                            placeholder="Digite seu nome" 
                            placeholderTextColor={COLORS.text.muted}
                            editable={isEditingName}
                        />
                        <TouchableOpacity onPress={() => {
                            if (isEditingName) {
                                handleSaveName();
                            } else {
                                setIsEditingName(true);
                            }
                        }} style={styles.editIcon} accessibilityRole="button" accessibilityLabel={isEditingName ? 'Salvar nome' : 'Editar nome'}>
                            <Ionicons 
                                name={isEditingName ? "checkmark" : "pencil"} 
                                size={20} 
                                color={COLORS.primary} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.label}>E-mail</Text>
                <TextInput accessibilityLabel="E-mail da conta" style={styles.input} value={email} editable={false}/>

                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordContainer}>
                    <TextInput accessibilityLabel="Senha da conta, protegida" style={styles.passwordInput} value="••••••••" editable={false} secureTextEntry />
                </View>

                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sair da conta" style={styles.actionButton} onPress={confirmLogout}>
                    <Ionicons name="log-out" size={20} color={COLORS.text.main}/>
                    <Text style={styles.actionText}>Sair</Text>
                </TouchableOpacity>

                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Excluir conta" style={styles.actionButton} onPress={() => { setDeleteEmailConfirmation(''); setShowDeleteAccount(true); }}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.text.main}/>
                    <Text style={styles.actionText}>Excluir conta</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showDeleteAccount} transparent animationType="fade" onRequestClose={() => setShowDeleteAccount(false)}>
                <KeyboardAvoidingView style={styles.deleteBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.deleteDialog}>
                        <Ionicons name="warning-outline" size={30} color={COLORS.error} />
                        <Text style={styles.deleteTitle}>Excluir conta?</Text>
                        <Text style={styles.deleteDescription}>Esta ação é permanente. Seus dados locais, favoritos e progresso de leitura serão apagados. Digite seu e-mail para confirmar.</Text>
                        <TextInput
                            accessibilityLabel="Digite seu e-mail para confirmar a exclusão"
                            style={styles.deleteInput}
                            value={deleteEmailConfirmation}
                            onChangeText={setDeleteEmailConfirmation}
                            placeholder={email}
                            placeholderTextColor={COLORS.text.muted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isDeletingAccount}
                        />
                        <View style={styles.deleteActions}>
                            <TouchableOpacity style={styles.deleteCancel} onPress={() => setShowDeleteAccount(false)} disabled={isDeletingAccount}>
                                <Text style={styles.deleteCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Confirmar exclusão permanente da conta"
                                style={[styles.deleteConfirm, (deleteEmailConfirmation.trim().toLowerCase() !== email.toLowerCase() || isDeletingAccount) && styles.deleteConfirmDisabled]}
                                onPress={() => { void handleDeleteAccount(); }}
                                disabled={deleteEmailConfirmation.trim().toLowerCase() !== email.toLowerCase() || isDeletingAccount}
                            >
                                <Text style={styles.deleteConfirmText}>{isDeletingAccount ? 'Excluindo…' : 'Excluir conta'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background.primary },
    header: { alignItems: 'center', marginBottom: 0 },
    coverImageContainer: { width: '100%', height: 250 },
    coverImage: { width: '100%', height: 250 },
    coverShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 15, 29, 0.28)' },
    editCoverIcon: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },
    avatarContainer: { position: 'absolute', bottom: 75, zIndex: 2 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: COLORS.background.primary },
    editAvatarIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 6,
    },
    formContainer: { paddingHorizontal: 20, paddingTop: 4 },
    nameContainer: { marginBottom: 22 },
    nameInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameInput: { flex: 1, marginRight: 10 },
    editIcon: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface.primary,
        padding: 10,
        borderRadius: 8,
    },
    label: { color: COLORS.text.muted, fontSize: 12, marginBottom: 5 },
    input: { backgroundColor: COLORS.surface.primary, color: COLORS.text.main, padding: 15, borderRadius: 8, marginBottom: 15 },
    passwordContainer: { flexDirection: 'row', backgroundColor: COLORS.surface.primary, borderRadius: 8, alignItems: 'center', paddingRight: 8, marginBottom: 8 },
    passwordInput: { flex: 1, color: COLORS.text.main, padding: 15 },
    actionButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface.secondary, padding: 15, borderRadius: 8, marginBottom: 10 },
    actionChevron: { marginLeft: 'auto' },
    actionText: { color: COLORS.text.main, marginLeft: 10, fontSize: 16 },
    deleteBackdrop: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(0,0,0,0.72)' },
    deleteDialog: { alignItems: 'center', backgroundColor: COLORS.background.secondary, borderWidth: 1, borderColor: COLORS.surface.primary, borderRadius: 18, padding: 22 },
    deleteTitle: { color: COLORS.text.main, fontSize: 21, fontWeight: 'bold', marginTop: 10 },
    deleteDescription: { color: COLORS.text.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 10 },
    deleteInput: { width: '100%', backgroundColor: COLORS.surface.primary, color: COLORS.text.main, padding: 14, borderRadius: 10, marginTop: 18 },
    deleteActions: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
    deleteCancel: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 12 },
    deleteCancelText: { color: COLORS.text.main, fontWeight: '600' },
    deleteConfirm: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 10, backgroundColor: COLORS.danger },
    deleteConfirmDisabled: { opacity: 0.45 },
    deleteConfirmText: { color: COLORS.text.main, fontWeight: 'bold' },
});
