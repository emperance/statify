/**
 * Statify Server - Node.js HTTP Server with Stock APIs
 * - US Stocks: Finnhub API (cloud-compatible)
 * - IDX Stocks: Yahoo Finance (local) with mock data fallback (production)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Try to load Yahoo Finance (optional - for local development)
let yahooFinance = null;
try {
    const YahooFinance = require('yahoo-finance2').default;
    yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    console.log('[Init] Yahoo Finance loaded for local development');
} catch (e) {
    console.log('[Init] Yahoo Finance not available, using fallback data for IDX');
}

const PORT = process.env.PORT || 8000;

// API Keys from environment variables
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd5un3lhr01qr4f89psigd5un3lhr01qr4f89psj0';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// Fallback IDX stock data (realistic mock data for when Yahoo is blocked)
const IDX_FALLBACK_DATA = {
    'BBCA': { name: 'Bank Central Asia', basePrice: 9850, sector: 'Banking' },
    'BBRI': { name: 'Bank Rakyat Indonesia', basePrice: 5425, sector: 'Banking' },
    'BMRI': { name: 'Bank Mandiri', basePrice: 6850, sector: 'Banking' },
    'TLKM': { name: 'Telkom Indonesia', basePrice: 3450, sector: 'Telecom' },
    'ASII': { name: 'Astra International', basePrice: 5175, sector: 'Automotive' },
    'UNVR': { name: 'Unilever Indonesia', basePrice: 2780, sector: 'Consumer' },
    'GOTO': { name: 'GoTo Gojek Tokopedia', basePrice: 74, sector: 'Technology' },
    'BBNI': { name: 'Bank Negara Indonesia', basePrice: 5525, sector: 'Banking' },
    'PGAS': { name: 'Perusahaan Gas Negara', basePrice: 1625, sector: 'Energy' },
    'INDF': { name: 'Indofood Sukses Makmur', basePrice: 6750, sector: 'Consumer' }
};

/**
 * Generate realistic mock stock data with small random variations
 */
function generateMockIDXData(symbol) {
    const base = IDX_FALLBACK_DATA[symbol];
    if (!base) return null;

    // Add small random variation (-2% to +2%)
    const variation = (Math.random() - 0.5) * 0.04;
    const price = Math.round(base.basePrice * (1 + variation));
    const change = Math.round(base.basePrice * variation);
    const changePercent = (variation * 100);

    return {
        symbol: symbol,
        name: base.name,
        price: price,
        change: change,
        changePercent: parseFloat(changePercent.toFixed(2)),
        open: Math.round(price * 0.998),
        high: Math.round(price * 1.015),
        low: Math.round(price * 0.985),
        volume: Math.floor(Math.random() * 50000000) + 10000000,
        prevClose: price - change,
        currency: 'IDR',
        isMockData: true
    };
}

/**
 * Fetch US stock quote from Finnhub
 */
