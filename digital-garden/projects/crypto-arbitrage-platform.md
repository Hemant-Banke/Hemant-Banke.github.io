---
title: Real-Time Crypto Arbitrage Signal Platform
date: 2020-06-01
tags: [quant]
summary: To generate real-time arbitrage signals between crypto pairs across exchanges.
byline: freelance · 2019–2021
links:
  - label: code
    href: https://github.com/Hemant-Banke/crypto-updates
---

Crypto prices for the same pair routinely diverge across exchanges, but a
visible spread isn't the same thing as a tradeable one. By
the time we've moved funds over, withdrawn, and paid fees, most gaps have
already closed. The platform, built on Django, computed
inter-exchange spreads for cryptocurrency pairs in real time and filtered
for **execution-feasible** opportunities specifically: spreads wide enough to
survive withdrawal fees, transfer latency, and slippage.

**Tools Used**: Python, Django, REST APIs