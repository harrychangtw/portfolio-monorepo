// Figure data from "Identically Trained Language Models Break on Different
// Jailbreaks" (castor repo, icml-2027/figures/data/*.tsv), rounded for
// display. Ported from cerulean-website/src/components/castor/data.ts.
// Each value is [estimate, 95% low, 95% high] unless noted.

export type Interval = [number, number, number];

export const pairKinds = [
  {
    key: "mz",
    label: "MZ twins",
    detail: "Same base model, new post-training seed",
  },
  {
    key: "same",
    label: "Same-recipe pairs",
    detail: "Same data, different pretraining run",
  },
  { key: "cross", label: "Cross-recipe pairs", detail: "Different data" },
] as const;

export type PairKey = (typeof pairKinds)[number]["key"];

/** Figure 2: mean corrected per-prompt correlation in each data recipe. */
export const recipes: {
  name: string;
  main: boolean;
  mz: Interval;
  same: Interval;
  cross: Interval;
  gap: number;
}[] = [
  {
    name: "DCLM-Baseline (QC FW 10%)",
    main: false,
    mz: [0.982, 0.979, 0.986],
    same: [0.773, 0.759, 0.787],
    cross: [0.748, 0.737, 0.759],
    gap: 0.209,
  },
  {
    name: "DCLM-Baseline (QC 10%)",
    main: false,
    mz: [0.98, 0.977, 0.983],
    same: [0.777, 0.764, 0.79],
    cross: [0.775, 0.765, 0.784],
    gap: 0.203,
  },
  {
    name: "Dolma1.7 (no Reddit)",
    main: false,
    mz: [0.989, 0.985, 0.992],
    same: [0.796, 0.782, 0.809],
    cross: [0.783, 0.773, 0.792],
    gap: 0.192,
  },
  {
    name: "DCLM-Baseline 75% / Dolma 25%",
    main: false,
    mz: [0.984, 0.981, 0.987],
    same: [0.799, 0.787, 0.812],
    cross: [0.777, 0.767, 0.787],
    gap: 0.185,
  },
  {
    name: "Falcon+CC (QC 10%)",
    main: false,
    mz: [0.989, 0.986, 0.991],
    same: [0.804, 0.791, 0.816],
    cross: [0.766, 0.756, 0.776],
    gap: 0.185,
  },
  {
    name: "C4",
    main: false,
    mz: [0.979, 0.975, 0.982],
    same: [0.796, 0.782, 0.809],
    cross: [0.786, 0.776, 0.795],
    gap: 0.182,
  },
  {
    name: "DCLM-Baseline (QC 7%, FW3)",
    main: false,
    mz: [0.978, 0.974, 0.982],
    same: [0.797, 0.784, 0.809],
    cross: [0.758, 0.747, 0.768],
    gap: 0.181,
  },
  {
    name: "DCLM-Baseline (QC FW 3%)",
    main: false,
    mz: [0.973, 0.968, 0.978],
    same: [0.794, 0.78, 0.807],
    cross: [0.647, 0.632, 0.661],
    gap: 0.179,
  },
  {
    name: "Falcon+CC (QC Tulu 10%)",
    main: false,
    mz: [0.985, 0.981, 0.988],
    same: [0.808, 0.794, 0.82],
    cross: [0.787, 0.777, 0.796],
    gap: 0.177,
  },
  {
    name: "Falcon",
    main: false,
    mz: [0.985, 0.982, 0.989],
    same: [0.809, 0.797, 0.821],
    cross: [0.788, 0.779, 0.798],
    gap: 0.176,
  },
  {
    name: "DCLM-Baseline",
    main: true,
    mz: [0.984, 0.981, 0.987],
    same: [0.809, 0.796, 0.822],
    cross: [0.786, 0.775, 0.795],
    gap: 0.175,
  },
  {
    name: "Falcon+CC (QC 20%)",
    main: false,
    mz: [0.986, 0.983, 0.989],
    same: [0.812, 0.8, 0.824],
    cross: [0.786, 0.776, 0.795],
    gap: 0.174,
  },
  {
    name: "Dolma1.6++",
    main: false,
    mz: [0.981, 0.978, 0.984],
    same: [0.808, 0.795, 0.82],
    cross: [0.786, 0.777, 0.796],
    gap: 0.173,
  },
  {
    name: "FineWeb-Pro",
    main: false,
    mz: [0.986, 0.983, 0.989],
    same: [0.813, 0.8, 0.824],
    cross: [0.778, 0.767, 0.787],
    gap: 0.173,
  },
  {
    name: "Dolma1.7 (no math, code)",
    main: false,
    mz: [0.985, 0.982, 0.989],
    same: [0.813, 0.8, 0.824],
    cross: [0.791, 0.781, 0.8],
    gap: 0.173,
  },
  {
    name: "DCLM-Baseline (QC 7%, FW2)",
    main: false,
    mz: [0.982, 0.979, 0.986],
    same: [0.812, 0.8, 0.824],
    cross: [0.786, 0.776, 0.795],
    gap: 0.17,
  },
  {
    name: "FineWeb-Edu",
    main: false,
    mz: [0.983, 0.979, 0.986],
    same: [0.813, 0.802, 0.825],
    cross: [0.781, 0.771, 0.79],
    gap: 0.169,
  },
  {
    name: "DCLM-Baseline (QC 20%)",
    main: false,
    mz: [0.981, 0.978, 0.985],
    same: [0.82, 0.807, 0.831],
    cross: [0.786, 0.775, 0.795],
    gap: 0.161,
  },
  {
    name: "Dolma1.7 (no Flan)",
    main: false,
    mz: [0.989, 0.986, 0.992],
    same: [0.829, 0.818, 0.84],
    cross: [0.796, 0.787, 0.805],
    gap: 0.16,
  },
  {
    name: "Dolma1.7",
    main: false,
    mz: [0.987, 0.983, 0.99],
    same: [0.828, 0.816, 0.838],
    cross: [0.792, 0.782, 0.8],
    gap: 0.159,
  },
  {
    name: "Falcon+CC (QC Orig 10%)",
    main: false,
    mz: [0.983, 0.98, 0.986],
    same: [0.825, 0.814, 0.836],
    cross: [0.797, 0.788, 0.806],
    gap: 0.158,
  },
  {
    name: "Dolma1.7 (no code)",
    main: false,
    mz: [0.987, 0.984, 0.99],
    same: [0.833, 0.821, 0.844],
    cross: [0.801, 0.791, 0.809],
    gap: 0.154,
  },
  {
    name: "Falcon+CC",
    main: false,
    mz: [0.986, 0.982, 0.989],
    same: [0.832, 0.82, 0.843],
    cross: [0.797, 0.787, 0.805],
    gap: 0.154,
  },
  {
    name: "DCLM-Baseline 25% / Dolma 75%",
    main: false,
    mz: [0.987, 0.985, 0.99],
    same: [0.835, 0.825, 0.845],
    cross: [0.798, 0.789, 0.806],
    gap: 0.152,
  },
  {
    name: "DCLM-Baseline 50% / Dolma 50%",
    main: false,
    mz: [0.984, 0.981, 0.987],
    same: [0.839, 0.827, 0.849],
    cross: [0.795, 0.786, 0.804],
    gap: 0.145,
  },
];

