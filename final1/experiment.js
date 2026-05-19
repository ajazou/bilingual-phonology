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

// ---------------------------------------------------------------------------
// Audio recording helpers
// ---------------------------------------------------------------------------

// All recorded blobs are also cached here in case upload needs to be retried.
window.audioRecordings = {};

// ---------------------------------------------------------------------------
// DataPipe audio upload
// ---------------------------------------------------------------------------

const DATAPIPE_EXPERIMENT_ID = "5BLgRiMM9iI6";  // from DataPipe dashboard

/**
 * Upload a single audio Blob to DataPipe using jsPsychPipe.saveBase64Data(),
 * which is the method DataPipe officially recommends for binary files.
 *
 * @param {Blob}   blob      - the audio blob from MediaRecorder
 * @param {string} filename  - e.g. "abc123_character_naming_red_block1_rep1.webm"
 * @returns {Promise<{ok: boolean, status: number}>}
 */
async function saveAudioToDataPipe(blob, filename) {
  try {
    // Convert blob → base64 string via FileReader (broadest browser support)
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });

    // jsPsychPipe.saveBase64Data is the DataPipe-recommended API for audio/binary files
    const response = await jsPsychPipe.saveBase64Data(
      DATAPIPE_EXPERIMENT_ID,
      filename,
      base64
    );

    return { ok: true, status: response };
  } catch (err) {
    console.warn("DataPipe audio upload failed:", err);
    return { ok: false, status: null };
  }
}

let _mediaStream = null;          // reused across trials once granted
let _activeRecorder = null;       // currently running MediaRecorder, if any
let _activeChunks = [];           // chunks for the current recording

/**
 * Request microphone access once and cache the stream.
 * Returns a Promise that resolves to the MediaStream, or null on failure.
 */
async function getMicStream() {
  if (_mediaStream && _mediaStream.active) return _mediaStream;
  try {
    _mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return _mediaStream;
  } catch (err) {
    console.warn("Microphone access denied or unavailable:", err);
    return null;
  }
}

/**
 * Start recording from the cached stream.
 * Stops any recording already in progress.
 */
function startRecording() {
  stopRecording(); // safety: never have two recorders at once
  if (!_mediaStream) return;
  _activeChunks = [];
  _activeRecorder = new MediaRecorder(_mediaStream);
  _activeRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) _activeChunks.push(e.data);
  };
  _activeRecorder.start();
}

/**
 * Stop the active recording and return a Promise<Blob|null>.
 */
