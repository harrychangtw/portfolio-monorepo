import type { ChartSeries } from "../chart";
import { DotPlot } from "../dot-plot";
import {
  fingerprint,
  ladder,
  leadBins,
  leadReversed,
  recipes,
  type Interval,
} from "./data";

type Lang = "en" | "zh-TW";

const text = {
  en: {
    dataLabel: "Show the data",
    correlation: "Corrected per-prompt correlation",
    pairs: ["MZ twins", "Same-recipe pairs", "Cross-recipe pairs"],
    recipeGap: {
      title: "The ancestry gap appears in all 25 data recipes",
      caption:
        "Mean corrected per-prompt correlation of vulnerability profiles for each data recipe at 1B parameters, sorted by the ancestry gap (MZ twins minus same-recipe pairs). Lines are 95% intervals over prompts. Cross-recipe pairs pair a model from this recipe with models from every other recipe.",
      rowHeader: "Data recipe",
      main: "main",
    },
    ladder: {
      title: "Rerunning the same seed does not bring the twins back",
      caption:
        "Mean corrected per-prompt correlation between pairs of models on the main data recipe (DCLM-Baseline, 1B), by what their base models share. Lines are 95% intervals over prompts.",
      rowHeader: "What the two base models share",
      series: "Correlation",
      rows: [
        "Same base model (MZ twins)",
        "Same seed, pretrained again",
        "Same initialization only",
        "Same data order only",
        "Different seed, same data",
        "Different data",
      ],
    },
    leads: {
      title:
        "A lead between two attack templates rarely survives a new pretraining run",
      caption:
        "Share of leads between two attack templates, seen on one model, that the partner model reverses, grouped by the size of the lead in percentage points of attack success. A tie counts as half. Lines are 95% intervals over data recipes.",
      axisLabel: "Leads reversed on the partner model",
      rowHeader: "Lead on one model",
      above: (points: string) => `Lead above ${points} points`,
      range: (points: string) => `Lead of ${points} points`,
    },
    fingerprint: {
      title: "A few dozen prompts identify the pretraining run",
      caption:
        "How often matching vulnerability profiles finds a model's own pretraining run among 75 (chance 1.3%) or the data recipe of an unseen base model among 25 (chance 4%). Means over 200 random subsets of prompts; lines span the middle 95% of subsets.",
      run: "Pretraining run (of 75)",
      recipe: "Data recipe (of 25)",
      axisLabel: "Correctly identified",
      rowHeader: "Prompts used",
      prompts: (n: string) => `${n} prompts`,
    },
  },
  "zh-TW": {
    dataLabel: "顯示資料",
    correlation: "校正後逐提示相關係數",
    pairs: ["MZ 雙胞胎", "同配方配對", "跨配方配對"],
    recipeGap: {
      title: "血緣差距出現在全部 25 種資料配方中",
      caption:
        "1B 參數下，各資料配方脆弱度剖面的平均校正逐提示相關係數，依血緣差距（MZ 雙胞胎減去同配方配對）排序。線段為跨提示的 95% 信賴區間。跨配方配對是把這個配方的模型與其他所有配方的模型配對。",
      rowHeader: "資料配方",
      main: "主要",
    },
    ladder: {
      title: "用同一個種子重跑，也找不回雙胞胎",
      caption:
        "主要資料配方（DCLM-Baseline，1B）上，依兩個基礎模型共享的東西分類，各類模型配對的平均校正逐提示相關係數。線段為跨提示的 95% 信賴區間。",
      rowHeader: "兩個基礎模型共享的東西",
      series: "相關係數",
      rows: [
        "同一個基礎模型（MZ 雙胞胎）",
        "同一個種子，重新預訓練",
        "只共用初始化",
        "只共用資料順序",
        "不同種子，相同資料",
        "不同資料",
      ],
    },
    leads: {
      title: "兩個攻擊模板之間的領先，很少撐得過新一次預訓練",
      caption:
        "在一個模型上觀察到的兩個攻擊模板之間的領先，被配對模型反轉的比例，依領先幅度（攻擊成功率的百分點）分組。平手計為一半。線段為跨資料配方的 95% 信賴區間。",
      axisLabel: "在配對模型上被反轉的領先",
      rowHeader: "在一個模型上的領先",
      above: (points: string) => `領先超過 ${points} 個百分點`,
      range: (points: string) => `領先 ${points} 個百分點`,
    },
    fingerprint: {
      title: "幾十個提示就能認出是哪一次預訓練",
      caption:
        "以脆弱度剖面比對，從 75 次預訓練中找出模型自己那一次（隨機猜中機率 1.3%），或從 25 種配方中找出未見過的基礎模型的資料配方（隨機猜中機率 4%）的準確率。為 200 組隨機提示子集的平均；線段涵蓋中間 95% 的子集。",
      run: "預訓練過程（75 選 1）",
      recipe: "資料配方（25 選 1）",
      axisLabel: "正確辨識的比例",
      rowHeader: "使用的提示數",
      prompts: (n: string) => `${n} 個提示`,
    },
  },
} satisfies Record<Lang, unknown>;

