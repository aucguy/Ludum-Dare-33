/**
 * does gui
 */
base.registerModule('gui', function(module)
{
	/**
	 * initializes this module
	 */
	module.init = function()
	{
		MenuManager.instance = new MenuManager();
		engine.World.instance.addSprite(MenuManager.instance);
	};
	
	/**
	 * a generic class for a menu
	 */
	var Menu = extend(engine.Group, function()
	{
		Menu.super.constructor.call(this);
		this.addElements();
	});
	module.Menu = Menu;
	
	/**
	 * adds the sprites to this menu. supposed to be overriden
	 */
	Menu.prototype.addElements = function()
	{
	};
	
	/**
	 * an event for when an element is clicked (mouse down and inside the element)
	 */
	EventButtonClick = extend(engine.Event, function()
	{
		EventButtonClick.super.constructor.call(this, EventButtonClick.ID);
	});

	EventButtonClick.ID = engine.Event.nextEventId();

	/**
	 * a button
	 * 	canvas - the special formated button svg
	 * 	x - the x position
	 * 	y - the y positon
	 * 	text - the text on the button
	 */
	var Button = extend(engine.SimpleGraphic, function(canvas, x, y, text)
	{
		Button.super.constructor.call(this, engine.makeCanvas(200, 100), x, y);
		this.rect = new engine.Rect(-1, -1, -1, -1);
		this.text = text;	
		
		var dom = resource.getResource("gui/button.svg");
		xml.removeMetadata(dom);

		function convertElement(id, type)
		{
			var rectattrs = ['x', 'y', 'width', 'height'];
			var element = dom.getElementById(id);
			element.parentNode.removeChild(element);
			var obj = xml.copyAttributes(xml.ensureType(element, type), rectattrs);
			var rect = new engine.Rect(safeParseInt(obj.x), safeParseInt(obj.y), safeParseInt(obj.width), safeParseInt(obj.height));
			return rect;
		}

		var leftrect = convertElement("leftrect", 'rect');
		var midrect = convertElement("midrect", 'rect');
		var rightrect = convertElement("rightrect", 'rect');
		var textrect = new engine.Rect(-1,-1,-1.-1);

		var textelem = dom.getElementById("text");
		textelem.parentNode.removeChild(textelem);
		textrect.left = textelem.getAttribute("x");
		textrect.top = textelem.getAttribute("y");

		var tmp = engine.makeCanvas(1,1).getContext("2d");
		tmp.font = "20px Georgia";
		tmp.textBaseline = "top";
		for(var i=0; i<textelem.childNodes.length; i++)
		{
			if(textelem.childNodes[i].nodeName == "tspan")
			{
				var size = tmp.measureText(textelem.innerHTML);
				textrect.width = size.width;
			}
		}

		var textoffset = textrect.left-leftrect.left;

		var imagewidth = parseInt(dom.getElementsByTagName("svg")[0].getAttribute("width"));
		var imageheight = parseInt(dom.getElementsByTagName("svg")[0].getAttribute("height"));
		var image = engine.makeCanvas(imagewidth, imageheight);
		image.getContext("2d").drawSvg(dom, 0, 0, imagewidth, imageheight);

		dom = null;
		var leftimage = visual.clipCanvas(image, leftrect.left, leftrect.top, leftrect.width, leftrect.height);
		var midimage = visual.clipCanvas(image, midrect.left, midrect.top, midrect.width, midrect.height);
		var rightimage = visual.clipCanvas(image, rightrect.left, rightrect.top, rightrect.width, rightrect.height);

		var canvas = engine.makeCanvas(0, leftimage.height);
		var context = canvas.getContext("2d");

		var textstyle = xml.copyAttributesFromStyle(textelem.getAttribute("style"), ['font-size', 'font-family']);
		textstyle.font = textstyle['font-size']+" "+textstyle['font-family'];
		context.font = textstyle.font;
		context.textBaseline = "bottom";
		var parts = Math.ceil((context.measureText(this.text).width+textoffset)/midimage.width);
		canvas.width = leftimage.width + parts*midimage.width + rightimage.width;
		context.font = textstyle.font; //evidently gets reset when canvas.width is set
		context.textBaseline = "bottom";

		context.drawImage(leftimage, 0, 0);
		var render_x = leftimage.width;
		for(var i=0; i<parts; i++)
		{
			context.drawImage(midimage, render_x, 0);
			render_x += midimage.width;
		}
		context.drawImage(rightimage, render_x, 0);
		context.strokeStyle = "#000000";
		context.strokeText(this.text, leftrect.left + textoffset, textrect.top);
		this.canvas = canvas;
		this.rect.left = this.getX();
		this.rect.top = this.getY();
		this.rect.width = this.canvas.width;
		this.rect.height = this.canvas.height;
	});

	module.Button = Button;
	/**
	 * this buttons bounding box
	 */
	Button.prototype.rect = null;
	/**
	 * the text of the button
	 */
	Button.prototype.text = null;
	
	/**
	 * used to handle 'clicking'
	 */
	Button.prototype.onMouseDown = engine.listener(engine.EventMouseDown.ID, function(event)
	{
		if(this.rect.collidepoint(event.x, event.y))
		{
			this.onEvent(new EventButtonClick(this));
		};
	});
	
	Button.prototype.compile();
	
	/**
	 * a button that when clicked changes the menu
	 * 	@param menuConstr - the menu class to switch to
	 */
	var ButtonMenuChange = extend(Button, function(canvas, x, y, text, menuConstr)
	{
		ButtonMenuChange.super.constructor.call(this, canvas, x, y, text);
		this.menuConstr = menuConstr;
	});
	module.ButtonMenuChange = ButtonMenuChange;
	ButtonMenuChange.prototype.menuConstr = null;
	
	/**
	 * sets the menu
	 */
	ButtonMenuChange.prototype.onClicked = engine.listener(EventButtonClick.ID, function(event)
	{
		MenuManager.instance.setMenu(new this.menuConstr());
	});
	
	ButtonMenuChange.prototype.compile();
	
	/**
	 * a thing that manages menus
	 */
	var MenuManager = extend(engine.Group, function()
	{
		MenuManager.super.constructor.call(this);
		this.currentMenu = null;
	});
	module.MenuManager = MenuManager;
	/**
	 * the menu manager instance
	 */
	MenuManager.instance = null;
	/**
	 * the current menu
	 */
	MenuManager.prototype.currentMenu = null;
	
	/**
	 * sets the menu to a menu object
	 */
	MenuManager.prototype.setMenu = function(menu)
	{
		if(this.currentMenu != null)
		{
			this.removeSprite(this.currentMenu);
		};
		if(menu != null)
		{
			this.addSprite(menu);
		}
		this.currentMenu = menu;
	};
});