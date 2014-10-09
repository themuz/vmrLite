"use strict";

/* global window, console, document, module, vmrLite, requireLite */
/* jshint globalstrict: true */


/* global window, console, document, module, vmrLite, requireLite */
/* jshint globalstrict: true */

function ShowMessage(config) {
    console.log('ShowMessage constructor',config);
    /* jshint validthis:true */    
    if (!(this instanceof ShowMessage)) { // If invoked as a factory by mistake
        console.debug('ShowMessage: not called with new');
        return new ShowMessage(config);
    }
    this.className = 'ShowMessage';
    this.container = null; 
    this.message = 'No Message ....';
    if ( config )
      this.message = config.message;

    // Bind prototype "on" events to this, and create a instance function.
    this.onShowMessage = this.onShowMessage.bind(this);

}

// Class level CONSTANTS

ShowMessage.SHOW_MESSAGE_EVENT_TYPE = 'show-message';

// Prototype CONSTANTS

ShowMessage.prototype.TEMPLATE = requireLite('./ShowMessage.html');

// Prototype Methods

ShowMessage.prototype.render = function () {
    console.log('ShowMessage render');
    this.container.querySelector('#message').textContent = this.message;
};

ShowMessage.prototype.setMessage = function (message) {
    console.log('ShowMessage setMessage',message);
    this.message = message;
    if ( this.container ) this.render();
    return this;    
};


ShowMessage.prototype.onShowMessage = function (ev) {
   console.log('ShowMessage onShowMessage',ev);
   this.setMessage(ev.detail.message);
};

ShowMessage.prototype.show = function (container) {
    console.log('ShowMessage show',container);
    this.container = container;
    if (typeof this.container === 'string') { this.container = window.document.getElementById(this.container); }

    this.container.textContent = ''; // Empty the container
    this.container.appendChild( this.TEMPLATE.cloneNode(true) );    
    this.container.addEventListener(ShowMessage.SHOW_MESSAGE_EVENT_TYPE, this.onShowMessage, false);       

    this.render();

    return this;
};

ShowMessage.prototype.close = function () {
    this.container.removeEventListener(ShowMessage.SHOW_MESSAGE, this.onShowMessage, false);
    this.container.textContent = ''; // Empty the container
    this.container = null;
};


module.exports = ShowMessage;




module.exports = ShowMessage;

