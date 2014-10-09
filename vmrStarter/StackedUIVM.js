'use strict';

/* global window, console, document, module, XMLHttpRequest, requireLite */
/* jshint globalstrict: true */

// If vmrLite loaded, globally, dont use require to load 
var vmrLite = window.vmrLite;
if (typeof vmrLite === 'undefined') {
    vmrLite = requireLite('lib/vmrLite');
}

var ViewModelOuter = requireLite('./ViewModelOuter');


/**

=== A Stacked Window UI 

See ViewModelOuter for details. 

Actually only adds the TEMPLATE and CSS

### extends ViewModelOuter 

@class StackedUIVM  
@constructor

@param config {Object} Configuration settings. { None }
*/

function StackedUIVM(config) {
    /* jshint validthis:true */    
    if (!(this instanceof StackedUIVM)) { // If invoked as a factory by mistake
        console.debug('StackedUIVM: not called with new');
        return new StackedUIVM(config);
    }
    ViewModelOuter.call(this, config);
    this.className = 'StackedUIVM';
}

/* Inheritance */

StackedUIVM.prototype = Object.create(vmrLite.ViewModelOuter.prototype);
StackedUIVM.prototype.constructor = StackedUIVM;

/* Prototype - properties */

StackedUIVM.prototype.TEMPLATE = requireLite('./StackedUIVM.html');
StackedUIVM.prototype.BASE_CSS = requireLite('./BaseUI.css');
StackedUIVM.prototype.BASE_CSS = requireLite('./StackedUIVM.css');


vmrLite.StackedUIVM = StackedUIVM;

// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = StackedUIVM;
}


