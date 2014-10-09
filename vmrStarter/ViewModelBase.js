"use strict";

/* global window, console, document, module, XMLHttpRequest, requireLite */
/* jshint globalstrict: true */
/* C:\Users\murray\AppData\Roaming\npm\node_modules\jsdoc\conf.json */



// If vmrLite loaded, globally, dont use require to load 
var vmrLite = window.vmrLite;
if (typeof vmrLite === 'undefined') {
    vmrLite = requireLite('lib/vmrLite');
}

/**

## View Model Base

Base Class for View Model.

Convenient base class for rendering html/js in container, rendering, events and cleanup.

provides init, addEventListeners, removeEventListeners, render, onClose, close
Listens for 'close' and 'closeRequest' events.  Triggers 'unload' event on close.


Inherit from ViewModelBase to provide your implementation. 
- Call ViewModelBase.call(this, config); to initalize base object
- Your initalization ...
- Add your listeners to eventListeners. e.g this.eventListeners.push({ elem: this.container, type: 'close', listener: this.onClose.bind(this) });

NOTE: on listeners DONT forget to bind to the object, DOM Element handlers are just pointers to functions,
they DONT take the object/this with them.  e.g use ..., listener: this.onClickSomething.*bind(this)* } 

@class ViewModelBase  
@constructor
@param config {Object} Configuration settings. { id. model, onCloseCallback, title }
@param config.id {Number} Sequence number assigned. 
@param config.model {Object} The Model to view
@param config.removeContainerOnClose {Boolean} Remove container on close, vs clear.
@param config.onCloseCallback {Function} Function to call when closed, View model instance is passed as param.
*/


function ViewModelBase(config) {
    var k;

    /* jshint validthis:true */    
    if (!(this instanceof ViewModelBase)) { // If invoked as a factory by mistake
        console.debug('ViewModelBase: not called with new');
        return new ViewModelBase(config);
    }
    this.className = 'ViewModelBase';
    this.container = null; 


    this.id = vmrLite.SEQ++;
    this.model = null;
    this.removeContainerOnClose = false; // Remove container onClose\
    this.onCloseCallback = null; // Call this when window closed. (Used for Modal style forms)
    this.eventListeners = [];

    // Copy config we know.
    if ( config ) {
        for (k in { id: null, model: null,  onCloseCallback: null, title: null, removeContainerOnClose : null }) {
            if (config[k]) { this[k] = config[k]; }
        }
    }



    // Add event listeners, this.container is currently null.  // This is OK for now
    this.eventListeners.push({ elem: this.container, type: 'close', listener: this.onClose.bind(this) });
    this.eventListeners.push({ elem: this.container, type: 'closeRequest', listener: this.onCloseRequest.bind(this) });    

}

// Class properties

/**
HTML template to clone, when render in a container.

Typicaly included by using, requireLite(module.__filename,'html').
Alternatvely point it to a DOM node already present (and hidden) in the html page.

e.g. MyViewModel.prototype.TEMPLATE = requireLite(module.__filename,'html');

@name ViewModelBase#TEMPLATE
@protected
@type DOMElement
*/

ViewModelBase.prototype.TEMPLATE = null; // window.document.createElement('div');

/**
Array of event listeners, As { elem: , type: , listener:  }

e.g this.eventListeners.push({ elem: this.container, type: 'close', listener: this.onClose.bind(this) });

@name ViewModelBase#eventListeners
@type Array
*/

// Prototype methods.

/**
Show this view in the container specified. 

@function ViewModelBase#show
@param container {DOMElement|String}
@return this
*/

ViewModelBase.prototype.show = function (container) {
    var nodeList,i;
    this.container = container;
    if (typeof this.container === 'string') { this.container = document.getElementById(this.container); }
    if (!this.container)  console.error(this.className+': container is null');
    if (this.container.jquery) { this.container = this.container.get(0); } // Make it a DOM Element     

    this.container.setAttribute('viewmodel', this.className);
    if (!this.container.id) this.container.id = this.id;    

    // We have a template, assume it a NODE, and clone it for use.
    if ( this.TEMPLATE ) {
        vmrLite.empty(this.container); // Empty the container
        this.container.appendChild( this.TEMPLATE.cloneNode(true) );        
    }    

    // Build list of bindings.
    this.addEventListeners();
    this.render();
    // Focus to the 1st input. 
    nodeList = this.container.querySelectorAll('input,button,select');
    if ( nodeList.length === 0 ) this.container.querySelectorAll('a');
    for (i=0;i<nodeList.length;i++)
      if ( nodeList[i].style.display !== 'none' ) {
          nodeList[i].focus();
          break;
      }    

    vmrLite.triggerEvent(this.container, 'show', null);
    return this;
};


// ViewModelBase.prototype.showModal = function () {};

