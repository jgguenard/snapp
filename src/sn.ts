namespace sn
{
    // version
    export var version = "0.1"

    // config
    export var config = {
        logPrefix: "sn: ",
        debug: true,
        form: {
            invalidPrefix: "sn-invalid",
            validPrefix: "sn-valid"
        }
    }

    // error
    export function error(message: any)
    {
        if(sn.config.debug === true)
            throw new Error(sn.config.logPrefix + message);
    }

    // log
    export function log(message: any)
    {
        if(sn.config.debug === true)
            console.log(sn.config.logPrefix + message);
    }

    // extend object or array
    export function extend(src, extra)
    {
        if(arguments.length <= 1)
            return src;

        if(Object.assign)
            return Object.assign(src, extra);

        for(var key in extra) {
            if (extra.hasOwnProperty(key)) {
                src[key] = extra[key];
            }
        }
        return src;
    }

    // deep copy an object
    export function copy(src, _visited?) {

        if(!sn.isDefined(src) || !sn.isObject(src)) {
            return src;
        }

        // Initialize the visited objects array if needed
        // This is used to detect cyclic references
        if (_visited == undefined){
            _visited = [];
        }
        // Otherwise, ensure src has not already been visited
        else {
            var i, len = _visited.length;
            for (i = 0; i < len; i++) {
                // If src was already visited, don't try to copy it, just return the reference
                if (src === _visited[i]) {
                    return src;
                }
            }
        }

        // Add this object to the visited array
        _visited.push(src);

        //Honor native/custom clone methods
        if(typeof src.clone == 'function'){
            return src.clone(true);
        }

        //Special cases:
        if (Object.prototype.toString.call(src) == '[object Array]') {
            //[].slice(0) would soft clone
            ret = src.slice();
            var i = ret.length;
            while (i--){
                ret[i] = sn.copy(ret[i], _visited);
            }
            return ret;
        }

        if (src instanceof Date){
            return new Date(src.getTime());
        }

        if(src instanceof RegExp){
            return new RegExp(src);
        }
        //DOM Elements
        if(src.nodeType && typeof src.cloneNode == 'function'){
            return src.cloneNode(true);
        }

        //If we've reached here, we have a regular object, array, or function

        //make sure the returned object has the same prototype as the original
        var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src): src.__proto__);
        if (!proto) {
            proto = src.constructor.prototype; //this line would probably only be reached by very old browsers
        }
        var ret = sn.createObject(proto);

        for(var key in src) {
            ret[key] = sn.copy(src[key], _visited);
        }
        return ret;
    }

    export function createObject(prototype)
    {
        if(Object.create)
            return Object.create(prototype);
        function F() {}
        F.prototype = prototype;
        return new F();
    }

    // is object
    export function isObject(value: any)
    {
        return (typeof value === "object");
    }

    // is array
    export function isArray(value: any)
    {
        return Array.isArray(value);
    }

    // is defined
    export function isDefined(value: any)
    {
        return value !== undefined && value !== null;
    }

    // is function
    export function isFunction(value: any)
    {
        return (typeof value === "function");
    }

    // is value in array
    export function inArray(arr: Array<any>, value)
    {
        return arr.indexOf(value) >= 0;
    }

    // is integer
    export function isInteger(value: any)
    {
        let x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }

    // guid
    export function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    // is empty
    export function isEmpty(value: any)
    {
        return !sn.isDefined(value) || value === "" || (sn.isArray(value) && value.length < 1) ||
            (sn.isObject(value) && Object.keys(value).length < 1);
    }

    // mount component on top of a dom element
    export function mount(container: Element, componentDefinition: Object, initArguments?: any)
    {
        let mountedComponent = sn.vdom.getAttribute(container, "data-sn-component");
        if(mountedComponent && mountedComponent.definition === componentDefinition)
        {
            // update existing component
            mountedComponent.update(initArguments);
        } else {
            // new component
            let component = new sn.Component(componentDefinition);
            component.mount(container, initArguments);
        }
    }
}