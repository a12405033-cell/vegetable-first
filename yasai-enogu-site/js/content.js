// お知らせ（data/news.js）と活動記録（data/activity.js）をページに表示する
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // [[強調]] と改行
  function rich(s) {
    return esc(s).replace(/\[\[(.+?)\]\]/g, '<em class="hl">$1</em>').replace(/\n/g, "<br>");
  }

  // ---- お知らせ ----
  var newsBox = document.getElementById("news-list");
  if (newsBox && window.NEWS) {
    var max = parseInt(newsBox.getAttribute("data-max"), 10) || 5;
    newsBox.innerHTML = window.NEWS.slice(0, max).map(function (n) {
      var ext = /^https?:/.test(n.link || "");
      var inner = '<span class="news__date">' + esc(n.date) + '</span>' +
        (n.tag ? '<span class="news__tag">' + esc(n.tag) + '</span>' : "") +
        '<span class="news__title">' + esc(n.title) + '</span>' +
        (n.link ? '<span class="news__arrow" aria-hidden="true">→</span>' : "");
      return n.link
        ? '<li><a class="news__item" href="' + esc(n.link) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '>' + inner + '</a></li>'
        : '<li><div class="news__item">' + inner + '</div></li>';
    }).join("");
  }

  // ---- 活動記録 ----
  var actBox = document.getElementById("activity-list");
  if (actBox && window.ACTIVITIES) {
    // 野菜キャラクター（玉ねぎ・トマト・にんじんを順番に、顔も少しずつ変える）
    var FACES = {
      onion: ["onion-smirk", "onion-calm", "onion-tongue", "onion-grumpy", "onion-5"],
      tomato: ["tomato-blush", "tomato-wink", "tomato-sparkle", "tomato-squint", "tomato-worried"],
      carrot: ["carrot-happy", "carrot-smile", "carrot-wink", "carrot-surprised", "carrot-squint"]
    };
    var KINDS = ["onion", "tomato", "carrot"];
    function peek(i) {
      var kind = KINDS[i % 3], f = FACES[kind], n = Math.floor(i / 3) + 2;
      var idle = "images/veg/" + f[n % 5] + ".webp", hover = "images/veg/" + f[(n + 2) % 5] + ".webp";
      var side = i % 2 ? "left" : "right", top = i % 2 ? "45%" : "0px";
      return '<div class="veg-peek" data-side="' + side + '" style="top: ' + top + '" data-enter="' + idle +
        '" data-idle="' + idle + '" data-poke="' + hover + '" aria-hidden="true"><div class="veg-peek__body"><img src="' +
        idle + '" alt=""></div></div>';
    }
    function rows(photos) {
      var out = "";
      for (var i = 0; i < photos.length; i += 3) {
        out += '<div class="row">' + photos.slice(i, i + 3).map(function (p) {
          var r = p.tall ? 0.72 : 1.333;
          return '<figure class="photo" style="flex:' + r + ';aspect-ratio:' + r + '"><img src="' + esc(p.src) +
            '" alt="' + esc(p.alt) + '" loading="lazy"></figure>';
        }).join("") + "</div>";
      }
      return out;
    }
    actBox.innerHTML = window.ACTIVITIES.map(function (a, i) {
      return '<section class="section" data-peek-area' + (a.id ? ' id="' + esc(a.id) + '"' : "") + '>\n<div class="container">\n' +
        '<h2><span class="mark">' + esc(a.title) + '</span>' + (a.date ? ' <span class="sub">' + esc(a.date) + '</span>' : "") + '</h2>\n' +
        (a.label ? '<p class="label">' + esc(a.label) + '</p>\n' : "") +
        (a.text ? '<div class="text"><p>' + rich(a.text) + '</p></div>\n' : "") +
        rows(a.photos || []) + '\n</div>\n' + peek(i) + '</section>\n';
    }).join("");
  }
})();
