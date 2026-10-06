import { useEffect, useState, useSyncExternalStore } from 'react';
import { Activity, Circle, Radio, TrendingUp } from 'lucide-react';
import IndicatorReadout from './components/IndicatorReadout.jsx';
import PriceChart from './components/PriceChart.jsx';
import TickerTabs from './components/TickerTabs.jsx';
import { getMarketSnapshot, subscribe } from './lib/marketSocket.js';

function formatPrice(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

function formatClock(date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function connectionLabel(connection) {
  if (connection === 'live') return 'LIVE';
  if (connection === 'reconnecting') return 'RECONNECTING';
  return 'CONNECTING';
}

export default function App() {
  const marketState = useSyncExternalStore(subscribe, getMarketSnapshot, getMarketSnapshot);
  const [selectedSymbol, setSelectedSymbol] = useState(marketState.symbols[0] ?? 'btcusdt');
  const [clock, setClock] = useState(() => new Date());
  const market = marketState.markets[selectedSymbol];
  const latest = market?.latest;
  const candles = market?.candles ?? [];
  const direction = candles.length > 1
    ? latest.close >= candles[candles.length - 2].close ? 'positive' : 'negative'
    : '';

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!marketState.symbols.includes(selectedSymbol) && marketState.symbols.length) {
      setSelectedSymbol(marketState.symbols[0]);
    }
  }, [marketState.symbols, selectedSymbol]);

  const baseSymbol = selectedSymbol.replace(/usdt$/i, '').toUpperCase();

  return (
    <main className="terminal-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Activity size={18} strokeWidth={2.2} /></div>
          <div>
            <div className="brand-name">MARKET<span>TERMINAL</span></div>
            <div className="brand-caption">DIGITAL ASSET MONITOR</div>
          </div>
        </div>

        <div className="topbar-meta">
          <div className={`connection-pill ${marketState.connection}`}>
            {marketState.connection === 'live' ? <Radio size={14} /> : <Circle size={9} />}
            <span>{connectionLabel(marketState.connection)}</span>
          </div>
          <div className="exchange-state"><span className={`exchange-dot ${marketState.exchange}`} />BINANCE</div>
          <time className="terminal-clock">{formatClock(clock)} <span>{new Date().getTimezoneOffset() === 0 ? 'UTC' : 'LOCAL'}</span></time>
        </div>
      </header>

      <section className="market-strip" aria-label="Market selection">
        <div className="strip-label"><span className="section-kicker">WATCHLIST</span><span className="strip-count">{marketState.symbols.length.toString().padStart(2, '0')}</span></div>
        <TickerTabs
          symbols={marketState.symbols}
          markets={marketState.markets}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
        />
        <div className="strip-feed"><span className="feed-pulse" />STREAMING FEED</div>
      </section>

      <section className="market-header">
        <div className="instrument-name">
          <div className="instrument-symbol">{baseSymbol}<span>/USDT</span></div>
          <div className="instrument-details"><span className="instrument-type"><TrendingUp size={12} /> SPOT</span><span className="instrument-separator" />{marketState.interval} CANDLES</div>
        </div>
        <div className="headline-price">
          <span className={`headline-value ${direction}`}>{formatPrice(latest?.close)}</span>
          <span className="headline-unit">USDT</span>
        </div>
        <div className="candle-stats">
          <div><span>OPEN</span><strong>{formatPrice(latest?.open)}</strong></div>
          <div><span>HIGH</span><strong className="positive-text">{formatPrice(latest?.high)}</strong></div>
          <div><span>LOW</span><strong className="negative-text">{formatPrice(latest?.low)}</strong></div>
          <div><span>VOLUME</span><strong>{latest?.volume == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(latest.volume)}</strong></div>
        </div>
      </section>

      <section className="workspace" aria-label={`${baseSymbol} live market chart`}>
        <div className="chart-section">
          <div className="chart-heading">
            <div className="chart-title-group">
              <span className="section-kicker">PRICE ACTION</span>
              <span className="chart-symbol-label">{baseSymbol} · {marketState.interval}</span>
            </div>
            <div className="chart-legend" aria-label="Chart indicators">
              <span><i className="legend-swatch sma-swatch" />SMA{market?.indicators?.period ?? 14}</span>
              <span><i className="legend-swatch ema-swatch" />EMA{market?.indicators?.period ?? 14}</span>
            </div>
          </div>
          <PriceChart candles={candles} symbol={selectedSymbol} interval={marketState.interval} />
          <div className="chart-footer">
            <span><i className="footer-dot" />{candles.length} CANDLES IN SESSION</span>
            <span>OHLC · {marketState.interval}</span>
          </div>
        </div>

        <IndicatorReadout indicators={market?.indicators} />
      </section>

      <footer className="statusbar">
        <span><span className="status-indicator" />MARKET DATA {marketState.connection === 'live' ? 'CONNECTED' : 'UNAVAILABLE'}</span>
        <span><Circle size={6} fill="currentColor" /> PUBLIC BINANCE STREAM</span>
        <span className="status-updated">{market?.eventTime ? `LAST UPDATE ${formatClock(new Date(market.eventTime))}` : 'AWAITING FIRST UPDATE'}</span>
      </footer>
    </main>
  );
}