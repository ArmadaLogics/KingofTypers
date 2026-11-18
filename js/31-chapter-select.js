(() => {
  "use strict";

  const root = document.getElementById("chapter-selection");
  if (!root) return;

  const shell = root.querySelector(".kw-shell");
  const gallery = root.querySelector(".kw-gallery");
  const caption = root.querySelector(".kw-caption");
  const count = root.querySelector(".kw-index");
  const enter = root.querySelector(".kw-enter");
  const previous = root.querySelector('[data-direction="-1"]');
  const next = root.querySelector('[data-direction="1"]');
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const palette = {
    I:    ["The Minotaur",       "assets/chapter-select/minotaur.webp",    "#819d78", "#354b38"],
    II:   ["The Black Gate Turtle", "assets/chapter-select/turtle.webp", "#c58450", "#653c27"],
    III:  ["The Blightmother",    "assets/chapter-select/blightmother.webp", "#879761", "#3b4930"],
    IV:   ["The Shaman",          "assets/chapter-select/shaman.webp",     "#727087", "#303d58"],
    V:    ["The Skull",           "assets/chapter-select/skull.webp",      "#b87d4f", "#483430"],
    VI:   ["The Lizard",          "assets/chapter-select/lizard.webp",     "#638f83", "#234637"],
    VII:  ["The Gatehouse Reaper","assets/chapter-select/reaper.webp",     "#738391", "#364346"],
    VIII: ["The Troll Marshal",  "assets/chapter-select/marshal.webp",    "#a68963", "#483932"]
  };
  const chapters = CHDEF.map(({key, name}) => {
    const [boss, art, light, deep] = palette[key] || [];
    return {key, name: name.replace(/^The /i,""), boss, art, light, deep};
  });
  const maximumStars = NSTAGE * STAGE_STAR_MAX;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const twoDigits = value => String(value).padStart(2,"0");
  let current = 0;
  let gesture = null;
  let suppressClickUntil = 0;
  let revealTimer = 0;
  let revealTarget = -1;
  let maskedChapter = -1;

  const cards = chapters.map((chapter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kw-card";
    button.style.setProperty("--light", chapter.light || "#879761");
    button.style.setProperty("--deep", chapter.deep || "#3b4930");
    button.innerHTML = `
      <span class="kw-frame">
        <span class="kw-art"></span>
        <span class="kw-lock" aria-hidden="true"><span></span></span>
        <span class="kw-new" aria-hidden="true">NEW</span>
        <span class="kw-nameplate">
          <span class="kw-chapter"></span>
          <span class="kw-name"></span>
          <span class="kw-stars" aria-hidden="true">
            <span class="kw-star-icon"></span>
            <span class="kw-star-count"></span>
          </span>
          <span class="kw-status"></span>
        </span>
        <span class="kw-reveal" aria-hidden="true"></span>
      </span>`;
    if (chapter.art) {
      const portrait = new Image();
      portrait.className = "kw-portrait";
      portrait.alt = "";
      portrait.draggable = false;
      portrait.decoding = "async";
      portrait.src = chapter.art;
      button.querySelector(".kw-art").append(portrait);
    }
    button.querySelector(".kw-chapter").textContent = "Chapter " + chapter.key;
    button.querySelector(".kw-name").textContent = chapter.name;
    button.addEventListener("click", () => select(index, true));
    gallery.append(button);
    return {button, badge:button.querySelector(".kw-stars"),
            stars:button.querySelector(".kw-star-count"), status:button.querySelector(".kw-status")};
  });

  function renderRail(position) {
    const width = shell.clientWidth;
    const visible = width <= 510 ? 1 : width <= 760 ? 3 : 5;
    const radius = Math.floor(visible / 2);
    const center = Math.round(position);
    gallery.style.setProperty("--slot-count", visible);
    gallery.style.setProperty("--keyward-chapter-halo", chapters[center].light || "#879761");
    for (const [index, {button}] of cards.entries()) {
      const slot = index - position;
      const distance = Math.abs(slot);
      button.style.setProperty("--slot", slot);
      button.style.setProperty("--scale", 1 + .11 * Math.max(0, 1 - distance));
      button.dataset.centered = index === center;
      button.dataset.inView = gesture?.dragging ? distance < radius + 1 : distance <= radius;
      button.inert = Math.abs(index - current) > radius;
    }
  }

  function locked(index) {
    return index === maskedChapter || !chapterIsOpen(index);
  }

  function render() {
    renderRail(gesture?.dragging ? gesture.position : current);
    for (const [index, card] of cards.entries()) {
      const progress = S.prog[index];
      const isLocked = locked(index);
      const cleared = progress.cleared >= NSTAGE;
      const isNew = !isLocked && progress.newlyUnlocked;
      const stars = (progress.stars || []).reduce((sum, stage) => sum + (stage || 0), 0);
      const label = isLocked ? "Locked" : cleared ? "Cleared" : progress.cleared + "/" + NSTAGE;
      card.button.dataset.state = isLocked ? "locked" : cleared ? "cleared" : isNew ? "new" : "open";
      card.button.setAttribute("aria-pressed", String(index === current));
      card.button.setAttribute("aria-label",
        `Chapter ${chapters[index].key}, ${chapters[index].name}, ${isNew ? "newly unlocked" : label}`
        + (isLocked ? "" : `, ${stars} of ${maximumStars} stars`));
      card.status.textContent = label;
      card.badge.hidden = isLocked;
      card.stars.textContent = stars + "/" + maximumStars;
    }
    const isLocked = locked(current);
    const boss = chapters[current].boss;
    const previousBoss = chapters[current - 1]?.boss;
    const requirement = previousBoss
      ? "Defeat " + previousBoss.replace(/^The /,"the ") + " to unlock."
      : "Clear the previous chapter to unlock.";
    const message = isLocked ? requirement : [S.prog[current].newlyUnlocked ? "Chapter unlocked" : "",boss].filter(Boolean).join(" · ");
    if (caption.textContent !== message) caption.textContent = message;
    count.textContent = twoDigits(current + 1) + " / " + twoDigits(chapters.length);
    const revealing = revealTarget >= 0;
    previous.disabled = revealing || current === 0;
    next.disabled = revealing || current === chapters.length - 1;
    const label = isLocked ? "Chapter locked" : "Enter chapter";
    if (!enter.textContent.startsWith(label)) {
      enter.innerHTML = isLocked ? label : 'Enter chapter <span aria-hidden="true">→</span>';
    }
    enter.disabled = isLocked || revealing;
  }

  function select(index, moveFocus = false) {
    if (revealTarget >= 0 || gesture?.dragging || index < 0 || index >= cards.length) return;
    if (index !== current) {
      current = index;
      render();
      blip(520,.03,"square",.05);
    }
    if (moveFocus) cards[current].button.focus({preventScroll:true});
  }

  function cancelGesture() {
    const pointerId = gesture?.id;
    gesture = null;
    gallery.classList.remove("kw-dragging");
    if (pointerId != null && gallery.hasPointerCapture(pointerId)) gallery.releasePointerCapture(pointerId);
  }

  function dismiss() {
    clearTimeout(revealTimer);
    gallery.querySelector(".kw-unlocking")?.classList.remove("kw-unlocking");
    revealTarget = -1;
    maskedChapter = -1;
    cancelGesture();
    root.close();
  }

  function back() {
    dismiss();
    closeSettings();
    cv.focus({preventScroll:true});
  }

  function enterSelected() {
    if (enter.disabled || !chapterIsOpen(current)) return;
    const index = current;
    ac();
    dismiss();
    enterChapter(index);
    cv.focus({preventScroll:true});
  }

  for (const button of [previous,next]) {
    button.addEventListener("click", () => {
      select(current + Number(button.dataset.direction));
      if (button.disabled) cards[current].button.focus({preventScroll:true});
    });
  }
  root.querySelector(".kw-main-menu").addEventListener("click", back);
  enter.addEventListener("click", enterSelected);
  root.addEventListener("cancel", event => {
    event.preventDefault();
    back();
  });
  root.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = {ArrowLeft:-1, ArrowUp:-1, ArrowRight:1, ArrowDown:1}[arrowOf(event)];
    if (direction) {
      event.preventDefault();
      select(current + direction, true);
    } else if (event.key === "Escape" || event.key === "Backspace") {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) back();
    } else if ((event.key === "Enter" || event.key === " ") && event.target.closest(".kw-card")) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) {
        const index = cards.findIndex(card => card.button === event.target);
        if (index >= 0 && index !== current) select(index, true);
        else enterSelected();
      }
    }
  });

  gallery.addEventListener("pointerdown", event => {
    if (revealTarget >= 0 || gesture || !event.isPrimary || event.button !== 0) return;
    suppressClickUntil = 0;
    const frame = gallery.getBoundingClientRect();
    const button = cards[current].button;
    const rect = button.getBoundingClientRect();
    const pitch = button.offsetWidth + parseFloat(getComputedStyle(gallery).columnGap);
    const displacement = rect.left + rect.width / 2 - (frame.left + frame.width / 2);
    gesture = {id:event.pointerId, x:event.clientX, y:event.clientY, pitch,
      start:current - displacement / pitch, position:current, dragging:false,
      samples:[{x:event.clientX, time:event.timeStamp}]};
  });

  gallery.addEventListener("pointermove", event => {
    if (event.pointerId !== gesture?.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.dragging) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture = null;
        return;
      }
      gesture.dragging = true;
      gallery.setPointerCapture(event.pointerId);
      gallery.classList.add("kw-dragging");
    }
    gesture.position = clamp(gesture.start - dx / gesture.pitch, 0, cards.length - 1);
    gesture.samples.push({x:event.clientX, time:event.timeStamp});
    gesture.samples = gesture.samples.filter(sample => event.timeStamp - sample.time < 100);
    renderRail(gesture.position);
  });

  function finishGesture(event) {
    if (event.pointerId !== gesture?.id) return;
    const completed = gesture;
    gesture = null;
    if (!completed.dragging) return;
    suppressClickUntil = performance.now() + 350;
    const sample = completed.samples.find(point => event.timeStamp - point.time < 100);
    const elapsed = sample ? event.timeStamp - sample.time : 0;
    const velocity = elapsed > 0 ? (sample.x - event.clientX) / elapsed : 0;
    const coast = motion.matches ? 0 : clamp(velocity * 140 / completed.pitch, -1.5, 1.5);
    gallery.classList.remove("kw-dragging");
    if (event.type === "pointerup") current = clamp(Math.round(completed.position + coast), 0, cards.length - 1);
    render();
    if (event.type === "pointerup") cards[current].button.focus({preventScroll:true});
  }
  gallery.addEventListener("pointerup", finishGesture);
  gallery.addEventListener("pointercancel", finishGesture);
  gallery.addEventListener("lostpointercapture", event => {
    if (event.target === gallery) finishGesture(event);
  });
  gallery.addEventListener("pointerleave", event => {
    if (event.pointerId === gesture?.id && !gesture.dragging) gesture = null;
  });
  gallery.addEventListener("click", event => {
    if (event.detail && performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  function playUnlock(index) {
    // The saved chapter is already open. Mask its portrait until the slide lands.
    revealTimer = setTimeout(() => {
      current = index;
      render();
      cards[index].button.focus({preventScroll:true});
      revealTimer = setTimeout(() => {
        maskedChapter = -1;
        revealTarget = -1;
        cards[index].button.classList.add("kw-unlocking");
        render();
      }, 490);
    }, 100);
  }
  gallery.addEventListener("animationend", event => {
    if (event.animationName === "kw-unlock-sweep") event.target.closest(".kw-card").classList.remove("kw-unlocking");
  });

  new ResizeObserver(() => {
    if (root.open) renderRail(gesture?.dragging ? gesture.position : current);
  }).observe(shell);
  window.ChapterSelector = {
    isOpen: () => root.open,
    open(index, reveal) {
      if (root.open) return;
      const animate = reveal && index > 0 && !motion.matches;
      revealTarget = maskedChapter = animate ? index : -1;
      current = animate ? index - 1 : index;
      root.classList.remove("kw-ready");
      root.showModal();
      root.scrollTop = 0;
      render();
      cards[current].button.focus({preventScroll:true});
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("kw-ready")));
      if (animate) playUnlock(index);
    }
  };
})();
