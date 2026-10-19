const RATING_LABELS = {
  1: "1 Star — Poor",
  2: "2 Stars — Fair",
  3: "3 Stars — Good",
  4: "4 Stars — Very Good",
  5: "5 Stars — Excellent",
};

let committedRating = 0;
let hoverPreviewRating = 0;
let activeFilter = "all";
let currentSearchTerm = "";

const INITIAL_REVIEWS = [
  {
    id: "rev-1",
    name: "Devon Lane",
    rating: 5,
    review:
      "The design system tokens and micro-interactions make this rating experience feel like a genuine enterprise product.",
    date: "2 days ago",
    upvotes: 14,
  },
  {
    id: "rev-2",
    name: "Elena Rostova",
    rating: 5,
    review:
      "The live CSAT telemetry updates seamlessly upon submitting feedback. Beautiful Swiss-poster aesthetic!",
    date: "3 days ago",
    upvotes: 9,
  },
  {
    id: "rev-3",
    name: "Marcus Vance",
    rating: 4,
    review:
      "Great accessibility and clear keyboard focus states. Very Good performance across all viewports.",
    date: "1 week ago",
    upvotes: 6,
  },
];

let allReviews = [];

// Audio Engine
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSynthesizerChime(
  freq,
  startTime,
  duration = 0.25,
  type = "triangle",
  gainLevel = 0.12,
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (e) {}
}

function playCelebrationFanfare() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playSynthesizerChime(523.25, now + 0.0, 0.22, "triangle", 0.15);
    playSynthesizerChime(659.25, now + 0.07, 0.22, "triangle", 0.15);
    playSynthesizerChime(783.99, now + 0.14, 0.25, "triangle", 0.18);
    playSynthesizerChime(987.77, now + 0.21, 0.28, "sine", 0.2);
    playSynthesizerChime(1046.5, now + 0.28, 0.55, "sine", 0.22);
    playSynthesizerChime(1318.51, now + 0.35, 0.65, "sine", 0.18);
    playSynthesizerChime(130.81, now, 0.25, "sine", 0.25);
  } catch (err) {}
}

function triggerCelebrationBlast(originX = 0.5, originY = 0.5) {
  playCelebrationFanfare();
  createBlastWaveRing(
    window.innerWidth * originX,
    window.innerHeight * originY,
  );

  if (typeof confetti === "function") {
    const tokenColors = ["#cbf916", "#2244e8", "#ffffff", "#ffd700", "#211922"];

    confetti({
      particleCount: 110,
      spread: 85,
      startVelocity: 55,
      origin: { x: originX, y: originY },
      colors: tokenColors,
      gravity: 1.1,
      scalar: 1.15,
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        startVelocity: 48,
        origin: { x: 0.15, y: originY },
        colors: ["#cbf916", "#2244e8", "#ffffff"],
      });
    }, 120);

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        startVelocity: 48,
        origin: { x: 0.85, y: originY },
        colors: ["#cbf916", "#2244e8", "#ffffff"],
      });
    }, 220);

    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 120,
        origin: { x: originX, y: Math.max(0.1, originY - 0.2) },
        shapes: ["star", "circle"],
        colors: ["#cbf916", "#ffffff"],
        scalar: 1.3,
      });
    }, 340);
  }

  showToast("Respect & Cheer Blast Activated! 🎉", "★");
}

function createBlastWaveRing(x, y) {
  const wave = document.createElement("div");
  wave.className = "blast-wave";
  wave.style.left = `${x}px`;
  wave.style.top = `${y}px`;
  wave.style.width = "120px";
  wave.style.height = "120px";
  document.body.appendChild(wave);
  setTimeout(() => wave.remove(), 750);
}

let toastTimeout;
function showToast(message, icon = "✨") {
  const toast = document.getElementById("toastBox");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");
  if (!toast || !toastMsg) return;

  clearTimeout(toastTimeout);
  toastMsg.textContent = message;
  if (toastIcon) toastIcon.textContent = icon;

  toast.classList.remove("opacity-0", "pointer-events-none", "-translate-y-2");
  toast.classList.add("opacity-100", "translate-y-0");

  toastTimeout = setTimeout(() => {
    toast.classList.add("opacity-0", "pointer-events-none", "-translate-y-2");
    toast.classList.remove("opacity-100", "translate-y-0");
  }, 2600);
}

