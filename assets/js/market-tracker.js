/**
 * Market Tracker - Stock & Crypto Price Tracker
 * Uses PHP proxies for Finnhub (US Stocks) and Yahoo Finance (Indonesian Stocks)
 * CoinGecko for Crypto (CORS-friendly)
 */

class MarketTracker {
    constructor() {
        // Enable debug mode
        this.DEBUG = true;

        // API Configuration - Using Node.js server with Yahoo Finance
        this.APIs = {
            // Node.js server endpoints for stocks (uses Yahoo Finance)
            stocks: {
                idx: '/api/stocks/idx/{SYMBOL}',
                idxHistorical: '/api/stocks/idx/{SYMBOL}/historical',
                us: '/api/stocks/us/{SYMBOL}',
                usHistorical: '/api/stocks/us/{SYMBOL}/historical'
            },

            // CoinGecko for Crypto (CORS-friendly)
            coinGecko: {
                cryptoPrice: 'https://api.coingecko.com/api/v3/simple/price?ids={IDS}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
                cryptoChart: 'https://api.coingecko.com/api/v3/coins/{ID}/market_chart?vs_currency=usd&days=7&interval=daily'
            }
        };

        // Stock lists
        this.popularIDX = ['BBCA.JK', 'BBRI.JK', 'BMRI.JK', 'TLKM.JK', 'ASII.JK', 'UNVR.JK', 'GOTO.JK', 'BBNI.JK'];
        this.popularUS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
        this.popularCrypto = ['bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano', 'solana', 'polkadot', 'dogecoin'];

        // Indonesian stock names
        this.idxNames = {
            'BBCA.JK': 'Bank Central Asia',
            'BBRI.JK': 'Bank Rakyat Indonesia',
            'BMRI.JK': 'Bank Mandiri',
            'TLKM.JK': 'Telkom Indonesia',
            'ASII.JK': 'Astra International',
            'UNVR.JK': 'Unilever Indonesia',
            'GOTO.JK': 'GoTo Gojek Tokopedia',
            'BBNI.JK': 'Bank Negara Indonesia',
            'PGAS.JK': 'Perusahaan Gas Negara',
            'INDF.JK': 'Indofood Sukses Makmur',
            'ICBP.JK': 'Indofood CBP',
            'HMSP.JK': 'HM Sampoerna'
        };

        // US stock names
        this.usNames = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'AMZN': 'Amazon.com Inc.',
            'TSLA': 'Tesla Inc.',
            'META': 'Meta Platforms Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix Inc.'
        };

        this.currentMarket = 'idx'; // Default to Indonesian stocks
        this.watchlist = this.loadWatchlist();
        this.currentTab = 'stocks';
        this.chartInstances = {};

