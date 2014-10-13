vmrLite
===

# View Model Render Lite (vmrLite)

Render (associate) DOM elements with a JavaScript view model object. 
Designed for HTML5 browsers (i.e. IE10+)

Similar (sort of) to knockout. But much much simpler, and you control when to render/sync.

Use with requireLite to dynamically load js and (partial) html.

### Documented with jsdoc :-

Its documented, See .md OR on-line here [jsdoc vmrLite!](http://themuz.github.io/jsdoc/module-vmrLite.html).

### Samples :-

And samples basic and the standard "todo" app are here. [themuz GitHub io](http://themuz.github.io/).

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



---

vmrLite.triggerEvent(elem, etype, detail) 
-----------------------------
Trigger an event, e.g. 'click', 'close'. uses document.createEvent internally for compatibility.

**Parameters**

**elem**: HTMLElement, element that triggers the event. (i.e. will become events ev.target)

**etype**: String, event type to trigger. (e.g. click )

**detail**: Object, Object to pass to the event, (available within the event as detail (e.g ev.detail))

**Returns**: Boolean, result of elem.dispatchEvent(ev);

vmrLite.setClass (elem, className, setORclear) 
-----------------------------
Set/Clear the className base on parameters
USed as replacement for elem.classList.toggle as IE10 does not support the 2nd boolean parameter

**Parameters**

**elem**: HTMLElement, element set/clear class name from

**className**: String, className to set/clear

**setORclear**: Boolean, set (true), clear (false) the className


vmrLite.closestIndex (el) 
-----------------------------
Find the closest Element, up the DOM tree from el, with anattribute of index. and return its index (as a Number)

**Parameters**

**el**: Element, Element to search up from

**Returns**: Number, Value of 'index' attribute.

vmrLite.deleteEachElem(delElem) 
-----------------------------
Delete the row/element of a vmr-each, re-numbering child siblings, as we go.

Used for efficient rendering, Use where content main contains another view-models/html
i.e. Manually delete a repeating element, on behalf of the render

**Parameters**

**delElem**: Element, Element to delete (must contain the "index" attribute)


vmrLite.tagFns_base(tag, tag.name, tag.param, tag.value, tag.result, elem) 
-----------------------------
Perform the tag function. All tag functions have the same parameters

A tag is expressed as vmr-tagname-param="value-expr" in the html

**Parameters**

**tag**: Object, Details of the attribute tag. tag is expressed as vmr-tagname-param="value-expr"

**tag.name**: String, Tag Name

**tag.param**: String, Param (or blank string)

**tag.value**: String, The value-expr

**tag.result**: Object, Result of evaluating "value-expr"

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_html(tag, elem) 
-----------------------------
Set the innerHTML property of the element (see tagFns for details).

vmr-html="expr" => elem.innerHTML = tag.result

If the result is text, use vmr-text. as html is NOT escaped.

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_text(tag, elem) 
-----------------------------
Set the textContent property of the element (see tagFns for details)

vmr-text="expr" => elem.textContent = tag.result

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_id(tag, elem) 
-----------------------------
Set the id property of the element (see tagFns for details)

vmr-id="expr" => elem.id=tag.result

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_display(tag, elem) 
-----------------------------
Set/Clear the css style.display "none" property of the element (see tagFns for details).
if tag.result is truthy set to '' else 'none'.

vmr-display="expr" => elem.style.display = ( tag.result ? '' : 'none' );

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_value(tag, elem) 
-----------------------------
Set/Get the value property of the element (see tagFns for details).
If the element type is a 'checkbox' it sets checked based on result

vmr-value="expr" => elem.value=tag.result

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_class(tag, elem) 
-----------------------------
Set/clear the class defined by the tag parameter and truthy result value.

vmr-class-param="expr" => elem.classList.toggle(tag.param,!!tag.result)

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_style(tag, elem) 
-----------------------------
Set the elements style as defined by the tag parameter  (see tagFns for details).

vmr-style-param="expr" => elem.style[tag.param] = tag.result;

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_debug(tag, elem) 
-----------------------------
Dump a debug message the "tag.result" to the console,

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_readOnly(tag, elem) 
-----------------------------
Set/Clear the elements readOnly property AND style  (see tagFns for details).

vmr-readOnly="expr" => elem.readonly = !!tag.result; vmrLite.classList.toggle(elem,'readonly',!!tag.result);

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_disabled(tag, elem) 
-----------------------------
Set/Clear the elements disabled property AND style  (see tagFns for details).

vmr-readOnly="expr" => elem.disabled = !!tag.result; vmrLite.classList.toggle(elem,'disabled',!!tag.result);

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_required(tag, elem) 
-----------------------------
Set/Clear the elements required property AND style  (see tagFns for details).

vmr-required="expr" => elem.required = !!tag.result; vmrLite.classList.toggle(elem,'required',!!tag.result);

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_selected(tag, elem) 
-----------------------------
Set/Clear the elements selected property AND style  (see tagFns for details).

vmr-required="expr" => elem.selected = !!tag.result; vmrLite.classList.toggle(elem,'selected',!!tag.result);

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_on(tag, elem, viewModelObj) 
-----------------------------
Attach a event to the Element. tag.param is the event to. tag.result MUST be a function.
Automatically binds the function to the viewModelObj

vmr-in-param="expr" => elem['on'+param] = tag.result.bind(viewModelObj);

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag

**viewModelObj**: Object, Outer object, used to bind the function to.


vmrLite.tagFns_onclick(tag, elem, viewModelObj) 
-----------------------------
Attach a onClick event to the Element. Short/Alias for vm-on-click. See tagFns.on

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag

**viewModelObj**: Object, Outer object, used to bind the function to.


vmrLite.tagFns_focus(tag, elem) 
-----------------------------
Set focus to the Element. Focus is put back in the event queue, so render completes before focus,

vmr-focus="expr" => if ( result ) window.setTimeout( function() { elem.focus() }, 100 );

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.tagFns_synctdth(tag, elem) 
-----------------------------
Sync a table elements, td/th column widths with its parent, previous-sibling table.
Use to sync a scrolling table, contained within a div, with a separate table containing the column headings.

Action is perform AFTER full render is complete, as table may not yet contain data.

Elem is assumed to be the scrolling table.
Elem.parent is assumed to be the containing scrollable div.
Elem.parent.previousElementSibling is assumed to be the header table to sync.

**Parameters**

**tag**: Object, Details of the attribute tag/value/result (see tagFns for details)

**elem**: Element, HTML element containing attribute tag


vmrLite.render(containerElement, viewModelObj) 
-----------------------------
Render view Model to a container Element, (and its children) (The main function)

i.e View Model ===> DOM

**Parameters**

**containerElement**: Element, Root Element to render from

**viewModelObj**: Object, Outer View object


vmrLite.sync(viewModelObj, containerElement) 
-----------------------------
Sync view Model from container "input" Elements, (and its children) (The main function)

i.e DOM (input's) ===> View Model

**Parameters**

**viewModelObj**: Object, The View Model Object

**containerElement**: Sync view Model from container "input" Elements, (and its children) (The main function)

i.e DOM (input's) ===> View Model


vmrLite.empty(elem) 
-----------------------------
Clear an Element. i.e. Set .innerHTML = '';
Also clears any events on element and children before clearing.

BE TIDY. Call to clear a node.

**Parameters**

**elem**: Element, Element to clear/blank


vmrLite.showModal(innerViewModel) 
-----------------------------
Show view in a Modal Dialogue.

Creates a new ShowModalViewModel, then calls its showModal(arugments)

=== NOTE: Only available if ShowModalVM.js included.

#### see also ShowModalViewModel

**Parameters**

**innerViewModel**: Object, View model, to show within a modal dialogue.



---








