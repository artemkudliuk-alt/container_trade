/* =========================================================
   Container Trade — скрипты (jQuery 4 + Swiper 11)
   ========================================================= */
(function ($) {
  'use strict';

  var MOBILE = '(max-width: 1023px)';
  var mqMobile = window.matchMedia(MOBILE);
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $body = $('body');
  var $overlay = $('[data-overlay]');

  /* ---------- Затемнение + блокировка прокрутки ---------- */
  var overlayOwners = {};
  function overlay(owner, on) {
    if (on) { overlayOwners[owner] = true; } else { delete overlayOwners[owner]; }
    var any = Object.keys(overlayOwners).length > 0;
    $overlay.toggleClass('is-visible', any);
    $body.toggleClass('is-locked', any);
  }

  /* ---------- Закреплённая шапка: плотный фон после прокрутки ---------- */
  function initStickyHeader() {
    var check = function () { $body.toggleClass('is-scrolled', window.scrollY > 10); };
    $(window).on('scroll', check);
    check();
  }

  /* ---------- Видео первого экрана ---------- */
  function initHeroVideo() {
    var v = $('[data-hero-video]')[0];
    if (!v) { return; }
    var saveData = navigator.connection && navigator.connection.saveData;
    // «уменьшить движение» или экономия трафика — только первый кадр (фон блока)
    if (saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.removeAttribute('autoplay');
      v.remove();
      return;
    }
    // вне экрана — пауза, чтобы не грузить процессор и батарею
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { v.play().catch(function () {}); } else { v.pause(); }
      }).observe(v);
    }
  }

  /* =========================================================
     Бегущая строка преимуществ: смена раз в 2 секунды
     ========================================================= */
  function initTicker() {
    var $ticker = $('.ticker');
    if (!$ticker.length) { return; }
    var $list = $ticker.find('.ticker__list');
    var count = $list.children().length;
    var index = 0;
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

    $list.append($list.children().first().clone().attr('aria-hidden', 'true'));

    setInterval(function () {
      if (document.hidden) { return; }
      index += 1;
      $list.css('transform', 'translateY(' + (-index * $ticker.height()) + 'px)');
      if (index === count) {
        setTimeout(function () {
          $list.css('transition', 'none').css('transform', 'translateY(0)');
          void $list[0].offsetHeight;
          $list.css('transition', '');
          index = 0;
        }, 650);
      }
    }, 2000);
  }

  /* =========================================================
     Выпадающие меню шапки (десктоп): наведение + клик
     ========================================================= */
  function initDropdowns() {
    var $dds = $('[data-dd]');

    function open($dd) {
      $dds.not($dd).each(function () { close($(this)); });
      $dd.addClass('is-open').find('[data-dd-toggle]').first().attr('aria-expanded', 'true');
    }
    function close($dd) {
      if (!$dd.hasClass('is-open')) { return; }
      $dd.removeClass('is-open').find('[data-dd-toggle]').first().attr('aria-expanded', 'false');
      resetMega($dd);
    }

    $dds.each(function () {
      var $dd = $(this);
      var timer;
      if (canHover) {
        $dd.on('mouseenter', function () {
          if (mqMobile.matches) { return; }
          clearTimeout(timer);
          open($dd);
        }).on('mouseleave', function () {
          clearTimeout(timer);
          timer = setTimeout(function () { close($dd); }, 180);
        });
      }
      $dd.find('[data-dd-toggle]').first().on('click', function (e) {
        // телефон: на устройствах с мышью ссылка звонит, на тач — сначала раскрывает список
        if (this.tagName === 'A' && canHover) { return; }
        e.preventDefault();
        if ($dd.hasClass('is-open')) { close($dd); } else { open($dd); }
      });
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('[data-dd]').length) { $dds.each(function () { close($(this)); }); }
    }).on('keydown', function (e) {
      if (e.key === 'Escape') { $dds.each(function () { close($(this)); }); }
    });

    // Мега-меню: второй уровень
    $('[data-mega]').on('click', '[data-sub]', function (e) {
      e.preventDefault();
      var $mega = $(this).closest('[data-mega]');
      $mega.find('[data-level]').attr('hidden', true);
      $mega.find('[data-level="' + $(this).data('sub') + '"]').removeAttr('hidden');
    }).on('click', '[data-back]', function () {
      resetMega($(this).closest('[data-dd]'));
    });

    function resetMega($dd) {
      var $mega = $dd.find('[data-mega]');
      if (!$mega.length) { return; }
      setTimeout(function () {
        if ($dd.hasClass('is-open')) { return; }
        $mega.find('[data-level]').attr('hidden', true);
        $mega.find('[data-level="root"]').removeAttr('hidden');
      }, 200);
    }
  }

  /* =========================================================
     Меню по бургеру
     ========================================================= */
  function initMobileMenu() {
    var $menu = $('[data-mmenu]');
    var $toggle = $('[data-menu-toggle]');
    if (!$menu.length) { return; }

    function setOpen(on) {
      $menu.toggleClass('is-open', on);
      $toggle.toggleClass('is-active', on).attr('aria-expanded', String(on));
      overlay('menu', on);
      if (!on) {
        showLevel('root');
        $menu.find('[data-pop-panel]').removeClass('is-open');
      }
    }
    function showLevel(name) {
      $menu.find('[data-mlevel]').attr('hidden', true);
      $menu.find('[data-mlevel="' + name + '"]').removeAttr('hidden');
      $menu.scrollTop(0);
    }

    $toggle.on('click', function () { setOpen(!$menu.hasClass('is-open')); });
    $menu.on('click', '[data-msub]', function (e) {
      e.preventDefault();
      showLevel($(this).data('msub'));
    }).on('click', '[data-mback]', function () {
      showLevel('root');
    }).on('click', '[data-pop]', function (e) {
      e.stopPropagation();
      var name = $(this).data('pop');
      var $p = $menu.find('[data-pop-panel="' + name + '"]');
      $menu.find('[data-pop-panel]').not($p).removeClass('is-open');
      $p.toggleClass('is-open');
    }).on('click', '[data-pop-panel]', function (e) {
      e.stopPropagation();
      if ($(e.target).closest('button, .mmenu__pop-head').length) { $(this).removeClass('is-open'); }
    }).on('click', function () {
      $menu.find('[data-pop-panel]').removeClass('is-open');
    });

    $overlay.on('click', function () { setOpen(false); });
    $(document).on('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); } });
    $(document).on('modal:open', function () { setOpen(false); });
    // при переходе на широкий экран без бургера — закрыть
    window.matchMedia('(max-width: 1439px)').addEventListener('change', function (e) { if (!e.matches) { setOpen(false); } });
  }

  /* =========================================================
     Модальные окна
     ========================================================= */
  function initModals() {
    var $current = null;
    var lastFocus = null;

    function openModal(name) {
      var $m = $('[data-modal="' + name + '"]');
      if (!$m.length) { return; }
      $(document).trigger('modal:open');
      if ($current) { $current.removeClass('is-open'); }
      lastFocus = document.activeElement;
      $current = $m.addClass('is-open');
      overlay('modal', true);
      $overlay.toggleClass('is-top', $m.hasClass('modal--sm'));
      $('.header [data-modal-open]').removeClass('is-active').filter('[data-modal-open="' + name + '"]').addClass('is-active');
      // фокус: в форме — на первое поле (кроме тач-устройств, чтобы не выскакивала клавиатура), иначе на само окно
      var $field = $m.find('form input:not([type=hidden])').first();
      if ($field.length && canHover && name !== 'search') { $field.trigger('focus'); } else { $m.trigger('focus'); }
      $m.trigger('modal:shown');
    }
    function closeModal() {
      if (!$current) { return; }
      $current.removeClass('is-open');
      $current = null;
      overlay('modal', false);
      $overlay.removeClass('is-top');
      $('.header [data-modal-open]').removeClass('is-active');
      if (lastFocus) { lastFocus.focus(); }
    }

    $(document).on('click', '[data-modal-open]', function (e) {
      e.preventDefault();
      var name = $(this).data('modal-open');
      // повторный клик по той же кнопке закрывает окно
      if ($current && $current.is('[data-modal="' + name + '"]')) { closeModal(); } else { openModal(name); }
    }).on('click', '[data-modal-close]', closeModal)
      .on('keydown', function (e) { if (e.key === 'Escape') { closeModal(); } });
    $overlay.on('click', closeModal);

    window.CT = window.CT || {};
    window.CT.openModal = openModal;
    window.CT.closeModal = closeModal;
  }

  /* =========================================================
     Свой выпадающий список поверх нативного <select> (listbox)
     ========================================================= */
  function initSelects() {
    var uid = 0;
    $('[data-select]').each(function () {
      var $w = $(this), sel = $w.find('select')[0];
      if (!sel) { return; }
      var id = 'cs-' + (++uid);
      var label = $w.find('.visually-hidden').first().text();
      var $btn = $('<button class="select__btn" type="button" aria-haspopup="listbox" aria-expanded="false"></button>')
        .attr({ 'aria-controls': id, 'aria-label': label });
      var $list = $('<ul class="select__list" role="listbox" tabindex="-1"></ul>').attr({ id: id, 'aria-label': label });
      $.each(sel.options, function (i, o) {
        $('<li class="select__opt" role="option"></li>').attr('id', id + '-' + i).text(o.text).appendTo($list);
      });
      $(sel).attr({ tabindex: -1, 'aria-hidden': 'true' }).after($btn, $list);
      $w.addClass('is-enhanced');

      var $opts = $list.children(), active = -1;
      function sync() {
        $btn.text(sel.options[sel.selectedIndex].text);
        $opts.attr('aria-selected', 'false').eq(sel.selectedIndex).attr('aria-selected', 'true');
      }
      function setActive(i) {
        active = Math.max(0, Math.min($opts.length - 1, i));
        $opts.removeClass('is-active').eq(active).addClass('is-active');
        $btn.attr('aria-activedescendant', id + '-' + active);
        var el = $opts[active];
        if (el.offsetTop < $list[0].scrollTop || el.offsetTop + el.offsetHeight > $list[0].scrollTop + $list[0].clientHeight) {
          el.scrollIntoView({ block: 'nearest' });
        }
      }
      function open() {
        $('[data-select].is-open').not($w).each(function () { $(this).data('close')(); });
        // мало места снизу — раскрыть вверх
        var r = $w[0].getBoundingClientRect();
        $w.toggleClass('is-up', window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom);
        $w.addClass('is-open');
        $btn.attr('aria-expanded', 'true');
        setActive(sel.selectedIndex);
      }
      function close() {
        $w.removeClass('is-open');
        $btn.attr('aria-expanded', 'false').removeAttr('aria-activedescendant');
      }
      function choose(i) {
        if (sel.selectedIndex !== i) {
          sel.selectedIndex = i;
          $(sel).trigger('change');
        }
        sync();
        close();
        $btn.trigger('focus');
      }
      $w.data('close', close);

      $btn.on('click', function () { if ($w.hasClass('is-open')) { close(); } else { open(); } })
        .on('keydown', function (e) {
          var isOpen = $w.hasClass('is-open');
          switch (e.key) {
            case 'ArrowDown': case 'ArrowUp':
              e.preventDefault();
              if (!isOpen) { open(); } else { setActive(active + (e.key === 'ArrowDown' ? 1 : -1)); }
              break;
            case 'Home': case 'End':
              if (isOpen) { e.preventDefault(); setActive(e.key === 'Home' ? 0 : $opts.length - 1); }
              break;
            case 'Enter': case ' ':
              e.preventDefault();
              if (isOpen) { choose(active); } else { open(); }
              break;
            case 'Escape':
              if (isOpen) { e.stopPropagation(); close(); }
              break;
            case 'Tab':
              close();
              break;
          }
        });
      $list.on('mousedown', function (e) { e.preventDefault(); }) // фокус остаётся на кнопке
        .on('click', '.select__opt', function () { choose($opts.index(this)); })
        .on('mousemove', '.select__opt', function () { var i = $opts.index(this); if (i !== active) { setActive(i); } });
      $(sel).on('change', sync);
      $(document).on('click', function (e) { if (!$w[0].contains(e.target)) { close(); } });
      sync();
    });
  }

  /* ---------- Поиск (демо-логика для вёрстки) ---------- */
  function initSearch() {
    var $m = $('[data-modal="search"]');
    var $input = $m.find('[data-search-input]');

    function state(name) {
      $m.attr('data-state', name).find('[data-search-state]').attr('hidden', true);
      $m.find('[data-search-state="' + name + '"]').removeAttr('hidden');
    }
    function run(q) {
      q = String(q || "").trim();
      if (!q) { state('recent'); return; }
      // в вёрстке: «пустын…» показывает пустой результат, остальное — список
      state(/пустын/i.test(q) ? 'empty' : 'results');
    }

    $m.on('submit', '[data-search-form]', function (e) { e.preventDefault(); run($input.val()); })
      .on('click', '[data-search-query]', function () { var q = $(this).data('search-query'); $input.val(q); run(q); })
      .on('click', '[data-recent-del]', function () { $(this).closest('li').remove(); })
      .on('input', '[data-search-input]', function () { if (!this.value) { state('recent'); } });
  }

  /* ---------- Корзина (демо-логика для вёрстки) ---------- */
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) { return one; }
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) { return few; }
    return many;
  }
  function initCart() {
    var $m = $('[data-modal="cart"]');
    if (!$m.length) { return; }

    function recalc() {
      var sum = 0, qty = 0;
      var $items = $m.find('[data-cart-item]');
      $items.each(function () {
        var $it = $(this);
        var q = Math.max(1, Math.min(99, parseInt($it.find('[data-qty-val]').val(), 10) || 1));
        $it.find('[data-qty-val]').val(q);
        $it.find('[data-qty="-1"]').prop('disabled', q <= 1);
        var p = q * Number($it.data('price'));
        $it.find('[data-cart-price]').text(p + '$');
        sum += p; qty += q;
      });
      $m.find('[data-cart-sum]').text(sum);
      $('[data-cart-count]').text($items.length || '');
      var empty = $items.length === 0;
      $m.toggleClass('is-empty', empty);
      $m.find('[data-cart-full]').prop('hidden', empty);
      $m.find('[data-cart-empty]').prop('hidden', !empty);
      $m.find('[data-cart-title]')
        .text(empty ? 'Корзина пуста' : 'В корзине ' + qty + ' ' + plural(qty, 'товар', 'товара', 'товаров'))
        .toggleClass('modal__title--lg', empty);
      if (empty) { $m.find('[data-slider]').each(function () { if (this.swiper) { this.swiper.update(); } }); }
    }

    $m.on('click', '[data-qty]', function () {
      var $val = $(this).closest('.qty').find('[data-qty-val]');
      $val.val((parseInt($val.val(), 10) || 1) + Number($(this).data('qty')));
      recalc();
    }).on('change', '[data-qty-val]', recalc)
      .on('click', '[data-cart-del]', function () { $(this).closest('[data-cart-item]').remove(); recalc(); })
      .on('modal:shown', function () { $m.find('[data-slider]').each(function () { if (this.swiper) { this.swiper.update(); } }); });
    recalc();
  }

  /* ---------- Обратная связь ---------- */
  function initFeedback() {
    $('[data-feedback-form]').on('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $(this).find('[required]').each(function () {
        var valid = this.checkValidity() && String(this.value).trim() !== '';
        $(this).closest('.form__field').toggleClass('is-error', !valid);
        if (!valid) { ok = false; }
      });
      if (!ok) { $(this).find('.is-error input').first().trigger('focus'); return; }
      this.reset();
      window.CT.openModal('success');
    }).on('input', 'input, textarea', function () {
      $(this).closest('.form__field').removeClass('is-error');
    });
  }

  /* =========================================================
     Слайдеры (Swiper): без автопрокрутки, с зацикливанием,
     одна точка — одна «страница»
     ========================================================= */
  function swiperOpts($slider, extra) {
    return $.extend(true, {
      loop: true,
      speed: 400,
      watchOverflow: true,
      pagination: {
        el: $slider.find('[data-dots]')[0],
        clickable: true,
        bulletElement: 'button',
        bulletClass: 'dot',
        bulletActiveClass: 'is-active'
      },
      navigation: {
        prevEl: $slider.find('[data-prev]')[0] || null,
        nextEl: $slider.find('[data-next]')[0] || null
      },
      a11y: { prevSlideMessage: 'Назад', nextSlideMessage: 'Вперёд', paginationBulletMessage: 'Страница {{index}}' }
    }, extra);
  }

  function initSliders() {
    if (typeof window.Swiper === 'undefined') { return; }

    // «Новинки» и «Вас может заинтересовать» — всегда слайдер
    $('[data-slider="novelty"]').each(function () {
      var $s = $(this);
      new window.Swiper($s.find('.swiper')[0], swiperOpts($s, {
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 8,
        breakpoints: { 1280: { slidesPerView: 2, slidesPerGroup: 2 } }
      }));
    });

    // Отзывы, блог, партнёры — слайдер только на мобильном, на десктопе сетка
    var mobileSliders = [];
    function toggleMobileSliders() {
      if (mqMobile.matches && !mobileSliders.length) {
        $('[data-slider="cards"]').each(function () {
          var $s = $(this);
          mobileSliders.push(new window.Swiper($s.find('.swiper')[0], swiperOpts($s, {
            slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 8
          })));
        });
        $('[data-slider="partners"]').each(function () {
          var $s = $(this);
          mobileSliders.push(new window.Swiper($s.find('.swiper')[0], swiperOpts($s, {
            slidesPerView: 'auto', slidesPerGroup: 2, spaceBetween: 1
          })));
        });
      } else if (!mqMobile.matches && mobileSliders.length) {
        $.each(mobileSliders, function (i, sw) { sw.destroy(true, true); });
        mobileSliders = [];
        $('[data-slider="cards"], [data-slider="partners"]').find('[data-dots]').empty();
      }
    }
    toggleMobileSliders();
    mqMobile.addEventListener('change', toggleMobileSliders);
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    $('.faq__list').on('click', '.faq__q', function () {
      var $item = $(this).closest('.faq__item');
      var open = !$item.hasClass('is-open');
      $item.toggleClass('is-open', open);
      $(this).attr('aria-expanded', String(open));
    });
  }

  /* ---------- Аккордеон подвала (мобильный) ---------- */
  function initFooter() {
    $('.footer').on('click', '.footer__title', function () {
      if (!mqMobile.matches) { return; }
      var $col = $(this).closest('.footer__col');
      var open = !$col.hasClass('is-open');
      $col.toggleClass('is-open', open);
      $(this).attr('aria-expanded', String(open));
    });
  }

  // ---------- Каталог: фильтр и сортировка ----------
  function initFilters() {
    var $f = $('[data-filters]');
    if (!$f.length) return;
    var $chips = $f.find('[data-chips]');
    var chipX = '<span class="ico ico--chipx" aria-hidden="true"></span>';

    // Свернуть / развернуть панель (планшет и мобильный)
    function setOpen(open) {
      $f.toggleClass('is-open', open);
      $f.find('[data-filters-toggle]').attr({
        'aria-expanded': String(open),
        'aria-label': open ? 'Скрыть фильтр' : 'Показать фильтр'
      });
    }
    $f.on('click', '[data-filters-toggle]', function () { setOpen(!$f.hasClass('is-open')); });
    $(document).on('click', function (e) {
      if ($f.hasClass('is-open') && e.target.isConnected && !$(e.target).closest('[data-filters]').length) setOpen(false);
    });
    $(document).on('keydown', function (e) { if (e.key === 'Escape' && $f.hasClass('is-open')) setOpen(false); });

    // Группы
    function badge($g) {
      var n = $g.find('input:checked').length;
      $g.find('[data-badge]').text(n || '').prop('hidden', !n || $g.hasClass('is-open'));
    }
    $f.on('click', '.fgroup__head', function () {
      var $g = $(this).closest('[data-fgroup]');
      var open = !$g.hasClass('is-open');
      $g.toggleClass('is-open', open);
      $(this).attr('aria-expanded', String(open));
      badge($g);
    });

    // Отметки → «чипсы» выбранных значений
    $f.on('change', 'input[type=checkbox]', function () {
      var id = this.id;
      var $chip = $chips.find('[data-chip="' + id + '"]');
      if (this.checked && !$chip.length) {
        var text = $(this).siblings('.check__label').text();
        $('<span class="chip"></span>').attr('data-chip', id).text(text)
          .append($('<button class="chip__x" type="button"></button>').attr('aria-label', 'Убрать «' + text + '»').html(chipX))
          .appendTo($chips);
      } else if (!this.checked) {
        $chip.remove();
      }
      badge($(this).closest('[data-fgroup]'));
    });
    $f.on('click', '.chip__x', function () {
      var id = $(this).closest('.chip').attr('data-chip');
      $('#' + id).prop('checked', false).trigger('change');
    });
    $f.on('click', '.filters__reset', function () {
      $f.find('input[type=checkbox]').prop('checked', false);
      $chips.empty();
      $f.find('[data-fgroup]').each(function () { badge($(this)); });
    });
    $f.on('submit', 'form', function (e) { e.preventDefault(); setOpen(false); });

    // Сортировка
    $('[data-sort]').on('click', '.sort__link', function (e) {
      e.preventDefault();
      $(this).addClass('is-active').attr('aria-current', 'true')
        .siblings('.sort__link').removeClass('is-active').removeAttr('aria-current');
    });
  }

  // ---------- Карточка товара ----------
  function initProduct() {
    // Галерея: миниатюры и стрелки
    var $g = $('[data-gallery]');
    if ($g.length) {
      var $main = $g.find('[data-gallery-main]');
      var $thumbs = $g.find('.pd__thumb');
      var show = function (i) {
        i = (i + $thumbs.length) % $thumbs.length;
        var $t = $thumbs.eq(i);
        if ($t.hasClass('is-active')) return;
        $thumbs.removeClass('is-active');
        $t.addClass('is-active');
        $t[0].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        $main.addClass('is-fading');
        setTimeout(function () { $main.attr('src', $t.attr('data-src')).removeClass('is-fading'); }, 150);
      };
      var current = function () { return $thumbs.index($thumbs.filter('.is-active')); };
      $thumbs.on('click', function () { show($thumbs.index(this)); });
      $g.find('[data-gallery-prev]').on('click', function () { show(current() - 1); });
      $g.find('[data-gallery-next]').on('click', function () { show(current() + 1); });

      // Фото на весь экран: стрелки, клавиши ←/→, свайп; при закрытии галерея встаёт на то же фото
      var lb = $g.find('[data-lightbox]')[0];
      if (lb && lb.showModal) {
        var $lb = $(lb), $lbImg = $lb.find('[data-lb-img]'), idx = 0;
        var lbShow = function (i) {
          idx = (i + $thumbs.length) % $thumbs.length;
          var src = $thumbs.eq(idx).attr('data-src');
          $lb.find('[data-lb-count]').text((idx + 1) + ' / ' + $thumbs.length);
          if ($lbImg.attr('src') === src) return;
          $lbImg.addClass('is-fading');
          setTimeout(function () { $lbImg.attr('src', src).removeClass('is-fading'); }, 150);
        };
        $g.find('[data-lb-open]').on('click', function () {
          lbShow(current());
          lb.showModal();
          $body.addClass('is-locked');
        });
        $lb.on('click', '[data-lb-prev]', function () { lbShow(idx - 1); })
          .on('click', '[data-lb-next]', function () { lbShow(idx + 1); })
          .on('click', '[data-lb-close]', function () { lb.close(); })
          .on('click', '[data-lb-stage]', function (e) { // клик мимо фото (но не конец свайпа)
            if (e.target === this && !swiped) lb.close();
            swiped = false;
          })
          .on('keydown', function (e) {
            if (e.key === 'ArrowLeft') lbShow(idx - 1);
            if (e.key === 'ArrowRight') lbShow(idx + 1);
          })
          .on('close', function () { $body.removeClass('is-locked'); show(idx); });
        var x0 = null, swiped = false;
        $lb.on('pointerdown', '[data-lb-stage]', function (e) { x0 = e.clientX; swiped = false; })
          .on('pointerup', '[data-lb-stage]', function (e) {
            if (x0 === null) return;
            var dx = e.clientX - x0;
            x0 = null;
            swiped = Math.abs(dx) > 40;
            if (swiped) lbShow(dx < 0 ? idx + 1 : idx - 1);
          });
      }
    }

    // Количество (основной блок и плавающая панель синхронизированы)
    var $qty = $('[data-qty]');
    var setQty = function (n) {
      n = Math.max(1, Math.min(99, parseInt(n, 10) || 1));
      $qty.find('[data-qty-val]').val(n);
      $qty.find('[data-qty-minus]').prop('disabled', n <= 1);
    };
    $qty.on('click', '[data-qty-minus]', function () { setQty(+$(this).siblings('[data-qty-val]').val() - 1); });
    $qty.on('click', '[data-qty-plus]', function () { setQty(+$(this).siblings('[data-qty-val]').val() + 1); });
    $qty.on('change', '[data-qty-val]', function () { setQty(this.value); });

    // Все параметры
    $('[data-params-toggle]').on('click', function () {
      var open = $(this).attr('aria-expanded') !== 'true';
      $('[data-params-more]').prop('hidden', !open);
      $(this).attr('aria-expanded', String(open)).find('span').text(open ? 'Скрыть параметры' : 'Показать все параметры');
    });

    // Заказ в 1 клик (демо)
    $('[data-oneclick]').on('submit', function (e) {
      e.preventDefault();
      var $f = $(this), $in = $f.find('input');
      if (String($in.val()).replace(/\D/g, '').length < 10) { $in.trigger('focus'); return; }
      $f.addClass('is-sent').find('button').text('Мы перезвоним');
    });

    // Плавающая панель покупки
    var $buy = $('[data-pd-buy]'), $bar = $('[data-pd-bar]');
    if ($buy.length && $bar.length) {
      var $body = $('body');
      var check = function () {
        var r = $buy[0].getBoundingClientRect();
        var on = r.bottom < 90;
        if (on !== $body.hasClass('is-pd-bar')) {
          $body.toggleClass('is-pd-bar', on);
          $bar.prop('inert', !on);
        }
      };
      $(window).on('scroll resize', check);
      check();
    }
  }

  // ---------- Оформление заказа ----------
  function initCheckout() {
    var $o = $('[data-osum]');
    if ($o.length) {
      var setOpen = function (open) {
        $o.toggleClass('is-open', open);
        $o.find('[data-osum-toggle]').attr({ 'aria-expanded': String(open), 'aria-label': open ? 'Скрыть заказ' : 'Показать заказ' });
      };
      $o.on('click', '[data-osum-toggle]', function () { setOpen(!$o.hasClass('is-open')); });
      $(document).on('click', function (e) {
        if ($o.hasClass('is-open') && e.target.isConnected && !$(e.target).closest('[data-osum]').length) setOpen(false);
      });
    }

    $('[data-checkout]').on('submit', function (e) {
      var ok = true, $first = null;
      $(this).find('.form__field [required]').each(function () {
        var valid = this.checkValidity() && String(this.value).trim() !== '';
        $(this).closest('.form__field').toggleClass('is-error', !valid);
        if (!valid && !$first) $first = $(this);
        ok = ok && valid;
      });
      var $agree = $(this).find('[name=agree]');
      $agree.closest('.check').toggleClass('is-error', !$agree.prop('checked'));
      if (!$agree.prop('checked')) { ok = false; $first = $first || $agree; }
      e.preventDefault();
      if (!ok) { $first.trigger('focus'); return; }
      // Демо: в OpenCart здесь будет отправка заказа
      window.location.href = this.getAttribute('action');
    }).on('input change', 'input, textarea', function () {
      $(this).closest('.form__field, .check').removeClass('is-error');
    });
  }

  $(function () {
    initStickyHeader();
    initHeroVideo();
    initTicker();
    initDropdowns();
    initMobileMenu();
    initModals();
    initSelects();
    initSearch();
    initCart();
    initFeedback();
    initSliders();
    initFaq();
    initFooter();
    initFilters();
    initProduct();
    initCheckout();
  });
}(jQuery));
