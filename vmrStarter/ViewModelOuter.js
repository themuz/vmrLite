"use strict";


/* global window, console, document, module, XMLHttpRequest, requireLite */
/* jshint globalstrict: true  */


// If vmrLite loaded, globally, dont use require to load 
var vmrLite = window.vmrLite;
if (typeof vmrLite === 'undefined') {
    vmrLite = requireLite('lib/vmrLite');
}

var ViewModelBase = requireLite('./ViewModelBase');


/**
# View Model Outer.

Render View Models within a View Model.  (e.g A tabbed/window interface)

View Model for an Outer Container, That contains multiple inner containers.

Extends VewModelBase class to provide support for Multiple inner containers, use for a Tabbed interface, Stacked Windows, Floating windows.
Key item added is the "inners" array, which contains the inner forms

Key messages, to send to the container.
- 'setTitle', calls setTitle to set title for tab,window .. either as a string OR Object 
actual rendering is done by { caption: '..', badge: '..', badgeColor: red } will depend on innerHTML
- 'open', show a new tab/form/window given a viewModel instance

### extends ViewModelBase

@class ViewModelOuter  
@constructor
@param config {Object} Configuration settings. { None }
*/

function ViewModelOuter(config) {
    if (!(this instanceof ViewModelOuter)) { // If invoked as a factory by mistake
        console.debug('ViewModelOuter not called with new');
        return new ViewModelOuter(config);
    }
    ViewModelBase.call(this, config);
    
    this.className = 'ViewModelOuter';
    this.inners = [];
    this.selectedIndex = (-1);
    // Add my events. (Yes this.container is null, this is ok, as null ==> this.container when addEventListeners called within show)
    this.eventListeners.push({ elem: document.body, type: 'open', listener: this.onOpenNew.bind(this) });
    this.eventListeners.push({ elem: this.container, type: 'setTitle', listener: this.onSetTitle.bind(this) });
    this.eventListeners.push({ elem: this.container, type: 'unload', listener: this.onUnloaded.bind(this) });

}

// Inheritance 

ViewModelOuter.prototype = Object.create(vmrLite.ViewModelBase.prototype);
ViewModelOuter.prototype.constructor = ViewModelOuter;


// Prototype - properties

ViewModelOuter.prototype.TEMPLATE = null; // N/a - This is an abstract class.

// Prototype - methods

/**
Set the title property of the inner tab, (render is NOT called)

@method ViewModelOuter#setTitle
@protected
@param index {Number} Index of inner Container.
@param config {String|Object} Object/String for the title property.
*/

ViewModelOuter.prototype.setTitle =  function (index, title) {
    vmrLite.log(this.className + '.setTitle', title);
    this.inners[index].title = title;
};

/**
Create a innerContainer for new content. (render is called to create the container)

@method ViewModelOuter#createInnerContainer
@param title {String|Object} Object/String for the title property.
@protected
@return { DOM-Element } The Created container.
*/
ViewModelOuter.prototype.createInnerContainer = function (title) {
    vmrLite.log(this.className + '.createInnerContainer');
    var index;

    this.inners.push({ title: null, container: null, minimized: false  });
    index = this.inners.length - 1;
    this.setTitle(index, title);
    this.selectedIndex = index;
    this.render(); // Call Render to create the element
    // Find the inner container, a couple of options.
    if (!this.inners[index].container) {
        this.inners[index].container = this.container.querySelector('div[index="' + index + '"] div.inner');
    }
    if (!this.inners[index].container) {
        this.inners[index].container = this.container.querySelector('div[index="' + index + '"].inner');
    }
    if (!this.inners[index].container) {
        console.error('this createInnerContainer. cannot find vmr-inner', this, index);
        return null;
    }
    this.inners[index].container.style.display = 'block';
    return this.inners[index].container;
};

/**
Remove the inner container. Does this manually rather than calling render, to ensure any injected
HTML content is moved appropriately, if we have a sepertate title/content (i.e. A tabbed interface)

@method ViewModelOuter#removeInnerContainer
@protected
@param index {Number} Index of tab to remove
*/

