import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval: string;
  studies?: string[];
}

const TradingViewChart = ({ symbol, interval, studies = [] }: TradingViewChartProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "backgroundColor": "rgba(9, 9, 11, 1)",
      "gridColor": "rgba(24, 24, 27, 0.06)",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "container_id": "tradingview_chart_container",
      "studies": studies
    });

    container.current.appendChild(script);
  }, [symbol, interval, studies]);

  return (
    <div className="tradingview-widget-container w-full h-full" ref={container}>
      <div id="tradingview_chart_container" className="w-full h-full" />
    </div>
  );
};

export default React.memo(TradingViewChart);