function fetchFinnhubQuote(symbol) {
    return new Promise((resolve, reject) => {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.c && json.c > 0) {
                        resolve({
                            symbol: symbol,
                            name: getUSStockName(symbol),
                            price: json.c,           // Current price
                            change: json.d || 0,     // Change
                            changePercent: json.dp || 0, // Change percent
                            open: json.o || 0,       // Open
                            high: json.h || 0,       // High
                            low: json.l || 0,        // Low
                            volume: 0,               // Finnhub quote doesn't include volume
                            prevClose: json.pc || 0, // Previous close
                            currency: 'USD'
                        });
                    } else {
                        reject(new Error('No data from Finnhub'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Fetch US stock candles (historical) from Finnhub
 */
function fetchFinnhubCandles(symbol) {
    return new Promise((resolve, reject) => {
        const now = Math.floor(Date.now() / 1000);
        const sevenDaysAgo = now - (7 * 24 * 60 * 60);
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${sevenDaysAgo}&to=${now}&token=${FINNHUB_API_KEY}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.s === 'ok' && json.c && json.c.length > 0) {
                        const historical = json.t.map((timestamp, i) => ({
                            date: new Date(timestamp * 1000).toISOString(),
                            open: json.o[i],
                            high: json.h[i],
                            low: json.l[i],
                            close: json.c[i],
                            volume: json.v[i]
                        }));
                        resolve(historical);
                    } else {
                        reject(new Error('No candle data'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Fetch IDX stock quote - tries Yahoo Finance first, falls back to mock data
 */
async function fetchIDXQuote(symbol) {
    // Try Yahoo Finance first (works locally)
    if (yahooFinance) {
        try {
            const yahooSymbol = `${symbol}.JK`;
            const quote = await yahooFinance.quote(yahooSymbol);
            if (quote) {
                return {
                    symbol: symbol,
                    name: quote.shortName || quote.longName || IDX_FALLBACK_DATA[symbol]?.name || symbol,
                    price: quote.regularMarketPrice || 0,
                    change: quote.regularMarketChange || 0,
                    changePercent: quote.regularMarketChangePercent || 0,
                    open: quote.regularMarketOpen || 0,
                    high: quote.regularMarketDayHigh || 0,
                    low: quote.regularMarketDayLow || 0,
                    volume: quote.regularMarketVolume || 0,
                    prevClose: quote.regularMarketPreviousClose || 0,
                    currency: 'IDR'
                };
            }
        } catch (error) {
            console.log(`[IDX] Yahoo Finance failed for ${symbol}, using fallback:`, error.message);
        }
    }

    // Fallback to mock data (for production/cloud)
    return generateMockIDXData(symbol);
}

/**
 * Fetch IDX historical data - tries Yahoo Finance first, falls back to generated data
 */
async function fetchIDXHistorical(symbol) {
    // Try Yahoo Finance first
    if (yahooFinance) {
        try {
            const yahooSymbol = `${symbol}.JK`;
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 14);

            const chart = await yahooFinance.chart(yahooSymbol, {
                period1: startDate.toISOString().split('T')[0],
                period2: endDate.toISOString().split('T')[0],
                interval: '1d'
            });

            if (chart && chart.quotes && chart.quotes.length > 0) {
                return chart.quotes.slice(-7).map(q => ({
                    date: q.date,
                    open: q.open,
                    high: q.high,
                    low: q.low,
                    close: q.close,
                    volume: q.volume
                }));
            }
        } catch (error) {
            console.log(`[IDX] Yahoo historical failed for ${symbol}, generating mock data`);
        }
    }

    // Generate mock historical data
    const base = IDX_FALLBACK_DATA[symbol];
    if (!base) return null;

    const historical = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = (Math.random() - 0.5) * 0.04;
        const close = Math.round(base.basePrice * (1 + variation));
        historical.push({
            date: date.toISOString(),
            open: Math.round(close * 0.998),
            high: Math.round(close * 1.01),
            low: Math.round(close * 0.99),
            close: close,
            volume: Math.floor(Math.random() * 50000000)
        });
    }
    return historical;
}

/**
 * US Stock name mapping
 */
function getUSStockName(symbol) {
    const names = {
        'AAPL': 'Apple Inc.',
        'GOOGL': 'Alphabet Inc.',
        'MSFT': 'Microsoft Corporation',
        'AMZN': 'Amazon.com Inc.',
        'TSLA': 'Tesla Inc.',
        'META': 'Meta Platforms Inc.',
        'NVDA': 'NVIDIA Corporation',
        'NFLX': 'Netflix Inc.',
        'AMD': 'Advanced Micro Devices',
        'INTC': 'Intel Corporation'
    };
    return names[symbol] || symbol;
}

/**
 * Call Groq API
 */
function callGroqAPI(messages, temperature = 0.3) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: GROQ_MODEL,
            messages: messages,
            temperature: temperature,
            max_tokens: 1024
        });

        const url = new URL(GROQ_API_URL);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.choices && json.choices[0] && json.choices[0].message) {
                        resolve(json.choices[0].message.content);
                    } else if (json.error) {
                        reject(new Error(json.error.message || 'Groq API error'));
                    } else {
                        reject(new Error('Invalid Groq response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Handle API requests
 */
async function handleAPIRequest(req, res, pathname) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Parse the API path: /api/stocks/{market}/{symbol}[/historical]
    const apiMatch = pathname.match(/^\/api\/stocks\/(idx|us)\/([^\/]+)(\/historical)?$/);

    if (!apiMatch) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }

    const market = apiMatch[1];
    const symbol = apiMatch[2].toUpperCase();
    const isHistorical = !!apiMatch[3];

    console.log(`[API] ${market.toUpperCase()} ${isHistorical ? 'historical' : 'quote'}: ${symbol}`);

    try {
        if (market === 'us') {
            // US Stocks - Use Finnhub
            if (isHistorical) {
                const data = await fetchFinnhubCandles(symbol);
                res.writeHead(200);
                res.end(JSON.stringify({ data }));
            } else {
                const data = await fetchFinnhubQuote(symbol);
                res.writeHead(200);
                res.end(JSON.stringify({ data }));
            }
        } else {
            // IDX Stocks - Yahoo Finance with fallback
            if (isHistorical) {
                const data = await fetchIDXHistorical(symbol);
                if (data) {
                    res.writeHead(200);
                    res.end(JSON.stringify({ data }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Historical data not found' }));
                }
            } else {
                const data = await fetchIDXQuote(symbol);
                if (data) {
                    res.writeHead(200);
                    res.end(JSON.stringify({ data }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Stock not found' }));
                }
            }
        }
    } catch (error) {
        console.error('[API] Error:', error.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
    }
}

/**
 * Handle AI Insights Request
 */
async function handleGenerateInsights(req, res) {
    try {
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }
        const { statistics, raw_data } = JSON.parse(body);

        const prompt = `You are a statistical analysis assistant. Analyze the following data and provide insights.

Statistics:
${JSON.stringify(statistics, null, 2)}

Raw Data: [${raw_data.join(', ')}]

Provide your response as a JSON object with this exact structure:
{
  "summary": "A one-paragraph summary of the data",
  "insights": [
    {
      "type": "distribution|outliers|quality",
      "level": "positive|info|warning",
      "icon": "📊|📈|📉|✅|🔍|ℹ️",
      "title": "Short title",
      "description": "Detailed description"
    }
  ]
}

Provide 2-4 insights covering distribution shape, outliers, and data quality. Be concise and specific with actual numbers from the data.`;

        const responseText = await callGroqAPI([
            { role: 'system', content: 'You are a helpful statistical analysis assistant. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
        ]);

        // Try to parse JSON from the response
        let parsed;
        try {
            // Handle case where response might have markdown code blocks
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            // Fallback if JSON parsing fails
            parsed = {
                summary: responseText.substring(0, 200),
                insights: [{
                    type: 'info',
                    level: 'info',
                    icon: '🤖',
                    title: 'AI Analysis',
                    description: responseText.substring(0, 300)
                }]
            };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            summary: parsed.summary,
            insights: parsed.insights
        }));
    } catch (error) {
        console.error('[AI] Generate insights error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

/**
 * Handle AI Query (Natural Language Chat)
 */
async function handleAIQuery(req, res) {
    try {
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }
        const { question, data, statistics, conversation_history } = JSON.parse(body);

        const systemPrompt = `You are a helpful statistical analysis assistant. The user has calculated statistics on their data and is now asking questions about it.

Current Data: [${data.join(', ')}]

Calculated Statistics:
${JSON.stringify(statistics, null, 2)}

Answer the user's question about this data concisely and helpfully. Include specific numbers when relevant. If appropriate, suggest visualizations (histogram or boxplot).

At the end of your response, if a visualization would help, add on a new line: [SUGGEST_VIZ: histogram] or [SUGGEST_VIZ: boxplot]`;

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history
        if (conversation_history && conversation_history.length > 0) {
            conversation_history.forEach(exchange => {
                messages.push({ role: 'user', content: exchange.question });
                messages.push({ role: 'assistant', content: exchange.answer });
            });
        }

        messages.push({ role: 'user', content: question });

        const responseText = await callGroqAPI(messages, 0.5);

        // Check for visualization suggestion
        let visualization = { type: 'none', description: '' };
        const vizMatch = responseText.match(/\[SUGGEST_VIZ:\s*(histogram|boxplot)\]/i);
        if (vizMatch) {
            visualization = {
                type: vizMatch[1].toLowerCase(),
                description: `A ${vizMatch[1]} would help visualize this data`
            };
        }

        // Clean the answer (remove the suggestion tag)
        const cleanAnswer = responseText.replace(/\[SUGGEST_VIZ:\s*\w+\]/gi, '').trim();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            answer: cleanAnswer,
            visualization: visualization
        }));
    } catch (error) {
        console.error('[AI] Query error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
    }
}

/**
 * Serve static files
 */
function serveStaticFile(req, res, pathname) {
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                if (!ext) {
                    fs.readFile(path.join(__dirname, 'index.html'), (err2, data2) => {
                        if (err2) {
                            res.writeHead(404);
                            res.end('Not found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(data2);
                        }
                    });
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            } else {
                res.writeHead(500);
                res.end('Internal server error');
            }
            return;
        }

        if (ext === '.js' || ext === '.css' || ext === '.png' || ext === '.jpg' || ext === '.webp') {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }

        // Add Permissions-Policy to allow Camera and Mic access (critical for PWA/WebViews)
        res.setHeader('Permissions-Policy', 'camera=*, microphone=*, geolocation=*');


        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

/**
 * Main request handler
 */
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Route API requests
    if (pathname.startsWith('/api/')) {
        // AI endpoints (POST)
        if (req.method === 'POST' && pathname === '/api/generate_insights') {
            await handleGenerateInsights(req, res);
            return;
        }
        if (req.method === 'POST' && (pathname === '/api/ai_query' || pathname === '/api/ai_query.php')) {
            await handleAIQuery(req, res);
            return;
        }

        // Stock API endpoints
        await handleAPIRequest(req, res, pathname);
        return;
    }

    // Serve static files
    serveStaticFile(req, res, pathname);
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 Statify Server Running                              ║
║                                                          ║
║   Local:    http://localhost:${PORT}                       ║
║                                                          ║
║   Stock APIs:                                            ║
║   • US Stocks:  Finnhub (cloud-compatible)               ║
║   • IDX Stocks: Yahoo Finance / Mock fallback            ║
║                                                          ║
║   API Endpoints:                                         ║
║   • GET /api/stocks/idx/{symbol}                         ║
║   • GET /api/stocks/idx/{symbol}/historical              ║
║   • GET /api/stocks/us/{symbol}                          ║
║   • GET /api/stocks/us/{symbol}/historical               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
        console.log('[Server] Closed.');
        process.exit(0);
    });
});
