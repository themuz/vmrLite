"use strict";
/* global window, console, document, module */

/**

# View Model Render Lite (vmrLite)

Render (associate) DOM elements with a JavaScript view model object. 
Designed for HTML5 browsers (i.e. IE10+)

Similar (sort of) to knockout. But much much simpler, and you control when to render/sync.

Use with requireLite to dynamically load js and (partial) html.

### Features :-

- lightweight (i.e. very small ~300 lines of code, excl comments/white-space)
- js loaded using module pattern.
- render (display) information from a JS Object within a DOM Tree
- sync input elements back
- supports repeating elements (e.g arrays) (see vm-each) to clone/create dom nodes.
- include in your page. or load as a AMD module (i.e. require.js)
- NO dependancies. 
- Add your own DOM extensions. 
- sync/render when you want (NOT when framework thinks you should)
- on-events - Are passed the event object. (and read like the old days)

### Available Attributes at each DOM Element. 

vmrLite uses special attributes prefixed with "vm" (view model) to control dom/js mapping.
The attributes value represent an expression (typically just a property) of the object to bind. 

Below are the core/common items (vm- prefixed)

- **text** - Bind to the elements.textContent to the specified object
- **html** - Bind to the elements.innerHTML
- **each** - Clone DOM element for each, corresponding array-like JS object
- **with** - Sub-Elements are evaluated within (i.e. with) this object
- **class** - Set/Unset Elements css class (based on truthy result of expression).
- **id** - Bind to element.id
- **display** - Set/Clear a elements.style.display based of truthy of a JS element (i.e. sets to none if falsy)
- **onclick** - Link a click event to function call, all functions are bind'ed to the view model and receive the event object as a parameter
- **on**-_type_ - Link a event of "type" to a function (e.g. vm-onclick === vm-on-click )
- **more** - For full details, see the documentation (or read the code, its only ~100 lines!!)
- **custom** - Add your own. Just create a function. e.g `vmrLite.tagFns['myslide'] = function (tag,elem,viewModel) { ... }`

### Usage Render (ViewModel => DOM)

    vmrLite.render(containerElement, viewModelObj);

### Usage Sync (DOM Input elements => ViewModel)

    vmrLite.sync(containerElement, viewModelObj);

### Example

A simple example, (based on [knockoutjs](http://knockoutjs.com/) live example, to allow comparision.)

html

    <fieldset id="ticketsView" >
        <legend>Example 1</legend>
        <select vm-value="chosenTicketCode">
            <option vm-each="tickets" vm-value="code" vm-text="name"></option>
        </select>
        <button vm-on-click="onClickChooseTicket">Choose</button>
        <button vm-on-click="onClickResetTicket">Clear</button><br />
        <i style="font-size:8pt">You have <span vm-text="tickets.length+' tickets'">x</span> to choose from</i>

        <div vm-with="getChosenTicketDetails()" >
            <hr />
            You have chosen <b vm-text="name">...</b>
            ($<span vm-text="price">...</span>)
        </div>
    </fieldset>

js


    function TicketsViewModel(config) {
        "use strict";   
        this.container = null;
        this.tickets = [
            { name: "Economy", code: "E", price: 199.95 },
            { name: "Business", code: "B",  price: 449.22 },
            { name: "First Class", code: "F", price: 1199.99 }
        ];
        this.chosenTicketCode = null;
        // Add sync/render for convenience
        this.sync = function() { vmrLite.sync( this.container, this ); };
        this.render = function() { vmrLite.render( this.container, this ); };
        this.show = function(container) { 
            this.container = container;
            vmrLite.render( this.container, this );
        };  
        // Instance functions to handle events
        this.getChosenTicketDetails = function () {
            if ( !this.chosenTicketCode ) return null;
            // Watch out, Array.filter needs "this" as 2nd argument, otherwise this is "undefined"  !!
            return this.tickets.filter( function(e)  { return e.code == this.chosenTicketCode; }, this )[0];
        };
        this.onClickChooseTicket = function(ev) {
            this.sync(); // Get the data, Only 1 input element, to KISS
            // Validate data, persist data, code here ...
            this.render(); };
        this.onClickResetTicket = function(ev) {
            this.chosenTicketCode = null;
            this.render(); };
        return this; // Not needed, as this is the default.
    }


index.html

    <script language="JavaScript" type="text/JavaScript">
        (new TicketsViewModel()).show(document.getElementById('ticketsView'));
    </script>

### Outstanding items
- Enhance evalWith, to look for plain properties, before using the more complex eval using new Function. (speed increase x8+)

@module vmrLite

*/


// Bind $id in-case we have properties called window/document.
var $id = function (id) { return this.getElementById(id); }.bind(window.document);

