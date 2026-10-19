import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, MainTabParamList } from '../routes/types';
import {
    FavoriteAnime,
    loadFavoriteAnimeList,
    toggleFavoriteAnime,
    getAnimeKey,
} from '../utils/favorites';

type Props = {
    navigation?: NavigationProp<MainTabParamList>;
};

export default function FavoritesScreen({ navigation: tabNavigation }: Props) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [favorites, setFavorites] = useState<FavoriteAnime[]>([]);
    const [activeTab, setActiveTab] = useState<'Animes' | 'Mangás'>('Animes');

    const loadFavorites = useCallback(async () => {
        try {
            const list = await loadFavoriteAnimeList();
            setFavorites(list);
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [loadFavorites])
    );

    const handleToggleFavorite = async (anime: FavoriteAnime) => {
        try {
            const { favorites: updated } = await toggleFavoriteAnime(anime);
            setFavorites(updated);
        } catch (error: any) {
            if (error?.message === 'NOT_LOGGED_IN') {
                Alert.alert('Erro', 'Você precisa estar logado para gerenciar favoritos');
                return;
            }
            console.error('Erro ao atualizar favoritos:', error);
            Alert.alert('Erro', 'Não foi possível atualizar favoritos');
        }
    };

    const renderFavorite = ({ item }: { item: FavoriteAnime }) => (
        <View style={styles.card}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                    if (item.type === 'manga') {
                        navigation.navigate('MangaDetail', {
                            manga: {
                                id: item.id,
                                title: item.title,
                                image: item.image,
                                rating: item.rating,
                                year: item.year,
                                genre: item.genre,
                                chapters: item.chapters,
                                description: item.description,
                            },
                        });
                        return;
                    }

                    navigation.navigate('AnimeDetail', {
                        anime: {
                            id: item.id,
                            title: item.title,
                            image: item.image,
                            rating: item.rating,
                            year: item.year,
                            genre: item.genre,
                            episodes: item.episodes,
                            description: item.description,
                        },
                    });
                }}
            >
                <Image source={{ uri: item.image }} style={styles.poster} />
                <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.heartIcon}
                onPress={() => handleToggleFavorite(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="star" size={20} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
    );

    const filteredFavorites = favorites.filter((item) => {
        if (activeTab === 'Animes') {
            return !item.type || item.type === 'anime';
        }
        return item.type === 'manga';
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Meus Favoritos</Text>
            <View style={styles.tabsContainer}>
                {(['Animes', 'Mangás'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {filteredFavorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="star-outline" size={60} color={COLORS.text.muted} />
                    <Text style={styles.emptyText}>Nenhum favorito ainda</Text>
                    <Text style={styles.emptySubtext}>
                        Toque nos {activeTab === 'Animes' ? 'animes' : 'mangás'} para adicionar aos favoritos
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredFavorites}
                    keyExtractor={(item) => getAnimeKey(item.title) || item.id}
                    renderItem={renderFavorite}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.row}
                    extraData={favorites}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
        paddingTop: 50,
        paddingHorizontal: 15,
    },
    title: {
        fontSize: 28,
        color: COLORS.text.main,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    list: {
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    card: {
        width: '48%',
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: 180,
        borderRadius: 8,
    },
    cardTitle: {
        color: COLORS.text.main,
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    heartIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        padding: 4,
        zIndex: 2,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: 'transparent',
    },
    tabButtonActive: {
        backgroundColor: COLORS.text.main,
    },
    tabText: {
        color: COLORS.text.muted,
        fontSize: 14,
        fontWeight: 'bold',
    },
    tabTextActive: {
        color: COLORS.background.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: COLORS.text.main,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubtext: {
        color: COLORS.text.muted,
        fontSize: 14,
        marginTop: 10,
    },
});
