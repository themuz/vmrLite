"use strict";

/**

### Client (Browser) Implementation of require/CommonJS loader 

Browser/client emulation of CommonJS/node-js's syncronous module loader (require) library.

With a Lite KISS (Keep It Simple Stupid) approach

See nodejs's module loader for background information. (https://nodejs.org/docs/latest/api/modules.html#modules_the_module_object)

#### Supports js,css,html and json loadng.

#### Documented with jsdoc :-

Its documented, See .md OR on-line here [jsdoc requireLite!](http://themuz.github.io/jsdoc/module-requireLite.html).

#### Samples :-

And samples basic and the standard "todo" app are here. [themuz GitHub io](http://themuz.github.io/).


#### Features :-
- *cache* - Modules are cached after the first time they are loaded
- *sync* - synchronous (i.e wait) by default like nodejs, Make code/dependancies simple/managable.
- *async* - Async with callback, if you must. 
- *module* - In each module, the "module" free variable is a reference to the object representing the current module being loaded.
- *module.exports* - The object assigned to module.exports will be the require of the requireLite call.
- *not just js* - In addition json/css/html is also supported !!
- *encapsulated* - js is encapsulated in the module pattern, no namespace/global pollution. i.e. Variables local to the module will be private
- *no dependancies* 

#### Other file types :=

- *json support* - If the url extension is '.json' json will be loaded, and parsed (JSON.parse) and object returned.
- *css support* - If the url extension is '.css', css will be automatically loaded as a window.document.head.link and link's DOM-Element returned. 
- *html support* - If the url extension is '.html' the html will be loaded into a div and div's html-Element returned. 

#### Usage

    var loadedObject = require(url,[callback]);

loadedObject is whatever is returned by the js, by assigning to module.exports (see below)

#### JS Modules (.js)

In each js module the "module" free variable is a reference to the object representing the current module.

The *module* variable has the following attributes :-

- exports - Object - The object/function being/to-be exported. Assign to module.exports to return your loadedObject. (initalized to {})
- id - String - The identifier assigned to the module
- filename - String - The pathname/url to the module. (e.g. /js/modules/Circle.js)
- loaded - Boolean - Whether or not the module is done loading, or is in the process of loading

In addition the "exports" free variable is also available, corresponds to module.exports and initialized to {}. 
If you use the "exports" variable, only defined new properties/methods. 
Don't assign to it, as will be lost. If you wish to return
just an object assign to "module.exports" instead.

#### Deferred loading.

If you wich to defer loading dependent modules to run-time (vs load-time) ensure you save/use the 
requireLite.cwd (Current working directory) property, since the cwd may differ at run-time. 
Use this variable when loading modules at run-time.

e.g

    function MyModule() { etc ... }    

    MyModule.cwd = require.cwd || ''; // This allows js compatability with node-js or browser 

    MyModule.doitlater = function() {
        defered_module_loaded=require(MyModule.cwd + './deferred_module.js')
    }


#### Isnt sync slow, with lots of http requests.

NO, Not if  all modules are pre-loaded (as we should do in production mode for performance)
The require is immediate, why code for complex dependancies/async code when not needed.

In fact if we can pre load the modules FASTER, i.e. in parallel (subject to dependancies)

This pre-loading is my next project, See below the TODO list.


#### Example Module (circle.js)

    var PI = Math.PI;
    var Circle={}; 

    Circle.area = function (r) {
      return PI * r * r;
    };

    Circle.circumference = function (r) {
      return 2 * PI * r;
    };

    // we could of use the free var "exports" instead of Circle in this example.
    // in which case the below statement, is not required (i.e exports === module.exports)
    module.exports = Circle; 


#### Example Usage  (async)

    var  Circle=require('./lib/circle.js');
    alert('The are of a 1" circle is ' + Circle.area(1) + '"')

#### Example Usage  (async)

    require('./lib/circle.js', function(circle) {
      // Do stuff with the "circle", now its loaded   
    });

#### Change log

    2016-02-04 rename module.__filename -> filename, __id -> id for consistency with CommonJS/node-js
    2016-02-04 removed module.__dirname as in-consistent with CommonJS (use require.cwd as a replacement)


#### TODO:-
- Ability to place the app in dev mode, build up the modules/depencancies by running the application. 
- Tool to wrap all modules, with dependancies into a single unit for production use.
- Handle cyclic references e.g. A requires B that requires A
- if Async scan the js code for require('module.js' .. and load that async 1st.

@module requireLite

*/