var vmrLite = {};

if (!String.prototype.compare) {
    String.prototype.compare = function (b) { return (this < b) ? -1 : (this === b) ? 0 : 1; };
}
vmrLite.log = function() {};

vmrLite.Zlog = function() {
    var args=Array.prototype.slice.call(arguments);
    args.unshift('[vmrLite]');
    console.log.apply(console,args);
};


/** 

Class name for the object

@name className
@type String
@static
@default "vmrLite"
@readonly 
*/

vmrLite.className = 'vmrLite';

/**

Simple sequence number, used to allocate unique id's.

@name SEQ
@type Number
@static
@default "getTime() % 16777215"


*/

vmrLite.SEQ = (new Date()).getTime() % 16777215;


/*
Add an event listener addEventListener, and return hash of parameters,
that can subsequently be used to call removeEventListener

@method UNUSED_eventOn
@static
@public
@param elem {HTMLElement }  element to add listener to
@param type {String}  event type to listen for. (e.g. click )
@param listener {Function} Function that receives a notification when an event of the specified type occurs
@return {Object} { elem: elem, type: type, listener:listener }
*/

vmrLite.UNUSED_eventOn = function (elem, type, listener) {
    if (elem.jquery) { elem = elem.get(0); } // Want plain elem (not jQuery)

    elem.addEventListener(type, listener, false); // false=DONT useCapture
    return { elem: elem, type: type, listener: listener };
};

/**
Trigger an event, e.g. 'click', 'close'. uses document.createEvent internally for compatibility.

@method triggerEvent
@static
@public
@param elem {HTMLElement }  element that triggers the event. (i.e. will become events ev.target)
@param etype {String}  event type to trigger. (e.g. click )
@param detail {Object} Object to pass to the event, (available within the event as detail (e.g ev.detail))
@return {Boolean} result of elem.dispatchEvent(ev);
*/

vmrLite.triggerEvent = function (elem, etype, detail) {
    var ev;
    if (typeof elem === 'string') { elem = document.getElementById(elem); }
    if (elem.jquery) { elem = elem.get(0); } // Want plain elem (not jQuery)

    // Changed to use createEvent VS new CustomEvent for IE9/10/11 support
    ev = document.createEvent('CustomEvent');
    ev.initCustomEvent(etype, true, true, detail);


    return elem.dispatchEvent(ev);
    // return elem.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail: detail } ));
};

/**
Set/Clear the className base on parameters
USed as replacement for elem.classList.toggle as IE10 does not support the 2nd boolean parameter

@method setClass (Helper)
@protected
@static
@param elem {HTMLElement }  element set/clear class name from
@param className {String}  className to set/clear
@param setORclear {Boolean} set (true), clear (false) the className
*/

vmrLite.setClass = function (elem, className, setORclear) {
    // IE10/11. Does not take 2nd parameter for toggle !!!!
    var cl = elem.classList,
        containsClass = cl.contains(className);
    if (!containsClass && setORclear) {
        cl.add(className);
    }
    if (containsClass && !setORclear) {
        cl.remove(className);
    }
};


/*

Returns an eval like of the express "expr" within scope of withObj and viewModel.

Withing the expression, the following variables are available :-
vm corresponds to the viewModelObj,
this corresponds to the withObj,
index corresponds to the index
If expression raises an expression, error is logged.

Code is effectively with ( vm ) { with ( this ) { return expr }}
* TODO: Enhance so if a simple string representing a property, use withObj[expr]

TODO: Remove assigning null;s

@method evalWith
@protected
@static
@param expr {String}  String to evaluate
@param withObj {Object}  Object to evaluate with (expression bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.


@return {Object} result of evaluation.
*/

vmrLite.evalWith = function (expr, withObj, viewModelObj, index) {
    var fn;
    // return withObj[expr];
    fn = new Function(['vm', 'index'], 'with ( vm ) { with ( this ) { return ' + expr + ' }}' );
    try {
        return fn.call(withObj, viewModelObj, index);
    } catch (ex) {
        // console.error(' vmrLite.evalWith( "' + expr + '") ' + ex.message );
        // HACK create object
        withObj[expr] = null;
        return null; // '(exception)'

    }
};

/*
Assign "value" to the "expr" within scope of withObj and viewModel.

@method assignWith
@protected
@static
@param value {Object}  String to assign
@param expr {String}  Expression to assign
@param withObj {Object}  Object to evaluate with (expression bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
*/
vmrLite.assignWith = function (value, expr, withObj, viewModelObj, index) {
    var fn;
    fn = new Function(['value', 'vm', 'index'], 'with ( vm ) { with ( this ) { ' + expr + ' = value }}');
    try {
        return fn.call(withObj, value, viewModelObj, index);
    } catch (ex) {
        vmrLite.log('Exception with "' + expr + '"');
        throw ex;

    }
};