function stopRecording() {
  return new Promise(resolve => {
    if (!_activeRecorder || _activeRecorder.state === "inactive") {
      _activeRecorder = null;
      resolve(null);
      return;
    }
    _activeRecorder.onstop = () => {
      const blob = _activeChunks.length
        ? new Blob(_activeChunks, { type: _activeRecorder.mimeType || "audio/webm" })
        : null;
      _activeRecorder = null;
      _activeChunks = [];
      resolve(blob);
    };
    _activeRecorder.stop();
  });
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Basic trial builders
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Keyboard check  (provided by professor, inserted at strategic points)
// ---------------------------------------------------------------------------

/**
 * Returns a single jsPsych trial that verifies the participant can press one of
 * r / y / b / g. If the key is not detected (e.g. IME intercepts it) the
 * experiment ends with an explanatory message.
 *
 * @param {number|string} whichBlock  label stored in data.block
 */
function keyboardCheckTrial(whichBlock) {
  const targetKey = jsPsych.randomization.sampleWithoutReplacement(
    ["r", "y", "b", "g"], 1
  )[0];
  const colorName = KEY_TO_COLOR[targetKey];

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>Keyboard Check</h2>
        <p>Before we continue, please press the <strong>${targetKey.toUpperCase()}</strong> key
        (for <strong>${colorName}</strong>) on your keyboard.</p>
        <p style="color:#888;font-size:0.9em;">
          If your keyboard is set to a Chinese input method (IME),
          please switch to English / Roman input now, otherwise the experiment cannot record your responses.
        </p>
      </div>
    `,
    choices: [targetKey],
    trial_duration: 15000,
    data: { task: "keyboard_check", block: whichBlock, expected_key: targetKey },
    on_finish: function (data) {
      if (data.response !== targetKey) {
        jsPsych.endExperiment(`
          <div class="instructions">
            <h2>Keyboard Issue Detected</h2>
            <p>We were not able to detect your keypress. This usually happens when a Chinese input method (IME) is active.</p>
            <p>Please return this study on Prolific and try again with the IME disabled. Sorry for the inconvenience.</p>
          </div>
        `);
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Microphone permission trial
// ---------------------------------------------------------------------------
// Shown once at the start so getUserMedia() resolves before the first
// character-naming trial. This avoids an awkward mid-trial permission dialog.

const micPermissionTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="instructions">
      <h2>Microphone Access</h2>
      <p>This experiment records your voice responses during the Chinese character-naming task.</p>
      <p>Your browser may ask for microphone permission — please click <strong>Allow</strong>.</p>
      <p>Your voice recordings will be securely uploaded to our research server (DataPipe) for analysis.</p>
      <p>Press <strong>Space</strong> once you have granted permission (or if no prompt appeared).</p>
    </div>
  `,
  choices: [" "],
  on_load: function () {
    // Request permission early so the dialog appears while the screen is visible
    getMicStream();
  },
  data: { task: "mic_permission" }
};

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

const consent_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div class="consent-text"> <h2>Consent Agreement</h2> <p> Please read this consent agreement carefully before deciding whether to participate in this experiment. </p> <p> <strong>Description:</strong> You are invited to participate in a research study about language and language learning. The purpose of the research is to understand how people learn new words. This research will be conducted through the Prolific platform, including participants from the US, UK, and Canada. If you decide to participate in this research, you will learn and use new words. </p> <p> <strong>Time Involvement:</strong> The task will last the amount of time advertised on Prolific. You are free to withdraw from the study at any time. </p> <p> <strong>Risks and Benefits:</strong> Study data will be stored securely, in compliance with Stanford University standards, minimizing the risk of confiden-tiality breach. This study advances our scientific understanding of how people learn new languages. We cannot and do not guarantee or promise that you will receive any benefits from this study. </p> <p> <strong>Compensation:</strong> You will receive payment in the amount advertised on Prolific. If you do not complete this study, you will receive prorated payment based on the time that you have spent. Additionally, you may be eligible for bonus payments as described in the instructions. </p> <p> <strong>Participant's Rights:</strong> If you have read this form and have decided to participate in this project, please understand your participation is voluntary and you have the right to withdraw your consent or discontinue participation at any time without penalty or loss of benefits to which you are otherwise entitled. The alternative is not to participate. You have the right to refuse to answer particular questions. The results of this research study may be presented at scientific or professional meetings or published in scientific journals. Your individual privacy will be maintained in all published and writ-ten data resulting from the study. In accordance with scientific norms, the data from this study may be used or shared with other researchers for future research (after removing personally identifying information) without additional consent from you. </p> <p> <strong>Contact Information:</strong> If you have any questions, concerns or complaints about this research, its procedures, risks and benefits, contact the Protocol Director, Robert Hawkins (<a href="mailto:rdhawkins@stanford.edu">rdhawkins@stanford.edu</a>, 217-549-6923). </p> <p> <strong>Independent Contact:</strong> If you are not satisfied with how this study is being conducted, or if you have any concerns, com-plaints, or general questions about the research or your rights as a participant, please contact the Stanford Institutional Review Board (IRB) to speak to someone independent of the research team at 650-723-2480 or toll free at 1-866-680-2906, or email at irbnonmed@stanford.edu. You can also write to the Stanford IRB, Stanford University, 1705 El Camino Real, Palo Alto, CA 94306. Please save or print a copy of this page for your records. </p> <p> <strong>If you agree to participate in this research, please click "I agree"</strong> </p></br> </div>`,
  choices: ['I agree', 'I do not agree'],
  button_html: function(choice, choice_index) {
    const buttonClass = choice_index === 0 ? 'consent-button agree' : 'consent-button disagree';
    return `<button class="${buttonClass}">${choice}</button>`;
  },
  data: { trial_type: 'consent' },
  on_finish: function(data) {
    data.consent_response = data.response === 0 ? 'agree' : 'disagree';
    data.consent_timestamp = new Date().toISOString();
    if (data.response === 1) {
      jsPsych.endExperiment(`
        <div class="instruction-text">
          <h2>Thank you</h2>
          <p>You have chosen not to participate. Thank you for your time.</p>
        </div>
      `);
    }
  }
};

// ---------------------------------------------------------------------------
// Welcome & participant info
// ---------------------------------------------------------------------------

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

