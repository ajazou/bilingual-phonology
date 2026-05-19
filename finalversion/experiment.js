// Experiment 2 Replication: Recent Chinese reading experience and English color naming
// Based on Li, Wang, & Lin (2017), Experiment 2

const jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: true,
  on_finish: function () {
    jsPsych.data.displayData("csv");
  }
});

const subject_id = jsPsych.randomization.randomID(10);

let microphoneStream = null;

const microphonePermissionTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="instructions">
      <h2>Microphone Check</h2>
      <p>This study includes Chinese character-reading trials where you will say each character aloud.</p>
      <p>Your browser will ask for microphone permission so the experiment can briefly record those spoken responses.</p>
      <p>Please click <strong>Allow</strong> when prompted.</p>
      <p>Press <strong>Space</strong> to start the microphone check.</p>
    </div>
  `,
  choices: [" "]
};

const requestMicrophoneAccess = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="instructions">
      <h2>Requesting Microphone Access</h2>
      <p>Please respond to the browser microphone permission prompt.</p>
    </div>
  `,
  choices: "NO_KEYS",
  trial_duration: null,
  on_load: async function () {
    try {
      microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      jsPsych.finishTrial({
        task: "microphone_permission_request",
        microphone_permission: "granted"
      });
    } catch (err) {
      jsPsych.finishTrial({
        task: "microphone_permission_request",
        microphone_permission: "denied_or_unavailable",
        microphone_error: err.message
      });
      jsPsych.endExperiment(`
        <div class="instructions">
          <h2>Microphone Required</h2>
          <p>We could not access your microphone, so you cannot continue this study.</p>
          <p>Please allow microphone access and restart the experiment.</p>
        </div>
      `);
    }
  }
};

function stopMicrophoneStream() {
  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }
}

const jsPsychAudioCharacterNaming = {
  info: {
    name: "audio-character-naming",
    parameters: {
      stimulus: { type: jsPsych.ParameterType.HTML_STRING, default: undefined },
      trial_duration: { type: jsPsych.ParameterType.INT, default: 3000 },
      data: { type: jsPsych.ParameterType.OBJECT, default: {} }
    }
  },

  trial: function (display_element, trial) {
    let recorder = null;
    let chunks = [];
    let keyboardListener = null;
    let timeoutId = null;
    let finished = false;
    const startTime = performance.now();

    display_element.innerHTML = `
      ${trial.stimulus}
      <div class="recording-reminder">
        <span class="recording-dot"></span>
        Recording — say the character aloud, then press Space.
      </div>
    `;

    function finishTrial(responseKey, rt) {
      if (finished) return;
      finished = true;

      if (keyboardListener !== null) {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      function finishWithoutAudio(errorMessage) {
        display_element.innerHTML = "";
        jsPsych.finishTrial({
          ...trial.data,
          response: responseKey,
          rt: rt,
          space_pressed_after_speaking: responseKey === " ",
          audio_recorded: false,
          audio_mime_type: null,
          audio_base64: null,
          audio_size_bytes: 0,
          audio_error: errorMessage || null
        });
      }

      function saveAudioAndFinish() {
        try {
          const mimeType = recorder && recorder.mimeType ? recorder.mimeType : "audio/webm";
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();

          reader.onloadend = function () {
            display_element.innerHTML = "";
            const result = typeof reader.result === "string" ? reader.result : "";
            const base64 = result.includes(",") ? result.split(",")[1] : result;

            jsPsych.finishTrial({
              ...trial.data,
              response: responseKey,
              rt: rt,
              space_pressed_after_speaking: responseKey === " ",
              audio_recorded: blob.size > 0,
              audio_mime_type: mimeType,
              audio_base64: base64,
              audio_size_bytes: blob.size,
              audio_error: null
            });
          };

          reader.onerror = function () {
            finishWithoutAudio("FileReader failed while converting audio to base64.");
          };

          reader.readAsDataURL(blob);
        } catch (err) {
          finishWithoutAudio(err.message || String(err));
        }
      }

      if (!recorder) {
        finishWithoutAudio("MediaRecorder was not available.");
        return;
      }

      try {
        recorder.onstop = saveAudioAndFinish;

        if (recorder.state !== "inactive") {
          recorder.stop();
        } else {
          saveAudioAndFinish();
        }
      } catch (err) {
        finishWithoutAudio(err.message || String(err));
      }
    }

    try {
      if (!microphoneStream) {
        throw new Error("Microphone stream was not initialized.");
      }

      recorder = new MediaRecorder(microphoneStream);

      recorder.ondataavailable = function (event) {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.start();
    } catch (err) {
      recorder = null;
      chunks = [];
    }

    keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: function (info) {
        finishTrial(info.key, info.rt);
      },
      valid_responses: [" "],
      rt_method: "performance",
      persist: false,
      allow_held_key: false
    });

    timeoutId = setTimeout(function () {
      finishTrial(null, Math.round(performance.now() - startTime));
    }, trial.trial_duration);
  }
};

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

