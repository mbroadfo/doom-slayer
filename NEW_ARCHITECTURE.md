Below is a plan you can paste directly into the Claude session working on **doom-slayer**. I’d have Claude treat this as an architectural refactor rather than simply adding more models.

---

# Doom-Slayer: Layered Intelligence Framework Enhancement Plan

## Objective

Evolve Doom-Slayer from a primarily **strategic-model + tactical-model** architecture into a **layered intelligence framework** in which different cognitive functions operate independently, at appropriate timescales, using the most suitable technology for each function.

The intent is not to create a large collection of LLM agents. The intent is to separate fundamentally different cognitive problems so that each can be:

- implemented independently;
- observed independently;
- replaced independently;
- benchmarked independently;
- improved without destabilizing the entire system.

The resulting architecture should combine:

- deterministic game-state processing;
- fast System-One / Jev-like decision models;
- CLMs or other constrained classification/ranking models;
- conventional algorithms for navigation and state management;
- slower reasoning LLMs for strategic and exceptional situations;
- persistent memory and learning;
- comprehensive real-time observability.

A major design goal is to make the intelligence **understandable while it operates**.

The dashboard should allow us to watch not only what Doom-Slayer does, but why each layer reached its decision.

---

# 1. Architectural Principle

Do not ask one model:

> What should I do next?

Instead progressively answer:

1. **What is actually happening?**
2. **What aspects of the situation matter?**
3. **What behavioral mode should I currently be in?**
4. **What larger objective should I pursue?**
5. **What enemy, location, item, or problem should I focus on?**
6. **What tactic best serves that objective?**
7. **What physical movement or action realizes that tactic?**
8. **Did the action work?**
9. **Should the strategy continue, change, or escalate to deeper reasoning?**

Each question represents a distinct architectural responsibility.

---

# 2. Establish a Canonical Ground-Truth World State

Create a single authoritative representation of everything Doom-Slayer can know directly from ViZDoom and other deterministic telemetry.

This is not AI memory.

It is the system's **current observable reality**.

It should include, where available:

- player position;
- orientation;
- velocity;
- health;
- armor;
- current weapon;
- ammunition by type;
- available weapons;
- visible enemies;
- enemy type;
- enemy position;
- enemy distance;
- enemy bearing;
- whether an enemy has line of sight;
- projectiles;
- visible pickups;
- doors;
- switches;
- obstacles;
- map topology;
- visited areas;
- unexplored areas;
- current navigation target;
- recent damage received;
- recent damage inflicted;
- recent kills;
- recent movement;
- current game tick/time;
- current objective.

Every intelligence component should consume this common representation rather than independently interpreting raw Doom state.

The state should be versioned or timestamped so decisions can be traced back to exactly what was known when they were made.

---

# 3. Separate Observation from Interpretation

Create a clear boundary between:

### Observation

What the engine tells us.

and:

### Interpretation

What those observations mean.

For example, engine telemetry might say:

- health = 17;
- three enemies visible;
- player recently took 26 damage;
- nearest enemy is 2.5 meters away.

A situational model may infer:

- survival threat = critical;
- continued engagement = dangerous;
- retreat priority = high.

The inferred conclusions should never overwrite the underlying facts.

This distinction should remain visible on the dashboard.

---

# 4. Create a Situation Assessment Layer

Introduce a fast intelligence layer responsible for converting ground truth into semantically meaningful assessments.

This layer answers questions such as:

- Is the player currently under immediate threat?
- Is the player surrounded?
- Is health critically low?
- Is ammunition becoming scarce?
- Is there a high-value pickup nearby?
- Is there an unexplored area worth pursuing?
- Is the current enemy easy or dangerous?
- Is a projectile threat imminent?
- Is there a reasonable escape route?
- Is the current position tactically poor?
- Is there currently nothing important happening?

This layer should favor low-latency technologies such as:

- Jev;
- Jev-like constrained inference;
- CLM;
- small classifier;
- other System-One approaches.

It should produce classifications, rankings, and confidence rather than narrative.

