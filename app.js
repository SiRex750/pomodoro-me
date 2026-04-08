const modeLabel = document.getElementById("modeLabel");
const timeDisplay = document.getElementById("timeDisplay");
const progressBar = document.getElementById("progressBar");
const startPauseBtn = document.getElementById("startPauseBtn");
const startPauseIcon = document.getElementById("startPauseIcon");
const prevTimerBtn = document.getElementById("prevTimerBtn");
const nextTimerBtn = document.getElementById("nextTimerBtn");
const rewind10Btn = document.getElementById("rewind10Btn");
const forward10Btn = document.getElementById("forward10Btn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const resetBtn = document.getElementById("resetBtn");
const pipBtn = document.getElementById("pipBtn");
const muteBtn = document.getElementById("muteBtn");
const muteIcon = document.getElementById("muteIcon");
const workMinutesInput = document.getElementById("workMinutes");
const shortBreakMinutesInput = document.getElementById("shortBreakMinutes");
const longBreakMinutesInput = document.getElementById("longBreakMinutes");
const themeSolidBtn = document.getElementById("themeSolidBtn");
const themePlanetsBtn = document.getElementById("themePlanetsBtn");
const themeMarbleBtn = document.getElementById("themeMarbleBtn");
const supportHint = document.getElementById("supportHint");

const pipVideo = document.getElementById("pipVideo");
const pipCanvas = document.getElementById("pipCanvas");
const pipCtx = pipCanvas.getContext("2d");

const SESSION_VIDEO_SOURCES = {
  focus: "assets/focus.mp4",
  shortBreak: "assets/short-break.mp4",
  longBreak: "assets/long-break.mp4",
};

const PLANET_IMAGES = {
  focus: "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
  shortBreak: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg",
  longBreak: "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg",
};

const MARBLE_IMAGES = {
  focus: "assets/marble-focus.jpg",
  shortBreak: "assets/marble-short-break.jpg",
  longBreak: "assets/marble-long-break.jpg",
};

const THEME_IMAGE_SETS = {
  planets: PLANET_IMAGES,
  marble: MARBLE_IMAGES,
};

const loadedImages = {};
for (const [themeName, imageMap] of Object.entries(THEME_IMAGE_SETS)) {
  loadedImages[themeName] = {};
  for (const [modeKey, url] of Object.entries(imageMap)) {
    const img = new Image();
    if (themeName === "planets") {
      img.crossOrigin = "anonymous";
    }
    img.src = url;
    loadedImages[themeName][modeKey] = img;
  }
}

const state = {
  mode: "focus",
  workSeconds: 25 * 60,
  breakSeconds: 5 * 60,
  longBreakSeconds: 15 * 60,
  completedFocusSessions: 0,
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  running: false,
  muted: false,
  endAtMs: null,
  frameTimer: null,
  timerTimer: null,
  streamReady: false,
  pipSourceType: "canvas",
  currentVideoSrc: "",
  pipTrack: null,
  history: [],
  backgroundTheme: "solid",
  checkedVideoSources: {},
  suppressVideoEvents: false,
};

function formatTime(value) {
  const mins = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function activeDuration() {
  if (state.mode === "focus") {
    return state.workSeconds;
  }

  return state.mode === "longBreak" ? state.longBreakSeconds : state.breakSeconds;
}

function modeLabelText() {
  if (state.mode === "focus") {
    return "Focus Session";
  }

  return state.mode === "longBreak" ? "Long Break" : "Short Break";
}

function modeColors() {
  if (state.mode === "focus") {
    return {
      bg: "#9b5b67",
      title: "#faeef1",
      time: "#ffffff",
      status: "#f0d7de",
      overlay: "rgba(70, 18, 28, 0.5)",
    };
  }

  if (state.mode === "longBreak") {
    return {
      bg: "#3b5a78",
      title: "#e8f1fb",
      time: "#ffffff",
      status: "#c6d7e8",
      overlay: "rgba(9, 31, 66, 0.52)",
    };
  }

  return {
    bg: "#5f8faa",
    title: "#eaf4fb",
    time: "#ffffff",
    status: "#d4e5ef",
    overlay: "rgba(12, 64, 80, 0.46)",
  };
}

function setPiPButtonState(active) {
  pipBtn.classList.toggle("is-active", active);
  pipBtn.setAttribute("aria-label", active ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture");
  pipBtn.setAttribute("title", active ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture");
}

function setSettingsPanelState(open) {
  settingsPanel.hidden = !open;
  settingsBtn.classList.toggle("is-active", open);
  settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
  settingsBtn.setAttribute("aria-label", open ? "Hide timer settings" : "Show timer settings");
  settingsBtn.setAttribute("title", open ? "Hide timer settings" : "Show timer settings");
}

async function isVideoSourceAvailable(source) {
  if (source in state.checkedVideoSources) {
    return state.checkedVideoSources[source];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(source, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    const available = response.ok && contentType.toLowerCase().includes("video");
    state.checkedVideoSources[source] = available;
    return available;
  } catch (error) {
    state.checkedVideoSources[source] = false;
    return false;
  }
}

function setBackgroundTheme(theme) {
  const nextTheme = ["solid", "planets", "marble"].includes(theme) ? theme : "solid";
  state.backgroundTheme = nextTheme;
  document.body.dataset.bgset = nextTheme;
  themeSolidBtn.classList.toggle("is-active", nextTheme === "solid");
  themePlanetsBtn.classList.toggle("is-active", nextTheme === "planets");
  themeMarbleBtn.classList.toggle("is-active", nextTheme === "marble");
  themeSolidBtn.setAttribute("aria-pressed", nextTheme === "solid" ? "true" : "false");
  themePlanetsBtn.setAttribute("aria-pressed", nextTheme === "planets" ? "true" : "false");
  themeMarbleBtn.setAttribute("aria-pressed", nextTheme === "marble" ? "true" : "false");
  localStorage.setItem("pomodoroBackgroundTheme", nextTheme);
}

function hasFiniteVideoDuration() {
  return Number.isFinite(pipVideo.duration) && pipVideo.duration > 0;
}

function syncVideoPositionFromTimer() {
  if (state.pipSourceType !== "video" || !hasFiniteVideoDuration()) {
    return;
  }

  const duration = activeDuration();
  if (duration <= 0) {
    return;
  }

  const elapsedTimer = Math.max(0, Math.min(duration, duration - state.remainingSeconds));
  const targetCurrentTime = (elapsedTimer / duration) * pipVideo.duration;

  if (Math.abs((pipVideo.currentTime || 0) - targetCurrentTime) > 0.4) {
    pipVideo.currentTime = targetCurrentTime;
  }
}

function syncTimerFromVideoPosition() {
  if (state.pipSourceType !== "video" || !hasFiniteVideoDuration()) {
    return;
  }

  const duration = activeDuration();
  const progress = Math.max(0, Math.min(1, pipVideo.currentTime / pipVideo.duration));
  state.remainingSeconds = Math.max(0, duration - progress * duration);
  state.totalSeconds = duration;

  if (state.running) {
    state.endAtMs = Date.now() + state.remainingSeconds * 1000;
  }
}

function applyVideoPlaybackRateForMode() {
  if (state.pipSourceType !== "video" || !hasFiniteVideoDuration()) {
    return;
  }

  const duration = activeDuration();
  const rate = duration > 0 ? pipVideo.duration / duration : 1;
  pipVideo.playbackRate = Math.max(0.1, Math.min(rate, 16));
}

function loadVideoSource(src) {
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve(true);
    };

    const onError = () => {
      cleanup();
      reject(new Error("video_load_failed"));
    };

    const cleanup = () => {
      clearTimeout(loadTimeout);
      pipVideo.removeEventListener("loadedmetadata", onLoaded);
      pipVideo.removeEventListener("error", onError);
    };

    const loadTimeout = setTimeout(() => {
      cleanup();
      reject(new Error("video_load_timeout"));
    }, 2500);

    pipVideo.addEventListener("loadedmetadata", onLoaded, { once: true });
    pipVideo.addEventListener("error", onError, { once: true });

    pipVideo.srcObject = null;
    pipVideo.src = src;
    pipVideo.load();
  });
}

async function setupPiPVideoSourceForMode() {
  const source = SESSION_VIDEO_SOURCES[state.mode];
  if (!source) {
    return false;
  }

  if (!(await isVideoSourceAvailable(source))) {
    return false;
  }

  try {
    if (state.currentVideoSrc !== source) {
      await loadVideoSource(source);
      state.currentVideoSrc = source;
    }

    if (!hasFiniteVideoDuration()) {
      return false;
    }

    state.pipSourceType = "video";
    state.streamReady = true;
    state.pipTrack = null;
    pipVideo.loop = false;
    pipVideo.muted = state.muted;
    applyVideoPlaybackRateForMode();
    syncVideoPositionFromTimer();
    return true;
  } catch (error) {
    return false;
  }
}

function createSnapshot() {
  return {
    mode: state.mode,
    completedFocusSessions: state.completedFocusSessions,
    totalSeconds: state.totalSeconds,
    remainingSeconds: state.remainingSeconds,
    running: state.running,
  };
}

function pushHistorySnapshot() {
  state.history.push(createSnapshot());
  if (state.history.length > 80) {
    state.history.shift();
  }
}

function restoreSnapshot(snapshot) {
  state.mode = snapshot.mode;
  state.completedFocusSessions = snapshot.completedFocusSessions;
  state.totalSeconds = snapshot.totalSeconds;
  state.remainingSeconds = snapshot.remainingSeconds;
  state.running = snapshot.running;
  state.endAtMs = snapshot.running ? Date.now() + state.remainingSeconds * 1000 : null;
}

function renderPiPFrame() {
  if (state.pipSourceType !== "canvas") {
    return;
  }

  const w = pipCanvas.width;
  const h = pipCanvas.height;
  const colors = modeColors();

  // Keep canvas frames same-origin safe; cross-origin image drawing can taint canvas
  // and break helper-video PiP behavior in some browsers.
  pipCtx.fillStyle = colors.bg;
  pipCtx.fillRect(0, 0, w, h);

  const activeImageSet = loadedImages[state.backgroundTheme];
  if (activeImageSet && activeImageSet[state.mode] && activeImageSet[state.mode].complete) {
    const img = activeImageSet[state.mode];
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let drawW = w;
    let drawH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawW = h * imgRatio;
      offsetX = (w - drawW) / 2;
    } else {
      drawH = w / imgRatio;
      offsetY = (h - drawH) / 2;
    }

    try {
      pipCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
      pipCtx.fillStyle = colors.overlay;
      pipCtx.fillRect(0, 0, w, h);
    } catch (e) {
      // Ignore taint errors if any still happen
    }
  }

  pipCtx.fillStyle = colors.title;
  pipCtx.font = "600 28px 'Space Grotesk', sans-serif";
  pipCtx.textAlign = "center";
  pipCtx.fillText(modeLabelText(), w / 2, 115);

  pipCtx.fillStyle = colors.time;
  pipCtx.font = "700 120px 'Space Grotesk', sans-serif";
  pipCtx.fillText(formatTime(state.remainingSeconds), w / 2, 245);

  pipCtx.fillStyle = colors.status;
  pipCtx.font = "500 24px 'Space Grotesk', sans-serif";
  pipCtx.fillText(state.running ? "Running" : "Paused", w / 2, 300);

  // Explicitly push a frame when supported. This is more resilient than relying on FPS capture
  // when tabs become backgrounded or window focus changes.
  if (state.pipTrack && typeof state.pipTrack.requestFrame === "function") {
    state.pipTrack.requestFrame();
  }
}

function startPiPFrameLoop() {
  if (state.frameTimer) {
    return;
  }

  // A dedicated frame loop keeps the PiP timer updating even when UI updates are infrequent.
  state.frameTimer = setInterval(() => {
    if (state.pipSourceType !== "canvas") {
      return;
    }

    if (state.running && state.endAtMs) {
      state.remainingSeconds = Math.max(0, (state.endAtMs - Date.now()) / 1000);
      if (state.remainingSeconds <= 0) {
        switchMode();
        return;
      }
    }

    renderPiPFrame();
  }, 125);
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: "Pomodoro",
    artist: modeLabelText(),
    album: formatTime(state.remainingSeconds),
  });

  if (navigator.mediaSession.setPositionState) {
    const duration = activeDuration();
    const elapsed = duration - state.remainingSeconds;
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: Math.min(Math.max(elapsed, 0), duration),
    });
  }

  navigator.mediaSession.playbackState = state.running ? "playing" : "paused";
}

