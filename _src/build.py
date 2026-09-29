# Сборка HTML-страниц из шаблонов Jinja2 (структура близка к Twig в OpenCart 4)
import sys, os
from jinja2 import Environment, FileSystemLoader
sys.path.insert(0, os.path.dirname(__file__))
import data as D
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..')
env = Environment(loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), 'tpl')), trim_blocks=False, lstrip_blocks=False, autoescape=False)
common = dict(cats=D.CATS, about=D.ABOUT, phones=D.PHONES, langs=D.LANGS, curs=D.CURS,
              about_links=D.ABOUT_LINKS, popular=D.POPULAR, novelty=D.NOVELTY, search_results=D.SEARCH_RESULTS, cart=D.CART, recent=D.RECENT)
import json
P = json.load(open(os.path.join(os.path.dirname(__file__), 'pages.json'), encoding='utf-8'))
PAGES = {
    'index.html': dict(title='Container Trade — новые и б/у контейнеры в наличии и под заказ',
                       description='Тысячи новых и б/у морских, рефрижераторных, Open Top и Pallet Wide контейнеров в наличии и под заказ. Доставка по Украине и миру.'),
    'reviews.html': dict(title='Отзывы — Container Trade', current='reviews',
                         description='Отзывы клиентов Container Trade о покупке, аренде и доставке контейнеров.',
                         hero=P['hero_reviews'], reviews=P['reviews']),
    'price.html': dict(title='Цены на контейнеры — Container Trade', current='price',
                       description='Актуальные цены на б/у и новые морские и рефрижераторные контейнеры, стоимость аренды.',
                       hero=P['hero_price'], price=P['price']),
    'blog.html': dict(title='Блог — Container Trade',
                      description='Полезные статьи, экспертные обзоры и гиды по выбору, эксплуатации и логистике контейнеров.',
                      hero=P['hero_blog'], posts=P['posts']),
    'blog-article.html': dict(title='Утепление контейнера: изнутри vs снаружи — Container Trade',
                              description='Разбираем, где делать теплоизоляцию контейнера и какие материалы выбрать.',
                              hero=P['hero_article'], a=P['article'], posts=P['posts']),
    'contacts.html': dict(title='Контакты — Container Trade', current='contacts',
                          description='Телефоны, e-mail, адреса офисов и складов Container Trade.',
                          hero=P['hero_contacts'], stores=P['stores']),
    '404.html': dict(title='Страница не найдена — Container Trade',
                     description='Страница не найдена.'),
}
# Каталог: одна страница на категорию (отличается первым экраном)
_chips = [('Украина', 'f3-1'), ('20DC (20 футов)', 'f1-1'), ('20HC (20 футов высокий)', 'f1-2')]
for c in D.CATS:
    h = D.CAT_HEROES[c['key']]
    PAGES[c['href']] = dict(tpl='catalog.html', key=c['key'], h=h, title=h['title'] + ' — купить в Container Trade',
                            description=h['lead'], catalog=D.CATALOG, chips=_chips, groups=D.FILTER_GROUPS)
PAGES['search.html'] = dict(title='Результаты поиска — Container Trade', description='Результаты поиска по каталогу контейнеров.')
_ct = [dict(c, total=c['unit'] * c['qty']) for c in D.CART]
PAGES['checkout.html'] = dict(title='Оформление заказа — Container Trade', description='Оформление заказа.', simple_header=True,
                              order=_ct, order_total=sum(c['total'] for c in _ct))
PAGES['checkout-success.html'] = dict(title='Заказ принят — Container Trade', description='Ваш заказ принят.')
# Информационные страницы и карты сайта
import info as I
def _info(tpl, h1, lead, img, **kw):
    return dict(tpl=tpl, title=h1 + ' — Container Trade', description=lead, h1=h1, lead=lead, img=img, **kw)
for name, c in I.INFO.items():
    PAGES[name] = _info('info.html', c['title'], c['lead'], c['img'], slug=c['slug'], sizes=I.SIZES)
_cat_links = [(c['name'], c['href'], [(s, c['href']) for s in c['subs']]) for c in D.CATS]
PAGES['sitemap.html'] = _info('sitemap.html', 'Карта сайта', 'Полный список страниц на сайте компании «Контейнер Трейд».', 'hero-blog',
                              groups=[(g, links if links is not None else _cat_links) for g, links in I.SITEMAP])
PAGES['sitemap-products.html'] = _info('sitemap.html', 'Карта сайта товары', 'Все товары каталога компании «Контейнер Трейд».', 'hero-blog', wide=True,
                                       groups=[(g, [(n, 'product.html', []) for n in names]) for g, names in I.PRODUCTS])
PAGES['product.html'] = dict(title=D.PRODUCT['name'] + ' — Container Trade', description=D.PRODUCT['desc'][0][:150],
                             product=D.PRODUCT, viewed=D.VIEWED)
for name, ctx in PAGES.items():
    html = env.get_template(ctx.pop('tpl', name)).render(**common, **ctx)
    import re
    html = re.sub(r'[ \t]+\n', '\n', html)
    html = re.sub(r'\n{3,}', '\n\n', html)
    open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='\n').write(html)
    print(name, len(html))
