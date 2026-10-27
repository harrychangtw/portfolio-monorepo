import type { CSSProperties } from "react";

import { ChartFrame } from "./chart-frame";
import {
  cx,
  formatTick,
  formatValue,
  markClasses,
  percentOf,
  scale,
  type ChartFormat,
  type ChartSeries,
} from "./chart";

export interface ScatterPoint {
  series: string;
  x: number;
  y: number;
  /** Names the point in its tooltip, such as a run name. */
  label?: string;
}

export interface ScatterPanel {
  title: string;
  points: ScatterPoint[];
  xDomain: [number, number];
  xTicks: number[];
  yDomain: [number, number];
  yTicks: number[];
}

export interface ScatterPlotProps {
  title: string;
  caption?: string;
  series: ChartSeries[];
  panels: ScatterPanel[];
  xLabel: string;
  yLabel: string;
  xFormat: ChartFormat;
  yFormat: ChartFormat;
  /** Header for the table's first column. */
  panelHeader?: string;
  seriesHeader?: string;
  dataLabel?: string;
}

/**
 * Scatter plots as small multiples: panels share a legend and axis labels but
 * keep their own scales. Points are HTML marks with a larger hit area; hovering
 * or focusing one shows its values.
 */
export function ScatterPlot({
  title,
  caption,
  series,
  panels,
  xLabel,
  yLabel,
  xFormat,
  yFormat,
  panelHeader = "Panel",
  seriesHeader = "Series",
  dataLabel,
}: ScatterPlotProps) {
  const seriesByKey = new Map(series.map((entry) => [entry.key, entry]));
  const table = {
    head: [panelHeader, seriesHeader, xLabel, yLabel],
    rows: panels.flatMap((panel) =>
      panel.points.map((point) => [
        panel.title,
        [seriesByKey.get(point.series)!.label, point.label]
          .filter(Boolean)
          .join(", "),
        formatValue(point.x, xFormat),
        formatValue(point.y, yFormat),
      ]),
    ),
  };

  return (
    <ChartFrame
      title={title}
      caption={caption}
      series={series}
      table={table}
      dataLabel={dataLabel}
    >
      <div
        className="scatter-panels"
        style={
          { "--scatter-columns": Math.min(panels.length, 3) } as CSSProperties
        }
      >
        {panels.map((panel) => {
          const left = percentOf(panel.xDomain);
          const bottom = percentOf(panel.yDomain);
          const toX = scale(panel.xDomain);
          // Anchor tooltips toward the middle so they stay inside the panel.
          const tipSide = (x: number) =>
            toX(x) > 60
              ? "scatter-tip-end"
              : toX(x) < 40
                ? "scatter-tip-start"
                : undefined;
          return (
            <div key={panel.title} className="scatter-panel">
              <p className="scatter-panel-title">{panel.title}</p>
              <p className="scatter-y-label">{yLabel}</p>
              <div className="scatter-body">
                <div className="scatter-y-ticks" aria-hidden="true">
                  {panel.yTicks.map((tick) => (
                    <span key={tick} style={{ bottom: bottom(tick) }}>
                      {formatTick(tick, yFormat)}
                    </span>
                  ))}
                </div>
                <div className="scatter-plot">
                  {panel.yTicks.map((tick) => (
                    <span
                      key={tick}
                      className="scatter-grid-y"
                      style={{ bottom: bottom(tick) }}
                    />
                  ))}
                  {panel.xTicks.map((tick) => (
                    <span
                      key={tick}
                      className="scatter-grid-x"
                      style={{ left: left(tick) }}
                    />
                  ))}
                  {panel.points.map((point, index) => {
                    const entry = seriesByKey.get(point.series)!;
                    const name = point.label
                      ? `${entry.label}, ${point.label}`
                      : entry.label;
                    return (
                      <span
                        key={index}
                        className={cx("scatter-point", tipSide(point.x))}
                        style={{ left: left(point.x), bottom: bottom(point.y) }}
                        tabIndex={0}
                        aria-label={`${name}: ${xLabel} ${formatValue(point.x, xFormat)}, ${yLabel} ${formatValue(point.y, yFormat)}`}
                      >
                        <span className={markClasses(entry)} />
                        <span className="chart-tip" aria-hidden="true">
                          <strong>{name}</strong>
                          <span className="chart-tip-line">
                            {xLabel}
                            <span className="chart-tip-value">
                              {formatValue(point.x, xFormat)}
                            </span>
                          </span>
                          <span className="chart-tip-line">
                            {yLabel}
                            <span className="chart-tip-value">
                              {formatValue(point.y, yFormat)}
                            </span>
                          </span>
                        </span>
                      </span>
                    );
                  })}
                </div>
                <span />
                <div className="scatter-x-ticks" aria-hidden="true">
                  {panel.xTicks.map((tick) => (
                    <span key={tick} style={{ left: left(tick) }}>
                      {formatTick(tick, xFormat)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="scatter-x-label">{xLabel}</p>
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
}
