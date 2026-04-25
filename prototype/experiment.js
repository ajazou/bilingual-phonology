// Experiment 2 Replication: Recent Chinese reading experience and English color naming
// Based on Li, Wang, & Lin (2017), Experiment 2

const jsPsych = initJsPsych({
  on_finish: function () {
    jsPsych.data.displayData("csv");
  }
});

const COLORS = {
  red: "#d62728",
  yellow: "#d6b300",
  blue: "#1f77b4",
  green: "#2ca02c",
  black: "#000000"
};

const RESPONSE_KEYS = {
  red: "r",
  yellow: "y",
  blue: "b",
  green: "g"
};

const KEY_TO_COLOR = {
  r: "red",
  y: "yellow",
  b: "blue",
  g: "green"
};

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hasTooManyConsecutiveSame(trials, field, maxRun = 3) {
  let run = 1;
  for (let i = 1; i < trials.length; i++) {
    if (trials[i][field] === trials[i - 1][field]) {
      run++;
      if (run > maxRun) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

function pseudoShuffleTrials(trials, maxAttempts = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = shuffle(trials);
    const badColorRun = hasTooManyConsecutiveSame(candidate, "ink_color", 3);
    const badCharacterRun = hasTooManyConsecutiveSame(candidate, "character", 3);
    if (!badColorRun && !badCharacterRun) return candidate;
  }
  return shuffle(trials);
}

function fixationTrial() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="fixation">+</div>`,
    choices: "NO_KEYS",
    trial_duration: 500,
    data: { task: "fixation" }
  };
}

const welcomeScreen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="instructions">
      <h2>Welcome</h2>
      <p>Thank you for participating in this experiment.</p>
      <p>This study has two kinds of tasks:</p>
      <ol>
        <li>Read Chinese characters aloud in Mandarin.</li>
        <li>Name the ink color of Chinese characters in English.</li>
      </ol>
      <p>Press <strong>Space</strong> to continue.</p>
    </div>
  `,
  choices: [" "]
};

const colorKeyInstructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="instructions">
      <h2>Color Response Keys</h2>
      <p>In the color-naming task, respond to the <strong>ink color</strong>, not the meaning of the character.</p>
      <ul>
        <li><strong>R</strong> = red</li>
        <li><strong>Y</strong> = yellow</li>
        <li><strong>B</strong> = blue</li>
        <li><strong>G</strong> = green</li>
      </ul>
      <p>Respond as quickly and accurately as possible.</p>
      <p>Press <strong>Space</strong> to continue.</p>
    </div>
  `,
  choices: [" "]
};

function characterNamingInstructions(blockNumber) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>Chinese Character Naming Block ${blockNumber}</h2>
        <p>You will see Chinese characters printed in black.</p>
        <p>Please read each character aloud in Mandarin as quickly and accurately as possible.</p>
        <p>After saying the character, press <strong>Space</strong> to continue.</p>
        <p>Press <strong>Space</strong> to begin.</p>
      </div>
    `,
    choices: [" "]
  };
}

function colorNamingInstructions(blockNumber) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>English Color-Naming Block ${blockNumber}</h2>
        <p>You will see Chinese characters printed in color.</p>
        <p>Your task is to identify the <strong>ink color in English</strong>.</p>
        <p>Ignore the character itself.</p>
        <p><strong>R</strong> = red, <strong>Y</strong> = yellow, <strong>B</strong> = blue, <strong>G</strong> = green.</p>
        <p>Press <strong>Space</strong> to begin.</p>
      </div>
    `,
    choices: [" "]
  };
}

function buildPracticeCharacterTrial(item) {
  return [
    fixationTrial(),
    {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="chinese-character" style="color:${COLORS.black};">${item.character}</div>`,
      choices: [" "],
      response_ends_trial: true,
      trial_duration: 3000,
      data: {
        task: "practice_character_naming",
        character: item.character,
        pinyin: item.pinyin
      }
    }
  ];
}

function buildPracticeColorTrial(item) {
  return [
    fixationTrial(),
    {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="chinese-character" style="color:${COLORS[item.ink_color]};">${item.character}</div>`,
      choices: ["r", "y", "b", "g"],
      response_ends_trial: true,
      trial_duration: 3000,
      data: {
        task: "practice_color_naming",
        character: item.character,
        ink_color: item.ink_color,
        correct_key: RESPONSE_KEYS[item.ink_color]
      },
      on_finish: function (data) {
        data.response_color = KEY_TO_COLOR[data.response] || null;
        data.correct = data.response === data.correct_key;
      }
    }
  ];
}

const practiceTimeline = [
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>Practice</h2>
        <p>First, you will practice reading Chinese characters aloud.</p>
        <p>Press <strong>Space</strong> to start.</p>
      </div>
    `,
    choices: [" "]
  },
  ...practiceCharacterItems.flatMap(buildPracticeCharacterTrial),
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>Color Practice</h2>
        <p>Now practice naming the ink color in English using the keyboard.</p>
        <p><strong>R</strong> = red, <strong>Y</strong> = yellow, <strong>B</strong> = blue, <strong>G</strong> = green.</p>
        <p>Press <strong>Space</strong> to start.</p>
      </div>
    `,
    choices: [" "]
  },
  ...practiceColorItems.flatMap(buildPracticeColorTrial),
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>End of Practice</h2>
        <p>The practice is over. The experiment will now begin.</p>
        <p>Press <strong>Space</strong> to continue.</p>
      </div>
    `,
    choices: [" "]
  }
];

