import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Episode, MangaChapter } from '../routes/types';

export type StoredMediaAsset = {
    provider: 'supabase';
    bucket: 'anime-episodes' | 'manga-chapters';
    path: string;
};

export type MediaReference = string | StoredMediaAsset;

export interface MediaRepository {
    resolve(reference: MediaReference): Promise<string | null>;
    getAnimeEpisodes(animeId: string): Promise<Episode[]>;
    getMangaChapters(mangaId: string): Promise<MangaChapter[]>;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabase = supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })
    : null;

export const mediaRepository: MediaRepository = {
    async resolve(reference) {
        if (typeof reference === 'string') return reference;
        if (!supabase) return null;

        const { data, error } = await supabase.storage
            .from(reference.bucket)
            .createSignedUrl(reference.path, 60 * 60);

        if (error) throw error;
        return data.signedUrl;
    },
    async getAnimeEpisodes(animeId) {
        if (!supabase) return [];
        const { data, error } = await supabase.from('anime_episodes')
            .select('id, number, title, duration, video_url, video_path, thumbnail_url')
            .eq('anime_id', animeId)
            .order('number');
        if (error) throw error;

        return ((data ?? []) as unknown as {
            id: string; number: number; title: string; duration: string | null;
            video_url: string | null; video_path: string | null; thumbnail_url: string | null;
        }[]).map((row) => ({
            id: row.id,
            title: `${row.number} - ${row.title}`,
            duration: row.duration ?? undefined,
            videoUrl: row.video_url ?? undefined,
            thumbnail: row.thumbnail_url ?? undefined,
            asset: row.video_path ? { provider: 'supabase', bucket: 'anime-episodes', path: row.video_path } : undefined,
        }));
    },
    async getMangaChapters(mangaId) {
        if (!supabase) return [];
        const { data, error } = await supabase.from('manga_chapters')
            .select('id, number, title, pdf_path, pdf_url, pages')
            .eq('manga_id', mangaId)
            .order('number');
        if (error) throw error;

        return ((data ?? []) as unknown as {
            id: string; number: number; title: string; pdf_path: string | null;
            pdf_url: string | null; pages: string[] | null;
        }[]).map((row) => ({
            id: row.id,
            number: row.number,
            title: row.title,
            pdfUrl: row.pdf_url ?? undefined,
            pages: row.pages ?? undefined,
            asset: row.pdf_path ? { provider: 'supabase', bucket: 'manga-chapters', path: row.pdf_path } : undefined,
        }));
    },
};
