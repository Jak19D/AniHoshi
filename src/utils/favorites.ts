import AsyncStorage from '@react-native-async-storage/async-storage';

export type FavoriteAnime = {
    id: string;
    title: string;
    image: string;
    rating?: string;
    year?: string;
    genre?: string;
    episodes?: string;
    chapters?: string;
    description?: string;
    type?: 'anime' | 'manga';
};

const getUserFavoritesKey = (email: string) => `favorites_${email}`;
const getUserFavoriteDataKey = (email: string) => `favoriteAnimeData_${email}`;
const LEGACY_FAVORITE_DATA_KEY = 'favoriteAnimeData';

export const getAnimeKey = (title: string) =>
    title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

export async function getCurrentUserEmail(): Promise<string | null> {
    return AsyncStorage.getItem('currentUser');
}

export async function loadFavoriteAnimeList(): Promise<FavoriteAnime[]> {
    const email = await getCurrentUserEmail();
    if (!email) return [];

    const storedIds = await AsyncStorage.getItem(getUserFavoritesKey(email));
    let storedData = await AsyncStorage.getItem(getUserFavoriteDataKey(email));

    if (!storedData) {
        const legacy = await AsyncStorage.getItem(LEGACY_FAVORITE_DATA_KEY);
        if (legacy) {
            storedData = legacy;
            await AsyncStorage.setItem(getUserFavoriteDataKey(email), legacy);
            await AsyncStorage.removeItem(LEGACY_FAVORITE_DATA_KEY);
        }
    }

    const favIds: string[] = storedIds ? JSON.parse(storedIds) : [];
    const allAnime: FavoriteAnime[] = storedData ? JSON.parse(storedData) : [];

    if (favIds.length === 0) return [];

    const byKey = new Map<string, FavoriteAnime>();

    for (const anime of allAnime) {
        const key = getAnimeKey(anime.title);
        if (!key) continue;

        const isListed =
            favIds.includes(anime.id) ||
            favIds.includes(key) ||
            favIds.some((id) => getAnimeKey(id) === key);

        if (isListed) {
            byKey.set(key, {
                ...anime,
                id: key,
                type: anime.type || 'anime',
            });
        }
    }

    return Array.from(byKey.values());
}

export async function loadFavoriteKeys(): Promise<Set<string>> {
    const list = await loadFavoriteAnimeList();
    return new Set(list.map((a) => getAnimeKey(a.title)));
}

export function isAnimeFavorite(favoriteKeys: Set<string>, title: string): boolean {
    return favoriteKeys.has(getAnimeKey(title));
}

export async function toggleFavoriteAnime(
    anime: FavoriteAnime
): Promise<{ isFavorite: boolean; favorites: FavoriteAnime[] }> {
    const email = await getCurrentUserEmail();
    if (!email) {
        throw new Error('NOT_LOGGED_IN');
    }

    const key = getAnimeKey(anime.title);
    let favorites = await loadFavoriteAnimeList();
    const alreadyFavorite = favorites.some((a) => getAnimeKey(a.title) === key);

    if (alreadyFavorite) {
        favorites = favorites.filter((a) => getAnimeKey(a.title) !== key);
    } else {
        favorites = [
            ...favorites.filter((a) => getAnimeKey(a.title) !== key),
            {
                ...anime,
                id: key || anime.id,
                type: anime.type || 'anime',
            },
        ];
    }

    const ids = favorites.map((a) => a.id);
    await AsyncStorage.setItem(getUserFavoritesKey(email), JSON.stringify(ids));
    await AsyncStorage.setItem(getUserFavoriteDataKey(email), JSON.stringify(favorites));

    return { isFavorite: !alreadyFavorite, favorites };
}
