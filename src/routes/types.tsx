export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ResetPassword: { email: string };
    DesignSystem: undefined;
    SplashLogin: undefined;
    Main: undefined;
    AnimeDetail: { anime: AnimeDetailParams; selectedSeasonId?: string };
    AnimeSeasons: {
        animeTitle: string;
        seasons: Season[];
        selectedSeasonId?: string;
        anime: AnimeDetailParams;
    };
    AnimeRating: { animeTitle: string; rating?: number; count?: number };
    AnimePlayer: { animeTitle: string; episode: Episode; episodeList?: Episode[] };
    CategoryScreen: { title: string; animeList?: AnimeItem[]; mangaList?: MangaDetailParams[] };
    MangaDetail: { manga: MangaDetailParams; chapters?: MangaChapter[] };
    MangaReader: { mangaTitle: string; chapter: MangaChapter; chapters: MangaChapter[] };
};

export type MainTabParamList = {
    Home: undefined;
    Search: undefined;
    Mangas: undefined;
    Favorites: undefined;
    Profile: undefined;
};

export type AnimeItem = {
    id: string;
    title: string;
    image: string;
    genre?: string;
    year?: string;
    rating?: string;
    episodes?: string;
    description?: string;
};

export type AnimeDetailParams = {
    id: string;
    title: string;
    image: string;
    rating?: string;
    year?: string;
    genre?: string;
    episodes?: string;
    description?: string;
    bannerImage?: string;
    seasons?: Season[];
};

export type MangaDetailParams = {
    id: string;
    title: string;
    image: string;
    rating?: string;
    year?: string;
    genre?: string;
    chapters?: string;
    author?: string;
    description?: string;
};

export type Season = {
    id: string;
    name: string;
    episodes: Episode[];
};

export type Episode = {
    id: string;
    title: string;
    thumbnail?: string;
    duration?: string;
    videoUrl?: string;
    asset?: import('../services/mediaRepository').StoredMediaAsset;
};

export type MangaChapter = {
    id: string;
    number: number;
    title: string;
    pdfUrl?: string;
    asset?: import('../services/mediaRepository').StoredMediaAsset;
    pages?: string[];
};
