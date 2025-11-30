import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Configuração de CORS para permitir que seu frontend acesse
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Tenta pegar query de JSON, String ou Query Params (URL)
    let query = '';

    if (req.query && req.query.query) {
        query = req.query.query;
    } else if (req.body) {
        if (typeof req.body === 'object' && req.body.query) {
            query = req.body.query;
        } else if (typeof req.body === 'string') {
            try {
                const parsed = JSON.parse(req.body);
                query = parsed.query;
            } catch (e) {
                // Se não for JSON, assume que o body inteiro é a query
                query = req.body;
            }
        }
    }

    console.log("Recebido query final:", query);

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const CLIENT_ID = process.env.VITE_IGDB_CLIENT_ID;
    const CLIENT_SECRET = process.env.VITE_IGDB_CLIENT_SECRET;

    let token = process.env.VITE_IGDB_ACCESS_TOKEN;

    if (!token && CLIENT_SECRET) {
        try {
            const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
                method: 'POST'
            });
            const tokenData = await tokenRes.json();
            token = tokenData.access_token;
        } catch (e) {
            console.error("Erro ao gerar token:", e);
            return res.status(500).json({ error: 'Failed to generate token' });
        }
    }

    try {
        // Query simplificada para teste
        const igdbBody = `
            search "${query}";
            fields name, cover.url, first_release_date, total_rating, platforms.abbreviation, platforms.name;
            limit 20;
        `;

        const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain',
            },
            body: igdbBody,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`IGDB Error: ${errorText}`);
        }

        const games = await response.json();

        // Processar imagens
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

        if (processedGames.length === 0) {
            console.log("DEBUG: IGDB retornou lista vazia para query:", query);
            // Retorna um item de debug para aparecer no frontend
            return res.status(200).json([{
                id: 999999,
                name: `DEBUG: Buscou por '${query}'`,
                summary: `O backend recebeu '${query}'. Se isso estiver correto, o IGDB não tem esse jogo. Se estiver 'undefined', há um erro de parsing.`,
                genres: [{ name: "Debug" }],
                processed_image_url: "https://placehold.co/400x600?text=Debug"
            }]);
        }

        res.status(200).json(processedGames);

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message });
    }
}
