import { IgdbSearchResult, WatchEntry, MediaType } from '../types';

// URL da Serverless Function (Vercel)
const BACKEND_URL = '/api/igdb';

export const searchIgdb = async (query: string): Promise<IgdbSearchResult[]> => {
    console.log("Searching IGDB via Backend:", query);

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Backend Error ${response.status}: ${errorText}`);
            throw new Error(`Backend Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("IGDB Data received from Backend:", data);
        return data;
    } catch (error) {
        console.error("Error searching IGDB:", error);
        return [];
    }
};

export const mapIgdbToEntryData = (game: IgdbSearchResult): Partial<WatchEntry> => {
    // Encontrar desenvolvedora
    const developer = game.involved_companies?.find(c => c.developer)?.company.name ||
        game.involved_companies?.[0]?.company.name ||
        "Desconhecido";

    // A imagem já vem processada do backend como processed_image_url
    // Mas mantemos a lógica de fallback se necessário
    let imageUrl = (game as any).processed_image_url || '';

    if (!imageUrl && game.cover?.url) {
        imageUrl = `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`;
    }

    return {
        title: game.name,
        type: MediaType.GAME,
        year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined,
        genre: game.genres?.map(g => g.name) || [],
        directorOrCreator: developer,
        summary: game.summary,
        imageUrl: imageUrl,
        igdbId: game.id,
        platform: game.platforms?.[0]?.abbreviation || game.platforms?.[0]?.name
    };
};
