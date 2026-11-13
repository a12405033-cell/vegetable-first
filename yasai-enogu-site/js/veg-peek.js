/*
 * veg-peek.js
 * スクロールすると、野菜が画面の端から「ひょこっと」顔を出す演出。
 *
 * 使い方（HTML）:
 *   <section class="section">            ← 野菜を出したいまとまり（position: relative）
 *     <div class="veg-peek" data-side="right" style="top: 120px"
 *          data-enter="assets/veg/tomato-sparkle.webp"   顔を出した瞬間の表情
 *          data-idle="assets/veg/tomato-blush.webp"      出ている間の表情
 *          data-blink="assets/veg/tomato-wink.webp"      ときどき一瞬だけ見せる表情（省略可）
 *          data-poke="assets/veg/tomato-squint.webp"     マウスを乗せた・タップしたときの表情（省略可）
 *          data-leave="assets/veg/tomato-worried.webp">  引っ込むときの表情（省略可）
 *       <div class="veg-peek__body"><img src="assets/veg/tomato-worried.webp" alt=""></div>
 *     </div>
 *     …
 *   </section>
 *
 *   data-side   : left / right / bottom（どこから出てくるか）
 *   data-delay  : 出てくるまでの待ち時間（ミリ秒、省略時 0）
 *   野菜は、いちばん近い [data-peek-area]（なければ親要素）が
 *   画面に 25% 以上入ったときに出てきて、画面から外れると引っ込みます。
 */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function preload(src) {
    if (!src) return;
    var im = new Image();
    im.src = src;
  }

  function setupPeek(el) {
    var img = el.querySelector("img");
    if (!img) return;

    var faces = {
      enter: el.dataset.enter,
      idle: el.dataset.idle || el.dataset.enter,
      blink: el.dataset.blink,
      poke: el.dataset.poke,
      leave: el.dataset.leave
    };
    Object.keys(faces).forEach(function (k) { preload(faces[k]); });

    var delay = parseInt(el.dataset.delay || "0", 10);
    var timers = [];
    var out = false;

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function setFace(src) { if (src && img.getAttribute("src") !== src) img.src = src; }

    // 出ている間、ときどき表情を変える
    function idleLoop() {
      if (!faces.blink || reduceMotion) return;
      later(function () {
        if (!out) return;
        setFace(faces.blink);
        later(function () {
          if (!out) return;
          setFace(faces.idle);
          idleLoop();
        }, 420);
      }, 2600 + Math.random() * 2600);
    }

    function show() {
      if (out) return;
      out = true;
      clearTimers();
      later(function () {
        setFace(faces.enter);
        el.classList.add("is-out");
        later(function () {
          if (!out) return;
          setFace(faces.idle);
          idleLoop();
        }, reduceMotion ? 0 : 900);
      }, delay);
    }

    function hide() {
      if (!out) return;
      out = false;
      clearTimers();
      setFace(faces.leave || faces.idle);
      later(function () { el.classList.remove("is-out"); }, reduceMotion ? 0 : 160);
    }

    // さわると反応する
    // さわる場所ごとの表情（data-zones="top:画像,left:画像,…"）
    var zones = {};
    (el.dataset.zones || "").split(",").forEach(function (pair) {
      var kv = pair.split("|");
      if (kv.length === 2) { zones[kv[0].trim()] = kv[1].trim(); preload(kv[1].trim()); }
    });
    var hasZones = Object.keys(zones).length > 0;
    var hovering = false, currentZone = null, zoneOrder = ["top", "left", "center", "right", "bottom"], tapIndex = 0;

    function zoneAt(e) {
      // 画面に見えている部分を基準に、上・左・まんなか・右・下を決める
      var r = img.getBoundingClientRect();
      var vw = document.documentElement.clientWidth;
      var left = Math.max(0, r.left), right = Math.min(vw, r.right);
      var x = (e.clientX - left) / Math.max(1, right - left), y = (e.clientY - r.top) / r.height;
      if (y < 0.3) return "top";
      if (y > 0.72) return "bottom";
      if (x < 0.36) return "left";
      if (x > 0.64) return "right";
      return "center";
    }
    function react() {
      el.classList.remove("is-react");
      void el.offsetWidth;
      el.classList.add("is-react");
    }
    function showZone(zone) {
      if (!out || zone === currentZone) return;
      currentZone = zone;
      var face = zones[zone] || faces.poke;
      if (face) { setFace(face); react(); }
    }
    function poke(zoneFace) {
      if (!out) return;
      clearTimers();
      if (zoneFace) setFace(zoneFace); else if (faces.poke) setFace(faces.poke);
      el.classList.remove("is-poked");
      void el.offsetWidth; // アニメーションを最初から再生するため
      el.classList.add("is-poked");
      later(function () {
        el.classList.remove("is-poked");
        if (!out || hovering) return;
        setFace(faces.idle);
        idleLoop();
      }, 900);
    }

    img.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      hovering = true; clearTimers(); currentZone = null;
      if (hasZones) showZone(zoneAt(e)); else poke();
    });
    img.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !hasZones) return;
      showZone(zoneAt(e));
    });
    img.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      hovering = false; currentZone = null;
      if (!out) return;
      later(function () { if (!hovering && out) { setFace(faces.idle); idleLoop(); } }, 250);
    });
    img.addEventListener("click", function (e) {
      if (!hasZones) { poke(); return; }
      // マウスはさわった場所の顔、タップは押すたびに順番に顔が変わる
      var zone = e.pointerType === "mouse" || e.detail === 0 ? zoneAt(e) : zoneOrder[tapIndex++ % zoneOrder.length];
      if (window.matchMedia && window.matchMedia("(hover: none)").matches) zone = zoneOrder[tapIndex++ % zoneOrder.length];
      poke(zones[zone]);
    });

    var area = el.closest("[data-peek-area]") || el.parentElement;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // 長いまとまりでも出てこられるよう、画面の高さに対しての見え方でも判定する
          var seen = entry.intersectionRect.height / window.innerHeight;
          if (entry.isIntersecting && (entry.intersectionRatio >= 0.25 || seen >= 0.25)) show();
          else if (!entry.isIntersecting) hide();
        });
      },
      { threshold: [0, 0.1, 0.25, 0.4, 0.6] }
    );
    io.observe(area);
  }

  function init() {
    if (!("IntersectionObserver" in window)) {
      // 古いブラウザでは最初から出しておく
      document.querySelectorAll(".veg-peek").forEach(function (el) {
        el.classList.add("is-out");
      });
      return;
    }
    document.querySelectorAll(".veg-peek").forEach(setupPeek);
  }


  // ---------------------------------------------------------------
  // 文字と重ならない位置に野菜を置く
  // 各野菜について、まとまりの中で上下に位置をずらして、
  // 見出し・本文などの文字の行と重ならない場所を探します。
  // 見つからないときは顔を出す量を減らし、それでも無理なら表示しません。
  // ---------------------------------------------------------------
  function textRects(area) {
    var rects = [];
    var walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (n.parentElement && n.parentElement.closest(".veg-peek")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var range = document.createRange(), n;
    while ((n = walker.nextNode())) {
      range.selectNodeContents(n);
      var list = range.getClientRects();
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.width && r.height) rects.push({ x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height });
      }
    }
    return rects;
  }

  function hit(a, b, pad) {
    return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  }

  function measure(el, show) {
    var wasOut = el.classList.contains("is-out");
    var prevShow = el.style.getPropertyValue("--show");
    el.style.transition = "none";
    el.style.setProperty("--show", show);
    el.classList.add("is-out");
    var box = el.getBoundingClientRect();
    var top = el.offsetTop + (el.offsetParent ? el.offsetParent.getBoundingClientRect().top : 0);
    var vw = document.documentElement.clientWidth;
    var res = { x: Math.max(0, box.left), w: Math.min(vw, box.right) - Math.max(0, box.left), dy: box.top - top, h: box.height };
    if (!wasOut) el.classList.remove("is-out");
    if (prevShow) el.style.setProperty("--show", prevShow); else el.style.removeProperty("--show");
    void el.offsetWidth;
    el.style.transition = "";
    return res;
  }

  function layout() {
    var vw = document.documentElement.clientWidth;
    var areas = [];
    document.querySelectorAll(".veg-peek").forEach(function (el) {
      var area = el.closest("[data-peek-area]") || el.parentElement;
      if (areas.indexOf(area) < 0) areas.push(area);
    });
    var texts = textRects(document.querySelector("main") || document.body);
    var placed = [];
    areas.forEach(function (area) {
      var aTop = area.getBoundingClientRect().top + window.scrollY;
      var aH = area.offsetHeight;
      area.querySelectorAll(":scope > .veg-peek").forEach(function (el) {
        if (!el.dataset.prefTop) el.dataset.prefTop = el.style.top || "0px";
        el.style.removeProperty("--show");
        el.classList.remove("is-skipped");
        var w = el.offsetWidth, h = el.offsetHeight;
        var pref = el.dataset.prefTop.indexOf("%") > 0 ? aH * parseFloat(el.dataset.prefTop) / 100 : parseFloat(el.dataset.prefTop);
        var side = el.dataset.side;
        var baseShow = parseFloat(getComputedStyle(el).getPropertyValue("--show")) || 0.55;
        var shows = [baseShow, baseShow * 0.75, baseShow * 0.55];
        var best = null;
        for (var s = 0; s < shows.length && !best; s++) {
          // 実際に顔を出した状態の形（傾きを含む）を測る
          var m = measure(el, shows[s]);
          var x = m.x, vis = m.w;
          var maxTop = Math.max(0, aH - h * 0.6);
          var minTop = -h * 0.6;
          var cands = [];
          for (var t = minTop; t <= maxTop; t += 10) cands.push(t);
          cands.sort(function (a, b) { return Math.abs(a - pref) - Math.abs(b - pref); });
          for (var c = 0; c < cands.length; c++) {
            var r = { x: x, y: aTop + cands[c] + m.dy, w: vis, h: m.h };
            var ok = texts.every(function (tr) { return !hit(r, tr, 16); }) &&
                     placed.every(function (p) { return !hit(r, p, 24); });
            if (ok) { best = { top: cands[c], show: shows[s], rect: r }; break; }
          }
        }
        if (best) {
          el.style.top = best.top + "px";
          if (best.show !== baseShow) el.style.setProperty("--show", best.show);
          placed.push(best.rect);
        } else {
          el.classList.add("is-skipped");
        }
      });
    });
  }

  var layoutTimer;
  function scheduleLayout() { clearTimeout(layoutTimer); layoutTimer = setTimeout(layout, 120); }
  window.addEventListener("resize", scheduleLayout);
  // 埋め込み（Xのポストなど）が読み込まれて高さが変わったときも置き直す
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(scheduleLayout);
    document.querySelectorAll("[data-peek-area]").forEach(function (a) { ro.observe(a); });
  }
  window.addEventListener("load", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  function start() { init(); layout(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
