---
title: "CASTOR Twin Study"
category: "Academic Research"
subcategory: "LLM Safety"
description: "CASTOR is a twin study of 150 safety-trained language models. It shows that which jailbreaks break a model depends far more on its pretraining run than on its pretraining data, so a jailbreak found on one checkpoint speaks mostly for that one run."
imageUrl: "images/optimized/projects/castor/titlecard.webp"
year: "2026"
date: "2026-10-22"
role: "First Author"
pinned: 1
featured: true
locked: false
tooltip: "First-author twin study of 150 models: which jailbreaks work is set by the pretraining run, not its data."
technologies: [PyTorch, HF Transformers, vLLM, OLMo]
links:
  - label: "Paper (arXiv)"
    url: "https://arxiv.org/abs/2610.34074"
  - label: "Code (GitHub)"
    url: "https://github.com/cerulean-works/castor"
  - label: "Models (Hugging Face)"
    url: "https://huggingface.co/cerulean-works"
---

When an evaluation reveals that a model is vulnerable to a specific jailbreak, the typical assumption is that we've learned something structural about its training: its pretraining corpus, its alignment mixture, or its post-training schedule. Change the recipe, and the vulnerabilities should change; keep it identical, and the same safety profile should hold.

This assumption overlooks the randomness inherent to pretraining itself. In this work, we test whether separate pretraining runs of the same data, given identical safety post-training, break on the same jailbreaks.

Across 150 models spanning 25 data recipes, we find that they diverge substantially. While two post-trained copies of the same pretraining checkpoint break on nearly identical prompts, two separate pretraining runs on the same data break on noticeably different ones, correlating barely higher with each other than models trained on entirely different corpora. In practice, this means that the most effective attacks found on one checkpoint rarely stay on top across runs, and that vulnerabilities reflect a specific pretraining trajectory rather than a stable property of its data recipe.

CASTOR is the first project I worked on after joining [Cerulean Labs](https://cerulean.works). In this post, we walk through the key experiments and their implications for red-teaming. For the complete methodology, analysis and tables, see our paper on [arXiv](https://arxiv.org/abs/2610.34074). All code, model checkpoints and judge labels are available on [GitHub](https://github.com/cerulean-works/castor) and [Hugging Face](https://huggingface.co/cerulean-works).

---

## Experiment Design

To separate the effects of pretraining data from the pretraining run itself, we adopted a twin-study methodology. We started with 1B-parameter base models from Ai2's DataDecide suite, which were pretrained on 25 data recipes using three random seeds per recipe over the same 100B tokens. Taking these 75 base models, we then post-trained each with two post-training seeds using Tülu 3 as the safety recipe, for 150 models in total.

![framed:CASTOR's study design. Two pretraining seeds of one data recipe give two base models, and each base model receives the same safety post-training under two post-training seeds. Every model answers the same prompt set, and pairs of models are compared by how closely their per-prompt vulnerability agrees, from MZ twins (one shared base model) down to cross-recipe pairs (different data).](images/optimized/projects/castor/castor_study_design.webp)

Using 3,211 jailbreak prompts, we sampled 20 responses per prompt from every model and compared how similarly given pairs of models break. Specifically, we categorize model pairs based on their shared ancestry during training:

- **MZ twins**, named after monozygotic twins, share both the pretraining seed and data recipe but differ in their post-training seed.
- **Same-recipe pairs** share a pretraining data recipe but differ in their pretraining seed.
- **Cross-recipe pairs** share neither the pretraining data recipe nor the seed.

By measuring the gaps between these groups, we can isolate where vulnerabilities come from: if a model's safety profile is purely a product of its pretraining data, same-recipe pairs should behave just like MZ twins.

## How much does the run matter?

Averaged across 25 data recipes, MZ twins have vulnerability profiles that correlate at **0.984**, meaning they break on nearly identical sets of prompts. If the pretraining seed is changed, that correlation drops drastically to **0.811**. Changing the data recipe entirely only drops it slightly more, to **0.779**. In terms of correlation, changing the pretraining run alters the vulnerability profile over five times more than changing the pretraining corpus itself.

<div class="markdown-chart" data-chart="castor/recipe-gap"></div>

To rule out the gap being a measurement artifact, we tested it under several variations. Across three model sizes, author-labeled responses, and a completely different safety dataset, the effect held, and it even widened when we factored out the baseline strength of individual attack templates. This suggests that a model's weak spots come from its training run more than its training data.

## Implications for red-teaming

In practice, a red-teaming result is partly a result about one run. The best attack on one checkpoint stays the best after a new post-training seed in **67%** of pairs, but after a new pretraining seed in only **27%**. A model retrained on identical data may therefore need its own red-teaming, and evaluations are better read across several runs than from one checkpoint.

<div class="markdown-chart" data-chart="castor/lead-reversal"></div>

The same caution applies to comparing pretraining data. Train one model on each of two data recipes, and about a quarter of the time the less safe recipe will look like the safer one. Averaging over three pretraining runs cuts the noise in each recipe's estimate by roughly 40%, which makes such comparisons considerably more reliable.

These failures are specific enough to work as a fingerprint. A model's responses to jailbreaks pick out its own pretraining run among 75 in every case, and a random 1.6% of the prompts still do so 98% of the time. The same responses identify the model's data recipe only about half the time, so what a model breaks on says far more about its run than about its data.

<div class="markdown-chart" data-chart="castor/fingerprint"></div>

## Beyond one checkpoint

A jailbreak is usually read as a verdict on how a model was built, yet it is closer to a verdict on one particular run. Each run settles into weak spots of its own, consistent enough to outlast new safety training and distinct enough to tell it apart from its siblings. The data recipe still sets how often a model breaks, but the run decides where it breaks. A jailbreak that works on one checkpoint may fail on an identically trained sibling, which means testing a single model tells us only part of the story.

To facilitate future work on larger models, we release the weights of our safety-post-trained models at 150M, 300M and 1B parameters on [Hugging Face](https://huggingface.co/cerulean-works), with per-prompt judge labels and code on [GitHub](https://github.com/cerulean-works/castor).

---

## Acknowledgments

This research was made possible by the computing resources of the National Center for High-Performance Computing (NCHC), National Institutes of Applied Research, Taiwan. We thank Prof. Meng-Hsun Tsai of National Yang Ming Chiao Tung University, our co-author, for his guidance.