/**
Find the closest Element, up the DOM tree from el, with anattribute of index. and return its index (as a Number)

@method closestIndex (Helper)
@static
@public
@param el {Element} Element to search up from
@return {Number} Value of 'index' attribute.
*/

vmrLite.closestIndex  = function (el) {
    if (el.jquery) { el = el.get(0); } // Want plain elem (not jQuery)
    var index = el.getAttribute('index');
    while (el && !index) {
        el = el.parentElement;
        if (el) {
            index = el.getAttribute('index');
        } else {
            console.error('vmrLite.closestIndex el has NO parent');
        }
    }
    if (index) {
        index = parseInt(index, 10);
    } else {
        index = -1; //Cant find
    }
    return index;
};

/**
Delete the row/element of a vmr-each, re-numbering child siblings, as we go.

Used for efficient rendering, Use where content main contains another view-models/html
i.e. Manually delete a repeating element, on behalf of the render

@method deleteEachElem
@static 
@public
@param delElem {Element} Element to delete (must contain the "index" attribute)
*/

vmrLite.deleteEachElem = function (delElem) {
    var index, nextElem;
    if (delElem.jquery) { delElem = delElem.get(0); } // Want plain elem (not jQuery)

    index = delElem.getAttribute('index');
    vmrLite.log('vmrLite.deleteEachElem ', index);
    if (typeof index !== 'string') {
        console.error('vmrLite.deleteEachElem element has NO index', delElem);
        index = '8888';
    }
    index = parseInt(index, 10);
    // delElem.style.display='none'; // Hide it

    nextElem = delElem.nextElementSibling;
    while (nextElem && (nextElem.getAttribute('index') === String(index + 1))) {
        nextElem.setAttribute('index', String(index)); // Change index
        // if ( index == 0 ) // If index 0, Keep the vm-with, Changed so vm-with is reserved
        //    nextElem.setAttribute('vm-with', delElem.getAttribute('vm-with'));
        nextElem = nextElem.nextElementSibling;
        index++;
    }
    // Finally remove it.
    vmrLite.empty(delElem);
    delElem.parentElement.removeChild(delElem);
};


/*
Build the each, adding clones of the vmr-each element. as siblings.

TODO: If each has an "id" attribute method, use that to re-render via moving DOM elements
rather than replacing the content. (note use an algorithm that swaps dom elements, so if list
is ordered then reversed this is efficient)
TODO: If a repeating options (within a select), use v0.1 implementation and don't hide/reserve the vmr-each element.

@method buildEach
@protected
@static 
@param elem {Element}  HTML Element with the vmr-each tag.
@param withObj {Object}  Object to evaluate with (expression bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
@return {Boolean} true of has elements (i.e. len > 0 )
*/
vmrLite.buildEach = function (elem, withObj, viewModelObj, index) {

    var i, len = 0,
        eachExpr, eachArraylike,
        nextElem, newElem, parentElement;
        
    eachExpr = elem.getAttribute('vm-each');
    // vmrLite.log('vm-each ' + elem.get(0).tagName + '-' + eachExpr );

    eachArraylike = vmrLite.evalWith(eachExpr, withObj, viewModelObj, index);
    if (typeof eachArraylike === 'undefined') {
        console.error('vm-each undefined for "' + eachExpr + '" within ' + elem.tagName);
        return false;
    }

    // Clone this node, For each item above 0.
    // Append to child.
    if (eachArraylike) {
        len = eachArraylike.length; // Assume "array" like.
    }
    // vmrLite.log('vm-each ' + elem.get(0).tagName + '-' + eachExpr + ' len='+len);
    // The each is always hidden.
    elem.style.display = 'none';

    parentElement = elem.parentElement;
    nextElem = elem.nextElementSibling;
    for (i = 0; i < len; i++) {
        if (nextElem && nextElem.getAttribute('index') === String(i)) {
            // Already Set.
            nextElem.style.display = '';
            nextElem = nextElem.nextElementSibling;

        } else {
            // Need to append, nextElem is node to insertBefore.
            newElem = elem.cloneNode(true);
            newElem.removeAttribute('vm-each'); // Don't want a each on children.
            newElem.setAttribute('vm-with', eachExpr);
            newElem.style.display = '';
            newElem.setAttribute('index', String(i)); // Add index for use by app
            if (nextElem) {
                parentElement.insertBefore(newElem, nextElem);
            } else {
                parentElement.appendChild(newElem);
            }
        }
    }

    // See if need to delete any extra items.
    while (nextElem && (nextElem.getAttribute('index') === String(i))) {
        // vmrLite.log('DELETE');
        newElem = nextElem; // newElem == element to delete.
        nextElem = nextElem.nextElementSibling;
        // Remove node last
        vmrLite.empty(newElem);
        parentElement.removeChild(newElem);
        i++;
    }

    return (len > 0);
};