function updateUI() {
  modeLabel.textContent = modeLabelText();
  timeDisplay.textContent = formatTime(state.remainingSeconds);

  const elapsed = state.totalSeconds - state.remainingSeconds;
  const percent = (elapsed / state.totalSeconds) * 100;
  progressBar.style.width = `${Math.max(0, Math.min(percent, 100))}%`;

  startPauseIcon.className = state.running ? "ri-pause-fill" : "ri-play-fill";
  startPauseBtn.setAttribute("aria-label", state.running ? "Pause timer" : "Start timer");
  startPauseBtn.setAttribute("title", state.running ? "Pause timer" : "Start timer");
  prevTimerBtn.disabled = state.history.length === 0;
  muteIcon.className = state.muted ? "ri-volume-mute-line" : "ri-volume-up-line";
  muteBtn.setAttribute("aria-label", state.muted ? "Unmute alarm" : "Mute alarm");
  muteBtn.setAttribute("title", state.muted ? "Unmute alarm" : "Mute alarm");
  muteBtn.setAttribute("aria-pressed", state.muted ? "true" : "false");

  document.body.dataset.session = state.mode;

  syncVideoPositionFromTimer();
  updateMediaSession();
  renderPiPFrame();
}

function applySettings(resetTimer = true) {
  const work = Math.min(120, Math.max(1, Number(workMinutesInput.value) || 25));
  const shortBreak = Math.min(60, Math.max(1, Number(shortBreakMinutesInput.value) || 5));
  const longBreak = Math.min(120, Math.max(1, Number(longBreakMinutesInput.value) || 15));

  state.workSeconds = work * 60;
  state.breakSeconds = shortBreak * 60;
  state.longBreakSeconds = longBreak * 60;

  if (resetTimer) {
    state.mode = "focus";
    state.completedFocusSessions = 0;
    state.history = [];
    state.totalSeconds = state.workSeconds;
    state.remainingSeconds = state.workSeconds;
    state.endAtMs = null;
  }

  updateUI();
}