/**
binds the eventListeners, (i.e. calls addEventListener for each element of eventListeners),

Only adds listensers if not already listening

If "elem" is null, assumes this is this.container, 
i.e. You can add items to the  eventListeners Array before the container is defined.

@function ViewModelBase#addEventListeners
@returns this

*/

ViewModelBase.prototype.addEventListeners = function () {
    var i,eListener;
    // bind events related to stuff on or outside container !!
    // Initalize other stuff.
    vmrLite.log(this.className + '.addEventListeners', this.container);

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
Unbind the eventListeners, (i.e. Call removeEventListener for each element of eventListeners),

@function ViewModelBase#removeEventListeners
@returns this

*/

ViewModelBase.prototype.removeEventListeners = function () {
    var i,eListener,eTarget;    
    vmrLite.log(this.className + '.removeEventListeners', this.container);

    for (i=0;i<this.eventListeners.length;i++) {
        eListener = this.eventListeners[i];
        if ( eListener.listening ) {
                eListener.elem.removeEventListener(eListener.type, eListener.listener, false);
                eListener.listening = false;                
        }
    }
    this.eventListeners = [];
    return this;
};



/**
A 'closeRequest' message has been received, we have been asked to close.
If OK to close, send a 'close' messages. Otherwise (show a message) do nothing (i.e. ignore message).

Base implementation always sends a 'close', 

Overload to provide your own implementation.


@function ViewModelBase#onCloseRequest
@protected
@param ev {Event} Event

*/

ViewModelBase.prototype.onCloseRequest = function (ev) {
    vmrLite.log(this.className + '.onCloseRequest');
    // Base implementation, send a 'close'
    vmrLite.triggerEvent(ev.target, 'close', null);
    ev.preventDefault(); ev.stopPropagation();
};



/**

Render the contents in the container, using "vmrLite.render" with "this" as the View Model Object

@method ViewModelBase#render
@returns this
*/
ViewModelBase.prototype.render = function () {
    vmrLite.log(this.className + '.render');
    vmrLite.render(this.container, this);
    return this;
};



/**
Close/cleanup. call removeEventListeners, calll onCloseCallback, empty the container,
and trigger a 'unload' event on the container.

(If this.removeContainerOnClose is set, the container itself is removed and no unload message triggered)

@method ViewModelBase#_close
@protected
@returns this
*/

ViewModelBase.prototype._close = function () {
    // detach events related to stuff on or outside container !!
    // Clear contents etc...
    vmrLite.log(this.className + '._close',this);

    this.removeEventListeners();

    // If callback call it with the button selected.
    if (this.onCloseCallback) {
        // Set "this" to null in the callback!! otherwise gets confusing !!
        this.onCloseCallback.call(null,this);
    }
    this.onCloseCallback = null; // clear References

    // Clear the contents, if we used a TEMPLATE
    if ( this.TEMPLATE )
      vmrLite.empty(this.container);    

    if (this.removeContainerOnClose) {
        this.container.parentElement.removeChild(this.container);
        this.container = null; // ensure no references to the container
    } else {
        // Tell others to destroy references to me.
        vmrLite.triggerEvent(this.container, 'unload', null);
    }
    return this;
};

/**
Generic onClickClose handler, User has clicked a button, to request the Inner Container be closed. Send a 'closeRequest' to container.
Link a "close" button to onCLickClose as/if required.

@method ViewModelBase#onClickClose
@protected
@param ev {DOM-Event} Event triggers
*/
ViewModelBase.prototype.onClickClose  = function (ev) {
    vmrLite.log(this.className + '.onClickClose');
    vmrLite.triggerEvent(this.container, 'closeRequest', null);
    ev.preventDefault(); ev.stopPropagation();
};

/**
Close/cleanup. Base implementation calls _close

Inherit and Override/Overload for use. i.e
- Do you own clean up 
- Call this._close()

@method ViewModelBase#close
@returns this
*/

ViewModelBase.prototype.close = function () {
    // detach events related to stuff on or outside container !!
    // Clear contents etc...
    vmrLite.log(this.className + '.close');

    this._close();
    return this;
};

/**
Generic onClose message handler,  A 'close' message has been received, we MUST close. Call .close()

@method ViewModelBase#onClose
@protected
@param ev {DOM-Event} Event triggers, ev.target must be the container the message was from
*/
ViewModelBase.prototype.onClose =  function (ev) {
    // Close the container  (i.e. clear its contents)
    vmrLite.log(this.className + '.onClose');
    this.close();
    ev.preventDefault(); ev.stopPropagation();
};



/**

Show the view model within a dialogue like box.

=== NOTE: Only available if module ShowModalVM loaded.

@method ViewModelBase#showModal
@param none {null} This view is the viewModel to show.

*/

ViewModelBase.prototype.showModal =  function () {
  console.error('Please include ShowModalVM to enable.');
};


vmrLite.ViewModelBase = ViewModelBase;

// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = ViewModelBase;
}
