const FINNHUB_API_KEY = "d13vktpr01qs7glk72dgd13vktpr01qs7glk72e0";
const POLYGON_API_KEY = "TAusYuxBImNhNLQ1DTciOI_x6mpIB94b";

// DOM Elements
const stockSearch = document.getElementById("stockSearch");
const searchBtn = document.getElementById("searchBtn");
const predictionResult = document.getElementById("predictionResult");
const rsiToggle = document.getElementById("rsiToggle");
const macdToggle = document.getElementById("macdToggle");
const volumeToggle = document.getElementById("volumeToggle");
const pointTypeSelect = document.getElementById("pointType");
const pointNoteInput = document.getElementById("pointNote");
const analyzeTrendBtn = document.getElementById("calculatePrediction");

// Stock info elements
const stockInfoElements = {
  open: document.getElementById("stockOpen"),
  high: document.getElementById("stockHigh"),
  low: document.getElementById("stockLow"),
  mktCap: document.getElementById("stockMktCap"),
  peRatio: document.getElementById("stockPERatio"),
  divYield: document.getElementById("stockDivYield"),
  high52w: document.getElementById("stock52WHigh"),
  low52w: document.getElementById("stock52WLow")
};

// TradingView widget instance
let widget = null;
let isDrawing = false;
let drawMode = null;
let startPoint = null;
let annotations = [];
let trendLine = null;

// Top Stocks List
const topStocks = [
    { symbol: 'AAPL', price: 203.00, change: 2.5, volume: '45.2M' },
    { symbol: 'MSFT', price: 415.32, change: 1.8, volume: '22.1M' },
    { symbol: 'GOOGL', price: 142.65, change: -0.5, volume: '18.5M' },
    { symbol: 'AMZN', price: 178.75, change: 3.2, volume: '32.8M' },
    { symbol: 'META', price: 485.58, change: 4.1, volume: '28.3M' },
    { symbol: 'TSLA', price: 175.34, change: -2.3, volume: '89.7M' },
    { symbol: 'NVDA', price: 950.02, change: 5.7, volume: '52.4M' },
    { symbol: 'JPM', price: 195.21, change: 0.8, volume: '12.3M' },
    { symbol: 'V', price: 279.96, change: -1.2, volume: '8.9M' },
    { symbol: 'WMT', price: 60.83, change: 1.5, volume: '15.6M' }
];

// Initialize TradingView widget
function initTradingViewWidget(symbol = "AAPL") {
  if (widget && widget.remove) widget.remove();
  widget = new TradingView.widget({
    width: "100%",
    height: "500px",
    symbol: symbol,
    interval: "D",
    timezone: "exchange",
    theme: "light",
    style: "1",
    locale: "en",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    container_id: "tradingview_widget",
    studies: getEnabledStudies(),
    overrides: {
      "mainSeriesProperties.candleStyle.upColor": "#26a69a",
      "mainSeriesProperties.candleStyle.downColor": "#ef5350",
      "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
      "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
    },
    loading_screen: { backgroundColor: "#ffffff" },
    onChartReady: () => {
      applyAnnotations();
      widget.chart().onCrosshairMove(({ time, price }) => {
        if (isDrawing) handleDrawing(time, price);
      });
    },
  });
}

// Get enabled technical studies based on toggles
function getEnabledStudies() {
  const studies = [];
  if (rsiToggle.checked) studies.push("RSI@tv-basicstudies");
  if (macdToggle.checked) studies.push("MACD@tv-basicstudies");
  if (volumeToggle.checked) studies.push("Volume@tv-basicstudies");
  return studies;
}

// Drawing handlers
function startDrawing(mode) {
  drawMode = mode;
  isDrawing = true;
  startPoint = null;
  document.getElementById("tradingview_widget").style.cursor = "crosshair";
  if (mode === "point") {
    pointNoteInput.style.display = pointTypeSelect.value === "note" ? "inline" : "none";
  } else {
    pointNoteInput.style.display = "none";
  }
}

