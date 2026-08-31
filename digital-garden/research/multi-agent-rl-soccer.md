---
title: Multi-Agent RL for Defensive Coordination in Soccer
date: 2026-08-01
tags: [reinforcement-learning, MARL, statistics]
summary: Reframing defensive positioning as a two-team Markov game — offline-to-online minimax self-play against an adaptive learned opponent, with an OBSO-based reward.
byline: with Soham Majumder, Leuphana University of Lüneburg
status: ongoing
---

Formulating defensive positioning as a two-team zero-sum Markov game, aiming to be the first framework to optimize defensive trajectories under co-adapting attackers. Designing a **graph-transformer policy** over spatiotemporal player graphs using **factorized space-time attention**, to handle variable player counts and play durations, while keeping architecture aligned with **CTDE**.

Developing an **offline-to-online** training pipeline (IQL pre-training followed by adversarial self-play refinement with trust-region constraints) on a physics-based reward, with per-agent **counterfactual credit assignment** and theoretical grounding via the **simulation lemma** and concentrability.


[[Ensemble Methods for Expected Goals (xG) Modeling|The xG project]] treats
each shot in isolation: given this configuration of players, what's the
probability of a goal. It has nothing to say about how a defense should
*position itself* before the shot happens, that's a coordination problem
among multiple agents reacting to each other.

This work models attacker and defender as a **two-team Markov game** and
solves it via **minimax self-play**: policies are pretrained offline on
player-tracking data, then fine-tuned online against an adaptive learned
opponent, going from offline behavioral cloning to online seeking equilibrium. \
The reward is built on change in **OBSO** (Off-Ball Scoring
Opportunity), which scores space rather than events, letting the reward
signal reflect defensive positioning quality even on possessions that never
produce a shot. 

We are currently experimenting with the architecture and training the offline policies for defenders and attackers.

**Tools Used**: Reinforcement Learning, MARL, Offline and Online methods, Graph Attention Networks (GATs), Attention and Transformers, Python
