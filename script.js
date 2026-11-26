(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ------------------------------ Toast + copy --------------------------- */

  // Skip links should hand focus to the target so the pill cannot float over
  // the page after the jump, especially while scrolling on mobile.
  document.querySelectorAll(".skip-link").forEach((skip) => {
    skip.addEventListener("click", () => {
      const targetId = skip.getAttribute("href");
      if (!targetId || targetId.charAt(0) !== "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;

      window.requestAnimationFrame(() => {
        target.focus({ preventScroll: true });
      });
    });
  });

  const toastNode = document.querySelector("[data-toast]");
  const toastText = document.querySelector("[data-toast-text]");
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toastNode || !toastText) return;
    toastText.textContent = message;
    toastNode.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastNode.classList.remove("is-visible");
    }, 2400);
  };

  const copyText = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (error) {
        reject(error);
      } finally {
        field.remove();
      }
    });
  };

  const email = "hello@geanpaulo.com";

  document.querySelectorAll("[data-copy-email]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      copyText(email)
        .then(() => showToast("Email copied to clipboard"))
        .catch(() => showToast(email));
    });
  });

  const shareButton = document.querySelector("[data-share]");

  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const shareData = {
        title: "Gean Paulo | Links",
        text: "Gean Paulo's links: portfolio, socials, and the best ways to get in touch.",
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }

      try {
        await copyText(shareData.url);
        showToast("Link copied to clipboard");
      } catch (error) {
        showToast(shareData.url);
      }
    });
  }

  /* ---------------------- Projector beam + magnetic type ------------------ */

  if (finePointer.matches && !reduceMotion.matches) {
    const beamNode = document.querySelector(".beam");

    if (beamNode) {
      let beamFrame = 0;
      let beamX = window.innerWidth / 2;
      let beamY = window.innerHeight * 0.28;

      const paintBeam = () => {
        beamNode.style.setProperty("--beam-x", `${beamX}px`);
        beamNode.style.setProperty("--beam-y", `${beamY}px`);
        beamNode.classList.add("is-on");
        beamFrame = 0;
      };

      document.addEventListener(
        "pointermove",
        (event) => {
          beamX = event.clientX;
          beamY = event.clientY;

          if (beamFrame) return;
          beamFrame = window.requestAnimationFrame(paintBeam);
        },
        { passive: true }
      );

      document.addEventListener("pointerleave", () => {
        beamNode.classList.remove("is-on");
      });
    }

    const identityNode = document.querySelector(".identity");
    const nameNode = document.querySelector(".name");
    const letterNodes = Array.from(document.querySelectorAll(".ltr"));

    if (identityNode && nameNode && letterNodes.length) {
      let letterFrame = 0;
      let pointerX = 0;
      let pointerY = 0;

      const paintLetters = () => {
        const nameRect = nameNode.getBoundingClientRect();
        const nameOffsetLeft = nameNode.offsetLeft;
        const nameOffsetTop = nameNode.offsetTop;
        const radius = 260;

        letterNodes.forEach((letter) => {
          const left = nameRect.left + (letter.offsetLeft - nameOffsetLeft);
          const top = nameRect.top + (letter.offsetTop - nameOffsetTop);
          const centerX = left + letter.offsetWidth / 2;
          const centerY = top + letter.offsetHeight / 2;
          const dx = centerX - pointerX;
          const dy = centerY - pointerY;
          const distance = Math.hypot(dx, dy);

          if (distance > 0 && distance < radius) {
            const force = (1 - distance / radius) * 10;
            const shiftX = (dx / distance) * force;
            const shiftY = (dy / distance) * force;
            letter.style.transform = `translate3d(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px, 0)`;
          } else {
            letter.style.transform = "";
          }
        });

        letterFrame = 0;
      };

      identityNode.addEventListener(
        "pointermove",
        (event) => {
          pointerX = event.clientX;
          pointerY = event.clientY;

          if (letterFrame) return;
          letterFrame = window.requestAnimationFrame(paintLetters);
        },
        { passive: true }
      );

      identityNode.addEventListener("pointerleave", () => {
        if (letterFrame) {
          window.cancelAnimationFrame(letterFrame);
          letterFrame = 0;
        }

        letterNodes.forEach((letter) => {
          letter.style.transform = "";
        });
      });
    }
  }

  /* ----------------------------- Manila clock ---------------------------- */

  const clockNodes = document.querySelectorAll("[data-clock]");
  const greetingNode = document.querySelector("[data-greeting]");
  const yearNode = document.querySelector("[data-year]");

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const greetingFor = (hour) => {
    if (hour >= 5 && hour < 12) return "Good morning, I'm";
    if (hour >= 12 && hour < 18) return "Good afternoon, I'm";
    return "Good evening, I'm";
  };

  const paintClock = () => {
    const time = timeFormatter.format(new Date());
    clockNodes.forEach((node) => {
      node.textContent = time;
    });
    if (greetingNode) {
      greetingNode.textContent = greetingFor(new Date().getHours());
    }
  };

  paintClock();
  window.setInterval(paintClock, 15000);

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------- Weather ------------------------------- */

  const weatherNode = document.querySelector("[data-weather]");
  const weatherSeparator = document.querySelector("[data-weather-sep]");
  const weatherTemp = document.querySelector("[data-weather-temp]");
  const weatherDesc = document.querySelector("[data-weather-desc]");
  const weatherUse = weatherNode ? weatherNode.querySelector("use") : null;

  const WMO = {
    0: ["sun", "Clear"],
    1: ["sun", "Mainly clear"],
    2: ["cloud-sun", "Partly cloudy"],
    3: ["cloud", "Overcast"],
    45: ["cloud-fog", "Fog"],
    48: ["cloud-fog", "Fog"],
    51: ["cloud-rain", "Drizzle"],
    53: ["cloud-rain", "Drizzle"],
    55: ["cloud-rain", "Drizzle"],
    61: ["cloud-rain", "Rain"],
    63: ["cloud-rain", "Rain"],
    65: ["cloud-rain", "Rain"],
    71: ["snowflake", "Snow"],
    73: ["snowflake", "Snow"],
    75: ["snowflake", "Snow"],
    80: ["cloud-rain", "Showers"],
    81: ["cloud-rain", "Showers"],
    82: ["cloud-rain", "Showers"],
    95: ["cloud-lightning", "Storm"],
    96: ["cloud-lightning", "Storm"],
    99: ["cloud-lightning", "Storm"],
  };

  if (weatherNode && weatherSeparator && weatherTemp && weatherUse) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current_weather=true",
      { signal: controller.signal }
    )
      .then((response) => response.json())
      .then((data) => {
        const current = data && data.current_weather;
        if (!current) return;

        const temp = Math.round(current.temperature);
        const [icon, label] = WMO[current.weathercode] || ["cloud", "Cloudy"];

        weatherUse.setAttribute("href", `#i-${icon}`);
        weatherNode.classList.toggle("is-sun", icon === "sun");
        weatherTemp.textContent = `${temp}\u00B0C`;
        weatherNode.title = `${temp}\u00B0C, ${label}`;
        if (weatherDesc) {
          weatherDesc.textContent = `${temp} degrees Celsius, ${label.toLowerCase()} in Manila`;
        }

        weatherNode.hidden = false;
        weatherSeparator.hidden = false;
      })
      .catch(() => {
        /* weather is a bonus; the status row works without it */
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });
  }

  /* -------------------------- Rotating footnote -------------------------- */

  const footnoteNode = document.querySelector("[data-footnote]");

  const footnotes = [
    "Somewhere between almost done and shipped.",
    "Made in Manila, mostly after dark.",
    "The last ten percent takes ninety percent of the time.",
    "Reply speed depends on coffee.",
  ];

  if (footnoteNode && !reduceMotion.matches) {
    let footnoteIndex = 0;
    let swapping = false;

    window.setInterval(() => {
      if (swapping || document.hidden) return;
      swapping = true;
      footnoteNode.classList.add("is-out");

      window.setTimeout(() => {
        footnoteIndex = (footnoteIndex + 1) % footnotes.length;
        footnoteNode.textContent = footnotes[footnoteIndex];
        footnoteNode.classList.remove("is-out");
        swapping = false;
      }, 230);
    }, 5000);
  }

  /* --------------------- Cursor spotlight on the rows -------------------- */

  if (finePointer.matches) {
    document.querySelectorAll(".row").forEach((row) => {
      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;

      row.addEventListener(
        "pointermove",
        (event) => {
          pointerX = event.clientX;
          pointerY = event.clientY;

          if (frame) return;

          frame = window.requestAnimationFrame(() => {
            const rect = row.getBoundingClientRect();
            row.style.setProperty("--mx", `${pointerX - rect.left}px`);
            row.style.setProperty("--my", `${pointerY - rect.top}px`);
            frame = 0;
          });
        },
        { passive: true }
      );

      row.addEventListener(
        "pointerleave",
        () => {
          if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
        },
        { passive: true }
      );
    });
  }
})();
