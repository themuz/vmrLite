"use strict";
// See ViewModelBase.js for a prototype based Class based on this

/* global window, console, document, module, XMLHttpRequest, requireLite,  vmrLite, partial, TicketModel */
/* jshint globalstrict: true */

function TicketDetailViewModel(config) {
    /* jshint validthis:true */    
    console.log('TicketDetailViewModel constructor',config);
    config = config || {};
    if (!(this instanceof TicketDetailViewModel)) { // If invoked as a factory by mistake
        console.debug('TicketDetailViewModel: not called with new');
        return new TicketDetailViewModel(config);
    }
    this.className = 'TicketDetailViewModel';
    this.container = null; 
    this.TEMPLATE = requireLite('./TicketDetailViewModel.html');
    if ( config.altView ) {
        config.title = config.title || 'Alt View';
        this.TEMPLATE = requireLite('./TicketDetailAltViewModel.html');
    }
    this.title = config.title || 'Detail View';

    this.model = null;
}


TicketDetailViewModel.prototype.addEventListeners = function () {
    // target.addEventListener(type, listener[, useCapture]);
    this.eventListeners.forEach(function (el) {
        el.elem.addEventListener(el.type, el.listener, false);
    });

};


TicketDetailViewModel.prototype.render = function() { vmrLite.render( this.container, this);};


/**
 * Show the View. 
 *
 * @method show
 * @param container {String|DOMElement}
 */

TicketDetailViewModel.prototype.show = function (container) {
    console.log('TicketDetailViewModel show',container);
    this.container = container;
    if (typeof this.container === 'string') { this.container = window.document.getElementById(this.container); }

    this.container.textContent = ''; // Empty the container
    this.container.appendChild( this.TEMPLATE.cloneNode(true) );    

    this.eventListeners = [];
    this.eventListeners.push( { elem: document.body,  type: 'ticket-selected', listener: this.onTicketSelected.bind(this) });
    this.eventListeners.push( { elem: document.body,  type: 'ticket-changed', listener: this.onTicketChanged.bind(this)  });
    this.eventListeners.push( { elem: this.container, type: 'close', listener: this.onClose.bind(this)  });
    this.addEventListeners();

    this.render();

    return this;
};




// Some one has selected a ticket, Im open, better show it.
TicketDetailViewModel.prototype.onTicketSelected = function(ev) {
    console.log('TicketDetailViewModel onTicketSelected',ev);    
    if ( ev.detail.model.id ) 
        this.model = ev.detail.model;
    else
        this.model = null;

    this.render();
    ev.preventDefault(); ev.stopPropagation();
};

// A ticket has change, is it ours.
TicketDetailViewModel.prototype.onTicketChanged = function(ev) {
    console.log('TicketDetailViewModel onTicketChanged',ev);    
    if (this.model && (this.model.id == ev.detail.model.id)) {
        this.model = ev.detail.model;
        this.render();
    }
    // ev.preventDefault(); ev.stopPropagation(); // DONT stop, as others may be interested
};



/**
 * unbind the eventListeners, (i.e. Call removeEventListener for each element of eventListeners),
 *
 * @method removeEventListeners
 * @param {None}
 */

TicketDetailViewModel.prototype.removeEventListeners = function () {
    this.eventListeners.forEach(function (el) {
        el.elem.removeEventListener(el.type, el.listener, false);
    });
    this.eventListeners=[];

};

/**
 * Close/cleanup. i.e. call removeEventListeners, empty the container,
 * and trigger a 'unload' on the container, For anyone interested.
 *
 * @method close
 * @param {None}
 */

TicketDetailViewModel.prototype.close =  function () {
    console.log('TicketDetailViewModel close');         
    this.removeEventListeners();

    // Clear the contents
    vmrLite.empty(this.container);
    // Tell others, I closed
    vmrLite.triggerEvent(this.container, 'unload', null);
};


TicketDetailViewModel.prototype.onClose =  function (ev) {
    console.log('TicketDetailViewModel onClose',ev);        
    this.close();
    ev.preventDefault(); ev.stopPropagation();
};



module.exports = TicketDetailViewModel;

