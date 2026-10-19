import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import { getAnimeArtwork, getMalRating } from '../services/animeArtwork';
import { loadAnimeRating, saveAnimeRating } from '../utils/animeRatings';

type Props = NativeStackScreenProps<RootStackParamList, 'AnimeRating'>;

export default function AnimeRatingScreen({ route, navigation }: Props) {
    const { animeTitle, rating: fallbackRating = 0, count: fallbackCount = 0 } = route.params;
    const [myRating, setMyRating] = useState(0);
    const [appAverage, setAppAverage] = useState<number | null>(null);
    const [appCount, setAppCount] = useState(0);
    const [malRating, setMalRating] = useState<{ score: number; count: number } | null>(null);

    useEffect(() => {
        let active = true;
        Promise.all([loadAnimeRating(animeTitle), getAnimeArtwork(animeTitle)])
            .then(async ([local, artwork]) => {
                if (!active) return;
                setMyRating(local.mine);
                setAppAverage(local.average);
                setAppCount(local.count);
                const external = await getMalRating(artwork?.malId ?? null);
                if (active && external) setMalRating({ score: external.score, count: external.count });
            })
            .catch(() => {});
        return () => { active = false; };
    }, [animeTitle]);

    const score = appAverage ?? (malRating?.score ? malRating.score / 2 : fallbackRating);
    const count = appAverage !== null ? appCount : (malRating?.count ?? fallbackCount);

    const submitRating = async (value: number) => {
        try {
            const result = await saveAnimeRating(animeTitle, value);
            setMyRating(value);
            setAppAverage(result.average);
            setAppCount(result.count);
        } catch (error: any) {
            if (error?.message === 'NOT_LOGGED_IN') {
                Alert.alert('Entre na sua conta', 'Faça login para avaliar este anime.');
                return;
            }
            Alert.alert('Erro', 'Não foi possível salvar sua avaliação.');
        }
    };

    return (
        <View style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Voltar">
                        <Ionicons name="arrow-back" size={24} color={COLORS.text.main} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Avaliação</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.ratingSummary}>
                    <Text style={styles.title}>{animeTitle}</Text>
                    <View style={styles.scoreRow}>
                        <Ionicons name="star" size={24} color={COLORS.primary} />
                        <Text style={styles.score}>{score ? score.toFixed(1) : '—'}</Text>
                        <Text style={styles.count}>{count ? `(${count.toLocaleString('pt-BR')})` : '(sem avaliações)'}</Text>
                    </View>
                    <Text style={styles.source}>{appAverage !== null ? 'Média das avaliações no AniHoshi' : 'Nota inicial do MyAnimeList'}</Text>
                </View>

                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Sua avaliação</Text>
                <Text style={styles.hint}>Toque em uma estrela. Você pode alterar sua nota quando quiser.</Text>
                <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <TouchableOpacity key={value} onPress={() => submitRating(value)} style={styles.starButton} accessibilityRole="button" accessibilityLabel={`${value} estrelas`}>
                            <Ionicons name={value <= myRating ? 'star' : 'star-outline'} size={40} color={value <= myRating ? COLORS.primary : COLORS.text.muted} />
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.myRating}>{myRating ? `Sua nota: ${myRating} de 5` : 'Ainda não avaliado'}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background.primary },
    content: { paddingHorizontal: 22, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54, paddingBottom: 26 },
    backButton: { width: 44, height: 44, justifyContent: 'center' },
    headerTitle: { color: COLORS.text.main, fontSize: 18, fontWeight: '700' },
    headerSpacer: { width: 44 },
    ratingSummary: { alignItems: 'center', paddingVertical: 28 },
    title: { color: COLORS.text.main, fontSize: 25, fontWeight: '700', textAlign: 'center', marginBottom: 18 },
    scoreRow: { flexDirection: 'row', alignItems: 'center' },
    score: { color: COLORS.primary, fontSize: 25, fontWeight: '700', marginLeft: 8 },
    count: { color: COLORS.text.muted, fontSize: 14, marginLeft: 7 },
    source: { color: COLORS.text.muted, fontSize: 13, marginTop: 8 },
    divider: { height: 1, backgroundColor: COLORS.surface.primary, marginVertical: 18 },
    sectionTitle: { color: COLORS.text.main, fontSize: 20, fontWeight: '700', marginTop: 8 },
    hint: { color: COLORS.text.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
    stars: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    starButton: { paddingHorizontal: 5, paddingVertical: 8 },
    myRating: { color: COLORS.primary, textAlign: 'center', fontSize: 15, marginTop: 12 },
});
