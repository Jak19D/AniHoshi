export type AnimeArtwork = {
    bannerImage: string | null;
    coverImage: string | null;
    malId: number | null;
    synopsis: string | null;
};

const cache = new Map<string, AnimeArtwork>();
const mangaCoverCache = new Map<string, string | null>();
const malFullCache = new Map<string, Promise<any | null>>();

export async function getAnimeArtwork(title: string): Promise<AnimeArtwork | null> {
    const key = title.trim().toLowerCase();
    if (cache.has(key)) return cache.get(key)!;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                query: `query ($search: String) { Media(search: $search, type: ANIME) { title { romaji english } description(asHtml: false) bannerImage coverImage { extraLarge large } idMal } }`,
                variables: { search: title },
            }),
        });
        if (!response.ok) return null;
        const payload = await response.json();
        const media = payload?.data?.Media;
        if (!media) return null;
        const result = {
            bannerImage: media.bannerImage ?? null,
            coverImage: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
            malId: media.idMal ?? null,
            synopsis: cleanSynopsis(media.description),
        };
        cache.set(key, result);
        return result;
    } catch {
        return null;
    }
}

export async function getMangaCover(title: string): Promise<string | null> {
    const key = title.trim().toLowerCase();
    if (mangaCoverCache.has(key)) return mangaCoverCache.get(key)!;
    if (key === 'demon slayer' || key === 'kimetsu no yaiba') {
        const cover = 'https://shop.viz.com/cdn/shop/files/white-9781974700523_1500x.jpg?v=1743521852';
        mangaCoverCache.set(key, cover);
        return cover;
    }
    if (key === 'bleach' || key.startsWith('bleach:')) {
        const cover = 'https://dw9to29mmj727.cloudfront.net/products/1591164419.jpg';
        mangaCoverCache.set(key, cover);
        return cover;
    }
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                query: `query ($search: String) { Media(search: $search, type: MANGA) { coverImage { extraLarge large } } }`,
                variables: { search: title },
            }),
        });
        if (!response.ok) return null;
        const payload = await response.json();
        const cover = payload?.data?.Media?.coverImage?.extraLarge ?? payload?.data?.Media?.coverImage?.large ?? null;
        if (cover) mangaCoverCache.set(key, cover);
        return cover;
    } catch {
        return null;
    }
}

export type ExternalAnimeRating = { score: number; count: number; synopsis: string | null };

async function getMalFull(type: 'anime' | 'manga', malId: number): Promise<any | null> {
    const key = `${type}:${malId}`;
    const cached = malFullCache.get(key);
    if (cached) return cached;
    const request = fetch(`https://api.jikan.moe/v4/${type}/${malId}/full`)
        .then(async (response) => response.ok ? (await response.json())?.data ?? null : null)
        .catch(() => null);
    malFullCache.set(key, request);
    return request;
}

function cleanSynopsis(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    return value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').trim();
}

export async function getMalRating(malId: number | null): Promise<ExternalAnimeRating | null> {
    if (!malId) return null;
    try {
        const data = await getMalFull('anime', malId);
        if (!data) return null;
        const score = Number(data.score);
        const count = Number(data.scored_by);
        return Number.isFinite(score) && Number.isFinite(count)
            ? { score, count, synopsis: cleanSynopsis(data.synopsis) }
            : null;
    } catch {
        return null;
    }
}

export async function getMangaSynopsis(title: string): Promise<string | null> {
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                query: `query ($search: String) { Media(search: $search, type: MANGA) { idMal } }`,
                variables: { search: title },
            }),
        });
        if (!response.ok) return null;
        const payload = await response.json();
        const malId = Number(payload?.data?.Media?.idMal);
        if (!Number.isFinite(malId) || malId <= 0) return null;
        const data = await getMalFull('manga', malId);
        return cleanSynopsis(data?.synopsis);
    } catch {
        return null;
    }
}
