/**
 * holds data constants
 */
 base.registerModule('data', function(module) {
   var visual = base.importModule('visual');
   var level = base.importModule('level');
   var engine = base.importModule('engine');
   var resource = base.importModule('resource');
   
   /**
    * custom graphics provider
    */
   var DataGraphicsProvider = base.extend(Object, "DataGraphicsProvider", {
     constructor: function constructor() {
       this.textures = {};
       
       //this.textures.FARM = visual.resize(resource.getResource('textures/farm'), 64, 64);
       //this.textures.ROCKS = this.makeTexture("tan");
       //this.textures.FIELD = this.makeTexture("DarkGreen");
     },
     makeTexture: function makeTexture(color) {
       var canvas = engine.makeCanvas(16, 16);
       var context = canvas.getContext('2d');
       context.fillStyle = color;
       context.fillRect(0, 0, 16, 16);
       return canvas;
     }
   });
   DataGraphicsProvider.instance = null;
   
   /**
    * custom tile provider
    */
   var DataTileProvider = base.extend(Object, "DataTileProvider", {
     constructor: function constructor() {
       this.tileSize = 16;
       this.tiles = {
         NULL: new level.Tile(0, null),
         ROCKS: new level.Tile(1, visual.graphicsProvider.textures.ROCKS),
         FIELD: new level.Tile(2, visual.graphicsProvider.textures.FIELD)
       };
       this.tilesToIds = [this.tiles.NULL, this.tiles.ROCKS, this.tiles.FIELD];
     },
     getTile: function getTile(id) {
       return this.tilesToIds[id];
     },
   });
   
   /**
    * initial camera positions
    */
  module.initialCamX = 0;
  module.initialCamY = 0;
  
  /**
   * scrolling speed; tiles per tick
   */
  module.SCROLL_SPEED = 0.5;
   
   module.init = function init() {
     DataGraphicsProvider.instance = new DataGraphicsProvider();
     visual.setGraphicsProvider(DataGraphicsProvider.instance);
     
     DataTileProvider.instance = new DataTileProvider();
     level.setTileProvider(DataTileProvider.instance);
   };
 });