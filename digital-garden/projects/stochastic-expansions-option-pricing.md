---
title: More Stochastic Expansions for Pricing Vanilla Options with Cash Dividends
date: 2022-11-01
tags: [quant, statistics]
summary: Research reading of a stochastic-Taylor-expansion technique for pricing vanilla options under discrete cash dividends, expanding around the forward instead of the spot.
byline: with Vicky Gupta, Kushpreet Singh · guided by Prof. Diganta Mukherjee · ISI Kolkata
links:
  - label: summary report
    href: /project_reports/More%20Stochastic%20Expansions%20for%20pricing%20vanilla%20options%20with%20cash%20dividents.pdf
---

*Supervisor: Prof. Dr. Diganta Mukherjee*

A Research reading report on a paper extending Étoré and Gobet's shifted-lognormal
expansion technique for option pricing under **discrete cash dividends**.

The setup problem: proportional-dividend models are easy, but real
dividends are better modeled as fixed cash amounts, especially near
maturity. Cash dividends make the stock price jump at each ex-date, and to
stay inside a Black-Scholes-type framework via an equivalent dividend yield,
the model's volatility has to jump too. This makes the forward dividend
yield blow up and hurts the numerical accuracy of any PDE solver. There's no
exact closed form for a piecewise-lognormal process with dividend jumps, so
the paper falls back to a **stochastic Taylor expansion**, deriving
first-, second-, and third-order price corrections. Where Étoré and Gobet
expand around a shifted lognormal *spot* model, this paper expands around the
**forward** instead, which is the source of its improved accuracy over the
original technique.