function initStarRatingWidget() {
  const starButtons = document.querySelectorAll(".star-btn");
  const starGroup = document.getElementById("starGroup");
  const ratingTextDisplay = document.getElementById("ratingTextDisplay");
  const ratingScorePill = document.getElementById("ratingScorePill");
  const resetRatingBtn = document.getElementById("resetRatingBtn");

  function updateStarVisuals(activeVal) {
    starButtons.forEach((btn) => {
      const val = parseInt(btn.getAttribute("data-value"), 10);
      const icon = btn.querySelector(".star-icon");

      if (val <= activeVal) {
        icon.classList.remove(
          "fill-neutral-300",
          "dark:fill-zinc-700",
          "stroke-black",
          "dark:stroke-zinc-500",
        );
        icon.classList.add("fill-brand-acid", "stroke-black");
        btn.setAttribute("aria-checked", val === activeVal ? "true" : "false");
      } else {
        icon.classList.remove("fill-brand-acid");
        icon.classList.add(
          "fill-neutral-300",
          "dark:fill-zinc-700",
          "stroke-black",
          "dark:stroke-zinc-500",
        );
        btn.setAttribute("aria-checked", "false");
      }
    });

    if (activeVal > 0) {
      if (ratingTextDisplay)
        ratingTextDisplay.textContent = RATING_LABELS[activeVal];
      if (ratingScorePill) {
        ratingScorePill.textContent = `${activeVal} / 5`;
        ratingScorePill.className =
          "text-xs font-mono font-bold px-3 py-1.5 rounded-pill bg-brand-acid text-black border border-black";
      }
    } else {
      if (ratingTextDisplay)
        ratingTextDisplay.textContent = "No rating selected";
      if (ratingScorePill) {
        ratingScorePill.textContent = "0 / 5";
        ratingScorePill.className =
          "text-xs font-mono font-bold px-3 py-1.5 rounded-pill bg-brand-surfaceStrong dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300";
      }
    }

    updateEmojiSync(activeVal);
  }

  starButtons.forEach((btn) => {
    const val = parseInt(btn.getAttribute("data-value"), 10);

    btn.addEventListener("mouseenter", () => {
      hoverPreviewRating = val;
      updateStarVisuals(val);
    });

    btn.addEventListener("focus", () => {
      hoverPreviewRating = val;
      updateStarVisuals(val);
    });

    btn.addEventListener("click", () => {
      committedRating = val;
      updateStarVisuals(committedRating);
      showToast(`Rating Locked: ${val} Stars!`, "★");
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        committedRating = val;
        updateStarVisuals(committedRating);
        showToast(`Rating Locked: ${val} Stars!`, "★");
      }
    });
  });

  if (starGroup) {
    starGroup.addEventListener("mouseleave", () => {
      hoverPreviewRating = 0;
      updateStarVisuals(committedRating);
    });
  }

  if (resetRatingBtn) {
    resetRatingBtn.addEventListener("click", () => {
      committedRating = 0;
      hoverPreviewRating = 0;
      updateStarVisuals(0);
      showToast("Rating reset", "↺");
    });
  }
}

function updateEmojiSync(activeVal) {
  document.querySelectorAll(".emoji-btn").forEach((btn) => {
    const val = parseInt(btn.getAttribute("data-val"), 10);
    if (val === activeVal) {
      btn.classList.add("bg-brand-acid", "scale-125", "border", "border-black");
    } else {
      btn.classList.remove(
        "bg-brand-acid",
        "scale-125",
        "border",
        "border-black",
      );
    }
  });
}

function initEmojiSync() {
  document.querySelectorAll(".emoji-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.getAttribute("data-val"), 10);
      committedRating = val;
      const starBtn = document.querySelector(`.star-btn[data-value="${val}"]`);
      if (starBtn) starBtn.click();
    });
  });
}

const aspectScores = { ui: 5, speed: 5, design: 5, features: 5, a11y: 5 };