// Array of functions to call after the render
// use when method requires, full rendering 1st to operate.
vmrLite.afterRenderApply = []; // Array of { fn: function , args: argsArray } to call after render complete

vmrLite.tagFns = {};

/**
Perform the tag function. All tag functions have the same parameters

A tag is expressed as vmr-tagname-param="value-expr" in the html

@method tagFns_base
@protected
@static 
@param tag {Object} Details of the attribute tag. tag is expressed as vmr-tagname-param="value-expr"
@param tag.name {String} Tag Name 
@param tag.param {String} Param (or blank string)
@param tag.value {String} The value-expr
@param tag.result {Object} Result of evaluating "value-expr"
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['base'] = function (tag, elem) {}; // noop operator.

/**
Set the innerHTML property of the element (see tagFns for details).

vmr-html="expr" => elem.innerHTML = tag.result

If the result is text, use vmr-text. as html is NOT escaped.

@method tagFns_html
@inner
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag

*/
vmrLite.tagFns.html = function (tag, elem) {
    elem.innerHTML = tag.result;
};


/**
Set the textContent property of the element (see tagFns for details)

vmr-text="expr" => elem.textContent = tag.result

@method tagFns_text
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/
vmrLite.tagFns['text'] = function (tag, elem) {
    elem.textContent = tag.result; // (IE=innerText) IE9+ ok
};

/**
Set the id property of the element (see tagFns for details)

vmr-id="expr" => elem.id=tag.result

@method tagFns_id
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['id'] = function (tag, elem) {
    elem.id = tag.result;
};

/**
Set/Clear the css style.display "none" property of the element (see tagFns for details).
if tag.result is truthy set to '' else 'none'.

vmr-display="expr" => elem.style.display = ( tag.result ? '' : 'none' );

@method tagFns_display
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/


vmrLite.tagFns['display'] = function (tag, elem) {
    elem.style.display = (tag.result ? '' : 'none');
};


/**
Set/Get the value property of the element (see tagFns for details).
If the element type is a 'checkbox' it sets checked based on result

vmr-value="expr" => elem.value=tag.result

@method tagFns_value
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/
vmrLite.tagFns['value'] = function (tag, elem) {
    if (elem.type === 'checkbox') {
        elem.checked = !!tag.result;
    } else {
        elem.value = tag.result;
    }
};

/**
Set/clear the class defined by the tag parameter and truthy result value.

vmr-class-param="expr" => elem.classList.toggle(tag.param,!!tag.result)

@method tagFns_class
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['class'] = function (tag, elem) {
    vmrLite.setClass(elem, tag.param, !!tag.result);
    //vmrLite.classList_toggle(elem,tag.param,!!tag.result);
};

/**
Set the elements style as defined by the tag parameter  (see tagFns for details).

vmr-style-param="expr" => elem.style[tag.param] = tag.result;

@method tagFns_style
@protected
@static
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['style'] = function (tag, elem) {
    elem.style[tag.param] = tag.result;
};

/**
Dump a debug message the "tag.result" to the console, 


@method tagFns_debug
@protected
@static
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/
vmrLite.tagFns['debug'] = function (tag, elem) {
    vmrLite.log('debug:' + tag.result);
    elem.setAttribute('debug', tag.result);
};
/**
Set/Clear the elements readOnly property AND style  (see tagFns for details).

vmr-readOnly="expr" => elem.readonly = !!tag.result; vmrLite.classList.toggle(elem,'readonly',!!tag.result);

@method tagFns_readOnly
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['readonly'] = function (tag, elem) {
    // Short for vm-class-required + input.disabled
    vmrLite.setClass(elem, 'readonly', !!tag.result);
    // vmrLite.classList_toggle(elem,'readOnly',!!tag.result);
    elem.readonly = !!tag.result;
};

/**
Set/Clear the elements disabled property AND style  (see tagFns for details).

vmr-readOnly="expr" => elem.disabled = !!tag.result; vmrLite.classList.toggle(elem,'disabled',!!tag.result);

@method tagFns_disabled
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['disabled'] = function (tag, elem) {
    // Short for vm-class-required + input.disabled
    vmrLite.setClass(elem, 'disabled', !!tag.result);
    elem.disabled = !!tag.result;
};

/**
Set/Clear the elements required property AND style  (see tagFns for details).

vmr-required="expr" => elem.required = !!tag.result; vmrLite.classList.toggle(elem,'required',!!tag.result);

@method tagFns_required
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/


vmrLite.tagFns['required'] = function (tag, elem) {
    // Short for vm-class-required + input.required
    vmrLite.setClass(elem, 'required', !!tag.result);
    elem.required = !!tag.result;
};

/**
Set/Clear the elements selected property AND style  (see tagFns for details).

vmr-required="expr" => elem.selected = !!tag.result; vmrLite.classList.toggle(elem,'selected',!!tag.result);

@method tagFns_selected
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['selected'] = function (tag, elem) {
    elem.selected = !!tag.result;
    vmrLite.setClass(elem, 'selected', !!tag.result);
};

vmrLite.SUPPORTED_EVENTS_HASH = { 'onclick': true, 'onkeyup': true, 'onblur': true };

/*
Event handler, used by on-blur, If CR is pressed, call event targerts onblur function

@method tagFns_onEnterCallBlur
@protected
@static 
@param ev {Event} Event object
*/

