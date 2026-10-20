/** Flag / icon emoji that makes the "global" in Orbit tangible. Purely presentational. */

const INDEX_FLAGS: Record<string, string> = {
  "^GSPC": "🇺🇸", "^IXIC": "🇺🇸", "^DJI": "🇺🇸", "^RUT": "🇺🇸",
  "^FTSE": "🇬🇧", "^GDAXI": "🇩🇪", "^FCHI": "🇫🇷", "^STOXX50E": "🇪🇺",
  "^N225": "🇯🇵", "^HSI": "🇭🇰", "^NSEI": "🇮🇳", "^BSESN": "🇮🇳",
  "^NSEBANK": "🇮🇳", "^CNXIT": "🇮🇳", "^CNXSC": "🇮🇳", "^TNX": "🇺🇸",
  "000001.SS": "🇨🇳", "399001.SZ": "🇨🇳", "^AXJO": "🇦🇺", "^GSPTSE": "🇨🇦",
  "^BVSP": "🇧🇷", "^KS11": "🇰🇷", "^TWII": "🇹🇼", "^JKSE": "🇮🇩", "^KLSE": "🇲🇾",
};

const SUFFIX_FLAGS: Record<string, string> = {
  T: "🇯🇵", KS: "🇰🇷", KQ: "🇰🇷", HK: "🇭🇰", NS: "🇮🇳", BO: "🇮🇳",
  DE: "🇩🇪", L: "🇬🇧", AS: "🇳🇱", PA: "🇫🇷", SS: "🇨🇳", SZ: "🇨🇳",
  TW: "🇹🇼", AX: "🇦🇺", TO: "🇨🇦", SA: "🇧🇷", SW: "🇨🇭", MI: "🇮🇹",
  MC: "🇪🇸", ST: "🇸🇪", OL: "🇳🇴", CO: "🇩🇰", HE: "🇫🇮", NZ: "🇳🇿", SI: "🇸🇬",
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", JPY: "🇯🇵", GBP: "🇬🇧", INR: "🇮🇳", CNY: "🇨🇳",
  CNH: "🇨🇳", HKD: "🇭🇰", AUD: "🇦🇺", CAD: "🇨🇦", CHF: "🇨🇭", KRW: "🇰🇷",
  TWD: "🇹🇼", SGD: "🇸🇬", NZD: "🇳🇿", BRL: "🇧🇷", ZAR: "🇿🇦", MXN: "🇲🇽",
};

const EXCHANGE_FLAGS: [RegExp, string][] = [
  [/nasdaq|nyse|amex|nas|nys|arca|cboe/i, "🇺🇸"],
  [/london|lse/i, "🇬🇧"], [/xetra|frankfurt|ger/i, "🇩🇪"], [/euronext paris|par/i, "🇫🇷"],
  [/euronext amsterdam|ams/i, "🇳🇱"], [/tokyo|tky|japan/i, "🇯🇵"], [/hong kong|hkg/i, "🇭🇰"],
  [/nse|bse|india/i, "🇮🇳"], [/shanghai|shenzhen/i, "🇨🇳"], [/korea|kosdaq|krx/i, "🇰🇷"],
  [/taiwan/i, "🇹🇼"], [/asx|sydney/i, "🇦🇺"], [/toronto|tsx/i, "🇨🇦"], [/sao|bovespa/i, "🇧🇷"],
  [/swiss|six/i, "🇨🇭"], [/ccc|coin|crypto/i, "🪙"],
];

export function flagFor(
  symbol: string,
  opts?: { type?: string; exchange?: string; currency?: string },
): string {
  const s = symbol.toUpperCase();
  if (INDEX_FLAGS[s]) return INDEX_FLAGS[s];

  // FX pairs like EURUSD=X, USDINR=X
  const fx = s.replace("=X", "");
  if (s.endsWith("=X") && fx.length >= 6) return CURRENCY_FLAGS[fx.slice(0, 3)] ?? "💱";
  if (opts?.type === "CURRENCY") return "💱";

  // Crypto
  if (s.includes("-USD") || s.includes("-EUR") || opts?.type === "CRYPTOCURRENCY") {
    if (s.startsWith("BTC")) return "₿";
    if (s.startsWith("ETH")) return "Ξ";
    return "🪙";
  }

  // Commodities & futures
  if (s.endsWith("=F")) {
    if (s.startsWith("GC")) return "🥇";
    if (s.startsWith("SI")) return "🥈";
    if (s.startsWith("CL") || s.startsWith("BZ")) return "🛢️";
    if (s.startsWith("NG")) return "🔥";
    if (s.startsWith("HG")) return "🔶";
    return "📦";
  }

  const suffix = s.split(".").pop();
  if (suffix && suffix !== s && SUFFIX_FLAGS[suffix]) return SUFFIX_FLAGS[suffix];

  if (opts?.exchange) for (const [re, flag] of EXCHANGE_FLAGS) if (re.test(opts.exchange)) return flag;
  if (!s.includes(".") && opts?.currency && /^[A-Z]{3}$/.test(opts.currency) && s.length <= 5) return "🇺🇸";
  if (opts?.currency && CURRENCY_FLAGS[opts.currency] && !s.includes(".")) return CURRENCY_FLAGS[opts.currency];
  return "🌍";
}

/** Short region label shown next to the flag, e.g. "Japan" for 7203.T */
const SUFFIX_REGIONS: Record<string, string> = {
  T: "Japan", KS: "South Korea", KQ: "South Korea", HK: "Hong Kong", NS: "India", BO: "India",
  DE: "Germany", L: "UK", AS: "Netherlands", PA: "France", SS: "China", SZ: "China",
  TW: "Taiwan", AX: "Australia", TO: "Canada", SA: "Brazil", SW: "Switzerland",
};
export function regionFor(symbol: string): string | undefined {
  return SUFFIX_REGIONS[symbol.toUpperCase().split(".").pop() ?? ""];
}
