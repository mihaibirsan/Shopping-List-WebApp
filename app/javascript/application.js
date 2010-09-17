Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function(key) {
    return eval(this.getItem(key));
}

var versionString = '0.6.4';

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
    return $(s.toLowerCase().match(/\w+/g)).map(function () { 
		return this.replace(/^\w/, function (s) { return s.toUpperCase(); }) 
	}).get().join('');
}
function evalSpent(spent, format) {
    if (spent == null || spent.match && spent.match(/^\s*$/)) return null;
    var spentValue = 'NaN';
    try {
        spentValue = eval('('+spent+')');
        if (format) spentValue = (''+(spentValue*100)).replace(/(\d\d)(\..*|$)/, '.$1');
    } catch (e) {}
    return spentValue;
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
        $menuItem.prepend('<span class="deleteicon"></span>');
        $menuItem.append('<span class="dragindicator"></span>');
        $menuItem.append('<span class="deletebuttoncontainer"><span class="deletebutton">Delete</span></span>');
        if (config.comment) $menuItem.find('.name').after('<span class="comment">'+config.comment+'</span>');
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
                    if (!$(this).val().match(/^\s*$/)) {
                        $item.data('list', {
                            listData: { name: $(this).val().replace(/^\s+|\s+$/g, ''), href: '#list/'+identize($(this).val()) },
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
                    if (!$(this).val().match(/^\s*$/)) {
                        $item.data('list').listData.name = $(this).val().replace(/^\s+|\s+$/g, '');
                        persistLists();
                    }
                }
                $item.find('.name').text($item.data('list').listData.name);
                $editItem.after($item).remove();
            })
            .get(0).focus()
        ;
    },
	deleteList: function ($item) {
		var list = $item.data('list');
		lists.splice(lists.indexOf(list), 1);
		persistLists();
		
		$item.addClass('deleted');
		$item.bind('webkitTransitionEnd', function (e) {
			$item.remove();
		});
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
                if ($item.data('item') == null) {
                    // Create item
                    if ($(this).val().match(/^\s*$/) == null) {
                        $item.data('item', {
                            name: $(this).val().replace(/^\s+|\s+$/g, ''), 
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
                    if (!$(this).val().match(/^\s*$/)) {
                        $item.data('item').name = $(this).val().replace(/^\s+|\s+$/g, '');
                        persistLists();
                    }
                }
                $item.find('.name').text($item.data('item').name);
                $editItem.after($item).remove();
            })
            .get(0).focus()
        ;
    },
    editListItemSpending: function ($item, options, callback) {
        var config = {
            placeholder: 'Spent money'
        };
		if (typeof options == 'function') {
			callback = options;
			options = null;
		}
        if (options) $.extend(config, options);
        
        var spending = $item.data('item').spent;
        if (spending == null) spending = '';
        
        var $editItem = $('<li class="smallfield"><input placeholder="'+config.placeholder+'" type="number" value="'+spending+'" /></li>');
		$editItem.prepend($item.find('.name').clone(true));
        $item.after($editItem).detach();

        $editItem.find('input')
            .bind('blur', function () {
                var val = $(this).val().replace(/^\s+|\s+$/g, '');
                if (val == '') {
					$item.data('item').spent = null;
					persistLists();
					$item.find('.comment').remove();
					$item.removeClass('bought');
				} else if (!isNaN(evalSpent(val))) {
					$item.data('item').spent = $(this).val().replace(/^\s+|\s+$/g, '');
					persistLists();
					if ($item.find('.comment').size() == 0) $item.find('.name').after('<span class="comment"></span>');
                    $item.find('.comment').text(evalSpent($item.data('item').spent, true));
                    $item.addClass('bought');
				}
                
				if (callback != undefined) callback();
                $editItem.after($item).remove();
            })
            .get(0).focus()
        ;
    },
	deleteListItem: function ($item) {
		var item = $item.data('item');
		items.splice(items.indexOf(item), 1);
		persistLists();
		
		$item.addClass('deleted');
		$item.bind('webkitTransitionEnd', function (e) {
			$item.remove();
		});
	}
});

