import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Dimensions, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList } from '../routes/types';
import { COLORS } from '../theme/colors';
import { isAnimeFavorite, loadFavoriteKeys } from '../utils/favorites';
import { trendingManga, newReleasesManga, popularManga } from './MangasScreen';
import { getAnimeArtwork, getMangaCover } from '../services/animeArtwork';
import { getOriginalImageUrl } from '../utils/imageUrl';

type Props = {
    navigation?: NavigationProp<MainTabParamList>;
};

const { width } = Dimensions.get('window');

type AnimeItem = {
    id: string;
    title: string;
    image: string;
    genre: string;
    year: string;
    rating: string;
    episodes: string;
    description?: string;
    aliases?: string[];
};

type MangaItem = {
    id: string; title: string; image: string; genre?: string; year?: string;
    rating?: string; chapters?: string; author?: string; description?: string;
};
const mangaCatalog: MangaItem[] = [...trendingManga, ...newReleasesManga, ...popularManga]
    .filter((manga, index, all) => all.findIndex((candidate) => candidate.title === manga.title) === index);

const ANIME_CATEGORIES = [
    { id: '1', name: 'Ação', color: '#455A64', image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', animeList: [
        { id: '1', title: 'Jujutsu Kaisen', image: 'https://animesonline.cloud/wp-content/uploads/2026/01/zKFkzRn1UyE11Jv9CJjVmvmQFvR-200x300.jpg', genre: 'Ação', year: '2020', rating: '9.1', episodes: '24', aliases: ['呪術廻戦', 'jujutsu kaisen', 'feitiçaria'] },
        { id: '2', title: 'Chainsaw Man', image: 'https://animesonline.cloud/wp-content/uploads/2023/12/oeNps5WE8umMVcNISI8M2NHk7jg-200x300.jpg', genre: 'Ação', year: '2022', rating: '8.9', episodes: '12', aliases: ['チェンソーマン', 'homem motosserra', 'chainsawman'] },
        { id: '3', title: 'Demon Slayer', image: 'https://animesonline.cloud/wp-content/uploads/2024/04/Kimetsu-no-Yaiba-Hashira-Geiko-hen.jpg', genre: 'Ação', year: '2019', rating: '9.0', episodes: '44', aliases: ['鬼滅の刃', 'kimetsu no yaiba', 'caçador de demônios', 'cacador de demonios'] },
        { id: '4', title: 'Attack on Titan', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/Jrupd1NbVfhS7D84HLEkvwyxfF-200x300.jpg', genre: 'Ação', year: '2013', rating: '9.5', episodes: '87', aliases: ['進撃の巨人', 'shingeki no kyojin', 'ataque dos titãs', 'ataque dos titas', 'aot'] },
        { id: '5', title: 'My Hero Academia', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/myxWINN4lV2YRtb3DcCi7UFn6C5-225x300.jpg', genre: 'Ação', year: '2016', rating: '8.4', episodes: '138', aliases: ['僕のヒーローアカデミア', 'boku no hero academia', 'academia de heróis', 'academia de herois', 'bnha', 'mha'] },
    ] as AnimeItem[]},
    { id: '2', name: 'Aventura', color: '#689F38', image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', animeList: [
        { id: '1', title: 'One Piece', image: 'https://animesonline.cloud/wp-content/uploads/2023/12/assisitr-one-piece.jpg-212x300.webp', genre: 'Aventura', year: '1999', rating: '9.3', episodes: '1100+', aliases: ['ワンピース', 'onepiece'] },
        { id: '2', title: 'Hunter x Hunter', image: 'https://animesonline.cloud/wp-content/uploads/2024/12/9WxfAQquTun9ATkV6iAeFHMkqxv-200x300.jpg', genre: 'Aventura', year: '2011', rating: '9.4', episodes: '148', aliases: ['ハンター×ハンター', 'hunter hunter', 'hxh'] },
        { id: '3', title: 'Dr. Stone', image: 'https://animesonline.cloud/wp-content/uploads/2025/08/Dr.-Stone-Science-Future.jpg', genre: 'Aventura', year: '2019', rating: '8.5', episodes: '35', aliases: ['ドクターストーン', 'dr stone', 'doutor stone'] },
    ] as AnimeItem[]},
    { id: '3', name: 'Comédia', color: '#D84315', image: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg', animeList: [
        { id: '1', title: 'Spy x Family', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/vDGB41PATBLb5GaXTfG1weZ03Xr-202x300.jpg', genre: 'Comédia', year: '2022', rating: '8.8', episodes: '25', aliases: ['スパイファミリー', 'spy family', 'família espiã', 'familia espia'] },
        { id: '2', title: 'Kaguya-sama', image: 'https://animesonline.cloud/wp-content/uploads/2025/06/Kaguya-sama-Love-is-War-Ultra-Romantic.jpg', genre: 'Comédia', year: '2019', rating: '8.9', episodes: '37', aliases: ['かぐや様は告らせたい', 'kaguya sama', 'love is war', 'kaguya-sama love is war'] },
    ] as AnimeItem[]},
    { id: '4', name: 'Drama', color: '#283593', image: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', animeList: [
        { id: '1', title: 'Violet Evergarden', image: 'https://animesonline.cloud/wp-content/uploads/2025/01/Violet-Evergarden.jpg', genre: 'Drama', year: '2018', rating: '9.0', episodes: '13', aliases: ['ヴァイオレット・エヴァーガーデン', 'violeta evergarden'] },
        { id: '2', title: 'Your Name', image: 'https://animesonline.cloud/wp-content/uploads/2025/03/Your-Name.jpg', genre: 'Drama', year: '2016', rating: '9.1', episodes: 'Movie', aliases: ['君の名は', 'kimi no na wa', 'seu nome'] },
    ] as AnimeItem[]},
    { id: '5', name: 'Fantasia', color: '#E65100', image: 'https://cdn.myanimelist.net/images/anime/1006/123909.jpg', animeList: [
        { id: '1', title: 'Tensei Shitara Slime Datta Ken', image: 'https://animesonline.cloud/wp-content/uploads/2026/05/eboMISzbfsu9bAp4GYVa6nzDma1-204x300.jpg', genre: 'Isekai, Fantasia, Aventura, Comédia', year: '2018', rating: '8.8', episodes: '48+', aliases: ['転生したらスライムだった件', 'that time i got reincarnated as a slime', 'reencarnei como um slime', 'tensei slime', 'slime'] },
        { id: '2', title: 'Mushoku Tensei', image: 'https://animesonline.cloud/wp-content/uploads/2026/07/gLKOYIMyKlUHW0SVdskhgf9C0yy-200x300.jpg', genre: 'Fantasia', year: '2021', rating: '9.1', episodes: '24+', aliases: ['無職転生', 'jobless reincarnation', 'reencarnação sem emprego', 'mushoku'] },
        { id: '3', title: 'Re:Zero', image: 'https://imgs.search.brave.com/rKK8q8sdTKgRJPXP9fz297b-YpFNNKRn2hrPFE7Fgyg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzA0LzZm/L2NiLzA0NmZjYjFk/MTIwMzU1ODJlNjM1/ZTA3OGU4ZjFlMmMz/LmpwZw', genre: 'Fantasia', year: '2016', rating: '8.9', episodes: '50', aliases: ['リゼロ', 're zero', 're:zero kara hajimeru isekai seikatsu', 'starting life in another world'] },
    ] as AnimeItem[]},
    { id: '6', name: 'Shounen', color: '#1565C0', image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', animeList: [
        { id: '1', title: 'Naruto Shippuden', image: 'https://animesonline.cloud/wp-content/uploads/2025/09/deEUrpqhTDhxkSbZHv81LPPjYwq-200x300.jpg', genre: 'Ação', year: '2007', rating: '8.7', episodes: '500', aliases: ['ナルト疾風伝', 'naruto', 'naruto shippuden'] },
        { id: '2', title: 'Dragon Ball Z', image: 'https://animesonline.cloud/wp-content/uploads/2024/03/f2zhRLqwRLrKhEMeIM7Z5buJFo3-200x300.jpg', genre: 'Ação', year: '1989', rating: '9.0', episodes: '153', aliases: ['ドラゴンボールZ', 'dragon ball', 'dbz', 'bola do dragão'] },
        { id: 'black-clover', title: 'Black Clover', image: 'https://cdn.myanimelist.net/images/anime/2/88336.jpg', genre: 'Ação, Fantasia', year: '2017', rating: '8.2', episodes: '170', aliases: ['ブラッククローバー', 'black clover'] },
        { id: '3', title: 'Bleach', image: 'https://animesonline.cloud/wp-content/uploads/2004/10/rtrtgfrew56t6tyiuj-200x300.jpg', genre: 'Ação', year: '2004', rating: '8.2', episodes: '366', aliases: ['ブリーチ', 'bleach'] },
    ] as AnimeItem[]},
    { id: '7', name: 'Slice of Life', color: '#AD1457', image: 'https://cdn.myanimelist.net/images/anime/1738/138445.jpg', animeList: [
        { id: '1', title: 'Horimiya', image: 'https://animesonline.cloud/wp-content/uploads/2025/02/Horimiya.jpg', genre: 'Slice of Life', year: '2021', rating: '8.5', episodes: '13', aliases: ['ホリミヤ', 'horimiya'] },
        { id: '2', title: 'K-On!', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/K-On.jpg', genre: 'Slice of Life', year: '2009', rating: '8.3', episodes: '39', aliases: ['けいおん!', 'k-on', 'keion'] },
    ] as AnimeItem[]},
    { id: '8', name: 'Sci-Fi', color: '#4E342E', image: 'https://cdn.myanimelist.net/images/anime/1522/128844.jpg', animeList: [
        { id: '1', title: 'Steins;Gate', image: 'https://animesonline.cloud/wp-content/uploads/2025/07/Steins-Gate.jpg', genre: 'Sci-Fi', year: '2011', rating: '9.1', episodes: '24', aliases: ['シュタインズ・ゲート', 'steins gate', 'steinsgate'] },
        { id: '2', title: 'Psycho-Pass', image: 'https://animesonline.cloud/wp-content/uploads/2025/01/Psycho-Pass.jpg', genre: 'Sci-Fi', year: '2012', rating: '8.6', episodes: '41', aliases: ['サイコパス', 'psycho pass', 'psychopass'] },
    ] as AnimeItem[]},
    { id: '9', name: 'Romance', color: '#C2185B', image: 'https://cdn.myanimelist.net/images/anime/5/17921.jpg', animeList: [
        { id: '1', title: 'Toradora!', image: 'https://animesonline.cloud/wp-content/uploads/2025/03/Toradora.jpg', genre: 'Romance', year: '2008', rating: '8.7', episodes: '25', aliases: ['とらドラ!', 'toradora'] },
        { id: '2', title: 'Clannad', image: 'https://animesonline.cloud/wp-content/uploads/2025/06/Clannad.jpg', genre: 'Romance', year: '2007', rating: '8.8', episodes: '47', aliases: ['クラナド', 'clannad'] },
    ] as AnimeItem[]},
    { id: '10', name: 'Isekai', color: '#7B1FA2', image: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg', animeList: [
        { id: '1', title: 'Re:Zero', image: 'https://imgs.search.brave.com/rKK8q8sdTKgRJPXP9fz297b-YpFNNKRn2hrPFE7Fgyg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzA0LzZm/L2NiLzA0NmZjYjFk/MTIwMzU1ODJlNjM1/ZTA3OGU4ZjFlMmMz/LmpwZw', genre: 'Fantasia', year: '2016', rating: '8.9', episodes: '50', aliases: ['リゼロ', 're zero', 're:zero kara hajimeru isekai seikatsu', 'starting life in another world'] },
        { id: '2', title: 'Overlord', image: 'https://animesonline.cloud/wp-content/uploads/2025/08/Overlord.jpg', genre: 'Fantasia', year: '2015', rating: '8.4', episodes: '52', aliases: ['オーバーロード', 'overlord'] },
    ] as AnimeItem[]},
    { id: '11', name: 'Seinen', color: '#37474F', image: 'https://cdn.myanimelist.net/images/anime/1790/114807.jpg', animeList: [
        { id: '1', title: 'Berserk', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/Berserk.jpg', genre: 'Ação', year: '1997', rating: '9.0', episodes: '25', aliases: ['ベルセルク', 'berserk', 'espada do berserker'] },
        { id: '2', title: 'Vinland Saga', image: 'https://animesonline.cloud/wp-content/uploads/2025/07/Vinland-Saga.jpg', genre: 'Ação', year: '2019', rating: '8.9', episodes: '48', aliases: ['ヴィンランド・サガ', 'vinland saga', 'saga de vinland'] },
    ] as AnimeItem[]},
];