---

# 5. Add a Behavioral Meta-Controller

Create an explicit layer that determines **what type of behavior should currently dominate**.

Potential behavioral modes include:

- ENGAGE;
- EVADE;
- RETREAT;
- REPOSITION;
- EXPLORE;
- PURSUE;
- COLLECT_HEALTH;
- COLLECT_AMMO;
- COLLECT_WEAPON;
- SEARCH_FOR_EXIT;
- INTERACT;
- RECOVER_ORIENTATION;
- NAVIGATE_TO_OBJECTIVE.

This controller should arbitrate between competing demands.

For example:

The Strategic Planner may want to explore.

The Resource Controller may want health.

The Risk Controller may detect immediate danger.

The Meta-Controller should decide which concern currently takes precedence.

This should generally be a fast System-One decision rather than an LLM reasoning exercise.

---

# 6. Refine the Strategic Planner

Retain a reasoning LLM for strategy, but sharply constrain its responsibility.

The Strategic Planner should decide:

> What should Doom-Slayer accomplish over the next several seconds or next meaningful phase of play?

Examples:

- clear the current room;
- investigate an unexplored corridor;
- locate the exit;
- obtain health before continuing;
- return to a previously seen weapon;
- cross a dangerous area;
- explore the western branch;
- eliminate a particularly dangerous enemy.

It should **not** directly control buttons.

It should **not** decide which direction to strafe every frame.

It should produce relatively persistent objectives.

Strategic reasoning should run:

- periodically;
- when an objective completes;
- when an objective becomes impossible;
- when the system becomes stuck;
- when significant new information appears;
- when lower layers explicitly request escalation.

---

# 7. Introduce Dedicated Target Selection

Separate **what to attack** from **how to attack it**.

The target-selection layer should rank currently relevant entities using factors such as:

- enemy threat;
- proximity;
- line of sight;
- weapon compatibility;
- current enemy behavior;
- enemy attack type;
- strategic relevance;
- whether the enemy is blocking movement;
- expected cost of engagement.

The output should be a ranked candidate list with confidence or relative scores.

A fast Jev/System-One model is a strong candidate for this responsibility.

The dashboard should display both the selected target and the alternatives it rejected.

---

# 8. Introduce a Dedicated Combat Controller

Once a target has been selected, the Combat Controller determines the immediate maneuver.

Possible tactical intentions include:

- fire;
- aim;
- advance;
- retreat;
- strafe left;
- strafe right;
- dodge;
- maintain distance;
- close distance;
- seek cover;
- switch weapon;
- wait for shot opportunity;
- break line of sight.

This layer should operate rapidly.

It should use current target, player state, weapon state, geometry, threat assessment, and strategic constraints.

The reasoning LLM should normally have no role here.

This is the natural home for Jev or another constrained fast model.

---

# 9. Separate Local Movement from Global Navigation

Movement should not be treated as one intelligence problem.

Create two layers.

### Local Movement

Responsible for:

- strafing;
- dodging;
- avoiding collision;
- maintaining distance;
- moving around nearby obstacles;
- aligning with a doorway;
- tactical positioning.

This belongs close to the fast tactical loop.

### Global Navigation

Responsible for:

- reaching a chosen destination;
- navigating between known areas;
- selecting paths;
- returning to previously seen pickups;
- traveling toward unexplored map regions.

Use conventional map/path planning wherever possible.

AI should choose the destination.

Deterministic software should solve the path when geometry allows it.

---

# 10. Create a Resource Intelligence Layer

Create an independent controller for resource state.

It should continuously assess:

- health urgency;
- armor urgency;
- ammunition scarcity;
- weapon suitability;
- pickup value;
- detour value;
- whether valuable ammunition is being wasted;
- whether the current weapon is appropriate.

This layer can influence:

- strategy;
- meta-controller behavior;
- combat choices;
- navigation priorities.

Examples:

A rocket should not generally be spent on a trivial enemy.

A nearby medikit should become highly important at 12 health but largely irrelevant at 95.

