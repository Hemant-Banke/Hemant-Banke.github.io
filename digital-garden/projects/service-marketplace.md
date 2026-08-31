---
title: Two-Sided Service Marketplace
date: 2020-10-01
tags: [fullstack]
summary: MVP for a two-way marketplace connecting people who need a service done (anything from moving goods to in-house work) with providers who'll do it for a fee.
byline: founding engineer · stealth startup · 2020–2021
---

Built as founding engineer of an early-stage startup, remote, during
undergrad. The core idea was a general-purpose two-sided marketplace: post a
job, get matched with a provider, pay through the platform; deliberately
broad on the service category (transportation of goods, in-house services,
whatever else came up) rather than niched down to one vertical. Used Pathfinding algorithms on map to find matches.

The harder engineering problem wasn't the matching, it was the money side: a
scalable **escrow and wallet system** supporting both card and cryptocurrency
payments, so funds could be held until a job was confirmed done and released
or refunded from a single ledger regardless of how they came in. Backend
operations that touched money were pushed through **asynchronous queues** to
keep payment state consistent under concurrent bookings and error-proof
against partial failures.

**Tools Used**: Pathfinding algorithms, Front-end stack, PHP