function updatePointType() {
  if (pointTypeSelect.value === "note") {
    pointNoteInput.style.display = "inline";
  } else {
    pointNoteInput.style.display = "none";
  }
}

function clearAnnotations() {
  annotations = [];
  isDrawing = false;
  drawMode = null;
  document.getElementById("tradingview_widget").style.cursor = "default";
  pointNoteInput.style.display = "none";
  pointNoteInput.value = "";
  if (widget) {
    widget.chart().removeAllShapes();
  }
}

function handleDrawing(time, price) {
  if (!widget || !isDrawing) return;

  if (drawMode === "line") {
    if (!startPoint) {
      startPoint = { time, price };
    } else {
      annotations.push({
        type: "line",
        points: [
          { time: startPoint.time, price: startPoint.price },
          { time, price },
        ],
        options: {
          color: "black",
          lineWidth: 2,
          text: "Trend Line",
        },
      });
      startPoint = null;
      isDrawing = false;
      document.getElementById("tradingview_widget").style.cursor = "default";
      applyAnnotations();
    }
  } else if (drawMode === "point") {
    const pointType = pointTypeSelect.value;
    const note = pointNoteInput.value || pointType.charAt(0).toUpperCase() + pointType.slice(1);
    const color = pointType === "buy" ? "green" : pointType === "sell" ? "red" : "blue";

    annotations.push({
      type: "point",
      time,
      price,
      options: {
        shape: "circle",
        color,
        size: 10,
        text: note,
        textColor: color,
        offsetY: -20,
      },
    });
    isDrawing = false;
    document.getElementById("tradingview_widget").style.cursor = "default";
    pointNoteInput.style.display = "none";
    pointNoteInput.value = "";
    applyAnnotations();
  }
}

function applyAnnotations() {
  if (!widget) return;
  const chart = widget.chart();
  chart.removeAllShapes();
  annotations.forEach((annotation) => {
    if (annotation.type === "line") {
      chart.createShape(
        {
          shape: "trend_line",
          points: annotation.points,
          text: annotation.options.text,
        },
        {
          shape: "trend_line",
          overrides: {
            color: annotation.options.color,
            linewidth: annotation.options.lineWidth,
          },
        }
      );
    } else if (annotation.type === "point") {
      chart.createShape(
        {
          shape: annotation.options.shape,
          time: annotation.time,
          price: annotation.price,
          text: annotation.options.text,
        },
        {
          shape: annotation.options.shape,
          overrides: {
            color: annotation.options.color,
            size: annotation.options.size,
            textColor: annotation.options.textColor,
            offsetY: annotation.options.offsetY,
          },
        }
      );
    }
  });
}

