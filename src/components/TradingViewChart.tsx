import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval: string;
  studies?: string[];
}

const TradingViewChart = ({ symbol, interval, studies = [] }: TradingViewChartProps) => {
  const container = useRef<HTMLDivElement>(null);
  const containerId = useRef(`tradingview_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!container.current) return;

    const containerRef = container.current;
    
    // Find the widget div
    const widgetDiv = document.getElementById(containerId.current);
    if (!widgetDiv) return;

    // Clear previous widget content but keep the div
    widgetDiv.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.crossOrigin = "anonymous";
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
      "container_id": containerId.current,
      "studies": studies
    });

    widgetDiv.appendChild(script);

    return () => {
      if (widgetDiv) {
        widgetDiv.innerHTML = '';
      }
    };
  }, [symbol, interval, studies]);

  return (
    <div className="tradingview-widget-container w-full h-full" ref={container}>
      <div id={containerId.current} className="w-full h-full" />
    </div>
  );
};

export default React.memo(TradingViewChart);
