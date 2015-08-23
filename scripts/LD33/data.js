/**
 * holds data constants
 */
 base.registerModule('data', function(module) {
   var visual = base.importModule('visual');
   var level = base.importModule('level');
   var engine = base.importModule('engine');
   var resource = base.importModule('resource');
   
   module.COST_SUMMON = 10;
   
   module.PP_MANA = 1;
   module.PP_FOOD = 1;
   
   module.PP_TIN = 1; //how much it takes to produce it
   module.PP_COPPER = 3;
   module.PP_IRON = 5;
   
   module.init = function init() {
     
   };
 });