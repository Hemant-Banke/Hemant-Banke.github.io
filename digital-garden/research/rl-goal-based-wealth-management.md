---
title: RL for Goal-Based Wealth Management with Debt Decisions
date: 2026-08-01
tags: [reinforcement-learning, statistics, quant]
summary: Solving goal-based wealth management as a long-horizon stochastic optimal control problem via RL, extending the standard formulation to heterogeneous accounts and voluntary debt decisions.
byline: with Justin Morris Krieger, Wells Fargo and Olin Business School at Washington University
status: ongoing
---

Goal-Based Wealth Management (GBWM) is usually posed as a stochastic optimal
control problem over a client's multi-decade financial life: how much to
save, how to allocate across accounts, when a goal can be funded. The
standard formulation treats assets as a single pool and doesn't model debt as
a decision.

This work solves GBWM over multi-decade horizons via RL rather than classical
dynamic programming, which stays tractable as the state space grows, and
extends the action space to **heterogeneous asset and debt accounts with
voluntary debt actions**: the policy can choose to pay down or draw on debt
as part of the plan, not just save and invest. That's a meaningfully larger
action space than prior GBWM literature considers, and it's closer to what
actual planning looks like.

This is a theoretical and RL extension to the groundwork already done at Wells Fargo. We are currently working on the theoretical proofs.

**Tools Used**: Reinforcement Learning, Monte Carlo methods, GBWM, Python