function initAspectRatings() {
  const aspectCards = document.querySelectorAll(".aspect-card");

  aspectCards.forEach((card) => {
    const starGroup = card.querySelector(".aspect-stars");
    if (!starGroup) return;
    const category = starGroup.getAttribute("data-category");
    const stars = starGroup.querySelectorAll(".aspect-star");
    const valDisplay = card.querySelector(".aspect-val");

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        const val = parseInt(star.getAttribute("data-val"), 10);
        aspectScores[category] = val;
        if (valDisplay) valDisplay.textContent = `${val.toFixed(1)} / 5`;

        stars.forEach((s) => {
          const sVal = parseInt(s.getAttribute("data-val"), 10);
          if (sVal <= val) {
            s.className = "aspect-star text-brand-acid";
          } else {
            s.className = "aspect-star text-neutral-300 dark:text-zinc-700";
          }
        });

        const vals = Object.values(aspectScores);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const avgScoreEl = document.getElementById("aspectAverageScore");
        if (avgScoreEl) avgScoreEl.textContent = `${avg.toFixed(1)} / 5.0`;
      });
    });
  });
}

function initReviewForm() {
  const form = document.getElementById("feedbackForm");
  const nameInput = document.getElementById("userNameInput");
  const reviewInput = document.getElementById("userReviewInput");
  const charCount = document.getElementById("charCount");
  const feedbackMsg = document.getElementById("formFeedbackMsg");
  const clearBtn = document.getElementById("clearFormBtn");

  if (!form) return;

  if (reviewInput && charCount) {
    reviewInput.addEventListener("input", () => {
      const len = reviewInput.value.length;
      charCount.textContent = `${len} / 300`;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      form.reset();
      if (charCount) charCount.textContent = "0 / 300";
      if (feedbackMsg) feedbackMsg.classList.add("hidden");
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (committedRating === 0) {
      if (feedbackMsg) {
        feedbackMsg.className =
          "text-xs font-mono font-bold p-3 rounded-xs bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200 block";
        feedbackMsg.textContent =
          "Please select a star rating from 1 to 5 before submitting.";
      }
      return;
    }

    const name =
      (nameInput && nameInput.value.trim()) || "Anonymous Contributor";
    const text =
      (reviewInput && reviewInput.value.trim()) ||
      `Rated ${committedRating} stars with positive experience.`;

    const newReview = {
      id: `rev-${Date.now()}`,
      name: name,
      rating: committedRating,
      review: text,
      date: "Just now",
      upvotes: 1,
    };

    allReviews.unshift(newReview);
    saveReviewsToStorage();
    renderReviews();
    updateAnalyticsDashboard();

    const submitBtn = document.getElementById("submitReviewBtn");
    if (submitBtn) {
      const submitBtnRect = submitBtn.getBoundingClientRect();
      triggerCelebrationBlast(
        (submitBtnRect.left + submitBtnRect.width / 2) / window.innerWidth,
        (submitBtnRect.top + submitBtnRect.height / 2) / window.innerHeight,
      );
    }

    if (feedbackMsg) {
      feedbackMsg.className =
        "text-xs font-mono font-bold p-3 rounded-xs bg-emerald-50 border border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200 block";
      feedbackMsg.textContent =
        "✓ Thank you! Your review has been saved locally and analytics updated.";
      setTimeout(() => feedbackMsg.classList.add("hidden"), 4000);
    }

    form.reset();
    if (charCount) charCount.textContent = "0 / 300";
  });
}

function saveReviewsToStorage() {
  try {
    localStorage.setItem("ratewise_reviews", JSON.stringify(allReviews));
  } catch (err) {}
}

function loadReviewsFromStorage() {
  try {
    const stored = localStorage.getItem("ratewise_reviews");
    if (stored) {
      allReviews = JSON.parse(stored);
    } else {
      allReviews = [...INITIAL_REVIEWS];
    }
  } catch (e) {
    allReviews = [...INITIAL_REVIEWS];
  }
}

function renderReviews() {
  const container = document.getElementById("reviewsContainer");
  if (!container) return;
  container.innerHTML = "";

  let filtered = allReviews;

  if (activeFilter === "5") {
    filtered = filtered.filter((r) => r.rating === 5);
  } else if (activeFilter === "4") {
    filtered = filtered.filter((r) => r.rating === 4);
  } else if (activeFilter === "critical") {
    filtered = filtered.filter((r) => r.rating <= 3);
  }

  if (currentSearchTerm) {
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(currentSearchTerm) ||
        r.review.toLowerCase().includes(currentSearchTerm),
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
          <div class="col-span-full p-8 text-center bg-brand-surfaceRaised dark:bg-brand-cardDark rounded-sm border border-brand-surfaceStrong dark:border-brand-borderDark">
            <p class="text-xs font-mono text-neutral-500">No matching reviews found. Try resetting the filter.</p>
          </div>
        `;
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.className =
      "p-6 rounded-sm bg-brand-surfaceRaised dark:bg-brand-cardDark border border-brand-surfaceStrong dark:border-brand-borderDark shadow-sm flex flex-col justify-between";

    let starsSvg = "";
    for (let i = 1; i <= 5; i++) {
      starsSvg += `<span class="${i <= item.rating ? "text-brand-acid" : "text-neutral-300 dark:text-zinc-700"}">★</span>`;
    }

    card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 rev-date"></span>
              <div class="text-base flex gap-0.5">${starsSvg}</div>
            </div>
            <p class="text-xs text-neutral-800 dark:text-zinc-200 leading-relaxed font-sans mb-4 rev-text"></p>
          </div>
          <div class="flex items-center justify-between border-t border-brand-surfaceStrong dark:border-brand-borderDark pt-3 text-xs font-mono">
            <span class="font-bold text-brand-textPrimary dark:text-white rev-name"></span>
            <div class="flex items-center gap-3">
              <button class="ai-reply-btn text-[11px] text-brand-acid hover:underline font-bold cursor-pointer" data-id="${item.id}">
                💬 Reply
              </button>
              <button class="upvote-btn text-[11px] text-brand-blue dark:text-zinc-300 hover:underline font-bold cursor-pointer" data-id="${item.id}">
                ▲ Helpful (${item.upvotes})
              </button>
            </div>
          </div>
        `;

    card.querySelector(".rev-date").textContent = item.date;
    card.querySelector(".rev-text").textContent = item.review;
    card.querySelector(".rev-name").textContent = item.name;

    card.querySelector(".ai-reply-btn").addEventListener("click", () => {
      openAiReplyModal(item);
    });

    card.querySelector(".upvote-btn").addEventListener("click", function () {
      item.upvotes += 1;
      this.textContent = `▲ Helpful (${item.upvotes})`;
      saveReviewsToStorage();
    });

    container.appendChild(card);
  });
}

