import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Alert, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { MangaChapter, RootStackParamList } from '../routes/types';
import { loadReadChapters, loadReadingMode, loadReadingProgress, MangaReadingMode, saveReadingMode } from '../utils/readingProgress';
import { mediaRepository } from '../services/mediaRepository';
import { getLocalMangaChapters } from '../services/localMangaChapters';
import { getMangaSynopsis } from '../services/animeArtwork';
import {
    getAnimeKey,
    isAnimeFavorite,
    loadFavoriteKeys,
    toggleFavoriteAnime,
} from '../utils/favorites';

const { width } = Dimensions.get('window');
const SLIME_OFFICIAL_SYNOPSIS = 'Mikami Satoru, funcionário de uma megacorporação, é apunhalado por um assassino nas ruas e renasce num mundo paralelo... Mas ele renasce como um slime! Jogado neste novo mundo com o nome Rimuru, ele assume a missão de criar um mundo que seja acolhedor para todas as raças.';

type MangaItem = {
    id: string;
    title: string;
    image: string;
    author?: string;
    description?: string;
    genre?: string;
    chapters?: string;
    year?: string;
    rating?: string;
};

type RouteParams = {
    manga: MangaItem;
    chapters?: MangaChapter[];
};

type Props = {
    navigation?: NavigationProp<RootStackParamList>;
};

