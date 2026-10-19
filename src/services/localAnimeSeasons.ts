import { Episode, Season } from '../routes/types';

type SeasonPart = { name: string; count: number; offset: number };

const knownParts: Record<string, SeasonPart[]> = {
    'black clover': [
        { name: 'Season 1 Part 1', count: 51, offset: 0 },
        { name: 'Season 1 Part 2', count: 51, offset: 51 },
        { name: 'Season 1 Part 3', count: 52, offset: 102 },
        { name: 'Season 1 Part 4', count: 16, offset: 154 },
        { name: 'SP: OVA', count: 1, offset: 170 },
        { name: 'Season 2', count: 2, offset: 171 },
    ],
    'jujutsu kaisen': [
        { name: 'Temporada 1', count: 24, offset: 0 },
        { name: 'Temporada 2', count: 23, offset: 24 },
    ],
    'demon slayer': [{ name: 'Temporadas 1–4', count: 63, offset: 0 }],
    'attack on titan': [{ name: 'Temporadas 1–4', count: 87, offset: 0 }],
    'my hero academia': [{ name: 'Temporadas 1–7', count: 138, offset: 0 }],
    'one piece': [
        { name: 'East Blue (001-061)', count: 61, offset: 0 },
        { name: 'Alabasta (62-143)', count: 82, offset: 61 },
        { name: 'Skypiea (144-206)', count: 63, offset: 143 },
        { name: 'Water Seven / Enies Lobby (207-336)', count: 130, offset: 206 },
        { name: 'Thriller Bark / Sabaody (337-421)', count: 85, offset: 336 },
        { name: 'Marineford (422-516)', count: 95, offset: 421 },
    ],
    'hunter x hunter': [{ name: 'Série (2011)', count: 148, offset: 0 }],
    'dr. stone': [{ name: 'Temporadas 1–4', count: 81, offset: 0 }],
    'spy x family': [
        { name: 'Temporada 1', count: 25, offset: 0 },
        { name: 'Temporada 2', count: 12, offset: 25 },
        { name: 'Temporada 3', count: 13, offset: 37 },
    ],
    'kaguya-sama': [{ name: 'Temporadas 1–3', count: 37, offset: 0 }],
    'violet evergarden': [{ name: 'Série principal', count: 13, offset: 0 }],
    'tensei shitara slime datta ken': [
        { name: 'Temporada 1', count: 24, offset: 0 },
        { name: 'Temporada 2', count: 24, offset: 24 },
        { name: 'Temporada 3', count: 24, offset: 48 },
    ],
    'mushoku tensei': [
        { name: 'Temporada 1', count: 23, offset: 0 },
        { name: 'Temporada 2', count: 24, offset: 23 },
        { name: 'Temporada 3', count: 12, offset: 47 },
    ],
    're:zero': [
        { name: 'Temporada 1', count: 25, offset: 0 },
        { name: 'Temporada 2', count: 25, offset: 25 },
        { name: 'Temporada 3', count: 16, offset: 50 },
    ],
    'naruto shippuden': [{ name: 'Série principal (metade)', count: 250, offset: 0 }],
    'dragon ball z': [{ name: 'Série principal', count: 153, offset: 0 }],
    'dragon ball daima': [{ name: 'Temporada 1', count: 20, offset: 0 }],
    'dragon ball super': [{ name: 'Série', count: 50, offset: 0 }],
    bleach: [
        { name: 'Série principal', count: 183, offset: 0 },
        { name: 'Thousand-Year Blood War', count: 40, offset: 183 },
    ],
    'bleach: tybw': [{ name: 'Thousand-Year Blood War', count: 40, offset: 0 }],
    horimiya: [
        { name: 'Temporada 1', count: 13, offset: 0 },
        { name: 'The Missing Pieces', count: 13, offset: 13 },
    ],
    'k-on!': [{ name: 'Temporadas 1–2', count: 39, offset: 0 }],
    'steins;gate': [{ name: 'Série principal', count: 24, offset: 0 }],
    'psycho-pass': [{ name: 'Temporadas 1–3', count: 41, offset: 0 }],
    'toradora!': [{ name: 'Série principal', count: 25, offset: 0 }],
    clannad: [{ name: 'Temporadas 1–2', count: 47, offset: 0 }],
    overlord: [{ name: 'Temporadas 1–4', count: 52, offset: 0 }],
    berserk: [{ name: 'Série (1997)', count: 25, offset: 0 }],
    'vinland saga': [{ name: 'Temporadas 1–2', count: 48, offset: 0 }],
    'chainsaw man': [{ name: 'Temporada 1', count: 12, offset: 0 }],
    'blue exorcist': [{ name: 'Shimane Illuminati Saga', count: 12, offset: 0 }],
    'ranma 1/2': [{ name: 'Temporada 1', count: 12, offset: 0 }],
    'sakamoto days': [{ name: 'Temporada 1', count: 12, offset: 0 }],
    'sousou no frieren': [{ name: 'Temporada 1', count: 28, offset: 0 }],
    'your name': [{ name: 'Filme', count: 1, offset: 0 }],
};