// 100% Reliable Client-Side Writing Assistant Engine
function initClientWritingAssistant() {
  const reviewInput = document.getElementById("userReviewInput");
  const charCount = document.getElementById("charCount");

  const TEMPLATES_5_STAR = [
    "Flawless user experience. The interaction speed, clean tokens, and accessible keyboard navigation exceeded all expectations.",
    "Exceptional implementation. The Swiss-poster aesthetics paired with instant telemetry create an unbeatable feedback flow.",
    "Top-tier design architecture! Everything from the smooth focus rings to the CSAT gauge runs with surgical precision.",
  ];

  const TEMPLATES_4_STAR = [
    "Solid and intuitive platform. Navigation and rating controls feel responsive, with minor room for deeper aspect customization.",
    "Very clean interface with great aesthetic balance. The real-time metric distribution is clear and well executed.",
    "Impressive frontend execution. Star transitions and contrast meet high standards across both themes.",
  ];

  const TEMPLATES_CRITICAL = [
    "The interface concept is promising, but aspect rating interactions could benefit from more detailed tactile feedback.",
    "Functional foundation, though fine-tuning keyboard shortcuts and review filtering on mobile would make this even better.",
    "Good design tokens, but latency and layout contrast in daylight conditions need further optimization.",
  ];

  document.getElementById("btnAiDraftReview")?.addEventListener("click", () => {
    if (!reviewInput) return;
    const rating = committedRating > 0 ? committedRating : 5;
    let pool = TEMPLATES_5_STAR;
    if (rating === 4) pool = TEMPLATES_4_STAR;
    if (rating <= 3) pool = TEMPLATES_CRITICAL;

    const selectedDraft = pool[Math.floor(Math.random() * pool.length)];
    reviewInput.value = selectedDraft;
    if (charCount) charCount.textContent = `${selectedDraft.length} / 300`;
    showToast("Generated smart review draft!", "✨");
  });

  document
    .getElementById("btnAiPolishReview")
    ?.addEventListener("click", () => {
      if (!reviewInput) return;
      let txt = reviewInput.value.trim();
      if (!txt) {
        showToast("Please enter a few words first to polish.", "ℹ️");
        return;
      }

      txt = txt.charAt(0).toUpperCase() + txt.slice(1);
      if (!txt.endsWith(".") && !txt.endsWith("!")) txt += ".";
      txt = txt
        .replace(/\b(good|nice|ok)\b/gi, "exceptional")
        .replace(/\b(bad|slow)\b/gi, "suboptimal")
        .replace(/\s+/g, " ");

      reviewInput.value = txt.slice(0, 300);
      if (charCount)
        charCount.textContent = `${reviewInput.value.length} / 300`;
      showToast("Review polished & structured!", "💎");
    });

  document
    .getElementById("btnAiConstructiveReview")
    ?.addEventListener("click", () => {
      if (!reviewInput) return;
      let txt = reviewInput.value.trim() || "Interface interaction is quick";
      const constructive = `Observed strength: ${txt.replace(/\.$/, "")}. Recommendation: Expand aspect granularity for higher precision.`;
      reviewInput.value = constructive.slice(0, 300);
      if (charCount)
        charCount.textContent = `${reviewInput.value.length} / 300`;
      showToast("Made constructive & actionable!", "🎯");
    });
}

