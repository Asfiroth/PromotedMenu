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

		ExecuteOrDelayUntilScriptLoaded("sp.js", "SP.ClientContext", BuildPrincipalMenu);

		var principalMenuList;
		function BuildPrincipalMenu(){
			var clientContext = new SP.ClientContext(settings.masterSite);
			var webSite = clientContext.get_web();
			var lists = webSite.get_lists();
			var menuListRef = list.getByTitle(settings.menuList);
			principalMenuList = menuListRef.getItems('');

			var cols = '';
			$.each(settins.menuColumns, function(){
				cols += this + ',';
			});

			cols = cols.substring(0, cols.length - 1);

			clientContext.load(principalMenuList, "Include(" + cols +")");
			clientContext.executeQueryAsync(PrincipalMenuQuerySucceded, onQueryFailed);
		}

		function PrincipalMenuQuerySucceded(){
			var menu = '<ul class="menu" ' + 
						'style="background-color: ' + settings.menuColor +'">';
			var listEnumerator = principalMenuList.getEnumerator();
			
			while(listEnumerator.moveNext()){
				var oField = listEnumerator.get_current();

				menu += '<li data-id"' + oField.get_id() + '" '+
						(!oField.get_item(settings.hasSubMenuColumn)) ?
						'class="no-sub" data-url="' + oField.get_item(settings.subMenuRedirectColumn).get_url() + '"' 
						: 'class="sub"') + '>' +
						'<a ' + 
						(settings.customImageColumn !== '' ? 
							'style="background-image:url(\'' + oField.get_item(settings.customImageColumn).get_url() + "')" : '') +
						'data-img="url(\''
			}			
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