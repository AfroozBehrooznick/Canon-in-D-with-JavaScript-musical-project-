// ————————————————————————————————————————————————————
// Piano Sampler and Sound Setup
// ————————————————————————————————————————————————————

const { log } = require("tone/build/esm/core/util/Debug");

// Load piano samples (Salamander public piano library)
const piano = new Tone.Sampler({
  urls: {
    A1: "A1.mp3",
    C2: "C2.mp3",
    A2: "A2.mp3",
    C4: "C4.mp3",
  },
  release: 2.8,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
});

// Smooth, warm bass synth
const bass = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 1.5 },
  volume: -4,
});

// Audio effects
const hall = new Tone.Reverb({ decay: 6.5, wet: 0.5 });
const delay = new Tone.FeedbackDelay("8n", 0.18);
const compressor = new Tone.Compressor({ threshold: -30, ratio: 3 });

// Connect effects chain and output
piano.connect(delay);
delay.connect(hall);
hall.connect(compressor);
compressor.toDestination();

bass.connect(hall);

// ————————————————————————————————————————————————————
// Chord progression (Canon in D style)
// ————————————————————————————————————————————————————
// Root notes of each measure
const chordRoots = ["D4", "A3", "B3", "F#3", "G3", "D3", "G3", "A3"];
// Full triads for reference
const chords = [
  ["D4", "F#4", "A4"],
  ["A3", "C#4", "E4"],
  ["B3", "D4", "F#4"],
  ["F#3", "A3", "C#4"],
  ["G3", "B3", "D4"],
  ["D3", "F#3", "A3"],
  ["G3", "B3", "D4"],
  ["A3", "C#4", "E4"],
];

const measures = 8; // total length = 8 measures

// ————————————————————————————————————————————————————
// Arpeggio generator
// ————————————————————————————————————————————————————
// Returns a sequence of 8 notes for one bar
function arpNotesForChord(chord) {
  const [p1, p2, p3] = chord;
  return [p1, p2, p3, p2, p1, p2, p3, p2];
}

// Generate full arpeggio sequence for all measures
const arpSequence = [];
for (let i = 0; i < measures; i++) {
  const a = arpNotesForChord(chords[i % chords.length]);
  for (let j = 0; j < a.length; j++) {
    arpSequence.push({ time: `${i}m + ${j} * 8n`, note: a[j] });
  }
}

// ————————————————————————————————————————————————————
// Melody (main voice) — simplified Canon-style
// A second voice enters 2 bars later (canon effect)
// ————————————————————————————————————————————————————
const melody = [
  // Measure 1
  { time: "0:0", note: "F#4", dur: "8n" },
  { time: "0:1", note: "A4", dur: "8n" },
  { time: "0:2", note: "D5", dur: "8n" },
  { time: "0:3", note: "C#5", dur: "8n" },
  // Measure 2
  { time: "1:0", note: "B4", dur: "8n" },
  { time: "1:1", note: "A4", dur: "8n" },
  { time: "1:2", note: "G4", dur: "8n" },
  { time: "1:3", note: "F#4", dur: "8n" },
  // Measure 3
  { time: "2:0", note: "F#4", dur: "8n" },
  { time: "2:1", note: "D4", dur: "8n" },
  { time: "2:2", note: "B4", dur: "8n" },
  { time: "2:3", note: "A4", dur: "8n" },
  // Measure 4
  { time: "3:0", note: "C#5", dur: "8n" },
  { time: "3:1", note: "B4", dur: "8n" },
  { time: "3:2", note: "A4", dur: "8n" },
  { time: "3:3", note: "F#4", dur: "8n" },
  // Measure 5
  { time: "4:0", note: "G4", dur: "8n" },
  { time: "4:1", note: "B4", dur: "8n" },
  { time: "4:2", note: "D5", dur: "8n" },
  { time: "4:3", note: "C#5", dur: "8n" },
  // Measure 6
  { time: "5:0", note: "A4", dur: "8n" },
  { time: "5:1", note: "F#4", dur: "8n" },
  { time: "5:2", note: "D4", dur: "8n" },
  { time: "5:3", note: "B4", dur: "8n" },
  // Measure 7
  { time: "6:0", note: "G4", dur: "8n" },
  { time: "6:1", note: "A4", dur: "8n" },
  { time: "6:2", note: "B4", dur: "8n" },
  { time: "6:3", note: "C#5", dur: "8n" },
  // Measure 8 (ending)
  { time: "7:0", note: "A4", dur: "4n" },
  { time: "7:2", note: "D5", dur: "2n" },
];

// ————————————————————————————————————————————————————
// Create Tone.Part sequences
// ————————————————————————————————————————————————————

// Main melody part
const melodyPart = new Tone.Part(
  (time, ev) => {
    piano.triggerAttackRelease(ev.note, ev.dur, time, 0.95);
  },
  melody.map((m) => [m.time, m])
);
melodyPart.loop = true;
melodyPart.loopEnd = `${measures}m`;

// Second canon voice (starts 2 measures later)
const secondVoice = [];
melody.forEach((m) => {
  const parts = m.time.split(":");
  const bar = parseInt(parts[0], 10) + 2;
  const rest = parts.slice(1).join(":");
  const t = `${bar}:${rest}`;
  secondVoice.push({ time: t, note: m.note, dur: m.dur });
});

const secondPart = new Tone.Part(
  (time, ev) => {
    piano.triggerAttackRelease(ev.note, ev.dur, time, 0.78);
  },
  secondVoice.map((m) => [m.time, m])
);
secondPart.loop = true;
secondPart.loopEnd = `${measures}m`;

// Arpeggio pattern
const arpPart = new Tone.Part(
  (time, ev) => {
    piano.triggerAttackRelease(ev.note, "8n", time, 0.6);
  },
  arpSequence.map((o) => [o.time, { note: o.note }])
);
arpPart.loop = true;
arpPart.loopEnd = `${measures}m`;

// Bass line (one root note per bar)
const bassEvents = [];
for (let i = 0; i < measures; i++) {
  const root = chordRoots[i % chordRoots.length];
  bassEvents.push([`${i}m`, { note: root }]);
}

const bassPart = new Tone.Part((time, ev) => {
  bass.triggerAttackRelease(ev.note, "1m", time, 0.9);
}, bassEvents);
bassPart.loop = true;
bassPart.loopEnd = `${measures}m`;

// ————————————————————————————————————————————————————
// UI Controls (Play / Stop / BPM slider)
// ————————————————————————————————————————————————————
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const bpmSlider = document.getElementById("bpm");
const bpmVal = document.getElementById("bpmVal");

// Update tempo dynamically
bpmSlider.addEventListener("input", (e) => {
  const v = parseInt(e.target.value, 10);
  Tone.Transport.bpm.value = v;
  bpmVal.textContent = v;
});

// Default tempo
Tone.Transport.bpm.value = parseInt(bpmSlider.value, 10);

// Start playback
startBtn.addEventListener("click", async () => {
  await Tone.start(); // User interaction required for Web Audio
  melodyPart.start(0);
  secondPart.start(0);
  arpPart.start(0);
  bassPart.start(0);

  Tone.Destination.volume.value = -12;
  Tone.Transport.start();
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

// Stop playback
stopBtn.addEventListener("click", () => {
  Tone.Transport.stop();
  melodyPart.stop();
  secondPart.stop();
  arpPart.stop();
  bassPart.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

// Preload samples (optional)
piano.toDestination();
bass.toDestination();

console.log("Canon in D prepared. Click Start to play.");