function playAlarm() {
  if (state.muted) {
    return;
  }

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beepLength = 0.19;

  for (let i = 0; i < 3; i += 1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + i * 0.24);
    gain.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + i * 0.24 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.24 + beepLength);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + i * 0.24);
    osc.stop(audioCtx.currentTime + i * 0.24 + beepLength + 0.02);
  }

  setTimeout(() => audioCtx.close(), 1400);
}

function switchMode(recordHistory = true) {
  if (recordHistory) {
    pushHistorySnapshot();
  }

  if (state.mode === "focus") {
    state.completedFocusSessions += 1;
    state.mode = state.completedFocusSessions % 4 === 0 ? "longBreak" : "shortBreak";
  } else {
    state.mode = "focus";
  }

  state.totalSeconds = activeDuration();
  state.remainingSeconds = state.totalSeconds;
  state.endAtMs = state.running ? Date.now() + state.remainingSeconds * 1000 : null;
  playAlarm();
  updateUI();

  if (state.pipSourceType === "video") {
    setupPiPVideoSourceForMode().then((loaded) => {
      if (loaded && state.running) {
        pipVideo.play().catch(() => {});
      }
    });
  }
}

function previousMode() {
  if (state.history.length === 0) {
    return;
  }

  const snapshot = state.history.pop();
  restoreSnapshot(snapshot);
  syncVideoPlayback(state.running);
  updateUI();
}

