"use strict";

/* global window, console, document, module, require, XMLHttpRequest, requireLite, vmrLite */
/* jshint globalstrict: true */

/**

Reference Implementation of a View Model Class, for use with vmrLite.js (and optionally requireLite.js)

#### Documentation :-

See this README.md OR jsdoc on-line here [jsdoc VMBase!](http://themuz.github.io/jsdoc/VMBase.html).

##### Usage (Inheritance):-

    function SampleVM(config) {

        if (!(this instanceof SampleVM)) { // If invoked as a factory by mistake
            console.debug('SampleVM not called with new');
            return new SampleVM(config);
        }

        if ( !this.className ) this.className = 'SampleVM'
        VMBase._init(this, config);
        
        // Listen for events, that affect me, by convention thay are linked to document.body
        // (Yes this.container may be null, this is ok, events are registered with addEventListeners on open)
        this.eventListeners.push({ elem: document.body, type: 'sampleModelSelected', listener: this.onModelSelected.bind(this) });

        // To trigger an event. Use the below or see vmrLite.triggerEvent
        this.trigger('sampleModelSelected',{ detail: 'object' } )
    }

    // Inheritance

    SampleVM.prototype = Object.create(VMBase.prototype);
    SampleVM.prototype.constructor = SampleVM;
    SampleVM.prototype.cwd = (require.cwd || ''); // VMBase requires the cwd, for deferred loading is using requireLite !!

    SampleVM.prototype.template = {  // Optional - used to dynamically load the VM partial html.
        div: null,  // div to clone for container.innerHTML
        uri: null, // uri to the html to load and assign to div. 
        singleton: false, // true only if this is a singleton class. i.e. the template is used once and can be moved around the page
        cssUri: null  // uri to the css to load to support the div. 
    }; 

 * @class
 * @classdesc View Model base skeleton to inherit from and use. 
 * @param {object} config - Configuration options. (See _init)
 */

function VMBase(config) {
    if (!(this instanceof VMBase)) { // If invoked as a factory by mistake
        console.log('VMBase: not called with new');
        return new VMBase(config);
    }
    this._init(config);
}


/**

Version of the library

@field
@type String
@default "0.1"

*/


VMBase.version = '0.1';
VMBase.debug = false;


/**

The template to use if defined, 

- **div** - Clone html elements from this div
- **uri** - load partial html from this uri
- **cssUri** - load css from this uri
- **singleton** - true only if the template is used once, (i.e Can be moved around the page, vs cloned)

@field
@memberof VMBase
@type Object

*/


VMBase.prototype.template = {  
    div: null, 
    uri: null, 
    singleton: false,
    cssUri: null }; 

VMBase.prototype.cwd = '';

/**

Initalize the base class. Use when inherit.

@function
@memberof VMBase
@param config {object} The initial settings for the class. 
@param config.container {DOMElement|String} The container div
@param config.onCloseCallback {fuction} Function to call when close
@param config.id {String} id for the object (Default is vmrLite.SEQ)
@param config.model {object} The model for this view
@param config.items {object|array} The items for this view if a list
@param config.title {string} title
@returns {VMBase} this
@protected


*/

VMBase.prototype._init = function (config) {
    var k;

    // Initalize
    this.id = String(vmrLite.SEQ++);
    if ( !this.className ) this.className = 'VMBase';
    this.container = null;
    this.changed = false; // Something (some input) changed since last render
    this.onCloseCallback = null; // Call this when window closes. // Used for Modal style forms
    this.eventListeners = []; // List of registered event listners. to register/deregister on open/close

    // Copy config we know.
    if ( config ) {
        for (k in { id: null, model: null,  items: null, container: null, onCloseCallback: null, title: null }) {
            if (config[k]) { this[k] = config[k]; }
        }
    }

    // Listen for events, that affect me
    // (Yes this.container may be null, this is ok, events are registered with addEventListeners within open)
    this.eventListeners.push( { elem: this.container, type: 'change', listener: this.onChange.bind(this) } );

    if ( VMBase.debug ) console.log(this.className+'._init',this );

    return this;
};

/**

Open this view (Apply template, and render) in the container specified. 

@function
@memberof VMBase
@param container {DOMElement|String|null} The container div (or id of div)
@returns {VMBase} this
@protected


*/

