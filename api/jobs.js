export default async function handler(req, res) {
    // 1. Get the API URL from the Server Environment (Secure)
    // In Vercel, set SHEETDB_API_URL = https://sheetdb.io/api/v1/ssffyc7borgoa
    const SHEETDB_URL = process.env.SHEETDB_API_URL;

    // Security Check
    if (!SHEETDB_URL) {
        return res.status(500).json({ 
            error: "Server Configuration Error: Missing SHEETDB_API_URL environment variable." 
        });
    }

    // 2. Handle GET (Fetch Jobs from Excel via SheetDB)
    if (req.method === 'GET') {
        try {
            const response = await fetch(SHEETDB_URL);
            
            if (!response.ok) {
                throw new Error(`SheetDB responded with ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache Control: Cache for 60 seconds (s-maxage) to reduce API calls
            res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
            return res.status(200).json(data);
        } catch (error) {
            console.error("GET Error:", error);
            return res.status(500).json({ error: "Failed to fetch jobs" });
        }
    }

    // 3. Handle POST (Create Job in Excel via SheetDB)
    if (req.method === 'POST') {
        try {
            const newJob = req.body;
            
            // SheetDB API expects the payload to be wrapped in a "data" property
            // structure: { "data": { "title": "...", ... } } or { "data": [ ... ] }
            const payload = { data: newJob };

            const response = await fetch(SHEETDB_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`SheetDB Save Error: ${errText}`);
            }
            
            const result = await response.json();
            return res.status(201).json(result);
        } catch (error) {
            console.error("POST Error:", error);
            return res.status(500).json({ error: "Failed to save job" });
        }
    }

    // 4. Handle other methods
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