vmrLite.onEnterCallBlur = function (ev) {
    if (ev.keyCode === 13) {
        if (ev.target.onblur) {
            ev.target.onblur(ev);
        }
    }

};

/**
Attach a event to the Element. tag.param is the event to. tag.result MUST be a function.
Automatically binds the function to the viewModelObj

vmr-in-param="expr" => elem['on'+param] = tag.result.bind(viewModelObj);

@method tagFns_on
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
@param viewModelObj {Object}  Outer object, used to bind the function to.
*/


vmrLite.tagFns['on'] = function (tag, elem, viewModelObj) {
    if (typeof tag.result  !== 'function') {
        console.error('vmrLite.tagFns not a function, for  on-' + tag.param + '=' + tag.value);
        return;
    }
    if (tag.param === 'blur') {
       // Special handling, if user presses enter, trigger a onblur.
        elem.onkeyup = vmrLite.onEnterCallBlur;
    }
    var on = 'on' + tag.param;
    vmrLite.SUPPORTED_EVENTS_HASH[on] = true; // Keep track of event types used.
    // console.log(on+' set');
    elem[on] = tag.result.bind(viewModelObj);
};

/**
Attach a onClick event to the Element. Short/Alias for vm-on-click. See tagFns.on

@method tagFns_onclick
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
@param viewModelObj {Object}  Outer object, used to bind the function to.
*/

vmrLite.tagFns['onclick'] = function (tag, elem,  viewModelObj) {
    // short cut for vm-on-click
    tag.param = 'click';
    vmrLite.tagFns['on'](tag, elem, viewModelObj);
};

/**
Set focus to the Element. Focus is put back in the event queue, so render completes before focus,

vmr-focus="expr" => if ( result ) window.setTimeout( function() { elem.focus() }, 100 );

@method tagFns_focus
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['focus'] = function (tag, elem) {
    // Set focus to this control.
    if (tag.result) {
        // Implied it should be visible. to set focus
        if (elem.style.display.toLowerCase() === 'none') {
            elem.style.display = '';
        }
        // More efficient to set timeout for focus change, to enable the UI to catch up
        // i.e. the focus gets put into the queue
        window.setTimeout(function () { elem.focus(); }, 100);

    }
};


vmrLite.tagFns['container'] = function () {}; // noop operator.

/**
Sync a table elements, td/th column widths with its parent, previous-sibling table.
Use to sync a scrolling table, contained within a div, with a separate table containing the column headings.

Action is perform AFTER full render is complete, as table may not yet contain data.

Elem is assumed to be the scrolling table.
Elem.parent is assumed to be the containing scrollable div.
Elem.parent.previousElementSibling is assumed to be the header table to sync.

@method tagFns_synctdth
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns['synctdth'] = function (tag, elem) {
    // NOTE: !!! We need to sync widths LAST, after table has been rendered.
    vmrLite.afterRenderApply.push({ fn: vmrLite.tagFns['synctdth-after'], args: [tag, elem]});
};


/*
See synctdth for details.

This is the actual implementation for synctdth, called after render is complete.

@method tagFns.synctdth-after
@protected
@static 
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param bodyTable {Element} HTML element containing bodyTable tag
*/

