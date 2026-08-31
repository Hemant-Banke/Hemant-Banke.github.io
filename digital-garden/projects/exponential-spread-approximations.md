---
title: Spread of a Random Sample from the Exponential
date: 2025-03-22
tags: [statistics]
summary: Deriving and numerically comparing Edgeworth and saddlepoint approximations for the density of the sample spread of exponential random variables.
byline: solo · statistical computing exercise · guided by Prof. Dr. Sourabh Bhattacharya · ISI Kolkata
links:
  - label: writeup
    href: /project_reports/Edge%20Worth%20and%20Saddle%20Point%20Approximations%20of%20density.pdf
---

*Supervisor: Prof. Dr. Sourabh Bhattacharya, ISI Kolkata*

**Statistical Computing Assignment**

The **spread** of n+1 i.i.d. Exponential(1) random variables (max minus
min) has a known closed-form density, and is
distributed identically to a sum of n *independent but non-identically
distributed* exponentials with means 1, 1/2, …, 1/n. That equivalence,
derived first, is what makes the density tractable to approximate: it puts
the problem in the standard sum-of-independent-terms form that both the
**Edgeworth expansion** and the **saddlepoint approximation** are built for,
despite the summands not being i.i.d.

Deriving the cumulant generating function of that sum in closed form gives
exact cumulants at any order, so both approximations can be evaluated
numerically without simulation. Comparing them against the true density at
n = 10: the saddlepoint approximations (both the plain version and a
refined version with an extra correction term) dominate the Edgeworth
expansion almost everywhere, especially in the tails, matching the general
assumption that saddlepoint methods are more tail-accurate than
Taylor-expansion-based methods. The one place Edgeworth actually does better 
than saddlepoint is right at the mean, where the refined saddlepoint
correction buys nothing over the plain version.

**Tools Used**: R 
