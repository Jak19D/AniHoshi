import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredUser = { email: string; password: string };
type RatingEntry = { animeKey: string; user: string; value: number };

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

export async function deleteLocalAccountData(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const [storedUsers, storedRatings, allKeys] = await Promise.all([
        AsyncStorage.getItem('users'),
        AsyncStorage.getItem('animeUserRatings'),
        AsyncStorage.getAllKeys(),
    ]);

    let users: StoredUser[] = [];
    let ratings: RatingEntry[] = [];
    try {
        users = storedUsers ? JSON.parse(storedUsers) as StoredUser[] : [];
        ratings = storedRatings ? JSON.parse(storedRatings) as RatingEntry[] : [];
        if (!Array.isArray(users) || !Array.isArray(ratings)) throw new Error('INVALID_ACCOUNT_DATA');
    } catch {
        throw new Error('INVALID_ACCOUNT_DATA');
    }

    const remainingUsers = users.filter((user) => user.email.toLowerCase() !== normalizedEmail);
    const remainingRatings = ratings.filter((rating) => rating.user.toLowerCase() !== normalizedEmail);
    const userToken = normalize(normalizedEmail);
    const exactKeys = new Set([
        `favorites_${normalizedEmail}`,
        `favoriteAnimeData_${normalizedEmail}`,
        `userName_${normalizedEmail}`,
        `profileImage_${normalizedEmail}`,
        `coverImage_${normalizedEmail}`,
        `profileImageDefaultRestored_${normalizedEmail}`,
    ]);
    const accountKeys = allKeys.filter((key) => {
        const lowerKey = key.toLowerCase();
        return exactKeys.has(key)
            || lowerKey === 'currentuser'
            || lowerKey.startsWith(`readingprogress:${userToken}:`)
            || lowerKey.startsWith(`readingmode:${userToken}:`);
    });

    if (remainingUsers.length) await AsyncStorage.setItem('users', JSON.stringify(remainingUsers));
    else await AsyncStorage.removeItem('users');

    if (remainingRatings.length) await AsyncStorage.setItem('animeUserRatings', JSON.stringify(remainingRatings));
    else await AsyncStorage.removeItem('animeUserRatings');

    if (accountKeys.length) await AsyncStorage.multiRemove(accountKeys);
}
