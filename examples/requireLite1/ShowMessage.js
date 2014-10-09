"use strict";

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
}

ShowMessage.prototype.TEMPLATE = requireLite('./ShowMessage.html');

ShowMessage.prototype.render = function () {
    console.log('ShowMessage render');
    this.container.querySelector('#message').textContent = this.message;
};

ShowMessage.prototype.show = function (container) {
    console.log('ShowMessage show',container);
    this.container = container;
    if (typeof this.container === 'string') { this.container = window.document.getElementById(this.container); }

    this.container.textContent = ''; // Empty the container
    this.container.appendChild( this.TEMPLATE.cloneNode(true) );    

    this.render();

    return this;
};


ShowMessage.prototype.setMessage = function (message) {
    console.log('ShowMessage setMessage',message);
    this.message = message;
    if ( this.container ) this.render();
    return this;    
};


module.exports = ShowMessage;

