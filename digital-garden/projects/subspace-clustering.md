---
title: Subspace Clustering
date: 2025-03-22
tags: [statistics]
summary: A survey and hands-on comparison of bottom-up (CLIQUE) and top-down (PROCLUS) subspace clustering against k-means, on synthetic axis-aligned clusters and MNIST.
byline: with Borish Jha · ISI Kolkata
links:
  - label: slides
    href: /project_reports/Subspace%20Clustering.pdf
---

Ordinary clustering assumes every point lives in the same feature space.
**Subspace clustering** drops that assumption: different clusters may only
be coherent within different, unknown subsets of dimensions, the setup
whenever high-dimensional points end up roughly equidistant from each other,
or a video contains several objects each moving in its own subspace of the
pixel space.

The two dominant search strategies are bottom-up grid methods like
**CLIQUE**, which partition each dimension into equi-width units and merge
dense (k−1)-dimensional projections into candidate k-dimensional subspaces,
and top-down methods like **PROCLUS**, which start from the full-dimensional
space and iteratively refine per-cluster dimension weights and medoids. On
synthetic clusters confined to axis-aligned planes and lines, PROCLUS hit
100% accuracy where k-means saturated around 60–90%, and stayed well ahead
even after deliberately injecting noise by letting two clusters touch. On
MNIST — treating each 28×28 image as 784 raw dimensions — PROCLUS(k=10,
l=100) reached 63% accuracy against 51% for k-means run after a
variance-preserving PCA down to 200 dimensions, suggesting the extra
structure subspace methods exploit is worth more here than the dimensionality
reduction itself.

**Tools Used**: Python
