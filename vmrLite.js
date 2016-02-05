/* jshint globalstrict: true */
"use strict";

/* global window, console, document, module */

/**

### Render Object (View Model) within a html element.

Render (associate) DOM elements with a JavaScript (view model) object. 
Rendering is controlled by special attribute tags within the html.

Similar in principle to knockout, but simpler plus you control when to render/sync.

#### Documented with jsdoc :-

Its documented, See .md OR on-line here [jsdoc vmrLite!](http://themuz.github.io/jsdoc/module-vmrLite.html).

#### Samples :-

And samples basic and the standard "todo" app are here. [themuz GitHub io](http://themuz.github.io/).

#### Features :-

- lightweight
- js loaded using module pattern.
- render (display) information from a JS Object within a DOM Tree
- sync input elements back
- supports repeating elements (e.g arrays) (see vm-each) to clone/create dom nodes.
- include in your page. or load as a AMD module (see require.js)
- NO dependencies. 
- Add your own DOM extensions. 
- sync/render when you want (NOT when framework thinks you should)
- on-events read as if the old way. eventListeners are handed for you.

#### Available Attributes at each DOM Element. 

vmrLite uses special attributes prefixed with "vm" (view model) to control dom/js mapping.
The attributes value represent an expression (typically just a property) of the object to evaluate. 

Below are the core/common items (vm-tagname) attributes

- **text** - Bind to the elements.textContent to the specified object
- **html** - Bind to the elements.innerHTML
- **each** - Clone DOM element for each, corresponding array-like JS object
- **with** - Sub-Elements are evaluated within (i.e. with) this object
- **class**-_name_ - Set/Unset Elements css class (based on truthy result of value-exp).
- **id** - Bind to element.id
- **display** - Set/Clear a elements.style.display based of truthy value-exp  (i.e. sets to none if expression falsy)
- **onclick** - Link a click event to function call, all functions are bind'ed to the view model and receive the event object as a parameter
- **on**-_type_ - Link a event of "type" to a function (e.g. vm-onclick === vm-on-click )
- **attr**-_name_ - Set the attribute _name_ to result of value-exp
- **data**-_name_ - Set the data-_name_ attribute to result of value-exp
- **debug** - Dump a debug message, console.log the value-exp result.
- **disabled** - Set/Clear the elements disabled property AND css-class, based on truthy of value-exp 
- **readonly** - Set/Clear the elements readonly property AND css-class, based on truthy of value-exp 
- **required** - Set/Clear the elements required property AND css-class, based on truthy of value-exp 
- **selected** - Set/Clear the elements selected property AND css-class, based on truthy of value-exp 
- **more** - For full details, see the documentation (or read the code, its only ~100 lines!!)
- **custom** - Add your own. Just create a function. e.g `vmrLite.tagFns['myslide'] = function (tag,elem,viewModel) { ... }`

#### Expression Evaluation

within each vm-tagname-param="value-exp", the following free are variables available.
and value expression is evaluated  with the variables "root" and "this" properties exposed directly (within a with statement)

- **root** - The "root" View Model (previously named "vm")
- **this** - The object within the vm-with/vm-each (same as root for top level)
- **index** - null or index (0 based) of the item within a vm-each item.

Examples.

    <span vm-text="name"></span>
    <span vm-text="'The name is' + this.name + '.'"></span>
    <span vm-text="'At the top level vm and this are the same ' + root.name + '.'"></span>

#### vm tag naming

the vm-tags are made up of two parts as vm-tagname-param where

- tagname - is the action to perform e.g. (on/attr)
- param - optional, param for the action, the actual meaning depends on the tag (e.g. vm-on-click="function", vm-attr-required="expr")

#### Usage Render (ViewModel => DOM)

    vmrLite.render(containerElement, viewModelObj);

#### Usage Sync (DOM Input elements => ViewModel)

    vmrLite.sync(containerElement, viewModelObj);

#### Example

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
        this.open = function(container) { 
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
        (new TicketsViewModel()).open(document.getElementById('ticketsView'));
    </script>

#### Change log

    2016-02-04 renamed the free variable (with expression evaluation) from "vm" -> "root"
    2016-02-04 removed module.__dirname as in-consistent with CommonJS (use require.cwd as a replacement)

#### TODO
- Enhance evalWith, to look for plain properties, before using the more complex evaluation using "new Function"

@module vmrLite

*/


