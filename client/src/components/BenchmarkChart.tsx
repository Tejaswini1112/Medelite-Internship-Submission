import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MetricLine } from '../types';

const COLORS = { facility: '#003c90', state: '#006a61', national: '#86f2e4' };

function ChartGroup({ title, metrics, suffix }: { title: string; metrics: MetricLine[]; suffix: string }) {
  const data = metrics.map((m) => ({
    name: m.label.replace('Short-Stay ', '').replace('Long-Stay ', ''),
    Facility: m.facility,
    State: m.stateAverage,
    National: m.nationalAverage,
  }));

  return (
    <div className="flex-1">
      <h4 className="mb-2 text-center text-[11px] font-semibold uppercase tracking-label text-outline">
        {title}
      </h4>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }} barCategoryGap="22%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eeff" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737784' }} interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#737784' }} />
          <Tooltip
            formatter={(value: number) => [`${value?.toFixed?.(2)}${suffix}`, '']}
            contentStyle={{ borderRadius: 8, border: '1px solid #c3c6d5', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Facility" radius={[3, 3, 0, 0]} fill={COLORS.facility} maxBarSize={34} isAnimationActive={false} />
          <Bar dataKey="State" radius={[3, 3, 0, 0]} fill={COLORS.state} maxBarSize={34} isAnimationActive={false} />
          <Bar dataKey="National" radius={[3, 3, 0, 0]} fill={COLORS.national} maxBarSize={34} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BenchmarkChart({ metrics }: { metrics: MetricLine[] }) {
  const shortStay = metrics.filter((m) => m.group === 'short-stay');
  const longStay = metrics.filter((m) => m.group === 'long-stay');

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <ChartGroup title="Short-Stay (% of residents)" metrics={shortStay} suffix="%" />
      <ChartGroup title="Long-Stay (per 1,000 resident days)" metrics={longStay} suffix="" />
    </div>
  );
}