vmrLite.tagFns['synctdth-after'] = function (tag, bodyTable) {
    var headerTable, bodyTd, headerTd,
        style, paddingLeft, paddingRight;
    // This is for syncing, the td/th widths. Between 2 seperate tables.
    // Where we have a separate tables for headings, and scrolling table body.
    // The layout assumed to be

    /*

     <!-- Heading -->
     <table class="vmr-table">
         <thead/tbody>
             <tr>
                 <th/td>Heading 1</th/td>
                 <th/td>Heading 2</th/td>
             </tr>
         </thead/tbody>
     </table>
     <!-- Scrolling Area -->
     <div class="vmr-scroll-outer">  <!-- Need div inline-block height :fixed here for IE to get scroll correct -->
     <!-- Inner Main Table -->
         <table class="vmr-table vmr-scroll" vmr-alignscroll="true">    //
             <tbody>
                 <tr>
                     <td>Col 1</td>
                     <td>Col 2</td>
                 </tr>
             </tbody>
     </div>
*/
    headerTable = bodyTable.parentElement.previousElementSibling;
    if (!headerTable) {
        vmrLite.log('vmrLite.tagFns[synctdth] cant find header table for ' + bodyTable);
        return;
    }
    //vmrLite.log('header=', headerTable)
    //vmrLite.log('body=', bodyTable)
    bodyTd = bodyTable.firstElementChild.firstElementChild; // get the <tr>
    while (bodyTd && bodyTd.style.display === 'none') {
        bodyTd = bodyTd.nextElementSibling;
    }
    if (!bodyTd) {
        vmrLite.log('vmrLite.tagFns[synctdth] cant find tr table for ' + bodyTable);
        return;
    }

    bodyTd = bodyTd.firstElementChild; // get td/th

    headerTd = headerTable.firstElementChild.firstElementChild;  // get the <tr>
    if (!headerTd) {
        vmrLite.log('vmrLite.tagFns[synctdth] cant find tr header table for ' + headerTable);
        return;
    }
    headerTd = headerTd.firstElementChild; // get td/th

    //vmrLite.log('headerTd=', headerTd)
    //vmrLite.log('bodyTd=', bodyTd)

    while (headerTd && bodyTd) {
        // offsetWidth does not seem to work in Chrome!!
        // Calculate by hand !!!
        style = window.getComputedStyle(bodyTd);
        paddingLeft = parseInt(style.paddingLeft, 10);
        if (isNaN(paddingLeft)) { paddingLeft = 0; }
        paddingRight = parseInt(style.paddingRight, 10);
        if (isNaN(paddingRight)) { paddingRight = 0; }

        headerTd.style.width = String(bodyTd.clientWidth - paddingLeft - paddingRight) + 'px';

        headerTd = headerTd.nextElementSibling;
        bodyTd = bodyTd.nextElementSibling;

    }

};

/*

Render child objects of an Element. (Internal Use)

@method renderChildren
@protected
@static 
@param elem {Element} Element to apply elem.children
@param withObj {Object}  Object to evaluate with (expression bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
*/


vmrLite.renderChildren = function (elem, withObj, viewModelObj, index) {
    var i,
        cElems = elem.children; // These are elements (NOT nodes)

    // NOTE: children may change as nodes added, by the render !!!
    // so dont cache the .length
    for (i = 0; i < cElems.length; i++) {
        vmrLite.renderElement(cElems.item(i), withObj, viewModelObj, index);
    }
};

/*

Render this Element. (Internal Use)

Child elements are rendered, unless element is itself a container for another rendered object.

@method renderElement
@protected
@static 
@param elem {Element} Element to render
@param withObj {Object}  Object to evaluate with (expression bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
*/


