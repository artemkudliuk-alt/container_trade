/* =========================================================
   Container Trade — карта наличия (модуль ctmap)
   Склады с контейнерами, расчёт стоимости и доставки до города.
   Карта — Leaflet + подложка CARTO (без ключа API).
   ========================================================= */
(function ($) {
  'use strict';

  var TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  // ponytail: тайлы OpenStreetMap — для вёрстки/небольшого трафика; на проде подставить подложку модуля (Google / свой ключ)
  var TILE_OPTS = { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' };
  function pin(cls) {
    return window.L.divIcon({ className: 'ctmap-pin ' + cls, html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 28], tooltipAnchor: [0, -28] });
  }
  var MAP_OPTS = function () {
    return { scrollWheelZoom: false, dragging: !window.L.Browser.mobile, tap: false }; // не перехватывать прокрутку страницы
  };

  /* =========================================================
     «Контакты»: склады на карте; клик по адресу — к метке
     ========================================================= */
  (function initStoresMap() {
    var el = $('[data-stores-map]')[0];
    if (!el) { return; }
    var L = window.L;
    if (!L) { $(el).addClass('is-nomap'); return; }
    var map = L.map(el, MAP_OPTS());
    L.tileLayer(TILES, TILE_OPTS).addTo(map);
    var $btns = $('[data-stores] [data-ll]'), marks = [];
    $btns.each(function (i) {
      var ll = String($(this).data('ll')).split(',').map(Number);
      marks.push(L.marker(ll, { icon: pin('ctmap-pin--store'), title: $(this).text().trim(), keyboard: false })
        .bindTooltip($(this).text().trim(), { direction: 'top' })
        .on('click', function () { focus(i, false); })
        .addTo(map));
    });
    function focus(i, fly) {
      $btns.removeClass('is-active').eq(i).addClass('is-active');
      $.each(marks, function (j, m) { $(m.getElement()).toggleClass('is-active', j === i); });
      if (fly) { map.flyTo(marks[i].getLatLng(), 13, { duration: .6 }); }
      marks[i].openTooltip();
    }
    map.fitBounds(L.featureGroup(marks).getBounds(), { padding: [48, 48] });
    $btns.on('click', function () {
      focus($btns.index(this), true);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }());

  /* =========================================================
     Главная: карта наличия (модуль ctmap)
     ========================================================= */
  var $root = $('[data-ctmap]');
  if (!$root.length) { return; }

  // ponytail: демо-данные для вёрстки; в OpenCart склады, остатки и цены отдаёт модуль
  var TYPES = {
    '20dv': { name: "20' Dry Van", k: 1, perTruck: 2 },
    '40dv': { name: "40' Dry Van", k: 1.45, perTruck: 1 },
    '40hc': { name: "40' High Cube", k: 1.6, perTruck: 1 },
    '20rf': { name: "20' Reefer", k: 3.4, perTruck: 2 },
    '40rf': { name: "40' Reefer", k: 4.9, perTruck: 1 }
  };
  var STORES = [
    { id: 'lviv', name: 'Скнилов-Лиски', city: 'Львов, Украина', ll: [49.8138, 23.9563], stock: 63, base: 1390 },
    { id: 'kyiv', name: 'Киев-Лиски', city: 'Киев, Украина', ll: [50.4128, 30.638], stock: 60, base: 1450 },
    { id: 'odesa', name: 'Од-Лиски', city: 'Одесса, Украина', ll: [46.517, 30.701], stock: 112, base: 1350 },
    { id: 'chm', name: 'Черноморск-Порт', city: 'Черноморск, Украина', ll: [46.3017, 30.6556], stock: 140, base: 1330 },
    { id: 'vin', name: 'Винница-Терминал', city: 'Винница, Украина', ll: [49.2331, 28.4682], stock: 24, base: 1420 },
    { id: 'khm', name: 'Хмельницкий-Депо', city: 'Хмельницкий, Украина', ll: [49.4229, 26.9871], stock: 18, base: 1400 },
    { id: 'dnipro', name: 'Днепр-Лиски', city: 'Днепр, Украина', ll: [48.4647, 35.0462], stock: 31, base: 1440 },
    { id: 'kh', name: 'Харьков-Депо', city: 'Харьков, Украина', ll: [49.9935, 36.2304], stock: 4, base: 1460 }
  ];
  var CITIES = [
    ['Киев', 'Киевская область', 50.4501, 30.5234], ['Житомир', 'Житомирская область', 50.2547, 28.6587],
    ['Львов', 'Львовская область', 49.8397, 24.0297], ['Одесса', 'Одесская область', 46.4825, 30.7233],
    ['Винница', 'Винницкая область', 49.2331, 28.4682], ['Хмельницкий', 'Хмельницкая область', 49.4229, 26.9871],
    ['Днепр', 'Днепропетровская область', 48.4647, 35.0462], ['Харьков', 'Харьковская область', 49.9935, 36.2304],
    ['Запорожье', 'Запорожская область', 47.8388, 35.1396], ['Полтава', 'Полтавская область', 49.5883, 34.5514],
    ['Черкассы', 'Черкасская область', 49.4444, 32.0598], ['Чернигов', 'Черниговская область', 51.4982, 31.2893],
    ['Сумы', 'Сумская область', 50.9077, 34.7981], ['Кропивницкий', 'Кировоградская область', 48.5079, 32.2623],
    ['Николаев', 'Николаевская область', 46.975, 31.9946], ['Херсон', 'Херсонская область', 46.6354, 32.6169],
    ['Ровно', 'Ровенская область', 50.6199, 26.2516], ['Луцк', 'Волынская область', 50.7472, 25.3254],
    ['Тернополь', 'Тернопольская область', 49.5535, 25.5948], ['Ивано-Франковск', 'Ивано-Франковская область', 48.9226, 24.7111],
    ['Ужгород', 'Закарпатская область', 48.6208, 22.2879], ['Черновцы', 'Черновицкая область', 48.2921, 25.9358],
    ['Черноморск', 'Одесская область', 46.3017, 30.6556], ['Белая Церковь', 'Киевская область', 49.7968, 30.1311]
  ];
  var ROAD = 1.25;                 // ponytail: дорога ≈ прямая × 1.25; реальный маршрут — от сервиса маршрутов модуля
  var TRIP_BASE = 115, TRIP_KM = 0.747; // рейс: подача + $/км (по расчёту в текущем модуле)
  var DAY_KM = 450;

  var $city = $root.find('[data-ctmap-city]');
  var $type = $root.find('[data-ctmap-type]');
  var $qty = $root.find('[data-ctmap-qty]');
  var $list = $root.find('[data-ctmap-list]');
  var $sum = $root.find('[data-ctmap-sum]');
  var $hint = $root.find('[data-ctmap-hint]');
  var selected = null;

  $root.find('datalist').html($.map(CITIES, function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join(''));

  /* ---------- Расчёт ---------- */
  function km(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
    var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.pow(Math.sin(dLon / 2), 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function money(n) { return '$' + Math.round(n).toLocaleString('ru-RU'); }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) { return one; }
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) { return few; }
    return many;
  }
  function findCity(q) {
    q = String(q || '').split(',')[0].trim().toLowerCase();
    if (!q) { return null; }
    for (var i = 0; i < CITIES.length; i++) { if (CITIES[i][0].toLowerCase() === q) { return CITIES[i]; } }
    return null;
  }
  function qty() {
    var n = Math.max(1, Math.min(99, parseInt($qty.val(), 10) || 1));
    $qty.val(n);
    $root.find('[data-ctmap-step="-1"]').prop('disabled', n <= 1);
    $root.find('[data-ctmap-step="1"]').prop('disabled', n >= 99);
    return n;
  }
  function offers(city, t, q) {
    return $.map(STORES, function (s) {
      var unit = Math.round(s.base * TYPES[t].k / 10) * 10;
      var o = { s: s, unit: unit, goods: unit * q, enough: s.stock >= q };
      if (city) {
        o.km = Math.max(5, Math.round(km(s.ll, [city[2], city[3]]) * ROAD));
        o.trips = Math.ceil(q / TYPES[t].perTruck);
        o.delivery = o.km < 15 ? 0 : o.trips * Math.round(TRIP_BASE + TRIP_KM * o.km);
        o.days = Math.max(1, Math.ceil(o.km / DAY_KM));
      } else {
        o.delivery = 0;
      }
      o.total = o.goods + o.delivery;
      return o;
    }).sort(function (a, b) { return (b.enough - a.enough) || (a.total - b.total); });
  }

  /* ---------- Вывод ---------- */
  function row(label, value) {
    return '<span class="ctmap__row"><span>' + label + '</span><b>' + value + '</b></span>';
  }
  function tripsText(o, t) {
    var per = TYPES[t].perTruck;
    return o.km + ' км, ' + o.trips + ' ' + plural(o.trips, 'рейс', 'рейса', 'рейсов') +
      (per > 1 ? ' (по ' + per + '×' + TYPES[t].name.slice(0, 3) + ' на машину)' : '');
  }
  function card(o, t, q, city, best) {
    return '<li><button class="ctmap__card' + (o.s.id === selected ? ' is-active' : '') + (o.enough ? '' : ' is-short') +
      '" type="button" data-id="' + o.s.id + '" aria-pressed="' + (o.s.id === selected) + '">' +
      (best ? '<span class="ctmap__badge">Рекомендуем</span>' : '') +
      '<span class="ctmap__name">' + o.s.name + '</span>' +
      '<span class="ctmap__loc">' + o.s.city + '</span>' +
      (city ? '<span class="ctmap__via">Автодоставка · ' + TYPES[t].name + '</span>' : '') +
      row('Контейнер × ' + q + ' (' + money(o.unit) + '/шт)', money(o.goods)) +
      (city ? row('Доставка · ' + o.km + ' км, ' + o.trips + ' ' + plural(o.trips, 'рейс', 'рейса', 'рейсов'), o.delivery ? money(o.delivery) : 'самовывоз') : '') +
      '<span class="ctmap__total">' + money(o.total) + '</span>' +
      '<span class="ctmap__stock">' + (o.enough ? 'В наличии: ' + o.s.stock + ' шт.' : 'Всего ' + o.s.stock + ' шт. — меньше, чем нужно') +
      (city ? ' · ~' + o.days + ' дн. в пути' : '') + '</span>' +
      '</button></li>';
  }
  function summary(o, t, q, city) {
    var dest = city[0] + ', ' + city[1] + ', Украина';
    $sum.html(
      '<p class="ctmap__sum-title">' + o.s.name + ' → ' + dest + '</p>' +
      row('Контейнер (' + TYPES[t].name + ') × ' + q + ', ' + money(o.unit) + '/шт', money(o.goods)) +
      row('Автодоставка (' + tripsText(o, t) + ')', o.delivery ? money(o.delivery) : 'самовывоз') +
      row('Срок доставки', '~' + o.days + ' дн.') +
      '<span class="ctmap__row ctmap__row--total"><span>Итого</span><b>' + money(o.total) + '</b></span>' +
      '<span class="ctmap__note">Доставка в пределах Украины</span>' +
      (q >= 5 ? '<span class="ctmap__note">От 5 контейнеров и при заказе разных типов возможна дополнительная скидка — уточните у менеджера.</span>' : '') +
      '<span class="ctmap__disc">Ориентировочный расчёт. Точную стоимость и возможную скидку уточняйте у менеджера.</span>' +
      '<a class="btn btn--block ctmap__cta" href="catalog.html">Подобрать контейнер</a>'
    ).prop('hidden', false);
  }

  function render(fit) {
    var city = findCity($city.val());
    var t = $type.val(), q = qty();
    var list = offers(city, t, q);
    if (!selected || !list.some(function (o) { return o.s.id === selected && o.enough; })) {
      selected = list[0].enough ? list[0].s.id : null;
    }
    $hint.prop('hidden', !!city);
    var shown = city ? list.slice(0, 5) : list;
    $list.html($.map(shown, function (o, i) { return card(o, t, q, city, city && i === 0 && o.enough); }).join(''));
    var cur = $.grep(list, function (o) { return o.s.id === selected; })[0];
    if (city && cur) { summary(cur, t, q, city); } else { $sum.prop('hidden', true).empty(); }
    drawMap(city, cur, fit);
  }

  /* ---------- Карта ---------- */
  var map = null, layer = null, pins = {};
  function initMap() {
    var L = window.L;
    var el = $root.find('[data-ctmap-canvas]')[0];
    if (!L || !el) { $root.addClass('is-nomap'); return; }
    // на телефоне страница листается пальцем, карта — кнопками ±
    map = L.map(el, $.extend(MAP_OPTS(), { center: [49, 31], zoom: 6, minZoom: 5, maxZoom: 14 }));
    L.tileLayer(TILES, TILE_OPTS).addTo(map);
    $.each(STORES, function (i, s) {
      pins[s.id] = L.marker(s.ll, { icon: pin('ctmap-pin--store'), title: s.name, keyboard: false })
        .bindTooltip(s.name, { direction: 'top' })
        .on('click', function () { selected = s.id; render(true); })
        .addTo(map);
    });
    layer = L.layerGroup().addTo(map);
    $root.addClass('has-map');
  }
  function drawMap(city, cur, fit) {
    if (!map) { return; }
    var L = window.L;
    layer.clearLayers();
    $.each(pins, function (id, m) { m.setZIndexOffset(0); $(m.getElement()).toggleClass('is-active', !!cur && id === cur.s.id); });
    if (!city) { if (fit) { map.fitBounds(STORES.map(function (s) { return s.ll; }), { padding: [40, 40] }); } return; }
    var to = [city[2], city[3]];
    L.marker(to, { icon: pin('ctmap-pin--city'), title: city[0], keyboard: false, zIndexOffset: 1000 })
      .bindTooltip(city[0], { permanent: true, direction: 'right', className: 'ctmap-label', offset: [10, -14] })
      .addTo(layer);
    if (cur) {
      pins[cur.s.id].setZIndexOffset(900);
      L.polyline([cur.s.ll, to], { color: '#31a6dd', weight: 4, opacity: .9, dashArray: '1 8', lineCap: 'round' }).addTo(layer);
      if (fit) {
        // на десктопе карточка итога лежит слева поверх карты — маршрут вписываем правее неё
        var left = !$sum.prop('hidden') && window.innerWidth > 1023 ? $sum.outerWidth() + 72 : 48;
        map.invalidateSize();
        map.fitBounds([cur.s.ll, to], { paddingTopLeft: [left, 60], paddingBottomRight: [60, 60], maxZoom: 9 });
      }
    }
  }

  /* ---------- События ---------- */
  $city.on('change', function () { selected = null; render(true); })
    .on('input', function () { if (findCity(this.value) || !this.value) { selected = null; render(true); } });
  $type.on('change', function () { render(false); });
  $qty.on('change', function () { render(false); });
  $root.on('click', '[data-ctmap-step]', function () {
    $qty.val((parseInt($qty.val(), 10) || 1) + Number($(this).data('ctmap-step')));
    render(false);
  });
  $list.on('click', '.ctmap__card', function () { selected = $(this).data('id'); render(true); });

  initMap();
  render(true);
}(jQuery));