function syncVideoPlayback(run) {
  state.suppressVideoEvents = true;
  if (run) {
    pipVideo.play().catch(() => {});
  } else {
    pipVideo.pause();
  }

  setTimeout(() => {
    state.suppressVideoEvents = false;
  }, 40);
}

function keepPiPVideoAlive() {
  if (!document.pictureInPictureElement) {
    return;
  }

  if (state.running && pipVideo.paused) {
    state.suppressVideoEvents = true;
    pipVideo.play().catch(() => {});
    setTimeout(() => {
      state.suppressVideoEvents = false;
    }, 80);
  }
}

function tick() {
  if (!state.running) {
    return;
  }

  if (state.endAtMs) {
    state.remainingSeconds = Math.max(0, (state.endAtMs - Date.now()) / 1000);
  }

  if (state.remainingSeconds <= 0) {
    switchMode();
    return;
  }

  updateUI();
}

function startTimer() {
  if (state.running) {
    return;
  }

  state.running = true;
  state.endAtMs = Date.now() + state.remainingSeconds * 1000;

  if (!state.timerTimer) {
    state.timerTimer = setInterval(tick, 200);
  }

  syncVideoPlayback(true);
  updateUI();
}

function pauseTimer() {
  if (!state.running) {
    return;
  }

  if (state.endAtMs) {
    state.remainingSeconds = Math.max(0, (state.endAtMs - Date.now()) / 1000);
  }

  state.running = false;
  state.endAtMs = null;
  syncVideoPlayback(false);
  updateUI();
}

