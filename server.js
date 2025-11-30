import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.VITE_IGDB_CLIENT_ID;
// Tenta pegar o Secret ou usa o Token direto se disponível
const CLIENT_SECRET = process.env.VITE_IGDB_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
    // Se tiver token fixo no .env, usa ele (mais rápido para dev)
    if (process.env.VITE_IGDB_ACCESS_TOKEN) {
        return process.env.VITE_IGDB_ACCESS_TOKEN;
    }

    const now = Date.now();
    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    if (!CLIENT_SECRET) {
        throw new Error("VITE_IGDB_CLIENT_SECRET não encontrado. Adicione no .env.local");
    }

    console.log("Generating new Twitch Access Token...");
    try {
        const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
            method: 'POST',
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to get token: ${JSON.stringify(data)}`);
        }

        cachedToken = data.access_token;
        tokenExpiry = now + (data.expires_in * 1000) - 60000;
        console.log("Token generated successfully.");
        return cachedToken;
    } catch (error) {
        console.error("Token generation failed:", error);
        throw error;
    }
}

app.post('/api/search-games', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const token = await getAccessToken();

        const igdbBody = `
      search "${query}";
      fields name, cover.url, first_release_date, summary, genres.name, involved_companies.company.name, involved_companies.developer, platforms.name, platforms.abbreviation, total_rating, category;
      where category = (0, 8, 9); 
      limit 20;
    `;

        console.log(`Searching IGDB for: ${query}`);
        const igdbResponse = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain',
            },
            body: igdbBody,
        });

        if (!igdbResponse.ok) {
            const errorText = await igdbResponse.text();
            throw new Error(`IGDB API Error: ${errorText}`);
        }

        const games = await igdbResponse.json();

        const processedGames = games.map(game => {
            let imageUrl = '';
            if (game.cover && game.cover.url) {
                imageUrl = `https:${game.cover.url.replace('t_thumb', 't_cover_big')}`;
            }
            return {
                ...game,
                processed_image_url: imageUrl
            };
        });

        res.json(processedGames);

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend Server running on http://localhost:${PORT}`);
});
