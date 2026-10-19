import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, AnimeItem, MangaDetailParams } from '../routes/types';
import { COLORS } from '../theme/colors';
import { isAnimeFavorite, loadFavoriteKeys } from '../utils/favorites';
import { getOriginalImageUrl } from '../utils/imageUrl';
import { getMangaCover } from '../services/animeArtwork';

type Props = {
    route: RouteProp<RootStackParamList, 'CategoryScreen'>;
};

const { width } = Dimensions.get('window');

export default function CategoryScreen({ route }: Props) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { title, animeList = [], mangaList } = route.params;
    const mangaMode = !!mangaList;
    const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
    const [mangaCovers, setMangaCovers] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!mangaMode || !mangaList) return;
        let active = true;
        const loadCovers = async () => {
            for (const manga of mangaList) {
                const cover = await getMangaCover(manga.title);
                if (active && cover) setMangaCovers((current) => ({ ...current, [manga.title]: cover }));
                if (active) await new Promise((resolve) => setTimeout(resolve, 300));
            }
        };
        void loadCovers();
        return () => { active = false; };
    }, [mangaList, mangaMode]);

    const refreshFavorites = useCallback(async () => {
        try {
            const keys = await loadFavoriteKeys();
            setFavoriteKeys(keys);
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
        }, [refreshFavorites])
    );

    const renderAnimeCard = ({ item }: { item: AnimeItem | MangaDetailParams }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => mangaMode ? navigation.navigate('MangaDetail', { manga: { ...(item as MangaDetailParams), image: mangaCovers[item.title] || item.image } }) : navigation.navigate('AnimeDetail', { 
                anime: {
                    id: item.id,
                    title: item.title,
                    image: getOriginalImageUrl(item.image),
                    rating: item.rating,
                    year: item.year,
                    genre: item.genre,
                    episodes: (item as AnimeItem).episodes,
                    description: (item as AnimeItem).description,
                }
            })}
        >
            <View style={styles.cardImageContainer}>
                <Image source={{ uri: mangaMode ? (mangaCovers[item.title] || item.image) : getOriginalImageUrl(item.image) }} style={styles.poster} resizeMode="contain" />
                {item.genre && (
                    <View style={styles.genreBadge}>
                        <Text style={styles.genreText}>{item.genre}</Text>
                    </View>
                )}
                {isAnimeFavorite(favoriteKeys, item.title) && (
                    <View style={styles.favoriteBadge}>
                        <Ionicons name="star" size={16} color={COLORS.primary} />
                    </View>
                )}
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.cardMetadata}>
                {item.year && <Text style={styles.metadataText}>{item.year}</Text>}
                {item.rating && (
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color={COLORS.primary} />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.main} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <FlatList
                data={mangaMode ? mangaList : animeList}
                keyExtractor={(item) => item.id}
                renderItem={renderAnimeCard}
                numColumns={2}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    backButton: {
        minWidth: 44,
        minHeight: 44,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: COLORS.text.main,
        fontSize: 20,
        fontWeight: 'bold',
    },
    gridContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    card: {
        width: (width - 45) / 2,
    },
    cardImageContainer: {
        position: 'relative',
    },
    poster: {
        width: (width - 45) / 2,
        height: ((width - 45) / 2) * 1.5,
        borderRadius: 8,
    },
    genreBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    genreText: {
        color: COLORS.text.main,
        fontSize: 9,
        fontWeight: 'bold',
    },
    favoriteBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        padding: 4,
    },
    cardTitle: {
        color: COLORS.text.main,
        fontSize: 11,
        marginTop: 5,
        textAlign: 'center',
        fontWeight: '600',
    },
    cardMetadata: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    metadataText: {
        color: COLORS.text.muted,
        fontSize: 9,
        marginRight: 6,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        color: COLORS.primary,
        fontSize: 9,
        marginLeft: 2,
    },
});
