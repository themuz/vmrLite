"use strict";

/* global window, console, document, module  */
/* jshint globalstrict: true */

function TodoModel(pname) {
    this.name = pname;
    this.completed = false;
}

if ( typeof module != 'undefined' ) {
    module.exports = TodoModel;
}


