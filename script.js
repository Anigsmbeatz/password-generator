const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~",
};
const AMBIGUOUS = /[O0lI1]/g;

const el = (id) => document.getElementById(id);
const passwordInput = el("password");
const lengthInput = el("length");
const lengthValue = el("length-value");
const errorBox = el("error");
const strengthBar = el("strength-bar");
const strengthLabel = el("strength-label");
const copyBtn = el("copy");

// Entier aléatoire uniforme dans [0, max) via crypto, sans biais de modulo
function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getSelectedSets() {
  const excludeAmbiguous = el("ambiguous").checked;
  return Object.keys(CHARSETS)
    .filter((key) => el(key).checked)
    .map((key) => (excludeAmbiguous ? CHARSETS[key].replace(AMBIGUOUS, "") : CHARSETS[key]));
}

function generatePassword(length, sets) {
  const all = sets.join("");
  // Garantit au moins un caractère de chaque catégorie choisie
  const chars = sets.map((set) => set[randomInt(set.length)]);
  while (chars.length < length) {
    chars.push(all[randomInt(all.length)]);
  }
  return shuffle(chars).join("");
}

function updateStrength(length, poolSize) {
  const entropy = length * Math.log2(poolSize);
  const levels = [
    { max: 40, label: "Faible", color: "#dc2626", pct: 25 },
    { max: 60, label: "Moyen", color: "#f59e0b", pct: 50 },
    { max: 90, label: "Fort", color: "#22c55e", pct: 75 },
    { max: Infinity, label: "Très fort", color: "#16a34a", pct: 100 },
  ];
  const level = levels.find((l) => entropy < l.max);
  strengthBar.style.width = level.pct + "%";
  strengthBar.style.background = level.color;
  strengthLabel.textContent = `${level.label} (${Math.round(entropy)} bits)`;
}

function generate() {
  const length = Number(lengthInput.value);
  const sets = getSelectedSets();

  if (sets.length === 0) {
    errorBox.textContent = "Sélectionnez au moins un type de caractères.";
    passwordInput.value = "";
    strengthBar.style.width = "0";
    strengthLabel.textContent = "";
    return;
  }
  errorBox.textContent = "";

  passwordInput.value = generatePassword(length, sets);
  updateStrength(length, sets.join("").length);
}

async function copyPassword() {
  if (!passwordInput.value) return;
  try {
    await navigator.clipboard.writeText(passwordInput.value);
  } catch {
    // Repli pour les navigateurs qui bloquent l'API presse-papiers (ex. file://)
    passwordInput.select();
    document.execCommand("copy");
  }
  copyBtn.textContent = "Copié !";
  setTimeout(() => (copyBtn.textContent = "Copier"), 1500);
}

lengthInput.addEventListener("input", () => {
  lengthValue.textContent = lengthInput.value;
  generate();
});
document.querySelectorAll(".options input").forEach((cb) => cb.addEventListener("change", generate));
el("generate").addEventListener("click", generate);
copyBtn.addEventListener("click", copyPassword);

generate();
