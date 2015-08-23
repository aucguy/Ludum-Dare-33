base.registerModule('menu', function(module) {
  var engine = base.importModule('engine');
  var gui = base.importModule('gui');
  var level = base.importModule('level');
  var util = base.importModule('util');
  var resource = base.importModule('resource');
  var data = base.importModule('data');
  var visual = base.importModule('visual');
  var xml = base.importModule('xml');
  
  /**
   * renders an svg
   **/
  function renderSvg(svg) {
    xml.removeMetadata(svg);
    var image = engine.makeCanvas(svg, svg.width, svg.height);
    canvg(image, svg);
    return image;
  }
  
  /**
   * the menu for playing
   */
  var MenuPlay = base.extend(gui.Menu, "MenuPlay", {
    constructor: function MenuPlay() {
      this.variables = {'theLabel':'hello!', 'theBar':0.75, 'theButton':null};
      this.constructor$Menu();
      MenuPlay.instance = this;
    },
    addElements: function addElements() {
      this.mainPanel = new Panel(new util.Rect(0, 0, 640, 480), "gui/play", this.variables);
      this.addSprite(this.mainPanel);
    },
    render: engine.listener(engine.EventRender.ID, function render(event) {
      event.context.fillStyle = '#FFFFFF';
      event.context.fillRect(0, 0, event.context.canvas.width, event.context.canvas.height);
      this.mainPanel.render(event.context);
    }),
    onMouseDown: engine.listener(engine.EventMouseDown.ID, function onMouseDown(event) {
      this.mainPanel.onMouseDown(event.x, event.y);
    }),
    onMouseMove: engine.listener(engine.EventMouseMove.ID, function onMouseMove(event) {
      this.mainPanel.onMouseMove(event.x, event.y);
    })
  });
  MenuPlay.prototype.compile();
  module.MenuPlay = MenuPlay;
  MenuPlay.instance = null;
  
  /**
   * a gui component
   */
  var Component = base.extend(engine.Sprite, "Component", {
    constructor: function Component(element, attrs) {
      this.id = element.id;
      this.name = attrs == null ? null : attrs.name;
    },
    render: function render(context) {
    },
    onMouseDown: function onMouseDown(x, y) {
    },
    onMouseMove: function onMouseMove(x, y) {
    },
    getValue: function getValue() {
      return MenuPlay.instance.variables[this.name];
    }
  });
  
  /**
   * an element with that has an svg for viewing inside a viewport
   */
  var Panel = base.extend([engine.Group, Component], "Panel", {
    constructor: function Panel(viewport, guiName) {
      this.constructor$Group();
      this.viewport = viewport;
      this.scrollbarV = null; //used for scrolling
      this.scrollbarH = null;
      this.height = 0; //height of the entire svg
      this.setupElements(resource.getResource(guiName));
    },
    /**
     * turns an svg file into a gui elements
     */
    setupElements: function setupElements(svg) {
      //copied because removing elements from the svg will remove the elements from
      //the list too
      var elements = util.copyArray(svg.getElementsByTagName('*'));
      var components = [];
      var panels = {};
      var scrollbarsV = {};
      var scrollbarsH = {};
      var i;
      for(i=0; i<elements.length; i++) {
        var element = elements[i];
        var component;
        if(element.id.startsWith('Z')) { //it's a component!
          var attrs = xml.parseStyle(element.id.substring(1), '_');
          if(attrs.type == 'text') {
            components.push(new TextComponent(element, attrs));
          } else if(attrs.type == 'bar') {
            components.push(new BarComponent(element, attrs));
          } else if(attrs.type == 'button') {
            this.addSprite(new ButtonComponent(element, attrs));
          } else if(attrs.type == 'scrollbarV') {
            component = new ScrollBarV(element, attrs);
            components.push(component);
            scrollbarsV[attrs.name] = component;
          } else if(attrs.type == 'scrollbarH') {
            component = new ScrollBarH(element, attrs);
            components.push(component);
            scrollbarsH[attrs.name] = component;
          } else if(attrs.type == 'viewport') {
            var x = Math.round(element.x.baseVal.value);
            var y = Math.round(element.y.baseVal.value);
            var width = Math.round(element.width.baseVal.value);
            var height = Math.round(element.height.baseVal.value);
            var viewport = new util.Rect(x, y, width, height);
            component = new Panel(viewport, "gui/" + attrs.name);
            components.push(component);
            panels[attrs.name] = component;
          }
          element.parentNode.removeChild(element); //so doesn't show up in svg
        }
      }
      
      //link panels and scrollbars so scrolling works
      for(var name in panels) {
        var panel = panels[name];
        var scrollbar = scrollbarsV[name];
        if(scrollbar != null) {
          panel.scrollbarV = scrollbar;
        }
        scrollbar = scrollbarsH[name];
        if(scrollbar != null) {
          panel.scrollbarH = scrollbar;
        }
      }
      
      this.addSprite(new SvgComponent(svg), null);
      this.height = svg.getElementsByTagName('svg')[0].height.baseVal.value;
      
      //adding after so components appear in front of the svg
      for(i=0; i<components.length; i++) {
        this.addSprite(components[i]);
      }
    },
    render: function render(context) {
      context.save();
      context.beginPath();
      var vp = this.viewport;
      context.rect(vp.left, vp.top, vp.width, vp.height); //clipping view
      context.clip();
      
      context.translate(vp.left, vp.top);
      context.translate(-this.getProgressH(), -this.getProgressV()); //scrolling
      
      for(var i=0; i<this.sprites.length; i++) {
        var sprite = this.sprites[i];
        sprite.render(context);
      }
      context.restore();
    },
    onMouseDown: function onMouseDown(x, y) {
      if(this.viewport.collidepoint(x, y)) {
        x -= this.viewport.left - this.getProgressH();
        y -= this.viewport.top - this.getProgressV();
        
        for(var i=0; i<this.sprites.length; i++) {
          var sprite = this.sprites[i];
          sprite.onMouseDown(x, y);
        }
      }
    },
    onMouseMove: function onMouseMove(x, y) {
      if(this.viewport.collidepoint(x, y)) {
        x -= this.viewport.left - this.getProgressH();
        y -= this.viewport.top - this.getProgressV();
        
        for(var i=0; i<this.sprites.length; i++) {
          var sprite = this.sprites[i];
          sprite.onMouseMove(x, y);
        }
      }
    },
    getProgressV: function getProgressV() {
      return this.scrollbarV === null ? 0 : this.scrollbarV.percent * 
          (this.height - this.viewport.height);
    },
    getProgressH: function getProgressV() {
      return this.scrollbarH === null ? 0 : this.scrollbarH.percent * 
          (this.height - this.viewport.height);
    }
  });
  Panel.prototype.compile();
  
  var SvgComponent = base.extend(Component, "SvgComponent", {
    constructor: function SvgComponent(svg, attrs) {
      this.constructor$Component(svg, attrs);
      var image = renderSvg(svg);
      //split up to prevent lag on chrome during ctx.drawImage()
      this.sheet = visual.splitSheet(image, 64, 64);
      this.width = image.width;
      this.height = image.height;
    },
    render: function render(context) {
      for(var x=0; x<this.width; x+=64) {
        for(var y=0; y<this.height; y+=64) {
          context.drawImage(this.sheet.get([x/64, y/64]), x, y);
        }
      }
    }
  });
  
  var TextComponent = base.extend(Component, "TextComponent", {
    constructor: function TextComponent(element, attrs) {
      this.constructor$Component(element, attrs);
      var offset = base.safeParseInt(element.style.fontSize);
      this.x = Math.round(element.x.baseVal[0].value) - offset;
      this.y = Math.round(element.y.baseVal[0].value) - offset;
      this.font = element.style.fontSize + " " + element.style.fontFamily;
      this.text = "test"; //hardcoded for now
      var tspan = element.getElementsByTagName('tspan')[0];
      this.fillStyle = tspan.style.fill;
    },
    render: function render(context) {
      context.font = this.font;
      context.fillStyle = this.fillStyle;
      context.fillText(this.text, this.x, this.y);
    }
  });
  
  /**
   * somethings that a rectangle
   */
  var RectComponent = base.extend(Component, "RectComponent", {
    constructor: function RectComponent(element, attrs) {
      this.constructor$Component(element, attrs);
      this.x = Math.round(element.x.baseVal.value);
      this.y = Math.round(element.y.baseVal.value);
      this.width = Math.round(element.width.baseVal.value);
      this.height = Math.round(element.height.baseVal.value);
      this.fillStyle = element.style.fill;
    },
    render: function render(context) {
      context.fillStyle = this.fillStyle;
      context.fillRect(this.x, this.y, this.getWidth(), this.height);
    },
    getWidth: function getWidth() {
      return this.width;
    },
    onMouseDown: function onMouseDown(x, y) {
      var rect = new util.Rect(this.x, this.y, this.getWidth(), this.height);
      if(rect.collidepoint(x, y)) {
        this.onClick(x, y);
      }
    },
    /**
     * called when the mouse is clicked on this element
     */
    onClick: function onClick(x, y) {
    }
  });
  
  var BarComponent = base.extend(RectComponent, "BarComponent", {
    constructor: function BarComponent(element, attrs){
      this.constructor$RectComponent(element, attrs);
    },
    getWidth: function getWidth() {
      return this.width * this.getValue();
    }
  });
  
  var ButtonComponent = base.extend(RectComponent, "ButtonComponent", {
    constructor: function ButtonComponent(element, attrs) {
      this.constructor$RectComponent(element, attrs);
    },
    onClick: function onClick(x, y) {
      console.log("onClick()");
    }
  });
  ButtonComponent.prototype.compile();
  
  var ScrollBarComponent = base.extend(RectComponent, "ScrollBarComponent", {
    constructor: function ScrollBarComponent(element, attrs) {
      this.constructor$RectComponent(element, attrs);
      this.grabPoint = -1; //where the scrollbar was clicked
      this.rangeLow = this.getLow();
      this.rangeHigh = this.getHigh(); //the scrolling range
      this.setSize(20);
      this.percent = 0; //percent from top to bottom of scrolling
    },
    onClick: function onClick(x, y) {
      this.grabPoint = this.coord(x, y) - this.getLow();
    },
    onUnClick: engine.listener(engine.EventMouseUp.ID, function onUnClick(event) {
      this.grabPoint = -1;
    }),
    onMouseMove: function onMouseMove(x, y) {
      if(this.grabPoint != -1) {
        var scroll = this.coord(x, y) - this.grabPoint;
        if(scroll < this.rangeLow) {
          scroll = this.rangeLow;
        } else if (scroll > this.rangeHigh) {
          scroll = this.rangeHigh;
        }
        this.setLow(scroll);
        this.percent = (this.getLow() - this.rangeLow) / (this.rangeHigh - this.rangeLow);
      }
    },
    getLow: base.abstractMethod, //low bounds
    setLow: base.abstractMethod,
    getHigh: base.abstractMethod, //high bounds
    setSize: base.abstractMethod, //width or height
    coord: base.abstractMethod //chooses between x and y
  });
  ScrollBarComponent.prototype.compile();

  var ScrollBarV = base.extend(ScrollBarComponent, "ScrollBarV", {
    constructor: function ScrollBarV(element, attrs) {
      this.constructor$ScrollBarComponent(element, attrs);
    },
    getLow: function getLow() {
      return this.y;
    },
    setLow: function setLow(y) {
      this.y = y;
    },
    getHigh: function getHigh() {
      return this.y + this.height;
    },
    setSize: function setSize(height) {
      this.height = height;
    },
    coord: function coord(x, y) {
      return y;
    }
  });
  
  var ScrollBarH = base.extend(ScrollBarComponent, "ScrollBarH", {
    constructor: function ScrollBarH(element, attrs) {
      this.constructor$ScrollBarComponent(element, attrs);
    },
    getLow: function getLow() {
      return this.x;
    },
    setLow: function setLow(x) {
      this.x = x;
    },
    getHigh: function getHigh() {
      return this.x + this.width;
    },
    setSize: function setSize(width) {
      this.width = width;
    },
    coord: function coord(x, y) {
      return x;
    }
  });
});
