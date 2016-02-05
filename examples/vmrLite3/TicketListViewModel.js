"use strict";
// See ViewModelBase.js for a prototype based Class based on this

/* global window, console, document, module, XMLHttpRequest, requireLite,  vmrLite, TicketModel */
/* jshint globalstrict: true */

function TicketListViewModel(config) {
    /* jshint validthis:true */    
    console.log('TicketListViewModel constructor',config);
    if (!(this instanceof TicketListViewModel)) { // If invoked as a factory by mistake
        console.debug('TicketListViewModel: not called with new');
        return new TicketListViewModel(config);
    }
    this.className = 'TicketListViewModel';
    this.container = null; 

    this.modelList = null;
    this.sortorder = 0;
    // Demo Data 
    this.modelList = TicketModel.find_all();
}


// Prototype CONSTANTS

TicketListViewModel.prototype.TEMPLATE = requireLite('./TicketListViewModel.html');

// Prototype Methods

/**
 * Render the contents, typically does nothing apart from call vmrLite.render
 *
 * @method render
 * @param {None}
 *
 */
TicketListViewModel.prototype.render = function() {
    vmrLite.render(this.container, this );
    return this;
};


/**
 * Return a symbol suitable for showing the sort order on a page.
 *
 * @method getSortSym
 * @param {None}
 */
TicketListViewModel.prototype.getSortSym = function() {
   if ( this.sortorder )
       return ( this.sortorder < 0 ) ? 'v' : ((this.sortorder > 0) ? '^' : '-');
   return '-';
};

/**
 * bind the eventListeners, (i.e. Call addEventListener for each element of eventListeners),
 *
 * @method addEventListeners
 * @param {None}
 */
TicketListViewModel.prototype.addEventListeners = function () {
    // target.addEventListener(type, listener[, useCapture]);
    this.eventListeners.forEach(function (el) {
        if (!el.added)
          el.elem.addEventListener(el.type, el.listener, false);
        el.added = true;
    });
    return this;

};

/**
 * Open the View. 
 *
 * @method open
 * @param container {String|DOMElement}
 */

TicketListViewModel.prototype.open = function (container) {
    console.log('TicketListViewModel open',container);
    this.container = container;
    if (typeof this.container === 'string') { this.container = window.document.getElementById(this.container); }

    this.container.textContent = ''; // Empty the container
    this.container.appendChild( this.TEMPLATE.cloneNode(true) );    

    this.eventListeners = [];
    this.eventListeners.push( { elem: document.body, type: 'ticket-changed', listener: this.onTicketChanged.bind(this) });
    this.eventListeners.push( { elem: this.container, type: 'close', listener: this.onClose.bind(this) });
    this.addEventListeners();

    this.render();

    return this;
};


/**
 * User wants to sort the list by name. Sort it. A 2nd click will reverse the sort.
 *
 * @method onClickSortName
 * @param ev {DOM-Event} Event triggers
 */
TicketListViewModel.prototype.onClickSortName = function(ev) {
    this.sortorder = (-1*this.sortorder);
    if ( !this.sortorder ) this.sortorder =  1;
    this.modelList.sort( function(a,b) {
        return a.cmp(b) * this.sortorder;
    }.bind(this) ); // Need bind. as reference this. 
    this.render();
};

/**
 * User has clicked on the "add-Ticket" button.
 * Her we will simply create a new ticket, and send a message to Edit/View to show/edit it.
 *
 * @method onClickAdd
 * @param ev {DOM-Event} Event triggers
 */
TicketListViewModel.prototype.onClickAdd = function(ev) {
    var newModel = new TicketModel(0,'New Cargo','V',54.32);
    vmrLite.triggerEvent(document.body,'ticket-selected',{ model: newModel } );
    ev.preventDefault(); ev.stopPropagation();
};

/**
 * A Ticket has been clicked, select it. Send custom message to anyone interested in this..
 *
 * @method onClickSelect
 * @param ev {DOM-Event} Event triggers, ev.target has the element clicked.
 */

TicketListViewModel.prototype.onClickSelect = function(ev) {
    // ev.target or its parent will have a element with the attribute of "index", find it.
    var selectedIndex=vmrLite.closestIndex(ev.target);
    var selectedModel=this.modelList[selectedIndex];
    // Helper to trigger a event, to tell any forms to display the ticket.
    vmrLite.triggerEvent(document.body,'ticket-selected',{ model: selectedModel } );
    // NOTE: We should also listen for 'ticket-selected' events. If other's could trigger this.
    // ev.preventDefault(); ev.stopPropagation(); // DONT stop, as others may be interested
};

/**
 * A Tickect has changed (or been added), re-redner
 *
 * @method onTicketChanged
 * @param ev {DOM-Event} Event triggers, ev.detail.model has the model updated/added
 */
TicketListViewModel.prototype.onTicketChanged = function(ev) {
    console.log('TicketListViewModel.prototype.onTicketChanged',ev.detail);
    var changedModel = ev.detail.model;
    var modelList = this.modelList;
    for (var idx=0;idx<modelList.length;idx++)
        if ( modelList[idx].id == changedModel.id )
            break;
    if (idx >= modelList.length) { // Add new model
        modelList.unshift(changedModel);
        // Select it by default !!
    }
    this.render();
    // ev.preventDefault(); ev.stopPropagation(); // DONT stop, as others may be interested
};


/**
 * unbind the eventListeners, (i.e. Call removeEventListener for each element of eventListeners),
 *
 * @method removeEventListeners
 * @param {None}
 */

TicketListViewModel.prototype.removeEventListeners = function () {
    this.eventListeners.forEach(function (el) {
        (el.elem).removeEventListener(el.type, el.listener, false);
        el.added = false;
    });
    return this;
};

/**
 * Close/cleanup. i.e. call removeEventListeners, empty the container,
 * and trigger a 'unload' on the container, For anyone interested.
 *
 * @method close
 * @param {None}
 */

TicketListViewModel.prototype.close =  function () { 
    this.removeEventListeners();

    // Clear the contents
    vmrLite.empty(this.container);
    // Tell others, I closed
    vmrLite.triggerEvent(this.container, 'unload', null);
    return this;
};

/**
 * A 'close' message has been received, we MUST close. Call close()
 *
 * @method onClose
 * @param ev {DOM-Event} Event triggers, ev.target must be the container the message was from
 */
TicketListViewModel.prototype.onClose =  function (ev) {
    this.close();
    ev.preventDefault(); ev.stopPropagation();
};



module.exports = TicketListViewModel;

