function formatPrice(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

export default function IndicatorReadout({ indicators }) {
  const rsi = Number.isFinite(indicators?.rsi) ? indicators.rsi : null;
  const rsiLabel = rsi == null ? 'WARMING UP' : rsi < 30 ? 'OVERSOLD' : rsi > 70 ? 'OVERBOUGHT' : 'NEUTRAL';

  return (
    <aside className="indicator-panel" aria-label="Technical indicators">
      <div className="panel-heading">
        <span className="section-kicker">SIGNALS</span>
        <span className="panel-period">{indicators?.period ? `(${indicators.period})` : '(14)'}</span>
      </div>

      <div className="indicator-lines">
        <div className="indicator-line">
          <span className="indicator-name"><i className="indicator-dot sma-dot" />SMA</span>
          <span className="indicator-value">{formatPrice(indicators?.sma)}</span>
        </div>
        <div className="indicator-line">
          <span className="indicator-name"><i className="indicator-dot ema-dot" />EMA</span>
          <span className="indicator-value">{formatPrice(indicators?.ema)}</span>
        </div>
      </div>

      <div className="rsi-block">
        <div className="rsi-topline">
          <span className="indicator-name"><i className="indicator-dot rsi-dot" />RSI</span>
          <span className="rsi-value">{rsi == null ? '—' : rsi.toFixed(1)}</span>
        </div>
        <div
          className="rsi-track"
          role="meter"
          aria-label="Relative strength index"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rsi ?? undefined}
        >
          <span className="rsi-zone oversold-zone" />
          <span className="rsi-zone overbought-zone" />
          {rsi != null && <span className="rsi-needle" style={{ left: `${rsi}%` }} />}
        </div>
        <div className="rsi-labels"><span>0</span><span>30</span><span>70</span><span>100</span></div>
        <span className={`rsi-status ${rsiLabel.toLowerCase().replace(' ', '-')}`}>{rsiLabel}</span>
      </div>
    </aside>
  );
}