// メニュー：押すとその項目までスクロール。今見ている項目を黄色で表示。
(function () {
  var button = document.querySelector(".menu-button");
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));

  function closeMenu() {
    document.body.classList.remove("nav-open");
    if (button) { button.setAttribute("aria-expanded", "false"); button.textContent = "メニュー"; }
  }
  if (button) {
    button.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "閉じる" : "メニュー";
    });
  }
  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      try { history.replaceState(null, "", a.getAttribute("href")); } catch (err) {}
      closeMenu();
    });
  });

  function setActive(id) {
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  function update() {
    var line = 120, current = chapters[0];
    chapters.forEach(function (c) { if (c.getBoundingClientRect().top <= line) current = c; });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = chapters[chapters.length - 1];
    if (current) setActive(current.id);
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
  if (location.hash) { var t = document.querySelector(location.hash); if (t) setTimeout(function () { t.scrollIntoView(); }, 50); }
})();

// トップのイラスト：カーソルに合わせて野菜が少しずつ動き、さわると跳ねる
(function () {
  var stage = document.querySelector(".hero__stage");
  if (!stage) return;
  var vegs = Array.prototype.slice.call(stage.querySelectorAll(".hero__veg"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function play(el, cls, ms) {
    el.classList.remove("is-jump", "is-wiggle");
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove(cls); }, ms);
  }

  // カーソルの位置に合わせて：全体は少し視線を追い、カーソルの近くの野菜はよけるように動く
  function move(px, py) {
    if (reduce) return;
    var box = stage.getBoundingClientRect();
    var nx = (px - box.left) / box.width - 0.5, ny = (py - box.top) / box.height - 0.5;
    vegs.forEach(function (v) {
      var r = v.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = cx - px, dy = cy - py, dist = Math.hypot(dx, dy) || 1;
      var depth = parseFloat(v.dataset.depth) || 1;
      var reach = box.width * 0.22;
      var push = Math.max(0, 1 - dist / reach) * 18 * depth;
      var x = nx * 14 * depth + (dx / dist) * push;
      var y = ny * 14 * depth + (dy / dist) * push;
      v.style.setProperty("--x", x.toFixed(1) + "px");
      v.style.setProperty("--y", y.toFixed(1) + "px");
      v.style.setProperty("--r", (nx * 6 * depth + (dx / dist) * push * 0.4).toFixed(1) + "deg");
    });
  }
  function reset() {
    vegs.forEach(function (v) { v.style.removeProperty("--x"); v.style.removeProperty("--y"); v.style.removeProperty("--r"); });
  }
  stage.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") move(e.clientX, e.clientY); });
  stage.addEventListener("pointerleave", reset);

  vegs.forEach(function (v) {
    v.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") play(v, "is-wiggle", 650); });
    v.addEventListener("click", function () { play(v, "is-jump", 800); });
  });
  // イラストの何もないところを押すと、みんなで順番に跳ねる
  stage.addEventListener("click", function (e) {
    if (e.target.classList.contains("hero__veg")) return;
    vegs.forEach(function (v, i) { setTimeout(function () { play(v, "is-jump", 800); }, i * 70); });
  });
})();

// スクロールで写真がぽんっと出てくる
(function () {
  var els = document.querySelectorAll("main .photo, main .badge-list img, main .card");
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  Array.prototype.forEach.call(els, function (el, i) {
    el.classList.add("pop");
    el.style.transitionDelay = (i % 3) * 0.08 + "s";
    io.observe(el);
  });
})();

// スマホ：横にスワイプできる写真の列に「スワイプ →」の案内を付ける
(function () {
  var mq = window.matchMedia("(max-width: 640px)");
  var sel = ".grid-3, .grid-2, .row, .pair, .goods-pair, .project-photos";
  function apply() {
    document.querySelectorAll(sel).forEach(function (row) {
      var next = row.nextElementSibling;
      var has = next && next.classList.contains("swipe-hint");
      var need = mq.matches && row.scrollWidth > row.clientWidth + 4;
      if (need && !has) {
        var p = document.createElement("p");
        p.className = "swipe-hint"; p.textContent = "スワイプで次の写真へ →";
        row.parentNode.insertBefore(p, row.nextSibling);
      } else if (!need && has) next.remove();
    });
  }
  window.addEventListener("load", apply);
  window.addEventListener("resize", apply);
})();

// 大きなボタン：カーソルを当てると、のぞいている野菜の顔が変わる
(function () {
  document.querySelectorAll(".tile").forEach(function (tile) {
    var veg = tile.querySelector(".tile__veg");
    if (!veg || !veg.dataset.hover) return;
    var idle = veg.getAttribute("src"), hover = veg.dataset.hover;
    new Image().src = hover;
    tile.addEventListener("pointerenter", function () { veg.src = hover; });
    tile.addEventListener("pointerleave", function () { veg.src = idle; });
  });
})();
