import type { ReactNode } from "react";

import { cx, markClasses, type ChartSeries } from "./chart";
import "./charts.css";

export interface ChartTable {
  head: string[];
  rows: string[][];
}

interface ChartFrameProps {
  title: string;
  caption?: string;
  series: ChartSeries[];
  /** Legend marks: "mark" for dots and bars, "line" for line charts. */
  legend?: "mark" | "line";
  table: ChartTable;
  /** Label for the data-table disclosure, for localized posts. */
  dataLabel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * The shell every chart shares: title, legend, the plot, caption, and a
 * "Show the data" table so no value lives only in a mark.
 */
export function ChartFrame({
  title,
  caption,
  series,
  legend = "mark",
  table,
  dataLabel = "Show the data",
  className,
  children,
}: ChartFrameProps) {
  return (
    <figure className={cx("chart not-prose", className)}>
      <p className="chart-title">{title}</p>
      {series.length > 1 && (
        <ul className="chart-legend">
          {series.map((entry) => (
            <li key={entry.key}>
              {legend === "line" ? (
                <span
                  className={cx(
                    "chart-swatch-line",
                    `chart-c${entry.color}`,
                    entry.dashed && "chart-dashed",
                  )}
                  aria-hidden="true"
                />
              ) : (
                <span className={markClasses(entry)} aria-hidden="true" />
              )}
              {entry.label}
            </li>
          ))}
        </ul>
      )}
      {children}
      {caption && <figcaption>{caption}</figcaption>}
      <details className="chart-data">
        <summary>{dataLabel}</summary>
        <div className="chart-data-scroll">
          <table>
            <thead>
              <tr>
                {table.head.map((cell, index) => (
                  <th key={index} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map(([first, ...rest], index) => (
                <tr key={index}>
                  <th scope="row">{first}</th>
                  {rest.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