ViewModelOuter.prototype.removeInnerContainer = function (index) {
    vmrLite.log(this.className + '.removeInnerContainer', index);

    var elem, nextElem, eachElem, i;

    // Find the repeating eachElem, might be higher up than the inner container
    eachElem = this.inners[index].container;
    while (eachElem && eachElem !== this.container && !eachElem.getAttribute('index')) {
        eachElem = eachElem.parentElement;
    }

    if (eachElem && eachElem.getAttribute('vm-with')) {
        // Is a Array. Not single item, Can delete
        vmrLite.deleteEachElem(eachElem);
    }

    this.inners[index].container = null;
    // Update the inners, and names. If Requied
    this.inners.splice(index, 1);
    if (this.selectedIndex >= this.inners.length) {
        this.selectedIndex = this.inners.length - 1;
    }
    this.render();

    return this;
};

/**
Sets the selected index. Displaying the appopriate tab.

TODO: Send a 'show/focus' message to the new container, and 'blur' to container loosing focus.


@method ViewModelOuter#selectInner
@param index {Number} Index of inner Container.
@protected
@return this
*/

ViewModelOuter.prototype.selectInner  = function (index) {
    vmrLite.log(this.className + '.selectInner', index);
    if (index !== this.selectedIndex) {
        this.selectedIndex = index;

        this.render();
        // TODO: Send message to inner, it is being shown/focus and blur to other.
    }
    return this;
};

/**
A 'closeRequest' message has been received, we have been asked to close.
If we have inner containers, send them a 'closeRequest', if none trigger a 'close'
If was a message bubbled up from a inner container.  trigger a 'close' on behalf of the inner

@method ViewModelOuter#onCloseRequest
@protected
@param ev {DOM-Event} Event triggers, ev.target  must be the container the message was from
*/

ViewModelOuter.prototype.onCloseRequest =  function (ev) {
    var index;
    vmrLite.log(this.className + '.onCloseRequest');
    // We have a closeRequest Event

    if (ev.target === this.container) {
        // Its for me
        if (this.inners.length === 0) {  // No.inners open, can close immediately
            vmrLite.log("this.Trigger-close (no open.inners)");
            // Send custom Event close, to self, dont just call close(), as parents may be watching for a close
            vmrLite.triggerEvent(this.container, 'close', null);
            // this.container.trigger('close');
        } else {
            // We need to check, with the.inners to see if they can close.
            for (index = 0; (index < this.inners.length); index++) {
                vmrLite.log("this.Trigger-closeRequest (index)", index);
                vmrLite.triggerEvent(this.inners[index].container, 'closeRequest', null);
            }
        }
    } else {
        // Not for me, must be a sub-container did not respond/trap a closeRequest,
        // and event has bubbled back up to me.
        // if so, it does not care, so lets send it a 'close' event.
        vmrLite.log("this.Trigger-close (on-behalf-of-tab)");
        vmrLite.triggerEvent(ev.target, 'close', null);
        //$(ev.target).trigger('close');
    }
    ev.preventDefault(); ev.stopPropagation();
};

/**
A 'close' message has been received, we MUST close.
If we have inner containers, send them a 'close', then once inners unloaded then close.
If was a message bubbled up from a inner container. Clear it for them, then trigger a 'unload' on behalf of the inner.

@method ViewModelOuter#onClose
@protected
@param ev {Event} Event triggers, ev.target  must be the container the message was from
*/
ViewModelOuter.prototype.onClose =  function (ev) {
    // Close the container  (i.e. clear its contents)
    vmrLite.log(this.className + '.onClose');
    var index;
    if (ev.target === this.container) {
        // Its for me, We need to close.
        if (this.inners.length === 0) {
            // No open.inners. close
            vmrLite.log(this.className + '.onClose -> close');
            this.close();
        } else {
            // Close all children. ist
            this.closeWhenNoInners = true;
            for (index = 0; (index < this.inners.length); index++) {
                vmrLite.log("this.Trigger-close (index)", index);
                vmrLite.triggerEvent(this.inners[index].container, 'close', null);
                //this.inners[i].container.trigger('closeRequest'); // This should, close if allowed.
            }
        }
    } else {
        // Not for me, must be a sub-container did not respond to a close
        // lets close/clear it for them
        for (index = 0; (index < this.inners.length) && (this.inners[index].container !== ev.target); index++) {
            /* nothing */
        }
        if (index > this.inners.length) {
            console.error('this.onClose, cant find index for event. ', ev);
            return;
        }
        console.warn('this.onClose-empty contents, (on-behalf-of-tab)');
        vmrLite.empty(ev.target);
        // Now tell myself, the tab is empty/destroyed.
        console.warn('this.Trigger-unload, (on-behalf-of-tab)');
        vmrLite.triggerEvent(ev.target, 'unload', null);
    }
    ev.preventDefault(); ev.stopPropagation();
};