function buildCharacterNamingTrial(trial, blockNumber) {
  return [
    fixationTrial(),
    {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="chinese-character" style="color:${COLORS.black};">${trial.character}</div>`,
      choices: [" "],
      response_ends_trial: true,
      trial_duration: 3000,
      data: {
        task: "character_naming",
        block: blockNumber,
        item_id: trial.item_id,
        character: trial.character,
        pinyin: trial.pinyin,
        translation: trial.translation,
        source_condition: trial.condition,
        source_ink_color: trial.ink_color,
        is_filler: trial.is_filler
      }
    }
  ];
}

function buildColorNamingTrial(trial, blockNumber) {
  return [
    fixationTrial(),
    {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div class="chinese-character" style="color:${COLORS[trial.ink_color]};">${trial.character}</div>`,
      choices: ["r", "y", "b", "g"],
      response_ends_trial: true,
      trial_duration: 3000,
      data: {
        task: "color_naming",
        block: blockNumber,
        item_id: trial.item_id,
        condition: trial.condition,
        character: trial.character,
        pinyin: trial.pinyin,
        translation: trial.translation,
        ink_color: trial.ink_color,
        correct_key: RESPONSE_KEYS[trial.ink_color],
        is_critical: trial.is_critical,
        is_filler: trial.is_filler,
        repetition: trial.repetition
      },
      on_finish: function (data) {
        data.response_color = KEY_TO_COLOR[data.response] || null;
        data.correct = data.response === data.correct_key;
      }
    }
  ];
}

function makeCriticalColorTrials(repetitionNumber) {
  const trials = [];
  for (const item of criticalStimuli) {
    for (const condition of Object.keys(item.conditions)) {
      const c = item.conditions[condition];
      trials.push({
        item_id: item.color_name,
        condition: condition,
        character: c.character,
        pinyin: c.pinyin,
        translation: c.translation,
        ink_color: c.ink_color,
        is_critical: true,
        is_filler: false,
        repetition: repetitionNumber
      });
    }
  }
  return trials;
}

function makeFillerTrials(blockNumber) {
  return fillerStimuli[blockNumber - 1].map((trial, index) => ({
    item_id: `f${blockNumber}_${index + 1}`,
    condition: "filler",
    character: trial.character,
    pinyin: trial.pinyin,
    translation: trial.translation,
    ink_color: trial.ink_color,
    is_critical: false,
    is_filler: true,
    repetition: null
  }));
}

function buildExperimentalPair(blockNumber) {
  const colorTrials = pseudoShuffleTrials([
    ...makeCriticalColorTrials(blockNumber),
    ...makeFillerTrials(blockNumber)
  ]);

  const characterTrials = pseudoShuffleTrials(colorTrials);

  return [
    characterNamingInstructions(blockNumber),
    ...characterTrials.flatMap(trial => buildCharacterNamingTrial(trial, blockNumber)),
    colorNamingInstructions(blockNumber),
    ...colorTrials.flatMap(trial => buildColorNamingTrial(trial, blockNumber))
  ];
}

const restBreak = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="instructions">
      <h2>Short Break</h2>
      <p>You have completed the first half of the experiment.</p>
      <p>Press <strong>Space</strong> when you are ready to continue.</p>
    </div>
  `,
  choices: [" "]
};

const debrief = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    const colorTrials = jsPsych.data.get().filter({ task: "color_naming" });
    const total = colorTrials.count();
    const correct = colorTrials.filter({ correct: true }).count();
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return `
      <div class="instructions">
        <h2>Experiment Complete</h2>
        <p>Thank you for participating!</p>
        <p>Your keyboard color-naming accuracy was <strong>${correct}</strong> out of <strong>${total}</strong> trials (${pct}%).</p>
        <p>Press <strong>Space</strong> to view the data.</p>
      </div>
    `;
  },
  choices: [" "]
};

const subject_id = jsPsych.randomization.randomID(10);
const filename = `${subject_id}.csv`;

const save_data = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "xNVH4nmbu4Uv",
  filename: filename,
  data_string: ()=>jsPsych.data.get().csv()
};

const timeline = [
  welcomeScreen,
  colorKeyInstructions,
  ...practiceTimeline,
  ...buildExperimentalPair(1),
  restBreak,
  ...buildExperimentalPair(2),
  debrief
];

jsPsych.run(timeline);
