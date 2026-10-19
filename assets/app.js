(function () {
  // 배경 효과
  var fx = document.createElement('div');
  fx.className = 'bg-fx';
  fx.innerHTML = '<div class="grid-fx"></div><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>';
  document.body.prepend(fx);

  // 스크롤하면 나타나기
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // 페이지 전환 (View Transition을 지원하지 않는 브라우저용)
  if (!('onpagereveal' in window)) {
    document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        if (ev.metaKey || ev.ctrlKey || a.target === '_blank') return;
        ev.preventDefault();
        document.body.classList.add('leaving');
        setTimeout(function () { location.href = a.href; }, 280);
      });
    });
  }
  window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });

  // 카드 기울이기 + 빛 따라오기
  document.querySelectorAll('.topic').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%');
      card.style.setProperty('--my', y * 100 + '%');
      card.style.transform = 'rotateY(' + (x - 0.5) * 10 + 'deg) rotateX(' + (0.5 - y) * 10 + 'deg)';
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  });

  // 글자가 바뀌는 제목
  var rot = document.querySelector('.rotator .word');
  if (rot) {
    var words = JSON.parse(rot.dataset.words), wi = 0, ci = 0, del = false;
    (function tick() {
      var w = words[wi];
      ci += del ? -1 : 1;
      rot.textContent = w.slice(0, ci);
      var wait = del ? 50 : 110;
      if (!del && ci === w.length) { del = true; wait = 1600; }
      else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; wait = 300; }
      setTimeout(tick, wait);
    })();
  }

  // AI 대화 데모 (보일 때 타이핑)
  var chat = document.querySelector('.chat');
  if (chat) {
    var me = chat.querySelector('.bubble.me'), ai = chat.querySelector('.bubble.ai');
    var full = me.dataset.text; me.textContent = '';
    var cio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      cio.disconnect();
      var i = 0;
      (function type() {
        me.textContent = full.slice(0, ++i);
        if (i < full.length) setTimeout(type, 35);
        else setTimeout(function () { ai.classList.add('show'); }, 500);
      })();
    }, { threshold: 0.5 });
    cio.observe(chat);
  }

  // 흐름도 불 켜기
  document.querySelectorAll('.pipe').forEach(function (pipe) {
    var nodes = pipe.querySelectorAll('.node'), i = 0;
    setInterval(function () {
      nodes.forEach(function (n) { n.classList.remove('lit'); });
      nodes[i].classList.add('lit');
      i = (i + 1) % nodes.length;
    }, 900);
  });

  // 용어 카드 뒤집기 (터치용)
  document.querySelectorAll('.flip').forEach(function (f) {
    f.addEventListener('click', function () { f.classList.toggle('open'); });
  });

  // 슬라이드
  var cursorSvg = '<svg viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.querySelectorAll('[data-deck]').forEach(function (deck) {
    var track = deck.querySelector('.deck-track');
    var slides = [].slice.call(deck.querySelectorAll('.slide'));
    var prev = deck.querySelector('.prev'), next = deck.querySelector('.next-btn');
    var dots = deck.querySelector('.dots'), bar = deck.querySelector('.deck-progress i');
    var cur = 0;

    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', (i + 1) + '번 슬라이드');
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
      var mock = s.querySelector('.mock');
      if (mock && mock.querySelector('[data-target]')) {
        var c = document.createElement('div');
        c.className = 'cursor';
        c.innerHTML = cursorSvg;
        mock.appendChild(c);
      }
    });

    function placeCursor(s) {
      var mock = s.querySelector('.mock'), t = s.querySelector('[data-target]'), c = s.querySelector('.cursor');
      if (!mock || !t || !c) return;
      // offset 값은 확대·축소 효과의 영향을 받지 않음
      var x = 0, y = 0, el = t;
      while (el && el !== mock) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      c.style.setProperty('--sx', mock.offsetWidth * 0.85 + 'px');
      c.style.setProperty('--sy', mock.offsetHeight * 0.9 + 'px');
      c.style.setProperty('--tx', (x + t.offsetWidth * 0.55) + 'px');
      c.style.setProperty('--ty', (y + t.offsetHeight * 0.5) + 'px');
    }

    function go(i) {
      cur = Math.max(0, Math.min(slides.length - 1, i));
      track.style.transform = 'translateX(' + (-100 * cur) + '%)';
      slides.forEach(function (s, k) {
        s.classList.remove('active');
        s.setAttribute('aria-hidden', k !== cur);
      });
      var s = slides[cur];
      placeCursor(s);
      void s.offsetWidth; // 애니메이션 다시 시작
      s.classList.add('active');
      [].forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === cur); });
      prev.disabled = cur === 0;
      next.disabled = cur === slides.length - 1;
      bar.style.width = ((cur + 1) / slides.length * 100) + '%';
    }

    prev.addEventListener('click', function () { go(cur - 1); });
    next.addEventListener('click', function () { go(cur + 1); });
    deck.tabIndex = 0;
    deck.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') go(cur + 1);
      if (e.key === 'ArrowLeft') go(cur - 1);
    });
    var sx = null;
    deck.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
      sx = null;
    });
    window.addEventListener('resize', function () { placeCursor(slides[cur]); });
    go(0);
  });
})();
