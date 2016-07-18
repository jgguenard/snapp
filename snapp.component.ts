namespace sn
{
    export const componentMethods = ["controller", "view", "dispose"];
    
    export class Component
    {
        private definition: any;
        private observables: Array<any>;
        private container: Element;
        private scope: any;
        private vContainer: DocumentFragment;
        private activeRenderJob = null;
        private mounted = false;

        constructor(definition)
        {
            this.definition = definition;
            this.observables = [];
            let $this = this;

            this.scope = new Proxy({}, {

                get: function (obj, prop) {
                    if(obj[prop] !== undefined && typeof obj[prop] !== "function" && $this.observables.indexOf(prop) < 0)
                    {
                        sn.log("Observing property <" + $this.definition.name + "::" + prop.toString() + ">");
                        $this.observables.push(prop);
                    }
                    return obj[prop];
                },

                set: function (obj, prop, value): boolean {
                    obj[prop] = value;
                    if(typeof value !== "function" && $this.observables.indexOf(prop) >= 0)
                    {
                        sn.log("Rendering of <" + $this.definition.name + "> triggered by observable <" + $this.definition.name + "::" + prop.toString() + ">");
                        $this.render();
                    }
                    return true;
                }
            });
        }

        public mount(container, controllerParameters?)
        {
            // let's unmount previous component
            let oldComponent = sn.vdom.getAttribute(container, "data-sn-component");
            if(oldComponent)
                oldComponent.unmount();

            sn.log("Mounting component <" + this.definition.name + ">");

            // mount component
            sn.vdom.setAttribute(container, "data-sn-component", this);
            this.mounted = true;

            // set containers
            this.container = container;
            this.vContainer = sn.vdom.createContainerFromNode(container);

            // expose component methods to scope
            for(let p in this.definition)
                if(typeof this.definition[p] == "function" && sn.componentMethods.indexOf(p) < 0)
                    this.scope[p] = this.definition[p];

            // execute controller
            if(this.definition.controller)
            {
                if(controllerParameters)
                {
                    // execute controller with context and injected arguments
                    let controller_args = [];
                    for(let key in controllerParameters)
                        controller_args.push(controllerParameters[key]);
                    this.definition.controller.apply(this.scope, controller_args);
                } else {
                    // execute controller with current context only
                    this.definition.controller.call(this.scope);
                }
            }

            // initial rendering of the view
            this.render();
            sn.log("Component <" + this.definition.name + "> mounted");
        }

        public unmount()
        {
            if(this.definition.dispose)
                this.definition.dispose.call(this.scope);
            this.mounted = false;
            sn.log("Component <" + this.definition.name + "> unmounted");
        }

        public render()
        {
            if(this.mounted === true && this.definition.view)
            {
                if(this.activeRenderJob)
                {
                    sn.log("Ignoring 1 rendering request for <" + this.definition.name + ">");
                    clearTimeout(this.activeRenderJob);
                }
                this.activeRenderJob = setTimeout(() => {
                    // generate the view with component scope
                    let node = this.definition.view.call(this.scope, this.vContainer);

                    // if node is virtual, we must append it to a temporary container, otherwise
                    // it will be replaced by its children
                    if (sn.vdom.isVirtualNode(node))
                        node = sn.vdom.createContainerFromNode(node);

                    // get changes
                    let changes = sn.vdom.diffChildren(this.container, node);

                    // apply them
                    sn.vdom.apply(changes);

                    sn.log("Rendering component <" + this.definition.name + ">");
                    this.activeRenderJob = null;
                }, 0);
            } else {
                sn.log("Rendering request for <" + this.definition.name + "> ignored");
            }
        }
    }
}