VMBase.prototype._open = function (container) {
    var nodeList,i,childDiv;

    if ( this._isopen ) throw new Error(this.className + ' is already open');

    if (container) this.container = container;
    if (typeof this.container === 'string') { this.container = document.getElementById(this.container); }
    if (!this.container)  console.log(this.className+': ERROR: container is null');
    if (this.container.jquery) { this.container = this.container.get(0); } // Make it a DOM Element     

    this.container.setAttribute('className', this.className);
    if (!this.container.id) this.container.id = this.id;


    // load css from uri. If defined and not already loaded. 
    if ( this.template && this.template.cssUri && !this.template.link ) {
        this.template.link = require(this.cwd + this.template.cssUri);
    }
    // load template from uri. this. note: template is a Class property. !!
    if ( this.template && this.template.uri && !this.template.div ) {
        this.template.div = require(this.cwd + this.template.uri);
    }

    // clone template 
    // 2016-04-03 Updated to clone the div content, not the div itself.
    if ( this.template && this.template.div ) {    
        vmrLite.empty(this.container); // Empty the container
        // firstElementChild
        if ( this.template.singleton ) {
            // Move Element
            childDiv = this.template.div.firstElementChild;
            while ( childDiv ) {
                this.template.div.removeChild( childDiv );
                this.container.appendChild( childDiv );   
                childDiv = this.template.div.firstElementChild;      
            }    
        } else {
            // Clone
            childDiv = this.template.div.firstElementChild;
            while ( childDiv ) {
                this.container.appendChild( childDiv.cloneNode(true) );   
                childDiv = childDiv.nextElementSibling;      
            }
        }
    }        

    // Build list of bindings.
    this.addEventListeners();
    this.render();

    this._isopen = true;

    // Focus to the 1st input. 
    // Also container mignt not be visible
    if ( this.container.style.display !== 'none') {
        nodeList = this.container.querySelectorAll('input,button,select');
        if ( nodeList.length === 0 ) this.container.querySelectorAll('a');
        for (i=0;i<nodeList.length;i++)
          if ( nodeList[i].style.display !== 'none' ) {
              break;
          }    
        if ( i<nodeList.length ) {
            window.setTimeout( function() {
                nodeList[i].focus();
            }, 10);                        
        }
    }
    return this;
};


/**

Open this view in the container.  Base implementation just calls _open

Inherit and Override/Overload for use. i.e
- Create container if needed.
- Add eventListeners
- Call this._open()

@function
@memberof VMBase
@returns {VMBase} this
*/

VMBase.prototype.open = function (container) {
    return this._open(container);
};


/**
binds the eventListeners, (i.e. calls addEventListener for each element of eventListeners array),

Only adds listensers if not already listening

If "elem" is null, assumes this is this.container, 
this you can add items to the eventListeners Array before the container is defined.

@function
@memberof VMBase
@protected
@returns {VMBase} this

*/

VMBase.prototype.addEventListeners = function () {
    var i,eListener;
    // bind events related to stuff on or outside container !!
    // Initalize other stuff.
    if ( VMBase.debug ) console.log(this.className + '.addEventListeners', this.container);

    // target.addEventListener(type, listener[, useCapture]);
    for (i=0;i<this.eventListeners.length;i++) {
        eListener = this.eventListeners[i];
        if ( !eListener.listening ) {
            if ( !eListener.elem ) eListener.elem = this.container;
            if ( eListener.elem  ) {                
                eListener.elem.addEventListener(eListener.type, eListener.listener, false);
                eListener.listening = true;
            }
        }
    }
    return this;
};

/**
Unbind the eventListeners when close, 
It is IMPORTANT to removeEventListener so the object has NO external references from say a dom elements,
so it can be garbage collected.

Calls removeEventListener for each element of eventListeners that is listening.

@function
@protected
@memberof VMBase
@returns {VMBase} this

*/

VMBase.prototype.removeEventListeners = function () {
    var i,eListener,eTarget;    
    if ( VMBase.debug ) console.log(this.className + '.removeEventListeners', this.container);

    for (i=0;i<this.eventListeners.length;i++) {
        eListener = this.eventListeners[i];
        if ( eListener.listening ) {
                eListener.elem.removeEventListener(eListener.type, eListener.listener, false);
                eListener.listening = false;    
                if ( eListener.elem == this.container )  eListener.elem  = null;          
        }
    }
    this.eventListeners = [];
    return this;
};



/**

Render the contents in the container.

Simply a wrapper for vmrLite.render where the container is this.container.

@function
@memberof VMBase
@returns {VMBase} this
*/

