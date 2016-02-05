### Render Object (View Model) within a html element.

Render (associate) DOM elements with a JavaScript (view model) object. 
Rendering is controlled by special attribute tags within the html.

Similar in principle to knockout, but simpler plus you control when to render/sync.


#### Documentation :-

See this README.md OR jsdoc on-line here [jsdoc vmrLite!](http://themuz.github.io/jsdoc/module-vmrLite.html).

Also see the related project [themuz/requireLite](https://github.com/themuz/requireLite).

#### Samples :-

Basic samples and the standard "todo" app are here. [themuz GitHub io](http://themuz.github.io/).

For a sample Base Class using vmrLite check out VMRBase.js

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