/** Figure 3: the rerun ladder on the main data recipe (DCLM-Baseline, 1B). */
export const ladder: { label: string; r: Interval }[] = [
  { label: "same weights", r: [0.985, 0.983, 0.987] },
  { label: "same seed, reruns", r: [0.844, 0.835, 0.853] },
  { label: "shared init only", r: [0.822, 0.811, 0.833] },
  { label: "shared order only", r: [0.822, 0.81, 0.833] },
  { label: "different seed", r: [0.814, 0.801, 0.825] },
  { label: "different recipe", r: [0.779, 0.77, 0.787] },
];

/** Figure 4a: share of template leads reversed on the partner model, by lead size (points). */
export const leadBins = ["0-2", "2-5", "5-10", "10-20", ">20"];
export const leadReversed: Record<PairKey, Interval[]> = {
  mz: [
    [0.4415, 0.4369, 0.4465],
    [0.2927, 0.2861, 0.2996],
    [0.1311, 0.1234, 0.1391],
    [0.0222, 0.0194, 0.0255],
    [0.0005, 0.0003, 0.0007],
  ],
  same: [
    [0.4843, 0.4805, 0.4882],
    [0.4338, 0.4297, 0.438],
    [0.3653, 0.3596, 0.3713],
    [0.2531, 0.2446, 0.2623],
    [0.0885, 0.0819, 0.0968],
  ],
  cross: [
    [0.4832, 0.4809, 0.4854],
    [0.4363, 0.4331, 0.4397],
    [0.3732, 0.3686, 0.3777],
    [0.2663, 0.2587, 0.2743],
    [0.1032, 0.0941, 0.1143],
  ],
};

/** Figure 4b: identification accuracy by number of prompts; chance is 1/75 and 1/25. */
export const fingerprint = {
  run: [
    { n: 10, mean: 0.335, lo: 0.213, hi: 0.48 },
    { n: 20, mean: 0.687, lo: 0.533, hi: 0.84 },
    { n: 50, mean: 0.981, lo: 0.933, hi: 1.0 },
    { n: 100, mean: 1.0, lo: 1.0, hi: 1.0 },
    { n: 300, mean: 1.0, lo: 1.0, hi: 1.0 },
    { n: 1000, mean: 1.0, lo: 1.0, hi: 1.0 },
    { n: 3211, mean: 1.0, lo: 1.0, hi: 1.0 },
  ],
  recipe: [
    { n: 10, mean: 0.078, lo: 0.0, hi: 0.18 },
    { n: 20, mean: 0.098, lo: 0.02, hi: 0.2 },
    { n: 50, mean: 0.138, lo: 0.04, hi: 0.24 },
    { n: 100, mean: 0.176, lo: 0.08, hi: 0.28 },
    { n: 300, mean: 0.252, lo: 0.14, hi: 0.4 },
    { n: 1000, mean: 0.357, lo: 0.22, hi: 0.5 },
    { n: 3211, mean: 0.48, lo: 0.48, hi: 0.48 },
  ],
};