VMBase.prototype.render = function() {
    this._renderDeferred = false;
    // this.changed = false; // Dont clear, As app may of done a change and wants to show it in the UI
    vmrLite.render(this.container, this );
    return this;
};

/**

Queue a render in ~10ms.


If a render is already pending, no operation is performed.
This is the preferred way to render, as it is not always clear in a app, 
if a later action will perform a render. 

If immediate feed-back is required use render();

@function
@memberof VMBase
@returns {VMBase} this
*/


VMBase.prototype.defer_render = function() {
    if ( !this._renderDeferred ) {
        this._renderDeferred=true;
        window.setTimeout(this.render.bind(this), 10);
    }    
    return this;
};

/**
Sync inputs -> object 

Simply a wrapper for vmrLite.sync where the container is this.container.

@function
@memberof VMBase
@returns {VMBase} this
*/

VMBase.prototype.sync = function() {
    vmrLite.sync(this.container, this );
    return this;
};

/**
Show the container 

Clear this.container.style.display

@function
@memberof VMBase
@returns {VMBase} this

*/

VMBase.prototype.show = function() { 
    this.container.style.display = '';
    return this;
};  

/**
Hide the container 

Set this.container.style.display to 'none'

@function
@memberof VMBase
@returns {VMBase} this

*/

VMBase.prototype.hide = function() { 
    this.container.style.display = 'none';
    return this;
};  


/**
Close/cleanup. call removeEventListeners, call onCloseCallback, 
clear 'on' event on container child elements,
empty the container (if cloned from template)

@function
@memberof VMBase
@protected
@return {VMBase} this
*/

VMBase.prototype._close = function () {
    var childDiv;
    // detach events related to stuff on or outside container !!
    // Clear contents etc...
    if ( !this._isopen ) throw new Error(this.className + ' is NOT open');
    if ( VMBase.debug ) console.log(this.className + '._close',this);

    this.removeEventListeners();
    // IMPORTANT if not emptying the container.
    // Clear the on-events, so no references to this instance (so can be garbage collected)
    vmrLite.clearOnEventsChildren(this.container);

    // If callback call it with the button selected.
    if (this.onCloseCallback) {
        // Set "this" to null in the callback!! to help prevent bugs.
        this.onCloseCallback.call(null,this);
    }

    // Clear the contents, if we used a template. So nodes are freeed up.
    if ( this.template.div ) {
        if ( this.template.singleton ) {
            // Move Element back to original div 
            childDiv = this.container.firstElementChild;
            while ( childDiv ) {
                this.container.removeChild( childDiv );
                this.template.div.appendChild( childDiv );   
                childDiv = this.container.firstElementChild;       
            }      
        } else {
            // Delete contents
            vmrLite.empty(this.container);    
        }
    }
    this._isopen = false;


    return this;
};


/**
Close/cleanup. Base implementation calls _close

Inherit and Override/Overload for use. i.e
- Do you own clean up 
- Call this._close()

@function
@memberof VMBase
@return {VMBase} this

*/

VMBase.prototype.close = function () {
    return this._close();
};

/**

Trigger an custom event. 
Simply a wrapper for vmrLite.triggerEvent where the container is this.container.

@function
@memberof VMBase
@param etype {String}  event type to trigger. (e.g. 'click' )
@param detail {Object} Object to pass to the event, (available within the event as detail (e.g ev.detail))

@return {VMBase} this

*/

VMBase.prototype.trigger = function ( etype, detail ) {
    if ( VMBase.debug ) console.log(this.className + '.trigger '+ etype);
    vmrLite.triggerEvent( this.container, etype, detail );
    return this;
};

/**

Generic onClickClose handler, User has clicked a button, to request the window closed, 
base implementation simply calls close();

@function
@memberof VMBase
@protected
@param ev {DOM-Event} Event triggered

*/

VMBase.prototype.onClickClose  = function (ev) {
    if ( VMBase.debug ) console.log(this.className + '.onClickClose');
    this.close();
    ev.preventDefault(); ev.stopPropagation();
};

/**

Generic onChange handler, 
simply sets this.changed=true, 
The base class listens for 'change' events via onChange.

@function
@memberof VMBase
@protected
@param ev {DOM-Event} Event triggered

*/

VMBase.prototype.onChange = function(ev) {
    this.changed = true;
    // DONT interfer with event !! // ev.preventDefault(); ev.stopPropagation();
};

// Export, if loaded as a nodejs style require
if (typeof(module) !== 'undefined') {
    module.exports = VMBase;
}



// =============================================