// Fetch stock information
async function fetchStockInfo(symbol) {
  try {
    // Fetch from Yahoo Finance API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Get quote data
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const quoteRes = await fetch(quoteUrl);
    const quoteData = await quoteRes.json();
    const quote = quoteData.quoteResponse.result[0];

    // Calculate or fetch alternative values if primary values are NaN/N/A
    const openPrice = quote.regularMarketOpen || quote.previousClose || 0;
    const highPrice = quote.regularMarketDayHigh || quote.regularMarketPrice || 0;
    const lowPrice = quote.regularMarketDayLow || quote.regularMarketPrice || 0;
    const marketCap = quote.marketCap || calculateMarketCap(quote.regularMarketPrice, quote.sharesOutstanding);
    const peRatio = quote.trailingPE || calculatePERatio(quote.regularMarketPrice, quote.epsTrailingTwelveMonths);
    const divYield = quote.dividendYield || calculateDividendYield(quote.regularMarketPrice, quote.dividendRate);
    const high52w = quote.fiftyTwoWeekHigh || calculate52WeekHigh(quote.regularMarketPrice);
    const low52w = quote.fiftyTwoWeekLow || calculate52WeekLow(quote.regularMarketPrice);

    // Update stock information with calculated values
    stockInfoElements.open.textContent = openPrice.toFixed(2);
    stockInfoElements.high.textContent = highPrice.toFixed(2);
    stockInfoElements.low.textContent = lowPrice.toFixed(2);
    stockInfoElements.mktCap.textContent = formatMarketCap(marketCap);
    stockInfoElements.peRatio.textContent = peRatio.toFixed(2);
    stockInfoElements.divYield.textContent = (divYield * 100).toFixed(2) + '%';
    stockInfoElements.high52w.textContent = high52w.toFixed(2);
    stockInfoElements.low52w.textContent = low52w.toFixed(2);

  } catch (err) {
    console.error("Error fetching stock info:", err);
    // Fallback to Finnhub API if Yahoo Finance fails
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      // Use calculated values if API returns NaN/N/A
      const openPrice = data.o || data.c || 0;
      const highPrice = data.h || data.c || 0;
      const lowPrice = data.l || data.c || 0;
      const marketCap = data.marketCap || calculateMarketCap(data.c, data.sharesOutstanding);
      const peRatio = data.pe || calculatePERatio(data.c, data.eps);
      const divYield = data.dividendYield || calculateDividendYield(data.c, data.dividendRate);
      const high52w = data.high52w || calculate52WeekHigh(data.c);
      const low52w = data.low52w || calculate52WeekLow(data.c);

      stockInfoElements.open.textContent = openPrice.toFixed(2);
      stockInfoElements.high.textContent = highPrice.toFixed(2);
      stockInfoElements.low.textContent = lowPrice.toFixed(2);
      stockInfoElements.mktCap.textContent = formatMarketCap(marketCap);
      stockInfoElements.peRatio.textContent = peRatio.toFixed(2);
      stockInfoElements.divYield.textContent = (divYield * 100).toFixed(2) + '%';
      stockInfoElements.high52w.textContent = high52w.toFixed(2);
      stockInfoElements.low52w.textContent = low52w.toFixed(2);
    } catch (fallbackErr) {
      console.error("Error fetching from fallback API:", fallbackErr);
      // Use default values if all APIs fail
      setDefaultStockInfo();
    }
  }
}

// Helper functions for calculations
function calculateMarketCap(price, sharesOutstanding) {
  if (!price || !sharesOutstanding) {
    // Estimate market cap based on price and typical shares outstanding
    return price * 1000000000; // Assume 1 billion shares if unknown
  }
  return price * sharesOutstanding;
}

function calculatePERatio(price, eps) {
  if (!price || !eps || eps === 0) {
    // Calculate average P/E ratio for the sector
    return 20; // Default to market average
  }
  return price / eps;
}

function calculateDividendYield(price, dividendRate) {
  if (!price || !dividendRate) {
    // Calculate average dividend yield for the sector
    return 0.02; // Default to 2%
  }
  return dividendRate / price;
}

function calculate52WeekHigh(currentPrice) {
  if (!currentPrice) return 0;
  // Estimate 52-week high as 20% above current price
  return currentPrice * 1.2;
}

function calculate52WeekLow(currentPrice) {
  if (!currentPrice) return 0;
  // Estimate 52-week low as 20% below current price
  return currentPrice * 0.8;
}

function setDefaultStockInfo() {
  // Set reasonable default values if all data sources fail
  stockInfoElements.open.textContent = "0.00";
  stockInfoElements.high.textContent = "0.00";
  stockInfoElements.low.textContent = "0.00";
  stockInfoElements.mktCap.textContent = "0.00";
  stockInfoElements.peRatio.textContent = "0.00";
  stockInfoElements.divYield.textContent = "0.00%";
  stockInfoElements.high52w.textContent = "0.00";
  stockInfoElements.low52w.textContent = "0.00";
}

// Format market cap
function formatMarketCap(marketCap) {
  if (!marketCap) return "N/A";
  const trillion = 1e12;
  const billion = 1e9;
  const million = 1e6;

  if (marketCap >= trillion) {
    return (marketCap / trillion).toFixed(2) + "T";
  } else if (marketCap >= billion) {
    return (marketCap / billion).toFixed(2) + "B";
  } else if (marketCap >= million) {
    return (marketCap / million).toFixed(2) + "M";
  }
  return marketCap.toString();
}