// get Element by ID, (use bind incase properties called window/document).
var $eid = function (id) { return this.getElementById(id); }.bind(window.document);

var vmrLite = {};

if (!String.prototype.compare) {
    String.prototype.compare = function (b) { return (this < b) ? -1 : (this === b) ? 0 : 1; };
}


/*

Class name for the object

@field
@memberof module:vmrLite
@type String
@default "vmrLite"

*/

vmrLite.className = 'vmrLite';


/**


Version of the library

@field
@memberof module:vmrLite
@type String
@default "0.4"

*/

vmrLite.version = '0.4';

/*

Simple sequence number, used to allocate unique id's.

@field
@memberof module:vmrLite
@type Number
@default "getTime() % 16777215"


*/

vmrLite.SEQ = (new Date()).getTime() % 16777215;


/**

 Helper.  Trigger an event, e.g. 'click', 'close'. uses document.createEvent internally for compatibility.

@function
@memberof module:vmrLite
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
    // Without IE9/10 support.
    // return elem.dispatchEvent(new CustomEvent(etype, { bubbles: true, cancelable: true, detail: detail } ));
};

/**
 Helper.  Set/Clear the className base on parameters
Used as replacement for elem.classList.toggle as IE10/11 does not support the 2nd boolean parameter

@function
@memberof module:vmrLite
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

@function
@memberof module:vmrLite
@protected
@param expr {String}  String to evaluate
@param withObj {Object}  Object to evaluate with (expression bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
@return {Object} result of evaluation.

*/

vmrLite.evalWith = function (expr, withObj, viewModelObj, index) {
    var fn,retval,thisObj,thisExpr;
    // return withObj[expr];
    // 2016-01-20 Renamed "vm" to "root" as more of a generic name 
    fn = new Function(['root', 'index'], 'with ( root ) { with ( this ) { return ' + expr + ' }}' );
    try {
        retval = fn.call(withObj, viewModelObj, index);
        if ( typeof(retval) === 'function' ) {
            // 2016-01-20 Bind the function to its "this" object (or this==withObj), Was by default bound to the viewModelObj
            // If not explicitly defined. Assume is the viewModelObj (or this==withObj)
            thisObj = viewModelObj;
            thisExpr = expr.replace(/\.[^\.]*$/,''); // this.fname => this 
            if ( thisExpr != expr ) { 
                // We do a an expression of the form "object.fname" 
                thisObj = vmrLite.evalWith(thisExpr,withObj,viewModelObj,index);
            }
            retval = retval.bind( thisObj );
        }
        if (retval && retval.toISOString) { retval = vmrLite.stripZeroTime(retval.toISOString()); }

        return retval;
    } catch (ex) {
        console.error(' vmrLite.evalWith( "' + expr + '") ' + ex.message );
        // HACK create object
        withObj[expr] = null;
        return null; // '(exception)'

    }
};

/*
Assign "value" to the "expr" within scope of withObj and viewModel.

@function
@memberof module:vmrLite
@protected
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
        console.log('Exception with "' + expr + '"');
        throw ex;

    }
};


/**
 Helper.  Find the closest Element, up the DOM tree from el, with anattribute of index. and return its index (as a Number)

@function
@memberof module:vmrLite
@param elem {HTMLElement}  
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
 Helper.  Delete the row/element of a vm-each, re-numbering child siblings, as we go.

Used for Manually rendering, Use where content main contains another view-models/html
i.e. Manually delete a repeating element, on behalf of the render

@function
@memberof module:vmrLite
@param delElem {Element} Element to delete (must contain the "index" attribute)
*/

