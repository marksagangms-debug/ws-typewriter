(function () {
  "use strict";

  var TYPEWRITER_ATTR = "dv-typewriter";
  var READY_FLAG = "dvTypewriterReady";
  var GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js";
  var DEFAULT_SEPARATOR = /\s*\|\s*/;

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
    if (window.gsap) {
      return Promise.resolve();
    }

    return loadScript(GSAP_URL).then(function () {
      if (!window.gsap) {
        throw new Error("GSAP unavailable.");
      }
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
    var separator = el.getAttribute("dv-typewriter-separator");
    var splitRule = separator ? separator : DEFAULT_SEPARATOR;

    return source
      .split(splitRule)
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
      .split(DEFAULT_SEPARATOR)
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
    textNode.style.whiteSpace = "pre";

    var cursor = document.createElement("span");
    cursor.className = "dv-typewriter-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = el.getAttribute("dv-typewriter-cursor") || "|";

    el.textContent = "";
    el.appendChild(textNode);
    el.appendChild(cursor);
    return { textNode: textNode, cursor: cursor };
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, Math.max(0, ms));
    });
  }

  function tweenBackground(target, color) {
    if (!color) {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      window.gsap.to(target, {
        backgroundColor: color,
        duration: 0.3,
        ease: "power1.out",
        onComplete: resolve
      });
    });
  }

  async function typeWord(instance, word, stepDelay) {
    for (var i = 1; i <= word.length; i += 1) {
      instance.textNode.textContent = word.slice(0, i);
      await wait(stepDelay);
    }
  }

  async function deleteWord(instance, stepDelay) {
    for (var i = instance.textNode.textContent.length - 1; i >= 0; i -= 1) {
      instance.textNode.textContent = instance.textNode.textContent.slice(0, i);
      await wait(stepDelay);
    }
  }

  async function runSequence(instance, options, words, colors, colorTarget) {
    var index = 0;

    do {
      var word = words[index];
      var color = colors.length ? colors[index % colors.length] : null;
      var isFinalWord = index === words.length - 1;
      var shouldDelete = options.loop || !isFinalWord;

      await tweenBackground(colorTarget, color);
      await typeWord(instance, word, options.duration);

      if (shouldDelete) {
        await wait(options.beforeDelete);
        await deleteWord(instance, options.deleteSpeed);
        await wait(options.beforeType);
      }

      if (!options.loop && isFinalWord) {
        if (instance.cursorTween) {
          instance.cursorTween.kill();
        }
        window.gsap.set(instance.cursor, { opacity: 1 });
        return;
      }

      index = (index + 1) % words.length;
    } while (true);
  }

  function startWhenInView(el, run) {
    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run();
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
    nodes.cursorTween = gsap.to(nodes.cursor, {
      opacity: 0,
      duration: 0.52,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    var run = function () {
      runSequence(nodes, options, words, colors, colorTarget).catch(function (
        error
      ) {
        console.error("[dv-typewriter] Sequence failed:", error);
      });
    };

    if (options.trigger === "inview") {
      startWhenInView(el, run);
    } else {
      run();
    }

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
