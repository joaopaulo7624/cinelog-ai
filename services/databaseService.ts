import { supabase } from './supabaseClient';
import { WatchEntry, MediaType } from '../types';

// Converter do Formato DB (snake_case) para App (CamelCase)
const mapFromDb = (row: any): WatchEntry => ({
  id: row.id,
  title: row.title,
  type: row.type as MediaType,
  rating: row.rating,
  dateWatched: row.date_watched,
  genre: row.genre || [],
  year: row.year,
  summary: row.summary,
  directorOrCreator: row.director_or_creator,
  imageUrl: row.image_url,
  tmdbId: row.tmdb_id,
  igdbId: row.igdb_id, // Novo
  platform: row.platform, // Novo
  timePlayed: row.time_played // Novo
});

// Converter do Formato App para DB
const mapToDb = (entry: WatchEntry, userId: string) => ({
  // Se o ID for gerado pelo client, passamos. Senão o DB gera. 
  // Como o app já gera UUIDs, vamos usar o do app para consistência de UI otimista.
  id: entry.id,
  user_id: userId,
  title: entry.title,
  type: entry.type,
  rating: entry.rating,
  date_watched: entry.dateWatched,
  genre: entry.genre,
  year: entry.year,
  summary: entry.summary,
  director_or_creator: entry.directorOrCreator,
  image_url: entry.imageUrl,
  tmdb_id: entry.tmdbId,
  igdb_id: entry.igdbId, // Novo
  platform: entry.platform, // Novo
  time_played: entry.timePlayed // Novo
});

export const databaseService = {
  async fetchEntries() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('watch_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date_watched', { ascending: false });

    if (error) {
      console.error('Erro ao buscar filmes:', error);
      throw error;
    }

    return (data || []).map(mapFromDb);
  },

  async addEntry(entry: WatchEntry) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não logado");

    const dbEntry = mapToDb(entry, user.id);

    const { error } = await supabase
      .from('watch_entries')
      .insert([dbEntry]);

    if (error) {
      console.error('Erro ao salvar filme:', error);
      throw error;
    }
  },

  async deleteEntry(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não logado");

    const { error } = await supabase
      .from('watch_entries')
      .delete()
      .match({ id, user_id: user.id });

    if (error) {
      console.error('Erro ao deletar filme:', error);
      throw error;
    }
  }
};