function keyboardCheckTrial(whichBlock) {
  const targetKey = jsPsych.randomization.sampleWithoutReplacement(["r", "y", "b", "g"], 1)[0];
  const colorName = KEY_TO_COLOR[targetKey];

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>Keyboard Check</h2>
        <p>Before we continue, please press the <strong>${targetKey.toUpperCase()}</strong> key
        for <strong>${colorName}</strong>.</p>
        <p style="color:#888;font-size:0.9em;">
          If your keyboard is set to a Chinese input method, please switch to English / Roman input now.
        </p>
      </div>
    `,
    choices: [targetKey],
    trial_duration: 15000,
    response_ends_trial: true,
    data: {
      task: "keyboard_check",
      block: whichBlock,
      expected_key: targetKey,
      subject_id: subject_id
    },
    on_finish: function (data) {
      data.passed_keyboard_check = data.response === targetKey;

      if (data.response !== targetKey) {
        jsPsych.endExperiment(`
          <div class="instructions">
            <h2>Keyboard Issue Detected</h2>
            <p>We were not able to detect your keypress.</p>
            <p>This usually happens when a Chinese input method is active.</p>
            <p>Please return this study on Prolific and try again with the input method disabled.</p>
          </div>
        `);
      }
    }
  };
}

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

    if (!badColorRun && !badCharacterRun) {
      return candidate;
    }
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

function interTrialInterval() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "",
    choices: "NO_KEYS",
    trial_duration: 1000,
    data: { task: "inter_trial_interval" }
  };
}

const consent_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="consent-text">
      <h2>Consent Agreement</h2>
      <p>Please read this consent agreement carefully before deciding whether to participate in this experiment.</p>
      <p><strong>Description:</strong> You are invited to participate in a research study about language and language learning.</p>
      <p><strong>Time Involvement:</strong> The task will last the amount of time advertised on Prolific. You are free to withdraw at any time.</p>
      <p><strong>Risks and Benefits:</strong> Study data will be stored securely, minimizing the risk of confidentiality breach.</p>
      <p><strong>Compensation:</strong> You will receive payment in the amount advertised on Prolific.</p>
      <p><strong>Participant's Rights:</strong> Your participation is voluntary and you may discontinue participation at any time.</p>
      <p><strong>Contact Information:</strong> Contact Robert Hawkins at <a href="mailto:rdhawkins@stanford.edu">rdhawkins@stanford.edu</a>.</p>
      <p><strong>If you agree to participate, please click "I agree."</strong></p>
    </div>
  `,
  choices: ["I agree", "I do not agree"],
  button_html: function(choice, choice_index) {
    const buttonClass = choice_index === 0 ? "consent-button agree" : "consent-button disagree";
    return `<button class="${buttonClass}">${choice}</button>`;
  },
  data: {
    trial_type: "consent",
    subject_id: subject_id
  },
  on_finish: function(data) {
    data.consent_response = data.response === 0 ? "agree" : "disagree";
    data.consent_timestamp = new Date().toISOString();

    if (data.response === 1) {
      jsPsych.endExperiment(`
        <div class="instructions">
          <h2>Thank you</h2>
          <p>You have chosen not to participate. Thank you for your time.</p>
        </div>
      `);
    }
  }
};