const MANGA_CATEGORIES = [
    { id: '1', name: 'Shounen', color: '#1565C0', image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', animeList: [
        { id: '1', title: 'One Piece', image: 'https://animesonline.cloud/wp-content/uploads/2023/12/assisitr-one-piece.jpg-212x300.webp', genre: 'Aventura', year: '1999', rating: '9.3', episodes: '1100+', aliases: ['ワンピース', 'onepiece'] },
        { id: '2', title: 'Naruto Shippuden', image: 'https://animesonline.cloud/wp-content/uploads/2025/09/deEUrpqhTDhxkSbZHv81LPPjYwq-200x300.jpg', genre: 'Ação', year: '2007', rating: '8.7', episodes: '500', aliases: ['ナルト疾風伝', 'naruto', 'naruto shippuden'] },
    ] as AnimeItem[]},
    { id: '2', name: 'Seinen', color: '#455A64', image: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', animeList: [
        { id: '1', title: 'Berserk', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/Berserk.jpg', genre: 'Ação', year: '1997', rating: '9.0', episodes: '25', aliases: ['ベルセルク', 'berserk', 'espada do berserker'] },
        { id: '2', title: 'Vinland Saga', image: 'https://animesonline.cloud/wp-content/uploads/2025/07/Vinland-Saga.jpg', genre: 'Ação', year: '2019', rating: '8.9', episodes: '48', aliases: ['ヴィンランド・サガ', 'vinland saga', 'saga de vinland'] },
    ] as AnimeItem[]},
    { id: '3', name: 'Romance', color: '#AD1457', image: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg', animeList: [
        { id: '1', title: 'Toradora!', image: 'https://animesonline.cloud/wp-content/uploads/2025/03/Toradora.jpg', genre: 'Romance', year: '2008', rating: '8.7', episodes: '25', aliases: ['とらドラ!', 'toradora'] },
        { id: '2', title: 'Clannad', image: 'https://animesonline.cloud/wp-content/uploads/2025/06/Clannad.jpg', genre: 'Romance', year: '2007', rating: '8.8', episodes: '47', aliases: ['クラナド', 'clannad'] },
    ] as AnimeItem[]},
    { id: '4', name: 'Aventura', color: '#689F38', image: 'https://cdn.myanimelist.net/images/anime/10/78745.jpg', animeList: [
        { id: '1', title: 'One Piece', image: 'https://animesonline.cloud/wp-content/uploads/2023/12/assisitr-one-piece.jpg-212x300.webp', genre: 'Aventura', year: '1999', rating: '9.3', episodes: '1100+', aliases: ['ワンピース', 'onepiece'] },
        { id: '2', title: 'Hunter x Hunter', image: 'https://animesonline.cloud/wp-content/uploads/2024/12/9WxfAQquTun9ATkV6iAeFHMkqxv-200x300.jpg', genre: 'Aventura', year: '2011', rating: '9.4', episodes: '148', aliases: ['ハンター×ハンター', 'hunter hunter', 'hxh'] },
    ] as AnimeItem[]},
    { id: '5', name: 'Fantasia', color: '#E65100', image: 'https://cdn.myanimelist.net/images/anime/1006/123909.jpg', animeList: [
        { id: '1', title: 'Tensei Shitara Slime Datta Ken', image: 'https://animesonline.cloud/wp-content/uploads/2026/05/eboMISzbfsu9bAp4GYVa6nzDma1-204x300.jpg', genre: 'Isekai, Fantasia, Aventura, Comédia', year: '2018', rating: '8.8', episodes: '48+', aliases: ['転生したらスライムだった件', 'that time i got reincarnated as a slime', 'reencarnei como um slime', 'slime'] },
        { id: '2', title: 'Mushoku Tensei', image: 'https://animesonline.cloud/wp-content/uploads/2026/07/gLKOYIMyKlUHW0SVdskhgf9C0yy-200x300.jpg', genre: 'Fantasia', year: '2021', rating: '9.1', episodes: '24+', aliases: ['無職転生', 'jobless reincarnation', 'reencarnação sem emprego', 'mushoku'] },
    ] as AnimeItem[]},
    { id: '6', name: 'Isekai', color: '#283593', image: 'https://cdn.myanimelist.net/images/anime/1730/138431.jpg', animeList: [
        { id: '1', title: 'Re:Zero', image: 'https://imgs.search.brave.com/rKK8q8sdTKgRJPXP9fz297b-YpFNNKRn2hrPFE7Fgyg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzA0LzZm/L2NiLzA0NmZjYjFk/MTIwMzU1ODJlNjM1/ZTA3OGU4ZjFlMmMz/LmpwZw', genre: 'Fantasia', year: '2016', rating: '8.9', episodes: '50', aliases: ['リゼロ', 're zero', 'starting life in another world'] },
        { id: '2', title: 'Overlord', image: 'https://animesonline.cloud/wp-content/uploads/2025/08/Overlord.jpg', genre: 'Fantasia', year: '2015', rating: '8.4', episodes: '52', aliases: ['オーバーロード', 'overlord'] },
    ] as AnimeItem[]},
    { id: '7', name: 'Ação', color: '#455A64', image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', animeList: [
        { id: '1', title: 'Jujutsu Kaisen', image: 'https://animesonline.cloud/wp-content/uploads/2026/01/zKFkzRn1UyE11Jv9CJjVmvmQFvR-200x300.jpg', genre: 'Ação', year: '2020', rating: '9.1', episodes: '24', aliases: ['呪術廻戦', 'jujutsu kaisen', 'feitiçaria'] },
        { id: '2', title: 'Chainsaw Man', image: 'https://animesonline.cloud/wp-content/uploads/2023/12/oeNps5WE8umMVcNISI8M2NHk7jg-200x300.jpg', genre: 'Ação', year: '2022', rating: '8.9', episodes: '12', aliases: ['チェンソーマン', 'homem motosserra', 'chainsawman'] },
    ] as AnimeItem[]},
    { id: '8', name: 'Comédia', color: '#D84315', image: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg', animeList: [
        { id: '1', title: 'Spy x Family', image: 'https://animesonline.cloud/wp-content/uploads/2025/10/vDGB41PATBLb5GaXTfG1weZ03Xr-202x300.jpg', genre: 'Comédia', year: '2022', rating: '8.8', episodes: '25', aliases: ['スパイファミリー', 'spy family', 'família espiã', 'familia espia'] },
        { id: '2', title: 'Kaguya-sama', image: 'https://animesonline.cloud/wp-content/uploads/2025/06/Kaguya-sama-Love-is-War-Ultra-Romantic.jpg', genre: 'Comédia', year: '2019', rating: '8.9', episodes: '37', aliases: ['かぐや様は告らせたい', 'kaguya sama', 'love is war'] },
    ] as AnimeItem[]},
    { id: '9', name: 'Drama', color: '#283593', image: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', animeList: [
        { id: '1', title: 'Violet Evergarden', image: 'https://animesonline.cloud/wp-content/uploads/2025/01/Violet-Evergarden.jpg', genre: 'Drama', year: '2018', rating: '9.0', episodes: '13', aliases: ['ヴァイオレット・エヴァーガーデン', 'violeta evergarden'] },
        { id: '2', title: 'Your Name', image: 'https://animesonline.cloud/wp-content/uploads/2025/03/Your-Name.jpg', genre: 'Drama', year: '2016', rating: '9.1', episodes: 'Movie', aliases: ['君の名は', 'kimi no na wa', 'seu nome'] },
    ] as AnimeItem[]},
    { id: '10', name: 'Slice of Life', color: '#AD1457', image: 'https://cdn.myanimelist.net/images/anime/1738/138445.jpg', animeList: [
        { id: '1', title: 'Horimiya', image: 'https://animesonline.cloud/wp-content/uploads/2025/02/Horimiya.jpg', genre: 'Slice of Life', year: '2021', rating: '8.5', episodes: '13', aliases: ['ホリミヤ', 'horimiya'] },
        { id: '2', title: 'K-On!', image: 'https://animesonline.cloud/wp-content/uploads/2025/04/K-On.jpg', genre: 'Slice of Life', year: '2009', rating: '8.3', episodes: '39', aliases: ['けいおん!', 'k-on', 'keion'] },
    ] as AnimeItem[]},
    { id: '11', name: 'Sci-Fi', color: '#4E342E', image: 'https://cdn.myanimelist.net/images/anime/1522/128844.jpg', animeList: [
        { id: '1', title: 'Steins;Gate', image: 'https://animesonline.cloud/wp-content/uploads/2025/07/Steins-Gate.jpg', genre: 'Sci-Fi', year: '2011', rating: '9.1', episodes: '24', aliases: ['シュタインズ・ゲート', 'steins gate', 'steinsgate'] },
        { id: '2', title: 'Psycho-Pass', image: 'https://animesonline.cloud/wp-content/uploads/2025/01/Psycho-Pass.jpg', genre: 'Sci-Fi', year: '2012', rating: '8.6', episodes: '41', aliases: ['サイコパス', 'psycho pass', 'psychopass'] },
    ] as AnimeItem[]},
];

