---
title: Ensemble Methods for Expected Goals (xG) Modeling
date: 2022-06-19
tags: [machine-learning, statistics]
summary: Stacked ensembles for shot-quality estimation in football, with two custom geometric features and a class-imbalance-aware training pipeline.
byline: with Sayantan Deb Barman, Soham Majumdar · guided by Prof. Dr. Deepayan Sarkar · ISI Kolkata
links:
  - label: report
    href: /project_reports/Building%20Expected%20Goals%20(xG)%20Model%20using%20Ensemble%20Methods%20in%20Football%20Analytics.pdf
---

*Supervisor: Prof. Dr. Deepayan Sarkar, ISI Delhi*

**Expected Goals (xG)** scores a shot's quality, the probability it becomes a
goal, as a less noisy stand-in for counting actual goals, which are sparse
and heavily luck-driven. Working from StatsBomb's FA Women's Super League
open data, we built shot-level features (distance and angle to goal, body
part, play pattern, defender positions from the freeze frame) and added two
of our own: **maximum acute angle** (folding the shot angle so left/right
symmetry doesn't get penalized) and **incone density**, a sum of inverse
distances to defenders inside the shot-to-goalposts cone, capturing how
contested the shooting lane really is.

Only about 12% of shots are goals, so training used ROSE resampling inside
repeated k-fold CV throughout. We fit the usual ladder: penalized logistic
regression, decision trees, random forest, AdaBoost, boosted logistic
regression, then stacked pairs of base learners (glmnet + kNN, glmnet +
decision tree) under both a linear and a GBM meta-model. Random forest came
out on top on ROC-AUC (~0.785), with the glmnet-based stacked models close behind;
plain penalized logistic regression stayed competitive throughout, suggesting
the signal here is mostly linear with a smaller nonlinear residual.

This project is what pulled me toward treating defense as a coordination
problem, which became [[Multi-Agent RL for Defensive Coordination in Soccer]].

**Tools Used**: R
