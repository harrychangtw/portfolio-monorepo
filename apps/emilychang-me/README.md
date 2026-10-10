# emilychang-me

Next.js 15 portfolio app deployed at [emilychang.me](https://emilychang.me).

[![Lint & Format](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/lint.yml/badge.svg)](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/lint.yml)
[![Typecheck](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/typecheck.yml/badge.svg)](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/typecheck.yml)
[![Bundle Size](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/bundle-size.yml/badge.svg)](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/bundle-size.yml)
[![Lighthouse Audit (emilychang.me)](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/lighthouse-prod-emily.yml/badge.svg)](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/lighthouse-prod-emily.yml)
[![Dependency Audit](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/audit.yml/badge.svg)](https://github.com/Harrychangtw/portfolio-monorepo/actions/workflows/audit.yml)

The `lint`, `typecheck`, and `bundle-size` workflows each fan out into separate `harry` and `emily` jobs — the badges above turn red if either job fails. Production Lighthouse runs against this app via [`lighthouse-prod-emily.yml`](../../.github/workflows/lighthouse-prod-emily.yml), gated on the `portfolio-monorepo-emilychang-me` Vercel deployment so it never collides with the harry production audit.

## Production Lighthouse

Audited automatically against the live deployment after every successful Vercel
Production deploy.

<!-- LIGHTHOUSE_RESULTS_START -->

> 🕐 **Last audited:** Prod: Sat, 10 Oct 2026 10:28:31 GMT  
> 🌐 **Deployment:** https://emilychang.me

| Route       | Locale | Lab 🖥️ Perf | Lab 🖥️ FCP | Lab 🖥️ LCP | Lab 🖥️ TBT | Lab 🖥️ CLS | Lab 🖥️ SI | Lab 📱 Perf | Lab 📱 FCP | Lab 📱 LCP | Lab 📱 TBT | Lab 📱 CLS | Lab 📱 SI | Prod 🖥️ Perf                                                       | Prod 🖥️ FCP | Prod 🖥️ LCP | Prod 🖥️ TBT | Prod 🖥️ CLS | Prod 🖥️ SI | Prod 📱 Perf                                                       | Prod 📱 FCP | Prod 📱 LCP | Prod 📱 TBT | Prod 📱 CLS | Prod 📱 SI |
| :---------- | :----- | :---------- | :--------- | :--------- | :--------- | :--------- | :-------- | :---------- | :--------- | :--------- | :--------- | :--------- | :-------- | :----------------------------------------------------------------- | :---------- | :---------- | :---------- | :---------- | :--------- | :----------------------------------------------------------------- | :---------- | :---------- | :---------- | :---------- | :--------- |
| `/`         | EN     | -           | -          | -          | -          | -          | -         | -           | -          | -          | -          | -          | -         | ![62](https://img.shields.io/badge/62-important?style=flat-square) | 0.5 s       | 1.7 s       | 830 ms      | 0           | 1.9 s      | ![35](https://img.shields.io/badge/35-critical?style=flat-square)  | 1.8 s       | 9.0 s       | 13,440 ms   | 0           | 13.1 s     |
| `/linktree` | EN     | -           | -          | -          | -          | -          | -         | -           | -          | -          | -          | -          | -         | ![93](https://img.shields.io/badge/93-success?style=flat-square)   | 0.5 s       | 1.8 s       | 0 ms        | 0           | 0.7 s      | ![71](https://img.shields.io/badge/71-important?style=flat-square) | 1.7 s       | 9.1 s       | 200 ms      | 0           | 2.3 s      |

<!-- LIGHTHOUSE_RESULTS_END -->
