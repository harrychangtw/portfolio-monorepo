import { Fragment } from "react";

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

export interface DotMark {
  series: string;
  value: number;
  lo?: number;
  hi?: number;
  /** Extra text after the value in the tooltip and table, such as "3.237 loss". */
  note?: string;
}

export interface DotRow {
  label: string;
  marks: DotMark[];
  /** Short tag shown after the label, such as "main recipe". */
  tag?: string;
}

export interface DotPlotProps {
  title: string;
  caption?: string;
  series: ChartSeries[];
  rows: DotRow[];
  domain: [number, number];
  ticks: number[];
  format: ChartFormat;
  axisLabel: string;
  rowHeader: string;
  /** Join each row's lowest and highest marks with a line (a dumbbell). */
  connect?: boolean;
  /** A shaded reference range, such as seed noise. */
  band?: [number, number];
  /** Spread marks that would overlap onto separate lanes within the row. */
  dodge?: boolean;
  dataLabel?: string;
}

// Greedy lanes: a mark within 3% of one already placed in a lane moves to the
// next lane, alternating above and below the center line.
const laneOffsets = [0, -8, 8, -16, 16];

/**
 * A horizontal dot plot: one row per category, one mark per series, with
 * optional 95% intervals. Rows are HTML so labels stay readable at any width;
 * hovering or tapping a row shows its values, and a data table follows.
 */
export function DotPlot({
  title,
  caption,
  series,
  rows,
  domain,
  ticks,
  format,
  axisLabel,
  rowHeader,
  connect = false,
  band,
  dodge = false,
  dataLabel,
}: DotPlotProps) {
  const position = percentOf(domain);
  const toScale = scale(domain);
  const seriesByKey = new Map(series.map((entry) => [entry.key, entry]));
  const crossesZero = domain[0] < 0 && domain[1] > 0;

  function lanes(marks: DotMark[]) {
    const placed: number[][] = laneOffsets.map(() => []);
    return marks.map((mark) => {
      if (!dodge) return 0;
      const at = toScale(mark.value);
      const lane = placed.findIndex((xs) =>
        xs.every((x) => Math.abs(x - at) >= 3),
      );
      const index = lane < 0 ? 0 : lane;
      placed[index].push(at);
      return laneOffsets[index];
    });
  }

  function formatMark(mark: DotMark) {
    const interval =
      mark.lo !== undefined && mark.hi !== undefined && mark.lo !== mark.hi
        ? ` [${formatValue(mark.lo, format)}, ${formatValue(mark.hi, format)}]`
        : "";
    const note = mark.note ? ` (${mark.note})` : "";
    return `${formatValue(mark.value, format)}${interval}${note}`;
  }

  const table = {
    head: [rowHeader, ...series.map((entry) => entry.label)],
    rows: rows.map((row) => [
      row.tag ? `${row.label} (${row.tag})` : row.label,
      ...series.map((entry) => {
        const mark = row.marks.find((m) => m.series === entry.key);
        return mark ? formatMark(mark) : "—";
      }),
    ]),
  };

  return (
    <ChartFrame
      title={title}
      caption={caption}
      series={series}
      table={table}
      dataLabel={dataLabel}
    >
      <div className="chart-rows" aria-hidden="true">
        {rows.map((row) => {
          const values = row.marks.map((mark) => mark.value);
          const offsets = lanes(row.marks);
          return (
            <div
              key={row.label}
              className={cx(
                "chart-row",
                row.tag && "chart-row-tagged",
                dodge && "dot-row-dodge",
              )}
              tabIndex={-1}
            >
              <span className="chart-row-label">
                {row.label}
                {row.tag && <span className="chart-row-tag">{row.tag}</span>}
              </span>
              <span className="chart-track">
                {band && (
                  <span
                    className="chart-band"
                    style={{
                      left: position(band[0]),
                      right: `calc(100% - ${position(band[1])})`,
                    }}
                  />
                )}
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className={cx(
                      "chart-grid",
                      crossesZero && tick === 0 && "chart-grid-zero",
                    )}
                    style={{ left: position(tick) }}
                  />
                ))}
                {connect && (
                  <span
                    className="dot-connector"
                    style={{
                      left: position(Math.min(...values)),
                      right: `calc(100% - ${position(Math.max(...values))})`,
                    }}
                  />
                )}
                {row.marks.map((mark, index) => {
                  const entry = seriesByKey.get(mark.series)!;
                  const top = `calc(50% + ${offsets[index]}px)`;
                  return (
                    <Fragment key={mark.series}>
                      {mark.lo !== undefined && mark.hi !== undefined && (
                        <span
                          className={cx(
                            "dot-interval",
                            `chart-c${entry.color}`,
                          )}
                          style={{
                            top,
                            left: position(mark.lo),
                            right: `calc(100% - ${position(mark.hi)})`,
                          }}
                        />
                      )}
                      <span
                        className={markClasses(entry)}
                        style={{ top, left: position(mark.value) }}
                      />
                    </Fragment>
                  );
                })}
                <span className="chart-tip">
                  <strong>{row.label}</strong>
                  {row.marks.map((mark) => {
                    const entry = seriesByKey.get(mark.series)!;
                    return (
                      <span key={mark.series} className="chart-tip-line">
                        <span className={markClasses(entry)} />
                        {series.length > 1 && <span>{entry.label}</span>}
                        <span className="chart-tip-value">
                          {formatMark(mark)}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </span>
            </div>
          );
        })}
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
