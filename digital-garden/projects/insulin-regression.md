---
title: Predicting Insulin Levels via Regression Modeling
date: 2021-12-22
tags: [machine-learning, statistics]
summary: Fitting separate multiple linear regression models for plasma insulin across three diabetic patient groups, handling multicollinearity, non-normal residuals, and curvature.
byline: with Bhushan Suresh Malgunkar, Sayantan Deb Barman · guided by Prof. Dr. Swagata Nandi · ISI New Delhi
links:
  - label: report
    href: /project_reports/Predicting%20Insulin%20Levels%20via%20Regression%20Modeling.pdf
---

*Supervisor: Prof. Dr. Swagata Nandi, ISI New Delhi*

A regression-analysis project on the classic Diabetes dataset (144
patients: Normal, Chemically Diabetic, Overt Diabetic), modeling how plasma
insulin depends on blood glucose and relative weight. Modeled separately for each
patient group, since pooling them would hide the fact that the relationship
plausibly differs by diabetic status.

Each group broke the textbook assumptions in a different way, which was the
actual point of the exercise: 
- **Overt Diabetic** patients showed
multicollinearity between the explanatory variables, addressed with **ridge
regression** to get stable coefficient estimates and still assess
significance.
- **Normal** patients had non-normal residuals, fixed with a
**Box-Cox transformation** of the response.
- **Chemically Diabetic** patients
showed curvature in the partial residual plots, calling for transforming the
explanatory variables rather than the response. 

The difference in predicted insulin levels in the three cases gives insight on how insulin helps in transferring glucose to cells and how this process is affected during Diabetes.

**Tools Used**: Multiple Linear Regression, Regression Diagnostics, All possible Regression, Box-Cox Transformation, Influential Point identification (using Cook's Distance, DFBETA, DFFITS, Covratio), R