function resetTimer() {
  state.running = false;
  state.mode = "focus";
  state.completedFocusSessions = 0;
  state.history = [];
  state.totalSeconds = state.workSeconds;
  state.remainingSeconds = state.workSeconds;
  state.endAtMs = null;
  syncVideoPlayback(false);
  updateUI();
}

function seekBy(seconds) {
  state.remainingSeconds = Math.max(0, Math.min(state.totalSeconds, state.remainingSeconds + seconds));
  if (state.running) {
    state.endAtMs = Date.now() + state.remainingSeconds * 1000;
  }
  syncVideoPositionFromTimer();
  updateUI();
}

function setupPiPStream() {
  if (state.streamReady && state.pipSourceType === "canvas" && pipVideo.srcObject) {
    pipVideo.muted = state.muted;
    return;
  }

  if (pipVideo.srcObject) {
    pipVideo.srcObject.getTracks().forEach((t) => t.stop());
  }

  pipVideo.removeAttribute("src");

  renderPiPFrame();
  // Prefer manual frame requests when available, but fall back to fixed-FPS capture
  // for browsers that don't support CanvasCaptureMediaStreamTrack.requestFrame.
  let stream = pipCanvas.captureStream(0);
  let [track] = stream.getVideoTracks();

  if (!track || typeof track.requestFrame !== "function") {
    stream.getTracks().forEach((t) => t.stop());
    stream = pipCanvas.captureStream(12);
    [track] = stream.getVideoTracks();
  }

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }
  } catch (err) {}

  state.pipTrack = track || null;
  state.pipSourceType = "canvas";
  state.currentVideoSrc = "";
  pipVideo.srcObject = stream;
  pipVideo.loop = true;
  pipVideo.muted = state.muted;

  state.streamReady = true;
  startPiPFrameLoop();
}

async function togglePiP() {
  try {
    const hasVideoMode = await setupPiPVideoSourceForMode();
    if (!hasVideoMode) {
      setupPiPStream();
    } 

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }

    // If the browser supports the programmatic PiP API (Chrome, Edge, Safari)
    if (typeof pipVideo.requestPictureInPicture === "function") {
      pipVideo.hidden = true; // Chrome allows PiP even if video is hidden usually, but we keep it hidden to not ruin UI
      await pipVideo.play().catch(() => {});
      await pipVideo.requestPictureInPicture();
    } else {
      // Fallback for Firefox which may not support requestPictureInPicture from a button
      if (pipVideo.hidden) {
        pipVideo.hidden = false;
        pipVideo.classList.add("pip-video-helper");
        await pipVideo.play().catch(() => {});
        setPiPButtonState(true);
      } else {
        pipVideo.hidden = true;
        pipVideo.pause();
        setPiPButtonState(false);
      }
    }
  } catch (error) {
    console.error("PiP helper error:", error);
  }
}

