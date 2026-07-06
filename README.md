# Mandarin-English Bilingual Stroop Replication Project

This project is a replication of Experiment 2 from Li, Wang, and Lin (2017), which examined whether recent Mandarin use activates Mandarin phonology during English color naming in Mandarin-English bilinguals.

The experiment uses a bilingual Stroop paradigm. Participants first read Chinese characters aloud in Mandarin, then complete an English color-naming task. In the color-naming task, Chinese characters are printed in different ink colors, and participants respond with the English color name while ignoring the character itself.

The main condition of interest is the S-plus T-plus homophone condition. These are characters that are not color words, but share the same syllable segment and tone as a Chinese color word. For example, 洪 means “flood,” but it is pronounced *hong2*, the same as 红, meaning “red.” If Mandarin phonology is active during English color naming, these homophones should interfere with participants’ responses.

The goal of this project is to test whether the original homophone interference effect replicates. Specifically, the main analysis compares reaction times in the S-plus T-plus homophone condition against the neutral condition after participants have recently named Chinese characters aloud.

## Repository Structure

- `analysis`: Contains R/Quarto analysis files for cleaning the data, running statistical tests, and generating figures.
- `data`: Contains raw and processed participant data from the experiment. Any human behavioral data should be anonymized before being shared or pushed to a public repository.
- `experiments`: Contains the code used to run the online Stroop experiment.
- `analysis_outputs`: Contains generated results files, including cleaned summaries, statistical test outputs, and figures.
- `regression_outputs`: Contains trial-level regression outputs and related plots.
- `mixed_effects_outputs`: Contains mixed-effects model outputs and diagnostic figures.

## Main Research Question

Does recent Mandarin character naming activate Mandarin phonology strongly enough to interfere with English color naming in Mandarin-English bilinguals?

## Main Prediction

If recent Chinese use activates Mandarin phonology, then participants should be slower in the S-plus T-plus homophone condition than in the neutral condition.

## Key Analysis

The primary confirmatory analysis compares participant-level mean log reaction times between:

- S-plus T-plus homophone trials
- Neutral trials

This comparison tests whether homophone characters produce significant interference relative to neutral characters.
