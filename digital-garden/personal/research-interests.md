---
title: Research Interests
date: 2026-08-01
summary: My Research Interests and how they connect to what I want to contribute to humanity.
links:
  - label: pdf
    href: /artifacts/Research_Interests.pdf
---

I am interested in **model-based multi-agent RL**: learning predictive models of worlds containing other
learning agents and planning actions through them. Model-based RL aims to learn policies by building a
predictive model of the world (internal map) and using it to plan and simulate future actions, rather than purely
relying on trial and error. In the presence of multiple co-learning agents, I want to focus on what these models
represent about spatial beliefs and what other agents can see. I want to know if task rewards and strategic
pressure alone can induce geometrically structured beliefs about other agents, how can such beliefs be probed,
how to perform differentiable planning through such a model, and what we can say about the theoretical limits
of such models. Differentiable planning is of interest to me, as it allows us to learn policies through
backpropagation instead of simulating large search trees.

**In other words**, for multiple agents living in a shared space, how do they learn about each other spatially and
plan accordingly? And what happens when the shared space itself also needs to be learned.

This is a learning and planning study, inspired by dreamer-style latent differentiable planning methods in
single-agent settings. The formal foundation is a partially observable stochastic game (POSGs), specifically
zero-sum team game cases, with the observability kernel replaced by a ray-casting visibility operator across a
shared metric space.

**The contributions I aim for are**: Theory of multi-agent world models under this structure (sufficiency,
equilibrium preservation under model error, information-theoretic bounds on achievable belief accuracy, etc);
probing whether spatial beliefs emerge in current multi-agent world models; creating architectures with
geometric inductive bias; and differentiable planning through a model containing other learning agents.

I believe that this line of study can significantly impact the future of intelligence and our understanding of
environments with multiple co-learning agents, and I find it incredibly fascinating.

My over-arching goal is to prove that Mean-field theory is applicable in multi-agent cases, implying that the
many complex interactions of individual agents can be approximated using some simple rules. I am drawn to the
field of artificial-life (Alife) as it works on simulating *’worlds’* with *’agents’* acting through simple rules and
studying their emergent properties. I cannot help but think, if on large-scale, agents can be approximated, then
the complex reward-based multi-agent world will converge to an Alife world with simple rules. I believe Alife
looks at intelligence from top-down (emergent complexity leading to intelligence), while reward-based methods of
today look at intelligence from bottom-up (complex individual interactions leading to intelligence). Merging
them would be beautiful.

If we look at a scale of intelligence over biological entities, from single-cells to neurons to humans to a *’collective’*
human specie. The *collective*, composed of over 8.3 billion humans, is far more intelligent and capable than any
individual human. We approximated the complex behaviors of a neuron into sets of simple rules, creating
artificial neurons and transformers. And this rule has proved very fruitful in creating intelligence that works like
a human brain (given the massive difference of scale). I imagine if we can approximate the complex rules of
human interactions, can we converge to intelligence of the *collective*? Moving us up the scale for free, with a
higher approximation. What do those rules look like and how do we define them?

This leads into another question; for any such space of valid rules that can emerge to intelligence, are there
dominant rules that lead to superior intelligence and how to find them?