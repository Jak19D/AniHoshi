import { MangaChapter } from '../routes/types';

const DEFAULT_CHAPTERS = 50;

export function parseChapterCount(declaredCount?: string, fallback = DEFAULT_CHAPTERS): number {
    if (!declaredCount) return fallback;
    const lower = declaredCount.toLowerCase();
    if (lower.includes('andamento') || lower.includes('em breve') || lower === '-') return fallback;
    const match = declaredCount.match(/(\d+)/);
    if (!match) return fallback;
    return Math.max(1, Number.parseInt(match[1], 10));
}

export function getLocalMangaChapters(title: string, declaredCount?: string): MangaChapter[] {
    const raw = parseChapterCount(declaredCount, DEFAULT_CHAPTERS);
    const count = Math.min(raw, DEFAULT_CHAPTERS);

    return Array.from({ length: count }, (_, index) => {
        const number = index + 1;
        return {
            id: `local-${normalizeId(title)}-ch-${number}`,
            number,
            title: `Capítulo ${number}`,
        };
    });
}

function normalizeId(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'manga';
}
