/***
|Name|ListFiltrPlugin|
|Author|[[Tobias Beer|http://tobibeer.tiddlyspace.com]]|
|Documentation|http://listfiltr.tiddlyspace.com|
|Source|https://raw.github.com/tobibeer/TiddlyWikiPlugins/master/plugins/ListFiltrPlugin.js|
|Requires||
|~CoreVersion|2.6.5|
|License|Crea7ive Commons 3.0|
|Version|1.0.8 (2013-09-04)|
!Info
This plugin allows to filter lists based on a search term and to browse through filter results.
!Example
{{myclass{
*a list item
*another list item
*foo bar
#one
#two
#three
Great!
}}}
<<listfiltr>>
***/
//{{{
(function ($) {

    config.macros.listfiltr = {

        //any items to preserve by default
        defaultPreserve: '',

        handler: function (place, macroName, params, wikifier, paramString, tiddler) {
            var box, boxtitle, boxwrap, el, list, prev,
                p = paramString.parseParams('anon', null, true),
                preserve = getParam(p, 'preserve', this.defaultPreserve),
                listClass = 'lf-' + new Date().formatString('YYYYMMDDhhmmss') + Math.random().toString().substr(6);

            list = $(place).children().last();
            while (list.is('br')) list = list.prev();

            if (list.is('span,div')) list = list.contents();

            list.wrapAll('<div class="lf-list ' + listClass + '"/>');
            list = $('.' + listClass);

            if ($.fn.outline)
                $("ol:not(ol li > ol)", list).outline();

            $(preserve, list).addClass('lf-preserve');

            list.find(":not(iframe)").addBack().contents().filter(function () {
                var $el = $(this);
                return (
                    //is text node
                    this.nodeType == 3 &&
                    //and preceded or followed by a linebreak
                    ($el.prev().is('br') || $el.next().is('br')) &&
                    //not inside preserve
                    0 == $el.closest('.lf-preserve').length &&
                    //not after a pseudo order list item
                    0 == $el.prevAll('.pseudo-ol-li').length
                )
            }).wrap('<span class="lf-p"/>');

            boxwrap = $('<div class=lf-search/>').insertBefore(list);
            boxtitle = $('<span class=lf-label/>').html('Filter list:').appendTo(boxwrap);
            box = $('<input type="search"/>').attr({
                'title': 'enter your search term here'
            }).appendTo(boxwrap);

            box.data('list', listClass).bind('keyup search', function () {
                var els, found, text, until,
                box = $(this),
                term = box.val(),
                listClass = box.data('list'),
                list = $('.' + listClass);

                list.removeClass('lf-filtered');
                $('li,dd,dt,span,div, br', list
                ).removeClass('lf-h lf-hide lf-found lf-not'
                ).each(function (i) {
                    var dt, dd, li = $(this);

                    if (term.length > 1) {
                        list.addClass('lf-filtered');

                        text = li.clone().children().remove().end().text();
                        els = li.children().not('dl,ol,ul').clone().remove('dl,ol,ul,dl *,ol *,ul *');
                        text = text + ' ' + els.text();
                        els.each(function (i) {
                            var el = $(this),
                                link = el.hasClass('externalLink') ? el.attr('href').replace('http://', '') : null;
                            tid = el.attr('tiddlyLink');
                            text += ' ' + (link ? link : '') + (tid ? ' ' + tid : '');
                        })
                        found = text.toLowerCase().indexOf(term.toLowerCase()) > -1;

                        li.not('br, .pseudo-ol-li').addClass('lf-' + (found ? 'found' : 'h'));
                        if (li.is('dt')) {
                            dd = li.nextUntil('dd','dt');
                            if (found) dd.addClass('lf-not');
                        };
                        if (li.is('dd')) {
                            dt = li.prevUntil('dt','dt');
                            if (found) {
                                if (!dt.hasClass('lf-found'))
                                    dt.addClass('lf-not').removeClass('lf-h');
                            } else if (dt.hasClass('lf-found')) {
                                li.removeClass('lf-h');
                            }
                        };
                    }
                });

                $('.highlight:not(.tiddlyLink,.externalLink)', list).each(function () {
                    $(this).after($(this).text());
                }).remove();
                $('.highlight', list).removeClass('highlight');

                if (term.length > 1) {
                    $('.lf-found', list).each(function (i) {
                        $(this).parentsUntil(until, '.lf-h').removeClass('lf-h').not('.pseudo-ol-li').addClass('lf-not');
                    });

                    $('.lf-found', list).each(function (i) {
                        $('.lf-h', this).removeClass('lf-h').not('.pseudo-ol-li').addClass('lf-not');
                    });


                    $.fn.highlight = function (term) {
                        var pattern = new RegExp('(\\b\\w*' + term + '\\w*\\b)', 'gi'),
                             repl = '<span class="highlight">$1</span>';

                        this.each(function () {
                            $(this).contents().each(function () {
                                if (this.nodeType === 3 && pattern.test(this.nodeValue)) {
                                    $(this).replaceWith(this.nodeValue.replace(pattern, repl));
                                }
                                else if (!$(this).hasClass('highlight')) {
                                    $(this).highlight(term);
                                }
                            });
                        });
                        return this;
                    };

                    $('*', list).highlight(term);

                    //highlight links
                    $('.externalLink, .tiddlyLink', list).each(function () {
                        var l = $(this),
                            link = l.hasClass('tiddlyLink') ? l.attr('tiddlylink') : l.attr('href').replace('http://', '');
                        if (term.length > 1 && link.indexOf(term) > -1) l.addClass('highlight');
                    })
                }

                //except when in preserved, hide all of class lf-h 
                $('.lf-h', list).not('.lf-preserve .lf-h').addClass('lf-hide');
    
                return true;
            });
        }
    }

    config.shadowTiddlers['StyleSheetListFiltr'] =
    '/*{{{*/\n' +
    '.lf-search {padding:5px;background:#eef;}\n' +
    '.lf-hide {display: none !important;}\n' +
    '.lf-found {background:#F5F5DC;}\n' +
    '.lf-list + br {display:none;}\n' +
    '.lf-label {margin-right:5px;font-weight:bold;}\n' +
    '.lf-filtered .lf-p {display:block;}\n' +
    '.lf-filtered br {display: none;}\n' +
    '.lf-preserve.lf-found br {display: block;}\n' +
    '/*}}}*/';
    store.addNotification('StyleSheetListFiltr', refreshStyles);

})(jQuery);
//}}}