---
title: Nowcasting Stock Implied Volatility with Twitter
date: 2023-01-01
tags: [quant, statistics]
summary: Day-ahead IV forecasting gains via gradient-boosted ensembles combining Twitter
  derived attention and sentiment features with market-data features.
byline: guided by Prof. Dr. Diganta Mukherjee · ISI Kolkata
links:
  - label: summary report
    href: /project_reports/Nowcasting%20Stock%20Implied%20Volatility%20using%20Twitter.pdf
  - label: extension
    href: /project_reports/Nowcasting%20Stock%20Implied%20Volatility%20using%20Twitter%20(Extension).pdf
---

*Supervisor: Prof. Dr. Diganta Mukherjee, ISI Kolkata*

Summarizes Dierckx et al.'s paper on forecasting
next-day implied volatility from a mix of price data and Twitter-derived
attention/sentiment features: tweet counts and VADER polarity scores,
each paired with a first-difference and a 10-day-EMA deviation to capture
momentum, across 165 stocks. Their headline finding was that the Twitter
features carried real predictive signal beyond price alone, via random
forests.

The extension is where the original work is: swap in **gradient boosting**
model against random forest as the classifier, add **trading volume** as a
feature, and narrow the universe to five tech names (MSFT, AMZN, TSLA,
GOOG, AAPL) with tweets pulled from a Kaggle sentiment dataset and IV
scraped from AlphaQuery. GBM beat RF on test ROC-AUC (0.655 vs. 0.619), and
an ablation across feature subsets showed removing the Twitter features cost
the most AUC of anything tried, more than removing volume, which barely
mattered. Splitting by stock also surfaced a bias worth flagging: predictive
power tracked how much a stock got tweeted about, meaning the "signal" is
partly just an artifact of retail attention being unevenly distributed
across tickers.

**Tools Used**: R
