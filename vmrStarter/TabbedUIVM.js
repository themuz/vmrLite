"use strict";

/* global window, console, document, module, XMLHttpRequest, requireLite */
/* jshint globalstrict: true */


// If vmrLite loaded, globally, dont use require to load 

var vmrLite = window.vmrLite;
if (typeof vmrLite === 'undefined') {
    vmrLite = requireLite('lib/vmrLite');
}

var ViewModelOuter = requireLite('./ViewModelOuter');

/**

=== A Tabbed UI 

See ViewModelOuter for details. 

### extends ViewModelOuter

Actually only adds the TEMPLATE html and CSS

@class TabbedUIVM  
@constructor
@param config {Object} Configuration settings. { None }
*/

function TabbedUIVM(config) {
    /* jshint validthis:true */    
    if (!(this instanceof TabbedUIVM)) { // If invoked as a factory by mistake
        console.debug('TabbedUIVM: not called with new');
        return new TabbedUIVM(config);
    }
    vmrLite.ViewModelOuter.call(this, config);
    this.className = 'TabbedUIVM';
}

/* Inheritance */

TabbedUIVM.prototype = Object.create(vmrLite.ViewModelOuter.prototype);
TabbedUIVM.prototype.constructor = TabbedUIVM;

/* Prototype - properties */

TabbedUIVM.prototype.BASE_CSS = requireLite('./BaseUI.css');
TabbedUIVM.prototype.CSS = requireLite('./TabbedUIVM.css');
TabbedUIVM.prototype.TEMPLATE = requireLite('./TabbedUIVM.html');

vmrLite.TabbedUIVM = TabbedUIVM;

// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = TabbedUIVM;
}