/* global window, console, document, XMLHttpRequest, module */


/**

@function requireLite
@static
@public
@param url {String} url to load. Paths should be relative to current module.
@param callback {Function} OPTIONAL Callback function, to enable async call, parameter passed is value of module.exports 
@return {null|Object} null if async, value of module.exports if sync.

*/

function requireLite(url, callback) {
    var splitPath;

    if ( url.search(/^https?:/) === 0 ) {
        // Explicit path. To another domain.
        // Do nothing
    } else {
        if (url.search(/\.json|\.js|\.htm|\.css/) < 0) {
            // No extension, add in the default. 
            url += '.js';
        }

        if ( url.match(/^\//) ) {
          // Root path :-
          // Do nothing.
        } else {
		  // Relative path, add in current working directory.
          url = requireLite.cwd + url;
        }
        // 2015-12-11 If CWD is stored by client it will have an explicit path !!
        // Always Clean up urls as we compare modules by urls
        // Remove "/./"
        url = url.replace(/\/\.\//g,'\/'); // 
        // map "/folder-name/../" => "/"
        url = url.replace(/\/[^\/]+\/\.\.\//g,'\/');
        // map "/folder-name/../" => "/"
        url = url.replace(/\/[^\/]+\/\.\.\//g,'\/');          
    }

    // In Chrome name is CACHE items are null. No it was an issue with no-cache !!
    var module = requireLite.cachedModules[url];
    if (module && !module.noCache) {
        // Cached !!
        if (module.loaded) {
            if (callback) {
                // console.log('debug:requireLite: cached immediate callback ' + url);
                callback(module.exports);
                return null;  // Dont return anything, as a async call.
            }
            // console.log('debug:requireLite: cached ' + url);
            return module.exports;
        }
        if (callback) {
            // console.log('debug:requireLite: still loading. push ' + url);
            // sync-call, but module loading in progress.
            // Push callback into  the stack.
            module.callbacks.push(callback);
            return null;   // Dont return anything, as a async call. (Have to re-load another module !!)
        } else {
        	// No Callback. async-call (wait) 
        	// BUT we are waiting for a sync-call to load the same module
            if ( module.callbacks.length > 0 ) {
            	// sync-call -> ... -> async-call (same module) 
            	// Should not happen. best we can do is reload async
                console.log('WARNING: requireLite: sync call, while loading async. (need to load 2nd instance) ' + url);
                url = url + '?sync=1';
                module = null;
	            // Drop thru - load module 2nd time !!
            } else {
            	// async-call -> ... -> async-call !!! Panic recursive !!
                console.log('PANIC: requireLite RECCURSIVE CALL !!! ' + url);
                return null;
            }
        }
    }

    // Not cached
    module = {
        id: requireLite.SEQ++,
        filename: url,
        cwd: '.',
        loaded: false,
        callbacks: [],
        exports: {}
    };



    if (callback) {
        module.callbacks.push(callback);
    }
    requireLite.cachedModules[url] = module;
    // console.log('debug:requireLite: loading ' + module.filename);
    requireLite.loadScript(module);
    if (callback) {
        // console.log('debug:requireLite: return  null ' + module.filename);
        return null;
    }
    // console.log('debug:requireLite: return ' + module.filename);
    return module.exports; // NOTE: if callback is defined, module.exports will be {} since async.

}


/**


Version of the library

@field
@memberof module:requireLite
@type String
@default "0.3"

*/

requireLite.version = '0.3';

/**

Current Working Directory WITH a trailing "/"

@field 
@memberof module:requireLite
@type string
@default './'

*/

requireLite.cwd = './';

/**

List of cached modules.

@field 
@memberof module:requireLite
@private
@type Object

*/


requireLite.cachedModules = {};


/**

Sequence generator for requireLite.

@field 
@memberof module:requireLite
@protected
@type Integer
@default 'getTime() % 2147483648'

*/


requireLite.SEQ = (new Date()).getTime() % 2147483648;

requireLite.requireLite = requireLite;


/**

Always true since running in the brower. 
Will be undefined if running under node-js require.

@field 
@memberof module:requireLite
@type Boolean
@default true

*/

requireLite.inBrowser = true; 



/**

Process completed xhr request

@function 
@memberof module:requireLite
@param module {Object}  Module loading
@param xhr {Object}  XML Http request

@protected

*/

// Script loaded.
requireLite.xhrComplete = function (module, xhr) {
    var fn,push_cwd,ctype,split;
    if (xhr.status === 200) { //  && xhr.getResponseHeader('Content-Type') === 'application/x-javascript') {
        // set ctype=html,json,css
        var cExtn='js'; // Assume js

        if ( xhr.getResponseHeader ) {
            // If a real xhr
            var cacheControl=xhr.getResponseHeader('Cache-Control');
            // module.noCache=( cacheControl && ( cacheControl.search(/no-cache/i) >= 0));

            var resContentType=xhr.getResponseHeader('Content-Type');

            if (resContentType.search(/html/) > 0) cExtn='html';
            if (resContentType.search(/javascript/) > 0) cExtn='js';
            if (resContentType.search(/json/) > 0) cExtn='json';
            if (resContentType.search(/css/) > 0) cExtn='css';
        }
        if (module.filename.search(/\.htm/) > 0) cExtn='html';
        if (module.filename.search(/\.js/) > 0) cExtn='js';
        if (module.filename.search(/\.json/) > 0) cExtn='json';
        if (module.filename.search(/\.css/) > 0) cExtn='css';

        if (cExtn=='html') {
            module.exports = window.document.createElement('div');
            module.exports.innerHTML = xhr.responseText;
            module.exports.setAttribute('href',module.filename);
            // Load into body, So dont net detached DOM Trees, and Can view in Debug
            var TEMPLATES = window.document.getElementById('TEMPLATES');
            if ( !TEMPLATES ) {
                TEMPLATES = window.document.createElement('div');
                TEMPLATES.id = 'TEMPLATES';
                TEMPLATES.style.display = 'none';
                window.document.body.appendChild(TEMPLATES);
            }
            TEMPLATES.appendChild(module.exports);
        } else if (cExtn=='json') {
            module.exports = JSON.parse(xhr.responseText);
        } else if (cExtn=='css') {            
            module.exports = window.document.createElement("link");
            module.exports.setAttribute("rel", "stylesheet");
            module.exports.setAttribute("type", "text/css");
            module.exports.setAttribute("id", module.__id);
            module.exports.href = xhr.responseText;  // responseText, has the full URL. 
            window.document.head.appendChild(module.exports);
        } else {
            // Some js to load.
            fn = new Function(['module', 'exports'], xhr.responseText);

            // Set the cwd to allow other modules to be loaded. 
            push_cwd = requireLite.cwd;

            // Change requireLite.cwd to folder. 
            split = module.filename.split('/');
            split.pop();
            requireLite.cwd = split.join('/') ;
            if ( requireLite.cwd.length === 0 ) requireLite.cwd = '.';
            requireLite.cwd += '/'; // WITH trailing slash
            // console.log('debug:requireLite fn.call cwd='+requireLite.cwd);
            fn.call(this, module, module.exports);
            requireLite.cwd = push_cwd;

        }
        module.loaded = true;


        // If have callback(s) Call them
        while (module.callbacks.length > 0) {
            // console.log('debug:requireLite: loaded callback ' + module.filename);
            module.callbacks.pop()(module.exports);
        }
    } else {
        console.log('WARNING:requireLite: load of "' + module.filename + '" fails status: ' + xhr.status);
    }
};


/**

Load the module (initiate a XMLHttpRequest)

@function 
@memberof module:requireLite
@param module {Object}  Module to load
@protected

*/

requireLite.loadScript = function (module) {
    var xhr,
        url,
        async;

    async = (module.callbacks.length > 0);

    url = module.filename + '?nocache=' + module.__id;
    if ((url.charAt(0) === '/') && (requireLite.ROOT)) 
       url = requireLite.ROOT + url;

    if (url.search(/\.css/) >= 0 ) {
        // fake CSS loading. responseText is the URL to load.
        xhr = { status: 200, responseText : url  };
        requireLite.xhrComplete(module, xhr);
    } else {
        xhr = new XMLHttpRequest();
        if (async) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    requireLite.xhrComplete(module, xhr);
                }
            };
        }        
        xhr.open('get', url, async);
        xhr.send();
        if (!async) // sync
            requireLite.xhrComplete(module, xhr);
    }
};


var require = requireLite;

// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = requireLite;
}