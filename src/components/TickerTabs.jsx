import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

function formatPrice(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

function getChange(candles) {
  if (candles.length < 2) return null;
  const previous = candles[candles.length - 2].close;
  const current = candles[candles.length - 1].close;
  return previous ? ((current - previous) / previous) * 100 : null;
}

export default function TickerTabs({ symbols, markets, selectedSymbol, onSelect }) {
  return (
    <nav className="ticker-tabs" aria-label="Markets">
      {symbols.map((symbol) => (
        <TickerTab
          key={symbol}
          symbol={symbol}
          market={markets[symbol]}
          selected={symbol === selectedSymbol}
          onSelect={() => onSelect(symbol)}
        />
      ))}
    </nav>
  );
}

function TickerTab({ symbol, market, selected, onSelect }) {
  const price = market?.latest?.close;
  const previousPrice = useRef(price);
  const [flash, setFlash] = useState('');
  const change = getChange(market?.candles ?? []);

  useEffect(() => {
    if (price == null || previousPrice.current == null || price === previousPrice.current) {
      previousPrice.current = price;
      return undefined;
    }

    setFlash(price > previousPrice.current ? 'flash-up' : 'flash-down');
    previousPrice.current = price;
    const timeout = setTimeout(() => setFlash(''), 500);
    return () => clearTimeout(timeout);
  }, [price]);

  const positive = change == null ? null : change >= 0;
  const name = symbol.replace(/usdt$/i, '').toUpperCase();

  return (
    <button
      className={`ticker-tab${selected ? ' is-selected' : ''}`}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="ticker-identity">
        <span className="ticker-symbol">{name}</span>
        <span className="ticker-quote">/ USDT</span>
      </span>
      <span className={`ticker-price ${flash}`}>{formatPrice(price)}</span>
      <span className={`ticker-change ${positive === null ? '' : positive ? 'positive' : 'negative'}`}>
        {positive === null ? '—' : positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {change == null ? '' : `${Math.abs(change).toFixed(2)}%`}
      </span>
    </button>
  );
}