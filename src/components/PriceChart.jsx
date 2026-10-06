import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

const chartBackground = '#101416';

export default function PriceChart({ candles, symbol, interval }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const smaRef = useRef(null);
  const emaRef = useRef(null);
  const fittedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: chartBackground },
        textColor: '#7e898b',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1a2022' },
        horzLines: { color: '#1a2022' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#596467', labelBackgroundColor: '#242d2f' },
        horzLine: { color: '#596467', labelBackgroundColor: '#242d2f' },
      },
      rightPriceScale: { borderColor: '#252d2f', scaleMargins: { top: 0.12, bottom: 0.12 } },
      timeScale: {
        borderColor: '#252d2f',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 10,
      },
      localization: {
        priceFormatter: (price) => new Intl.NumberFormat('en-US', {
          minimumFractionDigits: price < 1 ? 4 : 2,
          maximumFractionDigits: price < 1 ? 6 : 2,
        }).format(price),
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const candlesSeries = chart.addCandlestickSeries({
      upColor: '#54d6a0',
      downColor: '#f06b72',
      borderUpColor: '#54d6a0',
      borderDownColor: '#f06b72',
      wickUpColor: '#54d6a0',
      wickDownColor: '#f06b72',
    });
    const smaSeries = chart.addLineSeries({
      color: '#e8b45b',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });
    const emaSeries = chart.addLineSeries({
      color: '#68a9e8',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candlesSeries;
    smaRef.current = smaSeries;
    emaRef.current = emaSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) chart.applyOptions({ width, height });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      smaRef.current = null;
      emaRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candleData = candles.map(({ time, open, high, low, close }) => ({
      time,
      open,
      high,
      low,
      close,
    }));
    seriesRef.current?.setData(candleData);
    smaRef.current?.setData(candles.filter(({ sma }) => Number.isFinite(sma)).map(({ time, sma }) => ({ time, value: sma })));
    emaRef.current?.setData(candles.filter(({ ema }) => Number.isFinite(ema)).map(({ time, ema }) => ({ time, value: ema })));

    if (candles.length && !fittedRef.current) {
      chartRef.current?.timeScale().fitContent();
      fittedRef.current = true;
    } else if (candles.length) {
      chartRef.current?.timeScale().scrollToRealTime();
    }
  }, [candles]);

  useEffect(() => {
    fittedRef.current = false;
    chartRef.current?.timeScale().fitContent();
  }, [symbol, interval]);

  return (
    <div className="chart-wrap">
      <div ref={containerRef} className="chart-canvas" aria-label={`${symbol} candlestick chart`} />
      {candles.length === 0 && (
        <div className="chart-empty" aria-live="polite">
          <span className="empty-pulse" />
          <span>Waiting for market data</span>
          <small>The chart will build as candles arrive</small>
        </div>
      )}
    </div>
  );
}