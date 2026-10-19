import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnimeKey } from './favorites';

type RatingEntry = { animeKey: string; user: string; value: number };
const STORAGE_KEY = 'animeUserRatings';

export async function loadAnimeRating(animeTitle: string): Promise<{ mine: number; average: number | null; count: number }> {
    const user = await AsyncStorage.getItem('currentUser');
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const entries: RatingEntry[] = raw ? JSON.parse(raw) : [];
    const animeKey = getAnimeKey(animeTitle);
    const matching = entries.filter((entry) => entry.animeKey === animeKey);
    const mine = matching.find((entry) => entry.user === user)?.value ?? 0;
    return {
        mine,
        average: matching.length ? matching.reduce((sum, entry) => sum + entry.value, 0) / matching.length : null,
        count: matching.length,
    };
}

export async function saveAnimeRating(animeTitle: string, value: number): Promise<{ average: number; count: number }> {
    const user = await AsyncStorage.getItem('currentUser');
    if (!user) throw new Error('NOT_LOGGED_IN');
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const entries: RatingEntry[] = raw ? JSON.parse(raw) : [];
    const animeKey = getAnimeKey(animeTitle);
    const next = entries.filter((entry) => !(entry.animeKey === animeKey && entry.user === user));
    next.push({ animeKey, user, value: Math.max(1, Math.min(5, Math.round(value))) });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    const matching = next.filter((entry) => entry.animeKey === animeKey);
    return { average: matching.reduce((sum, entry) => sum + entry.value, 0) / matching.length, count: matching.length };
}
