import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Episode, Season } from '../routes/types';
import {
    isAnimeFavorite,
    loadFavoriteKeys,
    toggleFavoriteAnime,
} from '../utils/favorites';
import { mediaRepository } from '../services/mediaRepository';
import { getLocalAnimeSeasons } from '../services/localAnimeSeasons';
import { getAnimeArtwork, getMalRating } from '../services/animeArtwork';
import { loadAnimeRating } from '../utils/animeRatings';
import { getOriginalImageUrl } from '../utils/imageUrl';
import { getPortugueseAnimeSynopsis } from '../services/animeSynopsisPt';

const { width, height } = Dimensions.get('window');
const SLIME_OFFICIAL_SYNOPSIS = 'Mikami Satoru, funcionário de uma megacorporação, é apunhalado por um assassino nas ruas e renasce num mundo paralelo... Mas ele renasce como um slime! Jogado neste novo mundo com o nome Rimuru, ele assume a missão de criar um mundo que seja acolhedor para todas as raças.';

type AnimeDetailScreenRouteProp = RouteProp<RootStackParamList, 'AnimeDetail'>;
type AnimeDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AnimeDetail'>;

type Props = {
    route: AnimeDetailScreenRouteProp;
    navigation: AnimeDetailScreenNavigationProp;
};

function buildSeasons(anime: RootStackParamList['AnimeDetail']['anime'], catalogEpisodes: Episode[]): Season[] {
    const local = anime.seasons?.length ? anime.seasons : getLocalAnimeSeasons(anime.title, anime.episodes);
    if (!catalogEpisodes.length) return local;
    if (!local.length) return [{ id: 'catalog', name: 'Temporada 1', episodes: catalogEpisodes }];

    let cursor = 0;
    return local.map((season, index) => {
        const count = season.episodes.length;
        const isLast = index === local.length - 1;
        const slice = isLast ? catalogEpisodes.slice(cursor) : catalogEpisodes.slice(cursor, cursor + count);
        cursor += count;
        return {
            ...season,
            episodes: slice.length ? slice : season.episodes,
        };
    });
}

