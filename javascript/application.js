Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function(key) {
    return eval(this.getItem(key));
}

/*
    [
        {
            listData: { name: 'Foo', href: '#list/foo' }
            items: [
                { name: 'Rice', spent: null },
                { name: 'Chicken', spent: 50 }
            ]
        }
    ]
*/
var lists = localStorage.getObject('lists');
var items;
function persistLists() {
    localStorage.setObject('lists', lists)
}
if (lists == null) {
    lists = [];
    persistLists();
}

/* temporary lists fix */
$(lists).each(function () {
    this.listData.name = this.listData.name.replace(/^#/, '');
    if (this.listData.href.match(/^#list\//)) return;
    this.listData.href = this.listData.href.replace(/^#?/, '#list\/');
});
persistLists();
/* END */

function identize(s) {
    return $(s.toLowerCase().match(/\w+/g)).map(function () { return this.replace(/^\w/, function (s) { return s.toUpperCase(); }) }).get().join('');
}

$.extend($, {
    createMenuItem: function (options) {
        var config = {
            name: 'Item name',
            href: '#',
            arrow: false,
            image: null, // TODO: Add support
            comment: null
        };
        if (options) $.extend(config, options);
        
        var $menuItem = $('<li class="menu"><a><span class="name"></span></a></li>');
        $menuItem.find('a').attr('href', config.href);
        $menuItem.find('.name').text(config.name);
        if (config.arrow) $menuItem.find('.name').after('<span class="arrow"></span>');
        if (config.comment) $menuItem.find('.name').after('<span class="comment">'+comment+'</span>');
        
        return $menuItem;
    },
    editList: function ($item, options) {
        var config = {
            placeholder: ''
        };
        if (options) $.extend(config, options);
        
        var name = $item.find('.name').text();
        
        var $editItem = $('<li class="bigfield"><input placeholder="'+config.placeholder+'" type="text" value="'+name+'" /></li>');
        $item.after($editItem).detach();

        $editItem.find('input')
            .bind('blur', function () {
                if ($item.data('list') == null) {
                    // Create item
                    if ($(this).val().match(/\A\s*\Z/) == null) {
                        $item.data('list', {
                            listData: { name: $(this).val().replace(/\A\s+|\s+\Z/g, ''), href: '#list/'+identize($(this).val()) },
                            items: []
                        });
                        lists.push($item.data('list'));
                        persistLists();
                        
                        $item.find('a').attr('href', $item.data('list').listData.href);
                    } else {
                        $item.remove();
                        $editItem.remove();
                        return;
                    }
                } else {
                    // Update item
                    if (!$(this).val().match(/\A\s*\Z/)) {
                        $item.data('list').listData.name = $(this).val().replace(/\A\s+|\s+\Z/g, '');
                        persistLists();
                    }
                }
                $item.find('.name').text($item.data('list').listData.name);
                $editItem.after($item).remove();
            })
            .get(0).focus()
        ;
    },
    editListItem: function ($item, options) {
        var config = {
            placeholder: ''
        };
        if (options) $.extend(config, options);
        
        var name = $item.find('.name').text();
        
        var $editItem = $('<li class="bigfield"><input placeholder="'+config.placeholder+'" type="text" value="'+name+'" /></li>');
        $item.after($editItem).detach();

        $editItem.find('input')
            .bind('blur', function () {
                if ($item.data('list') == null) {
                    // Create item
                    if ($(this).val().match(/\A\s*\Z/) == null) {
                        $item.data('item', {
                            name: $(this).val().replace(/\A\s+|\s+\Z/g, ''), 
                            spent: null
                        });
                        items.push($item.data('item'));
                        persistLists();
                    } else {
                        $item.remove();
                        $editItem.remove();
                        return;
                    }
                } else {
                    // Update item
                    if (!$(this).val().match(/\A\s*\Z/)) {
                        $item.data('item').name = $(this).val().replace(/\A\s+|\s+\Z/g, '');
                        persistLists();
                    }
                }
                $item.find('.name').text($item.data('item').name);
                $editItem.after($item).remove();
            })
            .get(0).focus()
        ;
    }
});

$(function () {
    var $body = $('body');
    var $template = $('#template').remove().removeAttr('id').addClass('screen');
    
  /* Template: Lists */
    var $lists = $template.clone(true);
    $lists.find('#bluerightbutton').hide();
    $lists
        .data('api', {
            handle: function (path) {
            }
        })
        .find('#rightbutton a')
            .click(function (e) {
                $lists.find('li:not(.add) a')
                    .live('click', function (e) { 
                        $.editList($(this).parent('li'));
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    })
                ;
                $lists.find('#rightbutton').hide();
                $lists.find('#bluerightbutton').show();
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
            .end()
        .find('#bluerightbutton a')
            .click(function (e) {
                $lists.find('li:not(.add) a').die('click');
                $lists.find('#rightbutton').show();
                $lists.find('#bluerightbutton').hide();
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
            .end()
        .find('li.add a')
            .click(function (e) {
                var $newItem = $.createMenuItem({ arrow: true, name: '', href: '#' })
                    .addClass('item')
                ;
                $lists.find('li.add').before($newItem);
                $.editList($newItem, { placeholder: 'List name' });
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
            .end()
    ;
    // Restore existing lists
    if (lists.length > 0) {
        $(lists).each(function () {
            $lists.find('#content .pageitem .add').before(
                $.createMenuItem($.extend({ arrow: true }, this.listData))
                    .addClass('item')
                    .data('list', this)
            );
        });
    } else {
    }
    
  /* Template: List */
    var $list = $template.clone(true);
    $list.find('#rightbutton').hide();
    $list.find('#bluerightbutton').hide();
    $list
        .find('#title')
            .text('List not loaded')
            .after('<div id="leftnav"><a href="#"><img src="images/home.png" alt="Home" /></a></div>')
            .end()
        .data('api', {
            handle: function (path) {
                $(lists).each(function () {
                    if (this.listData.href == '#'+SWFAddress.getValue()) {
                        restoreList(this);
                        return false;
                    }
                })
            }
        })
        .find('li.add a')
            .click(function (e) {
                var $newItem = $.createMenuItem({ name: '', href: '#' })
                    .addClass('item')
                ;
                $list.find('li.add').before($newItem);
                $.editListItem($newItem, { placeholder: 'Item name' });
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
        .find('li.add .name')
            .each(function () {
                $(this).text($(this).text().replace('list', 'item'));
            })
    ;
    function restoreList(list) {
        $list.find('#title').text(list.listData.name);
        $list.find('li:not(.add)').remove();
        if (list.items.length > 0) {
            items = list.items;
            $(list.items).each(function () {
                $list.find('#content .pageitem .add').before(
                    $.createMenuItem(this)
                        .addClass('item')
                        .data('item', this)
                );
            });
        } else {
        }
    }
    
  /* Navigation */
    $body.append($lists);
    SWFAddress.onChange = function () {
        $body.find('.screen').detach();
        
        var path = SWFAddress.getPathNames();
        switch (path[0]) {
            case 'list':
                $body.append($list);
                $list.data('api').handle(path.slice(1));
                break;
            default:
                $body.append($lists);
                $lists.data('api').handle(path.slice(1));
                SWFAddress.setValue('');
        }
    }
});
