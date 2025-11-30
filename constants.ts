import { MediaType } from './types';

const {
  VITE_TMDB_API_KEY = '',
  VITE_SUPABASE_URL = '',
  VITE_SUPABASE_ANON_KEY = ''
} = import.meta.env;

export const GENRES = [
  'Ação', 'Aventura', 'Comédia', 'Drama', 'Ficção Científica',
  'Fantasia', 'Terror', 'Mistério', 'Romance', 'Thriller', 'Documentário'
];

export const MEDIA_TYPES = [MediaType.MOVIE, MediaType.SERIES, MediaType.ANIME];

export const DEFAULT_IMAGE = 'https://picsum.photos/seed/default/300/450';

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_KEY = VITE_TMDB_API_KEY;

export const SUPABASE_URL = VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = VITE_SUPABASE_ANON_KEY;

export const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 14: 'Fantasia',
  36: 'História', 27: 'Terror', 10402: 'Música', 9648: 'Mistério',
  10749: 'Romance', 878: 'Ficção Científica', 10770: 'Cinema TV',
  53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste',
  10759: 'Ação e Aventura', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};