const participantInfo = {
  type: jsPsychSurveyHtmlForm,
  preamble: `
    <div class="participant-form">
      <h2>Participant Information</h2>
      <p>
        This study is designed for Mandarin-English bilingual speakers.
        Please answer the following questions before beginning the task.
      </p>
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
    const isChineseL1 =
      nativeLang.includes("mandarin") ||
      nativeLang.includes("chinese");

    if (
      responses.mandarin_english_bilingual !== "yes" ||
      !isChineseL1 ||
      responses.english_proficiency === "beginner" ||
      responses.normal_or_corrected_vision !== "yes"
    ) {
      jsPsych.endExperiment(`
        <div class="instructions">
          <h2>Thank you</h2>
          <p>
            Based on your responses, you are not eligible for this study.
            This experiment is designed for Mandarin Chinese L1 and English L2 bilingual speakers
            with normal or corrected-to-normal vision.
          </p>
        </div>
      `);
    }
  }
};

// ---------------------------------------------------------------------------
// Instruction screens
// ---------------------------------------------------------------------------

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
        <h2>Chinese Character Naming — Block ${blockNumber}</h2>
        <p>You will see Chinese characters printed in black.</p>
        <p>Please <strong>say the character aloud in Mandarin</strong> as quickly and accurately as possible.</p>
        <p>After speaking, press <strong>Space</strong> to move to the next character.</p>
        <p>Your voice will be recorded so we can verify your responses.</p>
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
        <h2>English Color-Naming — Block ${blockNumber}</h2>
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

// ---------------------------------------------------------------------------
// Character-naming trial builder  (mic recording + mandatory Space press)
// ---------------------------------------------------------------------------
//
// Flow per trial:
//   fixation → [recording starts] character shown, participant speaks →
//   participant presses Space → [recording stops, blob saved] → ITI
//
// The character stimulus trial begins recording in on_load and stops it in
// on_finish (triggered by the Space keypress), storing the audio blob in
// window.audioRecordings keyed by "<task>_<item_id>_block<block>_rep<rep>".

function buildCharacterNamingTrial(trial, blockNumber) {
  const recordingKey = [
    trial.task || "character_naming",
    trial.item_id,
    `block${blockNumber}`,
    trial.repetition != null ? `rep${trial.repetition}` : "norep"
  ].join("_");

  const characterTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="chinese-character" style="color:${COLORS.black};">${trial.character}</div>
      <div style="margin-top:32px; font-size:16px; color:#555; font-family:Arial,sans-serif;">
        Say the character aloud, then press <strong>Space</strong>.
      </div>
    `,
    choices: [" "],
    response_ends_trial: true,
    trial_duration: 5000,   // slightly longer than original to allow for speaking + pressing
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
      recording_key: recordingKey
    },
    on_load: function () {
      startRecording();
    },
    on_finish: async function (data) {
      // rt here is the time from character onset to Space press — a useful
      // proxy for voice onset time even without audio analysis.
      data.space_rt_ms = data.rt;
      data.mic_available = !!_mediaStream;

      const blob = await stopRecording();
      if (blob) {
        window.audioRecordings[recordingKey] = blob;
        data.audio_recorded = true;
        data.audio_size_bytes = blob.size;

        // Upload to DataPipe immediately after each trial so no audio is lost
        // if a participant drops out before the end of the experiment.
        const ext = blob.type.includes("ogg") ? "ogg" : "webm";
        const audioFilename = `${subject_id}_${recordingKey}.${ext}`;
        data.audio_filename = audioFilename;
        const result = await saveAudioToDataPipe(blob, audioFilename);
        data.audio_upload_ok = result.ok;
        data.audio_upload_status = result.status;
      } else {
        data.audio_recorded = false;
        data.audio_upload_ok = false;
      }
    }
  };

  return [
    fixationTrial(),
    characterTrial,
    interTrialInterval()
  ];
}

// ---------------------------------------------------------------------------
// Practice character-naming trial builder  (same mic + Space pattern)
// ---------------------------------------------------------------------------

