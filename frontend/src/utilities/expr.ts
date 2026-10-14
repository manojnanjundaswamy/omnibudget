/**
 * The calculator's expression engine: a safe recursive-descent parser.
 * Supports standard arithmetic, scientific functions, constants (pi, e),
 * Indian scale words (k, L/lakh, cr/crore), and percentage calculation.
 */

export type AngleMode = 'deg' | 'rad';

export class ExprError extends Error {}

const FUNCS: Record<string, (x: number, mode: AngleMode) => number> = {
  sqrt: (x) => Math.sqrt(x),
  cbrt: (x) => Math.cbrt(x),
  abs: (x) => Math.abs(x),
  ln: (x) => Math.log(x),
  log: (x) => Math.log10(x),
  exp: (x) => Math.exp(x),
  round: (x) => Math.round(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  sin: (x, m) => Math.sin(m === 'deg' ? (x * Math.PI) / 180 : x),
  cos: (x, m) => Math.cos(m === 'deg' ? (x * Math.PI) / 180 : x),
  tan: (x, m) => Math.tan(m === 'deg' ? (x * Math.PI) / 180 : x),
  asin: (x, m) => (m === 'deg' ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)),
  acos: (x, m) => (m === 'deg' ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
  atan: (x, m) => (m === 'deg' ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
};

const CONSTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E };
const SCALE: Record<string, number> = {
  k: 1e3,
  l: 1e5,
  lakh: 1e5,
  lakhs: 1e5,
  cr: 1e7,
  crore: 1e7,
  crores: 1e7,
};

type Token = { t: 'num'; v: number } | { t: 'op'; v: string } | { t: 'id'; v: string };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.,]/.test(s[j]!)) j++;
      let raw = s.slice(i, j);
      while (raw.endsWith(',')) {
        raw = raw.slice(0, -1);
        j--;
      }
      const text = raw.replace(/,/g, '');
      if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) throw new ExprError(`Can't read the number ${raw}`);
      let v = Number(text);
      if (s[j] === 'e' && /[-+0-9]/.test(s[j + 1] ?? '') && !/[a-z]/i.test(s[j + 2] ?? '')) {
        let k = j + 1;
        if (s[k] === '-' || s[k] === '+') k++;
        while (k < s.length && /[0-9]/.test(s[k]!)) k++;
        v = Number(text + s.slice(j, k));
        j = k;
      }
      out.push({ t: 'num', v });
      i = j;
      continue;
    }
    if (/[a-zπ]/i.test(c)) {
      let j = i;
      while (j < s.length && /[a-zπ]/i.test(s[j]!)) j++;
      out.push({ t: 'id', v: s.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ('+-*/^()%!'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    throw new ExprError(`Unexpected "${c}"`);
  }
  return out;
}

export function evaluate(src: string, mode: AngleMode = 'deg', ans = 0): number {
  const tokens = tokenize(src);
  let p = 0;
  const peek = () => tokens[p];
  const isOp = (v: string) => peek()?.t === 'op' && peek()!.v === v;
  const eat = (v: string) => {
    if (!isOp(v)) throw new ExprError(v === ')' ? 'A bracket isn’t closed' : `Expected ${v}`);
    p++;
  };

  function expr(): number {
    let left = term();
    while (isOp('+') || isOp('-')) {
      const op = tokens[p++]!.v;
      const start = p;
      let right = term();
      if (p > start && tokens[p - 1]?.t === 'op' && tokens[p - 1]?.v === '%') {
        right = left * (right / 100);
      }
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function term(): number {
    let left = unary();
    while (isOp('*') || isOp('/') || (peek()?.t === 'id' && peek()!.v === 'mod')) {
      const op = tokens[p++]!.v;
      const right = unary();
      if (op === '*') left *= right;
      else if (op === '/') {
        if (right === 0) throw new ExprError('Division by zero');
        left /= right;
      } else {
        left = left % right;
      }
    }
    return left;
  }

  function unary(): number {
    if (isOp('+')) {
      p++;
      return unary();
    }
    if (isOp('-')) {
      p++;
      return -unary();
    }
    return power();
  }

  function power(): number {
    let base = postfix();
    if (isOp('^')) {
      p++;
      const exp = unary();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function factorial(n: number): number {
    if (n < 0 || Math.floor(n) !== n || n > 170) throw new ExprError('Factorial only works for small non-negative integers');
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  function postfix(): number {
    let v = atom();
    while (isOp('%') || isOp('!')) {
      const op = tokens[p++]!.v;
      if (op === '%') {
        v = v / 100;
      } else if (op === '!') {
        v = factorial(v);
      }
    }
    return v;
  }

  function atom(): number {
    const t = peek();
    if (!t) throw new ExprError('The expression ends too early');
    if (t.t === 'num') {
      p++;
      const next = peek();
      if (next?.t === 'id' && next.v in SCALE) {
        p++;
        return t.v * SCALE[next.v]!;
      }
      return t.v;
    }
    if (t.t === 'op' && t.v === '(') {
      p++;
      const v = expr();
      eat(')');
      return v;
    }
    if (t.t === 'id') {
      p++;
      if (t.v === 'ans') return ans;
      if (t.v in CONSTS) return CONSTS[t.v]!;
      const f = FUNCS[t.v];
      if (f) {
        eat('(');
        const v = expr();
        eat(')');
        return f(v, mode);
      }
      throw new ExprError(`Unknown word "${t.v}"`);
    }
    throw new ExprError(`Unexpected "${t.v}"`);
  }

  if (tokens.length === 0) return 0;
  const value = expr();
  if (p < tokens.length) {
    throw new ExprError(tokens[p]!.v === ')' ? 'There’s an extra closing bracket' : `Unexpected "${tokens[p]!.v}"`);
  }
  if (!Number.isFinite(value)) throw new ExprError('The result is too large');
  return Number.parseFloat(value.toPrecision(12));
}

export function formatNumber(v: number, locale = 'en-IN'): string {
  if (Math.abs(v) >= 1e15 || (v !== 0 && Math.abs(v) < 1e-6)) return v.toExponential(6);
  return v.toLocaleString(locale, { maximumFractionDigits: 10 });
}
