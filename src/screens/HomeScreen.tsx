import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '../routes/types';
import {
    getAnimeKey,
    isAnimeFavorite,
    loadFavoriteKeys,
    toggleFavoriteAnime,
} from '../utils/favorites';
import { getAnimeArtwork, getMalRating } from '../services/animeArtwork';
import { getOriginalImageUrl } from '../utils/imageUrl';
import { getPortugueseAnimeSynopsis } from '../services/animeSynopsisPt';

const { width } = Dimensions.get('window');
const SLIME_OFFICIAL_SYNOPSIS = 'Mikami Satoru, funcionário de uma megacorporação, é apunhalado por um assassino nas ruas e renasce num mundo paralelo... Mas ele renasce como um slime! Jogado neste novo mundo com o nome Rimuru, ele assume a missão de criar um mundo que seja acolhedor para todas as raças.';

type AnimeItem = {
    id: string;
    title: string;
    image: string;
    description?: string;
    genre?: string;
    year?: string;
    rating?: string;
    episodes?: string;
};

const heroData = [
    { id: 'hero-1', image: 'https://d32qys9a6wm9no.cloudfront.net/images/tvs/poster/1b/4030ffa998e27c9af00f67e239d3fa3b_original.jpg?t=1697144701', title: 'One Piece', genre: 'Aventura, Ação, Fantasia', description: 'Monkey D. Luffy e sua tripulação de piratas navegam pela Grand Line em busca do tesouro lendário, o One Piece, para se tornar o Rei dos Piratas.' },
    { id: 'hero-2', image: 'https://animesonline.cloud/wp-content/uploads/2026/07/sqxy7vEHqbV2dsJWoAGFBbd4diU-212x300.jpg', title: 'Bleach: TYBW', genre: 'Ação, Aventura, Sobrenatural', description: 'A guerra sangrenta dos mil anos entre os Shinigami e os Quincy finalmente começa, e Ichigo Kurosaki deve descobrir a verdade sobre suas origens.' },
    { id: 'hero-3', image: 'https://animesonline.cloud/wp-content/uploads/2026/05/eboMISzbfsu9bAp4GYVa6nzDma1-204x300.jpg', title: 'Tensei Shitara Slime Datta Ken', genre: 'Isekai, Fantasia, Aventura, Comédia', description: 'Satoru Mikami, um homem de 37 anos, é assassinado e renasce como um slime em um mundo de fantasia com poderes incríveis.' },
    { id: 'hero-4', image: 'https://animesonline.cloud/wp-content/uploads/2026/07/gLKOYIMyKlUHW0SVdskhgf9C0yy-200x300.jpg', title: 'Mushoku Tensei', genre: 'Isekai, Fantasia, Aventura, Drama', description: 'Rudeus Greyrat, um homem de 34 anos reencarna em um mundo de magia como uma criança, determinado a viver uma vida sem arrependimentos.' },
    { id: 'hero-5', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/Jrupd1NbVfhS7D84HLEkvwyxfF-200x300.jpg', title: 'Attack on Titan', genre: 'Ação, Drama, Fantasia, Suspense', description: 'A humanidade vive dentro de cidades cercadas por enormes muralhas que os protegem dos humanoides gigantes chamados Titans.' }
];

const trendingAnime: AnimeItem[] = [
    { id: 'trending-1', title: 'Jujutsu Kaisen', image: 'https://animesonline.cloud/wp-content/uploads/2026/01/zKFkzRn1UyE11Jv9CJjVmvmQFvR-200x300.jpg', description: 'Yuji Itadori ingere o dedo de uma maldição poderosa e se envolve com o mundo de feiticeiros de Jujutsu para caçar espíritos malignos.', genre: 'Ação', year: '2020', rating: '9.1', episodes: '24' },
    { id: 'trending-2', title: 'Chainsaw Man', image: 'https://animesonline.cloud/wp-content/uploads/2023/12/oeNps5WE8umMVcNISI8M2NHk7jg-200x300.jpg', description: 'Denji, um jovem endividado que se fundiu com seu mascote demônio Chainsaw, se torna um Devil Hunter para pagar suas dívidas.', genre: 'Ação', year: '2022', rating: '8.9', episodes: '12' },
    { id: 'trending-3', title: 'Demon Slayer', image: 'https://animesonline.cloud/wp-content/uploads/2024/04/Kimetsu-no-Yaiba-Hashira-Geiko-hen.jpg', description: 'Tanjiro Kamado se torna um Demon Slayer para vingar sua família e curar sua irmã que foi transformada em demônio.', genre: 'Ação', year: '2019', rating: '9.0', episodes: '44' },
    { id: 'trending-4', title: 'Attack on Titan', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/Jrupd1NbVfhS7D84HLEkvwyxfF-200x300.jpg', description: 'A humanidade vive dentro de cidades cercadas por enormes muralhas que os protegem dos humanoides gigantes chamados Titans.', genre: 'Ação', year: '2013', rating: '9.5', episodes: '87' },
    { id: 'trending-5', title: 'My Hero Academia', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/myxWINN4lV2YRtb3DcCi7UFn6C5-225x300.jpg', description: 'Izuku Midoriya, um garoto sem poderes em um mundo onde 80% da população tem superpoderes, sonha em se tornar o maior herói.', genre: 'Ação', year: '2016', rating: '8.4', episodes: '138' },
    { id: 'trending-6', title: 'Spy x Family', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/vDGB41PATBLb5GaXTfG1weZ03Xr-202x300.jpg', description: 'Um espião, uma assassina e uma telepata formam uma família falsa, cada um escondendo sua verdadeira identidade dos outros.', genre: 'Comédia', year: '2022', rating: '8.8', episodes: '25' },
    { id: 'trending-7', title: 'One Piece', image: 'https://d32qys9a6wm9no.cloudfront.net/images/tvs/poster/1b/4030ffa998e27c9af00f67e239d3fa3b_original.jpg?t=1697144701', description: 'Monkey D. Luffy e sua tripulação de piratas navegam pela Grand Line em busca do tesouro lendário, o One Piece.', genre: 'Aventura', year: '1999', rating: '9.3', episodes: '1100+' },
    { id: 'trending-8', title: 'Naruto Shippuden', image: 'https://animesonline.cloud/wp-content/uploads/2025/09/deEUrpqhTDhxkSbZHv81LPPjYwq-200x300.jpg', description: 'Naruto Uzumaki retorna à vila após dois anos de treinamento e enfrenta inimigos poderosos enquanto protege seus amigos.', genre: 'Ação', year: '2007', rating: '8.7', episodes: '500' },
    { id: 'trending-9', title: 'Bleach', image: 'https://animesonline.cloud/wp-content/uploads/2004/10/rtrtgfrew56t6tyiuj-200x300.jpg', description: 'Ichigo Kurosaki obtém poderes de um Soul Reaper e deve proteger os humanos de espíritos malignos conhecidos como Hollows.', genre: 'Ação', year: '2004', rating: '8.2', episodes: '366' },
    { id: 'trending-10', title: 'Hunter x Hunter', image: 'https://animesonline.cloud/wp-content/uploads/2024/12/9WxfAQquTun9ATkV6iAeFHMkqxv-200x300.jpg', description: 'Gon Freecss parte em uma jornada para se tornar um Hunter e encontrar seu pai, enfrentando desafios épicos no caminho.', genre: 'Aventura', year: '2011', rating: '9.4', episodes: '148' },
];

const newReleases: AnimeItem[] = [
    { id: 'new-1', title: 'Bleach: TYBW', image: 'https://animesonline.cloud/wp-content/uploads/2026/07/sqxy7vEHqbV2dsJWoAGFBbd4diU-212x300.jpg', description: 'A guerra sangrenta dos mil anos entre os Shinigami e os Quincy finalmente começa, e Ichigo Kurosaki deve descobrir a verdade sobre suas origens.', genre: 'Ação', year: '2024', rating: '9.4', episodes: 'Em andamento' },
    { id: 'new-2', title: 'Tensei Shitara Slime Data Ken S3', image: 'https://animesonline.cloud/wp-content/uploads/2026/05/eboMISzbfsu9bAp4GYVa6nzDma1-204x300.jpg', description: 'Rimuru Tempest continua expandindo seu país de monstros enquanto enfrenta novos desafios e inimigos poderosos.', genre: 'Isekai, Fantasia, Aventura, Comédia', year: '2024', rating: '8.8', episodes: 'Em andamento' },
    { id: 'new-3', title: 'Mushoku Tensei S3', image: 'https://animesonline.cloud/wp-content/uploads/2026/07/gLKOYIMyKlUHW0SVdskhgf9C0yy-200x300.jpg', description: 'Rudeus Greyrat continua sua jornada em um mundo de magia, enfrentando desafios familiares e descobrindo mais sobre o mundo.', genre: 'Fantasia', year: '2024', rating: '9.1', episodes: 'Em andamento' },
    { id: 'new-4', title: 'Dragon Ball Daima', description: 'Goku e seus amigos são transformados em crianças devido a uma conspiração e devem encontrar uma maneira de voltar ao normal.', image: 'https://cdn.anidb.net/images/main/308685.jpg', genre: 'Ação', year: '2024', rating: '8.7', episodes: 'Em andamento' },
    { id: 'new-5', title: 'Re:Zero S3', description: 'Subaru Natsuki continua sua jornada com sua habilidade de "Return by Death", enfrentando novos desafios e tragédias.', image: 'https://imgs.search.brave.com/rKK8q8sdTKgRJPXP9fz297b-YpFNNKRn2hrPFE7Fgyg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzA0LzZm/L2NiLzA0NmZjYjFk/MTIwMzU1ODJlNjM1/ZTA3OGU4ZjFlMmMz/LmpwZw', genre: 'Fantasia', year: '2024', rating: '9.0', episodes: 'Em andamento' },
    { id: 'new-6', title: 'Blue Exorcist: Shimane',description: 'Rin Okumura e seus irmãos viajam para Shimane para investigar uma ameaça demoníaca e descobrir mais sobre suas origens.', image: 'https://animesonline.cloud/wp-content/uploads/2025/01/5O5GkCJ4UBZi5Y2nei1oDTJd9jR-200x300.jpg', genre: 'Ação', year: '2024', rating: '8.5', episodes: 'Em andamento' },
    { id: 'new-7', title: 'Ranma 1/2', description: 'Ranma Saotome é um artista marcial que se transforma em mulher quando molhado com água fria, criando situações cômicas.', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/fj5iEatJv7L80Mp9STKTLf6uwcB-212x300.jpg', genre: 'Comédia', year: '2024', rating: '8.6', episodes: 'Em andamento' },
    { id: 'new-8', title: 'Sakamoto Days', description: 'Um lendário assassino se aposenta e se torna um vendedor de conveniência, mas seu passado volta para assombrá-lo.', image: 'https://animesonline.cloud/wp-content/uploads/2025/07/4RV1Icg4NPoUEjue57m3hlnqRmM-200x300.jpg', genre: 'Ação', year: '2025', rating: 'Em breve', episodes: '-' },
    { id: 'new-9', title: 'One Piece', description: 'Monkey D. Luffy e sua tripulação continuam sua jornada pela Grand Line em busca do One Piece.', image: 'https://d32qys9a6wm9no.cloudfront.net/images/tvs/poster/1b/4030ffa998e27c9af00f67e239d3fa3b_original.jpg?t=1697144701', genre: 'Aventura', year: '2024', rating: '9.3', episodes: 'Em andamento' },
    { id: 'new-10', title: 'Spy x Family S3', description: 'A família Forger continua suas missões enquanto mantêm suas identidades secretas e desenvolvem laços familiares.', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/vDGB41PATBLb5GaXTfG1weZ03Xr-202x300.jpg', genre: 'Comédia', year: '2025', rating: 'Em andamento', episodes: '-' },
];

const popularAnime: AnimeItem[] = [
    { id: 'popular-1', title: 'One Piece', description: 'Monkey D. Luffy e sua tripulação de piratas navegam pela Grand Line em busca do tesouro lendário, o One Piece, para se tornar o Rei dos Piratas.', image: 'https://d32qys9a6wm9no.cloudfront.net/images/tvs/poster/1b/4030ffa998e27c9af00f67e239d3fa3b_original.jpg?t=1697144701', genre: 'Aventura', year: '1999', rating: '9.3', episodes: '1100+' },
    { id: 'popular-2', title: 'Attack on Titan', description: 'A humanidade vive dentro de cidades cercadas por enormes muralhas que os protegem dos humanoides gigantes chamados Titans.', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/Jrupd1NbVfhS7D84HLEkvwyxfF-200x300.jpg', genre: 'Ação', year: '2013', rating: '9.5', episodes: '87' },
    { id: 'popular-3', title: 'Demon Slayer', description: 'Tanjiro Kamado se torna um Demon Slayer para vingar sua família e curar sua irmã que foi transformada em demônio.', image: 'https://animesonline.cloud/wp-content/uploads/2024/04/Kimetsu-no-Yaiba-Hashira-Geiko-hen.jpg', genre: 'Ação', year: '2019', rating: '9.0', episodes: '44' },
    { id: 'popular-4', title: 'Jujutsu Kaisen', description: 'Yuji Itadori ingere o dedo de uma maldição poderosa e se envolve com o mundo de feiticeiros de Jujutsu para caçar espíritos malignos.', image: 'https://animesonline.cloud/wp-content/uploads/2026/01/zKFkzRn1UyE11Jv9CJjVmvmQFvR-200x300.jpg', genre: 'Ação', year: '2020', rating: '9.1', episodes: '48' },
    { id: 'popular-5', title: 'My Hero Academia', description: 'Izuku Midoriya, um garoto sem poderes em um mundo onde 80% da população tem superpoderes, sonha em se tornar o maior herói.', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/myxWINN4lV2YRtb3DcCi7UFn6C5-225x300.jpg', genre: 'Ação', year: '2016', rating: '8.4', episodes: '138' },
    { id: 'popular-6', title: 'Dragon Ball Z', description: 'Goku e seus amigos defendem a Terra contra poderosos vilões que ameaçam a humanidade e o universo.', image: 'https://animesonline.cloud/wp-content/uploads/2024/03/f2zhRLqwRLrKhEMeIM7Z5buJFo3-200x300.jpg', genre: 'Ação', year: '1989', rating: '9.0', episodes: '153' },
    { id: 'popular-7', title: 'Naruto Shippuden', description: 'Naruto Uzumaki retorna à vila após dois anos de treinamento e enfrenta inimigos poderosos enquanto protege seus amigos.', image: 'https://animesonline.cloud/wp-content/uploads/2025/09/deEUrpqhTDhxkSbZHv81LPPjYwq-200x300.jpg', genre: 'Ação', year: '2007', rating: '8.7', episodes: '500' },
    { id: 'popular-8', title: 'Tensei Shitara Slime Datta Ken', description: 'Satoru Mikami, um homem de 37 anos, é assassinado e renasce como um slime em um mundo de fantasia com poderes incríveis.', image: 'https://animesonline.cloud/wp-content/uploads/2026/05/eboMISzbfsu9bAp4GYVa6nzDma1-204x300.jpg', genre: 'Isekai, Fantasia, Aventura, Comédia', year: '2018', rating: '8.8', episodes: '48+' },
    { id: 'popular-9', title: 'Mushoku Tensei', description: 'Rudeus Greyrat, um homem de 34 anos reencarna em um mundo de magia como uma criança, determinado a viver uma vida sem arrependimentos.', image: 'https://animesonline.cloud/wp-content/uploads/2026/07/gLKOYIMyKlUHW0SVdskhgf9C0yy-200x300.jpg', genre: 'Fantasia', year: '2021', rating: '9.1', episodes: '24+' },
    { id: 'popular-10', title: 'Sousou no Friere 2', description: 'Frieren e seus companheiros continuam sua jornada em um mundo pós-guerra, explorando as memórias de seu faleiro mestre Himmel.', image: 'https://animesonline.cloud/wp-content/uploads/2025/12/mV2L9VUhWbrKZpFCpfHKBUw3C9u-212x300.jpg', genre: 'Fantasia', year: '2026', rating: '9.5', episodes: '28' },
];

type Props = {
    navigation?: NavigationProp<MainTabParamList>;
};

export default function HomeScreen({ navigation: tabNavigation }: Props) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const flatListRef = useRef<FlatList>(null);
    const [, setCurrentIndex] = useState(0);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
    const [heroDescriptions, setHeroDescriptions] = useState<Record<string, string>>({});

    useEffect(() => {
        let active = true;
        Promise.all(heroData.map(async (item) => {
            const artwork = await getAnimeArtwork(item.title);
            const rating = await getMalRating(artwork?.malId ?? null);
            return [item.id, artwork, artwork?.synopsis ?? rating?.synopsis ?? null] as const;
        }))
            .then((results) => {
                if (!active) return;
                setHeroDescriptions(Object.fromEntries(results.flatMap(([id, , synopsis]) => synopsis ? [[id, synopsis]] : [])));
            });
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

    const toggleFavorite = async (anime: AnimeItem) => {
        try {
            const { isFavorite } = await toggleFavoriteAnime({
                ...anime,
                type: 'anime',
            });
            setFavoriteKeys((prev) => {
                const next = new Set(prev);
                const key = getAnimeKey(anime.title);
                if (isFavorite) next.add(key);
                else next.delete(key);
                return next;
            });
        } catch (error: any) {
            if (error?.message === 'NOT_LOGGED_IN') {
                Alert.alert('Login', 'Faça login para favoritar animes');
                return;
            }
            console.error('Erro ao favoritar:', error);
        }
    };

    useFocusEffect(useCallback(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % heroData.length;
                flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []));

    const renderAnimeCard = ({ item }: { item: AnimeItem }) => (
        <TouchableOpacity 
            style={[styles.card, hoveredCardId === item.id && styles.cardHovered]} 
            activeOpacity={1}
            onPressIn={() => setHoveredCardId(item.id)}
            onPressOut={() => setHoveredCardId(null)}
            onPress={() => navigation.navigate('AnimeDetail', { 
                anime: {
                    id: item.id,
                    title: item.title,
                    image: getOriginalImageUrl(item.image),
                    description: item.description,
                    rating: item.rating,
                    year: item.year,
                    genre: item.genre,
                    episodes: item.episodes,
                }
            })}
        >
            <View style={styles.cardImageContainer}>
                <Image source={{ uri: getOriginalImageUrl(item.image) }} style={styles.poster} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(10, 15, 29, 0.78)']} style={styles.posterGradient} />
                {hoveredCardId === item.id && (
                    <View style={styles.darkOverlay} />
                )}
                {item.genre && (
                    <View style={styles.genreBadge}>
                        <Text style={styles.genreText}>{item.genre}</Text>
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

    const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {onSeeAll && (
                <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>Ver mais</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={require('../../assets/logo2.png')} style={styles.logo} contentFit="contain" cachePolicy="memory-disk" />
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Abrir busca"
                        style={styles.searchHeaderButton}
                        onPress={() => tabNavigation?.navigate('Search')}
                    >
                        <Ionicons name="search" size={24} color="#FFFFFF" style={styles.headerIcon} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.content}
            >
                <FlatList
                    ref={flatListRef}
                    data={heroData}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id}
                    onMomentumScrollEnd={(event) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({
                                index: info.index,
                                animated: true,
                            });
                        }, 100);
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('AnimeDetail', { 
                                anime: {
                                    id: item.id,
                                    title: item.title,
                                    image: getOriginalImageUrl(item.image),
                                    bannerImage: getOriginalImageUrl(item.image),
                                    genre: item.genre,
                                    description: item.description,
                                }
                            })}
                            style={styles.heroContainer}
                        >
                            <Image source={{ uri: getOriginalImageUrl(item.image) }} style={styles.heroBackdrop} contentFit="cover" cachePolicy="memory-disk" />
                            <View pointerEvents="none" style={styles.heroBackdropShade} />
                            <Image source={{ uri: getOriginalImageUrl(item.image) }} style={styles.heroImage} contentFit="contain" contentPosition="center" cachePolicy="memory-disk" />
                            <LinearGradient
                                colors={['transparent', 'rgba(10, 15, 29, 0.9)', 'rgba(10, 15, 29, 1)']}
                                style={styles.heroGradient}
                            />
                            <View style={styles.heroContent}>
                                <Text style={styles.heroTitle}>{item.title}</Text>
                                <Text style={styles.heroDescription} numberOfLines={2}>{getPortugueseAnimeSynopsis(item.title) || item.description || heroDescriptions[item.id] || (item.title.toLowerCase().includes('slime') ? SLIME_OFFICIAL_SYNOPSIS : '')}</Text>
                                <View style={styles.heroButtons}>
                                    <TouchableOpacity 
                                        style={styles.watchButton}
                                        onPress={() => navigation.navigate('AnimeDetail', { 
                                            anime: {
                                                id: item.id,
                                                title: item.title,
                                                image: getOriginalImageUrl(item.image),
                                                bannerImage: getOriginalImageUrl(item.image),
                                                genre: item.genre,
                                                description: item.description,
                                            }
                                        })}
                                    >
                                        <Ionicons name="play" size={20} color={COLORS.background.primary} />
                                        <Text style={styles.watchButtonText}>Assistir Agora</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.favoriteButton}
                                        onPress={() => toggleFavorite(item)}
                                    >
                                        <Ionicons 
                                            name={isAnimeFavorite(favoriteKeys, item.title) ? "star" : "star-outline"} 
                                            size={24} 
                                            color={isAnimeFavorite(favoriteKeys, item.title) ? COLORS.primary : COLORS.text.main} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
                {renderSectionHeader('Animes em Alta', () => navigation.navigate('CategoryScreen', { title: 'Animes em Alta', animeList: trendingAnime }))}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {trendingAnime.map((item) => (
                        <View key={item.id}>{renderAnimeCard({ item })}</View>
                    ))}
                </ScrollView>
                {renderSectionHeader('Novidades', () => navigation.navigate('CategoryScreen', { title: 'Novidades', animeList: newReleases }))}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {newReleases.map((item) => (
                        <View key={item.id}>{renderAnimeCard({ item })}</View>
                    ))}
                </ScrollView>
                {renderSectionHeader('Populares', () => navigation.navigate('CategoryScreen', { title: 'Populares', animeList: popularAnime }))}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {popularAnime.map((item) => (
                        <View key={item.id}>{renderAnimeCard({ item })}</View>
                    ))}
                </ScrollView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background.primary },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 35,
        paddingBottom: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    logo: { width: 120, height: 45, marginLeft: -45 },
    headerIcons: { flexDirection: 'row', marginRight: 10 },
    searchHeaderButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    headerIcon: { marginLeft: 15 },
    content: { flex: 1, marginTop: 0 },
    heroContainer: {
        width: width,
        height: 600,
        position: 'relative',
        marginTop: 0,
    },
    heroImage: { width: width, height: 600 },
    heroBackdrop: { position: 'absolute', width, height: 600, opacity: 0.38 },
    heroBackdropShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 15, 29, 0.26)' },
    posterGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', borderRadius: 8 },
    heroGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 200,
    },
    heroContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
    },
    heroTitle: {
        color: COLORS.text.main,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    heroDescription: {
        color: COLORS.text.muted,
        fontSize: 14,
        marginBottom: 16,
        maxWidth: width - 40,
    },
    watchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 50,
        paddingVertical: 18,
        borderRadius: 25,
        alignSelf: 'flex-start',
        minWidth: 280,
        justifyContent: 'center',
    },
    watchButtonText: {
        color: COLORS.background.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    heroButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    favoriteButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginTop: 30,
    },
    sectionTitle: { color: COLORS.text.main, fontSize: 18, fontWeight: 'bold' },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        color: COLORS.primary,
        fontSize: 14,
        marginRight: 4,
    },
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