// 100% Reliable Client-Side Feedback Synthesis Engine
function initClientFeedbackSynthesis() {
  const btn = document.getElementById("runGeminiSynthesisBtn");
  const btnText = document.getElementById("synthesisBtnText");
  const container = document.getElementById("aiSynthesisContainer");
  const execSummary = document.getElementById("aiExecutiveSummary");
  const praisedList = document.getElementById("aiPraisedList");
  const actionableList = document.getElementById("aiActionableList");

  if (!btn) return;

  btn.addEventListener("click", () => {
    btn.disabled = true;
    if (btnText) btnText.textContent = "Computing Telemetry...";

    setTimeout(() => {
      const total = allReviews.length;
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = total > 0 ? (sum / total).toFixed(1) : "5.0";
      const promoters = allReviews.filter((r) => r.rating >= 4).length;
      const csat = total > 0 ? Math.round((promoters / total) * 100) : 100;

      if (execSummary) {
        execSummary.textContent = `Overall user sentiment is strong at ${csat}% CSAT with an average rating of ${avg}★ across ${total} recorded entries. Customer praise centers on responsive tokens and instantaneous feedback.`;
      }

      if (praisedList) {
        praisedList.innerHTML = `
              <li>Sub-second interaction latency with zero network lag</li>
              <li>Swiss-editorial contrast with Pin Sans typography stack</li>
              <li>Accessible focus states adhering to WCAG 2.2 AA</li>
              <li>Fluid 5-star rating synchronization across devices</li>
            `;
      }

      if (actionableList) {
        actionableList.innerHTML = `
              <li>Encourage descriptive reviews via inline aspect prompts</li>
              <li>Provide exportable CSV logs for feedback telemetry</li>
              <li>Add customized aspect categories for custom store fronts</li>
            `;
      }

      if (container) {
        container.classList.remove("hidden");
        container.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      btn.disabled = false;
      if (btnText) btnText.textContent = "Generate Synthesis Report";
      showToast("Synthesis Report Generated!", "⚡");
    }, 350);
  });
}

let currentSelectedTone = "empathetic";
let currentTargetReview = null;

function openAiReplyModal(reviewItem) {
  currentTargetReview = reviewItem;
  const modal = document.getElementById("aiReplyModal");
  const excerpt = document.getElementById("modalFeedbackExcerpt");
  if (excerpt)
    excerpt.textContent = `"${reviewItem.review}" — ${reviewItem.name} (${reviewItem.rating}★)`;
  if (modal) modal.classList.remove("hidden");
  generateInstantSupportReply();
}

function generateInstantSupportReply() {
  if (!currentTargetReview) return;
  const replyBox = document.getElementById("modalGeneratedReply");
  const name = currentTargetReview.name.split(" ")[0] || "Valued Customer";
  const rating = currentTargetReview.rating;

  let reply = "";
  if (currentSelectedTone === "empathetic") {
    if (rating >= 4) {
      reply = `Hi ${name}, thank you so much for the glowing ${rating}-star feedback! We're thrilled that the platform's speed and design made an impression on your workflow. We appreciate having you with us!`;
    } else {
      reply = `Hello ${name}, thank you for taking the time to share your perspective. We hear you on this and are already iterating on our next update to address the friction points you observed.`;
    }
  } else if (currentSelectedTone === "professional") {
    reply = `Dear ${name}, thank you for evaluating RateWise AI with a ${rating}-star rating. Your qualitative notes have been cataloged in our product sprint log for continuous interface refinement.`;
  } else if (currentSelectedTone === "action-oriented") {
    reply = `Hey ${name}, direct feedback like yours drives our roadmap. We have logged your comments with our design engineering squad to further polish our token and interaction pipeline!`;
  }

  if (replyBox) replyBox.value = reply;
}

function initAiReplyModalControls() {
  const modal = document.getElementById("aiReplyModal");
  const closeBtn = document.getElementById("closeAiModalBtn");
  const copyBtn = document.getElementById("copyAiReplyBtn");
  const replyBox = document.getElementById("modalGeneratedReply");
  const toneBtns = document.querySelectorAll(".tone-btn");

  closeBtn?.addEventListener("click", () => modal?.classList.add("hidden"));

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  toneBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toneBtns.forEach((b) => {
        b.classList.remove(
          "bg-brand-acid",
          "text-black",
          "font-bold",
          "border-brand-acid",
        );
        b.classList.add("bg-black/30", "text-zinc-300", "border-zinc-600");
      });
      btn.classList.add(
        "bg-brand-acid",
        "text-black",
        "font-bold",
        "border-brand-acid",
      );
      btn.classList.remove("bg-black/30", "text-zinc-300");
      currentSelectedTone = btn.getAttribute("data-tone");
      generateInstantSupportReply();
    });
  });

  copyBtn?.addEventListener("click", () => {
    if (!replyBox) return;
    replyBox.select();
    document.execCommand("copy");
    showToast("Response copied to clipboard!", "📋");
  });
}

