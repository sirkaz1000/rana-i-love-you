(() => {
  "use strict";

  const config = window.GIFT_CONFIG;
  if (!config) {
    console.error("تعذر تحميل إعدادات الهدية من config.js.");
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const arabicNumber = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 });
  const reducedBySystem = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  let soundEnabled = Boolean(config.gate.soundEnabledByDefault);
  let secretOpened = false;
  let discoveredReasons = 0;
  let parallaxFrame = 0;

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value ?? "";
  }

  function populateContent() {
    document.title = config.pageTitle;
    setText("[data-entry-eyebrow]", config.pageTitle);
    setText("[data-gate-title]", config.gate.title);
    setText("[data-gate-description]", config.gate.description);
    setText("[data-password-label]", config.gate.inputLabel);
    $("#readingProgress").setAttribute("aria-label", config.accessibility.progressLabel);
    $("#wordmarkLink").setAttribute("aria-label", config.intro.wordmarkLabel);
    $("#scrollCue").setAttribute("aria-label", config.intro.scrollLabel);
    const passwordInput = $("#passwordInput");
    passwordInput.placeholder = config.gate.inputPlaceholder;
    setText("[data-gate-submit]", config.gate.submitLabel);
    setText("[data-recipient-name]", config.names.recipient);
    setText("#heroFirstLine", config.intro.firstLine);
    setText("#heroSecondLine", config.intro.secondLine);
    setText("#heroTitle", config.intro.headline);
    setText("#heroDescription", config.intro.description);
    setText("#journeyButtonLabel", config.intro.buttonLabel);
    setText("#galleryTitle", config.gallery.title);
    $("#photoDialog").setAttribute("aria-label", config.gallery.dialogLabel);
    $("#closePhotoDialog").setAttribute("aria-label", config.gallery.closeLabel);
    setText("#qualitiesTitle", config.qualities.title);
    setText("#heartLetterTitle", config.heartLetter.title);
    setText("#heartLetterSignature", config.heartLetter.signature);
    setText("#reasonsTitle", config.reasons.title);
    setText("#discoverButtonLabel", config.reasons.buttonLabel);
    setText("#timelineTitle", config.timeline.title);
    setText("#timelineDate", config.timeline.displayDate);
    setText("#timelineDescription", config.timeline.description);
    setText("#starsTitle", config.stars.title);
    $("#mainStarButton").setAttribute("aria-label", config.stars.buttonLabel);
    setText("#videoTitle", config.video.title);
    setText("#secretTitle", config.secretLetter.title);
    setText("#secretButtonLabel", config.secretLetter.buttonLabel);
    setText("#footerClosing", config.footer.closing);
    setText("#footerDedication", config.footer.dedication);
    setText("#footerCredit", config.footer.credit);
    setText("#backToTopLabel", config.footer.backToTop);
    setText("#musicTitle", config.music.title);
    setText("#musicArtist", config.music.artist);
    setText("#musicVolumeLabel", config.music.volumeLabel);
    $("#musicToggle").setAttribute("aria-label", config.music.playLabel);
    $("#musicSeek").setAttribute("aria-label", config.music.seekLabel);
    $("#rewindMusic").setAttribute("aria-label", config.music.rewindLabel);
    $("#forwardMusic").setAttribute("aria-label", config.music.forwardLabel);

    const letterCopy = $("#heartLetterCopy");
    config.heartLetter.paragraphs.forEach((paragraph, index) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      p.classList.add("reveal");
      p.style.transitionDelay = `${Math.min(index * 120, 480)}ms`;
      letterCopy.append(p);
    });

    const countdown = $("#countdown");
    config.timeline.units.forEach((label, index) => {
      const unit = document.createElement("div");
      unit.className = "time-unit";
      unit.innerHTML = `<span class="time-value" data-time-index="${index}">0</span><span class="time-label"></span>`;
      unit.querySelector(".time-label").textContent = label;
      countdown.append(unit);
    });

    renderQualities();
  }

  function renderQualities() {
    const grid = $("#qualitiesGrid");
    config.qualities.cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quality-card reveal";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${card.title}، اضغطي لقراءة الرسالة`);
      button.innerHTML = `
        <span class="quality-card-inner">
          <span class="quality-face quality-card-front"><span class="quality-heart" aria-hidden="true">♥</span><span class="quality-title"></span><span class="quality-hint">✦</span></span>
          <span class="quality-face quality-card-back"><span class="quality-heart" aria-hidden="true">♥</span><span class="quality-message"></span></span>
        </span>`;
      button.querySelector(".quality-title").textContent = card.title;
      button.querySelector(".quality-message").textContent = card.message;
      button.style.transitionDelay = `${index * 70}ms`;
      button.addEventListener("click", () => {
        const isPressed = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!isPressed));
        button.setAttribute("aria-label", !isPressed ? `${card.title}: ${card.message}` : `${card.title}، اضغطي لقراءة الرسالة`);
      });
      grid.append(button);
    });
  }

  function renderGallery() {
    const gallery = $("#photoGallery");
    gallery.replaceChildren();
    const items = Array.isArray(config.gallery.images) ? config.gallery.images : [];
    if (items.length === 0) {
      const count = Math.max(3, Number(config.gallery.placeholderCount) || 3);
      for (let index = 0; index < count; index += 1) {
        const frame = document.createElement("div");
        frame.className = "photo-frame reveal";
        frame.setAttribute("aria-hidden", "true");
        const placeholder = document.createElement("span");
        placeholder.className = "photo-placeholder";
        const glint = document.createElement("i");
        glint.setAttribute("aria-hidden", "true");
        placeholder.append(glint);
        frame.append(placeholder);
        gallery.append(frame);
      }
      return;
    }

    items.forEach((item, index) => {
      const frame = document.createElement("div");
      frame.className = "photo-frame reveal";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photo-image-button";
      button.setAttribute("aria-label", config.gallery.imageAlt);
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt || config.gallery.imageAlt;
      image.loading = "lazy";
      image.decoding = "async";
      button.append(image);
      button.addEventListener("click", () => openPhoto(item.src, image.alt));
      frame.append(button);
      frame.style.transitionDelay = `${Math.min(index * 70, 350)}ms`;
      gallery.append(frame);
    });
    observeReveals(gallery);
  }

  function openPhoto(src, alt) {
    const dialog = $("#photoDialog");
    const expanded = $("#expandedPhoto");
    expanded.src = src;
    expanded.alt = alt;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    $("#closePhotoDialog").focus();
  }

  function closePhoto() {
    const dialog = $("#photoDialog");
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  function initializeGallery() {
    renderGallery();
    $("#closePhotoDialog").addEventListener("click", closePhoto);
    $("#photoDialog").addEventListener("click", (event) => {
      if (event.target === $("#photoDialog")) closePhoto();
    });
  }

  function calendarShift(date, months) {
    const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = ((totalMonths % 12) + 12) % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    return new Date(
      targetYear,
      targetMonth,
      Math.min(date.getDate(), lastDay),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    );
  }

  function updateCountdown() {
    const [year, month, day] = config.timeline.startDate.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const now = new Date();
    const values = [0, 0, 0, 0, 0, 0];

    if (now >= start) {
      let years = now.getFullYear() - start.getFullYear();
      if (calendarShift(start, years * 12) > now) years -= 1;
      let cursor = calendarShift(start, years * 12);
      let months = 0;
      while (months < 11 && calendarShift(cursor, months + 1) <= now) months += 1;
      cursor = calendarShift(cursor, months);
      let remainder = now.getTime() - cursor.getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const days = Math.floor(remainder / dayMs);
      remainder -= days * dayMs;
      const hours = Math.floor(remainder / (60 * 60 * 1000));
      remainder -= hours * 60 * 60 * 1000;
      const minutes = Math.floor(remainder / (60 * 1000));
      remainder -= minutes * 60 * 1000;
      const seconds = Math.floor(remainder / 1000);
      values.splice(0, values.length, years, months, days, hours, minutes, seconds);
    }

    values.forEach((value, index) => {
      const node = $(`[data-time-index="${index}"]`);
      if (node) node.textContent = arabicNumber.format(value);
    });
  }

  function initializeReasons() {
    const button = $("#discoverButton");
    button.addEventListener("click", () => {
      if (discoveredReasons >= config.reasons.phrases.length) return;
      const phrase = document.createElement("p");
      phrase.className = "reason-item";
      phrase.textContent = config.reasons.phrases[discoveredReasons];
      $("#reasonsList").append(phrase);
      discoveredReasons += 1;
      if (discoveredReasons === config.reasons.phrases.length) {
        button.disabled = true;
        button.setAttribute("aria-label", config.reasons.completeLabel);
      }
    });
  }

  function typeParagraph(element, text, speed = 24) {
    return new Promise((resolve) => {
      if (document.body.classList.contains("motion-off")) {
        element.textContent = text;
        resolve();
        return;
      }
      let index = 0;
      const step = () => {
        if (index >= text.length) {
          resolve();
          return;
        }
        const count = text[index] === " " ? 2 : 1;
        element.textContent += text.slice(index, index + count);
        index += count;
        window.setTimeout(step, speed);
      };
      step();
    });
  }

  async function openSecretLetter() {
    if (secretOpened) return;
    secretOpened = true;
    $("#envelopeScene").classList.add("is-open");
    $("#openSecretButton").setAttribute("aria-expanded", "true");
    $("#secretPaper").hidden = false;
    $("#openSecretButton").hidden = true;
    celebrate($("#secretPaper"));
    const copy = $("#secretCopy");
    for (const paragraph of config.secretLetter.paragraphs) {
      const p = document.createElement("p");
      copy.append(p);
      await typeParagraph(p, paragraph);
    }
  }

  function makeTone(context, frequency, start, duration, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playOpeningSound() {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const context = new AudioContextClass();
      const now = context.currentTime;
      makeTone(context, 523.25, now, .62, .045);
      makeTone(context, 659.25, now + .12, .68, .038);
      makeTone(context, 783.99, now + .26, .82, .03);
      window.setTimeout(() => context.close().catch(() => {}), 1500);
    } catch {
      // الصوت تحسين اختياري؛ بقية تجربة الدخول لا تعتمد عليه.
    }
  }

  function initializeGate(startBackgroundMusic) {
    const form = $("#passwordForm");
    const input = $("#passwordInput");
    const feedback = $("#passwordFeedback");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value === config.gate.password) {
        feedback.textContent = "";
        form.classList.remove("has-error");
        $("#enterButton").disabled = true;
        playOpeningSound();
        startBackgroundMusic.play();
        $("#entryScreen").classList.add("is-opening");
        window.setTimeout(() => {
          $("#entryScreen").hidden = true;
          const shell = $("#siteShell");
          shell.hidden = false;
          document.body.classList.add("is-unlocked");
          $("#musicDock").hidden = false;
          const firstReveal = $("#heroFirstLine");
          window.setTimeout(() => firstReveal.classList.add("is-visible"), 180);
          window.setTimeout(() => $("#heroSecondLine").classList.add("is-visible"), 520);
          window.setTimeout(() => $$(".hero-copy .reveal").forEach((node) => node.classList.add("is-visible")), 850);
          initializeObservers();
          updateProgress();
          updateParallax();
          $("#journeyButton").focus({ preventScroll: true });
        }, 780);
      } else {
        feedback.textContent = config.gate.incorrectMessage;
        form.classList.remove("has-error");
        void form.offsetWidth;
        form.classList.add("has-error");
        input.select();
      }
    });
  }

  function initializeMusic() {
    const audio = $("#backgroundMusic");
    const dock = $("#musicDock");
    const toggle = $("#musicToggle");
    const seek = $("#musicSeek");
    const durationLabel = $("#musicDuration");
    const currentTimeLabel = $("#musicCurrentTime");
    audio.volume = Number($("#musicVolume").value);
    if (config.music.source) audio.src = config.music.source;

    function formatTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
      const totalSeconds = Math.floor(seconds);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const remainder = totalSeconds % 60;
      const paddedSeconds = String(remainder).padStart(2, "0");
      return hours
        ? `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`
        : `${minutes}:${paddedSeconds}`;
    }

    function syncTimeline() {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      currentTimeLabel.textContent = formatTime(currentTime);
      durationLabel.textContent = formatTime(duration);
      seek.disabled = duration <= 0;
      if (duration > 0 && !seek.matches(":active")) {
        seek.value = String(Math.round((currentTime / duration) * Number(seek.max)));
      }
    }

    function syncState() {
      const playing = !audio.paused && !audio.ended;
      dock.classList.toggle("is-playing", playing);
      $("#musicStatus").textContent = playing ? config.music.statusPlaying : (audio.src ? config.music.statusPaused : config.music.statusMissing);
      toggle.setAttribute("aria-pressed", String(playing));
      toggle.setAttribute("aria-label", playing ? config.music.pauseLabel : config.music.playLabel);
      $("#musicToggleIcon").textContent = playing ? "Ⅱ" : "▶";
      syncTimeline();
    }

    function pauseMusic() {
      audio.pause();
      syncState();
    }

    async function playMusic() {
      if (!audio.src) {
        syncState();
        return;
      }
      try {
        await audio.play();
      } catch {
        syncState();
        $("#musicStatus").textContent = config.music.statusBlocked;
        return;
      }
      syncState();
    }

    function seekTo(targetTime) {
      if (!Number.isFinite(audio.duration)) return;
      const wasPlaying = !audio.paused && !audio.ended;
      audio.currentTime = Math.max(0, Math.min(audio.duration, targetTime));
      if (wasPlaying) audio.play().catch(() => {});
      syncState();
    }

    function seekBy(seconds) {
      seekTo(audio.currentTime + seconds);
    }

    toggle.addEventListener("click", async () => {
      if (audio.paused) await playMusic();
      else audio.pause();
      syncState();
    });
    $("#rewindMusic").addEventListener("click", () => seekBy(-10));
    $("#forwardMusic").addEventListener("click", () => seekBy(10));
    seek.addEventListener("input", () => {
      if (!Number.isFinite(audio.duration)) return;
      seekTo((Number(seek.value) / Number(seek.max)) * audio.duration);
    });
    $("#musicVolume").addEventListener("input", (event) => {
      audio.volume = Number(event.target.value);
    });
    audio.addEventListener("loadedmetadata", syncTimeline);
    audio.addEventListener("durationchange", syncTimeline);
    audio.addEventListener("timeupdate", syncTimeline);
    audio.addEventListener("play", syncState);
    audio.addEventListener("pause", syncState);
    audio.addEventListener("ended", syncState);
    audio.addEventListener("error", syncState);
    syncState();
    return {
      play: playMusic,
      pause: pauseMusic,
      isPlaying: () => !audio.paused && !audio.ended
    };
  }

  function initializeVideo(music) {
    const section = $("#video-moment");
    const video = $("#giftVideo");
    const musicDock = $("#musicDock");
    let active = false;
    let resumeMusic = false;

    video.src = config.video.source;

    async function playVideo() {
      try {
        await video.play();
      } catch (error) {
        console.warn("تعذر تشغيل الفيديو تلقائيًا؛ يمكن تشغيله من أدوات الفيديو.", error);
      }
    }

    function enterVideoSection() {
      if (active) return;
      active = true;
      resumeMusic = music.isPlaying();
      music.pause();
      playVideo();
    }

    function leaveVideoSection() {
      if (!active) return;
      active = false;
      video.pause();
      if (resumeMusic) music.play();
      resumeMusic = false;
    }

    video.addEventListener("playing", () => {
      if (active) musicDock.hidden = true;
    });
    video.addEventListener("pause", () => {
      musicDock.hidden = false;
    });
    video.addEventListener("ended", () => {
      musicDock.hidden = false;
      if (active && resumeMusic) {
        music.play();
        resumeMusic = false;
      }
    });

    if ("IntersectionObserver" in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) enterVideoSection();
          else leaveVideoSection();
        });
      }, { rootMargin: "120px 0px", threshold: 0.1 });
      videoObserver.observe(section);
    }
  }

  function initializeWorldJourney() {
    const section = $("#world-journey");
    const scene = $("#journeyScene");
    const mapLayer = $("#journeyMap");
    const connectors = $("#countryConnectors");
    const zodiacLayer = $("#journeyZodiac");
    const royalLayer = $("#royalScene");
    const finaleLayer = $("#journeyFinale");
    const cancerButton = $("#cancerButton");
    const capricornButton = $("#capricornButton");
    const cancerMessage = $("#cancerMessage");
    const capricornMessage = $("#capricornMessage");
    let started = false;
    let cancerSelected = false;
    let capricornSelected = false;
    let mapZoomActivated = false;

    setText("#countryEgypt", config.worldJourney.egypt);
    setText("#countrySyria", config.worldJourney.syria);
    setText("#countryTurkey", config.worldJourney.turkey);
    setText("#cancerName", config.worldJourney.cancer);
    setText("#capricornName", config.worldJourney.capricorn);
    setText("#journeyFinalText", config.worldJourney.finale);
    cancerButton.setAttribute("aria-label", config.worldJourney.cancerButtonLabel);
    capricornButton.setAttribute("aria-label", config.worldJourney.capricornButtonLabel);
    mapLayer.setAttribute("role", "button");
    mapLayer.setAttribute("tabindex", "0");
    mapLayer.setAttribute("aria-label", "تكبير خريطة الرحلة");

    const countryConnectors = [
      { pin: $("#mapPinTurkey"), label: $("#countryTurkey"), path: $("#countryLineTurkey"), dot: $("#countryLineDotTurkey") },
      { pin: $("#mapPinSyria"), label: $("#countrySyria"), path: $("#countryLineSyria"), dot: $("#countryLineDotSyria") },
      { pin: $("#mapPinEgypt"), label: $("#countryEgypt"), path: $("#countryLineEgypt"), dot: $("#countryLineDotEgypt") }
    ];

    function updateCountryConnectors() {
      if (!scene.classList.contains("is-map")) return;

      const sceneBounds = scene.getBoundingClientRect();
      const width = Math.max(sceneBounds.width, 1);
      const height = Math.max(sceneBounds.height, 1);
      connectors.setAttribute("viewBox", `0 0 ${width} ${height}`);

      countryConnectors.forEach(({ pin, label, path, dot }) => {
        const pinBounds = pin.getBoundingClientRect();
        const labelBounds = label.getBoundingClientRect();
        const startX = pinBounds.left + pinBounds.width / 2 - sceneBounds.left;
        const startY = pinBounds.top + pinBounds.height / 2 - sceneBounds.top;
        const centerX = labelBounds.left + labelBounds.width / 2 - sceneBounds.left;
        const centerY = labelBounds.top + labelBounds.height / 2 - sceneBounds.top;
        const deltaX = centerX - startX;
        const deltaY = centerY - startY;
        const edgeRatio = Math.min(
          (labelBounds.width / 2) / Math.max(Math.abs(deltaX), 1),
          (labelBounds.height / 2) / Math.max(Math.abs(deltaY), 1)
        );
        const endX = centerX - deltaX * edgeRatio;
        const endY = centerY - deltaY * edgeRatio;
        const controlOneX = startX + (endX - startX) * 0.42;
        const controlTwoX = endX - (endX - startX) * 0.2;

        path.setAttribute("d", `M${startX.toFixed(1)} ${startY.toFixed(1)} C${controlOneX.toFixed(1)} ${startY.toFixed(1)}, ${controlTwoX.toFixed(1)} ${endY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`);
        dot.setAttribute("cx", startX.toFixed(1));
        dot.setAttribute("cy", startY.toFixed(1));
      });
    }

    function followMapZoom() {
      const startedAt = performance.now();
      function updateFrame(now) {
        if (!scene.classList.contains("is-map")) return;
        updateCountryConnectors();
        if (now - startedAt < 7600) window.requestAnimationFrame(updateFrame);
      }
      window.requestAnimationFrame(updateFrame);
    }

    window.addEventListener("resize", updateCountryConnectors, { passive: true });

    function setLayerAvailable(layer, available) {
      layer.setAttribute("aria-hidden", String(!available));
      layer.inert = !available;
    }

    function showZodiac() {
      scene.classList.remove("is-map", "is-map-zoomed", "is-labels-visible");
      scene.classList.add("is-zodiac");
      setLayerAvailable(mapLayer, false);
      setLayerAvailable(zodiacLayer, true);
      cancerButton.disabled = false;
      capricornButton.disabled = false;
    }

    function startKnightWalk() {
      if (reducedBySystem) return;
      const art = royalLayer.querySelector(".knight-art");
      if (!art) return;
      const duration = 6000;
      const step = document.body.classList.contains("performance-lite") ? 240 : 120;
      const swing = (selector, amplitude, phase) => {
        const element = art.querySelector(selector);
        if (!element) return;
        const frames = [];
        for (let t = 0; t <= duration; t += step) {
          const angle = (t / 750) * Math.PI * 2 + phase;
          frames.push({ transform: `rotate(${(Math.sin(angle) * amplitude).toFixed(2)}deg)` });
        }
        element.animate(frames, { duration, easing: "linear", fill: "forwards" });
      };
      swing(".k-thigh--front", -20, 0);
      swing(".k-thigh--back", 20, Math.PI);
      swing(".k-shin--front", 12, Math.PI);
      swing(".k-shin--back", -12, 0);
      swing(".k-uarm--front", 8, Math.PI);
      swing(".k-farm--front", 6, Math.PI);
      swing(".k-uarm--back", -6, 0);
      swing(".k-farm--back", -5, Math.PI);
      swing(".k-head", 2.5, Math.PI);
      const body = art.querySelector(".k-body");
      if (body) {
        const frames = [];
        for (let t = 0; t <= duration; t += step) {
          const bounce = Math.abs(Math.sin((t / 375) * Math.PI * 2));
          frames.push({ transform: `translateY(${(-bounce * 4).toFixed(2)}px)` });
        }
        body.animate(frames, { duration, easing: "linear", fill: "forwards" });
      }
      const cape = art.querySelector(".k-cape");
      if (cape) {
        const frames = [];
        for (let t = 0; t <= duration; t += step) {
          frames.push({ transform: `rotate(${(Math.sin((t / 1500) * Math.PI * 2) * 5).toFixed(2)}deg)` });
        }
        cape.animate(frames, { duration, easing: "linear", fill: "forwards" });
      }
    }

    function showRoyalScene() {
      scene.classList.remove("is-zodiac", "is-cancer-selected");
      scene.classList.add("is-royal");
      setLayerAvailable(zodiacLayer, false);
      setLayerAvailable(royalLayer, true);
      startKnightWalk();
      const fast = reducedBySystem;
      window.setTimeout(() => royalLayer.classList.add("phase-kneel"), fast ? 500 : 6400);
      window.setTimeout(() => royalLayer.classList.add("phase-offer"), fast ? 900 : 8100);
      window.setTimeout(() => {
        royalLayer.classList.add("phase-kiss");
        royalLayer.classList.add("is-blushed");
      }, fast ? 1500 : 9500);
      window.setTimeout(() => royalLayer.classList.add("phase-rise"), fast ? 2400 : 11800);
      window.setTimeout(() => {
        royalLayer.classList.remove("phase-kneel", "phase-offer", "phase-kiss", "phase-rise");
      }, fast ? 3200 : 13800);
      window.setTimeout(() => {
        scene.classList.add("is-finale");
        setLayerAvailable(finaleLayer, true);
      }, fast ? 4200 : 15200);
    }

    function activateMapZoom() {
      if (mapZoomActivated || !scene.classList.contains("is-map")) return;
      mapZoomActivated = true;
      scene.classList.add("is-map-zoomed");
      followMapZoom();
      window.setTimeout(() => {
        scene.classList.add("is-labels-visible");
        updateCountryConnectors();
      }, reducedBySystem ? 180 : 2400);
      window.setTimeout(showZodiac, reducedBySystem ? 1200 : 10500);
    }

    function startJourney() {
      if (started) return;
      started = true;
      scene.classList.add("is-map");
      setLayerAvailable(mapLayer, true);
      mapLayer.addEventListener("click", activateMapZoom, { once: true });
      mapLayer.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateMapZoom();
        }
      });
    }

    cancerButton.addEventListener("click", () => {
      if (cancerSelected || !scene.classList.contains("is-zodiac")) return;
      cancerSelected = true;
      cancerButton.setAttribute("aria-pressed", "true");
      cancerMessage.textContent = config.worldJourney.cancerMessage;
      cancerMessage.hidden = false;
      scene.classList.add("is-cancer-selected");
      window.setTimeout(showRoyalScene, reducedBySystem ? 1800 : 5200);
    });

    capricornButton.addEventListener("click", () => {
      if (capricornSelected || !scene.classList.contains("is-zodiac")) return;
      capricornSelected = true;
      capricornButton.setAttribute("aria-pressed", "true");
      capricornMessage.textContent = config.worldJourney.capricornMessage;
      capricornMessage.hidden = false;
      scene.classList.add("is-capricorn-selected");
    });

    if ("IntersectionObserver" in window) {
      const journeyObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        startJourney();
      }, { threshold: 0.18, rootMargin: "80px 0px" });
      journeyObserver.observe(section);
    } else {
      startJourney();
    }
  }

  function initializePerformanceMode() {
    const memory = Number(window.navigator.deviceMemory);
    const cores = Number(window.navigator.hardwareConcurrency);
    const lowMemory = Number.isFinite(memory) && memory > 0 && memory <= 2;
    const lowCoreCount = Number.isFinite(cores) && cores > 0 && cores <= 4;
    document.body.classList.toggle("performance-lite", lowMemory || lowCoreCount);
  }

  function initializeRoyalDepth() {
    if (reducedBySystem || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const stage = $("#journeyScene");
    const royal = $("#royalScene");
    let frame = 0;
    let pointer = null;

    function resetDepth() {
      pointer = null;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      ["--camera-x", "--camera-y", "--camera-x-far", "--camera-y-far", "--camera-x-near", "--camera-y-near"].forEach((name) => {
        royal.style.setProperty(name, "0px");
      });
    }

    function applyDepth() {
      frame = 0;
      if (!pointer || document.body.classList.contains("performance-lite")) return;
      const bounds = stage.getBoundingClientRect();
      const x = (pointer.x - bounds.left) / Math.max(bounds.width, 1) - 0.5;
      const y = (pointer.y - bounds.top) / Math.max(bounds.height, 1) - 0.5;
      const moveX = x * 14;
      const moveY = y * 10;
      royal.style.setProperty("--camera-x", `${moveX.toFixed(1)}px`);
      royal.style.setProperty("--camera-y", `${moveY.toFixed(1)}px`);
      royal.style.setProperty("--camera-x-far", `${(moveX * 0.42).toFixed(1)}px`);
      royal.style.setProperty("--camera-y-far", `${(moveY * 0.42).toFixed(1)}px`);
      royal.style.setProperty("--camera-x-near", `${(moveX * -0.32).toFixed(1)}px`);
      royal.style.setProperty("--camera-y-near", `${(moveY * -0.32).toFixed(1)}px`);
    }

    stage.addEventListener("pointermove", (event) => {
      if (!stage.classList.contains("is-royal") || document.body.classList.contains("performance-lite")) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(applyDepth);
    }, { passive: true });
    stage.addEventListener("pointerleave", resetDepth, { passive: true });
  }

  function initializeMotionPreference() {
    const motionOff = reducedBySystem;
    document.body.classList.toggle("motion-off", motionOff);
    document.documentElement.classList.toggle("allow-motion", !motionOff);
  }

  function initializeStarWorld() {
    const sky = $("#starWorldSky");
    for (let index = 0; index < 64; index += 1) {
      const star = document.createElement("span");
      star.className = "world-star";
      star.textContent = index % 5 === 0 ? "✧" : "·";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty("--size", `${4 + Math.random() * 11}px`);
      star.style.setProperty("--duration", `${2.5 + Math.random() * 4}s`);
      star.style.setProperty("--delay", `${Math.random() * 3}s`);
      sky.append(star);
    }
    const button = $("#mainStarButton");
    button.addEventListener("click", () => {
      const world = $("#star-world");
      world.classList.add("is-awake");
      const message = $("#starMessage");
      message.hidden = false;
      message.textContent = config.stars.message;
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", config.stars.message);
      celebrate(button);
    });
  }

  function initializeAmbient() {
    const starContainer = $("#ambientStars");
    const floaters = $("#ambientFloaters");
    for (let index = 0; index < 45; index += 1) {
      const star = document.createElement("span");
      star.className = "ambient-star";
      star.textContent = index % 7 === 0 ? "✧" : "·";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty("--size", `${3 + Math.random() * 9}px`);
      star.style.setProperty("--duration", `${3 + Math.random() * 5}s`);
      star.style.setProperty("--delay", `${Math.random() * 5}s`);
      starContainer.append(star);
    }
    for (let index = 0; index < 7; index += 1) {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.textContent = "♥";
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.setProperty("--size", `${8 + Math.random() * 10}px`);
      heart.style.setProperty("--duration", `${14 + Math.random() * 12}s`);
      heart.style.setProperty("--delay", `${-Math.random() * 25}s`);
      heart.style.setProperty("--drift", `${-45 + Math.random() * 90}px`);
      floaters.append(heart);
    }
    for (let index = 0; index < 6; index += 1) {
      const petal = document.createElement("span");
      petal.className = "floating-petal";
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty("--duration", `${17 + Math.random() * 14}s`);
      petal.style.setProperty("--delay", `${-Math.random() * 30}s`);
      petal.style.setProperty("--drift", `${-70 + Math.random() * 140}px`);
      floaters.append(petal);
    }
  }

  function celebrate(origin = $("#mainStarButton")) {
    if (document.body.classList.contains("motion-off")) return;
    const bounds = origin.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    for (let index = 0; index < 14; index += 1) {
      const particle = document.createElement("span");
      const isHeart = index % 2 === 0;
      particle.className = `celebration-particle ${isHeart ? "celebration-heart" : "celebration-star"}`;
      particle.textContent = isHeart ? "♥" : "✦";
      particle.style.left = `${centerX + (Math.random() - .5) * 22}px`;
      particle.style.top = `${centerY + (Math.random() - .5) * 22}px`;
      particle.style.setProperty("--drift-x", `${(Math.random() - .5) * 210}px`);
      particle.style.setProperty("--drift-y", `${-50 - Math.random() * 140}px`);
      particle.style.setProperty("--duration", `${1.8 + Math.random() * .8}s`);
      document.body.append(particle);
      window.setTimeout(() => particle.remove(), 2800);
    }
  }

  let revealObserver;
  function observeReveals(root = document) {
    const unrevealed = $$(".reveal:not(.is-visible)", root);
    if (reducedBySystem || !("IntersectionObserver" in window)) {
      unrevealed.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    }
    unrevealed.forEach((element) => revealObserver.observe(element));
  }

  function initializeObservers() {
    observeReveals();
  }

  function updateParallax() {
    const sky = $("#heroSky");
    if (!sky) return;
    if (document.body.classList.contains("motion-off")) {
      sky.style.setProperty("--parallax-y", "0px");
      return;
    }
    if (parallaxFrame) return;
    parallaxFrame = window.requestAnimationFrame(() => {
      if (document.body.classList.contains("motion-off")) {
        sky.style.setProperty("--parallax-y", "0px");
        parallaxFrame = 0;
        return;
      }
      const hero = $("#intro");
      const offset = Math.max(-24, Math.min(24, -hero.getBoundingClientRect().top * .035));
      sky.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
      parallaxFrame = 0;
    });
  }

  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable <= 0 ? 0 : Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
    $("#readingProgressFill").style.width = `${progress}%`;
    $("#readingProgress").setAttribute("aria-valuenow", String(Math.round(progress)));
  }

  function initializeControls() {
    $("#backToTopButton").addEventListener("click", () => window.scrollTo({ top: 0, behavior: document.body.classList.contains("motion-off") ? "auto" : "smooth" }));
    $("#journeyButton").addEventListener("click", (event) => {
      event.preventDefault();
      $("#gallery").scrollIntoView({ behavior: document.body.classList.contains("motion-off") ? "auto" : "smooth" });
    });
    $("#openSecretButton").addEventListener("click", openSecretLetter);
    $("#discoverButton").setAttribute("aria-label", config.reasons.buttonLabel);
    $("#passwordInput").setAttribute("aria-label", config.gate.inputLabel);
    $("#passwordInput").setAttribute("placeholder", config.gate.inputPlaceholder);
    $("#backgroundMusic").volume = Number($("#musicVolume").value);
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    window.addEventListener("scroll", updateParallax, { passive: true });
    window.addEventListener("resize", updateParallax, { passive: true });
  }

  function initialize() {
    populateContent();
    initializeGallery();
    initializeReasons();
    const startBackgroundMusic = initializeMusic();
    initializeGate(startBackgroundMusic);
    initializeVideo(startBackgroundMusic);
    initializeWorldJourney();
    initializeMotionPreference();
    initializePerformanceMode();
    initializeRoyalDepth();
    initializeStarWorld();
    initializeAmbient();
    initializeControls();
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
    window.setTimeout(() => $("#pageLoader").classList.add("is-gone"), 450);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