These are ideal System-One decisions.

---

# 11. Create a Persistent Risk Controller

Risk should become a first-class concern instead of being embedded in prompts.

The Risk Controller should continually estimate:

- probability of near-term death;
- damage pressure;
- enemy density;
- projectile danger;
- escape quality;
- health/armor resilience;
- weapon readiness;
- whether the current action is worsening the situation.

Risk may override other layers.

For example:

Strategic objective:

> Explore eastern corridor.

Risk assessment:

> Immediate survival threat.

Meta-controller:

> RETREAT.

The system should explicitly record that the strategic objective was temporarily overridden due to risk.

---

# 12. Add Progress, Repetition, and Failure Detection

Doom agents can become trapped even without repeating identical commands.

Examples include:

- running into the same wall;
- alternating left and right indefinitely;
- spinning;
- chasing an unreachable enemy;
- attempting the same blocked route;
- repeatedly selecting an inaccessible pickup;
- switching between equivalent actions without progress.

Create a Progress Monitor that evaluates whether the system is actually advancing toward its current objective.

Monitor signals such as:

- physical displacement;
- distance to navigation target;
- map discovery;
- enemy health reduction;
- kills;
- pickup acquisition;
- objective distance;
- repeated motor patterns;
- repeated tactical decisions.

Classify behavior as:

- progressing;
- temporarily stalled;
- stuck;
- oscillating;
- repeatedly failing.

This should be an explicit intelligence function rather than something left for the LLM to notice accidentally.

---

# 13. Add an Escalation Framework

Lower-level intelligence should be able to explicitly request help.

Examples:

Tactical controller cannot identify a useful maneuver.

→ escalate to Combat Strategy.

Navigation repeatedly fails.

→ global replan.

Target remains unreachable.

→ reconsider target selection.

Exploration produces no new territory.

→ strategic reasoning.

System appears trapped.

→ reasoning LLM diagnoses the situation.

The principle should be:

> **Fast intelligence handles routine decisions. Deep intelligence is invoked by uncertainty or failure.**

Do not run the most capable LLM continuously.

---

# 14. Support Multiple Cognitive Timescales

Different layers should operate at different frequencies.

Do not force everything into the Doom tick rate.

Conceptually separate:

### Game / motor loop

Very high frequency.

Handles direct engine interaction and execution.

### Reflex loop

High frequency.

Handles aiming, firing, dodging and immediate movement.

### Tactical loop

Moderate frequency.

Handles target selection, combat mode and local tactical choices.

### Situational loop

Moderate/low frequency.

Handles risk, resources and environmental assessment.

### Strategic loop

Low frequency.

Handles objectives and exploration priorities.

### Reasoning escalation

Event-driven.

Runs only when something unusual, ambiguous or unsuccessful occurs.

This should be configurable so experiments can compare timing architectures.

---

# 15. Add Structured Memory

Separate different memory types.

### Current state

Authoritative game telemetry.

### Episodic history

What happened recently.

### Map memory

Where Doom-Slayer has been and what was observed there.

### Entity history

Enemies, pickups, doors and other relevant objects previously encountered.

### Failure memory

Routes, tactics or objectives that repeatedly failed.

### Semantic memory

Higher-level conclusions such as:

- this area is dangerous;
- health was observed in this room;
- this route was blocked;
- this enemy type requires caution.

Use RAG or semantic retrieval only where fuzzy retrieval adds value.

Do not use vector retrieval to answer questions already represented exactly in structured state.

---

# 16. Make Intelligence Providers Pluggable

Each cognitive responsibility should expose a stable interface independent of the underlying model technology.

This should allow experiments such as:

### Tactical selection

- Jev;
- Qwen constrained logits;
- CLM;
- heuristic rules;
- conventional LLM.

### Target ranking

- Jev;
- dual encoder;
- classifier;
- deterministic scoring.

### Strategic planning

- Claude;
- GPT;
- Qwen;
- scripted baseline.

### Risk classification

- Jev;
- small classifier;
- rules.

