import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AnimeDetailParams, Episode, MangaChapter } from '../routes/types';

export type MediaBucket =
    | 'anime-episodes'
    | 'manga-chapters'
    | 'anime-covers'
    | 'manga-covers'
    | 'profile-images';

export type StoredMediaAsset = {
    provider: 'supabase';
    bucket: MediaBucket;
    path: string;
};

export type MediaReference = string | StoredMediaAsset;

export type AnimeMediaAssets = {
    cover: string | null;
    banner: string | null;
};

export type MangaMediaAssets = { cover: string | null };

export interface MediaRepository {
    resolve(reference: MediaReference): Promise<string | null>;
    resolvePages(pagePaths?: string[] | null, legacyPages?: string[] | null): Promise<string[]>;
    getAnimeAssets(animeId: string, fallback: AnimeDetailParams): Promise<AnimeMediaAssets>;
    getMangaAssets(mangaId: string, fallback: string): Promise<MangaMediaAssets>;
    getAnimeEpisodes(animeId: string, animeTitle?: string): Promise<Episode[]>;
    getMangaChapters(mangaId: string, mangaTitle?: string): Promise<MangaChapter[]>;
}

function toMediaSlug(title?: string): string | null {
    if (!title) return null;
    return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || null;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabase = supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            flowType: 'pkce',
            detectSessionInUrl: false,
        },
    })
    : null;

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function isDirectUrl(value: string): boolean {
    return /^(https?:|file:|content:)/i.test(value);
}

async function resolvePath(bucket: MediaBucket, path: string): Promise<string | null> {
    if (!supabase) return null;
    const normalizedPath = path.replace(/^\/+/, '');
    if (!normalizedPath || normalizedPath.split('/').some((part) => part === '..')) {
        throw new Error('INVALID_STORAGE_PATH');
    }
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(normalizedPath, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;
    return data.signedUrl;
}

async function resolvePageList(pagePaths?: string[] | null, legacyPages?: string[] | null): Promise<string[]> {
    if (pagePaths?.length) {
        return (await Promise.all(pagePaths.map((path) => resolvePath('manga-chapters', path))))
            .filter((url): url is string => Boolean(url));
    }

    return (await Promise.all((legacyPages ?? []).map((value) =>
        isDirectUrl(value) ? Promise.resolve(value) : resolvePath('manga-chapters', value),
    ))).filter((url): url is string => Boolean(url));
}

export const mediaRepository: MediaRepository = {
    async resolve(reference) {
        if (typeof reference === 'string') return isDirectUrl(reference) ? reference : null;
        return resolvePath(reference.bucket, reference.path);
    },

    resolvePages: resolvePageList,

    async getAnimeAssets(animeId, fallback) {
        if (!supabase) return { cover: fallback.image, banner: fallback.bannerImage ?? fallback.image };
        const { data, error } = await supabase.from('animes')
            .select('cover_path, cover_url, banner_path, banner_url')
            .eq('id', animeId)
            .maybeSingle();
        if (error) throw error;
        if (!data) return { cover: fallback.image, banner: fallback.bannerImage ?? fallback.image };

        const [coverAsset, bannerAsset] = await Promise.all([
            data.cover_path
                ? resolvePath('anime-covers', data.cover_path)
                : data.cover_url ?? fallback.image,
            data.banner_path
                ? resolvePath('anime-covers', data.banner_path)
                : data.banner_url ?? null,
        ]);
        return { cover: coverAsset, banner: bannerAsset ?? coverAsset ?? fallback.bannerImage ?? fallback.image };
    },

    async getMangaAssets(mangaId, fallback) {
        if (!supabase) return { cover: fallback };
        const { data, error } = await supabase.from('mangas')
            .select('cover_path, cover_url')
            .eq('id', mangaId)
            .maybeSingle();
        if (error) throw error;
        if (!data) return { cover: fallback };
        return {
            cover: data.cover_path
                ? await resolvePath('manga-covers', data.cover_path)
                : data.cover_url ?? fallback,
        };
    },

    async getAnimeEpisodes(animeId, animeTitle) {
        if (!supabase) return [];
        const animeSlug = toMediaSlug(animeTitle);
        const animeIds = animeSlug && animeSlug !== animeId ? [animeId, animeSlug] : [animeId];
        const { data, error } = await supabase.from('anime_episodes')
            .select('id, season_number, number, title, duration, video_url, video_path, thumbnail_url, thumbnail_path')
            .in('anime_id', animeIds)
            .order('season_number', { ascending: true })
            .order('number', { ascending: true });
        if (error) throw error;

        return Promise.all(((data ?? []) as {
            id: string; season_number: number; number: number; title: string; duration: string | null;
            video_url: string | null; video_path: string | null; thumbnail_url: string | null;
            thumbnail_path: string | null;
        }[]).map(async (row) => ({
            id: row.id,
            seasonNumber: row.season_number,
            title: `${row.number} - ${row.title}`,
            duration: row.duration ?? undefined,
            videoUrl: row.video_url ?? undefined,
            thumbnail: row.thumbnail_path
                ? await resolvePath('anime-episodes', row.thumbnail_path) ?? undefined
                : row.thumbnail_url ?? undefined,
            asset: row.video_path
                ? { provider: 'supabase' as const, bucket: 'anime-episodes' as const, path: row.video_path }
                : undefined,
        })));
    },

    async getMangaChapters(mangaId, mangaTitle) {
        if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('AUTH_SESSION_MISSING');
        const mangaSlug = toMediaSlug(mangaTitle);
        const isDemonSlayer = mangaSlug === 'demon-slayer' || mangaSlug === 'kimetsu-no-yaiba';
        const mangaIds = Array.from(new Set([
            mangaId,
            mangaSlug,
            ...(isDemonSlayer ? ['manga-4', 'demon-slayer', 'kimetsu-no-yaiba'] : []),
        ].filter((id): id is string => Boolean(id))));
        const { data, error } = await supabase.from('manga_chapters')
            .select('id, number, title, pdf_path, pdf_url, page_paths, pages')
            .in('manga_id', mangaIds)
            .order('number', { ascending: true });
        if (error) throw error;

        return Promise.all(((data ?? []) as {
            id: string; number: number; title: string; pdf_path: string | null;
            pdf_url: string | null; page_paths: string[] | null; pages: unknown;
        }[]).map(async (row) => {
            const legacyPages = Array.isArray(row.pages)
                ? row.pages.filter((page): page is string => typeof page === 'string')
                : null;
            return {
                id: row.id,
                number: row.number,
                title: row.title,
                pdfUrl: row.pdf_url ?? undefined,
                pages: await resolvePageList(row.page_paths, legacyPages),
                asset: row.pdf_path
                    ? { provider: 'supabase' as const, bucket: 'manga-chapters' as const, path: row.pdf_path }
                    : undefined,
            };
        }));
    },
};
