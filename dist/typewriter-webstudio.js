(function () {
  "use strict";

  var TYPEWRITER_ATTR = "dv-typewriter";
  var READY_FLAG = "dvTypewriterReady";
  var GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js";
  var TEXT_PLUGIN_URL =
    "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/TextPlugin.min.js";

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + url + '"]');
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", function () {
          resolve();
        });
        existing.addEventListener("error", function () {
          reject(new Error("Failed loading " + url));
        });
        return;
      }

      var script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.addEventListener("load", function () {
        script.dataset.loaded = "true";
        resolve();
      });
      script.addEventListener("error", function () {
        reject(new Error("Failed loading " + url));
      });
      document.head.appendChild(script);
    });
  }

  function ensureGsap() {
    if (window.gsap && window.TextPlugin) {
      window.gsap.registerPlugin(window.TextPlugin);
      return Promise.resolve();
    }

    return loadScript(GSAP_URL)
      .then(function () {
        return loadScript(TEXT_PLUGIN_URL);
      })
      .then(function () {
        if (!window.gsap || !window.TextPlugin) {
          throw new Error("GSAP or TextPlugin unavailable.");
        }
        window.gsap.registerPlugin(window.TextPlugin);
      });
  }

  function parseOptions(raw) {
    var options = {
      trigger: "auto",
      duration: 55,
      deleteSpeed: 45,
      beforeDelete: 1400,
      beforeType: 260,
      loop: false
    };

    if (!raw) {
      return options;
    }

    raw.split(/\s+/).forEach(function (token) {
      if (!token) {
        return;
      }

      if (token === "auto" || token === "inview") {
        options.trigger = token;
        return;
      }

      if (token === "loop") {
        options.loop = true;
        return;
      }

      var durationMatch = token.match(/^duration-(\d+)$/);
      if (durationMatch) {
        options.duration = Number(durationMatch[1]);
        return;
      }

      var deleteMatch = token.match(/^delete-(\d+)$/);
      if (deleteMatch) {
        options.deleteSpeed = Number(deleteMatch[1]);
        return;
      }

      var beforeDeleteMatch = token.match(/^before-delete-(\d+)$/);
      if (beforeDeleteMatch) {
        options.beforeDelete = Number(beforeDeleteMatch[1]);
        return;
      }

      var beforeTypeMatch = token.match(/^before-type-(\d+)$/);
      if (beforeTypeMatch) {
        options.beforeType = Number(beforeTypeMatch[1]);
      }
    });

    return options;
  }

  function parseWords(el) {
    var explicit = el.getAttribute("dv-typewriter-items");
    var source = explicit || el.textContent || "";
    return source
      .split("|")
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function parseColors(el) {
    var raw = el.getAttribute("dv-typewriter-colors");
    if (!raw) {
      return [];
    }
    return raw
      .split("|")
      .map(function (color) {
        return color.trim();
      })
      .filter(Boolean);
  }

  function resolveColorTarget(el) {
    var value = el.getAttribute("dv-typewriter-color-target");
    if (!value || value === "self") {
      return el;
    }
    if (value === "parent") {
      return el.parentElement || el;
    }
    var target = document.querySelector(value);
    return target || el;
  }

  function createNodes(el) {
    var textNode = document.createElement("span");
    textNode.className = "dv-typewriter-text";

    var cursor = document.createElement("span");
    cursor.className = "dv-typewriter-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = el.getAttribute("dv-typewriter-cursor") || "|";

    el.textContent = "";
    el.appendChild(textNode);
    el.appendChild(cursor);
    return { textNode: textNode, cursor: cursor };
  }

  function buildTimeline(instance, options, words, colors, colorTarget) {
    var gsap = window.gsap;
    var repeatValue = options.loop ? -1 : 0;

    var timeline = gsap.timeline({
      paused: options.trigger === "inview",
      repeat: repeatValue,
      defaults: { ease: "none" }
    });

    words.forEach(function (word, index) {
      var isFinalWord = index === words.length - 1;
      var shouldDelete = options.loop || !isFinalWord;
      var typeDuration = Math.max(0.18, (word.length * options.duration) / 1000);
      var deleteDuration = Math.max(
        0.12,
        (word.length * options.deleteSpeed) / 1000
      );
      var color = colors[index % colors.length];

      if (color) {
        timeline.to(colorTarget, {
          backgroundColor: color,
          duration: 0.3,
          ease: "power1.out"
        });
      }

      timeline.to(instance.textNode, {
        duration: typeDuration,
        text: { value: word }
      });

      if (shouldDelete) {
        timeline.to({}, { duration: options.beforeDelete / 1000 });
        timeline.to(instance.textNode, {
          duration: deleteDuration,
          text: { value: "" }
        });
        timeline.to({}, { duration: options.beforeType / 1000 });
      }
    });

    if (!options.loop) {
      timeline.eventCallback("onComplete", function () {
        gsap.set(instance.cursor, { opacity: 1 });
      });
    }

    return timeline;
  }

  function attachTrigger(options, timeline, el) {
    if (options.trigger !== "inview") {
      timeline.play(0);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      timeline.play(0);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            timeline.play(0);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
  }

  function initElement(el) {
    if (el.dataset[READY_FLAG] === "true") {
      return;
    }

    var words = parseWords(el);
    if (!words.length) {
      return;
    }

    var options = parseOptions(el.getAttribute(TYPEWRITER_ATTR));
    var colors = parseColors(el);
    var colorTarget = resolveColorTarget(el);
    var nodes = createNodes(el);

    var gsap = window.gsap;
    gsap.to(nodes.cursor, {
      opacity: 0,
      duration: 0.52,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    var timeline = buildTimeline(nodes, options, words, colors, colorTarget);
    attachTrigger(options, timeline, el);
    el.dataset[READY_FLAG] = "true";
  }

  function initAll() {
    var prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    var elements = Array.prototype.slice.call(
      document.querySelectorAll("[" + TYPEWRITER_ATTR + "]")
    );

    if (!elements.length) {
      return;
    }

    if (prefersReducedMotion) {
      elements.forEach(function (el) {
        var words = parseWords(el);
        if (words.length) {
          el.textContent = words[0];
        }
      });
      return;
    }

    ensureGsap()
      .then(function () {
        elements.forEach(initElement);
      })
      .catch(function (error) {
        console.error("[dv-typewriter] Initialization failed:", error);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