const MANGA_CATEGORY_REPRESENTATIVES = [
    'One Piece', 'Berserk', 'Spy x Family', 'Blue Lock',
    'Tensei Shitara Slime Data Ken', 'Mushoku Tensei', 'Jujutsu Kaisen',
    'Chainsaw Man', 'Monster', 'Fullmetal Alchemist', 'Dragon Ball Super',
];

const normalizeSearchText = (text: string) =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const matchesAnimeSearch = (anime: AnimeItem | MangaItem, query: string) => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return false;

    const searchable = [anime.title, ...('aliases' in anime ? anime.aliases || [] : [])]
        .map(normalizeSearchText)
        .filter(Boolean);

    return searchable.some((term) => term.includes(normalizedQuery));
};

export default function SearchScreen({ navigation: tabNavigation }: Props) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'Animes' | 'Mangás'>('Animes');
    const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
    const [searchResults, setSearchResults] = useState<(AnimeItem | MangaItem)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [categoryArtwork, setCategoryArtwork] = useState<Record<string, string>>({});
    const [mangaCoverArtwork, setMangaCoverArtwork] = useState<Record<string, string>>({});

    useEffect(() => {
        let active = true;
        const loadCategoryArtwork = async () => {
            for (const category of ANIME_CATEGORIES) {
                const title = category.animeList[0]?.title;
                const artwork = title ? await getAnimeArtwork(title) : null;
                if (active && artwork?.coverImage) setCategoryArtwork((current) => ({ ...current, [`anime:${category.id}`]: artwork.coverImage! }));
                if (active) await new Promise((resolve) => setTimeout(resolve, 300));
            }
            for (let index = 0; index < MANGA_CATEGORIES.length; index += 1) {
                const category = MANGA_CATEGORIES[index];
                const cover = await getMangaCover(MANGA_CATEGORY_REPRESENTATIVES[index]);
                if (active && cover) setCategoryArtwork((current) => ({ ...current, [`manga:${category.id}`]: cover }));
                if (active) await new Promise((resolve) => setTimeout(resolve, 300));
            }
            for (const manga of mangaCatalog) {
                const cover = await getMangaCover(manga.title);
                if (active && cover) setMangaCoverArtwork((current) => ({ ...current, [manga.title]: cover }));
                if (active) await new Promise((resolve) => setTimeout(resolve, 300));
            }
        };
        void loadCategoryArtwork();
        return () => { active = false; };
    }, []);

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

    useEffect(() => {
        if (isSearching && searchQuery.trim()) {
            runSearch(searchQuery, activeTab);
        }
    }, [activeTab]);

    const currentCategories = activeTab === 'Animes' ? ANIME_CATEGORIES : MANGA_CATEGORIES;

    const runSearch = (query: string, tab: 'Animes' | 'Mangás') => {
        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        const allAnimeList = tab === 'Animes'
            ? ANIME_CATEGORIES.flatMap(cat => cat.animeList || [])
            : mangaCatalog;

        const seen = new Set<string>();
        const filtered = allAnimeList.filter((anime) => {
            if (!matchesAnimeSearch(anime, query)) return false;
            const uniqueKey = `${anime.title}-${anime.image}`;
            if (seen.has(uniqueKey)) return false;
            seen.add(uniqueKey);
            return true;
        });

        setSearchResults(filtered);
        setIsSearching(true);
    };

    const handleSearch = () => {
        runSearch(searchQuery, activeTab);
    };

    const webSearchOptions = activeTab === 'Animes'
        ? [
            { label: 'MyAnimeList', icon: 'globe-outline' as const, url: (query: string) => `https://myanimelist.net/anime.php?q=${encodeURIComponent(query)}` },
            { label: 'AniList', icon: 'search-outline' as const, url: (query: string) => `https://anilist.co/search/anime?search=${encodeURIComponent(query)}` },
            { label: 'Crunchyroll', icon: 'play-circle-outline' as const, url: (query: string) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(query)}` },
        ]
        : [
            { label: 'MyAnimeList', icon: 'globe-outline' as const, url: (query: string) => `https://myanimelist.net/manga.php?q=${encodeURIComponent(query)}` },
            { label: 'AniList', icon: 'search-outline' as const, url: (query: string) => `https://anilist.co/search/manga?search=${encodeURIComponent(query)}` },
            { label: 'MANGA Plus', icon: 'book-outline' as const, url: (query: string) => `https://mangaplus.shueisha.co.jp/search_result?title=${encodeURIComponent(query)}` },
        ];

    const openWebSearch = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error('Não foi possível abrir a busca externa:', error);
            Alert.alert('Não foi possível abrir', 'Tente novamente ou confira se há um navegador disponível no dispositivo.');
        }
    };

    const renderCategory = ({ item }: { item: typeof ANIME_CATEGORIES[0] }) => {
        const categoryManga = mangaCatalog.filter((manga) => manga.genre?.toLowerCase().includes(item.name.toLowerCase()));
        const mangaRepresentative = MANGA_CATEGORY_REPRESENTATIVES[Number(item.id) - 1];
        const mangaFallback = mangaCatalog.find((manga) => manga.title === mangaRepresentative)?.image ?? item.image;
        const animeFallback = item.animeList[0]?.image ?? item.image;
        const cardImage = activeTab === 'Animes'
            ? categoryArtwork[`anime:${item.id}`] ?? animeFallback
            : categoryArtwork[`manga:${item.id}`] ?? mangaFallback;
        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: item.color }]}
                onPress={() => activeTab === 'Animes'
                    ? navigation.navigate('CategoryScreen', { title: item.name, animeList: item.animeList || [] })
                    : navigation.navigate('CategoryScreen', { title: item.name, mangaList: categoryManga.length ? categoryManga : mangaCatalog })}
            >
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Image source={{ uri: cardImage }} style={styles.cardImage} />
            </TouchableOpacity>
        );
    };

    const renderAnimeItem = ({ item }: { item: AnimeItem | MangaItem }) => (
        <TouchableOpacity 
            style={styles.animeCard}
            onPress={() => activeTab !== 'Animes'
                ? navigation.navigate('MangaDetail', { manga: { ...(item as MangaItem), image: mangaCoverArtwork[item.title] || item.image } })
                : navigation.navigate('AnimeDetail', { 
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
            <Image source={{ uri: activeTab !== 'Animes' ? (mangaCoverArtwork[item.title] || item.image) : getOriginalImageUrl(item.image) }} style={styles.animePoster} />
            {isAnimeFavorite(favoriteKeys, item.title) && (
                <View style={styles.favoriteBadge}>
                    <Ionicons name="star" size={14} color={COLORS.primary} />
                </View>
            )}
            <Text style={styles.animeTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {}
            <View style={styles.header}>
                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="O que está procurando?"
                        placeholderTextColor={COLORS.text.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Buscar" onPress={handleSearch} style={styles.searchButton}>
                        <Ionicons name="search" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {}
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

            {}
            {isSearching ? (
                <>
                    <Text style={styles.sectionTitle}>Resultados da busca</Text>
                    {searchResults.length > 0 ? (
                        <FlatList
                            key="search-results-list"
                            data={searchResults}
                            keyExtractor={(item, index) => `${item.id}-${item.title}-${index}`}
                            renderItem={renderAnimeItem}
                            numColumns={2}
                            contentContainerStyle={styles.gridContainer}
                            columnWrapperStyle={styles.row}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.noResults}>
                            <Ionicons name="sparkles-outline" size={32} color={COLORS.primary} />
                            <Text style={styles.noResultsTitle}>Ops! Não encontramos essa obra no AniHoshi ainda.</Text>
                            <Text style={styles.noResultsText}>Você pode procurar “{searchQuery.trim()}” em uma destas plataformas:</Text>
                            <View style={styles.webSearchList}>
                                {webSearchOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.label}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Buscar ${searchQuery.trim()} em ${option.label}`}
                                        style={styles.webSearchButton}
                                        onPress={() => void openWebSearch(option.url(searchQuery.trim()))}
                                    >
                                        <Ionicons name={option.icon} size={20} color={COLORS.primary} />
                                        <Text style={styles.webSearchButtonText}>Buscar em {option.label}</Text>
                                        <Ionicons name="open-outline" size={16} color={COLORS.text.muted} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>Categorias</Text>

                    <FlatList
                        key="categories-list"
                        data={currentCategories}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCategory}
                        numColumns={2}
                        contentContainerStyle={styles.gridContainer}
                        columnWrapperStyle={styles.row}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}
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
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface.secondary,
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 48,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text.main,
        fontSize: 16,
    },
    searchButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginLeft: 10,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
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
    sectionTitle: {
        color: COLORS.text.main,
        fontSize: 20,
        fontWeight: 'bold',
        paddingHorizontal: 15,
        marginBottom: 15,
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
        height: 90,
        borderRadius: 12,
        padding: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    cardTitle: {
        color: COLORS.text.main,
        fontSize: 16,
        fontWeight: 'bold',
        zIndex: 2,
    },
    cardImage: {
        width: 65,
        height: 95,
        position: 'absolute',
        right: -15,
        bottom: -10,
        transform: [{ rotate: '-15deg' }],
        opacity: 0.9,
    },
    animeCard: {
        width: (width - 45) / 2,
        marginRight: 15,
        position: 'relative',
    },
    animePoster: {
        width: '100%',
        height: 180,
        borderRadius: 8,
    },
    animeTitle: {
        color: COLORS.text.main,
        fontSize: 12,
        marginTop: 5,
        textAlign: 'center',
        fontWeight: '600',
    },
    favoriteBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        padding: 4,
    },
    noResults: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 32,
    },
    noResultsTitle: {
        color: COLORS.text.main,
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    noResultsText: {
        color: COLORS.text.muted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    webSearchList: {
        width: '100%',
        marginTop: 16,
        gap: 10,
    },
    webSearchButton: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.surface.secondary,
        backgroundColor: COLORS.surface.primary,
    },
    webSearchButtonText: {
        flex: 1,
        color: COLORS.text.main,
        fontSize: 14,
        fontWeight: '600',
    },
});
