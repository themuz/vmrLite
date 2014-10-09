"use strict";

/**

## Client (Browser) Module Require Lite Loader (Version 0.3)


Browser/client emulation of nodejs's syncronous module loader (require) library.

With a Lite KISS (Keep It Simple Stupid) approach

See nodejs's module loader for background information. (http://nodejs.org/api/modules.html#reqModules_the_reqModule_object)

### Supports js,css,html and json loadng.

### Features :-
- *cache* - Modules are cached after the first time they are loaded
- *sync* - synchronous (i.e wait) by default like nodejs, Make code/dependancies simple/managable.
- *async* - Async with callback, if you must. 
- *module* - In each module, the "module" free variable is a reference to the object representing the current module being loaded.
- *module.exports* - The object assigned to module.exports will be the require of the requireLite call.
- *not just js* - In addition json/css/html is also supported !!
- *encapsulated* - js is encapsulated in the module pattern, no namespace/global pollution. i.e. Variables local to the module will be private
- *no dependancies* 

### Other file types :=

- *json support* - If the url extension is '.json' json will be loaded, and parsed (JSON.parse) and object returned.
- *css support* - If the url extension is '.css', css will be automatically loaded as a window.document.head.link and link's DOM-Element returned. 
- *html support* - If the url extension is '.html' json will be loaded into a div and div's html-Element returned. 

### Usage

    var loadedObject =requireLite(url,[callback]);

loadedObject is whatever is returned by the js, by assigning to module.exports (see below)

### JS Modules (.js)

In each js module the "module" free variable is a reference to the object representing the current module.

The module variable has the following attributes :-

- exports - The object/function being/to-be exported. Assign to module.exports to return your loadedObject. (initalized to {})
- callbacks - Array of pending callback function (to call when js loaded, used in async mode)
- __id - A incrementing id assigned to the module
- __filename - The url as passed to requireLite (e.g. /js/module/Circle.js)
- __dirname - The folder path for the url, without a trailling "/" ( e.g. /js/module OR . ) 


 
In addition the "exports" free variable is also available. This is initalized to {}. 
If you use the "exports" variable, only defined new properties/methods. Dont assign to it, as will be lost. If you wish to return
just an object assign to "module.exports" instead.

Dirname is usefull if you wish to grab other js/html associated with the file loading. 
 e.g div=requireLite('./myspecial-div.html')


### Isnt sync slow, with lots of http requests.

NO, Not if  all modules pre are loaded (as we should do in production mode for performance)
The require is immediate, why code for complex dependancies/async code when not needed.

In fact if we can pre load the modules FASTER, i.e. in parallel (subject to dependancies)

This pre-loading is my next project, See below the TODO list.

TODO:-

- Ability to place the app in dev mode, build up the modules/depencancies by running the application. 
- Export module and dependanceis as a config/loader object.
- Load modules using dependancie config, in parallel (with dependancies)

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

    var  Circle=requireLite('./lib/circle.js');
    alert('The are of a 1" circle is ' + Circle.area(1) + '"')

#### Example Usage  (async)

    requireLite('./lib/circle.js', function(circle) {
      // Do stuff with the "circle", now its loaded   
    });


#### TODO:-
- Handle cyclic references e.g. A requires B that requires A
- if Async scan the js code for require('module.js' .. and load that async 1st.
- DONE: Add requireLite.ROOT to define root folder. default being ""
- Add name-space urls. e.g. mylib:module.js ==> ROOT + '/js/applib/module.js'

@module requireLite
*/


/**

@function requireLite
@static
@public
@param url {String} url to load.
@param extn {String} OPTIONAL override extension to use, use when loading .js file, so can load the corresponding .html/.js
@param callback {Function} OPTIONAL Callback function, to enable async call, parameter passed is value of module.exports 
@return {null|Object} null if async, value of module.exports if sync.

*/

/* global window, console, document, XMLHttpRequest, module */

