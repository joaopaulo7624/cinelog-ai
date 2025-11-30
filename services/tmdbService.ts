import { TMDB_API_BASE_URL, TMDB_GENRE_MAP, TMDB_KEY } from '../constants';
import { TmdbSearchResult, TmdbCredits, MediaType } from '../types';

const getApiKey = () => TMDB_KEY;

export const searchTmdb = async (query: string): Promise<TmdbSearchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `${TMDB_API_BASE_URL}/search/multi?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(query)}&page=1&include_adult=false`
    );
    
    if (!response.ok) throw new Error('Erro na busca TMDB');
    
    const data = await response.json();
    
    // Filtrar apenas filmes e séries, e que tenham imagem
    return data.results.filter((item: any) => 
      (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    );
  } catch (error) {
    console.error("Erro TMDB:", error);
    return [];
  }
};

export const getTmdbCredits = async (id: number, type: 'movie' | 'tv'): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return '';

  try {
    const response = await fetch(
      `${TMDB_API_BASE_URL}/${type}/${id}/credits?api_key=${apiKey}&language=pt-BR`
    );
    
    if (!response.ok) return '';
    
    const data: TmdbCredits = await response.json();
    
    if (type === 'movie') {
      const director = data.crew.find(c => c.job === 'Director');
      return director ? director.name : '';
    } else {
      // Para séries, pegamos criadores ou produtores executivos se disponível, ou apenas o primeiro cast principal como referência
      // A API de créditos de TV é diferente, muitas vezes "Created By" está nos detalhes da série, não nos créditos.
      // Vamos simplificar retornando vazio para preencher manualmente ou via 'details' se expandirmos depois.
      return ''; 
    }
  } catch (error) {
    return '';
  }
};

export const mapTmdbToEntryData = (item: TmdbSearchResult) => {
  const isMovie = item.media_type === 'movie';
  
  return {
    title: isMovie ? item.title || '' : item.name || '',
    type: isMovie ? MediaType.MOVIE : MediaType.SERIES,
    year: new Date(isMovie ? item.release_date || '' : item.first_air_date || '').getFullYear() || undefined,
    summary: item.overview,
    genre: item.genre_ids.map(id => TMDB_GENRE_MAP[id]).filter(Boolean),
    imageUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
    tmdbId: item.id
  };
};
