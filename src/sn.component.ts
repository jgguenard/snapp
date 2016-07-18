namespace sn
{
    export const componentLifeCycle = ["init", "render", "dispose"];

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
            this.scope = new Proxy({}, {
                // getter
                get: function (obj, prop) {
                    return obj[prop];
                },

                // setter
                set: function (obj, prop, value): boolean {
                    obj[prop] = value;
                    return true;
                }
            });
        }

        mount(container, initArguments?)
        {
            sn.log("Mounting component <" + this.definition.name + ">");

            // set containers
            this.container = container;

            // expose component methods to scope
            for(let p in this.definition)
                if(typeof this.definition[p] == "function" && sn.componentLifeCycle.indexOf(p) < 0)
                    this.scope[p] = this.definition[p];

            // life cycle: init
            if(this.definition.init)
            {
                if(initArguments)
                {
                    // execute init method with context and injected arguments
                    let args = [];
                    for(let key in initArguments)
                        args.push(initArguments[key]);
                    this.definition.init.apply(this.scope, args);
                } else {
                    // execute init method with current context only
                    this.definition.init.call(this.scope);
                }
            }

            // life cycle: render
            this.render();
            sn.log("Component <" + this.definition.name + "> mounted");
        }

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
                sn.vdom.patch(operations);

                sn.log("Component <" + this.definition.name + "> rendered");
            }
        }

        dispose()
        {
            // life cycle: dispose
            if(this.definition.dispose)
                this.definition.dispose.call(this.scope);
            sn.log("Component <" + this.definition.name + "> unmounted");
        }
    }
}