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