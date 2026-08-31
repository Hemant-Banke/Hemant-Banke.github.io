---
title: Simulation and Analysis of Markov Chains and Hidden Markov Models
date: 2022-07-20
tags: [statistics]
summary: Studying simulating discrete-time Markov chains with random TPMs, stationary distributions, noise sensitivity, and hidden Markov models with Viterbi and forward-algorithm decoding.
byline: solo · guided by Prof. Dr. Abhay G. Bhatt · ISI Delhi
links:
  - label: notebook
    href: /project_reports/Simulation%20and%20Analysis%20of%20Markov%20Chains.pdf
---

*Supervisor: Prof. Dr. Abhay G. Bhatt, ISI Delhi*

A progression of Markov-chain simulation exercises in R, each building on
the last. Starting with the basics: generate a random transition probability
matrix, simulate the chain, and check that the
empirical TPM and the empirical stationary distribution converge back to
what theory predicts. Then move to alternating TPMs: a chain that switches
between two transition regimes, to see how the notion of a stationary
distribution has to be adapted when the dynamics themselves aren't fixed.

The more interesting section is noise sensitivity: perturbing a chain's TPM
by small amounts and tracking how much the resulting stationary distribution
moves, which is really a question about the conditioning of the eigenvector
problem the stationary distribution is solving. I then explore
**Hidden Markov Models**: simulating them and decoding the hidden states in two ways. 
The **Viterbi algorithm** for the single most likely state sequence, and the **forward algorithm** for the marginal likelihood of the observations.

**Tools Used**: Hidden Markov Models (HMMs), Markov Chains, R
