import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

type Props = {
    accepted: boolean;
    onAcceptedChange: (accepted: boolean) => void;
};

export default function LegalConsent({ accepted, onAcceptedChange }: Props) {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: accepted }}
                    accessibilityLabel="Aceitar os Termos de Uso e confirmar a leitura da Política de Privacidade"
                    style={styles.checkboxButton}
                    onPress={() => onAcceptedChange(!accepted)}
                >
                    <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                        {accepted && <Ionicons name="checkmark" size={16} color={COLORS.background.primary} />}
                    </View>
                </TouchableOpacity>
                <Text style={styles.copy}>
                    Li e aceito os Termos de Uso e confirmo que li a Política de Privacidade.
                </Text>
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={() => setVisible(true)} style={styles.moreButton}>
                <Text style={styles.moreText}>Ver termos e política de privacidade</Text>
            </TouchableOpacity>

            <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
                <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.heading}>Termos e privacidade</Text>
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setVisible(false)}>
                            <Ionicons name="close" size={26} color={COLORS.text.main} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.sectionTitle}>Termos de Uso</Text>
                        <Text style={styles.paragraph}>O AniHoshi oferece recursos de conta, descoberta de títulos, favoritos, avaliações e acompanhamento de leitura e reprodução. A disponibilidade de títulos e arquivos pode mudar ou ficar temporariamente indisponível.</Text>
                        <Text style={styles.paragraph}>Use sua conta de forma pessoal e segura. Não tente contornar controles de acesso, prejudicar o serviço ou enviar conteúdo sem autorização. Os direitos sobre animes, mangás, imagens e demais obras pertencem aos respectivos titulares; o uso do app não transfere esses direitos.</Text>
                        <Text style={styles.paragraph}>O serviço é fornecido conforme sua disponibilidade. Problemas técnicos, manutenção ou indisponibilidade dos provedores de infraestrutura podem interromper temporariamente alguns recursos.</Text>

                        <Text style={styles.sectionTitle}>Política de Privacidade</Text>
                        <Text style={styles.paragraph}>Para operar a conta, o app utiliza seu e-mail e dados de autenticação. Recursos do app podem tratar nome de exibição, imagem de perfil, favoritos, avaliações e progresso de leitura ou reprodução associados à conta.</Text>
                        <Text style={styles.paragraph}>Esses dados são usados para autenticar e proteger a conta e fornecer os recursos solicitados. A infraestrutura de autenticação e banco de dados é fornecida pelo Supabase. O app também pode carregar imagens e mídias hospedadas por terceiros.</Text>
                        <Text style={styles.paragraph}>Você pode solicitar acesso, correção ou exclusão dos dados pessoais, bem como exercer os demais direitos previstos na LGPD. O perfil do app oferece uma opção para excluir a conta. Alguns registros podem ser mantidos quando houver obrigação legal ou necessidade de resguardar direitos.</Text>
                        <Text style={styles.paragraph}>Os dados são mantidos pelo tempo necessário para operar a conta e cumprir obrigações aplicáveis. A política deve ser atualizada se mudarem os dados tratados, os serviços usados, os prazos ou as finalidades.</Text>
                        <Text style={styles.pending}>Demonstração para testes: AniHoshi é uma empresa fictícia. Contato ilustrativo: privacidade@anihoshi.example. Este endereço não é monitorado.</Text>

                        <Text style={styles.footer}>Ao marcar a caixa, você aceita os Termos de Uso e confirma que teve acesso à Política de Privacidade. A caixa não representa autorização genérica para finalidades opcionais.</Text>
                        <Text style={styles.footer}>Este conteúdo é um modelo de interface para testes e não substitui revisão jurídica. Antes de disponibilizar o app ao público, substitua os dados fictícios e valide os termos e as práticas reais de tratamento.</Text>
                    </ScrollView>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
                        <Text style={styles.closeButtonText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
    checkboxButton: { paddingRight: 10, paddingVertical: 1 },
    checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.text.muted, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    copy: { flex: 1, color: COLORS.text.main, fontSize: 13, lineHeight: 19 },
    moreButton: { alignSelf: 'flex-start', marginTop: 8, marginLeft: 32, paddingVertical: 4 },
    moreText: { color: COLORS.text.link, fontSize: 13, textDecorationLine: 'underline' },
    modal: { flex: 1, backgroundColor: COLORS.background.primary, paddingTop: 54, paddingHorizontal: 20, paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surface.primary },
    heading: { color: COLORS.text.main, fontSize: 21, fontWeight: 'bold' },
    content: { paddingTop: 18, paddingBottom: 24 },
    sectionTitle: { color: COLORS.primary, fontSize: 17, fontWeight: 'bold', marginTop: 14, marginBottom: 8 },
    paragraph: { color: COLORS.text.main, fontSize: 14, lineHeight: 21, marginBottom: 10 },
    pending: { color: '#FFD166', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 12 },
    footer: { color: COLORS.text.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
    closeButton: { minHeight: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    closeButtonText: { color: COLORS.background.primary, fontWeight: 'bold', fontSize: 15 },
});
