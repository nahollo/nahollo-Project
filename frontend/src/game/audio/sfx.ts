type SfxId = "attack" | "damage" | "steal" | "patch" | "phase";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!Context) {
    return null;
  }

  if (!audioContext) {
    audioContext = new Context();
  }

  return audioContext;
}

function tone(
  context: AudioContext,
  frequency: number,
  duration: number,
  gainValue: number,
  type: OscillatorType,
  offset = 0
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + offset;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

export function playSfx(id: SfxId, enabled: boolean): void {
  if (!enabled) {
    return;
  }

  const context = getContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  if (id === "attack") {
    tone(context, 220, 0.08, 0.028, "square");
    tone(context, 330, 0.05, 0.02, "triangle", 0.02);
    return;
  }

  if (id === "damage") {
    tone(context, 120, 0.14, 0.03, "sawtooth");
    tone(context, 90, 0.18, 0.018, "triangle", 0.01);
    return;
  }

  if (id === "steal") {
    tone(context, 420, 0.1, 0.026, "triangle");
    tone(context, 620, 0.12, 0.018, "square", 0.05);
    return;
  }

  if (id === "patch") {
    tone(context, 300, 0.08, 0.018, "square");
    tone(context, 450, 0.09, 0.02, "triangle", 0.03);
    tone(context, 700, 0.14, 0.012, "sine", 0.07);
    return;
  }

  tone(context, 160, 0.2, 0.028, "sawtooth");
  tone(context, 240, 0.22, 0.02, "triangle", 0.05);
  tone(context, 320, 0.28, 0.014, "square", 0.09);
}
