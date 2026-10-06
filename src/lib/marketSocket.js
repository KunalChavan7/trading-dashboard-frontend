const configuredSymbols = (import.meta.env.VITE_SYMBOLS ?? 'btcusdt,ethusdt,solusdt')
  .split(',')
  .map((symbol) => symbol.trim().toLowerCase())
  .filter(Boolean);

const socketUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001/ws';
const historyLimit = 500;
const subscribers = new Set();

let state = {
  connection: 'connecting',
  exchange: 'starting',
  interval: '1m',
  symbols: configuredSymbols,
  markets: {},
};
let socket;
let reconnectTimer;
let reconnectAttempts = 0;

function publish() {
  for (const subscriber of subscribers) subscriber();
}

function addMarketUpdate(update) {
  if (update?.type !== 'market_update' || !update.symbol || !update.candle) return;

  const symbol = update.symbol.toLowerCase();
  const previous = state.markets[symbol];
  const candle = { ...update.candle, ...update.indicators };
  const candles = previous?.candles ?? [];
  const lastCandle = candles[candles.length - 1];
  let nextCandles;

  if (lastCandle?.time === candle.time) {
    nextCandles = [...candles.slice(0, -1), candle];
  } else {
    nextCandles = [...candles, candle].slice(-historyLimit);
  }

  state = {
    ...state,
    interval: update.interval ?? state.interval,
    symbols: state.symbols.includes(symbol) ? state.symbols : [...state.symbols, symbol],
    markets: {
      ...state.markets,
      [symbol]: {
        candles: nextCandles,
        latest: candle,
        indicators: update.indicators ?? {},
        eventTime: update.eventTime ?? Date.now(),
      },
    },
  };
}

function handleMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    return;
  }

  if (message.type === 'snapshot') {
    state = { ...state, exchange: message.exchange ?? state.exchange };
    for (const update of message.data ?? []) addMarketUpdate(update);
    publish();
    return;
  }

  if (message.type === 'market_update') {
    addMarketUpdate(message);
    publish();
  }
}

function connect() {
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) return;

  state = { ...state, connection: reconnectAttempts === 0 ? 'connecting' : 'reconnecting' };
  publish();

  try {
    const activeSocket = new WebSocket(socketUrl);
    socket = activeSocket;

    activeSocket.addEventListener('open', () => {
      reconnectAttempts = 0;
      state = { ...state, connection: 'live' };
      publish();
    });

    activeSocket.addEventListener('message', (event) => handleMessage(event.data));

    activeSocket.addEventListener('close', () => {
      if (socket === activeSocket) socket = undefined;
      state = { ...state, connection: 'reconnecting' };
      publish();
      scheduleReconnect();
    });

    activeSocket.addEventListener('error', () => activeSocket.close());
  } catch {
    state = { ...state, connection: 'reconnecting' };
    publish();
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer || subscribers.size === 0) return;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connect();
  }, Math.round(delay * (0.8 + Math.random() * 0.4)));
}

export function subscribe(listener) {
  subscribers.add(listener);
  if (subscribers.size === 1) connect();
  return () => {
    subscribers.delete(listener);
  };
}

export function getMarketSnapshot() {
  return state;
}