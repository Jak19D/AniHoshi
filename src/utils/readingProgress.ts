import AsyncStorage from '@react-native-async-storage/async-storage';

export type MangaReadingMode = 'manga' | 'comic' | 'manhwa';

type ReadingProgress = {
    chapterId: string;
    chapterNumber: number;
    mode: MangaReadingMode;
    updatedAt: number;
};

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

async function getProgressKey(mangaTitle: string) {
    const user = await AsyncStorage.getItem('currentUser');
    if (!user) return null;
    return `readingProgress:${normalize(user)}:${normalize(mangaTitle)}`;
}

async function getModeKey(mangaTitle: string) {
    const user = await AsyncStorage.getItem('currentUser');
    if (!user) return null;
    return `readingMode:${normalize(user)}:${normalize(mangaTitle)}`;
}

export async function loadReadingMode(mangaTitle: string): Promise<MangaReadingMode | null> {
    const key = await getModeKey(mangaTitle);
    if (!key) return null;
    const value = await AsyncStorage.getItem(key);
    return value === 'manga' || value === 'comic' || value === 'manhwa' ? value : null;
}

export async function saveReadingMode(mangaTitle: string, mode: MangaReadingMode) {
    const key = await getModeKey(mangaTitle);
    if (key) await AsyncStorage.setItem(key, mode);
}

export async function loadReadingProgress(mangaTitle: string): Promise<ReadingProgress | null> {
    const key = await getProgressKey(mangaTitle);
    if (!key) return null;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try {
        const value = JSON.parse(raw) as ReadingProgress;
        if (typeof value.chapterNumber !== 'number' || typeof value.chapterId !== 'string') return null;
        return value;
    } catch {
        return null;
    }
}

export async function saveReadingProgress(mangaTitle: string, chapterId: string, chapterNumber: number, mode: MangaReadingMode) {
    const key = await getProgressKey(mangaTitle);
    if (!key) return;
    const value: ReadingProgress = { chapterId, chapterNumber, mode, updatedAt: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadReadChapters(mangaTitle: string): Promise<string[]> {
    const key = await getProgressKey(mangaTitle);
    if (!key) return [];
    try {
        const raw = await AsyncStorage.getItem(`${key}:read`);
        const ids: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
    } catch {
        return [];
    }
}

export async function markChapterRead(mangaTitle: string, chapterId: string) {
    const key = await getProgressKey(mangaTitle);
    if (!key) return;
    const current = await loadReadChapters(mangaTitle);
    if (!current.includes(chapterId)) {
        await AsyncStorage.setItem(`${key}:read`, JSON.stringify([...current, chapterId]));
    }
}
