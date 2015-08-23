/**
 * run the game!
 */
base.registerModule('main', function(module) {
  var run = base.importModule('run');
  var resource = base.importModule('resource');
  
  /**
   * starts the resource loading
   */
  function startLoading() {
    resource.setResourcePath('/');
    resource.loadJson('index', '/assets/index.json', null, resource.query);
  }
  
  module.menuManager = null;
  
  /**
   * initializes game-specific modules
   */
  run.onInit = function onInit() {
    var engine = base.importModule('engine');
    var menu = base.importModule('menu');
    var gui = base.importModule('gui');
    var data = base.importModule('data');
    
    data.init();
    
    var menuManager = new gui.MenuManager();
    module.menuMananger = menuManager;
    menuManager.setMenu(new menu.MenuPlay());
    engine.World.instance.addSprite(menuManager);
  };
 
  startLoading();
   run.initDone = true;
});