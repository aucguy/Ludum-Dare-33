base.registerModule('minions', function(module) {
  var menu = base.importModule('menu');
  var engine = base.importModule('engine');
  var data = base.importModule('data');
  
  function setVariable(key, value) {
    menu.MenuPlay.instance.variables[key] = value;
  }
  
  /**
   * represents a minion!
   */
  var Minion = base.extend(Object, 'Minion', {
    constructor: function Minion() {
      this.skillFarming = 1;
      this.skillMining = 2;
      this.hp = 10;
      this.name = "John Smith";
    },
    /**
     * synchronizes the minion data with the gui
     */
    syncSlot: function syncSlot(station, slot) {
      var prefix = station + slot;
      setVariable(prefix + ".name", this.name);
      setVariable(prefix + ".farmSkill", this.skillFarming);
      setVariable(prefix + ".mineSkill", this.skillMining);
    },
    /**
     * returns the skill at a particular station
     */
    getSkillAtStation: function getSkillAtStation(station) {
      var name = station.name;
      if(name == "fields") {
        return this.skillFarming;
      } else if(name == "mountains") {
        return this.skillMining;
      }
      return 0;
    },
    levelup: function levelup(station, slot) {
      if(station.name == "fields") {
        this.skillFarming++;
      } else if(station.name == "mountains") {
        this.skillMining++;
      }
      this.syncSlot(station.name, slot);
    },
    feed: function feed(station, slot) {
      var fields = Game.instance.stationFields;
      if(fields.supplies.food === 0) {
        station.removeMinion(this); //die
      } else {
        fields.supplies.food--;
      }
    },
  });
  
  /**
   * a station
   */
  var Station = base.extend(Object, 'Station', {
    constructor: function Station(name) {
      this.name = name;
      this.maxMinions = 4;
      this.minions = []; //people there
      this.production = 0; //how much it can produce
      if(this.name == "fields") {
        this.supplies = {mana: 20, food: 20};
        this.producing = {mana: 0, food: 0};
      } else if(this.name == "mountains") {
        this.supplies = {tin: 0, copper: 0, iron: 0};
        this.producing = {tin: 0, copper: 0, iron: 0};
      } else {
        this.supplies = {};
      }
      this.removals = [];
      this.syncGui();
    },
    addMinion : function addMinion(minion) {
      if(this.minions.length < this.maxMinions) {
        this.minions.push(minion);
        minion.syncSlot(this.name, this.minions.length-1);
        this.calculateProduction();
        return true;
      }
      return false;
    },
    removeMinion: function removeMinion(minion) {
      this.removals.push(minion);
    },
    flushRemovals: function flushRemovals() {
      var i;
      if(this.removals.length === 0) {
        return;
      }
      for(i=0; i<this.removals.length; i++) {
        var minion = this.removals[i];
        var index = this.minions.indexOf(minion);
        if(index != -1) {
          this.minions.splice(index, 1);
        }
      }
      for(i=0; i<this.minions.length; i++) {
        this.minions[i].syncSlot(this.name, i);
      }
      for(i=this.minions.length; i<this.maxMinions; i++) {
        this.clearSlot(i);
      }
      this.calculateProduction();
      this.reduceProducing();
      this.syncGui();
      this.removals = [];
    },
    reduceProducing: function reduceProducing() {
      while(this.production < this.getTotalProducing()) {
        if(this.name == 'fields') {
          if(this.producing.mana > 0) {
            this.producing.mana--;
          } else if(this.producing.food > 0) {
            this.producing.food--;
          } else {
            break;
          }
        } else if(this.name == 'mountains') {
          if(this.producing.tin > 0) {
            this.producing.tin--;
          } else if(this.producing.copper > 0) {
            this.producing.copper--;
          } else if(this.producing.iron > 0) {
            this.producing.iron--;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    },
    /**
     * set the slot to blank data
     */
    clearSlot: function clearSlot(slot) {
      var prefix = this.name + slot;
      setVariable(prefix + '.name', 'null');
      setVariable(prefix + '.farmSkill', 0);
      setVariable(prefix + '.mineSkill', 0);
    },
    gatherSupplies: function gatherSupplies() {
      if(this.name == "fields") {
        this.supplies.mana += this.producing.mana;
        this.supplies.food += this.producing.food;
      } else if(this.name == "mountains") {
        this.supplies.tin += this.producing.tin;
        this.supplies.copper += this.producing.copper;
        this.supplies.iron += this.producing.iron;
      }
      this.syncGui();
    },
    levelupMinions: function levelupMinions() {
      for(var i=0; i<this.minions.length; i++) {
        this.minions[i].levelup(this, i);
      }
      this.calculateProduction();
      this.syncGui();
    },
    feedMinions: function feedMinions() {
      for(var i=0; i<this.minions.length; i++) {
        this.minions[i].feed(this, i);
      }
      this.flushRemovals();
    },
    calculateProduction: function calculateProduction() {
      this.production = 0;
      for(var i=0; i<this.minions.length; i++) {
        this.production += this.minions[i].getSkillAtStation(this);
      }
    },
    /**
     * syncs the station data with the gui
     */
    syncGui: function syncGui() {
      if(this.name == "fields") {
        setVariable('manaText', this.supplies.mana);
        setVariable('foodText', this.supplies.food);
        setVariable('plantText', this.producing.mana + '/' + this.producing.food);
      } else if(this.name == "mountains") {
        setVariable('tinText', this.supplies.tin);
        setVariable('copperText', this.supplies.copper);
        setVariable('ironText', this.supplies.iron);
        setVariable('oreText', this.producing.tin + '/' + this.producing.copper +
            '/' + this.producing.iron);
      }
      setVariable(this.name + ".PP", this.getTotalProducing() + '/' + this.production);
    },
    produceMore: function produceMore(supply) {
      this.producing[supply]++;
      if(this.getTotalProducing() > this.production) {
        this.producing[supply]--;
      } else {
        this.syncGui();
      }
    },
    produceLess: function produceLess(supply) {
      if(this.producing[supply] > 0) {
        this.producing[supply]--;
        this.syncGui();
      }
    },
    /**
     * returns the production points in use
     */
    getTotalProducing: function getTotalProducing() {
      if(this.name == "fields") {
        return this.producing.mana * data.PP_MANA +
                this.producing.food * data.PP_FOOD;
      } else if(this.name == "mountains") {
        return this.producing.tin * data.PP_TIN + 
                this.producing.copper * data.PP_COPPER + 
                this.producing.iron * data.PP_IRON;
      }
      return 0;
    }
  });
  
  /**
   * everything in the game
   */
  var Game = base.extend(engine.Sprite, 'Game', {
    constructor: function Game() {
      this.stationFields = new Station("fields");
      this.stationMountains = new Station("mountains");
      this.stations = [this.stationFields, this.stationMountains];
      this.tickCount = 0;
    },
    update: engine.listener(engine.EventTick.ID, function update(event) {
      this.tickCount++;
      if(this.tickCount % 300 === 0) {
        this.gatherSupplies();
      }
      if(this.tickCount % 1200 === 0) {
        this.feedMinions();
        this.levelupMinions(); //skill increases
      }
    }),
    /**
     * farming produces mana, mountains produce ores, etc. etc
     */
    gatherSupplies: function gatherSupplies() {
      for(var i=0; i<this.stations.length; i++) {
        this.stations[i].gatherSupplies();
      }
    },
    /**
     * increase minion's skills in whatever they're currently doing
     */
    levelupMinions: function levelupMinions() {
      for(var i=0; i<this.stations.length; i++) {
        this.stations[i].levelupMinions();
      }
    },
    /**
     * eat of die!
     */
    feedMinions: function feedMinions() {
      for(var i=0; i<this.stations.length; i++) {
        this.stations[i].feedMinions();
      }
    }
  });
  module.Game = Game;
  Game.prototype.compile();
  Game.instance = null;
  
  /**
   * summons a minion
   */
  function summon() {
    var minion = new Minion();
    var stations = Game.instance.stations;
    var stationFields = Game.instance.stationFields;
    if(stationFields.supplies.mana < data.COST_SUMMON) {
      return;
    }
    
    for(var i=0; i<stations.length; i++) {
      var station = stations[i];
      if(station.addMinion(minion)) {
        stationFields.supplies.mana -= data.COST_SUMMON;
        stationFields.syncGui();
        return;
      }
    }
  }
  
  /**
   * increases production in a particular product
   */
  function increaseProduction(station, supply) {
    return function() {
      station.produceMore(supply);
    };
  }
  
  function decreaseProduction(station, supply) {
    return function() {
      station.produceLess(supply);
    };
  }
   
  module.init = function init() {
    Game.instance = new Game();
    setVariable('summon', summon);
    var game = Game.instance;
    
    var stations = [['Fields', 'mana', 'food'], ['Mountains', 'tin', 'copper', 'iron']];
    for(var i=0; i<stations.length; i++) {
      var station = game['station' + stations[i][0]];
      for(var k=1; k<stations[i].length; k++) {
        var supply = stations[i][k];
        setVariable(supply + 'Up', increaseProduction(station, supply));
        setVariable(supply + 'Down', decreaseProduction(station, supply));
      }
    }
  };
});