The objective is to turn Doom-Slayer into a model architecture testbed.

---

# 17. Expand the Observatory Dashboard

The dashboard should become a real-time view into the **entire intelligence hierarchy**.

At minimum, display:

### Ground Truth

What Doom-Slayer currently knows from the engine.

### Situation Assessment

What the fast semantic layer believes is happening.

### Current Behavioral Mode

ENGAGE / EVADE / EXPLORE / etc.

### Strategic Objective

The current longer-lived goal.

### Target Selection

Selected target and ranked alternatives.

### Navigation Objective

Current destination and path progress.

### Combat Tactic

Current combat intention.

### Resource Assessment

Health/ammo/weapon priorities.

### Risk Assessment

Current risk level and important contributors.

### Progress Monitor

Whether the current strategy is succeeding.

### Escalation State

Whether System Two has been invoked and why.

### Final Motor Output

What Doom-Slayer is physically doing.

---

# 18. Capture Inputs and Outputs for Every Intelligence Component

Every invocation of an AI component should be observable.

Record:

- component name;
- component role;
- model/provider;
- model version/configuration;
- invocation time;
- input state;
- candidates supplied;
- retrieved memories;
- current objective;
- output decision;
- alternative rankings;
- confidence/probabilities;
- latency;
- tokens where applicable;
- hardware usage where available;
- reason for invocation;
- reason for escalation;
- resulting game action;
- resulting state change.

The dashboard should support real-time inspection and post-run analysis.

---

# 19. Build Decision Lineage

Every meaningful game action should be traceable through the hierarchy.

For example:

**Strategic objective**

Clear room.

↓

**Situation assessment**

Two active threats.

↓

**Behavior mode**

ENGAGE.

↓

**Target selection**

Shotgun enemy ranked highest.

↓

**Combat tactic**

Strafe right and fire.

↓

**Risk assessment**

Acceptable.

↓

**Motor action**

Movement + aiming + fire.

↓

**Outcome**

Enemy killed, no damage received.

This lineage should be persistently recorded.

It should be possible after a run to determine precisely **why Doom-Slayer made any decision**.

---

# 20. Support Failure Attribution

When something goes badly, identify which layer likely caused the failure.

Possible categories:

- bad source telemetry;
- incorrect situation interpretation;
- poor behavioral-mode selection;
- bad strategy;
- wrong target;
- bad tactical maneuver;
- pathfinding failure;
- resource-management failure;
- risk underestimation;
- repeated-action failure;
- execution/motor error.

The Observatory should make these distinctions visible.

Instead of:

> Doom-Slayer died.

we want:

> Doom-Slayer died because the strategic objective remained valid, but the Risk Controller failed to override ENGAGE after health dropped below a survivable threshold.

That is actionable architecture information.

---

# 21. Add Explicit Confidence and Uncertainty

Where supported, models should expose:

- probabilities;
- confidence;
- ranking margins;
- ambiguity.

Use uncertainty to drive architecture behavior.

Examples:

High tactical confidence:

→ execute immediately.

Moderate confidence:

→ gather additional information or choose conservative action.

Low confidence:

→ escalate.

Strong disagreement among controllers:

→ invoke arbitration or reasoning.

This gives uncertainty an operational purpose.

---

# 22. Establish Experimental Metrics

Do not evaluate Doom-Slayer only on kills or map completion.

Track architecture-level metrics.

Candidate metrics include:

- survival time;
- levels completed;
- enemies killed;
- damage inflicted;
- damage received;
- kill/death ratio;
- ammunition efficiency;
- weapon efficiency;
- health pickup effectiveness;
- map coverage;
- navigation efficiency;
- exploration rate;
- objective completion rate;
- time spent stuck;
- oscillation events;
- repeated tactical decisions;
- strategic replans;
- System-Two escalations;
- tactical-model calls;
- LLM calls;
- generated tokens;
- average decision latency;
- inference cost;
- GPU load;
- confidence calibration.

These metrics should allow direct architecture comparisons.