/**
A 'unload' message has been received, a container has unloaded.
We should not get 'unload' messages for self, as we should not be loaded (check you are dereferening) correctly
It should be a message bubbled up from a inner container. We need to delete the inner container.

@method ViewModelOuter#onUnloaded
@protected
@param ev {Event} Event triggers, ev.target  must be the container the message was from
*/
ViewModelOuter.prototype.onUnloaded = function (ev) {
    // Inner is now empty, delete the tab-stop in the UI
    vmrLite.log(this.className + '.onUnloaded');
    if (ev.target === this.container) {
        // If we are hiding rather than clearing, we may get our own unloaded !!
        console.error('this.onUnloaded target is self !! This should not happen, IGNORE ', ev);
        return;
    }
    var index;
    for (index = 0; (index < this.inners.length) && (this.inners[index].container !== ev.target); index++) {
        /* nothing */
    }
    if (index > this.inners.length) {
        console.error('this.onUnloaded, cant find index for event. ', ev);
        return;
    }
    this.removeInnerContainer(index);
    ev.preventDefault(); ev.stopPropagation();
};


/**
A 'setTitle' message has been received, from the inner container.
call setTitle with details from ev.detail.

@method ViewModelOuter#onSetTitle
@protected
@param ev {Event} Event triggers, ev.detail has the title {String|Object}
*/

ViewModelOuter.prototype.onSetTitle =  function (ev) {
    vmrLite.log(this.className + '.onSetTitle', ev);

    var title = ev.detail, index;

    for (index = 0; (index < this.inners.length) && (this.inners[index].container !== ev.target); index++) {
        /* nothing */
    }
    if (index > this.inners.length) {
        console.error('this.onSetTitle, cant find index for event. ', ev);
        return;
    }
    if (index < this.inners.length) {
        // Set the title.
        this.setTitle(index, title);
        this.render(); // TODO: We can be smarter here, and call vmrLite.render just for this tab.
    } else {
        console.error('this.onSetTitle for non existant container !!');
    }
    ev.preventDefault(); ev.stopPropagation();
};



/**
Open a new tab/windows, and show the view model

@method ViewModelOuter#openNew
@param viewModel {Object} View model Instance, to show. (i.e. viewModel.show(new-container))
*/


ViewModelOuter.prototype.openNew =  function (viewModel) {
    var title=window.document.title;
    vmrLite.log(this.className + '.openNew', viewModel);

    if (viewModel.title) title = viewModel.title;
    if (viewModel.getTitle) title = viewModel.getTitle();

    viewModel.show(this.createInnerContainer(title));

};



/**
A 'open' message has been received, to open a new tab/window with a View Model.

@method ViewModelOuter#onOpenNew
@protected
@param ev {Event} Event triggers. ev.detail contains the viewModel
*/

ViewModelOuter.prototype.onOpenNew =  function (ev) {
    vmrLite.log(this.className + '.onOpenNew', ev);
    var index,
        viewModel = ev.detail; // Handle standard event

    // Its directed at me. // 1st see if already open.
    for (index = 0; (index < this.inners.length) && (this.inners[index].container !== viewModel.container); index++) {
        /*  nothing */
    }
    if (index < this.inners.length) {
        // Tab already open. Just bring it to the front.!!
        this.selectInner(index);
    } else {
        // Not found Add
        this.openNew(viewModel);
    }

    ev.preventDefault(); ev.stopPropagation();
};


/**
User has clicked the title (or something) to select a Inner Container, call selectInner

@method ViewModelOuter#onClickSelect
@protected
@param ev {DOM-Event} Event triggers
*/
ViewModelOuter.prototype.onClickSelect  = function (ev) {
    vmrLite.log('ViewModelOuter onClickSelect', this);

    var index = 0;
    if (this.inners.length > 1) {
        index = vmrLite.closestIndex(ev.target); // Find closest item with getAtrribute=index
    }
    this.selectInner(index);

    ev.preventDefault(); ev.stopPropagation();
};



/**
User has clicked minimize button. 

Toggles the this.inners[index].minimized attribute, then re-renders.

@method ViewModelOuter#onClickMinimize
@protected
@param ev {Event} Event triggers
*/
ViewModelOuter.prototype.onClickMinimize  = function (ev) {
    vmrLite.log(this.className + '.onClickMinimize');
    var index = 0;
    index = vmrLite.closestIndex(ev.target); // Find closest item with getAtrribute=index
    this.inners[index].minimized = !this.inners[index].minimized;
    this.render();
    ev.preventDefault(); ev.stopPropagation();
};



