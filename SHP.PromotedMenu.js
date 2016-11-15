(function($){
	$.fn.isOnScreen = function(){
		var myScreen = $(window);
		var viewport = {
			top: myScreen.scrollTop(),
			left: myScreen.scrollLeft()
		}
		viewport.right = viewport.left + myScreen.width();
		viewport.bottom = viewport.top + myScreen.height();

		var bounds = this.offset();
		bounds.right = bounds.left + this.outerWidth();
		bounds.bottom = bounds.top + this.outerHeight();

		return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
	};

	if (!String.prototype.format) {
 		String.prototype.format = function() {
    	var args = arguments;
    	return this.replace(/{(\d+)}/g, function(match, number) { 
      		return typeof args[number] != 'undefined'
        	? args[number]
        	: match;
    		});
  		};
	}

	$.fn.PromotedMenu = function(options){
		var originDiv = this;

		var defaultSettings = {
			masterSite: '',
			menuList: '',
			subMenuLibrary: '',
			menuColumns: [],
			subMenuColumns: [],
			orderByColumn: '',
			SubMenuLookupColumn: '',
			colorColumn: '',
			subMenuRedirectColumn: '',
			hasSubMenuColumn: '',
			customImageColumn: '',
			customSelectImageColumn: '',
			menuColor: '',
			hoverMenuColor: '',
			menuTextColor: '',
			menutTextHoverColor: ''
		};

		var settings = $.extend({}, defaultSettings, options);

		if(settings.masterSite == ''){
			throw new promotedMenuExeption("masterSite", "SharePoint Master Site is not set");
		}

		if(settings.menuList == ''){
			throw new promotedMenuExeption("menuList", "The List of the Menu is not set");
		}

		if(settings.menuColor == ''){
			throw new promotedMenuExeption("menuColor", "The menu must have a color");
		}

		ExecuteOrDelayUntilScriptLoaded("sp.js", "SP.ClientContext", BuildPrincipalMenu);

		var clientContext = new SP.ClientContext(settings.masterSite);
		var webSite = clientContext.get_web();
		var lists = webSite.get_lists();
		var tileWidth = 160;
		var tileMargin = 10;

		var principalMenuList;
		var subMenuList;
		
		function BuildPrincipalMenu(){
			var menuListRef = list.getByTitle(settings.menuList);
			principalMenuList = menuListRef.getItems('');

			clientContext.load(principalMenuList, "Include({0})".format(settins.menuColumns.join()));
			clientContext.executeQueryAsync(PrincipalMenuQuerySucceded, onQueryFailed);
		}

		function PrincipalMenuQuerySucceded(){
			var menuItem = '';	
			var listEnumerator = principalMenuList.getEnumerator();
			while(listEnumerator.moveNext()){
				var oField = listEnumerator.get_current();
				var hasSubMenu = oField.get_item(settings.hasSubMenuColumn);
				var itemClass = hasSubMenu ? 'sub' : 'no-sub';
				var itemUrl = hasSubMenu ? oField.get_item('url').get_url() : '';
				menuItem += '<li data-id="{0}" class="{1}" data-url="{2}"><a>{3}</a></li>'.format(oField.get_id(), itemClass, itemUrl, oField.get_item('Title'));
			}
			var menu = '<ul class="menu" style="background-color: {0};">{1}</ul>'.format(settings.menuColor, menuItem);
			$(originDiv).append(menu);

			$('.sub').on('click', function(event){
				event.preventDefault();
				if($(this).hasClass('selected'))
					subMenuListOut(this);
				else
					subMenuListIn(this);
			});

			$('.no-sub').on('click', function(){
				$(location).attr('href', $(this).attr('data-url'));
			});
		}

		function SubMenuListIn(sender){
			this.menuId = $(sender).attr('data-id');
			var camlQuery = new SP.CamlQuery();
			var queryString = 
			'<View>' + 
				'<Query>' + 
				 	'<Where>' +
						'<Eq>' +
							'<FieldRef Name=\'MenuSup\' LookupId=\'TRUE\' />' + 
							'<Value Type=\'Lookup\'>{0}</Value>' +
						'</Eq>' +
					'</Where>' +
					'<OrderBy>' +
						'<FieldRef Name=\'{1}\' Ascending=\'TRUE\' />' +
					'</OrderBy>'+
				'</Query>' +
			'</View>'

			camlQuery.set_viewXml(queryString.format(this.menuId, settings.orderByColumn));
			var list = lists.getByTitle(settings.subMenuLibrary);
			subMenuList = list.getItems(camlQuery);
			clientContext.load(subMenuList, 'Include({0})'.format(subMenuColumns.join()));
  			clientContext.executeQueryAsync(onSubMenuCallSucceded, onQueryFailed);
		}

		function onSubMenuCallSucceded(){
			if(subMenuList.get_count() == 0) return;
			$('.menu li').removeClass('selected');
			$('li[data-id="{0}"]'.format(this.menuId)).addClass('selected');
			$('.sm').remove();
     		var hasNotVisible = $(window).width() < ((subMenuList.get_count() * tileWidth) + tileMargin);
     		var navigationDiv = '';
     		var listEnumerator = subMenuList.getEnumerator();
     		if(hasNotVisible){
     			var back = '{0}/SiteAssets/images_icon/before.png'.format(settings.masterSite);
     			var forward = '{0}/SiteAssets/images_icon/after.png'.format(settings.masterSite);

     			navigationDiv = 
     				'<div class="navigation">' +
     					'<a title="Anterior" class="a">' +
     						'<span class="sl-link not-active">'+
     							'<img src="{0}" alt="" class="move"/>'+
     						'</span>'+
     					'</a>'+
     					'<a title="Siguiente" class="s">'+
     						'<span class="sl-link active">' +
     							'<img src="{1}" alt="" class="move"/>' +
     						'</span>' +
     					'</a>' +
     				'</div>';
     			navigationDiv.format(back, forward);
     		}

     		var tiles = '';
     		var actual = 0;
     		while(listEnumerator.moveNext()){
     			actual++;
     			var isFirst = actual == 1;
     			var isLast = actual == subMenuList.get_count();

     			var currentClass = isFirst ? 'first' : isLast ? 'last' : '';
     			var oField = listEnumerator.get_current();
     			var url = ofield.get_item('url');

     			var filename = ofield.get_item('FileLeafRef');              
      			var dir = ofield.get_item('FileDirRef');
      			filename = dir + '/' + filename;

     			var tile = 
     				'<div class="c1 {0}">'+
     					'<div class="c2" style="background-color: {1}">' +
     						'<a href="{2}" target="_self">' + 
     							'<img src="{3}" class="img" alt=""/>' +
     							'<div class="link" offy="100">' +
     								'<ul><li>{4}</li></ul>' +
     							'</div>'+
     						'</a>' +
     					'</div>' +
     				'</div>';

     			tiles += tile.format(currentClass, url.get_url(), ofield.get_item(settings.colorColumn), filename, url.get_description())
     		}
     		var content = '<div class="submenu">{0}</div><div class="return"><span class="back">Contraer</span></div>'.format(tiles);
     		var subMenuDiv = '<div class="sm">{0}{1}</div>'.format(navigationDiv, content);
     		if(hasNotVisible){
     			$('.s').on('click', advance);
      			$('.sm').css({'height' : 250, 'overflow-x' : 'hidden' });						  
      			$('.submenu').css({ 'top' : 190, 'width' : (subMenuList.get_count() * tileWidth) });
     			$('.return').css({ 'top' : 173 }); 
     		}

     		$('.back').on('click',subMenuListOut);
      		$('.sm').slideDown(500);
      		$('.submenu').slideDown(500);
      		$('.c2').mouseover(inMouse).mouseout(outMouse);
		}



		function subMenuListOut(sender){
    		$('.submenu').slideUp(500);
    		$('.sm').slideUp(500);
    		$('.menu li').removeClass('selected');
		}

		function onQueryFailed(sender, args) {    
			alert('Ha ocurrido un error al momento de llamar al servidor.');
			console.log(args);
		}

		function promotedMenuExeption(value, message){
			this.value = value;
			this.message = message;
			this.toString = function(){
				return this.value + 'is required\n' + this.message;
			}
		}
	};

	

})(JQuery)