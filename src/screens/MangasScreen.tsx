import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { getMangaCover } from '../services/animeArtwork';
import { NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '../routes/types';
import {
    getAnimeKey,
    isAnimeFavorite,
    loadFavoriteKeys,
    toggleFavoriteAnime,
} from '../utils/favorites';

type MangaItem = {
    id: string;
    title: string;
    image: string;
    description?: string;
    genre?: string;
    year?: string;
    rating?: string;
    chapters?: string;
    author?: string;
};

export const trendingManga: MangaItem[] = [
    { id: 'manga-1', title: 'One Piece', image: 'https://cdn.myanimelist.net/images/manga/2/243551l.jpg', description: 'Monkey D. Luffy e sua tripulação de piratas navegam pela Grand Line em busca do tesouro lendário, o One Piece, para se tornar o Rei dos Piratas.', genre: 'Aventura, Ação', year: '1997', rating: '9.3', chapters: '1100+', author: 'Oda, Eiichiro' },
    { id: 'manga-2', title: 'Jujutsu Kaisen', image: 'https://cdn.myanimelist.net/images/manga/3/217848l.jpg', description: 'Yuji Itadori ingere o dedo de uma maldição poderosa e se envolve com o mundo de feiticeiros de Jujutsu para caçar espíritos malignos.', genre: 'Ação, Sobrenatural', year: '2018', rating: '9.1', chapters: '250+', author: 'Akutami, Gege' },
    { id: 'manga-3', title: 'Chainsaw Man', image: 'https://dw9to29mmj727.cloudfront.net/products/1974709930.jpg', description: 'Endividado desde jovem, Denji caça demônios ao lado de Pochita para sobreviver. Depois de uma traição fatal, ele se funde ao pequeno demônio motosserra e recebe uma nova chance de viver, agora recrutado para enfrentar ameaças sobrenaturais enquanto tenta realizar desejos simples que nunca pôde ter.', genre: 'Ação, Comédia, Drama, Horror, Sobrenatural', year: '2018', rating: '8.9', chapters: '160+', author: 'Fujimoto, Tatsuki' },
    { id: 'manga-4', title: 'Demon Slayer', image: 'https://shop.viz.com/cdn/shop/files/white-9781974700523_1500x.jpg?v=1743521852', description: 'Tanjiro Kamado se torna um Demon Slayer para vingar sua família e curar sua irmã que foi transformada em demônio.', genre: 'Ação, Sobrenatural', year: '2016', rating: '9.0', chapters: '230+', author: 'Gotouge, Koyoharu' },
    { id: 'manga-5', title: 'My Hero Academia', image: 'https://cdn.myanimelist.net/images/manga/3/183860l.jpg', description: 'Izuku Midoriya, um garoto sem poderes em um mundo onde 80% da população tem superpoderes, sonha em se tornar o maior herói.', genre: 'Ação, Superpoder', year: '2014', rating: '8.4', chapters: '420+', author: 'Horikoshi, Kohei' },
    { id: 'manga-6', title: 'Spy x Family', image: 'https://cdn.myanimelist.net/images/manga/3/233475l.jpg', description: 'Um espião, uma assassina e uma telepata formam uma família falsa, cada um escondendo sua verdadeira identidade dos outros.', genre: 'Comédia, Ação', year: '2019', rating: '8.8', chapters: '95+', author: 'Endo, Tatsuya' },
];

export const newReleasesManga: MangaItem[] = [
    { id: 'new-manga-1', title: 'Bleach: TYBW', image: 'https://dw9to29mmj727.cloudfront.net/products/1591164419.jpg', description: 'A guerra sangrenta dos mil anos entre os Shinigami e os Quincy finalmente começa.', genre: 'Ação, Sobrenatural', year: '2024', rating: '9.4', chapters: 'Em andamento', author: 'Kubo, Tite' },
    { id: 'new-manga-2', title: 'Tensei Shitara Slime Data Ken', image: 'https://cdn.myanimelist.net/images/manga/2/224970l.jpg', description: 'Rimuru Tempest continua expandindo seu país de monstros enquanto enfrenta novos desafios.', genre: 'Fantasia, Ação', year: '2024', rating: '8.8', chapters: 'Em andamento', author: 'Fuse, Kawakami, Taiki' },
    { id: 'new-manga-3', title: 'Mushoku Tensei', image: 'https://cdn.myanimelist.net/images/manga/3/243549l.jpg', description: 'Rudeus Greyrat continua sua jornada em um mundo de magia, enfrentando desafios familiares.', genre: 'Fantasia, Aventura', year: '2024', rating: '9.1', chapters: 'Em andamento', author: 'Rifujin na Magonote' },
    { id: 'new-manga-4', title: 'Dragon Ball Super', image: 'https://cdn.myanimelist.net/images/manga/3/223759l.jpg', description: 'Goku e seus amigos continuam suas aventuras enfrentando inimigos poderosos.', genre: 'Ação, Aventura', year: '2024', rating: '8.7', chapters: 'Em andamento', author: 'Toriyama, Akira' },
    { id: 'new-manga-5', title: 'Blue Lock', image: 'https://cdn.myanimelist.net/images/manga/3/243550l.jpg', description: 'Um programa de treinamento intenso para criar o melhor atacante do mundo.', genre: 'Esportes, Drama', year: '2024', rating: '8.5', chapters: 'Em andamento', author: 'Nomura, Muneyuki' },
];

export const popularManga: MangaItem[] = [
    { id: 'pop-manga-1', title: 'One Piece', description: 'Monkey D. Luffy e sua tripulação de piratas navegam pela Grand Line em busca do tesouro lendário.', image: 'https://cdn.myanimelist.net/images/manga/2/243551l.jpg', genre: 'Aventura, Ação', year: '1997', rating: '9.3', chapters: '1100+', author: 'Oda, Eiichiro' },
    { id: 'pop-manga-2', title: 'Berserk', description: 'Guts, um mercenário negro, viaja por um mundo sombrio em busca de vingança.', image: 'https://cdn.myanimelist.net/images/manga/1/157897l.jpg', genre: 'Ação, Fantasia', year: '1989', rating: '9.5', chapters: '370+', author: 'Miura, Kentaro' },
    { id: 'pop-manga-3', title: 'Vagabond', description: 'A história de Miyamoto Musashi, o maior espadachim do Japão.', image: 'https://cdn.myanimelist.net/images/manga/1/157898l.jpg', genre: 'Ação, Histórico', year: '1998', rating: '9.4', chapters: '327+', author: 'Inoue, Takehiko' },
    { id: 'pop-manga-4', title: 'Monster', description: 'Um cirurgião busca redenção após salvar a vida de um psicopata.', image: 'https://cdn.myanimelist.net/images/manga/2/243552l.jpg', genre: 'Mistério, Thriller', year: '1994', rating: '9.1', chapters: '162+', author: 'Urasawa, Naoki' },
    { id: 'pop-manga-5', title: 'Fullmetal Alchemist', description: 'Dois irmãos buscam restaurar seus corpos após uma tentativa falha de alquimia.', image: 'https://cdn.myanimelist.net/images/manga/2/243553l.jpg', genre: 'Ação, Fantasia', year: '2001', rating: '9.0', chapters: '116', author: 'Arakawa, Hiromu' },
];

type Props = {
    navigation?: NavigationProp<MainTabParamList>;
};

export default function MangasScreen({ navigation: tabNavigation }: Props) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
    const [mangaCovers, setMangaCovers] = useState<Record<string, string>>({});

    useEffect(() => {
        let active = true;
        const catalog = [...trendingManga, ...newReleasesManga, ...popularManga]
            .filter((item, index, all) => all.findIndex((candidate) => candidate.title === item.title) === index);
        const loadCovers = async () => {
            for (const item of catalog) {
                const cover = await getMangaCover(item.title);
                if (active && cover) setMangaCovers((current) => ({ ...current, [item.title]: cover }));
                if (active) await new Promise((resolve) => setTimeout(resolve, 350));
            }
        };
        void loadCovers();
        return () => { active = false; };
    }, []);

    const refreshFavorites = useCallback(async () => {
        try {
            const keys = await loadFavoriteKeys();
            setFavoriteKeys(keys);
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            setFavoriteKeys(new Set());
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
        }, [refreshFavorites])
    );

    const toggleFavorite = async (manga: MangaItem) => {
        try {
            const { isFavorite } = await toggleFavoriteAnime({
                ...manga,
                type: 'manga',
            });
            setFavoriteKeys((prev) => {
                const next = new Set(prev);
                const key = getAnimeKey(manga.title);
                if (isFavorite) next.add(key);
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

    const renderMangaCard = ({ item }: { item: MangaItem }) => (
        <TouchableOpacity 
            style={[styles.card, hoveredCardId === item.id && styles.cardHovered]} 
            activeOpacity={1}
            onPressIn={() => setHoveredCardId(item.id)}
            onPressOut={() => setHoveredCardId(null)}
            onPress={() => navigation.navigate('MangaDetail', { 
                manga: {
                    id: item.id,
                    title: item.title,
                    image: mangaCovers[item.title] || item.image,
                    rating: item.rating,
                    year: item.year,
                    genre: item.genre,
                    chapters: item.chapters,
                    author: item.author,
                    description: item.description,
                }
            })}
        >
            <View style={styles.cardImageContainer}>
                <Image source={{ uri: mangaCovers[item.title] || item.image }} style={styles.poster} resizeMode="cover" />
                {hoveredCardId === item.id && (
                    <View style={styles.darkOverlay} />
                )}
                {item.genre && (
                    <View style={styles.genreBadge}>
                        <Text style={styles.genreText}>{item.genre.split(',')[0]}</Text>
                    </View>
                )}
                <TouchableOpacity 
                    style={styles.favoriteBadge}
                    onPress={() => toggleFavorite(item)}
                >
                    <Ionicons 
                        name={isAnimeFavorite(favoriteKeys, item.title) ? "star" : "star-outline"} 
                        size={16} 
                        color={isAnimeFavorite(favoriteKeys, item.title) ? COLORS.primary : COLORS.text.main} 
                    />
                </TouchableOpacity>
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

    const renderSectionHeader = (title: string, items: MangaItem[]) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ver mais ${title}`} style={styles.seeMoreButton} onPress={() => navigation.navigate('CategoryScreen', { title, mangaList: items })}>
                <Text style={styles.seeMoreText}>Ver mais</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mangás</Text>
            </View>

            <ScrollView style={styles.content}>
                {renderSectionHeader('Mangás em Alta', trendingManga)}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {trendingManga.map((item) => (
                        <View key={item.id}>{renderMangaCard({ item })}</View>
                    ))}
                </ScrollView>
                {renderSectionHeader('Novidades', newReleasesManga)}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {newReleasesManga.map((item) => (
                        <View key={item.id}>{renderMangaCard({ item })}</View>
                    ))}
                </ScrollView>
                {renderSectionHeader('Populares', popularManga)}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {popularManga.map((item) => (
                        <View key={item.id}>{renderMangaCard({ item })}</View>
                    ))}
                </ScrollView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background.primary },
    header: {
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 10,
    },
    headerTitle: {
        color: COLORS.text.main,
        fontSize: 28,
        fontWeight: 'bold',
    },
    content: { flex: 1 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginTop: 30,
    },
    sectionTitle: { color: COLORS.text.main, fontSize: 18, fontWeight: 'bold' },
    seeMoreButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
    seeMoreText: { color: COLORS.primary, fontSize: 14, marginRight: 4 },
    list: { paddingLeft: 15, paddingBottom: 20 },
    card: { marginRight: 15, width: 120 },
    cardHovered: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cardImageContainer: {
        position: 'relative',
    },
    poster: { width: 120, height: 180, borderRadius: 8 },
    darkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 8,
    },
    genreBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    genreText: {
        color: COLORS.text.main,
        fontSize: 10,
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
    cardTitle: { color: COLORS.text.main, fontSize: 12, marginTop: 5, textAlign: 'center', fontWeight: '600' },
    cardMetadata: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    metadataText: {
        color: COLORS.text.muted,
        fontSize: 10,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        color: COLORS.primary,
        fontSize: 10,
        marginLeft: 2,
    },
});
