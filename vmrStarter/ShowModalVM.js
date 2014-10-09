"use strict";

/* global window, console, document, module, XMLHttpRequest, requireLite */
/* jshint globalstrict: true */

// If vmrLite loaded, globally, dont use requireLite
var vmrLite = window.vmrLite;
if ( typeof vmrLite === 'undefined') {
    vmrLite = requireLite('lib/vmrLite');
}
var ViewModelBase = requireLite('./ViewModelBase');



/**

# Show a View Model (ShowModalVM)

### Usage (Class):-

    new ShowModalVM({
        title: 'Dialogue Title', // Defaults to window.document.title 
    }).showModal(inner-ViewModel);

### Usage (Static Function):-

    ShowModalVM.showModal(inner-ViewModel); 


### extends ViewModelBase 

#### see also ViewModelBase.showModal() 

@class ShowModalVM
@constructor
@param config {Object} Configuration settings. { None }

*/


function ShowModalVM(config) {
    var k,container;
    if (!config) config = {};
    /* jshint validthis:true */    
    if (!(this instanceof ShowModalVM)) { // If invoked as a factory by mistake
        console.debug('ShowModalVM: not called with new');
        return new ShowModalVM(config);
    }

    //  
    ViewModelBase.call(this, config);
    // Initalize
    this.className = 'ShowModalVM';
    if ( !this.title ) this.title = window.document.title;
    this.innerContainer = null;
    this.removeContainerOnClose = true;

    this.eventListeners.push({ elem: this.container, type: 'unload', listener: this.onUnloaded.bind(this) });
    console.log(this.className,this);

}

/* Inheritance */

ShowModalVM.prototype = Object.create(vmrLite.ViewModelBase.prototype);
ShowModalVM.prototype.constructor = ShowModalVM;

/* Prototype - properties */

/*
HTML template to clone, when render in a container.


@name ShowModalVM#TEMPLATE
@type DOMElement
*/

ShowModalVM.prototype.BASE_CSS = requireLite('./BaseUI.css');
ShowModalVM.prototype.CSS = requireLite('./ShowModalVM.css');
ShowModalVM.prototype.TEMPLATE = requireLite('./ShowModalVM.html');

/* Prototype - methods */

/**
A 'closeRequest' message has been received, we have been asked to close.
If we have inner containers, send them a 'closeRequest', if none trigger a 'close'
If was a message bubbled up from a inner container.  trigger a 'close' on behalf of the inner.

@method ShowModalVM#onCloseRequest
@protected
@param ev {DOM-Event} Event triggers, ev.target  must be the container the message was from
*/

ShowModalVM.prototype.onCloseRequest =  function (ev) {
    var index;
    vmrLite.log(this.klass + '.onCloseRequest');
    // We have a closeRequest Event

    if (ev.target === this.container) {
        // Its for me, Send it to the inner
        if ( this.innerContainer )  {
          vmrLite.triggerEvent(this.innerContainer, 'closeRequest', null);        
        } else {
          // No inners. Close self.
          vmrLite.triggerEvent(this.container, 'close', null);        
        }
    } else if ( ev.target === this.innerContainer ) {
        // The innerContainer did not respond to a closeRequest,
        // and event has bubbled back up to me, so lets send it a 'close' event.
        vmrLite.triggerEvent(this.innerContainer, 'close', null);
    } else {
        console.log(this.className+': onCloseRequest target is NOT container/innerContainer');
    }
    ev.preventDefault(); ev.stopPropagation();
};

/**
A 'close' message has been received, we MUST close.
If we have inner containers, send them a 'close', then once inners unloaded then close.
If was a message bubbled up from a inner container (inner container did not respond to the close) 
So clear it for them, then trigger a 'unload' on behalf of the inner.

@method ShowModalVM#onClose
@protected
@param ev {DOM-Event} Event triggers, ev.target  must be the container the message was from
 */
ShowModalVM.prototype.onClose =  function (ev) {
    // Close the container  (i.e. clear its contents)
    vmrLite.log(this.className + '.onClose');
    var index;
    if (ev.target === this.container) {
        // Its for me, We need to close.
        if (!this.innerContainer) {
            // No open.inners. close
            this.close();
        } else {
            // Close innerContainer. 
            vmrLite.triggerEvent(this.innerContainer, 'close', null);
        }
    } else if ( ev.target === this.innerContainer ) {
        // Not for me, must be innerContainer did not respond to a close
        // lets close/clear it for them
        vmrLite.empty(this.innerContainer);
        // Now tell myself, the tab is empty/destroyed.
        vmrLite.triggerEvent(this.innerContainer, 'unload', null);
    } else {
        console.log(this.className+': onClose target is NOT container/innerContainer');
    }
    ev.preventDefault(); ev.stopPropagation();
};


/**
A 'unload' message has been received, the container has unloaded. We can close now.

NOTE: We should not get 'unload' messages for self, as we should not be loaded (check you are dereferening) correctly

@method ShowModalVM#onUnloaded
@protected
@param ev {DOM-Event} Event triggers, ev.target  must be the container the message was from
 */
ShowModalVM.prototype.onUnloaded = function (ev) {
    // Inner is now empty, delete the tab-stop in the UI
    vmrLite.log(this.className + '.onUnloaded');
    if (ev.target === this.container) {
        // If we are hiding rather than clearing, we may get our own unloaded !!
        console.error(this.className + '.onUnloaded target is self !! This should not happen, IGNORE ', ev);
        return;
    } else if ( ev.target === this.innerContainer ) {
        // Inner closed, This is a modal form. so close
        this.close();
    } else {
        console.log(this.className+': onClose target is NOT container/innerContainer');
    }    
    ev.preventDefault(); ev.stopPropagation();
};

/**
Show a view model, In a look alike Modal window.

@method ShowModalVM#showModal
@param innerViewModel {ViewModel} View Model instance.
 */
ShowModalVM.prototype.showModal =  function (innerViewModel) {
    var container,nodeList,i;
    // We create a container for the dialogue.
    container = window.document.createElement('div');
    window.document.body.appendChild(container);
    this.removeContainerOnClose = true;
    this.show(container);    
    this.innerContainer = this.container.querySelector('.inner');
    // Show the innerViewModel
    innerViewModel.show(this.innerContainer);
};

/**

Show view in a Modal Dialogue.

Creates a new ShowModalVM, then calls its showModal(arugments)

@method ShowModalVM.showModal
@param innerViewModel {Object} View model, to show within a modal dialogue.

*/

ShowModalVM.showModal = function (innerViewModel) {
    var title;
    if ( innerViewModel.getTitle )
        title = innerViewModel.getTitle(); 
    var modalViewModel=new ShowModalVM({ title: title });
    modalViewModel.showModal(innerViewModel);
};


/*
see ViewModelBase for doc
*/

vmrLite.ViewModelBase.prototype.showModal =  function () {
    this.modal = true;
    ShowModalVM.showModal(this);
};





vmrLite.ShowModalVM = ShowModalVM;


// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = ShowModalVM;
}


// =============================================

