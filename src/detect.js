'use strict';
const customs = require('./customs');

const R = (status, detail) => ({ status, detail: detail || '' });
const cap = (arr, n) => arr.slice(0, n || 3).join(', ') + (arr.length > (n || 3) ? ` (+${arr.length - (n || 3)} more)` : '');

function combine(results) {
  const rs = results.filter((r) => r.status !== 'na');
  if (!rs.length) return 'na';
  if (rs.some((r) => r.status === 'fail')) return 'fail';
  if (rs.some((r) => r.status === 'warn')) return 'warn';
  if (rs.some((r) => r.status === 'cannot-verify')) return 'cannot-verify';
  return 'pass';
}

// Detector expressions are small JSON-like objects in the catalog:
//   exists / contains / absent / any / all / per-eco / stack / dep / custom
function evalExpr(e, ctx) {
  if (!e) return R('na', 'no detector');
  switch (e.type) {
    case 'exists': {
      const f = ctx.repo.match(e.paths);
      return f.length ? R('pass', 'found ' + cap(f)) : R('fail', 'none of: ' + cap(e.paths, 4));
    }
    case 'contains': {
      const files = ctx.repo.match(e.paths);
      if (!files.length) return R('fail', 'no files matching ' + cap(e.paths, 3));
      const re = new RegExp(e.pattern, e.flags || 'im');
      const hit = files.find((f) => re.test(ctx.repo.read(f)));
      return hit ? R('pass', 'found in ' + hit) : R('fail', `pattern not found in ${files.length} file(s)`);
    }
    case 'absent': {
      const re = new RegExp(e.pattern, e.flags || 'im');
      const hits = ctx.repo.match(e.paths).filter((f) => re.test(ctx.repo.read(f)));
      return hits.length ? R('fail', 'found in ' + cap(hits)) : R('pass', '');
    }
    case 'any': {
      const rs = e.of.map((x) => evalExpr(x, ctx));
      const pass = rs.find((r) => r.status === 'pass');
      if (pass) return pass;
      const cv = rs.find((r) => r.status === 'cannot-verify');
      if (cv) return cv;
      const warn = rs.find((r) => r.status === 'warn');
      if (warn) return warn;
      const fails = rs.filter((r) => r.status === 'fail');
      return fails.length ? R('fail', fails[0].detail) : R('na', '');
    }
    case 'all': {
      const rs = e.of.map((x) => evalExpr(x, ctx));
      const status = combine(rs);
      return R(status, rs.filter((r) => r.status !== 'pass' && r.status !== 'na').map((r) => r.detail).filter(Boolean).join('; '));
    }
    case 'per-eco': {
      const ecos = ['node', 'python'].filter((t) => ctx.stack.has(t) && e[t]);
      if (!ecos.length) return R('na', 'no matching ecosystem');
      const rs = ecos.map((t) => ({ t, r: evalExpr(e[t], ctx) }));
      const status = combine(rs.map((x) => x.r));
      const bad = rs.filter((x) => x.r.status !== 'pass' && x.r.status !== 'na');
      return R(status, bad.map((x) => `${x.t}: ${x.r.detail}`).join('; '));
    }
    case 'stack':
      return e.tags.some((t) => ctx.stack.has(t)) ? R('pass', '') : R('na', 'stack does not match');
    case 'dep':
      return ctx.repo.hasDep(e.names) ? R('pass', 'dependency found') : R('na', 'dependency not found');
    case 'custom': {
      const fn = customs[e.name];
      if (!fn) return R('cannot-verify', `unknown detector "${e.name}"`);
      try { return fn(ctx, e); } catch (err) { return R('cannot-verify', `detector error: ${err.message}`); }
    }
    default:
      return R('cannot-verify', `unknown detector type "${e.type}"`);
  }
}

module.exports = { evalExpr, combine };
