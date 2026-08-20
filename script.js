(function () {
  'use strict';

  var scrollArea = document.getElementById('scrollArea');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var navButtons = Array.prototype.slice.call(document.querySelectorAll('.floatnav button'));
  var progressFill = document.getElementById('progressFill');

  /* ---------- Nav: click to scroll ---------- */
  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Active section highlighting + scroll progress ---------- */
  function setActive(id) {
    navButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.target === id);
    });
  }

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        setActive(entry.target.id);
      }
    });
  }, { root: scrollArea, threshold: [0.5] });

  sections.forEach(function (s) { sectionObserver.observe(s); });

  function updateProgress() {
    var max = scrollArea.scrollHeight - scrollArea.clientHeight;
    var pct = max > 0 ? (scrollArea.scrollTop / max) * 100 : 0;
    progressFill.style.width = pct + '%';
  }
  var ticking = false;
  scrollArea.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { updateProgress(); ticking = false; });
      ticking = true;
    }
  });
  updateProgress();

  /* ---------- Scroll-reveal ---------- */
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { root: scrollArea, threshold: 0.15 });
  revealTargets.forEach(function (el) { revealObserver.observe(el); });

  /* ---------- Keyboard navigation ---------- */
  function currentIndex() {
    var mid = scrollArea.scrollTop + scrollArea.clientHeight / 2;
    var closest = 0, closestDist = Infinity;
    sections.forEach(function (s, i) {
      var d = Math.abs(s.offsetTop + s.offsetHeight / 2 - mid);
      if (d < closestDist) { closestDist = d; closest = i; }
    });
    return closest;
  }

  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'BUTTON' && document.activeElement.classList.contains('flag')) {
      // still allow section nav even when a flag button is focused
    }
    var idx = currentIndex();
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      var next = sections[Math.min(idx + 1, sections.length - 1)];
      next.scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      var prev = sections[Math.max(idx - 1, 0)];
      prev.scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      sections[0].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      sections[sections.length - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ---------- SPF/DKIM/DMARC animated flow ---------- */
  var flowDiagram = document.getElementById('authFlowDiagram');
  if (flowDiagram) {
    var flowObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          flowDiagram.classList.add('is-live');
        } else {
          flowDiagram.classList.remove('is-live');
        }
      });
    }, { root: scrollArea, threshold: 0.4 });
    flowObserver.observe(flowDiagram);
  }

  /* ---------- Interactive phishing demo ---------- */
  var flags = Array.prototype.slice.call(document.querySelectorAll('.flag'));
  var explainBox = document.getElementById('mailExplain');
  var counterEl = document.getElementById('flagCounter');
  var found = new Set();
  var TOTAL_FLAGS = flags.length;

  function renderExplanations() {
    if (found.size === 0) {
      explainBox.innerHTML = '<p class="mail-explain-empty">Click a highlighted part of the email to see why it\'s a red flag.</p>';
      return;
    }
    var html = '';
    flags.forEach(function (btn) {
      var key = btn.dataset.flag;
      if (found.has(key)) {
        html += '<div class="explain-item"><span class="dot"></span><p>' + btn.dataset.explain + '</p></div>';
      }
    });
    explainBox.innerHTML = html;
  }

  flags.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.flag;
      btn.classList.add('is-found');
      if (!found.has(key)) {
        found.add(key);
        counterEl.textContent = found.size + ' / ' + TOTAL_FLAGS + ' flags found';
        renderExplanations();
        if (found.size === TOTAL_FLAGS) {
          counterEl.textContent = 'All ' + TOTAL_FLAGS + ' flags found — nice catch!';
        }
      }
    });
  });

  /* ---------- Thank-you video: full-screen, autoplay WITH sound on viewport ---------- */
  var video = document.getElementById('thankyouVideo');
  var placeholder = document.getElementById('videoPlaceholder');
  var videoFrame = document.getElementById('videoFrame');

  if (video) {
    // If thank.mp4 isn't actually present next to this page, fall back to the placeholder.
    video.addEventListener('error', function () {
      video.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    });
    // Once real frame data has loaded, hide the placeholder.
    video.addEventListener('loadeddata', function () {
      if (placeholder) placeholder.style.display = 'none';
    });

    function tryUnmutedPlay() {
      video.muted = false;
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {
          // Browser blocked unmuted autoplay — start muted instead, then
          // unmute automatically on the very first interaction anywhere on the page.
          video.muted = true;
          video.play().catch(function () { /* file missing or still blocked */ });
          var unmuteOnInteract = function () {
            video.muted = false;
            window.removeEventListener('scroll', unmuteOnInteract);
            window.removeEventListener('click', unmuteOnInteract);
            window.removeEventListener('keydown', unmuteOnInteract);
          };
          window.addEventListener('scroll', unmuteOnInteract, { once: true });
          window.addEventListener('click', unmuteOnInteract, { once: true });
          window.addEventListener('keydown', unmuteOnInteract, { once: true });
        });
      }
    }

    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tryUnmutedPlay();
        } else {
          video.pause();
        }
      });
    }, { root: scrollArea, threshold: 0.6 });

    videoObserver.observe(videoFrame);
  }

})();