const welcomeScreen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="instructions">
      <h2>Welcome</h2>
      <p>Thank you for participating in this experiment.</p>
      <p>This study has two kinds of tasks:</p>
      <ol>
        <li>Read Chinese characters aloud in Mandarin while the microphone records, then press Space.</li>
        <li>Name the ink color of Chinese characters in English using R/Y/B/G.</li>
      </ol>
      <p>Press <strong>Space</strong> to continue.</p>
    </div>
  `,
  choices: [" "]
};

const participantInfo = {
  type: jsPsychSurveyHtmlForm,
  preamble: `
    <div class="participant-form">
      <h2>Participant Information</h2>
      <p>This study is designed for Mandarin-English bilingual speakers.</p>
    </div>
  `,
  html: `
    <div class="participant-form">
      <label>
        Are you a Mandarin-English bilingual speaker?
        <select name="mandarin_english_bilingual" required>
          <option value="">Select one</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>

      <label>
        What is your native language / first language?
        <input name="native_language" type="text" required>
      </label>

      <label>
        Age when you began learning English:
        <input name="english_age_of_acquisition" type="number" min="0" max="100" required>
      </label>

      <label>
        How many years have you lived in the United States?
        <input name="years_in_us" type="number" min="0" max="100" step="0.1" required>
      </label>

      <label>
        English proficiency score, if available, such as TOEFL percentage or score:
        <input name="english_proficiency_score" type="text">
      </label>

      <label>
        Self-rated Mandarin proficiency:
        <select name="mandarin_proficiency" required>
          <option value="">Select one</option>
          <option value="native">Native</option>
          <option value="advanced">Advanced</option>
          <option value="intermediate">Intermediate</option>
          <option value="beginner">Beginner</option>
        </select>
      </label>

      <label>
        Self-rated English proficiency:
        <select name="english_proficiency" required>
          <option value="">Select one</option>
          <option value="advanced">Advanced</option>
          <option value="intermediate">Intermediate</option>
          <option value="beginner">Beginner</option>
        </select>
      </label>

      <label>
        Do you have normal or corrected-to-normal vision?
        <select name="normal_or_corrected_vision" required>
          <option value="">Select one</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
    </div>
  `,
  button_label: "Continue",
  data: {
    task: "participant_information",
    subject_id: subject_id
  },
  on_finish: function (data) {
    const responses = data.response;

    data.subject_id = subject_id;
    data.mandarin_english_bilingual = responses.mandarin_english_bilingual;
    data.native_language = responses.native_language;
    data.english_age_of_acquisition = responses.english_age_of_acquisition;
    data.years_in_us = responses.years_in_us;
    data.english_proficiency_score = responses.english_proficiency_score;
    data.mandarin_proficiency = responses.mandarin_proficiency;
    data.english_proficiency = responses.english_proficiency;
    data.normal_or_corrected_vision = responses.normal_or_corrected_vision;

    const nativeLang = responses.native_language.toLowerCase().trim();
    const isChineseL1 = nativeLang.includes("mandarin") || nativeLang.includes("chinese");

    if (
      responses.mandarin_english_bilingual !== "yes" ||
      !isChineseL1 ||
      responses.english_proficiency === "beginner" ||
      responses.normal_or_corrected_vision !== "yes"
    ) {
      jsPsych.endExperiment(`
        <div class="instructions">
          <h2>Thank you</h2>
          <p>Based on your responses, you are not eligible for this study.</p>
        </div>
      `);
    }
  }
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
      <p>Make sure your keyboard input method is set to English / Roman input.</p>
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
        <p>The microphone will record during each character trial.</p>
        <p>After saying each character, press <strong>Space</strong> to continue.</p>
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
      type: jsPsychAudioCharacterNaming,
      stimulus: `<div class="chinese-character" style="color:${COLORS.black};">${item.character}</div>`,
      trial_duration: 3000,
      data: {
        task: "practice_character_naming",
        character: item.character,
        pinyin: item.pinyin,
        required_space_after_speaking: true
      }
    },
    interTrialInterval()
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
    },
    interTrialInterval()
  ];
}

const practiceTimeline = [
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>Practice</h2>
        <p>First, you will practice reading Chinese characters aloud.</p>
        <p>After saying each character aloud, press <strong>Space</strong>.</p>
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
  keyboardCheckTrial("practice_color_naming"),
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
      type: jsPsychAudioCharacterNaming,
      stimulus: `<div class="chinese-character" style="color:${COLORS.black};">${trial.character}</div>`,
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
        is_filler: trial.is_filler,
        required_space_after_speaking: true
      }
    },
    interTrialInterval()
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
    },
    interTrialInterval()
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
    keyboardCheckTrial(`color_naming_block_${blockNumber}`),
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
        <p>Press <strong>Space</strong> to save your data and finish.</p>
      </div>
    `;
  },
  choices: [" "]
};

const filename = `${subject_id}.csv`;

const save_data = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "kAjReLJ5QXvA",
  filename: filename,
  data_string: () => jsPsych.data.get().csv(),
  on_finish: function() {
    stopMicrophoneStream();
    window.location.href = "https://app.prolific.com/submissions/complete?cc=CY0FN373";
  }
};

const order = Math.random() < 0.5 ? 1 : 2;

jsPsych.data.addProperties({
  subject_id: subject_id,
  experimental_order: order === 1 ? "block1_then_block2" : "block2_then_block1"
});

const firstExperimentalPair = order === 1 ? buildExperimentalPair(1) : buildExperimentalPair(2);
const secondExperimentalPair = order === 1 ? buildExperimentalPair(2) : buildExperimentalPair(1);

const timeline = [
  consent_trial,
  welcomeScreen,
  participantInfo,
  microphonePermissionTrial,
  requestMicrophoneAccess,
  colorKeyInstructions,
  ...practiceTimeline,
  ...firstExperimentalPair,
  restBreak,
  ...secondExperimentalPair,
  debrief,
  save_data
];

jsPsych.run(timeline);