// Render this object(withObj), inside elem, and bind any events.
vmrLite.renderElement = function (elem, withObj, viewModelObj, index) {
    var aAttrs, attr, attrMatch,
        parseChildIst, parseChildren,
        i, tagFn, tag, attrValue;
    if (elem.jquery) { elem = elem.get(0); } // Want plain elem (not jQuery)

    parseChildren = !elem.getAttribute('vm-container'); // Don't go deeper if, this is another objects container !!

    if (!withObj) {
        elem.style.display = 'none';
        return;
    }


    // Want a DOM element not jQuery, for speed
    // vmrLite.log('render '+ elem.tagName );


    parseChildIst = (elem.tagName.toLowerCase() === 'select'); // Its a select, We need the options 1st.
    if (parseChildIst && parseChildren) { vmrLite.renderChildren(elem, withObj, viewModelObj, index); }

    // Mode, 0=process each
    //

    // Parse 'vm-each', each adds/deletes vm-with sibling nodes, (incl itself)
    // Messy bit is, vm-each injects vm-with at the same level in the dom, i.e. siblings

    if (elem.getAttribute('vm-each') && (index !== 0)) { // Don't render the each, if we specified an index
        index = elem.getAttribute('index');
        if (index && index !== '0') {
            console.error('Internal validation with each');
            return;
        }
        if (!vmrLite.buildEach(elem, withObj, viewModelObj, index)) {
            return; // No-elements nothing to do.
        }
        // Drop thru, and process the with.
        return; // vm-each special and is hidden.
    }
    // Process with
    attrValue = elem.getAttribute('vm-with');
    if (attrValue) {
        withObj = vmrLite.evalWith(attrValue, withObj, viewModelObj, index); // index is the parent index??
        // vmrLite.log('vm-with ' + attrValue + ' result= ' + JSON.stringify(withObj) );
        if (!withObj) {
            elem.style.display = 'none';
            return; // Object is null, return and DONT renderChildren
        }
        if (elem.style.display === 'none') {
            elem.style.display = '';
        }

        // If we have a "index", then with this index.
        index = elem.getAttribute('index'); // For use later
        if (index) {
            if (typeof index === 'string') { index = parseInt(index, 10); }
            if (Array.isArray(withObj)) {
                withObj = withObj[index];
            } else { // assume is .item(idx)
                withObj = withObj.item(index);
            }
        }
    }

    // process basic attributes, within the withObj.
    aAttrs = elem.attributes; // Below may add/remove attributes. DONT cache length !!!
    for (i = 0; i < aAttrs.length; i++) {
        attr = aAttrs.item(i);
        if (attr) {
            attrMatch = attr.name.match(/^vm-([^\-]*)-?(.*)/);
            if (attrMatch && (attrMatch[1] !== 'with') && (attrMatch[1] !== 'each') && (attrMatch[1] !== 'root')) {
                tag = {};
                tag.name = attrMatch[1];
                tag.param = attrMatch[2];
                tag.value = aAttrs.item(i).value;
                tag.result = vmrLite.evalWith(tag.value, withObj, viewModelObj, index);
                if (typeof tag.result === 'undefined') { tag.result = '(?)'; }
                if (typeof tag.result === 'function') { tag.result = tag.result.bind(viewModelObj); }

                tagFn = vmrLite.tagFns[tag.name];
                if (!tagFn) {
                    console.error('You have a typo with vm-' + tag.name + ' in ' + elem.tagName);
                    return;
                }
                tagFn(tag, elem, viewModelObj);
            }
        }
    }
    if (!parseChildIst && parseChildren) { vmrLite.renderChildren(elem, withObj, viewModelObj, index); }

};

/**

Render view Model to a container Element, (and its children) (The main function)

i.e View Model ===> DOM

@method render
@public
@static 
@param containerElement {Element} Root Element to render from
@param viewModelObj {Object}  Outer View object
*/

vmrLite.render = function (containerElement, viewModelObj) {
    var tag, after;
    vmrLite.afterRenderApply = []; // Array of { fn: function , args: argsArray } to call after render complete

    if (containerElement.jquery) { containerElement = containerElement.get(0); } // Want plain elem (not jQuery)
    // We dont process the containerElement, only the children
    if (!containerElement.getAttribute('vm-container')) { // No root tag, add one
        tag = viewModelObj.id;
        if (!tag) { tag = viewModelObj._id; }
        if (!tag) { tag = vmrLite.SEQ++; }
        containerElement.setAttribute('vm-container', String(tag));
    }
    if (!viewModelObj) {
        containerElement.style.display = 'none';
        return;
    }
    vmrLite.renderChildren(containerElement, viewModelObj, viewModelObj, null);

    while (vmrLite.afterRenderApply.length > 0) {
        after = vmrLite.afterRenderApply.pop();
        after.fn.apply(this, after.args);

    }
    vmrLite.afterRenderApply = []; // Reinit.
};

/*

Sync child input objects of an Element to a view model. (Internal Use)

@method syncChildren
@protected
@static 
@param elem {Element} Element to apply elem.children
@param withObj {Object}  Object to assign with (assignment bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
*/


vmrLite.syncChildren = function (elem, withObj, viewModelObj, index) {
    var i, cElems = elem.children; // These are elements (NOT nodes)
    // NOTE: children may change as nodes added/deleted, by the render !!!
    for (i = 0; i < cElems.length; i++) {
        vmrLite.syncElement(cElems.item(i), withObj, viewModelObj, index);
    }
};

/*

Sync input objects of an Element to a view model. (Internal Use)

@method syncChildren
@protected
@static 
@param elem {Element} Element to apply elem.children
@param withObj {Object}  Object to assign with (assignment bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
*/

