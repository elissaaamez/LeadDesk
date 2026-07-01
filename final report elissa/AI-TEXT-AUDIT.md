# AI-text audit — AI CRM Platform report

Tool: local `ai-text-detector` skill (heuristic, no API). Input: narrative prose
extracted from the report body (9,127 words).

## Result

**Score: 10 / 100 — "likely human."**

| Signal | Score (0–1, higher = more AI-like) | Weight |
|---|---|---|
| Vocabulary shift (post-ChatGPT words) | 0.08 | 0.28 |
| Phrase clichés | 0.06 | 0.28 |
| Burstiness (sentence-length variation) | 0.00 | 0.18 |
| Em-dash density | 0.00 | 0.08 |
| Discourse markers | 0.04 | 0.08 |
| Sentence-start uniformity | 0.94 | 0.06 |
| TTR extreme | 0.00 | 0.04 |

Stats: 657 sentences, sentence-length std-dev = 9.2 (healthy human variation),
0 em-dashes, 8 discourse markers.

Top flagged words: `robust` (x2), `groundbreaking` (x1), `navigating` (x1).
Top flagged phrases: "in conclusion" (x1), "at its core" (x1).

## Interpretation

The score is driven down by strong human-like sentence-length variation
(near-zero burstiness signal), almost no LLM cliché phrasing, and no em-dash
over-use. The only elevated signal is sentence-start uniformity (many sentences
begin with "The"), which carries a low weight. The handful of flagged words
("robust", "groundbreaking", "navigating", "at its core") are isolated and easy
to swap if a perfectly clean reading is wanted.

## Limitation

This is a heuristic smell-test, not a verdict. No detector reliably separates
polished human writing from LLM output; academic and non-native-English prose
often trips false positives. Treat 10/100 as "shows no strong AI markers," not
as proof of authorship.