/**
User has clicked a button, to request the Inner Container be closed. Send a 'closeRequest' to container.

@method ViewModelOuter#onClickClose
@protected
@param ev {DOM-Event} Event triggers
*/
ViewModelOuter.prototype.onClickClose  = function (ev) {
    vmrLite.log(this.className + '.onClickClose');
    ev.preventDefault(); ev.stopPropagation();
    if (this.inners.length === 0) {
        // Message should be for a container,
        this.close();
        return;
    }
    var index = 0;
    index = vmrLite.closestIndex(ev.target); // Find closest item with getAtrribute=index
    // Send a closeRequest to the container.
    vmrLite.log("this.Trigger-closeRequest (index)", index);
    if (!this.inners[index].container) {
        vmrLite.log("onClickClose. Cannot find inner container for", index);
        return;
    }
    vmrLite.triggerEvent(this.inners[index].container, 'closeRequest', null);
};

/**
Mouse has clicked in the title, get ready to move the window.

@method ViewModelOuter#onMouseDownInTitle
@protected
@param ev {DOM-Event} Event triggers
*/

ViewModelOuter.prototype.onMouseDownInTitle  = function (ev) {
    var index, maxZ, i;
    
    vmrLite.log(this.className + '.onMouseDownInTitle', ev);
    this.mouseX = ev.x;
    this.mouseY = ev.y;
    this.mouseTarget = ev.target;
    this.mouseTarget.style.cursor = 'move';
    index = 0;
    if (this.inners.length > 1) {
        index = vmrLite.closestIndex(ev.target); // Find closest item with getAtrribute=index
    }
    maxZ = 900;
    for (i = 0; (i < this.inners.length); i++) {
        if (i !== index) {
            if (maxZ < this.inners[i].container.parentElement.style.zIndex) {
                maxZ = this.inners[i].container.parentElement.style.zIndex;
            }
        }
    }
    vmrLite.log(this.className + '.onMouseDownInTitle', index, maxZ);
    if (typeof maxZ === 'string') { maxZ = parseInt(maxZ, 10); }
    this.inners[index].container.parentElement.style.zIndex = maxZ + 1;


};


/**
Mouse has un-clicked in the title, cancel moving.

@method ViewModelOuter#onMouseUpInTitle
@protected
@param ev {Event} Event triggers

*/


ViewModelOuter.prototype.onMouseUpInTitle  = function (ev) {
    vmrLite.log(this.className + '.onMouseUpInTitle', ev);
    this.mouseX = (-1);
    this.mouseY = (-1);
    if (this.mouseTarget) {
        this.mouseTarget.style.cursor = '';
    }
    this.mouseTarget = null;
};


/**
Mouse has moved within the title, move the window.
Hook up vm-on-mousedown="onMouseDownInTitle" vm-on-mousemove="onMouseMoveInTitle"
vm-on-mouseup="onMouseUpInTitle"  vm-on-mouseleave="onMouseUpInTitle" within your html to enable

@method ViewModelOuter#onMouseMoveInTitle
@protected
@param ev {Event} Event triggers

*/


ViewModelOuter.prototype.onMouseMoveInTitle  = function (ev) {
    if (this.mouseX > 0) {
        if (Math.sqrt(Math.pow(ev.y - this.mouseY, 2) + Math.pow(ev.x - this.mouseX, 2)) > 8) {
            // Only move ~8px.
            var e = this.mouseTarget.parentElement;
            vmrLite.log(this.className + '.onMouseMoveInTitle', e);
            if (e.style.position !== 'fixed') {
                vmrLite.log('showModal.FIXED');
                e.style.width = e.clientWidth + 'px'; // or offsetWidth (incl's borders) // scrollWidth (full width)
                e.style.height = e.clientHeight + 'px';
                e.style.top = e.offsetTop + 'px';
                e.style.left = e.offsetLeft + 'px';
                e.style.margin = '0';
                e.style.position = 'fixed';
            }
            e.style.top = String(e.offsetTop + ev.y - this.mouseY) + 'px';
            e.style.left = String(e.offsetLeft + ev.x - this.mouseX) + 'px';
            this.mouseX = ev.x;
            this.mouseY = ev.y;
        }
    }
};



vmrLite.ViewModelOuter = ViewModelOuter;

// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = ViewModelOuter;
}