function initReviewFiltersAndSearch() {
  const filterPills = document.querySelectorAll(".filter-pill");
  const searchInput = document.getElementById("reviewSearchInput");

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => {
        p.classList.remove("bg-brand-acid", "text-black", "font-bold");
        p.classList.add("text-zinc-500", "dark:text-zinc-400");
      });
      pill.classList.add("bg-brand-acid", "text-black", "font-bold");
      pill.classList.remove("text-zinc-500", "dark:text-zinc-400");

      activeFilter = pill.getAttribute("data-filter");
      renderReviews();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchTerm = e.target.value.toLowerCase().trim();
      renderReviews();
    });
  }
}

function updateAnalyticsDashboard() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  allReviews.forEach((r) => {
    const val = Math.min(5, Math.max(1, r.rating));
    counts[val] += 1;
    sum += val;
  });

  const total = allReviews.length;
  const avg = total > 0 ? sum / total : 0;
  const fiveStarPct = total > 0 ? Math.round((counts[5] / total) * 100) : 0;

  const avgEl = document.getElementById("metricAverageRating");
  if (avgEl) avgEl.textContent = avg.toFixed(1);

  const heroAvg = document.getElementById("heroAvgRating");
  if (heroAvg) heroAvg.textContent = avg.toFixed(1);

  const totalEl = document.getElementById("metricTotalRatings");
  if (totalEl) totalEl.textContent = total;

  const fiveStarEl = document.getElementById("metricFiveStarPct");
  if (fiveStarEl) fiveStarEl.textContent = `${fiveStarPct}%`;

  for (let star = 1; star <= 5; star++) {
    const pct = total > 0 ? Math.round((counts[star] / total) * 100) : 0;
    const bar = document.getElementById(`bar-${star}`);
    const pctLabel = document.getElementById(`pct-${star}`);
    if (bar && pctLabel) {
      bar.style.width = `${pct}%`;
      pctLabel.textContent = `${pct}%`;
    }
  }

  const promoters = counts[4] + counts[5];
  const detractors = counts[1] + counts[2];
  const csatPct = total > 0 ? Math.round((promoters / total) * 100) : 0;

  const csatDisplay = document.getElementById("csatPercentageDisplay");
  if (csatDisplay) csatDisplay.textContent = `${csatPct}%`;

  const promEl = document.getElementById("csatPromotersCount");
  if (promEl) promEl.textContent = promoters;

  const detEl = document.getElementById("csatDetractorsCount");
  if (detEl) detEl.textContent = detractors;

  const circumference = 251.2;
  const offset = circumference - (csatPct / 100) * circumference;
  const circleRing = document.getElementById("csatCircleRing");
  if (circleRing) {
    circleRing.style.strokeDashoffset = offset;
  }
}

