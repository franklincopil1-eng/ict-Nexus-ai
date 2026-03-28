import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts';

interface EquityCurveChartProps {
  data: { time: string; balance: number }[];
}

const EquityCurveChart = ({ data }: EquityCurveChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: 'rgba(24, 24, 27, 0.05)' },
        horzLines: { color: 'rgba(24, 24, 27, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        borderColor: 'rgba(24, 24, 27, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#10b981',
      topColor: 'rgba(16, 185, 129, 0.3)',
      bottomColor: 'rgba(16, 185, 129, 0)',
      lineWidth: 2,
    });

    // Format data for lightweight-charts
    // time can be a number (timestamp) or a string (YYYY-MM-DD)
    const formattedData = data.map(item => ({
      time: Math.floor(new Date(item.time).getTime() / 1000) as any,
      value: item.balance,
    })).sort((a, b) => a.time - b.time);

    areaSeries.setData(formattedData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default React.memo(EquityCurveChart);