function setupMediaSessionHandlers() {
  if (!("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.setActionHandler("play", () => startTimer());
  navigator.mediaSession.setActionHandler("pause", () => pauseTimer());
  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    const step = details.seekOffset || 10;
    seekBy(-step);
  });
  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    const step = details.seekOffset || 10;
    seekBy(step);
  });
  navigator.mediaSession.setActionHandler("stop", () => pauseTimer());
}

startPauseBtn.addEventListener("click", () => {
  if (state.running) {
    pauseTimer();
  } else {
    startTimer();
  }
});

prevTimerBtn.addEventListener("click", () => previousMode());
nextTimerBtn.addEventListener("click", () => switchMode());
rewind10Btn.addEventListener("click", () => seekBy(10));
forward10Btn.addEventListener("click", () => seekBy(-10));
settingsBtn.addEventListener("click", () => setSettingsPanelState(settingsPanel.hidden));

resetBtn.addEventListener("click", () => resetTimer());
pipBtn.addEventListener("click", () => togglePiP());

muteBtn.addEventListener("click", () => {
  state.muted = !state.muted;
  pipVideo.muted = state.muted;
  updateUI();
});

workMinutesInput.addEventListener("change", () => applySettings(!state.running));
shortBreakMinutesInput.addEventListener("change", () => applySettings(!state.running));
longBreakMinutesInput.addEventListener("change", () => applySettings(!state.running));
themeSolidBtn.addEventListener("click", () => setBackgroundTheme("solid"));
themePlanetsBtn.addEventListener("click", () => setBackgroundTheme("planets"));
themeMarbleBtn.addEventListener("click", () => setBackgroundTheme("marble"));

pipVideo.addEventListener("play", () => {
  if (!state.suppressVideoEvents) {
    startTimer();
  }
});

pipVideo.addEventListener("pause", () => {
  if (document.pictureInPictureElement && state.running) {
    keepPiPVideoAlive();
    return;
  }

  if (!state.suppressVideoEvents) {
    pauseTimer();
  }
});

pipVideo.addEventListener("volumechange", () => {
  const mutedByVideo = pipVideo.muted || pipVideo.volume === 0;
  if (mutedByVideo !== state.muted) {
    state.muted = mutedByVideo;
    updateUI();
  }
});

pipVideo.addEventListener("seeked", () => {
  syncTimerFromVideoPosition();
  updateUI();
});

pipVideo.addEventListener("loadedmetadata", () => {
  applyVideoPlaybackRateForMode();
  syncVideoPositionFromTimer();
});

pipVideo.addEventListener("enterpictureinpicture", () => {
  setPiPButtonState(true);
  supportHint.textContent = "PiP active. Use play/pause and +/-10s controls (best in Chrome/Edge).";
});

pipVideo.addEventListener("leavepictureinpicture", () => {
  setPiPButtonState(false);
  supportHint.textContent = "";
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    keepPiPVideoAlive();
    return;
  }

  if (state.running) {
    updateUI();
    keepPiPVideoAlive();
  }
});

window.addEventListener("focus", () => {
  if (state.running) {
    updateUI();
    keepPiPVideoAlive();
  }
});

window.addEventListener("beforeunload", () => {
  if (state.timerTimer) {
    clearInterval(state.timerTimer);
  }

  if (state.frameTimer) {
    clearInterval(state.frameTimer);
  }
});

if (!("pictureInPictureEnabled" in document) || !document.pictureInPictureEnabled) {
  setPiPButtonState(false);
  supportHint.textContent = "";
}

applySettings(true);
setSettingsPanelState(false);
setBackgroundTheme(localStorage.getItem("pomodoroBackgroundTheme") || "solid");
setupMediaSessionHandlers();
