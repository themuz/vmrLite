"use strict";
// See ViewModelBase.js for a prototype based Class based on this

/* global window, console, document, module, XMLHttpRequest, requireLite,  partial, vmrLite, TicketModel */
/* jshint globalstrict: true */

function TicketEditViewModel(container,config) {
    /* jshint validthis:true */    
    console.log('TicketEditViewModel constructor',config);
    /* jshint validthis:true */    
    if (!(this instanceof TicketEditViewModel)) { // If invoked as a factory by mistake
        console.debug('TicketEditViewModel: not called with new');
        return new TicketEditViewModel(config);
    }
    this.className = 'TicketEditViewModel';
    this.container = null; 
    this.model = null;
    this.eventListeners = [];

}

TicketEditViewModel.prototype.TEMPLATE = requireLite('./TicketEditViewModel.html');

TicketEditViewModel.prototype.addEventListeners = function () {
    // target.addEventListener(type, listener[, useCapture]);
    this.eventListeners.forEach(function (el) {
        el.elem.addEventListener(el.type, el.listener, false);
    });

};

TicketEditViewModel.prototype.sync = function() { vmrLite.sync( this.container, this );};
TicketEditViewModel.prototype.render = function() { vmrLite.render( this.container, this );};

/**
 * Show the View. 
 *
 * @method show
 * @param container {String|DOMElement}
 */

TicketEditViewModel.prototype.show = function (container) {
    console.log('TicketEditViewModel show',container);
    this.container = container;
    if (typeof this.container === 'string') { this.container = window.document.getElementById(this.container); }

    this.container.textContent = ''; // Empty the container
    this.container.appendChild( this.TEMPLATE.cloneNode(true) );    


    this.eventListeners.push( { elem: document.body,  type: 'ticket-selected', listener: this.onTicketSelected.bind(this) });
    this.eventListeners.push( { elem: document.body,  type: 'ticket-changed', listener: this.onTicketChanged.bind(this)  });
    this.eventListeners.push( { elem: this.container, type: 'close', listener: this.onClose.bind(this)  });
    this.addEventListeners();

    this.render();

    return this;
};


// Instance functions to handle events
TicketEditViewModel.prototype.onClickSave = function(ev) {
    console.log('TicketEditViewModel onClickSave',ev);    
    this.sync();
    this.model.save(); // Save to database, will trigger a message ticket-changes
    // this.render(); // Don't do this, as ticket-changed will trigger a render
    ev.preventDefault(); ev.stopPropagation();
};

TicketEditViewModel.prototype.onClickRevert = function(ev) {
    console.log('TicketEditViewModel onClickRevert',ev);        
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};


// Some one has selected a ticket, Im open, better show it.
TicketEditViewModel.prototype.onTicketSelected = function(ev) {
    console.log('TicketEditViewModel onTicketSelected',ev);           
    this.model = ev.detail.model;
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};

// A ticket has change, is it ours.
TicketEditViewModel.prototype.onTicketChanged = function(ev) {
    console.log('TicketEditViewModel onTicketChanged',ev);         
    if ( this.model.id == ev.detail.model.id ) {
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

TicketEditViewModel.prototype.removeEventListeners = function () {         
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

TicketEditViewModel.prototype.close =  function () {
    console.log('TicketEditViewModel close');             
    this.removeEventListeners();

    // Clear the contents
    vmrLite.empty(this.container);
    // Tell others, I closed
    vmrLite.triggerEvent(this.container, 'unload', null);
};


TicketEditViewModel.prototype.onClose =  function (ev) {
    console.log('TicketEditViewModel onClose',ev);         
    this.close();
    ev.preventDefault(); ev.stopPropagation();
};

module.exports = TicketEditViewModel;