$(function () {
    var $body = $('body');
    var $template = 
		$('<div />')
			.addClass('screen')
			.haml(
				['#topbar',
					['#title', 'Shopping lists'],
					['#rightbutton.edit', 
						['%a', { href: '#edit-lists' }, 'Edit']],
					['#bluerightbutton.done',
						['%a', { href: '#done-edit-lists' }, 'Done']]],
				['#content',
					['%ul.pageitem',
						['%li.menu.add',
							['%a', { href: '#' },
								['%span.name', '✚ Add list']]]]],
				['#footer', 'Version ' + versionString + ' • Powered by iWebKit']
			)
		;
	$('#loading-screen').remove();
    
  /* Template: Lists */
 	$('body').append($template.clone(true).attr('id', 'lists-screen'));
    var $lists = $('#lists-screen').detach();
    $lists.find('#bluerightbutton').hide();
    $lists
        .data('api', {
            handle: function (path) {
            }
        })
        .find('#rightbutton a')
            .click(function (e) { 
                $lists.addClass('editing');
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
                $lists.removeClass('editing');
				$lists.find('li').removeClass('deleting');
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
        .find('.deleteicon')
            .live('click touchstart', function () {
				var $li = $(this).parent('li');
				if ($li.hasClass('deleting')) {
					$(this).parent('li').removeClass('deleting');
				} else {
					$(this).parents('ul').eq(0).find('li').removeClass('deleting');
					$(this).parent('li').addClass('deleting');
				}
            })
            .end()
        .find('.deletebutton')
            .live('click touchstart', function (e) {
				$.deleteList($(this).parents('li').eq(0));
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
 	var itemClickHandler = function (e) { 
        $.editListItem($(this).parent('li'));
        e.stopPropagation();
        e.preventDefault();
        return false;
    };
	var updateSum = function (e) {
		var sum = 0;
		for (var i in items) {
			if (items[i].spent != null)
				sum += evalSpent(items[i].spent);
		}
		$list.find('#sum').text(evalSpent(sum, true));
	};
 	$('body').append($template.clone(true).attr('id', 'list-screen'));
    var $list = $('#list-screen').detach();
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
        .find('#rightbutton a')
            .click(function (e) { 
                $list.addClass('editing');
                $list.find('li:not(.add) a')
                    .live('click', itemClickHandler)
                ;
                $list.find('#rightbutton').hide();
                $list.find('#bluerightbutton').show();
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
            .end()
        .find('#bluerightbutton a')
            .click(function (e) {
                $list.removeClass('editing');
				$list.find('li').removeClass('deleting');
                $list.find('li:not(.add) a').die('click', itemClickHandler);
                $list.find('#rightbutton').show();
                $list.find('#bluerightbutton').hide();
				updateSum();
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
            .end()
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
			.end()
        .find('.deleteicon')
            .live('click touchstart', function () {
				var $li = $(this).parent('li');
				if ($li.hasClass('deleting')) {
					$(this).parent('li').removeClass('deleting');
				} else {
					$(this).parents('ul').eq(0).find('li').removeClass('deleting');
					$(this).parent('li').addClass('deleting');
				}
            })
            .end()
        .find('.deletebutton')
            .live('click touchstart', function (e) {
				$.deleteListItem($(this).parents('li').eq(0));
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
            .end()
        .find('li.item a')
            .live('click', function (e) {
				var $li = $(this).parent('li');
				if ($list.is('.editing')) return;
				$.editListItemSpending($li, function () { updateSum(); });
                e.stopPropagation();
                e.preventDefault();
                return false;
            })
			.end()
        .find('li.add .name')
            .each(function () {
                $(this).text($(this).text().replace('list', 'item'));
            })
			.end()
		.find('#content')
			.after('<div id="sum" />')
			.end()
		.find('#footer')
			.remove()
			.end()
    ;
    function restoreList(list) {
        $list.find('#title').text(list.listData.name);
        $list.find('li:not(.add)').remove();
        items = list.items;
        if (items.length > 0) {
            $(list.items).each(function () {
                $list.find('#content .pageitem .add').before(
                    $.createMenuItem($.extend({ comment: evalSpent(this.spent, true) }, this))
                        .addClass('item')
                        .addClass(this.spent != null ? 'bought' : null)
                        .data('item', this)
                );
            });
        } else {
        }
		updateSum();
    }
    
  /* Navigation */
    $body.append($lists);
    SWFAddress.onChange = function () {
        $body.find('.screen').removeClass('editing').detach();
        
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
