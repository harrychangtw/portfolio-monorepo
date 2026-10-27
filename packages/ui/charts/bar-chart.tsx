import type { CSSProperties } from "react";

import { ChartFrame } from "./chart-frame";
import {
  cx,
  formatTick,
  formatValue,
  markClasses,
  percentOf,
  type ChartFormat,
  type ChartSeries,
} from "./chart";

export interface BarRow {
  label: string;
  /** Values keyed by series; a missing key leaves a gap in the group. */
  values: Record<string, number | undefined>;
}

export interface BarChartProps {
  title: string;
  caption?: string;
  series: ChartSeries[];
  rows: BarRow[];
  domain: [number, number];
  ticks: number[];
  format: ChartFormat;
  axisLabel: string;
  rowHeader: string;
  dataLabel?: string;
}

/**
 * Grouped horizontal bars: one row per category, one thin bar per series,
 * drawn from zero so signed values read as polarity. Shares the row layout,
 * tooltip and data table with DotPlot.
 */
export function BarChart({
  title,
  caption,
  series,
  rows,
  domain,
  ticks,
  format,
  axisLabel,
  rowHeader,
  dataLabel,
}: BarChartProps) {
  const position = percentOf(domain);
  const zero = Math.min(Math.max(0, domain[0]), domain[1]);
  const table = {
    head: [rowHeader, ...series.map((entry) => entry.label)],
    rows: rows.map((row) => [
      row.label,
      ...series.map(({ key }) => {
        const value = row.values[key];
        return value === undefined ? "—" : formatValue(value, format);
      }),
    ]),
  };
  // Each bar is 6px with a 2px gap, so the track grows with the series count.
  const trackHeight = Math.max(28, series.length * 8 + 8);

  return (
    <ChartFrame
      title={title}
      caption={caption}
      series={series}
      table={table}
      dataLabel={dataLabel}
    >
      <div
        className="chart-rows"
        aria-hidden="true"
        style={{ "--bar-track": `${trackHeight}px` } as CSSProperties}
      >
        {rows.map((row) => (
          <div key={row.label} className="chart-row bar-row" tabIndex={-1}>
            <span className="chart-row-label">{row.label}</span>
            <span className="chart-track">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className={cx(
                    "chart-grid",
                    tick === zero && "chart-grid-zero",
                  )}
                  style={{ left: position(tick) }}
                />
              ))}
              <span className="bar-group">
                {series.map((entry) => {
                  const value = row.values[entry.key];
                  if (value === undefined)
                    return <span key={entry.key} className="bar-slot" />;
                  const [from, to] =
                    value < zero ? [value, zero] : [zero, value];
                  return (
                    <span key={entry.key} className="bar-slot">
                      <span
                        className={cx(
                          "bar",
                          `chart-c${entry.color}`,
                          value < zero ? "bar-negative" : "bar-positive",
                        )}
                        style={{
                          left: position(from),
                          right: `calc(100% - ${position(to)})`,
                        }}
                      />
                    </span>
                  );
                })}
              </span>
              <span className="chart-tip">
                <strong>{row.label}</strong>
                {series.map((entry) => {
                  const value = row.values[entry.key];
                  return (
                    value !== undefined && (
                      <span key={entry.key} className="chart-tip-line">
                        <span
                          className={markClasses({ ...entry, shape: "square" })}
                        />
                        <span>{entry.label}</span>
                        <span className="chart-tip-value">
                          {formatValue(value, format)}
                        </span>
                      </span>
                    )
                  );
                })}
              </span>
            </span>
          </div>
        ))}
        <div className="chart-row chart-axis">
          <span className="chart-row-label" />
          <span className="chart-track">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="chart-tick"
                style={{ left: position(tick) }}
              >
                {formatTick(tick, format)}
              </span>
            ))}
          </span>
        </div>
        <div className="chart-row chart-axis-label">
          <span className="chart-row-label" />
          <span>{axisLabel}</span>
        </div>
      </div>
    </ChartFrame>
  );
}