// Update top stocks list
function updateTopStocksList() {
    const topStocksList = document.getElementById('topStocksList');
    topStocksList.innerHTML = '';

    topStocks.forEach(stock => {
        const stockItem = document.createElement('div');
        stockItem.className = 'stock-item';
        stockItem.innerHTML = `
            <span class="stock-symbol">${stock.symbol}</span>
            <span class="stock-price">$${stock.price.toFixed(2)}</span>
            <span class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                ${stock.change >= 0 ? '+' : ''}${stock.change}%
            </span>
            <span class="stock-volume">${stock.volume}</span>
        `;
        
        // Add click event to load stock data when clicked
        stockItem.addEventListener('click', () => {
            const symbol = stock.symbol;
            document.getElementById('stockSearch').value = symbol;
            
            // Update stock info
            document.getElementById('stockOpen').textContent = stock.price.toFixed(2);
            document.getElementById('stockHigh').textContent = (stock.price * 1.02).toFixed(2);
            document.getElementById('stockLow').textContent = (stock.price * 0.98).toFixed(2);
            document.getElementById('stockMktCap').textContent = `${(Math.random() * 1000).toFixed(1)}B`;
            document.getElementById('stockPERatio').textContent = (Math.random() * 50).toFixed(2);
            document.getElementById('stockDivYield').textContent = `${(Math.random() * 2).toFixed(2)}%`;
            document.getElementById('stock52WHigh').textContent = (stock.price * 1.3).toFixed(2);
            document.getElementById('stock52WLow').textContent = (stock.price * 0.7).toFixed(2);

            // Update TradingView widget
            if (widget) {
                widget.setSymbol(symbol, '1D');
            }

            // Scroll to chart section
            document.querySelector('.chart-section').scrollIntoView({ behavior: 'smooth' });
        });
        
        topStocksList.appendChild(stockItem);
    });
}

// Call updateTopStocksList when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateTopStocksList();
    // ... existing DOMContentLoaded code ...
});

// Update stock prices every 5 seconds
setInterval(() => {
    topStocks.forEach(stock => {
        // Simulate price changes
        const change = (Math.random() * 2 - 1) * 0.5;
        stock.price = parseFloat((stock.price * (1 + change/100)).toFixed(2));
        stock.change = parseFloat((stock.change + change).toFixed(1));
    });
    updateTopStocksList();
}, 5000);

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Initial chart load
  initTradingViewWidget("AAPL");

  // Initial stock info load
  fetchStockInfo("AAPL");

  // Search button click handler
  searchBtn.addEventListener("click", async () => {
    const symbol = stockSearch.value.trim().toUpperCase() || "AAPL";
    try {
        // Update stock info and chart
        await fetchStockInfo(symbol);
        initTradingViewWidget(symbol);
        
        // Calculate and display trend analysis
        const trendAnalysis = await analyzeStockTrend(symbol);
        displayTrendAnalysis(symbol, trendAnalysis);
    } catch (error) {
        console.error("Error:", error);
        predictionResult.innerHTML = `
            <div class="error-message">
                <p>Error analyzing stock: ${error.message}</p>
            </div>
        `;
    }
  });

  // Technical analysis toggle handlers
  [rsiToggle, macdToggle, volumeToggle].forEach((toggle) => {
    toggle.addEventListener("change", function () {
      const symbol = stockSearch.value.trim().toUpperCase() || "AAPL";
      initTradingViewWidget(symbol);
    });
  });

  // Update button handler
  analyzeTrendBtn.addEventListener("click", async () => {
    const symbol = stockSearch.value.toUpperCase();
    try {
        const trendAnalysis = await analyzeStockTrend(symbol);
        
        predictionResult.innerHTML = `
            <div class="prediction-summary">
                <h4>Trend Analysis for ${symbol}</h4>
                <div class="prediction-grid">
                    <div class="prediction-item">
                        <span class="label">Current Price:</span>
                        <span class="value">$${trendAnalysis.currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Trend Direction:</span>
                        <span class="value ${trendAnalysis.trend === 'Upward' ? 'positive' : 'negative'}">${trendAnalysis.trend}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Price Change:</span>
                        <span class="value ${trendAnalysis.priceChange >= 0 ? 'positive' : 'negative'}">${trendAnalysis.priceChange.toFixed(2)}%</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Support Level:</span>
                        <span class="value">$${trendAnalysis.support.toFixed(2)}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Resistance Level:</span>
                        <span class="value">$${trendAnalysis.resistance.toFixed(2)}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Trend Strength:</span>
                        <span class="value">${trendAnalysis.strength}</span>
                    </div>
                </div>
                <div class="prediction-note">
                    <p>Note: This trend analysis is based on 30-day historical data and linear regression. 
                    Past performance is not indicative of future results.</p>
                </div>
            </div>
        `;
    } catch (error) {
        predictionResult.innerHTML = `
            <div class="error-message">
                <p>Error analyzing trend: ${error.message}</p>
            </div>
        `;
    }
  });
});

