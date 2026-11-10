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

> 🕐 **Last audited:** Prod: Tue, 10 Nov 2026 12:13:27 GMT  
> 🌐 **Deployment:** https://emilychang.me

| Route       | Locale | Lab 🖥️ Perf | Lab 🖥️ FCP | Lab 🖥️ LCP | Lab 🖥️ TBT | Lab 🖥️ CLS | Lab 🖥️ SI | Lab 📱 Perf | Lab 📱 FCP | Lab 📱 LCP | Lab 📱 TBT | Lab 📱 CLS | Lab 📱 SI | Prod 🖥️ Perf                                                       | Prod 🖥️ FCP | Prod 🖥️ LCP | Prod 🖥️ TBT | Prod 🖥️ CLS | Prod 🖥️ SI | Prod 📱 Perf                                                       | Prod 📱 FCP | Prod 📱 LCP | Prod 📱 TBT | Prod 📱 CLS | Prod 📱 SI |
| :---------- | :----- | :---------- | :--------- | :--------- | :--------- | :--------- | :-------- | :---------- | :--------- | :--------- | :--------- | :--------- | :-------- | :----------------------------------------------------------------- | :---------- | :---------- | :---------- | :---------- | :--------- | :----------------------------------------------------------------- | :---------- | :---------- | :---------- | :---------- | :--------- |
| `/`         | EN     | -           | -          | -          | -          | -          | -         | -           | -          | -          | -          | -          | -         | ![64](https://img.shields.io/badge/64-important?style=flat-square) | 0.5 s       | 1.7 s       | 750 ms      | 0           | 1.9 s      | ![42](https://img.shields.io/badge/42-critical?style=flat-square)  | 1.9 s       | 8.9 s       | 11,470 ms   | 0           | 4.2 s      |
| `/linktree` | EN     | -           | -          | -          | -          | -          | -         | -           | -          | -          | -          | -          | -         | ![94](https://img.shields.io/badge/94-success?style=flat-square)   | 0.5 s       | 1.7 s       | 10 ms       | 0           | 0.6 s      | ![72](https://img.shields.io/badge/72-important?style=flat-square) | 1.7 s       | 9.3 s       | 180 ms      | 0           | 2.2 s      |

<!-- LIGHTHOUSE_RESULTS_END -->