vmrLite.deleteEachElem = function (delElem) {
    var index, nextElem;
    if (delElem.jquery) { delElem = delElem.get(0); } // Want plain elem (not jQuery)

    index = delElem.getAttribute('index');
    console.log('vmrLite.deleteEachElem ', index);
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
Build the each, adding clones of the vm-each element. as siblings.

TODO: If each has an "id" attribute method, use that to re-render via moving DOM elements
rather than replacing the content. (note use an algorithm that swaps dom elements, so if list
is ordered then reversed this is efficient)
TODO: If a repeating options (within a select), use v0.1 implementation and don't hide/reserve the vm-each element.

@function
@memberof module:vmrLite
@param elem {Element}  HTML Element with the vm-each tag.
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
    // console.log('vm-each ' + elem.tagName + '-' + eachExpr );

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
    // console.log('vm-each ' + elem.get(0).tagName + '-' + eachExpr + ' len='+len);
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
        // console.log('DELETE');
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

/**
Hash of available tag functions.

@field
@memberof module:vmrLite
@type Object

*/

vmrLite.tagFns = {};

/**
Perform the tag function. All tag functions have the same parameters

A tag is expressed as vm-tagname-param="value-expr" in the html

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag. tag is expressed as vm-tagname-param="value-expr"
@param tag.name {String} Tag Name 
@param tag.param {String} Param (or blank string)
@param tag.value {String} The value-expr
@param tag.result {Object} Result of evaluating "value-expr"
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.base = function (tag, elem) {}; // noop operator.

/**
Set the innerHTML property of the element (see tagFns for details).

vm-html="expr" => elem.innerHTML = tag.result

If the result is text, use vm-text. as html is NOT escaped.

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag

*/
vmrLite.tagFns.html = function (tag, elem) {
    elem.innerHTML = tag.result;
};


/**
Set the textContent property of the element (see tagFns for details)

vm-text="expr" => elem.textContent = tag.result

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/
vmrLite.tagFns.text = function (tag, elem) {
    elem.textContent = tag.result; // (IE=innerText) IE9+ ok
};

/**
Set the attribute "title"

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.title = function (tag, elem) {
    elem.setAttribute('title', tag.result);
};

/**
Set the textContent property of the element with non-breaking spaces.


@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/
vmrLite.tagFns.nbtext = function (tag, elem) {
    elem.textContent = String(tag.result).
        replace(/\-/g,'\u2011').
        replace(/\ /g,'\u00A0');
};


/**
Set the id property of the element (see tagFns for details)

vm-id="expr" => elem.id=tag.result

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.id = function (tag, elem) {
    elem.id = tag.result;
};

/**
Set/Clear the css style.display "none" property of the element (see tagFns for details).
if tag.result is truthy set to '' else 'none'.

vm-display="expr" => elem.style.display = ( tag.result ? '' : 'none' );

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/


vmrLite.tagFns.display = function (tag, elem) {
    elem.style.display = (tag.result ? '' : 'none');
};


/**
Set/Get the value property of the element (see tagFns for details).

If the element type is a 'checkbox' it sets checked based on truthy result of value-exp.
If the element type is a 'radio' it sets checked based on  ( value-exp == radio button value attribute).

vm-value="expr" => elem.value=tag.result

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/
vmrLite.tagFns.value = function (tag, elem) {
    if (elem.type === 'checkbox') {
        elem.checked = !!tag.result;
    } else if (elem.type === 'radio') {
        elem.checked = ( tag.result == elem.value );
    } else {
        elem.value = tag.result;
    }
};

/**
Set/clear the class defined by the tag parameter and truthy result value.

vm-class-param="expr" => elem.classList.toggle(tag.param,!!tag.result)

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.class = function (tag, elem) {
    vmrLite.setClass(elem, tag.param, !!tag.result);
    //vmrLite.classList.toggle(elem,tag.param,!!tag.result); // Not support IE 10 !!
};

/**
Set the elements style as defined by the tag parameter  (see tagFns for details).

vm-style-param="expr" => elem.style[tag.param] = tag.result;

e.g vm-style-width="this.boxWidth()"

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag

NOTE ISSUE with chrome, it converts vm-attribute names to lowercase !!!
*/

vmrLite.tagFns.style = function (tag, elem) {
    if ( tag.param=='background-color')
        tag.param='backgroundColor';
    elem.style[tag.param] = tag.result;
};

/**
Set the elements attribute as defined by the tag parameter  (see tagFns for details).

vm-attr-param="expr" => elem.setAttribute(tag.param,tag.result);

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag

*/

vmrLite.tagFns.attr = function (tag, elem) {
    elem.setAttribute(tag.param,tag.result);
};

/**
Set the elements dataset/data-attribute as defined by the tag parameter  (see tagFns for details).

NOTE: setAttribute (vs dataset) is used internally since faster in IE !!. 

vm-attr-param="expr" => elem.setAttribute('data-'+tag.param,tag.result);

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag

*/

vmrLite.tagFns.data = function (tag, elem) {
    elem.setAttribute('data-'+tag.param,tag.result);
};

/**
Dump a debug message the "tag.result" to the console, 


@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/
vmrLite.tagFns.debug = function (tag, elem) {
    console.log('debug:' + tag.result);
    elem.setAttribute('debug', tag.result);
};
/**
Set/Clear the elements readonly property AND css class  (see tagFns for details).

vm-readOnly="expr" => elem.readonly = !!tag.result; vmrLite.classList.toggle(elem,'readonly',!!tag.result);

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.readonly = function (tag, elem) {
    // Short for vm-class-required + input.disabled
    vmrLite.setClass(elem, 'readonly', !!tag.result);
    // vmrLite.classList_toggle(elem,'readOnly',!!tag.result);
    elem.readonly = !!tag.result;
};

/**
Set/Clear the elements disabled property AND css class  (see tagFns for details).

vm-readOnly="expr" => elem.disabled = !!tag.result; vmrLite.classList.toggle(elem,'disabled',!!tag.result);

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.disabled = function (tag, elem) {
    // Short for vm-class-required + input.disabled
    vmrLite.setClass(elem, 'disabled', !!tag.result);
    elem.disabled = !!tag.result;
};

/**
Set/Clear the elements required property AND css class  (see tagFns for details).

vm-required="expr" => elem.required = !!tag.result; vmrLite.classList.toggle(elem,'required',!!tag.result);

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/


vmrLite.tagFns.required = function (tag, elem) {
    // Short for vm-class-required + input.required
    vmrLite.setClass(elem, 'required', !!tag.result);
    elem.required = !!tag.result;
};

/**
Set/Clear the elements selected property AND css class  (see tagFns for details).

vm-required="expr" => elem.selected = !!tag.result; vmrLite.classList.toggle(elem,'selected',!!tag.result);

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.selected = function (tag, elem) {
    elem.selected = !!tag.result;
    vmrLite.setClass(elem, 'selected', !!tag.result);
};

vmrLite.SUPPORTED_EVENTS_HASH = { 'onclick': true, 'onkeyup': true, 'onblur': true };

/*
Event handler, used by on-blur, If CR is pressed, call event targerts onblur function
which will inturn call onchange.

@function
@memberof module:vmrLite
@protected
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

vm-in-param="expr" => elem['on'+param] = tag.result.bind(viewModelObj);

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
@param viewModelObj {Object}  Outer object, used to bind the function to.
*/


vmrLite.tagFns.on = function (tag, elem) {
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
    elem[on] = tag.result;
};

/**
Attach a onClick event to the Element. Short/Alias for vm-on-click. See tagFns.on

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
@param viewModelObj {Object}  Outer object, used to bind the function to.
*/

vmrLite.tagFns.onclick = function (tag, elem) {
    // short cut for vm-on-click
    tag.param = 'click';
    vmrLite.tagFns.on(tag, elem);
};

/**
Set focus to the Element. Focus is put back in the event queue, so render completes before focus,

vm-focus="expr" => if ( result ) window.setTimeout( function() { elem.focus() }, 100 );

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.focus = function (tag, elem) {
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


vmrLite.tagFns.container = function () {}; // noop operator.

/**
Sync a table elements, td/th column widths with its parent, previous-sibling table.
Use to sync a scrolling table, contained within a div, with a separate table containing the column headings.

Action is perform AFTER full render is complete, as table may not yet contain data.

Elem is assumed to be the scrolling table.
Elem.parent is assumed to be the containing scrollable div.
Elem.parent.previousElementSibling is assumed to be the header table to sync.

@function
@memberof module:vmrLite
@protected
@param tag {Object} Details of the attribute tag/value/result (see tagFns for details)
@param elem {Element} HTML element containing attribute tag
*/

vmrLite.tagFns.synctdth = function (tag, elem) {
    // NOTE: !!! We need to sync widths LAST, after table has been rendered.
    vmrLite.afterRenderApply.push({ fn: vmrLite.tagFns['synctdth-after'], args: [tag, elem]});
};


/*
See synctdth for details.

This is the actual implementation for synctdth, called after render is complete.

@function
@memberof module:vmrLite
@protected
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
     <table class="vm-table">
         <thead/tbody>
             <tr>
                 <th/td>Heading 1</th/td>
                 <th/td>Heading 2</th/td>
             </tr>
         </thead/tbody>
     </table>
     <!-- Scrolling Area -->
     <div class="vm-scroll-outer">  <!-- Need div inline-block height :fixed here for IE to get scroll correct -->
     <!-- Inner Main Table -->
         <table class="vm-table vm-scroll" vm-alignscroll="true">    //
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
        console.log('vmrLite.tagFns[synctdth] cant find header table for ' + bodyTable);
        return;
    }
    //console.log('header=', headerTable)
    //console.log('body=', bodyTable)
    bodyTd = bodyTable.firstElementChild.firstElementChild; // get the <tr>
    while (bodyTd && bodyTd.style.display === 'none') {
        bodyTd = bodyTd.nextElementSibling;
    }
    if (!bodyTd) {
        console.log('vmrLite.tagFns[synctdth] cant find tr table for ' + bodyTable);
        return;
    }

    bodyTd = bodyTd.firstElementChild; // get td/th

    headerTd = headerTable.firstElementChild.firstElementChild;  // get the <tr>
    if (!headerTd) {
        console.log('vmrLite.tagFns[synctdth] cant find tr header table for ' + headerTable);
        return;
    }
    headerTd = headerTd.firstElementChild; // get td/th

    //console.log('headerTd=', headerTd)
    //console.log('bodyTd=', bodyTd)

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

@function
@memberof module:vmrLite
@protected
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


/**

 Helper.  Strip the trailing 00's from a DateTime ISO String   (Internal Use)

@function
@memberof module:vmrLite
@param str {String} String to strip

*/


vmrLite.stripZeroTime = function (str) {
  if ( !str ) return str;
  return str.replace(/T00\:00\:00.000Z|\:00\.000Z|\.000Z/,'');
};

/*

Render this Element. (Internal Use)

Child elements are rendered, unless element is itself a container for another rendered object.

@function
@memberof module:vmrLite
@protected
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

    var vmID = elem.getAttribute('vm-container'); 
    // Don't go deeper if, this is another objects container !! but DO if me.
    // MS: 2015-03-11 bug fix. If optimize and render same object
    // on a inner element (for speed) it will get a vm-container as well.
    // FOr this to work OK. the view model mus have a ".id" or "._id" property.

    parseChildren = (( vmID == null )  || ( vmID == viewModelObj.id ) || ( vmID == viewModelObj._id ));

    if (!withObj) {
        elem.style.display = 'none';
        return;
    }


    // Want a DOM element not jQuery, for speed
    // console.log('render '+ elem.tagName );


    parseChildIst = (elem.tagName.toLowerCase() === 'select'); // Its a select, We need the options 1st.
    if (parseChildIst && parseChildren) { vmrLite.renderChildren(elem, withObj, viewModelObj, index); }

    // Mode, 0=process each
    //

    // Parse 'vm-each', each adds/deletes vm-with sibling nodes, (incl itself)
    // Messy bit is, vm-each injects vm-with at the same level in the dom, i.e. siblings

    // if (elem.getAttribute('vm-each') && (index !== 0)) { // Don't render the each, if we specified an index
    if (elem.getAttribute('vm-each')) { // Don't render the each, if we specified an index
        // index = elem.getAttribute('index');
        // if (index && index !== '0') {
        //    console.error('Internal validation with each');
        //    return;
        // }
        if (!vmrLite.buildEach(elem, withObj, viewModelObj, index)) {
            return; // No-elements nothing to do.
        }
        // Drop thru, and process the with.
        return; // vm-each special and is ALWAYS hidden return. vm-withs will of been created.
    }
    // Process with
    attrValue = elem.getAttribute('vm-with');
    if (attrValue) {
        withObj = vmrLite.evalWith(attrValue, withObj, viewModelObj, index); // index is the parent index??
        // console.log('vm-with ' + attrValue + ' result= ' + JSON.stringify(withObj) );
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
                // 2016-01-03 bug fix, as double wrapping and should be bound to withObj (not viewModelObj)
                // 2016-01-16 Change back to view model. As event function should be defined at the view model level..
                // 2016-01-20 Moved bind. to the evalWith. and changed back to use the withObj

                tagFn = vmrLite.tagFns[tag.name];
                if (!tagFn) {
                    console.error('You have a typo with vm-' + tag.name + ' in ' + elem.tagName);
                    return;
                }
                tagFn(tag, elem);
            }
        }
    }
    if (!parseChildIst && parseChildren) { vmrLite.renderChildren(elem, withObj, viewModelObj, index); }

};

/**

Render view Model to a container Element, (and its children) (The main function)

i.e View Model ===> DOM

@function
@memberof module:vmrLite
@param containerElement {Element} Root Element to render from
@param viewModelObj {Object}  Outer View Model object
*/

vmrLite.render = function (containerElement, viewModelObj) {
    var tag, after, vmID;
    vmrLite.afterRenderApply = []; // Array of { fn: function , args: argsArray } to call after render complete
    // console.log('render ' + containerElement.id );

    if (containerElement.jquery) { containerElement = containerElement.get(0); } // Want plain elem (not jQuery)

    if (!viewModelObj) {
        containerElement.style.display = 'none';
        return;
    }    

    vmID = containerElement.getAttribute('vm-container'); 
    // This is the main render call, (or a inner call called manually to optimize rendering). 
    // vmID MUST match the viewModelObj.id/_id
    if ( !vmID || (( vmID != viewModelObj.id ) && ( vmID != viewModelObj._id ))) {
        // Update id. As application has explicitley rendered here !!
        // This may be another id, from the app cloning elements, or app changing id of the view-model object.
        // NOTE: To stop an outer view model, from attempting to render a inner Viewmodel set vm-container="" on the inner
        vmID = viewModelObj.id;
        if (!vmID) {
            vmID = viewModelObj._id; 
            if (!vmID) {
                vmID = vmrLite.SEQ++; 
                viewModelObj._id = vmID;
            }
        }
        containerElement.setAttribute('vm-container', String(vmID));        
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

@function
@memberof module:vmrLite
@protected
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

Sync input objects of an Element to a view model. (Internal Use).

Note for a radio button, If NO items are checked the vm's value is not changed.

@function
@memberof module:vmrLite
@protected
@param elem {Element} Element to apply elem.children
@param withObj {Object}  Object to assign with (assignment bound to this)
@param viewModelObj {Object}  Outer object, may be same as withObj
@param index {Number} If withObj is the Object within an array index is the index.
*/

vmrLite.syncElement = function (elem, withObj, viewModelObj, index) {
    var aAttrs, attr, i, attrValue, parseChildren,
        val, expr;

    var vmID = elem.getAttribute('vm-container'); 
    // Don't go deeper if, this is another objects container !! but DO if me.
    // MS: 2015-03-11 bug fix. If optimize and render same object
    // on a inner element (for speed) it will get a vm-container as well.
    // FOr this to work OK. the view model mus have a ".id" or "._id" property.
    parseChildren = (( vmID === null )  || ( vmID == viewModelObj.id ) || ( vmID == viewModelObj._id ));

    if (elem.getAttribute('vm-each')) { return; }

    // Process with
    attrValue = elem.getAttribute('vm-with');
    if (attrValue) {
        // console.log('vm-with ' + index);
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
                val = elem.value; // By default, use its value. 
                if ( elem.type === 'checkbox' ) {  
                    if ( !elem.checked ) val = null; // Not checked, value is null.
                } else if ( elem.type === 'radio' ) {  
                    // todo: bug fix, if NO items are checked val should be nil. (not left unassigned)
                    if ( !elem.checked ) val = undefined; // Not checked, value is undefined
                }
                expr = elem.getAttribute('vm-value');
                if ( typeof(val) != 'undefined' )
                    vmrLite.assignWith(val, expr, withObj, viewModelObj);

            }
        }
    }

    if (parseChildren) { vmrLite.syncChildren(elem, withObj, viewModelObj, index); }

};

/**

Sync view Model from container "input" Elements, (and its children) (The main function)

i.e DOM (input's) ===> View Model

@function
@memberof module:vmrLite
@param containerElement {Element} Root Element to sync from
@param viewModelObj {Object}  Outer View Model object
*/

vmrLite.sync = function (containerElement, viewModelObj) {
    if (containerElement.jquery) { containerElement = containerElement.get(0); } // Want plain elem (not jQuery)
    vmrLite.syncChildren(containerElement, viewModelObj, viewModelObj, null);

};



/**

 Helper.  Clear the elem.on events, on the element and those of the children.

Call to free/clear any references from Dom nodes to your fns. 
Alternatively use vmrLite.clear.

@function
@memberof module:vmrLite
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

 Helper.  Clear the on events, for children of the element

@function
@memberof module:vmrLite
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

 Helper.  Clear an Element. i.e. Set .innerHTML = '';
Also clears any events on element and children before clearing.
See also clearOnEventsChildren

Call to free/clear any references from Dom nodes to your fns. 

@function
@memberof module:vmrLite
@param elem {Element} Element to clear/blank
*/

vmrLite.empty = function (containerElement) {
    if (containerElement.jquery) { containerElement = containerElement.get(0); } // Want plain elem (not jQuery)
    // console.log('EMPTY ' + containerElement.id + ' ' + containerElement.href, containerElement);

    vmrLite.clearOnEventsChildren(containerElement); // MS: BUG fix, was clearOnEventsChildren, BUT Need to clear the onEvent at this node. 
    // MS: Changed back, Dont think on review you should call clearOnEventsElement as we dont render the container div. Only the children !!
    while (containerElement.firstChild) {
      containerElement.removeChild(containerElement.firstChild);
    }
    //containerElement.innerHTML = '';
};



if (typeof(module) !== 'undefined') {
    module.exports = vmrLite;
}