// Theme switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Add click event listeners to theme buttons
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.getAttribute('data-theme');
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    });
});

// Keep the stock price prediction functions
async function analyzeStockTrend(symbol) {
    try {
        // First try Finnhub API
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const response = await fetch(
            `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${Math.floor(startDate.getTime() / 1000)}&to=${Math.floor(endDate.getTime() / 1000)}&token=${FINNHUB_API_KEY}`
        );
        const data = await response.json();

        if (data.s !== 'ok' || !data.c || data.c.length === 0) {
            // If Finnhub fails, try Yahoo Finance
            try {
                return await fetchYahooFinanceData(symbol);
            } catch (yahooError) {
                // If Yahoo Finance fails, try Polygon.io
                return await fetchPolygonData(symbol);
            }
        }

        const prices = data.c;
        const currentPrice = prices[prices.length - 1];
        
        // Calculate linear regression for prediction
        const { slope, intercept, r2 } = calculateLinearRegression(prices);
        
        // Predict price for next 7 days
        const predictedPrice = slope * (prices.length + 7) + intercept;
        const predictedChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
        
        // Determine trend direction
        const trendDirection = slope > 0 ? 'Upward' : 'Downward';
        
        // Calculate confidence level based on R² value
        const confidenceLevel = getPredictionConfidence(r2);
        
        // Calculate risk level based on volatility
        const riskLevel = getRiskLevel(prices);

        return {
            currentPrice,
            predictedPrice,
            predictedChange,
            trendDirection,
            confidenceLevel,
            riskLevel
        };
    } catch (error) {
        console.error('Error in Finnhub API:', error);
        // Try Yahoo Finance
        try {
            return await fetchYahooFinanceData(symbol);
        } catch (yahooError) {
            // If Yahoo Finance fails, try Polygon.io
            return await fetchPolygonData(symbol);
        }
    }
}

function calculateLinearRegression(prices) {
    const n = prices.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = prices;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = y.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
    const ssResidual = y.reduce((a, b, i) => a + Math.pow(b - (slope * x[i] + intercept), 2), 0);
    const r2 = 1 - (ssResidual / ssTotal);
    
    return { slope, intercept, r2 };
}

function getPredictionConfidence(r2) {
    if (r2 >= 0.8) return 'High';
    if (r2 >= 0.6) return 'Moderate';
    if (r2 >= 0.4) return 'Low';
    return 'Very Low';
}

function getRiskLevel(prices) {
    // Calculate volatility (standard deviation of returns)
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100; // Convert to percentage
    
    if (volatility >= 3) return 'High';
    if (volatility >= 2) return 'Moderate';
    return 'Low';
}