function requireLite(url, callback) {
    var splitPath;
    /*
    // CHANGED: Remove extn param, as not compatable with nodejs's require.
    if (extn && (typeof extn !== 'string' )) {
        // extn is not a string, must be the callback
        extn = null;
        callback = extn;
    }
    if (url.search(/\.json|\.js|\.htm|\.css/) < 0) {
        // No extension, add in the default. 
        if (!extn) extn = 'js';
        url += ('.' + extn);
    } else {
        // Have an extension.
        if (extn) // Replace the extension
            url = url.replace(/(?=.)[jhc][st][oms]?[nl]?/,extn);
    }
    */
    if (url.search(/\.json|\.js|\.htm|\.css/) < 0) {
        // No extension, add in the default. 
        url += '.js';
    }

    // requireLite.CWD filepath with a training "/"
    if ( url.match(/^\//) ) { // Relative url.
      // Root patch, Do nothing.
    } else {
      url = requireLite.CWD + '/' + url;
      url = url.replace(/\/\.\//g,'\/'); // aaaa/bbbb/./cccc.js ==> aaaa/bbbb/cccc.js
      url = url.replace(/\/[^\/]+\/\.\.\//g,'\/'); // aaaa/bbbb/../cccc.js ==> aaaa/cccc.js
    }


    var module = requireLite.CACHE[url];
    if (module) {
        // Cached !!
        if (module.loaded) {
            if (callback) {
                console.log('requireLite: cached callback ' + url);
                callback(module.exports);
                return null;  // Dont return anything, as a async call.
            }
            console.log('requireLite: cached return ' + url);
            return module.exports;
        }
        if (callback) {
            console.log('requireLite: cached but still loading. push ' + url);
            // module loading in progress.
            // Push callback into  the stack.
            module.callbacks.push(callback);
            return null;   // Dont return anything, as a async call. (Have to re-load another module !!)
        } else {
            if ( module.callbacks.length > 0 ) {
                console.warn('requireLite: sync call, while loading async. (need to load 2nd instance) ' + url);
                url = url + '?sync=1';
                module = null;
            } else {
                console.error('requireLite: RECCURSIVE CALL !!! ' + url);
                return null;
            }
            // Drop thru
        }
    }

    // Not cached
    module = {
        __id: requireLite.SEQ++,
        __filename: url,
        loaded: false,
        callbacks: [],
        exports: {}
    };
    splitPath = module.__filename.split('/');
    splitPath.pop();
    module.__dirname = splitPath.join('/');
    if ( module.__dirname.length === 0 ) module.__dirname = '.'; 
    // module.__dirname += '/'; // Dont add a "/", be the same as nodejs's require
    
    if (callback) {
        module.callbacks.push(callback);
    }
    requireLite.CACHE[url] = module;
    console.log('requireLite: loading ' + module.__filename);
    requireLite.loadScript(module);
    if (callback) {
        console.log('requireLite: return null ' + module.__filename);
        return null;
    }
    console.log('requireLite: return ' + module.__filename);
    return module.exports; // NOTE: if callback is defined, module.exports will be {} since async.

}


requireLite.CACHE = {};


/**

The "root" for calls with a absolute path (i.e. url starts with "/" )
if url starts with "/", ROOT is prepended to the url. 

@name ROOT
@static
@public
@type String
@public
@static
@default ''

*/


requireLite.ROOT = '';


/**

Sequence generator for requireLite.

@name SEQ
@static
@public
@type Integer
@default 'getTime() % 2147483648'

*/


requireLite.SEQ = (new Date()).getTime() % 2147483648;

/**

RequireLite Configurations options.

Currently no config options.

@name config
@static
@public
@type Object
@default '{}'

*/

requireLite.CWD = '.';

requireLite.config = {};

requireLite.requireLite = requireLite;


// Script loaded.
requireLite.xhrComplete = function (module, xhr) {
    var fn,push_CWD;
    if (xhr.status === 200) { //  && xhr.getResponseHeader('Content-Type') === 'application/x-javascript') {
        if (module.__filename.search(/\.htm/) > 0) {
            module.exports = window.document.createElement('div');
            module.exports.innerHTML = xhr.responseText;
            module.exports.setAttribute('href',module.__filename);
            // Load into body, So dont net detached DOM Trees, and Can view in Debug
            var TEMPLATES = window.document.getElementById('TEMPLATES');
            if ( !TEMPLATES ) {
                TEMPLATES = window.document.createElement('div');
                TEMPLATES.id = 'TEMPLATES';
                TEMPLATES.style.display = 'none';
                window.document.body.appendChild(TEMPLATES);
            }
            TEMPLATES.appendChild(module.exports);
        } else if (module.__filename.search(/\.json/) > 0) {
            module.exports = JSON.parse(xhr.responseText);
        } else if (module.__filename.search(/\.css/) > 0) {            
            module.exports = window.document.createElement("link");
            module.exports.setAttribute("rel", "stylesheet");
            module.exports.setAttribute("type", "text/css");
            module.exports.setAttribute("id", module.__id);
            module.exports.href = xhr.responseText;  // responseText, has the full URL. 
            window.document.head.appendChild(module.exports);
        } else {
            // Some js to load.
            fn = new Function(['module', 'exports'], xhr.responseText);

            push_CWD = requireLite.CWD;
            requireLite.CWD = module.__dirname;
            console.log('SET CWD='+requireLite.CWD);

            fn.call(this, module, module.exports);

            requireLite.CWD = push_CWD;
            console.log('RESET CWD='+requireLite.CWD);       
        }
        module.loaded = true;


        // If have callback(s) Call them
        while (module.callbacks.length > 0) {
            console.log('requireLite: loaded callback ' + module.__filename);
            module.callbacks.pop()(module.exports);
        }
    } else {
        console.error('requireLite: Load of "' + module.__filename + '" fails status: ' + xhr.status);
    }
};


requireLite.loadScript = function (module) {
    var xhr,
        url,
        async;

    async = (module.callbacks.length > 0);

    url = module.__filename + '?nocache=' + module.__id;
    if ((url.charAt(0) === '/') && (requireLite.ROOT)) 
       url = requireLite.ROOT + url;

    if (url.search(/\.css/) >= 0 ) {
        // fake CSS loading. responseText is the URL to load.
        xhr = { status: 200, responseText : url  };
        requireLite.xhrComplete(module, xhr);
    } else {
        if (async) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    requireLite.xhrComplete(module, xhr);
                }
            };
        }        
        xhr = new XMLHttpRequest();
        xhr.open('get', url, async);
        xhr.send();
        if (!async) // sync
            requireLite.xhrComplete(module, xhr);
    }
};



// Export, if loaded as a nodejs style require
if (typeof module !== 'undefined') {
    module.exports = requireLite;
}