function initFaqAccordion() {
  const faqButtons = document.querySelectorAll(".faq-btn");
  faqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector(".faq-icon");
      const isExpanded = btn.getAttribute("aria-expanded") === "true";

      faqButtons.forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn.nextElementSibling?.classList.add("hidden");
          const otherIcon = otherBtn.querySelector(".faq-icon");
          if (otherIcon) otherIcon.textContent = "+";
        }
      });

      if (isExpanded) {
        btn.setAttribute("aria-expanded", "false");
        content?.classList.add("hidden");
        if (icon) icon.textContent = "+";
      } else {
        btn.setAttribute("aria-expanded", "true");
        content?.classList.remove("hidden");
        if (icon) icon.textContent = "−";
      }
    });
  });
}

function initTheme() {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");

  const savedTheme = localStorage.getItem("ratewise_theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add("dark");
    if (themeIcon) themeIcon.textContent = "🌙";
  } else {
    document.documentElement.classList.remove("dark");
    if (themeIcon) themeIcon.textContent = "☀️";
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      if (document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("ratewise_theme", "light");
        if (themeIcon) themeIcon.textContent = "☀️";
        showToast("Switched to Pearl Light Mode", "☀️");
      } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("ratewise_theme", "dark");
        if (themeIcon) themeIcon.textContent = "🌙";
        showToast("Switched to Velvet Dark Mode", "🌙");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lenis Smooth Scrolling
  let lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      mouseMultiplier: 1.0,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Bind in-page anchor links to Lenis smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (targetId && targetId !== "#") {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            lenis.scrollTo(targetEl, { offset: -80, duration: 1.2 });
          }
        }
      });
    });
  }

  loadReviewsFromStorage();
  initTheme();
  initStarRatingWidget();
  initEmojiSync();
  initAspectRatings();
  initReviewForm();
  initClientWritingAssistant();
  initClientFeedbackSynthesis();
  initAiReplyModalControls();
  initReviewFiltersAndSearch();
  renderReviews();
  updateAnalyticsDashboard();
  initFaqAccordion();

  const mobileBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener("click", () => {
      const isClosed = mobileMenu.classList.contains("hidden");
      if (isClosed) {
        mobileMenu.classList.remove("hidden");
        mobileBtn.setAttribute("aria-expanded", "true");
      } else {
        mobileMenu.classList.add("hidden");
        mobileBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.querySelectorAll(".mobile-link").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        mobileBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  const heroBlastBtn = document.getElementById("heroCheerBlastBtn");
  if (heroBlastBtn) {
    heroBlastBtn.addEventListener("click", () => {
      const rect = heroBlastBtn.getBoundingClientRect();
      triggerCelebrationBlast(
        (rect.left + rect.width / 2) / window.innerWidth,
        (rect.top + rect.height / 2) / window.innerHeight,
      );
    });
  }

  const finalBlastBtn = document.getElementById("finalCheerBlastBtn");
  if (finalBlastBtn) {
    finalBlastBtn.addEventListener("click", () => {
      triggerCelebrationBlast(0.5, 0.6);
    });
  }

  const floatingBlastBtn = document.getElementById("floatingCheerBlastBtn");
  if (floatingBlastBtn) {
    floatingBlastBtn.addEventListener("click", () => {
      triggerCelebrationBlast(0.85, 0.85);
    });
  }

  const clearReviewsBtn = document.getElementById("clearAllReviewsBtn");
  if (clearReviewsBtn) {
    clearReviewsBtn.addEventListener("click", () => {
      allReviews = [];
      saveReviewsToStorage();
      renderReviews();
      updateAnalyticsDashboard();
      showToast("Local reviews cleared", "↺");
    });
  }

  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  setTimeout(() => {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { x: 0.5, y: 0.35 },
        colors: ["#cbf916", "#2244e8", "#ffffff"],
      });
    }
  }, 700);
});
