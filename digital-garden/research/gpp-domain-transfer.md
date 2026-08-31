---
title: Concept Drift and Domain Transfer for GPP Estimation
date: 2023-06-01
tags: [machine-learning, statistics, thesis]
summary: Master's thesis on transferring supervised GPP models from data-rich global flux towers to a low-data Indian terrain, and quantifying how much to trust the transfer without ground truth.
byline: Master's Thesis · guided by Prof. Dr. B. Uma Shankar · ISI Kolkata
star: true
links:
  - label: thesis
    href: /project_reports/Improved%20terrestrial%20Gross%20Primary%20Productivity%20(GPP)%20estimation%20using%20multisource%20Data/Project%20Report.pdf
  - label: slides
    href: /project_reports/Improved%20terrestrial%20Gross%20Primary%20Productivity%20(GPP)%20estimation%20using%20multisource%20Data/Endterm%20Presentation.pdf
---

*Supervisor: Prof. Dr. B. Uma Shankar, ISI Kolkata*

Studied transfer of supervised models trained on global ecological data, to a low-data target domain (Indian terrain) without ground truth. Quantified virtual concept drift with Drifter algorithm using a distance measure between subset regressors, and estimated loss in target domain via Direct Loss Estimation using a Child-Nanny architecture.

Terrestrial **Gross Primary Productivity (GPP)**, the carbon plants fix through
photosynthesis, is one of the better proxies we have for ecosystem health, but
measuring it directly requires eddy-covariance flux towers: expensive,
sparse, and mostly clustered in a handful of well-instrumented regions.
Australia has enough tower coverage to train and validate a model properly.
India, at the time of this work, effectively didn't.

The thesis is in two halves. First, build GPP estimators (linear, polynomial,
SVR, regression trees, random forest) from flux-tower + remote-sensing +
meteorological + topographical features over the Australian region, and confirm
they beat the MODIS GPP product. LAI and LSWI turn out to be the dominant
features, ahead of EVI and elevation. Second, the actual question: does a model
trained entirely on Australian (and other global) towers transfer to Indian
terrain, where there's no ground truth to check it against?

That's a **domain transfer under concept drift** problem with no labels on the
target domain. I used the **Drifter** algorithm to detect whether Indian
inputs fall inside the distribution the model was trained on, and **Direct
Loss Estimation (DLE)** to get an unlabeled estimate of RMSE/MAE on Indian
data. Both indicated the global-trained random forest generalized well, 
predictions carried the right seasonality and distribution, and DLE's error
estimates lined up with the model being the best of the candidates tried, all
without a single labeled Indian observation to train or tune on.

Please read the detailed work in the attached Thesis report and Slides.

**Tools Used**: Python
