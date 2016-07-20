namespace sn
{

    export var component = {

        lifeCycle: ["init", "update", "render", "dispose"],

        // abort pending rendering request for a component
        abortComponentRendering: function(component)
        {
            if(component.$pendingRendering)
            {
                sn.log("Ignoring rendering request of component <" + component.definition.name + ">");
                clearTimeout(component.$pendingRendering);
            }
        },

        // rendering request manager
        requestComponentRendering: function(component)
        {
            // abort previous rendering request
            this.abortComponentRendering(component);

            // render component asynchronously (after current JS iteration)
            component.$pendingRendering = setTimeout(() => {
                component.render();
                component.$pendingRendering = null;
            }, 0);
        },

        // property change manager
        observablePropertyChanged: function(component, scopeID, scope, prop, newValue, oldValue)
        {
            sn.log("Rendering component <" + component.definition.name +
                "> triggered by <" + prop.toString() + "> of scope <!" + scopeID + ">");

            // request rendering of component
            this.requestComponentRendering(component);

            // notify observers
            let observers = (scope.$observers) ? scope.$observers[prop] : null;
            if(observers)
                for(let o in observers)
                    observers[o](newValue, oldValue);
        },

        observe: function(prop, scope, callback)
        {
            if(!scope.$observers)
                scope.$observers = {}
            if(!scope.$observers[prop])
                scope.$observers[prop] = [];
            scope.$observers[prop].push(callback);
        }
    }

    export class Component
    {
        // component definition
        private definition: any;
        // observable properties
        private observables: Array<any>;
        // dom container
        private container: Element;
        // scope
        private scope: any;

        // ctor
        constructor(definition)
        {
            this.definition = definition;
            this.observables = [];
            let $component = this;
            this.scope = this.createScope();
        }

        // create scope
        createScope(initialData?)
        {
            let component = this;
            let scopeID = sn.guid();
            return new Proxy(initialData || {}, {

                // getter
                get: function (obj, prop) {
                    let propID = scopeID + prop.toString();
                    if(
                        sn.isDefined(obj[prop]) &&
                        !sn.isFunction(obj[prop]) &&
                        prop !== "__proto__" &&
                        !prop.toString().startsWith("$") &&
                        !sn.inArray(component.observables, propID))
                    {
                        sn.log("Observing property <" + prop.toString() + "> of scope <" + scopeID + ">");
                        component.observables.push(propID);
                    }
                    return obj[prop];
                },

                // setter
                set: function (obj, prop, value): boolean {
                    let propID = scopeID + prop.toString();
                    let oldValue = obj[prop];
                    // create scope for inner objects because Proxy is limited to its direct elements
                    if(typeof value === "object")
                        value = component.createScope(value);
                    // save change
                    obj[prop] = value;
                    // notify property change
                    if((value !== oldValue) && !sn.isFunction(value) && sn.inArray(component.observables, propID))
                        sn.component.observablePropertyChanged(component, scopeID, obj, prop, value, oldValue);
                    return true;
                }
            });
        }

        // mount a component on a container
        mount(container, ctrlArguments?)
        {
            sn.log("Mounting component <" + this.definition.name + ">");

            // handle current component
            let mountedComponent = sn.vdom.getAttribute(container, "data-sn-component");
            if(sn.isDefined(mountedComponent))
                mountedComponent.dispose();

            // attach component to container
            sn.vdom.setAttribute(container, "data-sn-component", this);

            // set containers
            this.container = container;

            // expose component methods to scope
            for(let p in this.definition)
                if(typeof this.definition[p] == "function" && sn.component.lifeCycle.indexOf(p) < 0)
                    this.scope[p] = this.definition[p];

            // init component
            this.init(ctrlArguments);

            // update component
            this.update(ctrlArguments);

            sn.log("Component <" + this.definition.name + "> mounted");
        }

        // call a method with named arguments
        controller(ctrl, ctrlArgs?)
        {
            // execute controller
            if(this.definition[ctrl])
            {
                if(arguments)
                {
                    // execute controller with context and injected arguments
                    let args = [];
                    for(let key in ctrlArgs)
                        args.push(ctrlArgs[key]);
                    this.definition[ctrl].apply(this.scope, args);
                } else {
                    // execute controller with current context only
                    this.definition[ctrl].call(this.scope);
                }
            }
        }

        // life cycle: init
        init(ctrlArguments?)
        {
            this.controller("init", ctrlArguments);
            sn.log("Component <" + this.definition.name + "> initialized");
        }

        // life cycle: update
        update(ctrlArguments?)
        {
            this.controller("update", ctrlArguments);
            // ask manager to render itself
            sn.component.requestComponentRendering(this);
            sn.log("Component <" + this.definition.name + "> updated");
        }

        // life cycle: render
        render()
        {
            if(this.definition.render)
            {
                // generate view with component scope
                let desiredContent = this.definition.render.call(this.scope);
                let desiredView = sn.vdom.createVirtualNode(this.container.tagName, null, desiredContent);

                // get operations required to make current view like desired view
                let operations = sn.vdom.diff(this.container, desiredView, true);

                // apply operations
                sn.vdom.patch(operations, this.scope);

                sn.log("Component <" + this.definition.name + "> rendered");
            }
        }

        // life cycle: dispose
        dispose()
        {
            // cancel any pending rendering
            sn.component.abortComponentRendering(this);

            // life cycle: dispose
            if(this.definition.dispose)
                this.definition.dispose.call(this.scope);
            sn.log("Component <" + this.definition.name + "> unmounted");
        }
    }
}