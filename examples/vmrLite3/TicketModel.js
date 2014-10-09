
/* jshint globalstrict: true */

"use strict";

/* global window, console, document, module, XMLHttpRequest, requireLite, vmrLite */


function TicketModel(id,name,code,price) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.price = price;
}

// Add compare <=> method.
TicketModel.prototype.cmp = function (withThis, attrib) {
    if ( !attrib )  attrib = 'name';
    var n1 = this[attrib].toLowerCase();
    var n2 = withThis[attrib].toLowerCase();
    return ( n1<n2 ? -1 : ( n1==n2 ? 0 : 1 ));
};

TicketModel.prototype.clone = function () {
    var k,newObj = {};
    for (k in this) {
        if (this.hasOwnProperty(k)) {
            newObj[k] = this[k];
        }
    }
    return newObj;
};


TicketModel.prototype.save = function() {
    // Save into pretend database
    var idx=TicketModel._db.length;
    if ( this.id ) {
        for (idx=0;idx<TicketModel._db.length;idx++)
          if ( TicketModel._db[idx].id == this.id )
            break;
    } else {
        this.id = TicketModel._SEQ++;
    }
    if ( idx<TicketModel._db.length )
      TicketModel._db[idx] = this.clone();
    else
      TicketModel._db.push(this.clone());
    // Tell anyone interested, a ticket has changed
    vmrLite.triggerEvent( document.body, 'ticket-changed', { model: this } );

    return this; // chain
};


// Fake Database
// ================
TicketModel._db = [
    new TicketModel(100,"Economy", "E", 199.95 ),
    new TicketModel(101,"Business", "B",  449.22 ),
    new TicketModel(102,"First Class", "F", 1199.99 )
];

TicketModel._SEQ = 103;

// Class level database access functions
TicketModel.find_all = function() {
    var i,
        modelList = TicketModel._db.slice(); // Clone Array
    for (i = 0; (i<modelList.Length); i++)
        modelList[i] = modelList[i].clone();

    return modelList;
};

TicketModel.find_by_id = function(id) {
    var idx=0;
    for (;idx<TicketModel._db.length;idx++)
        if ( TicketModel._db[idx].id == id )
            break;
    if ( idx<TicketModel._db.length )
        return TicketModel._db[idx].clone();
    return null;
};

if ( typeof(module) != 'undefined' )
  module.exports = TicketModel;
