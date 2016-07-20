namespace sn
{
    // config
    export var config = {
        logPrefix: "sn: ",
        debug: true
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

    export function extend(obj1, obj2)
    {
        if(Object.assign)
            return Object.assign(obj1, obj2);
        // todo
        return obj1;
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
        return !sn.isDefined(value) || value === "" || (sn.isArray(value) && value.length < 1) || (sn.isObject(value) && Object.keys(value).length < 1);
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

    // change property of a scope upon input events (TEMPORARY, TO IMPROVE)
    export function bind(prop, scope)
    {
        return function(event)
        {
            scope[prop] = event.target.value;
        }
    }
}