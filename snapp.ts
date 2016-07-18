namespace sn
{
    // config
    export var config = {
        logPrefix: "sn: ",
        debug: true
    }

    // create a virtual node from parameters
    export function element(tagName: any, attributes, childNodes) {
        if(!tagName || tagName === "")
            return null;
        return sn.vdom.createVirtualNode(tagName, attributes, childNodes);
    }

    // log
    export function log(message: any)
    {
        if(sn.config.debug === true)
            console.log(sn.config.logPrefix + message);
    }

    // is empty
    export function isEmpty(value: any): boolean
    {
        return !sn.isDefined(value) || value === "" || (typeof value === "object" && Object.keys(value).length === 0);
    }

    // is defined
    export function isDefined(value: any): boolean
    {
        return value !== undefined && value !== null;
    }

    // isInteger
    export function isInteger(value: any) : boolean
    {
        let x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }

    // mount
    export function mount(container: Element, componentDefinition: any, parameters?: any): void
    {
        let component = new sn.Component(componentDefinition);
        component.mount(container, parameters);
    }

    export var version = "0.1"
}

// shortcut to create an element
var el = sn.element;