/** One way to pay someone. Only `account` is copied, so it must be pasteable as is. */
export type PayMethod = {
  /** One of METHOD_TYPES. */
  type: string;
  /** Only for types with a `qualifier`: Bank's code, Other's name. Empty otherwise. */
  id: string;
  /** What the payer pastes: account number, user ID, email. */
  account: string;
};

type InputMode = "text" | "numeric" | "email" | "tel";

/** What each type asks for. Drives the editor, the display label and parsing. */
export const METHOD_SPECS = {
  Bank: {
    qualifier: {
      placeholder: "Code",
      label: "Bank code",
      inputMode: "numeric",
      maxLength: 3,
      width: "w-12",
    },
    account: { placeholder: "Account number", inputMode: "numeric" },
  },
  "LINE Pay": { account: { placeholder: "LINE ID", inputMode: "text" } },
  JKOPay: { account: { placeholder: "Phone or JKO ID", inputMode: "text" } },
  PayPal: {
    account: { placeholder: "Email or paypal.me/…", inputMode: "email" },
  },
  Wise: { account: { placeholder: "Email or @Wisetag", inputMode: "email" } },
  Revolut: { account: { placeholder: "@Revtag or phone", inputMode: "text" } },
  Other: {
    qualifier: {
      placeholder: "Name",
      label: "Method name, e.g. Venmo",
      inputMode: "text",
      maxLength: 24,
      width: "w-24",
    },
    account: { placeholder: "Account", inputMode: "text" },
  },
} satisfies Record<
  string,
  {
    qualifier?: {
      placeholder: string;
      label: string;
      inputMode: InputMode;
      maxLength: number;
      width: string;
    };
    account: { placeholder: string; inputMode: InputMode };
  }
>;

export type MethodType = keyof typeof METHOD_SPECS;
export const METHOD_TYPES = Object.keys(METHOD_SPECS) as MethodType[];

export function specFor(type: string) {
  const spec = METHOD_SPECS[type as MethodType] ?? METHOD_SPECS.Other;
  return {
    qualifier: "qualifier" in spec ? spec.qualifier : undefined,
    account: spec.account,
  };
}

/** "Bank · 812", "LINE Pay", or for Other just its name ("Venmo"). */
export function methodLabel(m: PayMethod): string {
  if (m.type === "Other" || !(m.type in METHOD_SPECS)) return m.id || m.type;
  return specFor(m.type).qualifier && m.id ? `${m.type} · ${m.id}` : m.type;
}

const MAX_METHODS = 6;
const clip = (v: unknown, n: number) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";

/** Parses untrusted JSON (from the DB or a form) into clean methods. */
export function parseMethods(raw: unknown): PayMethod[] {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => {
      // Free-text rows from before types existed keep their (empty) type.
      const type = clip(m?.type, 30);
      const q = type ? specFor(type).qualifier : undefined;
      return {
        type,
        id: q ? clip(m?.id, q.maxLength) : "",
        account: clip(m?.account, 120),
      };
    })
    .filter((m) => m.account)
    .slice(0, MAX_METHODS);
}
