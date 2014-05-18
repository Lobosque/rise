/**
 * I really like the way Backbone handles Events and Views, it's clean and nice.
 * I was working on it by myself but i think we could copy-paste most of those 
 * parts (Events & Views) but making them smarter with some conventions.
 * Or even, if that's the case, make it work with react.
 * - Dalai
 */

var viewSettings = {
	type: 'html', 
  basePath: '../views',
  extension : 'html',
}

var View = function View(name,params) {
  /**
   * View name, will be used to load html
   * @type string
   */
  this.name = name;
  
  /**
   * View type, possibly:
   *  - file
   *  - html
   * @type @exp;viewSettings@pro;type
   */
  this.type = viewSettings.type;
  
  /**
   * Views path, when the type is 'file'
   * @type String
   */
  this.basePath = viewSettings.basePath;
  
  /**
   * View file extension when type is 'file'
   * @type @exp;viewSettings@pro;extension
   */
  this.extension = viewSettings.extension;
  
  /**
   * View params
   * @type Object
   */
  this.params = params;
  
  /**
   * Events, in format:
   * {
   *  'event jquerySelector': callback(event)
   * }
   * jquerySelector
   * @type Array
   */
  this.events = {};
  
  /**
   * Events in the format:
   * {
   *  eventName: callback(event)
   * }
   * @type Array
   */
  this.eventListeners = {};
  
  this.$e = null;
  
  this.tagName;
 
};

/**
 * jQuery object 
 * @param String selector
 * @returns jQuery
 */
View.prototype.$ = function(selector){
	return this.$e.find(selector);
}

View.prototype.render = function()
{
	
}

/**
 * Returns a string containing a template to be rendered later
 * @returns pre compilation template function
 */
View.prototype.template = function(){
  if(_.isObject(this.name)){
    return _.template(this.name.html());
  } else if(_.isString(this.name))
  {
    return _.template(this.name);
  }
}