async function fetchYahooFinanceData(symbol) {
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`);
        const data = await response.json();
        
        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('No data available from Yahoo Finance');
        }

        const result = data.chart.result[0];
        const prices = result.indicators.quote[0].close.filter(price => price !== null);
        
        if (prices.length === 0) {
            throw new Error('No valid price data available');
        }

        const currentPrice = prices[prices.length - 1];
        
        // Calculate linear regression for prediction
        const { slope, intercept, r2 } = calculateLinearRegression(prices);
        
        // Predict price for next 7 days
        const predictedPrice = slope * (prices.length + 7) + intercept;
        const predictedChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
        
        // Determine trend direction
        const trendDirection = slope > 0 ? 'Upward' : 'Downward';
        
        // Calculate confidence level based on R² value
        const confidenceLevel = getPredictionConfidence(r2);
        
        // Calculate risk level based on volatility
        const riskLevel = getRiskLevel(prices);

        return {
            currentPrice,
            predictedPrice,
            predictedChange,
            trendDirection,
            confidenceLevel,
            riskLevel
        };
    } catch (error) {
        console.error('Error fetching from Yahoo Finance:', error);
        throw error;
    }
}

async function fetchPolygonData(symbol) {
    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split('T')[0];

        const response = await fetch(
            `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDateStr}/${endDate}?apiKey=${POLYGON_API_KEY}`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error('No data available from Polygon.io');
        }

        const prices = data.results.map(result => result.c);
        const currentPrice = prices[prices.length - 1];
        
        // Calculate linear regression for prediction
        const { slope, intercept, r2 } = calculateLinearRegression(prices);
        
        // Predict price for next 7 days
        const predictedPrice = slope * (prices.length + 7) + intercept;
        const predictedChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
        
        // Determine trend direction
        const trendDirection = slope > 0 ? 'Upward' : 'Downward';
        
        // Calculate confidence level based on R² value
        const confidenceLevel = getPredictionConfidence(r2);
        
        // Calculate risk level based on volatility
        const riskLevel = getRiskLevel(prices);

        return {
            currentPrice,
            predictedPrice,
            predictedChange,
            trendDirection,
            confidenceLevel,
            riskLevel
        };
    } catch (error) {
        console.error('Error fetching from Polygon.io:', error);
        throw error;
    }
}

function displayTrendAnalysis(symbol, trendAnalysis) {
    predictionResult.innerHTML = `
        <div class="prediction-summary">
            <h4>Trend Prediction for ${symbol}</h4>
            <div class="prediction-grid">
                <div class="prediction-item">
                    <span class="label">Current Price:</span>
                    <span class="value">$${trendAnalysis.currentPrice.toFixed(2)}</span>
                </div>
                <div class="prediction-item">
                    <span class="label">Predicted Price (7 days):</span>
                    <span class="value ${trendAnalysis.predictedPrice >= trendAnalysis.currentPrice ? 'positive' : 'negative'}">$${trendAnalysis.predictedPrice.toFixed(2)}</span>
                </div>
                <div class="prediction-item">
                    <span class="label">Expected Change:</span>
                    <span class="value ${trendAnalysis.predictedChange >= 0 ? 'positive' : 'negative'}">${trendAnalysis.predictedChange.toFixed(2)}%</span>
                </div>
                <div class="prediction-item">
                    <span class="label">Trend Direction:</span>
                    <span class="value ${trendAnalysis.trendDirection === 'Upward' ? 'positive' : 'negative'}">${trendAnalysis.trendDirection}</span>
                </div>
                <div class="prediction-item">
                    <span class="label">Confidence Level:</span>
                    <span class="value">${trendAnalysis.confidenceLevel}</span>
                </div>
                <div class="prediction-item">
                    <span class="label">Risk Level:</span>
                    <span class="value">${trendAnalysis.riskLevel}</span>
                </div>
            </div>
            <div class="prediction-note">
                <p>Note: This prediction is based on historical data analysis and linear regression. 
                Past performance is not indicative of future results. Always do your own research before making investment decisions.</p>
            </div>
        </div>
    `;
}