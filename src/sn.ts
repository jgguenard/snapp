namespace sn
{
    // config
    export var config = {
        logPrefix: "sn: ",
        debug: true
    }

    // log
    export function log(message: any)
    {
        if(sn.config.debug === true)
            console.log(sn.config.logPrefix + message);
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

    // is integer
    export function isInteger(value: any)
    {
        let x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }

    // is empty
    export function isEmpty(value: any)
    {
        return !sn.isDefined(value) || value === "" || (sn.isObject(value) && Object.keys(value).length === 0);
    }

    // mount component on top of a dom element
    export function mount(container: Element, componentDefinition: Object, initArguments?: any)
    {
        let component = new sn.Component(componentDefinition);
        component.mount(container, initArguments);
    }
}