export default function AnimeDetailScreen({ route, navigation }: Props) {
    const { anime, selectedSeasonId: routeSeasonId } = route.params;
    const insets = useSafeAreaInsets();
    const [catalogEpisodes, setCatalogEpisodes] = useState<Episode[]>([]);
    const [malRating, setMalRating] = useState<{ score: number; count: number } | null>(null);
    const localSynopsis = getPortugueseAnimeSynopsis(anime.title) || anime.description || (anime.title.toLowerCase().includes('slime') ? SLIME_OFFICIAL_SYNOPSIS : '');
    const [synopsis, setSynopsis] = useState(localSynopsis);
    const [synopsisLoaded, setSynopsisLoaded] = useState(false);
    const [userAverage, setUserAverage] = useState<number | null>(null);
    const [userRatingCount, setUserRatingCount] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.all([getAnimeArtwork(anime.title), loadAnimeRating(anime.title)]).then(async ([artwork, ratings]) => {
            if (!active) return;
            setUserAverage(ratings.average);
            setUserRatingCount(ratings.count);
            if (active && !localSynopsis && artwork?.synopsis) setSynopsis(artwork.synopsis);
            const external = await getMalRating(artwork?.malId ?? null);
            if (active && external) {
                setMalRating({ score: external.score, count: external.count });
                if (!localSynopsis && external.synopsis) setSynopsis(external.synopsis);
            }
            if (active) setSynopsisLoaded(true);
        }).catch((error) => {
            if (active) setSynopsisLoaded(true);
            console.warn('Não foi possível atualizar os dados do anime:', error);
        });
        return () => { active = false; };
    }, [anime.bannerImage, anime.description, anime.id, anime.image, anime.title, localSynopsis]);

    useEffect(() => {
        let active = true;
        mediaRepository.getAnimeEpisodes(anime.id).then((items) => {
            if (active) setCatalogEpisodes(items);
        }).catch((error) => console.error('Erro ao carregar episódios:', error));
        return () => { active = false; };
    }, [anime.id]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showMoreDetails, setShowMoreDetails] = useState(false);
    const genres = anime.title.toLowerCase().includes('slime')
        ? ['Isekai', 'Fantasia', 'Aventura', 'Comédia']
        : (anime.genre || '').split(/[,·|]/).map((genre) => genre.trim()).filter(Boolean);

    const checkIfFavorite = useCallback(async () => {
        try {
            const keys = await loadFavoriteKeys();
            setIsFavorite(isAnimeFavorite(keys, anime.title));
        } catch (error) {
            console.error('Erro ao verificar favorito:', error);
        }
    }, [anime.title]);

    useFocusEffect(
        useCallback(() => {
            checkIfFavorite();
            loadAnimeRating(anime.title).then((rating) => {
                setUserAverage(rating.average);
                setUserRatingCount(rating.count);
            }).catch((error) => console.error('Erro ao atualizar a avaliação:', error));
        }, [anime.title, checkIfFavorite])
    );

    const toggleFavorite = async () => {
        try {
            const { isFavorite: next } = await toggleFavoriteAnime({
                id: anime.id,
                title: anime.title,
                image: anime.image,
                rating: anime.rating,
                year: anime.year,
                genre: anime.genre,
                episodes: anime.episodes,
                description: anime.description,
                type: 'anime',
            });
            setIsFavorite(next);
        } catch (error: any) {
            if (error?.message === 'NOT_LOGGED_IN') {
                Alert.alert('Erro', 'Você precisa estar logado para favoritar');
                return;
            }
            console.error('Erro ao atualizar favorito:', error);
            Alert.alert('Erro', 'Não foi possível atualizar favorito');
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Confira ${anime.title} no AniHoshi!`,
                url: anime.image,
            });
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
        }
    };

    const seasons = useMemo(() => buildSeasons(anime, catalogEpisodes), [anime, catalogEpisodes]);
    const selectedSeason = useMemo(() => {
        if (!seasons.length) return null;
        return seasons.find((season) => season.id === routeSeasonId) ?? seasons[0];
    }, [routeSeasonId, seasons]);
    const episodes = selectedSeason?.episodes ?? [];
    const firstEpisode = episodes[0];

    const openSeasons = () => {
        navigation.navigate('AnimeSeasons', {
            anime,
            animeTitle: anime.title,
            seasons,
            selectedSeasonId: selectedSeason?.id,
        });
    };

    const playEpisode = (episode: Episode) => {
        navigation.navigate('AnimePlayer', {
            animeTitle: anime.title,
            episode,
            episodeList: episodes,
        });
    };

    const baseScore = malRating?.score ?? (Number(anime.rating) || 0);
    const displayScore = userAverage ?? baseScore / 2;
    const displayCount = userAverage !== null ? userRatingCount : (malRating?.count ?? 0);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: getOriginalImageUrl(anime.bannerImage || anime.image) }} style={styles.animeImage} contentFit="contain" contentPosition="center" cachePolicy="memory-disk" />
                    <LinearGradient colors={['transparent', 'rgba(10, 15, 29, 0.72)', COLORS.background.primary]} locations={[0, 0.62, 1]} style={styles.imageGradient} pointerEvents="none" />
                    <TouchableOpacity
                        style={[styles.backButton, { top: Math.max(insets.top, 12) + 8 }]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Main'); }}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text.main} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>{anime.title}</Text>
                    
                    <View style={styles.metadata}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={20} color={COLORS.primary} />
                            <Text style={styles.rating}>{displayScore ? displayScore.toFixed(1) : '—'}</Text>
                            {displayCount > 0 && <Text style={styles.ratingCount}>({displayCount.toLocaleString('pt-BR')})</Text>}
                            <TouchableOpacity onPress={() => navigation.navigate('AnimeRating', { animeTitle: anime.title, rating: displayScore, count: displayCount })} style={styles.ratingExpandButton} accessibilityLabel="Abrir avaliação do anime">
                                <Ionicons name="chevron-down" size={20} color={COLORS.text.main} />
                            </TouchableOpacity>
                        </View>
                        {anime.year && <Text style={styles.year}>{anime.year}</Text>}
                        {genres.map((genre) => (
                            <View key={genre} style={styles.genreBadge}>
                                <Text style={styles.genre}>{genre}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
                            <Ionicons 
                                name={isFavorite ? "star" : "star-outline"} 
                                size={20} 
                                color={isFavorite ? COLORS.primary : COLORS.text.main} 
                            />
                            <Text style={styles.favoriteButtonText}>
                                {isFavorite ? 'Favoritado' : 'Favoritar'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Ionicons name="share-outline" size={20} color={COLORS.text.main} />
                            <Text style={styles.shareButtonText}>Compartilhar</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{synopsis || (synopsisLoaded ? 'Sinopse não disponível no catálogo.' : 'Carregando sinopse…')}</Text>
                        <TouchableOpacity style={styles.moreDetailsButton} onPress={() => setShowMoreDetails(true)}>
                            <Text style={styles.moreDetailsText}>Mais detalhes</Text>
                            <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.episodesSection}>
                        <Text style={styles.sectionTitle}>Episódios</Text>
                        {seasons.length > 0 && (
                            <TouchableOpacity style={styles.seasonDropdown} onPress={openSeasons} accessibilityRole="button">
                                <Text style={styles.seasonText} numberOfLines={1}>{selectedSeason?.name ?? 'Temporada 1'}</Text>
                                <Ionicons name="chevron-down" size={16} color={COLORS.text.main} />
                            </TouchableOpacity>
                        )}
                        {episodes.length === 0 ? (
                            <Text style={styles.episodesHint}>Episódios ainda não disponíveis</Text>
                        ) : (
                            episodes.map((episode, index) => (
                                <TouchableOpacity
                                    key={episode.id}
                                    style={styles.episodeCard}
                                    onPress={() => playEpisode(episode)}
                                >
                                    <View style={styles.episodePlayIcon}>
                                        <Ionicons name="play" size={18} color={COLORS.background.primary} />
                                    </View>
                                    <View style={styles.episodeInfo}>
                                        <Text style={styles.episodeTitle} numberOfLines={2}>{episode.title || `Episódio ${index + 1}`}</Text>
                                        <Text style={styles.episodeDuration}>{episode.duration ?? '—'}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                <TouchableOpacity
                    style={[styles.playButton, !firstEpisode && styles.playButtonDisabled]}
                    disabled={!firstEpisode}
                    onPress={() => firstEpisode && playEpisode(firstEpisode)}
                >
                    <Ionicons name="play" size={20} color={COLORS.background.primary} />
                    <Text style={styles.playButtonText}>Começar a assistir E1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.favoriteStarButton} onPress={toggleFavorite}>
                    <Ionicons
                        name={isFavorite ? 'star' : 'star-outline'}
                        size={28}
                        color={isFavorite ? COLORS.primary : COLORS.text.main}
                    />
                </TouchableOpacity>
            </View>


            <Modal visible={showMoreDetails} transparent animationType="slide">
                <View style={styles.detailsModal}>
                    <View style={styles.detailsModalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowMoreDetails(false)}>
                            <Ionicons name="close" size={24} color={COLORS.text.main} />
                        </TouchableOpacity>
                        
                        <Text style={styles.detailsTitle}>{anime.title}</Text>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Classificação:</Text>
                            <Text style={styles.detailsValue}>A16</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Gênero:</Text>
                            <Text style={styles.detailsValue}>{anime.genre || 'Fantasia, Drama, Seinen'}</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Ano:</Text>
                            <Text style={styles.detailsValue}>{anime.year || '2021'}</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Episódios:</Text>
                            <Text style={styles.detailsValue}>{anime.episodes || '24+'}</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Avaliação:</Text>
                            <Text style={styles.detailsValue}>{displayScore ? `${displayScore.toFixed(1)}/5` : 'Sem avaliações'}</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Áudio:</Text>
                            <Text style={styles.detailsValue}>Português, Japonês, Inglês</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Legendas:</Text>
                            <Text style={styles.detailsValue}>Português, Inglês, Espanhol</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsLabel}>Descrição:</Text>
                            <Text style={styles.detailsDescription}>
                                {synopsis || (synopsisLoaded ? 'Sinopse não disponível no catálogo.' : 'Carregando sinopse…')}
                            </Text>
                        </View>
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
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        height: height * 0.5,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    animeImage: {
        width: width,
        height: '100%',
    },
    imageGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 15,
        zIndex: 20,
        elevation: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },
    content: {
        paddingHorizontal: 15,
        paddingTop: 20,
    },
    title: {
        color: COLORS.text.main,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    metadata: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 20,
        rowGap: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    rating: {
        color: COLORS.primary,
        fontSize: 16,
        marginLeft: 5,
        fontWeight: 'bold',
    },
    ratingCount: { color: COLORS.text.muted, fontSize: 13, marginLeft: 4 },
    ratingExpandButton: { paddingHorizontal: 5, paddingVertical: 2 },
    year: {
        color: COLORS.text.muted,
        fontSize: 14,
        marginRight: 15,
    },
    genre: {
        color: COLORS.text.main,
        fontSize: 12,
        fontWeight: '600',
    },
    genreBadge: {
        backgroundColor: COLORS.surface.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        marginRight: 6,
    },
    actionButtons: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    favoriteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
    },
    favoriteButtonText: {
        color: COLORS.text.main,
        fontSize: 14,
        marginLeft: 5,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
    },
    shareButtonText: {
        color: COLORS.text.main,
        fontSize: 14,
        marginLeft: 5,
    },
    descriptionContainer: {
        marginBottom: 20,
    },
    description: {
        color: COLORS.text.muted,
        fontSize: 14,
        lineHeight: 20,
    },
    moreDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    moreDetailsText: {
        color: COLORS.primary,
        fontSize: 14,
        marginRight: 5,
    },
    episodesSection: {
        marginBottom: 100,
    },
    sectionTitle: {
        color: COLORS.text.main,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    episodesHint: { color: COLORS.text.muted, fontSize: 13, marginBottom: 12 },
    seasonDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 15,
        alignSelf: 'flex-start',
        maxWidth: '100%',
    },
    seasonText: {
        color: COLORS.text.main,
        fontSize: 14,
        marginRight: 5,
        flexShrink: 1,
    },
    episodeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        marginBottom: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 12,
    },
    episodePlayIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    episodeInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    episodeTitle: {
        color: COLORS.text.main,
        fontSize: 14,
        fontWeight: '600',
    },
    episodeDuration: {
        color: COLORS.text.muted,
        fontSize: 12,
        marginTop: 4,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.background.primary,
        paddingHorizontal: 15,
        paddingTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.surface.primary,
    },
    playButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 15,
    },
    playButtonDisabled: {
        opacity: 0.45,
    },
    playButtonText: {
        color: COLORS.background.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    favoriteStarButton: {
        padding: 10,
    },
    shareModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'flex-end',
    },
    shareModalContent: {
        backgroundColor: COLORS.background.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 5,
    },
    shareImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 20,
    },
    shareTitle: {
        color: COLORS.text.main,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    shareOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    shareOption: {
        alignItems: 'center',
        width: '25%',
        marginBottom: 20,
    },
    shareOptionText: {
        color: COLORS.text.main,
        fontSize: 12,
        marginTop: 8,
    },
    detailsModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        padding: 20,
    },
    detailsModalContent: {
        backgroundColor: '#000',
        borderRadius: 20,
        padding: 25,
    },
    detailsTitle: {
        color: COLORS.text.main,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
    },
    detailsSection: {
        marginBottom: 20,
    },
    detailsLabel: {
        color: COLORS.text.muted,
        fontSize: 14,
        marginBottom: 5,
    },
    detailsValue: {
        color: COLORS.text.main,
        fontSize: 16,
    },
    detailsDescription: {
        color: COLORS.text.main,
        fontSize: 14,
        lineHeight: 22,
    },
});
