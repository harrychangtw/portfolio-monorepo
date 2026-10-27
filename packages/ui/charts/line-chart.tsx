"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

import { ChartFrame } from "./chart-frame";
import {
  cx,
  formatTick,
  formatValue,
  scale,
  type ChartFormat,
  type ChartSeries,
} from "./chart";

export interface LineSeries extends ChartSeries {
  /** One value per x; null leaves a gap. */
  values: (number | null)[];
}

export interface LineChartProps {
  title: string;
  caption?: string;
  series: LineSeries[];
  x: number[];
  xDomain?: [number, number];
  xTicks: number[];
  xLabel: string;
  /** Number of decimals for x in tooltips and the table. */
  xFormat?: ChartFormat;
  yDomain: [number, number];
  yTicks: number[];
  yLabel: string;
  format: ChartFormat;
  /** Vertical reference lines, such as the start of the decay. */
  markers?: { x: number; label: string }[];
  /** Plot height in px. */
  height?: number;
  /** Table rows: every nth x. Defaults to about a dozen rows. */
  tableEvery?: number;
  /** Screen-reader hint appended to the title. */
  keyHint?: string;
  dataLabel?: string;
}

const pct = (value: number) => `${value.toFixed(2)}%`;

/**
 * Lines over a shared x axis, such as a metric over training steps. The plot
 * is an SVG stretched to the box with 2px non-scaling strokes; ticks and labels
 * are HTML so they stay legible at any width. Hovering, tapping or using the
 * arrow keys moves a crosshair with every series' value.
 */
export function LineChart({
  title,
  caption,
  series,
  x,
  xDomain = [x[0], x[x.length - 1]],
  xTicks,
  xLabel,
  xFormat = 0,
  yDomain,
  yTicks,
  yLabel,
  format,
  markers = [],
  height = 260,
  tableEvery = Math.max(1, Math.ceil(x.length / 12)),
  keyHint = "Use the left and right arrow keys to read values.",
  dataLabel,
}: LineChartProps) {
  const [active, setActive] = useState(-1);
  const toX = scale(xDomain);
  const toY = scale(yDomain);
  const xs = x.map((value) => toX(value));
  const crossesZero = yDomain[0] < 0 && yDomain[1] > 0;

  // Split each series at nulls so gaps stay gaps; coordinates are 0–1000.
  function segments(values: (number | null)[]) {
    const runs: string[] = [];
    let run: string[] = [];
    values.forEach((value, index) => {
      if (value === null) {
        if (run.length) runs.push(run.join(" "));
        run = [];
        return;
      }
      run.push(
        `${(xs[index] * 10).toFixed(1)},${(1000 - toY(value) * 10).toFixed(1)}`,
      );
    });
    if (run.length) runs.push(run.join(" "));
    return runs;
  }

  const table = {
    head: [xLabel, ...series.map((entry) => entry.label)],
    rows: x
      .map((value, index) => ({ value, index }))
      .filter(({ index }) => index % tableEvery === 0 || index === x.length - 1)
      .map(({ value, index }) => [
        formatValue(value, xFormat),
        ...series.map((entry) => {
          const y = entry.values[index];
          return y === null ? "—" : formatValue(y, format);
        }),
      ]),
  };

  function nearest(target: number) {
    let best = 0;
    xs.forEach((value, index) => {
      if (Math.abs(value - target) < Math.abs(xs[best] - target)) best = index;
    });
    return best;
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setActive(nearest(((event.clientX - box.left) / box.width) * 100));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[
      event.key
    ];
    if (step === undefined) return;
    event.preventDefault();
    const start = active < 0 ? (step > 0 ? -1 : x.length) : active;
    setActive(Math.min(Math.max(start + step, 0), x.length - 1));
  }

  const left = active >= 0 ? xs[active] : 0;
  // List series top to bottom, matching their order on the plot.
  const tipRows =
    active >= 0
      ? series
          .map((entry) => ({ entry, y: entry.values[active] }))
          .sort((a, b) => (b.y ?? -Infinity) - (a.y ?? -Infinity))
      : [];

  return (
    <ChartFrame
      title={title}
      caption={caption}
      series={series}
      legend="line"
      table={table}
      dataLabel={dataLabel}
    >
      <div className="line-chart">
        <p className="line-y-label">{yLabel}</p>
        <div className="line-body">
          <div className="line-y-ticks" aria-hidden="true" style={{ height }}>
            {yTicks.map((tick) => (
              <span key={tick} style={{ bottom: pct(toY(tick)) }}>
                {formatTick(tick, format)}
              </span>
            ))}
          </div>
          <div
            className={cx("line-plot", active >= 0 && "is-active")}
            style={{ height }}
            tabIndex={0}
            role="img"
            aria-label={`${title}. ${keyHint}`}
            onPointerMove={onPointerMove}
            onPointerLeave={(event) =>
              event.pointerType === "mouse" && setActive(-1)
            }
            onBlur={() => setActive(-1)}
            onKeyDown={onKeyDown}
          >
            {yTicks.map((tick) => (
              <span
                key={tick}
                className={cx(
                  "line-grid",
                  crossesZero && tick === 0 && "line-grid-zero",
                )}
                style={{ bottom: pct(toY(tick)) }}
              />
            ))}
            {markers.map((marker) => (
              <span
                key={marker.label}
                className="line-marker"
                style={{ left: pct(toX(marker.x)) }}
              >
                <span className="line-marker-label">{marker.label}</span>
              </span>
            ))}
            <svg
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {series.map((entry) =>
                segments(entry.values).map((points, index) => (
                  <polyline
                    key={`${entry.key}-${index}`}
                    className={cx(
                      `chart-c${entry.color}`,
                      entry.dashed && "line-dashed",
                    )}
                    points={points}
                  />
                )),
              )}
            </svg>
            <span
              className="line-crosshair"
              aria-hidden="true"
              style={{ left: `${left}%` }}
            />
            {series.map((entry) => {
              const y = active >= 0 ? entry.values[active] : null;
              return (
                <span
                  key={entry.key}
                  className={cx(
                    "chart-mark chart-dot line-point",
                    `chart-c${entry.color}`,
                  )}
                  aria-hidden="true"
                  hidden={y === null}
                  style={{
                    left: `${left}%`,
                    top: y === null ? undefined : `${100 - toY(y)}%`,
                  }}
                />
              );
            })}
            <span
              className={cx("chart-tip line-tip", left > 55 && "line-tip-left")}
              aria-live="polite"
              style={{ left: `${left}%` }}
            >
              {active >= 0 && (
                <>
                  <strong>
                    {xLabel} {formatValue(x[active], xFormat)}
                  </strong>
                  {tipRows.map(({ entry, y }) => (
                    <span key={entry.key} className="chart-tip-line">
                      <span
                        className={`chart-swatch-line chart-c${entry.color}`}
                      />
                      <span>{entry.label}</span>
                      <span className="chart-tip-value">
                        {y === null ? "—" : formatValue(y, format)}
                      </span>
                    </span>
                  ))}
                </>
              )}
            </span>
          </div>
          <span />
          <div className="line-x-ticks" aria-hidden="true">
            {xTicks.map((tick) => (
              <span key={tick} style={{ left: pct(toX(tick)) }}>
                {formatTick(tick, xFormat)}
              </span>
            ))}
          </div>
          <span />
          <p className="chart-axis-label">{xLabel}</p>
        </div>
      </div>
    </ChartFrame>
  );
}
