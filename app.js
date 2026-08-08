const defaultWorkouts = {
  A: {
    title: "Pecho, tríceps y cuádriceps",
    exercises: [
      ["Pecho", "Press pecho", 4, "6"], ["Piernas", "Prensa piernas", 4, "6"],
      ["Pecho", "Apertura", 4, "6"], ["Piernas", "Extensión", 4, "6"],
      ["Tríceps", "Tríceps asistido", 3, "6–10"], ["Tríceps", "Tríceps cuerda", 3, "10–15"]
    ]
  },
  B: {
    title: "Espalda, bíceps y femoral",
    exercises: [
      ["Espalda", "Jalón al pecho", 4, "6"], ["Espalda", "Remo sentado", 4, "6"],
      ["Bíceps", "Curl de bíceps", 3, "6"], ["Bíceps", "Polea baja con barra recta", 3, "6"],
      ["Piernas", "Flexión de piernas sentado", 3, "6"]
    ]
  },
  C: {
    title: "Hombro, abdomen y gemelos",
    exercises: [
      ["Hombro", "Press de hombros", 4, "6"], ["Hombro", "Elevaciones laterales", 3, "6"],
      ["Hombro", "Deltoide posterior", 3, "6"], ["Abdomen", "Contracción abdominal", 3, "6"],
      ["Piernas", "Gemelos", 4, "6"]
    ]
  }
};

let activeDay = "A";
let calendarCursor = new Date();
let activePanel = "workouts";
const storeKey = "gym-abc-tracker-v1";
let state = JSON.parse(localStorage.getItem(storeKey) || "{}");
let workouts = state.workouts && typeof state.workouts === "object" ? state.workouts : JSON.parse(JSON.stringify(defaultWorkouts));
const list = document.getElementById("exercise-list");
const cardTemplate = document.getElementById("exercise-template");
const seriesTemplate = document.getElementById("series-template");
const planSeriesTemplate = document.getElementById("plan-series-template");
const historyTemplate = document.getElementById("history-template");
const dateInput = document.getElementById("session-date");
const progressSelect = document.getElementById("progress-exercise");
const progressChart = document.getElementById("progress-chart");
const bodyDate = document.getElementById("body-date");
const bodyWeight = document.getElementById("body-weight");
const bodyFatPercent = document.getElementById("body-fat-percent");
const bodyFatKg = document.getElementById("body-fat-kg");
const bodyBone = document.getElementById("body-bone");
const bodyMuscle = document.getElementById("body-muscle");
const bodyLean = document.getElementById("body-lean");
const sessionNotes = document.getElementById("session-notes");
const bodyChartMetric = document.getElementById("body-chart-metric");
const bodyChart = document.getElementById("body-chart");
const settingsDay = document.getElementById("settings-day");
const exerciseLibrary = document.getElementById("exercise-library");
const currentExercisesSettings = document.getElementById("current-exercises-settings");
const customExerciseName = document.getElementById("custom-exercise-name");
const customExerciseGroup = document.getElementById("custom-exercise-group");
const baselineDate = document.getElementById("baseline-date");
const baselineWeight = document.getElementById("baseline-weight");
const baselineFat = document.getElementById("baseline-fat");
const baselineLean = document.getElementById("baseline-lean");
const goalForecast = document.getElementById("goal-forecast");
const profileHeight = document.getElementById("profile-height");
const profileAge = document.getElementById("profile-age");
const exerciseOptions = [
  ["Pecho", "Press inclinado", 4, "6–10"], ["Pecho", "Fondos asistidos", 3, "8–12"], ["Pecho", "Cruce de poleas", 3, "10–15"],
  ["Espalda", "Remo con agarre neutro", 4, "6–10"], ["Espalda", "Pullover en polea", 3, "10–15"],
  ["Hombro", "Elevaciones frontales", 3, "10–15"], ["Hombro", "Face pull", 3, "10–15"],
  ["Bíceps", "Curl martillo", 3, "8–12"], ["Bíceps", "Curl inclinado", 3, "8–12"],
  ["Tríceps", "Extensión por encima de la cabeza", 3, "10–15"], ["Tríceps", "Fondos en máquina", 3, "8–12"],
  ["Piernas", "Hip thrust", 4, "6–10"], ["Piernas", "Peso muerto rumano", 3, "6–10"], ["Piernas", "Sentadilla hack", 4, "6–10"],
  ["Abdomen", "Plancha", 3, "30–60 s"]
];

