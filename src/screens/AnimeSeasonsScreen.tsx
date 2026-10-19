import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AnimeSeasons'>;

export default function AnimeSeasonsScreen({ route, navigation }: Props) {
    const { anime, seasons, selectedSeasonId } = route.params;
    const insets = useSafeAreaInsets();
    const activeId = selectedSeasonId ?? seasons[0]?.id;

    const close = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Main');
    };

    const selectSeason = (seasonId: string) => {
        if (typeof navigation.popTo === 'function') {
            navigation.popTo('AnimeDetail', { anime, selectedSeasonId: seasonId }, { merge: true });
            return;
        }
        navigation.navigate({
            name: 'AnimeDetail',
            params: { anime, selectedSeasonId: seasonId },
            merge: true,
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                    style={styles.closeButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={close}
                >
                    <Ionicons name="close" size={28} color={COLORS.text.main} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Temporadas</Text>
                <View style={styles.headerSpacer} />
            </View>

            <FlatList
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
                data={seasons}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.empty}>Temporadas ainda não disponíveis.</Text>}
                renderItem={({ item }) => {
                    const selected = item.id === activeId;
                    const count = item.episodes.length;
                    return (
                        <TouchableOpacity
                            style={styles.row}
                            activeOpacity={0.7}
                            onPress={() => selectSeason(item.id)}
                        >
                            <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]} numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text style={styles.count}>
                                {count} {count === 1 ? 'Episódio' : 'Episódios'}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#333333',
    },
    closeButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: COLORS.text.main,
        fontSize: 18,
        fontWeight: '700',
        marginRight: 48,
    },
    headerSpacer: { width: 0 },
    list: { paddingHorizontal: 20, paddingTop: 8 },
    row: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        paddingVertical: 14,
    },
    rowTitle: { flex: 1, color: COLORS.text.main, fontSize: 16, fontWeight: '500' },
    rowTitleSelected: { color: COLORS.primary },
    count: { color: '#A9A9A9', fontSize: 14 },
    empty: { color: COLORS.text.muted, fontSize: 15, textAlign: 'center', paddingVertical: 32 },
});
