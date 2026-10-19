import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';
import { RootStackParamList } from '../routes/types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'DesignSystem'> };

const palette = [
    { name: 'Fundo principal', hex: COLORS.background.primary },
    { name: 'Fundo secundário', hex: COLORS.background.secondary },
    { name: 'Superfície principal', hex: COLORS.surface.primary },
    { name: 'Superfície secundária', hex: COLORS.surface.secondary },
    { name: 'Primária / sucesso', hex: COLORS.primary },
    { name: 'Primária em destaque', hex: COLORS.primaryHover },
    { name: 'Acento', hex: COLORS.accent },
    { name: 'Texto principal', hex: COLORS.text.main },
    { name: 'Texto secundário', hex: COLORS.text.muted },
    { name: 'Link', hex: COLORS.text.link },
    { name: 'Erro', hex: COLORS.error },
    { name: 'Erro crítico', hex: COLORS.danger },
    { name: 'Preto', hex: '#000000' },
];

const categoryColors = [
    '#455A64', '#689F38', '#D84315', '#283593', '#E65100', '#1565C0',
    '#AD1457', '#C2185B', '#7B1FA2', '#37474F', '#4E342E',
];

const overlays = [
    '#00000000', '#0000004D', '#00000066', '#00000080', '#000000B3', '#000000E6', '#000000EB', '#000000F2',
    '#0A0F1DCC', '#0A0F1DE6', '#0A0F1DFF', '#FFFFFF0D', '#FFFFFF1A', '#FFFFFF4D',
];

const features = [
    'Login e cadastro com validação de e-mail e senha',
    'Recuperação local de senha e confirmação',
    'Home com carrossel, busca e favoritos',
    'Pesquisa de animes e mangás por categorias',
    'Detalhes de anime e mangá com abas e capítulos',
    'Listas de favoritos separadas por conta',
    'Perfil com nome, foto e capa editáveis',
    'Navegação inferior: Início, Explorar, Mangás, Favoritos e Perfil',
];