---

# 23. Preserve Existing Baselines

Do not discard the current design.

Maintain baseline modes such as:

- scripted/random;
- current tactical provider;
- current strategy+tactical architecture;
- enhanced layered architecture.

This is crucial.

Without baselines we will not know whether additional architectural complexity is actually improving behavior.

---

# 24. Recommended Implementation Sequence

Do not attempt the entire architecture simultaneously.

## Phase 1 — Instrument existing architecture

Before changing intelligence significantly:

- establish canonical world state;
- instrument all existing model calls;
- record decisions;
- build decision lineage;
- add dashboard visibility.

This provides the baseline.

## Phase 2 — Situation + meta-controller

Add:

- situational classification;
- risk;
- resource assessment;
- explicit behavioral mode.

Continue using existing strategy/tactical mechanisms beneath this.

## Phase 3 — Split tactical responsibilities

Separate:

- target selection;
- combat tactic;
- local movement;
- weapon selection.

Compare performance against the original monolithic tactical controller.

## Phase 4 — Navigation and exploration

Add:

- map memory;
- exploration ranking;
- global navigation;
- progress measurement.

## Phase 5 — Failure detection and escalation

Implement:

- stuck detection;
- oscillation detection;
- failure memory;
- lower-layer escalation;
- event-triggered System-Two reasoning.

## Phase 6 — Model experimentation

Introduce interchangeable:

- Jev;
- CLM;
- Qwen constrained-logit implementations;
- dual encoders;
- heuristic baselines;
- reasoning LLMs.

Run controlled comparisons.

---

# 25. Important Architectural Constraint

Avoid creating a system where every layer is another conversational LLM agent.

The architecture should deliberately mix different technologies.

Use:

**Conventional software** when truth or algorithms are available.

**Rules** when behavior is genuinely deterministic.

**Jev/System-One models** for fast choices among constrained alternatives.

**CLM/dual encoder approaches** for semantic ranking and similarity where appropriate.

**Reasoning LLMs** for ambiguity, novel planning and difficult situations.

**RAG** for fuzzy long-term memory.

Each technology should solve the type of problem it is suited for.

---

# 26. Design Principle for Claude While Refactoring

For every existing intelligence function in Doom-Slayer, ask:

> What cognitive question is this actually answering?

Then determine:

> Is this a state problem, classification problem, ranking problem, planning problem, navigation problem, memory problem, reasoning problem or execution problem?

Only after determining that should we choose the technology.

Avoid selecting an LLM simply because it can technically perform the task.

---

# Desired End State

The finished Doom-Slayer should no longer look conceptually like:

**Doom → LLM → buttons**

or even merely:

**Doom → strategic LLM → tactical model → buttons**

Instead it should become:

**Doom**

→ authoritative world state

→ situation understanding

→ risk/resource interpretation

→ behavioral arbitration

→ strategic intent

→ target/destination selection

→ tactical decision

→ navigation/combat skill

→ motor execution

→ Doom

with continuous:

**progress monitoring → failure detection → escalation → deeper reasoning**

running around the system.

And the Observatory should expose the entire process in real time.

---

## Ultimate Goal

Doom-Slayer should become more than an AI Doom player.

It should become an **experimental layered-intelligence platform** where we can investigate questions such as:

- Which decisions actually need an LLM?
- Which are better handled by System-One models?
- When should reasoning be invoked?
- How should fast and slow cognition interact?
- How should uncertainty trigger escalation?
- How much intelligence can be decomposed into specialized classifiers?
- How do different architectures affect latency and performance?
- Where does an intelligent system fail?
- Can we identify the cognitive layer responsible for that failure?

This should deliberately parallel the direction being explored in **Zork Observatory**.

Zork gives us a slow, symbolic, language-heavy environment.

Doom gives us a fast, continuous, perceptual and tactical environment.

If the same layered principles work in both, then the larger project becomes considerably more interesting than either game individually: **a reusable architecture for experimenting with layered System-One/System-Two intelligence across radically different environments.**