        this.init();
    }

    log(message, data = null) {
        if (this.DEBUG) {
            console.log('[Market Tracker]', message);
            if (data) console.log(data);
        }
    }


    init() {
        this.log('Initializing Market Tracker with Finnhub + Yahoo Finance (via proxies)');
        this.attachEventListeners();
        this.loadIDXStocks(); // Load Indonesian stocks by default

        // Listen for theme changes
        document.addEventListener('themeChanged', () => {
            this.log('Theme changed, updating charts...');
            // Re-render current charts to apply new theme colors
            if (this.currentMarket === 'idx') this.initializeIDXCharts();
            else this.initializeUSCharts();

            if (this.cryptoLoaded && this.currentTab === 'crypto') {
                this.initializeCryptoCharts();
            }
        });
    }

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Market switching
        document.querySelectorAll('.market-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchMarket(btn.dataset.market);
            });
        });

        // Stock search
        document.getElementById('stock-search-btn')?.addEventListener('click', () => {
            this.searchStock();
        });

        document.getElementById('stock-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchStock();
        });

        // Crypto search
        document.getElementById('crypto-search-btn')?.addEventListener('click', () => {
            this.searchCrypto();
        });

        document.getElementById('crypto-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCrypto();
        });

        // Refresh all
        document.getElementById('refresh-all-btn')?.addEventListener('click', () => {
            this.refreshAll();
        });

        // Clear watchlist
        document.getElementById('clear-watchlist-btn')?.addEventListener('click', () => {
            if (confirm('Clear entire watchlist?')) {
                this.clearWatchlist();
            }
        });
    }

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab + '-tab').classList.add('active');

        if (tab === 'crypto' && !this.cryptoLoaded) {
            this.loadPopularCrypto();
        } else if (tab === 'watchlist') {
            this.renderWatchlist();
        }
    }

    switchMarket(market) {
        this.log('Switching market to: ' + market);
        this.currentMarket = market;

        document.querySelectorAll('.market-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.market === market) {
                btn.classList.add('active');
            }
        });

        if (market === 'idx') {
            this.loadIDXStocks();
        } else {
            this.loadUSStocks();
        }
    }

    // ==================== INDONESIAN STOCKS (YAHOO FINANCE VIA PROXY) ====================

    async loadIDXStocks() {
        this.log('Loading Indonesian stocks via Yahoo Finance proxy');
        const container = document.getElementById('stocks-container');
        container.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div><p>Loading Indonesian stocks...</p></div>';



        let stocksHTML = '';
        let loadedCount = 0;

        for (const symbol of this.popularIDX) {
            try {
                this.log(`Fetching ${symbol}...`);
                const data = await this.fetchYahooStock(symbol);

                if (data) {
                    this.log(`✓ Successfully loaded ${symbol}`, data);
                    stocksHTML += this.getIDXStockCardHTML(data);
                    loadedCount++;
                } else {
                    this.log(`✗ Failed to load ${symbol}`);
                }

                await this.delay(100);
            } catch (error) {
                this.log(`✗ Error loading ${symbol}:`, error);
            }
        }

        if (loadedCount === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>⚠️ Unable to load Indonesian stocks</p>
                    <button onclick="marketTracker.loadIDXStocks()" class="btn-calculate" style="margin-top: 15px;">
                        Try Again
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = stocksHTML;
            await this.initializeIDXCharts();
        }

        this.log(`✓ Loaded ${loadedCount}/${this.popularIDX.length} Indonesian stocks`);
    }

    async fetchYahooStock(symbol) {
        try {
            // Use Node.js server endpoint
            const baseSymbol = symbol.replace('.JK', '');
            const url = this.APIs.stocks.idx.replace('{SYMBOL}', baseSymbol);

            this.log(`Fetching IDX stock from: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                this.log(`Node.js server HTTP Error ${response.status} for ${symbol}`);
                return null;
            }

            const result = await response.json();

            // Node.js server returns { data: {...} } format
            if (result.data) {
                return {
                    symbol: result.data.symbol || baseSymbol,
                    name: result.data.name || this.idxNames[symbol] || baseSymbol,
                    price: result.data.close || result.data.price || 0,
                    change: result.data.change || 0,
                    changePercent: result.data.percent_change || result.data.changePercent || 0,
                    open: result.data.open || 0,
                    high: result.data.high || 0,
                    low: result.data.low || 0,
                    volume: result.data.volume || 0,
                    prevClose: result.data.previous || result.data.prevClose || 0,
                    currency: 'IDR'
                };
            }

            return null;

        } catch (error) {
            this.log(`IDX stock fetch error for ${symbol}:`, error);
            return null;
        }
    }

    async fetchYahooChart(symbol) {
        try {
            // Use Node.js server historical endpoint
            const baseSymbol = symbol.replace('.JK', '');
            const url = this.APIs.stocks.idxHistorical.replace('{SYMBOL}', baseSymbol);

            const response = await fetch(url);
            const result = await response.json();

            // Node.js server returns { data: [{date, close}, ...] }
            if (result.data && result.data.length > 0) {
                const times = result.data.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric'
                    });
                });
                const prices = result.data.map(d => d.close);

                return { times, prices };
            }

            return null;
        } catch (error) {
            this.log('IDX chart fetch error:', error);
            return null;
        }
    }

    getIDXStockCardHTML(data) {
        const isPositive = data.change >= 0;
        const isInWatchlist = this.isInWatchlist(data.symbol, 'stock');

        const priceFormatted = Math.round(data.price).toLocaleString('id-ID');
        const changeFormatted = Math.round(Math.abs(data.change)).toLocaleString('id-ID');
        const displaySymbol = data.symbol.replace('.JK', '');

        return `
            <div class="market-card" data-symbol="${data.symbol}" data-type="stock">
                <div class="card-header">
                    <div class="card-title">
                        <h3 class="symbol">${displaySymbol}</h3>
                        <p class="name">${data.name}</p>
                    </div>
                    <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}" 
                            onclick="marketTracker.toggleWatchlist('${data.symbol}', 'stock')">
                        ${isInWatchlist ? '⭐' : '☆'}
                    </button>
                </div>
                
                <div class="card-body">
                    <p class="price">Rp ${priceFormatted}</p>
                    <div class="change-row">
                        <span class="change-badge ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '▲' : '▼'} Rp ${changeFormatted}
                        </span>
                        <span class="change-badge ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
                
                <div class="card-chart">
                    <canvas id="stock-chart-${displaySymbol}" width="300" height="120"></canvas>
                </div>
                
                <div class="card-footer">
                    <div class="stat">
                        <span class="stat-label">OPEN</span>
                        <span class="stat-value">Rp ${Math.round(data.open).toLocaleString('id-ID')}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">HIGH</span>
                        <span class="stat-value">Rp ${Math.round(data.high).toLocaleString('id-ID')}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">LOW</span>
                        <span class="stat-value">Rp ${Math.round(data.low).toLocaleString('id-ID')}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">PREV CLOSE</span>
                        <span class="stat-value">Rp ${Math.round(data.prevClose).toLocaleString('id-ID')}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">VOLUME</span>
                        <span class="stat-value">${this.formatVolume(data.volume)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeIDXCharts() {
        await this.delay(500);

        for (const symbol of this.popularIDX) {
            const displaySymbol = symbol.replace('.JK', '');
            const canvas = document.getElementById(`stock-chart-${displaySymbol}`);
            if (!canvas) continue;

            const chartData = await this.fetchYahooChart(symbol);

            if (chartData && chartData.prices.length > 0) {
                this.createChart(canvas, chartData.times, chartData.prices, 'stock');
            } else {
                this.createPlaceholderChart(canvas);
            }

            await this.delay(100);
        }
    }

    // ==================== US STOCKS (FINNHUB VIA PROXY) ====================

    async loadUSStocks() {
        this.log('Loading US stocks via Finnhub proxy');
        const container = document.getElementById('stocks-container');
        container.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div><p>Loading US stocks...</p></div>';



        let stocksHTML = '';
        let loadedCount = 0;

        for (const symbol of this.popularUS) {
            try {
                this.log(`Fetching ${symbol}...`);
                const data = await this.fetchFinnhubStock(symbol);

                if (data) {
                    this.log(`✓ Successfully loaded ${symbol}`, data);
                    stocksHTML += this.getUSStockCardHTML(data);
                    loadedCount++;
                } else {
                    this.log(`✗ Failed to load ${symbol}`);
                }

                await this.delay(100);
            } catch (error) {
                this.log(`✗ Error loading ${symbol}:`, error);
            }
        }

        if (loadedCount === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>⚠️ Unable to load US stocks</p>
                    <button onclick="marketTracker.loadUSStocks()" class="btn-calculate" style="margin-top: 15px;">
                        Try Again
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = stocksHTML;
            await this.initializeUSCharts();
        }

        this.log(`✓ Loaded ${loadedCount}/${this.popularUS.length} US stocks`);
    }

    async fetchFinnhubStock(symbol) {
        try {
            // Use Node.js server endpoint (uses Yahoo Finance)
            const url = this.APIs.stocks.us.replace('{SYMBOL}', symbol);

            this.log(`Fetching US stock from: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                this.log(`Node.js server HTTP Error ${response.status} for ${symbol}`);
                return null;
            }

            const result = await response.json();

            // Node.js server returns { data: {...} } format
            if (result.data) {
                return {
                    symbol: result.data.symbol || symbol,
                    name: result.data.name || this.usNames[symbol] || symbol,
                    price: result.data.price || 0,
                    change: result.data.change || 0,
                    changePercent: result.data.changePercent || 0,
                    open: result.data.open || 0,
                    high: result.data.high || 0,
                    low: result.data.low || 0,
                    volume: result.data.volume || 0,
                    prevClose: result.data.prevClose || 0,
                    currency: 'USD'
                };
            }

            return null;

        } catch (error) {
            this.log(`US stock fetch error for ${symbol}:`, error);
            return null;
        }
    }

    async fetchFinnhubCandles(symbol) {
        try {
            // Use Node.js server historical endpoint
            const url = this.APIs.stocks.usHistorical.replace('{SYMBOL}', symbol);

            const response = await fetch(url);
            const result = await response.json();

            // Node.js server returns { data: [{date, close}, ...] }
            if (result.data && result.data.length > 0) {
                const times = result.data.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    });
                });
                const prices = result.data.map(d => d.close);

                return { times, prices };
            }

            return null;
        } catch (error) {
            this.log('US chart fetch error:', error);
            return null;
        }
    }

    getUSStockCardHTML(data) {
        const isPositive = data.change >= 0;
        const isInWatchlist = this.isInWatchlist(data.symbol, 'stock');

        return `
            <div class="market-card" data-symbol="${data.symbol}" data-type="stock">
                <div class="card-header">
                    <div class="card-title">
                        <h3 class="symbol">${data.symbol}</h3>
                        <p class="name">${data.name}</p>
                    </div>
                    <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}" 
                            onclick="marketTracker.toggleWatchlist('${data.symbol}', 'stock')">
                        ${isInWatchlist ? '⭐' : '☆'}
                    </button>
                </div>
                
                <div class="card-body">
                    <p class="price">$${data.price.toFixed(2)}</p>
                    <div class="change-row">
                        <span class="change-badge ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '▲' : '▼'} $${Math.abs(data.change).toFixed(2)}
                        </span>
                        <span class="change-badge ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
                
                <div class="card-chart">
                    <canvas id="stock-chart-${data.symbol}" width="300" height="120"></canvas>
                </div>
                
                <div class="card-footer">
                    <div class="stat">
                        <span class="stat-label">OPEN</span>
                        <span class="stat-value">$${data.open.toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">HIGH</span>
                        <span class="stat-value">$${data.high.toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">LOW</span>
                        <span class="stat-value">$${data.low.toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">PREV CLOSE</span>
                        <span class="stat-value">$${data.prevClose.toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">52W HIGH</span>
                        <span class="stat-value">--</span>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeUSCharts() {
        await this.delay(500);

        for (const symbol of this.popularUS) {
            const canvas = document.getElementById(`stock-chart-${symbol}`);
            if (!canvas) continue;

            const chartData = await this.fetchFinnhubCandles(symbol);

            if (chartData && chartData.prices.length > 0) {
                this.createChart(canvas, chartData.times, chartData.prices, 'stock');
            } else {
                this.createPlaceholderChart(canvas);
            }

            await this.delay(100);
        }
    }

    // ==================== CRYPTO (COINGECKO - DIRECT) ====================

    async loadPopularCrypto() {
        this.log('Loading cryptocurrencies via CoinGecko');
        const container = document.getElementById('crypto-container');
        container.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div><p>Loading cryptocurrencies...</p></div>';

        try {
            const ids = this.popularCrypto.join(',');
            const url = this.APIs.coinGecko.cryptoPrice.replace('{IDS}', ids);

            const response = await fetch(url);
            const data = await response.json();

            let cryptoHTML = '';
            let loadedCount = 0;

            for (const id of this.popularCrypto) {
                if (data[id]) {
                    cryptoHTML += this.getCryptoCardHTML(id, data[id]);
                    loadedCount++;
                }
            }

            if (loadedCount > 0) {
                container.innerHTML = cryptoHTML;
                this.cryptoLoaded = true;
                await this.initializeCryptoCharts();
            } else {
                container.innerHTML = '<div class="empty-state"><p>Unable to load cryptocurrencies</p></div>';
            }

            this.log(`✓ Loaded ${loadedCount}/${this.popularCrypto.length} cryptocurrencies`);

        } catch (error) {
            this.log('Crypto load error:', error);
            container.innerHTML = '<div class="empty-state"><p>Error loading cryptocurrencies</p></div>';
        }
    }

    getCryptoCardHTML(id, data) {
        const price = data.usd;
        const change24h = data.usd_24h_change || 0;
        const marketCap = data.usd_market_cap || 0;
        const volume24h = data.usd_24h_vol || 0;

        const isPositive = change24h >= 0;
        const isInWatchlist = this.isInWatchlist(id, 'crypto');

        const name = id.charAt(0).toUpperCase() + id.slice(1);
        const symbol = this.getCryptoSymbol(id);

        return `
            <div class="market-card" data-symbol="${id}" data-type="crypto">
                <div class="card-header">
                    <div class="card-title">
                        <h3 class="symbol">${name}</h3>
                        <p class="name">${symbol}</p>
                    </div>
                    <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}" 
                            onclick="marketTracker.toggleWatchlist('${id}', 'crypto')">
                        ${isInWatchlist ? '⭐' : '☆'}
                    </button>
                </div>
                
                <div class="card-body">
                    <p class="price">$${this.formatCryptoPrice(price)}</p>
                    <div class="change-row">
                        <span class="change-badge ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '▲' : '▼'} ${Math.abs(change24h).toFixed(2)}%
                        </span>
                    </div>
                </div>
                
                <div class="card-chart">
                    <canvas id="crypto-chart-${id}" width="300" height="120"></canvas>
                </div>
                
                <div class="card-footer">
                    <div class="stat">
                        <span class="stat-label">MARKET CAP</span>
                        <span class="stat-value">$${this.formatVolume(marketCap)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">24H VOLUME</span>
                        <span class="stat-value">$${this.formatVolume(volume24h)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">24H CHANGE</span>
                        <span class="stat-value ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}${change24h.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeCryptoCharts() {
        await this.delay(500);

        for (const id of this.popularCrypto) {
            const canvas = document.getElementById(`crypto-chart-${id}`);
            if (!canvas) continue;

            const chartData = await this.fetchCryptoChartData(id);

            if (chartData) {
                this.createChart(canvas, chartData.times, chartData.prices, 'crypto');
            } else {
                this.createPlaceholderChart(canvas);
            }

            await this.delay(200);
        }
    }

    async fetchCryptoChartData(id) {
        try {
            const url = this.APIs.coinGecko.cryptoChart.replace('{ID}', id);
            const response = await fetch(url);
            const data = await response.json();

            if (data.prices) {
                const times = data.prices.map(p => new Date(p[0]).toLocaleDateString('id-ID'));
                const prices = data.prices.map(p => p[1]);

                return { times, prices };
            }

            return null;
        } catch (error) {
            this.log('Crypto chart fetch error:', error);
            return null;
        }
    }

    // ==================== CHART METHODS ====================

    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        return {
            textPrimary: style.getPropertyValue('--text-primary').trim() || '#ffffff',
            textSecondary: style.getPropertyValue('--text-secondary').trim() || 'rgba(255, 255, 255, 0.7)',
            gridColor: style.getPropertyValue('--glass-border').trim() || 'rgba(255, 255, 255, 0.1)',
            // Bright neon colors for dark theme contrast
            successColor: '#4ade80',
            dangerColor: '#f87171',
            bgPrimary: style.getPropertyValue('--bg-primary').trim() || '#1a1a2e'
        };
    }

    createChart(canvas, labels, data, type) {
        const ctx = canvas.getContext('2d');
        const colors = this.getThemeColors();

        if (this.chartInstances[canvas.id]) {
            this.chartInstances[canvas.id].destroy();
        }

        const isPositive = data[data.length - 1] >= data[0];
        const lineColor = isPositive ? colors.successColor : colors.dangerColor;
        // Use slightly more opaque background for better visibility
        const bgColor = isPositive ? 'rgba(74, 222, 128, 0.25)' : 'rgba(248, 113, 113, 0.25)';

        this.chartInstances[canvas.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    borderColor: lineColor,
                    backgroundColor: bgColor,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: lineColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: colors.bgPrimary,
                        titleColor: colors.textPrimary,
                        bodyColor: colors.textSecondary,
                        borderColor: colors.gridColor,
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return '$' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { display: false, beginAtZero: false }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    createPlaceholderChart(canvas) {
        const ctx = canvas.getContext('2d');
        const placeholderData = Array.from({ length: 10 }, () => Math.random() * 100 + 50);

        this.chartInstances[canvas.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(10).fill(''),
                datasets: [{
                    data: placeholderData,
                    borderColor: 'rgba(200, 200, 200, 0.5)',
                    backgroundColor: 'rgba(200, 200, 200, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // ==================== UTILITY METHODS ====================



    async searchStock() {
        const query = document.getElementById('stock-search').value.trim().toUpperCase();
        if (!query) {
            showNotification('Please enter a stock symbol', 'warning');
            return;
        }

        let symbol = query;
        if (this.currentMarket === 'idx' && !query.includes('.JK')) {
            symbol = query + '.JK';
        }

        await this.addStockToDisplay(symbol);
    }

    async addStockToDisplay(symbol) {
        const container = document.getElementById('stocks-container');

        if (document.querySelector(`[data-symbol="${symbol}"][data-type="stock"]`)) {
            showNotification(`${symbol} is already displayed`, 'info');
            return;
        }

        const loadingCard = document.createElement('div');
        loadingCard.className = 'loading-card';
        loadingCard.innerHTML = '<div class="spinner"></div><p>Loading ' + symbol + '...</p>';
        container.appendChild(loadingCard);

        let data;

        if (this.currentMarket === 'idx' || symbol.includes('.JK')) {
            data = await this.fetchYahooStock(symbol);
            if (data) {
                loadingCard.remove();
                container.insertAdjacentHTML('afterbegin', this.getIDXStockCardHTML(data));
            }
        } else {
            data = await this.fetchFinnhubStock(symbol);
            if (data) {
                loadingCard.remove();
                container.insertAdjacentHTML('afterbegin', this.getUSStockCardHTML(data));
            }
        }

        if (data) {
            await this.delay(100);
            const displaySymbol = symbol.replace('.JK', '');
            const canvas = document.getElementById(`stock-chart-${displaySymbol}`);
            if (canvas) {
                this.createPlaceholderChart(canvas);
            }

            showNotification(`${symbol} added successfully`, 'success');
        } else {
            loadingCard.remove();
            showNotification(`Unable to find stock: ${symbol}`, 'error');
        }
    }

    async searchCrypto() {
        const query = document.getElementById('crypto-search').value.trim().toLowerCase();
        if (!query) {
            showNotification('Please enter a cryptocurrency name', 'warning');
            return;
        }

        showNotification('Search any crypto by ID (e.g., bitcoin, ethereum)', 'info');
    }

    toggleWatchlist(symbol, type) {
        const key = `${type}:${symbol}`;

        if (this.watchlist[key]) {
            delete this.watchlist[key];
            showNotification(`Removed ${symbol} from watchlist`, 'info');
        } else {
            this.watchlist[key] = { symbol, type, addedAt: Date.now() };
            showNotification(`Added ${symbol} to watchlist`, 'success');
        }

        this.saveWatchlist();

        const cards = document.querySelectorAll(`[data-symbol="${symbol}"][data-type="${type}"]`);
        cards.forEach(card => {
            const btn = card.querySelector('.watchlist-btn');
            if (btn) {
                const isActive = this.watchlist[key];
                btn.classList.toggle('active', isActive);
                btn.textContent = isActive ? '⭐' : '☆';
            }
        });

        if (this.currentTab === 'watchlist') {
            this.renderWatchlist();
        }
    }

    isInWatchlist(symbol, type) {
        return this.watchlist.hasOwnProperty(`${type}:${symbol}`);
    }

    async renderWatchlist() {
        const container = document.getElementById('watchlist-container');
        const items = Object.values(this.watchlist);

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">—</div>
                    <h3>Your watchlist is empty</h3>
                    <p>Add stocks or crypto by clicking the star icon on any card</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div><p>Loading watchlist...</p></div>';

        let cardsHTML = '';
        let hasErrors = false;

        for (const item of items) {
            try {
                if (item.type === 'stock') {
                    let data;

                    if (item.symbol.includes('.JK') ||
                        this.popularIDX.includes(item.symbol + '.JK') ||
                        this.idxNames[item.symbol + '.JK']) {

                        let symbol = item.symbol;
                        if (!symbol.includes('.JK')) symbol += '.JK';

                        data = await this.fetchYahooStock(symbol);
                        if (data) cardsHTML += this.getIDXStockCardHTML(data);
                    } else {
                        data = await this.fetchFinnhubStock(item.symbol);
                        if (data) cardsHTML += this.getUSStockCardHTML(data);
                    }
                } else if (item.type === 'crypto') {
                    const url = this.APIs.coinGecko.cryptoPrice.replace('{IDS}', item.symbol);
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const data = await response.json();

                    if (data[item.symbol]) {
                        cardsHTML += this.getCryptoCardHTML(item.symbol, data[item.symbol]);
                    }
                }
            } catch (error) {
                console.error(`Error loading watchlist item ${item.symbol}:`, error);
                // Create a simplified error card for this item so the user knows it failed but can still see others
                cardsHTML += `
                    <div class="market-card error-card" data-symbol="${item.symbol}" data-type="${item.type}">
                        <div class="card-header">
                            <div class="card-title">
                                <h3 class="symbol">${item.symbol}</h3>
                                <p class="name">Failed to load data</p>
                            </div>
                            <button class="watchlist-btn active" 
                                    onclick="marketTracker.toggleWatchlist('${item.symbol}', '${item.type}')">
                                ⭐
                            </button>
                        </div>
                        <div class="card-body">
                            <p class="price" style="font-size: 1rem; color: var(--text-tertiary);">Data Unavailable</p>
                        </div>
                    </div>
                `;
                hasErrors = true;
            }

            await this.delay(100);
        }

        if (cardsHTML) {
            container.innerHTML = cardsHTML;
            if (hasErrors) {
                showNotification('Some items could not be loaded', 'warning');
            }
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">—</div>
                    <h3>Your watchlist is empty</h3>
                    <p>Add stocks or crypto by clicking the star icon on any card</p>
                </div>
            `;
        }
    }

    clearWatchlist() {
        this.watchlist = {};
        this.saveWatchlist();
        this.renderWatchlist();
        showNotification('Watchlist cleared', 'info');
    }

    formatVolume(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(0);
    }

    formatCryptoPrice(price) {
        if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (price >= 0.01) return price.toFixed(4);
        return price.toFixed(6);
    }

    getCryptoSymbol(id) {
        const symbols = {
            'bitcoin': 'BTC', 'ethereum': 'ETH', 'binancecoin': 'BNB', 'ripple': 'XRP',
            'cardano': 'ADA', 'solana': 'SOL', 'polkadot': 'DOT', 'dogecoin': 'DOGE'
        };
        return symbols[id] || id.toUpperCase().slice(0, 4);
    }

    async refreshAll() {
        showNotification('Refreshing...', 'info');

        const btn = document.getElementById('refresh-all-btn');
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => btn.style.transform = '', 600);

        if (this.currentTab === 'stocks') {
            if (this.currentMarket === 'idx') {
                await this.loadIDXStocks();
            } else {
                await this.loadUSStocks();
            }
        } else if (this.currentTab === 'crypto') {
            await this.loadPopularCrypto();
        } else if (this.currentTab === 'watchlist') {
            await this.renderWatchlist();
        }

        showNotification('Refreshed successfully', 'success');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    loadWatchlist() {
        const saved = localStorage.getItem('marketWatchlist');
        return saved ? JSON.parse(saved) : {};
    }

    saveWatchlist() {
        localStorage.setItem('marketWatchlist', JSON.stringify(this.watchlist));
    }
}

// Initialize Market Tracker
let marketTracker;
document.addEventListener('DOMContentLoaded', () => {
    marketTracker = new MarketTracker();
    window.marketTracker = marketTracker;
});