export default function DesignSystemScreen({ navigation }: Props) {
    const [isPressed, setIsPressed] = useState(false);
    const [sampleValue, setSampleValue] = useState('ana@');
    const [showFieldError, setShowFieldError] = useState(true);
    const [isFieldFocused, setIsFieldFocused] = useState(false);
    const [feedback, setFeedback] = useState('');
    const hasFieldError = showFieldError && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sampleValue);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.topBar}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Voltar ao perfil"
                    style={styles.backButton}
                    onPress={() => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else navigation.navigate('Main');
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.text.main} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Design System</Text>
            </View>

            <Text style={styles.title}>AniHoshi</Text>
            <Text style={styles.description}>
                Referência visual dos tokens e controles usados no aplicativo. Contrastes abaixo seguem a referência WCAG 2.0 AA para texto normal (4,5:1); alvos desta biblioteca têm pelo menos 48 × 48 dp.
            </Text>

            <Section title="Cores da interface">
                {palette.map((color) => (
                    <View key={color.name} style={styles.swatchRow}>
                        <View style={[styles.swatch, { backgroundColor: color.hex }]} />
                        <Text style={styles.swatchName}>{color.name}</Text>
                        <Text style={styles.hex}>{color.hex}</Text>
                    </View>
                ))}
                <Text style={styles.subheading}>Categorias de busca</Text>
                <View style={styles.categoryGrid}>
                    {categoryColors.map((color) => <View key={color} style={[styles.categorySwatch, { backgroundColor: color }]} />)}
                </View>
                <Text style={styles.caption}>Cores de categoria usadas em SearchScreen; texto branco sobre cada categoria deve ser conferido antes de reutilizar.</Text>
                <Text style={styles.subheading}>Sobreposições · HEX RRGGBBAA</Text>
                <View style={styles.categoryGrid}>
                    {overlays.map((color) => <View key={color} style={[styles.categorySwatch, { backgroundColor: color }]} />)}
                </View>
                <Text style={styles.caption}>Camadas transparentes presentes em gradientes, cartões e overlays.</Text>
            </Section>

            <Section title="Contraste medido">
                <ContrastLine label="Texto #FFFFFF sobre fundo #0A0F1D" value="19,11:1 — passa" />
                <ContrastLine label="Texto #A0AEC0 sobre fundo #0A0F1D" value="8,47:1 — passa" />
                <ContrastLine label="Primária #FBC02D sobre fundo #0A0F1D" value="11,54:1 — passa" />
                <ContrastLine label="Erro #FF5252 sobre campo #1E1B4B" value="5,01:1 — passa" />
                <Text style={styles.caption}>A razão depende da combinação de cores. Não aplique a cor de erro sobre a superfície #2A2550 para texto pequeno: contraste de aproximadamente 4,45:1.</Text>
            </Section>

            <Section title="Tipografia e espaçamento">
                <Text style={styles.type32}>Título de marca · 32</Text>
                <Text style={styles.type28}>Título de tela · 28</Text>
                <Text style={styles.type20}>Subtítulo · 20</Text>
                <Text style={styles.type16}>Texto e botão · 16</Text>
                <Text style={styles.type14}>Texto auxiliar · 14</Text>
                <Text style={styles.type12}>Rótulo · 12</Text>
                <Text style={styles.caption}>O app usa a fonte nativa do sistema. Escala observada no código: 9–32 sp. Recomenda-se elevar metadados menores que 12 sp.</Text>
                <Text style={styles.subheading}>Espaçamentos de referência</Text>
                <Text style={styles.body}>4 · 8 · 12 · 16 · 20 · 24 · 32 dp</Text>
                <Text style={styles.body}>Bordas mais comuns: 8 e 25 dp</Text>
            </Section>

            <Section title="Botões">
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Botão primário de exemplo"
                    accessibilityHint="Mostra o retorno visual do componente"
                    style={[styles.primaryButton, isPressed && styles.primaryButtonPressed]}
                    onPress={() => setFeedback('Ação recebida.')}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                >
                    <Text style={styles.primaryButtonText}>Ação principal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ disabled: true }}
                    disabled
                    style={[styles.primaryButton, styles.disabledButton]}
                >
                    <Text style={styles.primaryButtonText}>Botão indisponível</Text>
                </TouchableOpacity>
                <Text style={styles.caption}>Estados exibidos: padrão, pressionado e desabilitado. Toque no botão ativo para ver o feedback.</Text>
                {!!feedback && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text>}
            </Section>

            <Section title="Campo de formulário e erro">
                <Text style={styles.fieldLabel}>E-mail</Text>
                <TextInput
                    accessibilityLabel="Exemplo de campo de e-mail inválido"
                    accessibilityHint={hasFieldError ? 'Formato inválido. Digite um endereço como nome@dominio.com' : 'Digite seu e-mail'}
                    style={[styles.input, isFieldFocused && styles.inputFocused, hasFieldError && styles.inputError]}
                    value={sampleValue}
                    onChangeText={setSampleValue}
                    onFocus={() => setIsFieldFocused(true)}
                    onBlur={() => setIsFieldFocused(false)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                {hasFieldError && <Text accessibilityLiveRegion="polite" style={styles.errorText}>E-mail inválido. Exemplo: nome@dominio.com</Text>}
                <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                    onPress={() => setShowFieldError((visible) => !visible)}
                >
                    <Text style={styles.secondaryButtonText}>{showFieldError ? 'Ocultar exemplo de erro' : 'Mostrar exemplo de erro'}</Text>
                </TouchableOpacity>
                <Text style={styles.subheading}>Validação de senha do app</Text>
                <Text style={styles.body}>Mínimo de 6 caracteres, uma letra maiúscula e um número. A confirmação precisa coincidir com a senha.</Text>
            </Section>

            <Section title="Carregamento e feedback">
                <View style={styles.loadingSample}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.body}>Carregando tela ou conteúdo</Text>
                </View>
                <View style={styles.stateSample}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                    <Text style={styles.successText}>Ação concluída</Text>
                </View>
                <View style={styles.stateSample}>
                    <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                    <Text style={styles.errorText}>Mensagem de erro junto ao campo ou ação</Text>
                </View>
                <Text style={styles.caption}>O splash de entrada também usa o indicador primário durante a transição para o início.</Text>
            </Section>

            <Section title="Fluxos implementados">
                {features.map((feature) => <Text key={feature} style={styles.feature}>•  {feature}</Text>)}
            </Section>

        </ScrollView>
    );
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function ContrastLine({ label, value }: { label: string; value: string }) {
    return <View style={styles.contrastRow}><Text style={styles.body}>{label}</Text><Text style={styles.contrastValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background.primary },
    content: { padding: 20, paddingBottom: 48 },
    topBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface.primary, alignItems: 'center', justifyContent: 'center' },
    topTitle: { color: COLORS.text.main, fontSize: 18, fontWeight: '600', marginLeft: 12 },
    title: { color: COLORS.text.main, fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    description: { color: COLORS.text.muted, fontSize: 14, lineHeight: 21, marginBottom: 16 },
    section: { backgroundColor: COLORS.background.secondary, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.surface.primary },
    sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
    swatchRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.surface.secondary },
    swatch: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, borderColor: COLORS.text.muted },
    swatchName: { flex: 1, color: COLORS.text.main, fontSize: 14, marginLeft: 10 },
    hex: { color: COLORS.text.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
    subheading: { color: COLORS.text.main, fontSize: 15, fontWeight: '600', marginTop: 14, marginBottom: 8 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categorySwatch: { width: 32, height: 32, borderRadius: 8 },
    type32: { color: COLORS.text.main, fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
    type28: { color: COLORS.text.main, fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    type20: { color: COLORS.text.main, fontSize: 20, marginBottom: 8 },
    type16: { color: COLORS.text.main, fontSize: 16, marginBottom: 8 },
    type14: { color: COLORS.text.muted, fontSize: 14, marginBottom: 8 },
    type12: { color: COLORS.text.muted, fontSize: 12, marginBottom: 8 },
    body: { color: COLORS.text.main, fontSize: 14, lineHeight: 21, marginBottom: 6 },
    caption: { color: COLORS.text.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
    contrastRow: { marginBottom: 8 },
    contrastValue: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
    primaryButton: { minHeight: 48, borderRadius: 25, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginBottom: 10 },
    primaryButtonPressed: { backgroundColor: COLORS.primaryHover, transform: [{ scale: 0.99 }] },
    disabledButton: { opacity: 0.4 },
    primaryButtonText: { color: COLORS.background.primary, fontWeight: 'bold', fontSize: 16 },
    secondaryButton: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 8 },
    secondaryButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
    feedback: { color: COLORS.accent, fontSize: 14, marginTop: 8 },
    loadingSample: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
    stateSample: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9 },
    successText: { color: COLORS.accent, fontSize: 14 },
    fieldLabel: { color: COLORS.text.main, fontSize: 14, marginBottom: 6 },
    input: { minHeight: 48, color: COLORS.text.main, backgroundColor: COLORS.surface.primary, borderColor: COLORS.text.muted, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 16 },
    inputError: { borderColor: COLORS.error, borderWidth: 2 },
    inputFocused: { borderColor: COLORS.primary, borderWidth: 2 },
    errorText: { color: COLORS.error, fontSize: 14, marginTop: 6 },
    feature: { color: COLORS.text.main, fontSize: 14, lineHeight: 21, marginBottom: 8 },
});
