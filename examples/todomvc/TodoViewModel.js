"use strict";


/* global window, console, document, module, XMLHttpRequest, require, vmrLite, partial */
/* jshint globalstrict: true */

var TodoModel = require('TodoModel.js');

function TodoViewModel(container) {
    if (!(this instanceof TodoViewModel)) { // If invoked as a factory by mistake
        console.debug(': doViewModel not called with new');
        return new TodoViewModel(arguments);
    }    
    this.className = 'TodoViewModel';
    this.container = null;

    this.newTodo = new TodoModel('');
    this.selectedIndex = -1;
    this.todos = [];
    // Test Data ...
    this.todos = [ 
        new TodoModel('Look at vmrLite - and requireLite'),
        new TodoModel('Check out the todomvc app'),
        new TodoModel('Evaluate the options') ];
    this.todos[1].completed = true; // Test data
    this.list_filter_mode=''; // all
    this.editingIdx = -1;
}

TodoViewModel.DOM_TEMPLATE = require('./TodoViewModel.html');

TodoViewModel.prototype.showThisItem = function (index) {
    return ( this.list_filter_mode === '') || // all
           ( this.list_filter_mode != 'active' && this.todos[index].completed ) || // completed
           ( this.list_filter_mode === 'active' && !this.todos[index].completed ); // active
};

TodoViewModel.prototype.render = function () {
    vmrLite.render(this.container,this);
};

TodoViewModel.prototype.open = function (container) {
    this.container = container;
    if (typeof this.container === 'string') { this.container = document.getElementById(this.container); }    
    this.container.innerHTML = ''; // Clear container.
    this.container.appendChild( TodoViewModel.DOM_TEMPLATE.cloneNode(true) );

    this.render();
};


TodoViewModel.prototype.completedCount = function() {
    return this.todos.filter( function(e) { return e.completed; }).length;
};

TodoViewModel.prototype.remainingCount = function() { return  this.todos.length-this.completedCount(); };


TodoViewModel.prototype.onAddTodo = function(ev) {
    var name=ev.target.value.trim();
    if ( name ) {
        this.todos.unshift( new TodoModel(name) );
        this.newTodo.name = '';
        ev.target.value=''; // Blank out, input as just added
        this.render();
    }
    return false;
};

TodoViewModel.prototype.onClickCompleted = function(ev) {
    var index=vmrLite.closestIndex(ev.target);
    this.todos[index].completed = !this.todos[index].completed;
    this.render();
    return false;
};

TodoViewModel.prototype.onCheckEditBegin = function(ev) {
    this.editingIdx=vmrLite.closestIndex(ev.target);
    this.render();
    return false;
};

TodoViewModel.prototype.onBlurEdit = function(ev) {
    var index=vmrLite.closestIndex(ev.target);
    this.todos[index].name = ev.target.value;
    this.editingIdx = -1;
    this.render();
    return false;
};

TodoViewModel.prototype.onClickFilter = function(ev) {
    this.list_filter_mode=ev.target.dataset.filter;
    this.render();
    return false;
};

TodoViewModel.prototype.onToggleAll = function(ev) {
    if ( this.todos.length > 0) {
        var setclear = this.remainingCount() > 0;
        for (var i=0;i<this.todos.length;i++)
            this.todos[i].completed = setclear;
        this.render();
    }
    return false;
};

TodoViewModel.prototype.onDeleteTodo = function(ev) {
    var index=vmrLite.closestIndex(ev.target);
    this.todos.splice(index,1);
    this.render();
    return false;
};

TodoViewModel.prototype.onClickRemoveCompleted = function(ev) {
    if ( this.todos.length > 0) {
        for (var i=0;i<this.todos.length;i++)
            if ( this.todos[i].completed ) {
                this.todos.splice(i,1);
                i--;
            }
        this.render();
    }
    return false;
};

// ====================================================
// Invoked via "function(module) { ...code.. }
// ====================================================


// If loaded via vmrLite.partial's model pattern. i.e. function(partial) { ... this code ... }();
if ( typeof module != 'undefined' ) {
    module.exports = TodoViewModel;
}


