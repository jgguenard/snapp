namespace sn
{
    // config
    export var config = {
        logPrefix: "snapp: ",
        debug: true
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
    export function mount(container: Element, component_definition: any): void
    {
        let component = new sn.Component(component_definition);
        component.mount(container);
    }

    export class Component
    {
        private definition: any;
        private observables: Array<any>;
        private container: Element;
        private scope: any;
        private vContainer: DocumentFragment;
        private activeRenderJob = null;

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

        public mount(container)
        {
            sn.log("Mounting component <" + this.definition.name + ">");

            this.container = container;
            this.vContainer = sn.vdom.createVirtualContainer(container);

            // expose component methods to scope
            for(let p in this.definition)
                if(typeof this.definition[p] == "function")
                    this.scope[p] = this.definition[p];

            // execute controller
            if(this.definition.controller)
            {
                // execute controller to set component scope
                this.definition.controller.call(this.scope);
            }

            // initial rendering of the view
            this.render();

            sn.log("Component <" + this.definition.name + "> mounted");
        }

        public unmount()
        {
            sn.log("Component <" + this.definition.name + "> unmounted");
        }

        public render()
        {
            if(this.definition.view)
            {
                if(this.activeRenderJob)
                {
                    sn.log("Rendering request for <" + this.definition.name + "> ignored");
                    clearTimeout(this.activeRenderJob);
                }
                this.activeRenderJob = setTimeout(() => {
                    // generate the view with component scope
                    let node = this.definition.view.call(this.scope, this.vContainer);

                    // if node is virtual, we must append it to a temporary container, otherwise
                    // it will be replaced by its children
                    if(sn.vdom.isVirtualNode(node))
                        node = sn.vdom.createVirtualContainer(node);

                    // get changes
                    let changes = sn.vdom.diff(this.container, node);

                    // apply them
                    sn.vdom.apply(changes);

                    sn.log("Rendering component <" + this.definition.name + ">");
                    this.activeRenderJob = null;
                }, 100);
            }
        }
    }
}