const aliases: Record<string, string> = {
    'bleach tybw': 'bleach: tybw',
    'bleach thousand year blood war': 'bleach: tybw',
    'tensei shitara slime data ken': 'tensei shitara slime datta ken',
    slime: 'tensei shitara slime datta ken',
    mushoku: 'mushoku tensei',
    'jobless reincarnation': 'mushoku tensei',
    're zero': 're:zero',
    'spy family': 'spy x family',
    frieren: 'sousou no frieren',
    'sousou no friere': 'sousou no frieren',
    'blue exorcist shimane': 'blue exorcist',
    'ranma ½': 'ranma 1/2',
    'kimi no na wa': 'your name',
    'dr stone': 'dr. stone',
    'k-on': 'k-on!',
    'steins gate': 'steins;gate',
    'psycho pass': 'psycho-pass',
    toradora: 'toradora!',
    dbz: 'dragon ball z',
    daima: 'dragon ball daima',
};

const normalizeTitle = (title: string) =>
    title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, '')
        .replace(/\s+/g, ' ')
        .trim();

const stripSeasonSuffix = (title: string) =>
    title
        .replace(/\s*[:\-–—]\s*s(?:eason)?\s*\d+\b.*$/i, '')
        .replace(/\s+s(?:eason)?\s*\d+\b.*$/i, '')
        .replace(/\s+part\s*\d+\b.*$/i, '')
        .replace(/\s+\d+$/i, '')
        .trim();

function resolveKnownKey(title: string): string | null {
    const normalized = normalizeTitle(title);
    if (knownParts[normalized]) return normalized;
    if (aliases[normalized] && knownParts[aliases[normalized]]) return aliases[normalized];

    const stripped = stripSeasonSuffix(normalized);
    if (knownParts[stripped]) return stripped;
    if (aliases[stripped] && knownParts[aliases[stripped]]) return aliases[stripped];

    const keys = Object.keys(knownParts).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (normalized.includes(key) || stripped.includes(key) || key.includes(stripped)) return key;
    }
    for (const [alias, target] of Object.entries(aliases)) {
        if (normalized.includes(alias) || stripped.includes(alias)) return target;
    }
    return null;
}

export function parseEpisodeCount(declaredCount?: string, fallback = 24): number {
    if (!declaredCount) return fallback;
    const lower = declaredCount.toLowerCase();
    if (lower.includes('movie') || lower.includes('filme')) return 1;
    const match = declaredCount.match(/(\d+)/);
    if (!match) return fallback;
    return Math.max(1, Number.parseInt(match[1], 10));
}

export function getLocalAnimeSeasons(title: string, declaredCount?: string): Season[] {
    const key = resolveKnownKey(title);
    if (key) {
        return knownParts[key].map(({ name, count, offset }) => createSeason(name, count, offset));
    }

    const count = Math.min(parseEpisodeCount(declaredCount, 24), 60);
    return [createSeason(count === 1 ? 'Filme' : 'Temporada 1', count, 0)];
}

function createSeason(name: string, count: number, offset: number): Season {
    const episodes: Episode[] = Array.from({ length: count }, (_, index) => ({
        id: `local-${offset + index + 1}`,
        title: `Episódio ${offset + index + 1}`,
        duration: '24m',
    }));
    return { id: name, name, episodes };
}
