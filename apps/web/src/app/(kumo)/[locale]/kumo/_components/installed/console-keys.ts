/**
 * Key tables for typing pasted text into a VM console, copied unchanged from
 * the installed app page's console tab.
 */

export const SHIFT_KEYSYM = 0xffe1

export const MODIFIER_RELEASES: Array<[number, string]> = [
  [0xffe1, "ShiftLeft"],
  [0xffe2, "ShiftRight"],
  [0xffe3, "ControlLeft"],
  [0xffe4, "ControlRight"],
  [0xffe9, "AltLeft"],
  [0xffea, "AltRight"],
  [0xffeb, "MetaLeft"],
  [0xffec, "MetaRight"]
]

export interface KeyInfo {
  code: string
  shift: boolean
  keysym?: number
}

// Maps characters to their physical key (KeyboardEvent.code) and Shift state
// on the VM's en-us layout. Client keyboard layout is irrelevant because paste
// reads resolved characters from the clipboard, not keyboard events. The code
// values feed into noVNC's QEMU extended key event path, which sends XT
// scancodes directly — bypassing QEMU's unreliable keysym reverse-mapping.
export const CHAR_TO_KEY: Record<string, KeyInfo> = {
  "\n": { code: "Enter", shift: false, keysym: 0xff0d },
  "\r": { code: "Enter", shift: false, keysym: 0xff0d },
  "\t": { code: "Tab", shift: false, keysym: 0xff09 },
  " ": { code: "Space", shift: false },
  "!": { code: "Digit1", shift: true },
  '"': { code: "Quote", shift: true },
  "#": { code: "Digit3", shift: true },
  $: { code: "Digit4", shift: true },
  "%": { code: "Digit5", shift: true },
  "&": { code: "Digit7", shift: true },
  "'": { code: "Quote", shift: false },
  "(": { code: "Digit9", shift: true },
  ")": { code: "Digit0", shift: true },
  "*": { code: "Digit8", shift: true },
  "+": { code: "Equal", shift: true },
  ",": { code: "Comma", shift: false },
  "-": { code: "Minus", shift: false },
  ".": { code: "Period", shift: false },
  "/": { code: "Slash", shift: false },
  "0": { code: "Digit0", shift: false },
  "1": { code: "Digit1", shift: false },
  "2": { code: "Digit2", shift: false },
  "3": { code: "Digit3", shift: false },
  "4": { code: "Digit4", shift: false },
  "5": { code: "Digit5", shift: false },
  "6": { code: "Digit6", shift: false },
  "7": { code: "Digit7", shift: false },
  "8": { code: "Digit8", shift: false },
  "9": { code: "Digit9", shift: false },
  ":": { code: "Semicolon", shift: true },
  ";": { code: "Semicolon", shift: false },
  "<": { code: "Comma", shift: true },
  "=": { code: "Equal", shift: false },
  ">": { code: "Period", shift: true },
  "?": { code: "Slash", shift: true },
  "@": { code: "Digit2", shift: true },
  A: { code: "KeyA", shift: true },
  B: { code: "KeyB", shift: true },
  C: { code: "KeyC", shift: true },
  D: { code: "KeyD", shift: true },
  E: { code: "KeyE", shift: true },
  F: { code: "KeyF", shift: true },
  G: { code: "KeyG", shift: true },
  H: { code: "KeyH", shift: true },
  I: { code: "KeyI", shift: true },
  J: { code: "KeyJ", shift: true },
  K: { code: "KeyK", shift: true },
  L: { code: "KeyL", shift: true },
  M: { code: "KeyM", shift: true },
  N: { code: "KeyN", shift: true },
  O: { code: "KeyO", shift: true },
  P: { code: "KeyP", shift: true },
  Q: { code: "KeyQ", shift: true },
  R: { code: "KeyR", shift: true },
  S: { code: "KeyS", shift: true },
  T: { code: "KeyT", shift: true },
  U: { code: "KeyU", shift: true },
  V: { code: "KeyV", shift: true },
  W: { code: "KeyW", shift: true },
  X: { code: "KeyX", shift: true },
  Y: { code: "KeyY", shift: true },
  Z: { code: "KeyZ", shift: true },
  "[": { code: "BracketLeft", shift: false },
  "\\": { code: "Backslash", shift: false },
  "]": { code: "BracketRight", shift: false },
  "^": { code: "Digit6", shift: true },
  _: { code: "Minus", shift: true },
  "`": { code: "Backquote", shift: false },
  a: { code: "KeyA", shift: false },
  b: { code: "KeyB", shift: false },
  c: { code: "KeyC", shift: false },
  d: { code: "KeyD", shift: false },
  e: { code: "KeyE", shift: false },
  f: { code: "KeyF", shift: false },
  g: { code: "KeyG", shift: false },
  h: { code: "KeyH", shift: false },
  i: { code: "KeyI", shift: false },
  j: { code: "KeyJ", shift: false },
  k: { code: "KeyK", shift: false },
  l: { code: "KeyL", shift: false },
  m: { code: "KeyM", shift: false },
  n: { code: "KeyN", shift: false },
  o: { code: "KeyO", shift: false },
  p: { code: "KeyP", shift: false },
  q: { code: "KeyQ", shift: false },
  r: { code: "KeyR", shift: false },
  s: { code: "KeyS", shift: false },
  t: { code: "KeyT", shift: false },
  u: { code: "KeyU", shift: false },
  v: { code: "KeyV", shift: false },
  w: { code: "KeyW", shift: false },
  x: { code: "KeyX", shift: false },
  y: { code: "KeyY", shift: false },
  z: { code: "KeyZ", shift: false },
  "{": { code: "BracketLeft", shift: true },
  "|": { code: "Backslash", shift: true },
  "}": { code: "BracketRight", shift: true },
  "~": { code: "Backquote", shift: true }
}