function today() { return new Date().toISOString().slice(0, 10); }
function persist() { state.workouts = workouts; localStorage.setItem(storeKey, JSON.stringify(state)); }
function key(index) { return `${activeDay}-${index}`; }
function getExercise(index, defaults) {
  const id = key(index);
  if (!state[id]) state[id] = { sets: defaults[2], reps: defaults[3], done: false, entries: Array.from({ length: defaults[2] }, () => ({ weight: "", reps: "" })) };
  syncPlan(state[id]);
  return state[id];
}
function syncPlan(exercise) {
  if (!Array.isArray(exercise.plan)) exercise.plan = exercise.entries.map(entry => ({ weight: entry.weight || "", reps: entry.reps || exercise.reps }));
  while (exercise.plan.length < exercise.sets) exercise.plan.push({ weight: "", reps: exercise.reps });
  while (exercise.plan.length > exercise.sets) exercise.plan.pop();
}
function renumber(container) { container.querySelectorAll(".series-row").forEach((row, i) => row.querySelector(".series-number").textContent = i + 1); }
function addRow(container, entry, exercise) {
  const row = seriesTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".weight-input").value = entry.weight;
  row.querySelector(".actual-reps-input").value = entry.reps;
  row.querySelector(".weight-input").addEventListener("input", e => { entry.weight = e.target.value; persist(); renderAdvice(); });
  row.querySelector(".actual-reps-input").addEventListener("input", e => { entry.reps = e.target.value; persist(); renderAdvice(); });
  row.querySelector(".remove-series").addEventListener("click", () => { exercise.entries.splice([...container.children].indexOf(row), 1); row.remove(); renumber(container); persist(); });
  container.append(row);
}
function addPlanRow(container, entry) {
  const row = planSeriesTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".plan-weight-input").value = entry.weight;
  row.querySelector(".plan-reps-input").value = entry.reps;
  row.querySelector(".plan-weight-input").addEventListener("input", event => { entry.weight = event.target.value; persist(); });
  row.querySelector(".plan-reps-input").addEventListener("input", event => { entry.reps = event.target.value; persist(); });
  container.append(row);
  row.querySelector(".plan-number").textContent = container.children.length;
}
function formatDate(date) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}
function dateKey(year, month, day) { return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
function numberFrom(input) { const value = Number(input.value); return Number.isFinite(value) && value >= 0 && input.value !== "" ? value : null; }
function shownNumber(value) { return Number.isFinite(value) ? `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)} kg` : "—"; }
function updateLean() {
  const bone = numberFrom(bodyBone); const muscle = numberFrom(bodyMuscle);
  bodyLean.textContent = bone !== null || muscle !== null ? shownNumber((bone || 0) + (muscle || 0)) : "—";
}
function syncFat(source) {
  const weight = numberFrom(bodyWeight);
  if (!weight) { updateLean(); return; }
  if (source === "percent") { const percent = numberFrom(bodyFatPercent); if (percent !== null) bodyFatKg.value = (weight * percent / 100).toFixed(1); }
  if (source === "kg") { const fat = numberFrom(bodyFatKg); if (fat !== null) bodyFatPercent.value = (fat / weight * 100).toFixed(1); }
  updateLean();
}
function renderBody() {
  const entries = [...(state.bodyHistory || [])].sort((a, b) => b.date.localeCompare(a.date));
  const latest = entries[0];
  if (latest) {
    bodyDate.value = latest.date; bodyWeight.value = latest.weight ?? ""; bodyFatPercent.value = latest.fatPercent ?? "";
    bodyFatKg.value = latest.fatKg ?? ""; bodyBone.value = latest.bone ?? ""; bodyMuscle.value = latest.muscle ?? "";
  } else { bodyDate.value = today(); [bodyWeight, bodyFatPercent, bodyFatKg, bodyBone, bodyMuscle].forEach(input => input.value = ""); }
  updateLean();
  const fatGoal = document.getElementById("fat-goal-status"); const leanGoal = document.getElementById("lean-goal-status");
  const bmiOutput = document.getElementById("body-bmi"); const height = Number(state.profile?.height);
  bmiOutput.textContent = latest && Number.isFinite(height) && height > 0 ? (latest.weight / ((height / 100) ** 2)).toFixed(1) : "—";
  if (!latest) { fatGoal.textContent = "Registra tu primer dato"; leanGoal.textContent = "Registra tu primer dato"; }
  else {
    const fatDifference = latest.fatKg - 15; const leanDifference = 75 - latest.lean;
    fatGoal.textContent = fatDifference > .05 ? `Faltan ${shownNumber(fatDifference)} por perder` : fatDifference < -.05 ? `${shownNumber(Math.abs(fatDifference))} por debajo de la meta` : "Objetivo alcanzado";
    leanGoal.textContent = leanDifference > .05 ? `Faltan ${shownNumber(leanDifference)} para la meta` : leanDifference < -.05 ? `${shownNumber(Math.abs(leanDifference))} por encima de la meta` : "Objetivo alcanzado";
  }
  const historyList = document.getElementById("body-history-list"); historyList.innerHTML = "";
  renderBodyAdvice(entries);
  if (!entries.length) { historyList.innerHTML = '<p class="empty-history">Guarda un registro corporal para empezar a ver tu evolución.</p>'; return; }
  entries.slice(0, 6).forEach(entry => {
    const card = document.createElement("article"); card.className = "body-history-item";
    const date = document.createElement("time"); date.textContent = formatDate(entry.date);
    const weight = document.createElement("strong"); weight.textContent = `Peso: ${shownNumber(entry.weight)}`;
    const details = document.createElement("span"); details.textContent = `Grasa: ${shownNumber(entry.fatKg)} (${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(entry.fatPercent)} %) · Magra: ${shownNumber(entry.lean)}`;
    card.append(date, weight, details); historyList.append(card);
  });
}
function renderBodyAdvice(entries) {
  const container = document.getElementById("body-advice"); container.innerHTML = "";
  const add = text => { const item = document.createElement("div"); item.className = "body-advice-item"; item.textContent = text; container.append(item); };
  if (!entries.length) { add("Guarda tu primera medición para activar el análisis corporal."); return; }
  const latest = entries[0]; const fatPercent = latest.weight ? latest.fatKg / latest.weight * 100 : latest.fatPercent;
  add(`Último registro: ${shownNumber(latest.weight)}, ${shownNumber(latest.fatKg)} de grasa y ${shownNumber(latest.lean)} de masa magra.`);
  if (entries.length === 1) { add(`Tu grasa actual es ${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(fatPercent)} %. Registra otra medición en condiciones parecidas para comparar la tendencia.`); return; }
  const previous = entries[1]; const fatChange = latest.fatKg - previous.fatKg; const leanChange = latest.lean - previous.lean; const weightChange = latest.weight - previous.weight;
  const signed = value => `${value > 0 ? "+" : ""}${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)} kg`;
  add(`Desde la medición anterior: peso ${signed(weightChange)}, grasa ${signed(fatChange)} y masa magra ${signed(leanChange)}.`);
  if (fatChange < -.1 && leanChange >= -.1) add("La grasa baja mientras la masa magra se mantiene: es una tendencia positiva hacia tus objetivos.");
  else if (fatChange < -.1 && leanChange < -.1) add("La grasa ha bajado, pero también la masa magra. Observa varias mediciones antes de decidir cambios; las básculas pueden variar según hidratación y hora.");
  else if (fatChange > .1 && leanChange > .1) add("Han subido grasa y masa magra. Mira la tendencia de varias semanas, no un único dato.");
  else add("La variación es pequeña o mixta. Mantén condiciones similares al medirte para que la comparación sea más útil.");
}
function forecastDate(fromDate, days) {
  const result = new Date(`${fromDate}T12:00:00`); result.setDate(result.getDate() + Math.ceil(days));
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(result);
}
function renderGoals() {
  const records = [...(state.bodyHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
  const fallback = records[0]; const baseline = state.goalBaseline || fallback;
  if (baseline) {
    baselineDate.value = baseline.date || ""; baselineWeight.value = baseline.weight ?? "";
    baselineFat.value = baseline.fatKg ?? ""; baselineLean.value = baseline.lean ?? "";
  } else { baselineDate.value = ""; baselineWeight.value = ""; baselineFat.value = ""; baselineLean.value = ""; }
  goalForecast.innerHTML = "";
  const add = (title, value, note) => { const card = document.createElement("article"); card.className = "forecast-card"; const heading = document.createElement("p"); heading.textContent = title; const main = document.createElement("strong"); main.textContent = value; const detail = document.createElement("span"); detail.textContent = note; card.append(heading, main, detail); goalForecast.append(card); };
  if (!baseline || !records.length) { add("Estimación", "Añade datos", "Guarda el punto de inicio y al menos una medición corporal."); return; }
  const latest = records.at(-1); const startDate = new Date(`${baseline.date}T12:00:00`); const endDate = new Date(`${latest.date}T12:00:00`); const elapsedDays = Math.round((endDate - startDate) / 86400000);
  if (!Number.isFinite(elapsedDays) || elapsedDays <= 0) { add("Estimación", "Falta tendencia", "Registra otra medición en una fecha posterior para calcular el ritmo."); return; }
  const fatRate = (baseline.fatKg - latest.fatKg) / elapsedDays;
  const leanRate = (latest.lean - baseline.lean) / elapsedDays;
  const fatRemaining = latest.fatKg - 15; const leanRemaining = 75 - latest.lean;
  const fatDays = fatRemaining <= 0 ? 0 : fatRate > 0 ? fatRemaining / fatRate : null;
  const leanDays = leanRemaining <= 0 ? 0 : leanRate > 0 ? leanRemaining / leanRate : null;
  const fatText = fatDays === 0 ? "Objetivo alcanzado" : fatDays ? forecastDate(latest.date, fatDays) : "Sin fecha estimada";
  const leanText = leanDays === 0 ? "Objetivo alcanzado" : leanDays ? forecastDate(latest.date, leanDays) : "Sin fecha estimada";
  const weeklyFat = fatRate * 7; const weeklyLean = leanRate * 7;
  add("15 kg de grasa", fatText, `Ritmo observado: ${weeklyFat >= 0 ? "−" : "+"}${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(Math.abs(weeklyFat))} kg/semana.`);
  add("75 kg de masa magra", leanText, `Ritmo observado: ${weeklyLean >= 0 ? "+" : "−"}${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(Math.abs(weeklyLean))} kg/semana.`);
  const arrivalDates = [fatDays, leanDays].filter(days => days !== null).map(days => Math.ceil(days));
  const combined = arrivalDates.length === 2 ? forecastDate(latest.date, Math.max(...arrivalDates)) : "Sin fecha conjunta";
  add("Objetivo completo", combined, "Referencia de composición: 15 kg de grasa y 75 kg de masa magra.");
}
function saveBaseline() {
  const values = [numberFrom(baselineWeight), numberFrom(baselineFat), numberFrom(baselineLean)];
  if (!baselineDate.value || values.some(value => value === null)) { toast("Completa fecha, peso, grasa y masa magra iniciales"); return; }
  state.goalBaseline = { date: baselineDate.value, weight: values[0], fatKg: values[1], lean: values[2] }; persist(); renderGoals(); toast("Punto de inicio guardado");
}
function renderProfile() {
  profileHeight.value = state.profile?.height ?? "";
  profileAge.value = state.profile?.age ?? "";
}
function saveProfile() {
  const height = numberFrom(profileHeight); const age = numberFrom(profileAge);
  if (height === null || age === null) { toast("Completa altura y edad"); return; }
  state.profile = { height, age }; persist(); renderBody(); toast("Perfil guardado");
}
function saveBody() {
  const weight = numberFrom(bodyWeight); const fatPercent = numberFrom(bodyFatPercent); const fatKg = numberFrom(bodyFatKg); const bone = numberFrom(bodyBone); const muscle = numberFrom(bodyMuscle);
  if ([weight, fatPercent, fatKg, bone, muscle].some(value => value === null)) { toast("Completa todos los datos corporales"); return; }
  const entry = { date: bodyDate.value || today(), weight, fatPercent, fatKg, bone, muscle, lean: bone + muscle };
  state.bodyHistory ||= [];
  const previous = state.bodyHistory.findIndex(item => item.date === entry.date);
  if (previous >= 0) state.bodyHistory[previous] = entry; else state.bodyHistory.push(entry);
  persist(); renderBody(); renderBodyChart(); renderCalendar(); renderGoals(); toast("Registro corporal guardado");
}
function renderBodyChart() {
  const labels = { weight: "Peso corporal", fatKg: "Grasa", fatPercent: "Grasa", lean: "Masa magra" };
  const units = { weight: "kg", fatKg: "kg", fatPercent: "%", lean: "kg" };
  const metric = bodyChartMetric.value;
  const entries = [...(state.bodyHistory || [])].filter(entry => Number.isFinite(entry[metric])).sort((a, b) => a.date.localeCompare(b.date));
  bodyChart.innerHTML = "";
  if (!entries.length) { bodyChart.innerHTML = '<p class="body-chart-empty">Guarda registros corporales para ver esta evolución.</p>'; return; }
  const values = entries.map(entry => entry[metric]); const min = Math.min(...values); const max = Math.max(...values); const width = 640, height = 210, left = 40, right = 18, top = 18, bottom = 40;
  const range = Math.max(1, max - min); const padding = Math.max(metric === "fatPercent" ? .5 : 1, range * .12); const low = Math.max(0, min - padding); const high = max + padding;
  const x = index => entries.length === 1 ? width / 2 : left + index * ((width - left - right) / (entries.length - 1));
  const y = value => top + (high - value) * ((height - top - bottom) / (high - low));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "progress-svg"); svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `Evolución de ${labels[metric]}`);
  [low, (low + high) / 2, high].forEach(value => { const line = document.createElementNS(svg.namespaceURI, "line"); line.setAttribute("class", "body-chart-grid"); line.setAttribute("x1", left); line.setAttribute("x2", width - right); line.setAttribute("y1", y(value)); line.setAttribute("y2", y(value)); svg.append(line); });
  const path = document.createElementNS(svg.namespaceURI, "path"); path.setAttribute("class", "body-chart-line"); path.setAttribute("d", entries.map((entry, index) => `${index ? "L" : "M"}${x(index)},${y(entry[metric])}`).join(" ")); svg.append(path);
  entries.forEach((entry, index) => {
    const dot = document.createElementNS(svg.namespaceURI, "circle"); dot.setAttribute("class", "body-chart-dot"); dot.setAttribute("cx", x(index)); dot.setAttribute("cy", y(entry[metric])); dot.setAttribute("r", "5"); svg.append(dot);
    const value = document.createElementNS(svg.namespaceURI, "text"); value.setAttribute("class", "body-chart-value"); value.setAttribute("x", x(index)); value.setAttribute("y", y(entry[metric]) - 11); value.setAttribute("text-anchor", "middle"); value.textContent = `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(entry[metric])} ${units[metric]}`; svg.append(value);
    const label = document.createElementNS(svg.namespaceURI, "text"); label.setAttribute("class", "body-chart-label"); label.setAttribute("x", x(index)); label.setAttribute("y", height - 13); label.setAttribute("text-anchor", "middle"); label.textContent = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${entry.date}T12:00:00`)); svg.append(label);
  });
  bodyChart.append(svg);
}
function renderCalendar() {
  const year = calendarCursor.getFullYear(); const month = calendarCursor.getMonth();
  document.getElementById("calendar-month").textContent = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
  const calendar = document.getElementById("training-calendar"); calendar.innerHTML = "";
  const start = (new Date(year, month, 1).getDay() + 6) % 7; const days = new Date(year, month + 1, 0).getDate();
  for (let blank = 0; blank < start; blank += 1) { const empty = document.createElement("div"); empty.className = "calendar-day is-empty"; calendar.append(empty); }
  for (let day = 1; day <= days; day += 1) {
    const date = dateKey(year, month, day); const cell = document.createElement("div"); cell.className = "calendar-day";
    if (date === today()) cell.classList.add("is-today");
    const number = document.createElement("span"); number.className = "calendar-number"; number.textContent = day; cell.append(number);
    const details = document.createElement("div"); details.className = "calendar-details";
    (state.history || []).filter(session => session.date === date).forEach(session => { const routine = document.createElement("span"); routine.className = "calendar-tag"; routine.textContent = `Día ${session.day}`; details.append(routine); });
    const bodyEntry = (state.bodyHistory || []).find(entry => entry.date === date);
    if (bodyEntry) {
      [["Peso", bodyEntry.weight], ["Grasa", bodyEntry.fatKg], ["Magro", bodyEntry.lean]].forEach(([label, value]) => {
        const metric = document.createElement("span"); metric.className = "calendar-metric";
        metric.textContent = `${label} ${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)} kg`;
        details.append(metric);
      });
    }
    cell.append(details); calendar.append(cell);
  }
}
function renderAdvice() {
  const container = document.getElementById("training-advice"); container.innerHTML = "";
  workouts[activeDay].exercises.forEach((defaults, index) => {
    const exercise = getExercise(index, defaults); const minimum = Number.parseInt(exercise.reps, 10) || 1;
    const records = exercise.entries.filter(entry => entry.weight !== "" || entry.reps !== "");
    const complete = records.length >= exercise.sets && records.slice(0, exercise.sets).every(entry => Number(entry.reps) >= minimum && Number(entry.weight) > 0);
    const item = document.createElement("div"); item.className = "advice-item";
    const title = document.createElement("strong"); title.textContent = defaults[1];
    const message = document.createElement("span");
    message.textContent = complete ? `Objetivo completado: si la técnica fue buena, prueba el siguiente incremento pequeño de peso la próxima sesión.` : records.length ? `Mantén el peso y busca completar ${exercise.sets} series de al menos ${minimum} repeticiones antes de subir.` : `Registra tus series para recibir una recomendación personalizada.`;
    item.append(title, message); container.append(item);
  });
}
function clearDayDraft(day) {
  Object.keys(state).filter(key => key.startsWith(`${day}-`)).forEach(key => delete state[key]);
}
function renderExerciseSettings() {
  const selectedDay = settingsDay.value || "A";
  settingsDay.value = selectedDay;
  exerciseLibrary.innerHTML = "";
  exerciseOptions.forEach((exercise, index) => { const option = document.createElement("option"); option.value = index; option.textContent = `${exercise[1]} · ${exercise[0]}`; exerciseLibrary.append(option); });
  currentExercisesSettings.innerHTML = "";
  workouts[selectedDay].exercises.forEach((exercise, index) => {
    const row = document.createElement("div"); row.className = "settings-exercise-row";
    const label = document.createElement("span"); label.textContent = `${exercise[1]} · ${exercise[0]} · ${exercise[2]} × ${exercise[3]}`;
    const remove = document.createElement("button"); remove.className = "remove-exercise"; remove.type = "button"; remove.textContent = "Quitar";
    remove.addEventListener("click", () => {
      if (!confirm(`¿Quitar ${exercise[1]} del Día ${selectedDay}? Se conservará el historial guardado.`)) return;
      workouts[selectedDay].exercises.splice(index, 1); clearDayDraft(selectedDay); persist(); render(); toast("Ejercicio quitado");
    });
    row.append(label, remove); currentExercisesSettings.append(row);
  });
}
function addExerciseToDay(exercise) {
  const day = settingsDay.value;
  workouts[day].exercises.push(exercise); clearDayDraft(day); persist(); render(); toast("Ejercicio añadido");
}
function saveWorkout() {
  const workout = workouts[activeDay];
  const snapshot = {
    id: `${activeDay}-${dateInput.value}`,
    day: activeDay,
    date: dateInput.value,
    savedAt: new Date().toISOString(),
    exercises: workout.exercises.map((defaults, index) => {
      const current = getExercise(index, defaults);
      return { name: defaults[1], target: `${current.sets} × ${current.reps}`, done: current.done, entries: current.entries.map(entry => ({ ...entry })) };
    })
  };
  snapshot.note = sessionNotes.value.trim();
  state.history ||= [];
  const oldIndex = state.history.findIndex(item => item.id === snapshot.id);
  if (oldIndex >= 0) state.history[oldIndex] = snapshot;
  else state.history.push(snapshot);
  state[`saved-${activeDay}`] = { date: dateInput.value, savedAt: snapshot.savedAt };
  persist();
  renderHistory();
  renderProgress();
  renderCalendar();
  toast(`Día ${activeDay} guardado en el historial`);
}
function renderProgress() {
  const names = Object.values(workouts).flatMap(workout => workout.exercises.map(exercise => exercise[1]));
  const selected = names.includes(progressSelect.value) ? progressSelect.value : names[0];
  progressSelect.innerHTML = "";
  names.forEach(name => { const option = document.createElement("option"); option.value = name; option.textContent = name; option.selected = name === selected; progressSelect.append(option); });
  const sessions = (state.history || []).map(session => {
    const exercise = session.exercises.find(item => item.name === selected);
    const sets = exercise?.entries || [];
    const best = Math.max(...sets.map(item => Number(item.weight)).filter(weight => Number.isFinite(weight) && weight > 0));
    return { date: session.date, weight: best };
  }).filter(session => Number.isFinite(session.weight)).sort((a, b) => a.date.localeCompare(b.date));
  progressChart.innerHTML = "";
  if (!sessions.length) { progressChart.innerHTML = '<p class="progress-empty">Todavía no hay pesos registrados para este ejercicio. Guarda una sesión para empezar a ver tu evolución.</p>'; return; }
  const last = sessions.at(-1); const max = Math.max(...sessions.map(item => item.weight));
  const first = sessions[0]; const change = last.weight - first.weight;
  const summary = document.createElement("div"); summary.className = "progress-summary";
  [["Último peso", `${last.weight} kg`], ["Mejor marca", `${max} kg`], ["Desde el inicio", `${change >= 0 ? "+" : ""}${change} kg`]].forEach(([label, value]) => {
    const metric = document.createElement("div"); metric.className = "progress-metric";
    const caption = document.createElement("span"); caption.textContent = label;
    const number = document.createElement("strong"); number.textContent = value;
    metric.append(caption, number); summary.append(metric);
  });
  progressChart.append(summary);
  const width = 640, height = 210, left = 40, right = 18, top = 18, bottom = 40;
  const min = Math.min(...sessions.map(item => item.weight)); const range = Math.max(1, max - min); const padding = Math.max(2, range * .12); const yMin = Math.max(0, min - padding); const yMax = max + padding;
  const x = index => sessions.length === 1 ? width / 2 : left + index * ((width - left - right) / (sessions.length - 1));
  const y = weight => top + (yMax - weight) * ((height - top - bottom) / (yMax - yMin));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "progress-svg"); svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `Evolución de peso de ${selected}`);
  [yMin, (yMin + yMax) / 2, yMax].forEach(value => { const line = document.createElementNS(svg.namespaceURI, "line"); line.setAttribute("class", "chart-grid"); line.setAttribute("x1", left); line.setAttribute("x2", width - right); line.setAttribute("y1", y(value)); line.setAttribute("y2", y(value)); svg.append(line); });
  const path = document.createElementNS(svg.namespaceURI, "path"); path.setAttribute("class", "chart-line"); path.setAttribute("d", sessions.map((item, index) => `${index ? "L" : "M"}${x(index)},${y(item.weight)}`).join(" ")); svg.append(path);
  sessions.forEach((item, index) => {
    const dot = document.createElementNS(svg.namespaceURI, "circle"); dot.setAttribute("class", "chart-dot"); dot.setAttribute("cx", x(index)); dot.setAttribute("cy", y(item.weight)); dot.setAttribute("r", "5"); svg.append(dot);
    const value = document.createElementNS(svg.namespaceURI, "text"); value.setAttribute("class", "chart-value"); value.setAttribute("x", x(index)); value.setAttribute("y", y(item.weight) - 11); value.setAttribute("text-anchor", "middle"); value.textContent = `${item.weight} kg`; svg.append(value);
    const label = document.createElementNS(svg.namespaceURI, "text"); label.setAttribute("class", "chart-label"); label.setAttribute("x", x(index)); label.setAttribute("y", height - 13); label.setAttribute("text-anchor", "middle"); label.textContent = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${item.date}T12:00:00`)); svg.append(label);
  });
  progressChart.append(svg);
}
function renderHistory() {
  const history = [...(state.history || [])].sort((a, b) => b.date.localeCompare(a.date) || b.savedAt.localeCompare(a.savedAt));
  const container = document.getElementById("history-list");
  document.getElementById("history-count").textContent = history.length ? `${history.length} ${history.length === 1 ? "sesión" : "sesiones"}` : "";
  container.innerHTML = "";
  if (!history.length) { container.innerHTML = '<p class="empty-history">Aún no hay entrenamientos guardados. Al terminar un día, pulsa “Guardar entrenamiento”.</p>'; return; }
  history.forEach(session => {
    const card = historyTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".history-day").textContent = `DÍA ${session.day}`;
    card.querySelector(".history-date").textContent = formatDate(session.date);
    const exercises = card.querySelector(".history-exercises");
    session.exercises.filter(exercise => exercise.done || exercise.entries.some(entry => entry.weight || entry.reps)).forEach(exercise => {
      const row = document.createElement("div"); row.className = "history-exercise";
      const completed = exercise.entries.filter(entry => entry.weight || entry.reps).map(entry => `${entry.weight || "—"} kg × ${entry.reps || "—"}`).join(" · ");
      const name = document.createElement("strong"); name.textContent = exercise.name;
      const record = document.createElement("span"); record.textContent = completed || exercise.target;
      row.append(name, record);
      exercises.append(row);
    });
    if (!exercises.children.length) exercises.innerHTML = '<p class="empty-history">No se registraron series en esta sesión.</p>';
    if (session.note) { const note = document.createElement("p"); note.className = "history-note"; note.textContent = `Nota: ${session.note}`; exercises.append(note); }
    card.querySelector(".delete-history").addEventListener("click", () => {
      state.history = state.history.filter(item => item.id !== session.id); persist(); renderHistory(); renderProgress(); renderCalendar(); toast("Sesión eliminada del historial");
    });
    container.append(card);
  });
}
function render() {
  const workout = workouts[activeDay];
  document.getElementById("day-label").textContent = `DÍA ${activeDay}`;
  document.getElementById("day-title").textContent = workout.title;
  document.querySelectorAll(".app-tab").forEach(tab => tab.classList.toggle("is-active", tab.dataset.panel === activePanel));
  document.querySelectorAll(".app-panel").forEach(panel => panel.classList.toggle("is-active", panel.dataset.panel === activePanel));
  document.querySelectorAll(".day-tab").forEach(tab => tab.classList.toggle("is-active", tab.dataset.day === activeDay));
  dateInput.value = state[`date-${activeDay}`] || today();
  sessionNotes.value = state[`note-${activeDay}-${dateInput.value}`] || "";
  list.innerHTML = "";
  workout.exercises.forEach((defaults, index) => {
    const exercise = getExercise(index, defaults);
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".muscle-group").textContent = defaults[0];
    card.querySelector("h3").textContent = defaults[1];
    const done = card.querySelector(".done-toggle input"); done.checked = exercise.done; card.classList.toggle("is-done", exercise.done);
    done.addEventListener("change", () => { exercise.done = done.checked; card.classList.toggle("is-done", exercise.done); persist(); });
    const sets = card.querySelector(".sets-input"); const reps = card.querySelector(".reps-input");
    sets.value = exercise.sets; reps.value = exercise.reps;
    sets.addEventListener("change", () => { const amount = Math.max(1, Math.min(12, Number(sets.value) || defaults[2])); exercise.sets = amount; sets.value = amount; while (exercise.entries.length < amount) exercise.entries.push({ weight:"", reps:"" }); while (exercise.entries.length > amount) exercise.entries.pop(); syncPlan(exercise); persist(); render(); });
    reps.addEventListener("input", () => { exercise.reps = reps.value; persist(); renderAdvice(); });
    const planEntries = card.querySelector(".plan-list"); exercise.plan.forEach(entry => addPlanRow(planEntries, entry));
    card.querySelector(".use-plan").addEventListener("click", () => {
      const hasEntries = exercise.entries.some(entry => entry.weight || entry.reps);
      if (hasEntries && !confirm("Esto reemplazará el registro actual de este ejercicio por el plan. ¿Continuar?")) return;
      exercise.entries = exercise.plan.map(entry => ({ ...entry })); persist(); render();
    });
    const entries = card.querySelector(".series-list"); exercise.entries.forEach(entry => addRow(entries, entry, exercise)); renumber(entries);
    card.querySelector(".add-series").addEventListener("click", () => { const entry = { weight:"", reps:"" }; exercise.entries.push(entry); addRow(entries, entry, exercise); renumber(entries); persist(); });
    list.append(card);
  });
  persist();
  renderHistory();
  renderProgress();
  renderBody();
  renderBodyChart();
  renderCalendar();
  renderAdvice();
  renderExerciseSettings();
  renderGoals();
  renderProfile();
}
function toast(message) { const element = document.getElementById("toast"); element.textContent = message; element.classList.add("is-visible"); setTimeout(() => element.classList.remove("is-visible"), 2600); }
function exportData() {
  const backup = { app: "Gym A · B · C", version: 1, exportedAt: new Date().toISOString(), data: state };
  const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gym-abc-historial-${today()}.json`;
  document.body.append(link); link.click(); link.remove();
  URL.revokeObjectURL(url);
  toast("Historial exportado");
}
function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);
      const imported = backup?.data || backup;
      if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error("invalid");
      state = imported;
      persist(); render();
      toast("Historial importado correctamente");
    } catch {
      toast("No se pudo importar este archivo");
    }
  };
  reader.readAsText(file);
}
document.querySelectorAll(".day-tab").forEach(tab => tab.addEventListener("click", () => { activeDay = tab.dataset.day; render(); document.getElementById("exercise-list").scrollIntoView({ behavior: "smooth", block: "start" }); }));
document.querySelectorAll(".app-tab").forEach(tab => tab.addEventListener("click", () => { activePanel = tab.dataset.panel; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }));
dateInput.addEventListener("change", () => { state[`date-${activeDay}`] = dateInput.value; sessionNotes.value = state[`note-${activeDay}-${dateInput.value}`] || ""; persist(); });
sessionNotes.addEventListener("input", () => { state[`note-${activeDay}-${dateInput.value}`] = sessionNotes.value; persist(); });
document.getElementById("complete-day").addEventListener("click", saveWorkout);
document.getElementById("reset-day").addEventListener("click", () => { if (!confirm(`¿Reiniciar los registros del Día ${activeDay}?`)) return; workouts[activeDay].exercises.forEach((_, i) => delete state[key(i)]); persist(); render(); toast(`Día ${activeDay} reiniciado`); });
document.getElementById("export-data").addEventListener("click", exportData);
document.getElementById("import-data").addEventListener("change", event => { importData(event.target.files[0]); event.target.value = ""; });
progressSelect.addEventListener("change", renderProgress);
bodyWeight.addEventListener("input", () => syncFat("percent"));
bodyFatPercent.addEventListener("input", () => syncFat("percent"));
bodyFatKg.addEventListener("input", () => syncFat("kg"));
bodyBone.addEventListener("input", updateLean);
bodyMuscle.addEventListener("input", updateLean);
document.getElementById("save-body").addEventListener("click", saveBody);
bodyChartMetric.addEventListener("change", renderBodyChart);
document.getElementById("previous-month").addEventListener("click", () => { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1); renderCalendar(); });
document.getElementById("next-month").addEventListener("click", () => { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1); renderCalendar(); });
settingsDay.addEventListener("change", renderExerciseSettings);
document.getElementById("add-library-exercise").addEventListener("click", () => addExerciseToDay([...exerciseOptions[Number(exerciseLibrary.value)]]));
document.getElementById("add-custom-exercise").addEventListener("click", () => {
  const name = customExerciseName.value.trim();
  if (!name) { toast("Escribe el nombre del ejercicio"); return; }
  addExerciseToDay([customExerciseGroup.value, name, 3, "8–12"]); customExerciseName.value = "";
});
document.getElementById("save-baseline").addEventListener("click", saveBaseline);
document.getElementById("save-profile").addEventListener("click", saveProfile);
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}
render();
