export enum MediaType {
  MOVIE = 'Filme',
  SERIES = 'Série',
  ANIME = 'Anime',
  GAME = 'Jogo'
}

export interface WatchEntry {
  id: string;
  title: string;
  type: MediaType;
  rating?: number;
  dateWatched: string; // Para jogos, seria "Data de Conclusão" ou "Última vez jogado"
  genre: string[];
  year?: number;
  directorOrCreator?: string; // Para jogos: Desenvolvedora
  platform?: string; // Novo: Plataforma jogada (PC, PS5, etc)
  summary?: string;
  review?: string;
  imageUrl?: string;
  tmdbId?: number;
  igdbId?: number; // Novo: ID do IGDB
  timePlayed?: number; // Novo: Horas jogadas
}

export interface AISuggestion {
  title: string;
  year: number;
  genre: string[];
  directorOrCreator: string;
  summary: string;
  type: MediaType;
}

export interface AIAnalysis {
  favoriteGenre: string;
  totalHoursEstimates: number;
  personalityProfile: string;
  recommendations: string[];
}

// TMDB specific types
export interface TmdbSearchResult {
  id: number;
  title?: string; // Movie
  name?: string; // TV
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  genre_ids: number[];
  vote_average: number;
}

export interface TmdbCredits {
  crew: {
    job: string;
    name: string;
  }[];
  cast: {
    name: string;
  }[];
}

// IGDB specific types
export interface IgdbSearchResult {
  id: number;
  name: string;
  cover?: {
    url: string;
  };
  first_release_date?: number; // Unix timestamp
  summary?: string;
  genres?: {
    name: string;
  }[];
  involved_companies?: {
    company: {
      name: string;
    };
    developer: boolean;
  }[];
  platforms?: {
    name: string;
    abbreviation?: string;
  }[];
  total_rating?: number;
}