function buildPracticeCharacterTrial(item) {
  const recordingKey = `practice_character_${item.character}`;

  const characterTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="chinese-character" style="color:${COLORS.black};">${item.character}</div>
      <div style="margin-top:32px; font-size:16px; color:#555; font-family:Arial,sans-serif;">
        Say the character aloud, then press <strong>Space</strong>.
      </div>
    `,
    choices: [" "],
    response_ends_trial: true,
    trial_duration: 5000,
    data: {
      task: "practice_character_naming",
      character: item.character,
      pinyin: item.pinyin,
      recording_key: recordingKey
    },
    on_load: function () {
      startRecording();
    },
    on_finish: async function (data) {
      data.space_rt_ms = data.rt;
      data.mic_available = !!_mediaStream;
      const blob = await stopRecording();
      if (blob) {
        window.audioRecordings[recordingKey] = blob;
        data.audio_recorded = true;
        data.audio_size_bytes = blob.size;

        // Upload to DataPipe; extension matches the actual mimeType
        const ext = blob.type.includes("ogg") ? "ogg" : "webm";
        const audioFilename = `${subject_id}_${recordingKey}.${ext}`;
        data.audio_filename = audioFilename;
        const result = await saveAudioToDataPipe(blob, audioFilename);
        data.audio_upload_ok = result.ok;
        data.audio_upload_status = result.status;
      } else {
        data.audio_recorded = false;
        data.audio_upload_ok = false;
      }
    }
  };

  return [
    fixationTrial(),
    characterTrial,
    interTrialInterval()
  ];
}

// ---------------------------------------------------------------------------
// Color-naming trial builder  (unchanged logic, keyboard check added upstream)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Trial list builders
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Practice timeline
// ---------------------------------------------------------------------------

const practiceTimeline = [
  {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <h2>Practice — Character Reading</h2>
        <p>First, you will practice reading Chinese characters aloud.</p>
        <p>Each character will appear on screen. Say it aloud in Mandarin, then press <strong>Space</strong>.</p>
        <p>Your voice will be recorded during the real experiment.</p>
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
        <h2>Practice — Color Naming</h2>
        <p>Now practice naming the ink color in English using the keyboard.</p>
        <p><strong>R</strong> = red, <strong>Y</strong> = yellow, <strong>B</strong> = blue, <strong>G</strong> = green.</p>
        <p>Press <strong>Space</strong> to start.</p>
      </div>
    `,
    choices: [" "]
  },
  // Keyboard check before practice color trials
  keyboardCheckTrial("practice"),
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

// ---------------------------------------------------------------------------
// Experimental block pair builder
// ---------------------------------------------------------------------------
//
// Each pair = character-naming block → color-naming block.
// A fresh keyboard check is inserted before every color-naming block to catch
// participants who accidentally re-enable their IME between blocks.

function buildExperimentalPair(blockNumber) {
  const colorTrials = pseudoShuffleTrials([
    ...makeCriticalColorTrials(blockNumber),
    ...makeFillerTrials(blockNumber)
  ]);

  // Character-naming block uses the same items in a different random order
  const characterTrials = pseudoShuffleTrials(colorTrials);

  return [
    characterNamingInstructions(blockNumber),
    ...characterTrials.flatMap(trial => buildCharacterNamingTrial(trial, blockNumber)),
    colorNamingInstructions(blockNumber),
    // Keyboard check immediately before each color-naming block
    keyboardCheckTrial(blockNumber),
    ...colorTrials.flatMap(trial => buildColorNamingTrial(trial, blockNumber))
  ];
}

// ---------------------------------------------------------------------------
// Rest break, debrief, save
// ---------------------------------------------------------------------------

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

const filename = `${subject_id}.csv`;

const save_data = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "5BLgRiMM9iI6",
  filename: filename,
  data_string: () => jsPsych.data.get().csv(),
  on_finish: function () {
    window.location.href =
      "https://app.prolific.com/submissions/complete?cc=CY0FN373";
  }
};

// ---------------------------------------------------------------------------
// Counterbalancing & timeline assembly
// ---------------------------------------------------------------------------

const order = Math.random() < 0.5 ? 1 : 2;

jsPsych.data.addProperties({
  subject_id: subject_id,
  experimental_order: order === 1 ? "block1_then_block2" : "block2_then_block1"
});

const firstExperimentalPair =
  order === 1 ? buildExperimentalPair(1) : buildExperimentalPair(2);

const secondExperimentalPair =
  order === 1 ? buildExperimentalPair(2) : buildExperimentalPair(1);

const timeline = [
  consent_trial,
  welcomeScreen,
  participantInfo,
  colorKeyInstructions,
  micPermissionTrial,         // request mic access early, before practice
  ...practiceTimeline,
  ...firstExperimentalPair,
  restBreak,
  ...secondExperimentalPair,
  debrief,
  save_data
];

jsPsych.run(timeline);
