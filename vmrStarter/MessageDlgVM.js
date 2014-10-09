"use strict";

/* global window, console, document, module, XMLHttpRequest, requireLite */
/* jshint globalstrict: true */



// If vmrLite loaded, globally, dont use requireLite
var vmrLite = window.vmrLite;
if ( typeof vmrLite === 'undefined') {
    vmrLite = requireLite('lib/vmrLite');
}
var ViewModelBase = requireLite('./ViewModelBase');


if ( !vmrLite.ViewModelBase ) {
    requireLite('lib/vmrLite-ViewModelBase');
}

if ( !vmrLite.showModal ) {
    requireLite('lib/vmrLite-ShowModal');
}

/**

# Message Dlg View Model (MessageDlgVM)

Display a message dialogue, then call "callback" function when item selected.

### Usage (Class):-

    new MessageDlgVM( {
        message: 'Click a Button',
        buttons: 'yes,no,ok,cancel', // Combination of yes,no,ok,cancel,abort,retry,ignore
        title: 'Dialogue Title', // Defaults to window.document.title
        onCloseCallback: function(viewmodel) {
           alert('You clicked the "' + viewmodel.selected + '" button');}
    }).showModal();


### Usage (Static Function):-

    MessageDlgVM.messageDlg( 
        'Click a Button',
        'yes,no,ok,cancel', // Combination of yes,no,ok,cancel,abort,retry,ignore
        onCloseCallback: function(viewmodel) {
           alert('You clicked the "' + viewmodel.selected + '" button');}
    );



Callback: The call back is passed the instance of MessageDlgVM. the property "selected" contains the button clicked

### extends ViewModelBase  

@class MessageDlgVM  
@constructor
@param config {Object} Configuration settings. { None }
 */

function MessageDlgVM(config) {
    var k,container;
    /* jshint validthis:true */    
    if (!(this instanceof MessageDlgVM)) { // If invoked as a factory by mistake
        console.debug('MessageDlgVM: not called with new');
        return new MessageDlgVM(config);
    }
    //  
    vmrLite.ViewModelBase.call(this, config);
    // Initalize
    this.className = 'MessageDlgVM';
    this.selected = 'cancel'; // Button selected
    this.type = 'none'; 
    this.title =  window.document.title;
    this.message = 'Confirm'; 
    this.buttons = 'ok,cancel'; 


    // Grab the config
    for (k in { type: null, message: null, buttons: null, title: null  } ) {
        if (config[k]) { this[k] = config[k]; }
    }    
    console.log(this.className+': new instance',this);

}

/* Inheritance */

MessageDlgVM.prototype = Object.create(vmrLite.ViewModelBase.prototype);
MessageDlgVM.prototype.constructor = MessageDlgVM;

/* Prototype - properties */

MessageDlgVM.prototype.TEMPLATE = requireLite('./MessageDlgVM.html');

/* Prototype - methods */

/**

User Clicked a button, set selected property, and close.

@method MessageDlgVM#onClickButton
@protected
@param ev {DOM-Event} Event triggers, ev.target  must be the container the message was from

*/


MessageDlgVM.prototype.onClickButton =  function (ev) {
    this.selected = ev.target.getAttribute('data-button');
    this.close();
    ev.preventDefault(); ev.stopPropagation();
};


// =============================================

/**
Display a message dialogue, then call "callback" function when item selected.

Callback: The call back is passed the instance of a MessageDlgVM, the property "selected" contains the button clicked

Example:

    MessageDlgVM.messageDlg (
        'Really close, Your changes will be lost',
        'yes,no',
        function(msgdlg) {
            if ( msgdlg.selected == 'yes ')
                alert('Exiting, changes NOT saved');}
    });

@method MessageDlgVM.messageDlg
@param message {String} Message
@param buttons {String} Combination of yes,no,ok,cancel,abort,retry,ignore
@param onCloseCallback {Function} onCloseCallback
*/

MessageDlgVM.messageDlg = function (message, buttons, onCloseCallback) {
    var dlg=new MessageDlgVM({ message: message, buttons: buttons, onCloseCallback:  onCloseCallback });
    dlg.showModal();
};

// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = MessageDlgVM;
}


// =============================================