const pairKeys = ["mz", "same", "cross"] as const;
const pairShapes = ["dot", "ring", "square"] as const;

function pairSeries(lang: Lang): ChartSeries[] {
  return pairKeys.map((key, index) => ({
    key,
    label: text[lang].pairs[index],
    shape: pairShapes[index],
    color: (index + 1) as 1 | 2 | 3,
  }));
}

const mark = (series: string, [value, lo, hi]: Interval) => ({
  series,
  value,
  lo,
  hi,
});

export function RecipeGapChart({ lang }: { lang: Lang }) {
  const t = text[lang];
  return (
    <DotPlot
      title={t.recipeGap.title}
      caption={t.recipeGap.caption}
      series={pairSeries(lang)}
      rows={recipes.map((recipe) => ({
        label: recipe.name,
        tag: recipe.main ? t.recipeGap.main : undefined,
        marks: [
          mark("cross", recipe.cross),
          mark("same", recipe.same),
          mark("mz", recipe.mz),
        ],
      }))}
      domain={[0.6, 1]}
      ticks={[0.6, 0.7, 0.8, 0.9, 1]}
      format={3}
      axisLabel={t.correlation}
      rowHeader={t.recipeGap.rowHeader}
      connect
      dataLabel={t.dataLabel}
    />
  );
}

export function RerunLadderChart({ lang }: { lang: Lang }) {
  const t = text[lang];
  return (
    <DotPlot
      title={t.ladder.title}
      caption={t.ladder.caption}
      series={[{ key: "r", label: t.ladder.series, shape: "dot", color: 1 }]}
      rows={ladder.map(({ r }, index) => ({
        label: t.ladder.rows[index],
        marks: [mark("r", r)],
      }))}
      domain={[0.75, 1]}
      ticks={[0.75, 0.8, 0.85, 0.9, 0.95, 1]}
      format={3}
      axisLabel={t.correlation}
      rowHeader={t.ladder.rowHeader}
      dataLabel={t.dataLabel}
    />
  );
}

export function LeadReversalChart({ lang }: { lang: Lang }) {
  const t = text[lang];
  return (
    <DotPlot
      title={t.leads.title}
      caption={t.leads.caption}
      series={pairSeries(lang)}
      rows={leadBins.map((bin, index) => ({
        label: bin.startsWith(">")
          ? t.leads.above(bin.slice(1))
          : t.leads.range(bin.replace("-", "–")),
        marks: pairKeys.map((key) => mark(key, leadReversed[key][index])),
      }))}
      domain={[0, 0.5]}
      ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]}
      format="percent"
      axisLabel={t.leads.axisLabel}
      rowHeader={t.leads.rowHeader}
      dataLabel={t.dataLabel}
    />
  );
}

export function FingerprintChart({ lang }: { lang: Lang }) {
  const t = text[lang];
  return (
    <DotPlot
      title={t.fingerprint.title}
      caption={t.fingerprint.caption}
      series={[
        { key: "run", label: t.fingerprint.run, shape: "dot", color: 1 },
        { key: "recipe", label: t.fingerprint.recipe, shape: "ring", color: 2 },
      ]}
      rows={fingerprint.run.map((run, index) => {
        const recipe = fingerprint.recipe[index];
        return {
          label: t.fingerprint.prompts(run.n.toLocaleString("en-US")),
          marks: [
            { series: "run", value: run.mean, lo: run.lo, hi: run.hi },
            {
              series: "recipe",
              value: recipe.mean,
              lo: recipe.lo,
              hi: recipe.hi,
            },
          ],
        };
      })}
      domain={[0, 1]}
      ticks={[0, 0.25, 0.5, 0.75, 1]}
      format="percent"
      axisLabel={t.fingerprint.axisLabel}
      rowHeader={t.fingerprint.rowHeader}
      dataLabel={t.dataLabel}
    />
  );
}