vmrLite.syncElement = function (elem, withObj, viewModelObj, index) {
    var aAttrs, attr, i, attrValue, parseChildren,
        val, expr;

    parseChildren = !elem.getAttribute('vm-container'); // Dont go deeper if, this is another objects container !!

    if (elem.getAttribute('vm-each')) { return; }

    // Process with
    attrValue = elem.getAttribute('vm-with');
    if (attrValue) {
        // vmrLite.log('vm-with ' + index);
        withObj = vmrLite.evalWith(attrValue, withObj, viewModelObj, index); // index is the parent index??
        if (!withObj) { return; } // Object is null

        // If we have a "index", then with this index.
        index = elem.getAttribute('index');
        if (index) {
            if (typeof index === 'string') { index = parseInt(index, 10); }
            if (Array.isArray(withObj)) {
                withObj = withObj[index];
            } else { // assume is .item(idx)  TODO: try .data as next alternative.
                withObj = withObj.item(index);
            }
                
        }
    }
    // process  attributes, within the withObj.
    aAttrs = elem.attributes; // Below may add/remove attributes. DONT cache length !!!
    for (i = 0; i < aAttrs.length; i++) {
        attr = aAttrs.item(i);
        if (attr) {
            if (attr.name === 'vm-value') {
                val = elem.value;
                if (elem.type === 'checkbox') {  val = elem.checked; }
                expr = elem.getAttribute('vm-value');
                // vmrLite.log('ASSIGN ' + expr + ' <= ' + val);
                vmrLite.assignWith(val, expr, withObj, viewModelObj);

            }
        }
    }

    if (parseChildren) { vmrLite.syncChildren(elem, withObj, viewModelObj, index); }

};

/**

Sync view Model from container "input" Elements, (and its children) (The main function)

i.e DOM (input's) ===> View Model

@method sync
@public
@static 
@param viewModelObj {Object}  The View Model Object
@param containerElement
*/

vmrLite.sync = function (containerElement, viewModelObj) {
    if (containerElement.jquery) { containerElement = containerElement.get(0); } // Want plain elem (not jQuery)
    vmrLite.syncChildren(containerElement, viewModelObj, viewModelObj, null);

};



/*

Clear the elem.on events, on the element and those of the children.

BE TIDY. Call before Dom objects are deleted, to free/clear any references.

@method clearOnEventsElement
@protected
@static 
@param elem {Element} Element clear on events from
*/

vmrLite.clearOnEventsElement = function (elem) {
    var i, on, aAttrs, attr;

    // process  attributes, within the withObj.
    aAttrs = elem.attributes; // Below may add/remove attributes. DONT cache length !!!
    for (i = 0; i < aAttrs.length; i++) {
        attr = aAttrs.item(i);
        if (attr && !!attr.name.match(/^vm-on/) ) {
            for (on in vmrLite.SUPPORTED_EVENTS_HASH ) {
                // if ( elem[on] ) console.log(on+' clear');
                elem[on] = null;
            }
        }
    }

    vmrLite.clearOnEventsChildren(elem);

};

/*

Clear the on events, for children of the element

@method clearOnEventsChildren
@protected
@static 
@param elem {Element} Element clear on events from
*/

vmrLite.clearOnEventsChildren = function (elem) {
    var i, cElems = elem.children; // These are elements (NOT nodes)
    // NOTE: children may change as nodes added/deleted, by the render !!!
    for (i = 0; i < cElems.length; i++) {
        vmrLite.clearOnEventsElement(cElems.item(i));
    }
};

/**

Clear an Element. i.e. Set .innerHTML = '';
Also clears any events on element and children before clearing.

BE TIDY. Call to clear a node.

@method empty
@public
@static 
@param elem {Element} Element to clear/blank
*/

vmrLite.empty = function (containerElement) {
    if (containerElement.jquery) { containerElement = containerElement.get(0); } // Want plain elem (not jQuery)
    console.log('EMPTY ' + containerElement.id + ' ' + containerElement.href, containerElement);

    vmrLite.clearOnEventsElement(containerElement); // MS: BUG fix, was clearOnEventsChildren, BUT Need to clear the onEvent at this node.
    while (containerElement.firstChild) {
      containerElement.removeChild(containerElement.firstChild);
    }
    //containerElement.innerHTML = '';
};



/**

Show view in a Modal Dialogue.

Creates a new ShowModalViewModel, then calls its showModal(arugments)

=== NOTE: Only available if ShowModalVM.js included.

#### see also ShowModalViewModel

@method showModal
@static
@public
@param innerViewModel {Object} View model, to show within a modal dialogue.

*/

vmrLite.showModal = function (innerViewModel) {
  console.error('Please include vmrLite-ShowModal to enable.');
};



// Export vmrLite, if used via require
if (typeof module !== 'undefined') {
    module.exports = vmrLite;
}