export default function MangaDetailsScreen({ navigation }: Props) {
    const route = useRoute();
    const { manga, chapters: suppliedChapters } = route.params as RouteParams;
    const [activeTab, setActiveTab] = useState<'details' | 'chapters'>('details');
    const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
    const [isFavorite, setIsFavorite] = useState(false);
    const [readChapterIds, setReadChapterIds] = useState<string[]>([]);
    const [readingMode, setReadingMode] = useState<MangaReadingMode>('manga');
    const [hasReadingPreference, setHasReadingPreference] = useState(false);
    const [showReadingModes, setShowReadingModes] = useState(false);
    const [synopsis, setSynopsis] = useState(manga.title.toLowerCase().includes('slime') ? SLIME_OFFICIAL_SYNOPSIS : '');
    const [synopsisLoaded, setSynopsisLoaded] = useState(false);

    useEffect(() => {
        let active = true;
        getMangaSynopsis(manga.title).then((description) => {
            if (!active) return;
            if (!manga.title.toLowerCase().includes('slime') && description) setSynopsis(description);
            setSynopsisLoaded(true);
        });
        return () => { active = false; };
    }, [manga.title]);

    const localChapters = useMemo(
        () => getLocalMangaChapters(manga.title, manga.chapters),
        [manga.chapters, manga.title],
    );
    const [chapters, setChapters] = useState<MangaChapter[]>(
        () => (suppliedChapters?.length ? suppliedChapters : localChapters),
    );

    useEffect(() => {
        let active = true;
        if (suppliedChapters?.length) {
            setChapters(suppliedChapters);
            return () => { active = false; };
        }
        setChapters(localChapters);
        mediaRepository.getMangaChapters(manga.id).then((catalog) => {
            if (active && catalog.length) setChapters(catalog);
        }).catch((error) => console.error('Erro ao carregar capítulos:', error));
        return () => { active = false; };
    }, [localChapters, manga.id, suppliedChapters]);

    const refreshFavorites = useCallback(async () => {
        try {
            const keys = await loadFavoriteKeys();
            setFavoriteKeys(keys);
            setIsFavorite(isAnimeFavorite(keys, manga.title));
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            setFavoriteKeys(new Set());
        }
    }, [manga.title]);

    useEffect(() => {
        refreshFavorites();
    }, [refreshFavorites]);

    useEffect(() => {
        let active = true;
        Promise.all([loadReadChapters(manga.title), loadReadingProgress(manga.title), loadReadingMode(manga.title)]).then(([read, progress, preferredMode]) => {
            if (!active) return;
            setReadChapterIds(read);
            if (preferredMode || progress) {
                setReadingMode(preferredMode ?? progress!.mode);
                setHasReadingPreference(true);
            }
        }).catch((error) => console.error('Erro ao carregar progresso de leitura:', error));
        return () => { active = false; };
    }, [manga.title]);

    const openChapter = (chapter: MangaChapter) => {
        navigation?.navigate('MangaReader', { mangaTitle: manga.title, chapter, chapters });
    };

    const handleRead = async () => {
        const progress = await loadReadingProgress(manga.title);
        const resumeChapter = progress && chapters.find((chapter) => chapter.id === progress.chapterId);
        const firstChapter = chapters.find((chapter) => chapter.number === 0)
            ?? chapters.find((chapter) => chapter.number === 1)
            ?? chapters[0];
        const target = resumeChapter ?? firstChapter;
        if (target) openChapter(target);
        else setActiveTab('chapters');
    };

    const handleReadButton = () => {
        if (!hasReadingPreference) {
            setShowReadingModes(true);
            return;
        }
        void handleRead();
    };

    const startReading = async () => {
        await saveReadingMode(manga.title, readingMode);
        setHasReadingPreference(true);
        setShowReadingModes(false);
        await handleRead();
    };

    const toggleFavorite = async () => {
        try {
            const { isFavorite: newIsFavorite } = await toggleFavoriteAnime({
                ...manga,
                type: 'manga',
            });
            setIsFavorite(newIsFavorite);
            setFavoriteKeys((prev) => {
                const next = new Set(prev);
                const key = getAnimeKey(manga.title);
                if (newIsFavorite) next.add(key);
                else next.delete(key);
                return next;
            });
        } catch (error: any) {
            if (error?.message === 'NOT_LOGGED_IN') {
                Alert.alert('Login', 'Faça login para favoritar mangás');
                return;
            }
            console.error('Erro ao favoritar:', error);
        }
    };

    const genres = manga.genre ? manga.genre.split(',').map(g => g.trim()) : [];



    const renderDetailsTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.coverContainer}>
                <Image source={{ uri: manga.image }} style={styles.coverImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(10, 15, 29, 0.8)', 'rgba(10, 15, 29, 1)']}
                    style={styles.coverGradient}
                />
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>{manga.title}</Text>
                {manga.author && <Text style={styles.author}>{manga.author}</Text>}

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.readButton} onPress={handleReadButton}>
                        <Ionicons name="book" size={20} color={COLORS.background.primary} />
                        <Text style={styles.readButtonText}>Ler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.favoriteButton} onPress={() => setShowReadingModes(true)} accessibilityRole="button" accessibilityLabel="Escolher modo de leitura">
                        <Ionicons name="book-outline" size={21} color={COLORS.text.main} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.favoriteButton, { marginLeft: 10 }]} onPress={toggleFavorite}>
                        <Ionicons 
                            name={isFavorite ? "star" : "star-outline"} 
                            size={24} 
                            color={isFavorite ? COLORS.primary : COLORS.text.main} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Ionicons name="book-outline" size={20} color={COLORS.text.muted} />
                        <Text style={styles.statText}>{manga.chapters || '0'} capítulos</Text>
                    </View>
                </View>

                {genres.length > 0 && (
                    <View style={styles.genresContainer}>
                        {genres.map((genre, index) => (
                            <View key={index} style={styles.genreTag}>
                                <Text style={styles.genreText}>{genre}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.synopsisContainer}>
                    <Text style={styles.synopsisTitle}>Sinopse</Text>
                    <Text style={styles.synopsisText}>{synopsis || (synopsisLoaded ? 'Sinopse não disponível no catálogo.' : 'Carregando sinopse…')}</Text>
                </View>
            </View>
        </ScrollView>
    );

    const renderChaptersTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.chaptersList}>
                {chapters.length === 0 && <Text style={styles.emptyChapters}>Os capítulos e as páginas serão exibidos aqui quando forem cadastrados no Supabase.</Text>}
                {chapters.map((chapter) => {
                    const isRead = readChapterIds.includes(chapter.id);
                    return <TouchableOpacity key={chapter.id} style={styles.chapterItem} onPress={() => openChapter(chapter)}>
                        <View style={styles.chapterInfo}>
                            <Text style={styles.chapterNumber}>{chapter.title}</Text>
                            <Text style={styles.chapterDate}>{isRead ? 'Lido' : 'Ainda não lido'}</Text>
                        </View>
                        <View style={[styles.chapterBadge, isRead && styles.chapterBadgeRead]}>
                            <Text style={[styles.chapterBadgeText, isRead && styles.chapterBadgeTextRead]}>{chapter.number}</Text>
                        </View>
                    </TouchableOpacity>;
                })}
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => { if (navigation?.canGoBack()) navigation.goBack(); else navigation?.navigate('Main'); }} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.main} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'details' && styles.tabActive]}
                    onPress={() => setActiveTab('details')}
                >
                    <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>DETALHES</Text>
                    {activeTab === 'details' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'chapters' && styles.tabActive]}
                    onPress={() => setActiveTab('chapters')}
                >
                    <Text style={[styles.tabText, activeTab === 'chapters' && styles.tabTextActive]}>CAPÍTULOS</Text>
                    {activeTab === 'chapters' && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
            </View>

            {activeTab === 'details' ? renderDetailsTab() : renderChaptersTab()}

            <Modal visible={showReadingModes} transparent animationType="fade" onRequestClose={() => setShowReadingModes(false)}>
                <View style={styles.modeModalBackdrop}>
                    <View style={styles.modeModal}>
                        <Text style={styles.modeTitle}>Modo de leitura</Text>
                        {([
                            ['manga', 'Mangá', 'Páginas da direita para a esquerda'],
                            ['comic', 'HQ', 'Páginas da esquerda para a direita'],
                            ['manhwa', 'Manhwa', 'Rolagem vertical'],
                        ] as [MangaReadingMode, string, string][]).map(([mode, title, subtitle]) => (
                            <TouchableOpacity key={mode} style={styles.modeOption} onPress={async () => { setReadingMode(mode); await saveReadingMode(manga.title, mode); setHasReadingPreference(true); }}>
                                <View style={styles.modeCopy}>
                                    <Text style={styles.modeOptionTitle}>{title}</Text>
                                    <Text style={styles.modeOptionSubtitle}>{subtitle}</Text>
                                </View>
                                {readingMode === mode && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.startReadingButton} onPress={() => { void startReading(); }} accessibilityRole="button">
                            <Text style={styles.startReadingText}>Começar a ler</Text>
                            <Ionicons name="arrow-forward" size={18} color={COLORS.background.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modeCancel} onPress={() => setShowReadingModes(false)}><Text style={styles.modeCancelText}>Fechar</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 66,
        paddingBottom: 15,
        backgroundColor: COLORS.background.primary,
    },
    backButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: COLORS.text.main,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSpacer: {
        width: 34,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface.primary,
        backgroundColor: COLORS.background.primary,
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        position: 'relative',
    },
    tabActive: {
        backgroundColor: COLORS.background.primary,
    },
    tabText: {
        color: COLORS.text.muted,
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: COLORS.text.main,
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.primary,
    },
    tabContent: {
        flex: 1,
    },
    coverContainer: {
        width: width,
        height: 400,
        position: 'relative',
    },
    coverImage: {
        width: width,
        height: 400,
        resizeMode: 'cover',
    },
    coverGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 200,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    title: {
        color: COLORS.text.main,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    author: {
        color: COLORS.text.muted,
        fontSize: 14,
        marginBottom: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    readButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        marginRight: 15,
    },
    readButtonText: {
        color: COLORS.background.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    favoriteButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.surface.primary,
        borderWidth: 2,
        borderColor: COLORS.surface.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    statText: {
        color: COLORS.text.muted,
        fontSize: 14,
        marginLeft: 8,
    },
    genresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    genreTag: {
        backgroundColor: COLORS.surface.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
    },
    genreText: {
        color: COLORS.text.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    synopsisContainer: {
        marginBottom: 30,
    },
    synopsisTitle: {
        color: COLORS.text.main,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    synopsisText: {
        color: COLORS.text.muted,
        fontSize: 14,
        lineHeight: 22,
    },
    chaptersList: {
        padding: 15,
    },
    emptyChapters: { color: COLORS.text.muted, fontSize: 14, lineHeight: 21, padding: 16, textAlign: 'center' },
    chapterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface.primary,
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    chapterInfo: {
        flex: 1,
    },
    chapterNumber: {
        color: COLORS.text.main,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    chapterDate: {
        color: COLORS.text.muted,
        fontSize: 12,
    },
    chapterBadge: { width: 42, height: 42, borderRadius: 10, backgroundColor: COLORS.surface.secondary, alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
    chapterBadgeRead: { backgroundColor: COLORS.accent },
    chapterBadgeText: { color: COLORS.text.main, fontSize: 15, fontWeight: 'bold' },
    chapterBadgeTextRead: { color: COLORS.background.primary },
    modeModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 22 },
    modeModal: { backgroundColor: COLORS.background.secondary, borderColor: COLORS.surface.primary, borderWidth: 1, borderRadius: 16, padding: 18 },
    modeTitle: { color: COLORS.text.main, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    modeOption: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.surface.secondary, paddingVertical: 10 },
    modeCopy: { flex: 1 },
    modeOptionTitle: { color: COLORS.text.main, fontSize: 16, fontWeight: '600' },
    modeOptionSubtitle: { color: COLORS.text.muted, fontSize: 12, marginTop: 4 },
    startReadingButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 24, marginTop: 18 },
    startReadingText: { color: COLORS.background.primary, fontWeight: 'bold', fontSize: 15 },
    modeCancel: { alignSelf: 'flex-end', padding: 12, marginTop: 6 },
    modeCancelText: { color: COLORS.primary, fontWeight: 'bold' },
});
