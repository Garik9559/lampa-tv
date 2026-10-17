/* Lampa plugin: «Расширенный поиск» — поиск фильмов и сериалов по TMDB с условиями,
   которых нет во встроенном фильтре: рейтинг «от», диапазон лет, минимум голосов,
   страна, язык оригинала, исключение жанров, длительность, сортировка, готовые подборки.
   Результат открывается штатным списком Lampa (component category_full, source tmdb). */
(function () {
  'use strict';
  if (window.adv_search_plugin) return;
  window.adv_search_plugin = true;

  var STORE = 'adv_search_state';
  var YEAR = new Date().getFullYear();

  var GENRES = {
    movie: [[28, 'Боевик'], [12, 'Приключения'], [16, 'Мультфильм'], [35, 'Комедия'], [80, 'Криминал'],
      [99, 'Документальный'], [18, 'Драма'], [10751, 'Семейный'], [14, 'Фэнтези'], [36, 'История'],
      [27, 'Ужасы'], [10402, 'Музыка'], [9648, 'Детектив'], [10749, 'Мелодрама'], [878, 'Фантастика'],
      [53, 'Триллер'], [10752, 'Военный'], [37, 'Вестерн']],
    tv: [[10759, 'Боевик и приключения'], [16, 'Мультфильм'], [35, 'Комедия'], [80, 'Криминал'],
      [99, 'Документальный'], [18, 'Драма'], [10751, 'Семейный'], [10762, 'Детский'], [9648, 'Детектив'],
      [10764, 'Реалити'], [10765, 'Фантастика и фэнтези'], [10766, 'Мыльная опера'], [10768, 'Война и политика'],
      [37, 'Вестерн']]
  };
  // Темы = ключевые слова TMDB (with_keywords). ID проверены запросами к TMDB 2026-10-17.
  var THEMES = [
    [12190, 'Киберпанк'], [4565, 'Антиутопия'], [4458, 'Постапокалипсис'], [4379, 'Путешествия во времени'],
    [10854, 'Временная петля'], [33465, 'Параллельные миры'], [336874, 'Мультивселенная'],
    [310, 'Искусственный интеллект'], [14544, 'Роботы'], [9951, 'Пришельцы'], [9882, 'Космос'],
    [161176, 'Космическая опера'], [10028, 'Стимпанк'], [9715, 'Супергерои'], [12616, 'Динозавры'], [1299, 'Монстры'],
    [12377, 'Зомби'], [3133, 'Вампиры'], [3358, 'Дом с привидениями'], [209568, 'Фолк-хоррор'],
    [163053, 'Найденная плёнка (found footage)'],
    [10051, 'Ограбление'], [10714, 'Серийный убийца'], [12565, 'Психологический триллер'], [207268, 'Неонуар'],
    [10410, 'Заговор'], [470, 'Шпионы'], [10391, 'Мафия'], [12570, 'Детектив «кто убийца»'], [378, 'Тюрьма'],
    [33519, 'Суд'], [9748, 'Месть'],
    [9672, 'По реальным событиям'], [818, 'По книге'], [5565, 'Биография'], [6075, 'Спорт'], [209476, 'Бокс'],
    [779, 'Боевые искусства'], [10683, 'Взросление'], [6270, 'Школа'], [1415, 'Маленький город'], [167043, 'Роуд-муви'],
    [10123, 'Чёрная комедия'], [8201, 'Сатира'], [11800, 'Мокьюментари'], [4344, 'Мюзикл'], [207317, 'Рождество'],
    [210024, 'Аниме'], [10349, 'Выживание'], [10617, 'Катастрофы'], [1956, 'Вторая мировая'], [2106, 'Холодная война'],
    [18330, 'Природа'], [9706, 'Альманах (новеллы)']
  ];
  var COUNTRIES = [['US', 'США'], ['GB', 'Великобритания'], ['FR', 'Франция'], ['DE', 'Германия'], ['IT', 'Италия'],
    ['ES', 'Испания'], ['SE', 'Швеция'], ['DK', 'Дания'], ['NO', 'Норвегия'], ['CA', 'Канада'], ['AU', 'Австралия'],
    ['KR', 'Южная Корея'], ['JP', 'Япония'], ['CN', 'Китай'], ['IN', 'Индия'], ['TR', 'Турция'], ['RU', 'Россия'],
    ['SU', 'СССР'], ['AM', 'Армения'], ['GE', 'Грузия'], ['MX', 'Мексика'], ['BR', 'Бразилия']];
  var LANGS = [['en', 'Английский'], ['ru', 'Русский'], ['hy', 'Армянский'], ['ka', 'Грузинский'], ['tr', 'Турецкий'],
    ['fr', 'Французский'], ['de', 'Немецкий'], ['it', 'Итальянский'], ['es', 'Испанский'], ['ko', 'Корейский'],
    ['ja', 'Японский'], ['zh', 'Китайский'], ['hi', 'Хинди'], ['sv', 'Шведский'], ['da', 'Датский']];
  var SORTS = [['vote_average.desc', 'По рейтингу'], ['popularity.desc', 'По популярности'],
    ['vote_count.desc', 'По числу голосов'], ['date.desc', 'Сначала новые'], ['date.asc', 'Сначала старые']];
  var RUNTIMES = [['', 'Любая'], ['0-90', 'До 1,5 часа'], ['90-120', '1,5–2 часа'], ['120-150', '2–2,5 часа'], ['150-999', 'Больше 2,5 часа']];

  var PRESETS = [
    ['Фантастика после 2000, ★7+', { type: 'movie', genres: [878], year_from: 2000, rating: 7, votes: 300, sort: 'vote_average.desc' }],
    ['Киберпанк и антиутопии, ★6.5+', { type: 'movie', themes: [12190, 4565], rating: 6.5, votes: 200, sort: 'vote_average.desc' }],
    ['Путешествия во времени и петли, ★7+', { type: 'movie', themes: [4379, 10854], rating: 7, votes: 200, sort: 'vote_average.desc' }],
    ['Ограбления, ★7+', { type: 'movie', themes: [10051], rating: 7, votes: 300, sort: 'vote_average.desc' }],
    ['По реальным событиям, ★7.5+', { type: 'movie', themes: [9672], rating: 7.5, votes: 500, sort: 'vote_average.desc' }],
    ['Лучшие сериалы, ★8+', { type: 'tv', rating: 8, votes: 500, sort: 'vote_average.desc' }],
    ['Новинки этого года, ★7+', { type: 'movie', year_from: YEAR, rating: 7, votes: 50, sort: 'popularity.desc' }],
    ['Армянское кино', { type: 'movie', lang: 'hy', votes: 5, sort: 'vote_count.desc' }],
    ['Грузинское кино', { type: 'movie', lang: 'ka', votes: 5, sort: 'vote_count.desc' }],
    ['Корейские триллеры, ★7+', { type: 'movie', genres: [53], lang: 'ko', rating: 7, votes: 200, sort: 'vote_average.desc' }],
    ['Советская классика', { type: 'movie', country: 'SU', votes: 50, sort: 'vote_average.desc' }],
    ['Мультфильмы для семьи, ★7+', { type: 'movie', genres: [16, 10751], rating: 7, votes: 300, sort: 'popularity.desc' }]
  ];

  function defaults() {
    return { type: 'movie', genres: [], exclude: [], genre_mode: 'and', themes: [], theme_mode: 'or', year_from: 0, year_to: 0, rating: 0,
      votes: 100, country: '', lang: '', runtime: '', sort: 'vote_average.desc' };
  }
  function load() {
    var s = Lampa.Storage.get(STORE, '{}');
    var d = defaults();
    for (var k in d) if (s && s[k] !== undefined) d[k] = s[k];
    return d;
  }
  var state = load();
  function save() { Lampa.Storage.set(STORE, state); }

  function name(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i][0] == id) return list[i][1];
    return id;
  }
  function genreNames(ids) {
    return ids.map(function (id) { return name(GENRES[state.type], id); }).join(', ');
  }
  function themeNames(ids) {
    return ids.map(function (id) { return name(THEMES, id); }).join(', ');
  }
  function years() {
    if (!state.year_from && !state.year_to) return '';
    if (state.year_from && state.year_to) return state.year_from == state.year_to ? '' + state.year_from : state.year_from + '–' + state.year_to;
    return state.year_from ? 'с ' + state.year_from : 'до ' + state.year_to;
  }
  function summary() {
    var p = [state.type == 'movie' ? 'Фильмы' : 'Сериалы'];
    if (state.genres.length) p.push(genreNames(state.genres));
    if (state.themes.length) p.push(themeNames(state.themes));
    if (years()) p.push(years());
    if (state.rating) p.push('★' + state.rating + '+');
    if (state.country) p.push(name(COUNTRIES, state.country));
    if (state.lang) p.push(name(LANGS, state.lang));
    return p.join(' · ');
  }

  function buildUrl() {
    var tv = state.type == 'tv';
    var date = tv ? 'first_air_date' : 'primary_release_date';
    var q = ['include_adult=false'];
    if (state.genres.length) q.push('with_genres=' + state.genres.join(state.genre_mode == 'or' ? '|' : ','));
    if (state.exclude.length) q.push('without_genres=' + state.exclude.join(','));
    if (state.themes.length) q.push('with_keywords=' + state.themes.join(state.theme_mode == 'and' ? ',' : '|'));
    if (state.year_from) q.push(date + '.gte=' + state.year_from + '-01-01');
    if (state.year_to) q.push(date + '.lte=' + state.year_to + '-12-31');
    if (state.rating) q.push('vote_average.gte=' + state.rating);
    if (state.votes) q.push('vote_count.gte=' + state.votes);
    if (state.country) q.push('with_origin_country=' + state.country);
    if (state.lang) q.push('with_original_language=' + state.lang);
    if (state.runtime) {
      var r = state.runtime.split('-');
      if (+r[0]) q.push('with_runtime.gte=' + r[0]);
      if (+r[1] < 999) q.push('with_runtime.lte=' + r[1]);
    }
    q.push('sort_by=' + state.sort.replace('date', date));
    return 'discover/' + state.type + '?' + q.join('&');
  }

  function search() {
    save();
    Lampa.Activity.push({ url: buildUrl(), title: summary(), component: 'category_full', source: 'tmdb', card_type: true, page: 1 });
  }

  // Один выбор из списка: options = [[value, title], ...]
  function pick(title, options, current, onPick) {
    Lampa.Select.show({
      title: title,
      items: options.map(function (o) { return { title: o[1], value: o[0], selected: o[0] == current }; }),
      onBack: main,
      onSelect: function (a) { onPick(a.value); save(); main(); }
    });
  }
  // Несколько значений. У пунктов-галочек Lampa.Select сама переключает a.checked и зовёт onCheck
  // (onSelect для них не вызывается); «Готово» — обычный пункт, возвращает в форму.
  function multi(title, options, key) {
    var items = [{ title: 'Готово', done: true }].concat(options.map(function (o) {
      return { title: o[1], value: o[0], checkbox: true, checked: state[key].indexOf(o[0]) > -1 };
    }));
    Lampa.Select.show({
      title: title,
      items: items,
      onBack: function () { save(); main(); },
      onCheck: function (a) {
        var i = state[key].indexOf(a.value);
        if (a.checked && i == -1) state[key].push(a.value);
        if (!a.checked && i > -1) state[key].splice(i, 1);
        save();
      },
      onSelect: function () { save(); main(); }
    });
  }

  function yearOptions(any) {
    var o = [[0, any]];
    for (var y = YEAR; y >= 2000; y--) o.push([y, '' + y]);
    for (var d = 1995; d >= 1920; d -= 5) o.push([d, '' + d]);
    return o;
  }

  function main() {
    var T = GENRES[state.type];
    var items = [
      { title: 'Искать', subtitle: summary(), act: search },
      { title: 'Подборки', subtitle: 'Топ-250 IMDb, жанры, десятилетия, свои подборки…', act: collections },
      { title: 'Тип', subtitle: state.type == 'movie' ? 'Фильмы' : 'Сериалы', act: function () {
        pick('Тип', [['movie', 'Фильмы'], ['tv', 'Сериалы']], state.type, function (v) {
          if (v != state.type) { state.genres = []; state.exclude = []; }
          state.type = v;
        });
      } },
      { title: 'Жанры', subtitle: state.genres.length ? genreNames(state.genres) : 'Любые', act: function () { multi('Жанры', T, 'genres'); } },
      { title: 'Несколько жанров', subtitle: state.genre_mode == 'or' ? 'Любой из выбранных' : 'Все выбранные сразу', act: function () {
        pick('Несколько жанров', [['and', 'Все выбранные сразу'], ['or', 'Любой из выбранных']], state.genre_mode, function (v) { state.genre_mode = v; });
      } },
      { title: 'Исключить жанры', subtitle: state.exclude.length ? genreNames(state.exclude) : 'Нет', act: function () { multi('Исключить жанры', T, 'exclude'); } },
      { title: 'Темы', subtitle: state.themes.length ? themeNames(state.themes) : 'Любые (киберпанк, ограбления, по реальным событиям…)', act: function () { multi('Темы', THEMES, 'themes'); } },
      { title: 'Несколько тем', subtitle: state.theme_mode == 'and' ? 'Все выбранные сразу' : 'Любая из выбранных', act: function () {
        pick('Несколько тем', [['or', 'Любая из выбранных'], ['and', 'Все выбранные сразу']], state.theme_mode, function (v) { state.theme_mode = v; });
      } },
      { title: 'Год от', subtitle: state.year_from || 'Любой', act: function () { pick('Год от', yearOptions('Любой'), state.year_from, function (v) { state.year_from = +v; }); } },
      { title: 'Год до', subtitle: state.year_to || 'Любой', act: function () { pick('Год до', yearOptions('Любой'), state.year_to, function (v) { state.year_to = +v; }); } },
      { title: 'Рейтинг от', subtitle: state.rating ? '★ ' + state.rating : 'Любой', act: function () {
        pick('Рейтинг TMDB от', [[0, 'Любой'], [5, '5'], [5.5, '5,5'], [6, '6'], [6.5, '6,5'], [7, '7'], [7.5, '7,5'], [8, '8'], [8.5, '8,5'], [9, '9']],
          state.rating, function (v) { state.rating = +v; });
      } },
      { title: 'Минимум голосов', subtitle: state.votes ? 'от ' + state.votes : 'Любое', act: function () {
        pick('Минимум голосов (отсекает малоизвестное)', [[0, 'Любое'], [5, '5'], [50, '50'], [100, '100'], [300, '300'], [1000, '1 000'], [5000, '5 000'], [20000, '20 000']],
          state.votes, function (v) { state.votes = +v; });
      } },
      { title: 'Страна производства', subtitle: state.country ? name(COUNTRIES, state.country) : 'Любая', act: function () {
        pick('Страна производства', [['', 'Любая']].concat(COUNTRIES), state.country, function (v) { state.country = v; });
      } },
      { title: 'Язык оригинала', subtitle: state.lang ? name(LANGS, state.lang) : 'Любой', act: function () {
        pick('Язык оригинала', [['', 'Любой']].concat(LANGS), state.lang, function (v) { state.lang = v; });
      } },
      { title: 'Длительность', subtitle: name(RUNTIMES, state.runtime), act: function () {
        pick('Длительность', RUNTIMES, state.runtime, function (v) { state.runtime = v; });
      } },
      { title: 'Сортировка', subtitle: name(SORTS, state.sort), act: function () {
        pick('Сортировка', SORTS, state.sort, function (v) { state.sort = v; });
      } },
      { title: 'Сбросить условия', act: function () { state = defaults(); save(); main(); } }
    ];
    Lampa.Select.show({
      title: 'Расширенный поиск',
      items: items,
      onBack: function () { Lampa.Controller.toggle('menu'); },
      onSelect: function (a) { a.act(); }
    });
  }

  function presets() {
    Lampa.Select.show({
      title: 'Подборки по условиям (TMDB)',
      items: PRESETS.map(function (p) { return { title: p[0], preset: p[1] }; }),
      onBack: collections,
      onSelect: function (a) {
        state = defaults();
        for (var k in a.preset) state[k] = Array.isArray(a.preset[k]) ? a.preset[k].slice() : a.preset[k];
        search();
      }
    });
  }

  // ---------- Подборки IMDb ----------
  // Данные — imdb_lists.json рядом с файлом плагина (собирается build_imdb_lists.py из выгрузок IMDb):
  // {v, lists:[{k:ключ, t:название, g:группа, i:[[tmdb_id, 'm'|'t', рейтинг IMDb, год], ...]}]}.
  // Постеры и русские названия догружаются через TMDB-источник Lampa и кэшируются.
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  var LISTS_KEY = 'adv_lists_data', CARDS_KEY = 'adv_lists_cards', PER = 20;
  var lists = null, cards = Lampa.Storage.get(CARDS_KEY, '{}') || {};

  // Адрес imdb_lists.json — рядом с файлом плагина. Lampa может исполнять плагин из своего кэша
  // (тогда currentScript пуст), поэтому запасной путь — адрес из списка плагинов Lampa.
  function listsUrl() {
    var base = SCRIPT_SRC;
    if (!base) (Lampa.Storage.get('plugins', '[]') || []).forEach(function (p) { if (p && /adv_search\.js/.test(p.url || '')) base = p.url; });
    return base ? base.replace(/[^\/?#]+(\?.*)?$/, 'imdb_lists.json') : '';
  }

  function loadLists(cb) {
    if (lists) return cb(lists);
    if (window.adv_lists_data) { lists = window.adv_lists_data; return cb(lists); }
    var LISTS_URL = listsUrl();
    var cached = Lampa.Storage.get(LISTS_KEY, '{}');
    var have = cached && cached.lists ? cached : null;
    if (!LISTS_URL || (have && Date.now() - (have.saved || 0) < 3 * 86400000)) { lists = have; return cb(lists); }
    new Lampa.Reguest().silent(LISTS_URL + '?d=' + Math.floor(Date.now() / 86400000), function (json) {
      if (typeof json == 'string') try { json = JSON.parse(json); } catch (e) { json = null; }
      if (json && json.lists) { json.saved = Date.now(); Lampa.Storage.set(LISTS_KEY, json); lists = json; } else lists = have;
      cb(lists);
    }, function () { lists = have; cb(lists); });
  }

  function detail(id, type, done) {
    var key = type + id;
    if (cards[key]) return done(cards[key]);
    Lampa.Api.sources.tmdb.get((type == 't' ? 'tv/' : 'movie/') + id, {}, function (d) {
      cards[key] = [d.title || d.name || '', d.original_title || d.original_name || '', d.poster_path || '', d.backdrop_path || '', d.release_date || d.first_air_date || ''];
      done(cards[key]);
    }, function () { done(null); });
  }

  function toCard(it, c) {
    var card = { id: it[0], source: 'tmdb', vote_average: it[2], imdb_rating: it[2], poster_path: c ? c[2] : '', backdrop_path: c ? c[3] : '' };
    var date = (c && c[4]) || it[3] + '-01-01';
    if (it[1] == 't') { card.name = (c && c[0]) || ''; card.original_name = (c && c[1]) || ''; card.first_air_date = date; card.method = 'tv'; }
    else { card.title = (c && c[0]) || ''; card.original_title = (c && c[1]) || ''; card.release_date = date; }
    return card;
  }

  // Источник для штатного списка Lampa (category_full): params.url = ключ подборки, params.page = страница
  Lampa.Api.sources.adv_lists = {
    list: function (params, oncomplite, onerror) {
      loadLists(function (L) {
        var l = L && L.lists.filter(function (x) { return x.k == params.url; })[0];
        var page = params.page || 1, slice = l ? l.i.slice((page - 1) * PER, page * PER) : [];
        if (!slice.length) return onerror && onerror();
        var out = [], next = 0, running = 0, left = slice.length;
        function pump() {
          while (running < 5 && next < slice.length) (function (n) {
            running++;
            detail(slice[n][0], slice[n][1], function (c) {
              out[n] = toCard(slice[n], c); running--;
              if (--left == 0) {
                Lampa.Storage.set(CARDS_KEY, cards);
                oncomplite({ results: out, page: page, total_pages: Math.ceil(l.i.length / PER), total_results: l.i.length });
              } else pump();
            });
          })(next++);
        }
        pump();
      });
    },
    clear: function () {}
  };

  function openList(l) {
    Lampa.Activity.push({ url: l.k, title: l.t + ' · IMDb', component: 'category_full', source: 'adv_lists', card_type: true, page: 1 });
  }

  function collections() {
    loadLists(function (L) {
      var groups = [];
      (L ? L.lists : []).forEach(function (l) { if (groups.indexOf(l.g) == -1) groups.push(l.g); });
      var items = groups.map(function (g) {
        var ls = L.lists.filter(function (l) { return l.g == g; });
        return { title: g, subtitle: ls.map(function (l) { return l.t; }).slice(0, 4).join(', ') + (ls.length > 4 ? '…' : ''), group: g };
      });
      items.push({ title: 'По условиям (TMDB)', subtitle: 'Фантастика ★7+, киберпанк, армянское кино, советская классика…', tmdb: true });
      if (!L) items.unshift({ title: 'Топы IMDb не загрузились', subtitle: 'Проверьте интернет и откройте ещё раз', ghost: true });
      Lampa.Select.show({
        title: 'Подборки',
        items: items,
        onBack: function () { Lampa.Controller.toggle('menu'); },
        onSelect: function (a) {
          if (a.tmdb) return presets();
          if (!a.group) return collections();
          var ls = L.lists.filter(function (l) { return l.g == a.group; });
          Lampa.Select.show({
            title: a.group,
            items: ls.map(function (l) { return { title: l.t, subtitle: l.i.length + ' · рейтинг IMDb', list: l }; }),
            onBack: collections,
            onSelect: function (b) { openList(b.list); }
          });
        }
      });
    });
  }

  function addMenu() {
    if ($('.menu .menu__item[data-action="adv_search"]').length) return;
    var ico = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="2.2"/>' +
      '<path d="M15 15l5.5 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M7 10h6M10 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    var item = $('<li class="menu__item selector" data-action="adv_search"><div class="menu__ico">' + ico + '</div><div class="menu__text">Расширенный поиск</div></li>');
    item.on('hover:enter', main);
    var anchor = $('.menu .menu__item[data-action="filter"]');
    if (anchor.length) anchor.after(item); else $('.menu .menu__list').eq(0).append(item);
    var ico2 = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
    var item2 = $('<li class="menu__item selector" data-action="adv_collections"><div class="menu__ico">' + ico2 + '</div><div class="menu__text">Подборки</div></li>');
    item2.on('hover:enter', collections);
    item.after(item2);
  }

  window.adv_search_plugin_api = { buildUrl: buildUrl, summary: summary, state: function () { return state; }, open: main, search: search,
    collections: collections, openList: openList, loadLists: loadLists };

  if (window.appready) addMenu();
  else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenu(); });
})();
