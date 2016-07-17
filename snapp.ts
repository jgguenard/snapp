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
        private data: any;
        private v_container: DocumentFragment;

        constructor(definition)
        {
            this.definition = definition;
            this.observables = [];

            this.data = new Proxy({}, {

                get: function (obj: {}, prop) {
                    return obj[prop];
                },

                set: function (obj, prop, value): boolean {
                    obj[prop] = value;
                    return true;
                }
            });
        }

        public mount(container)
        {
            sn.log("Mounting component <" + this.definition.name + ">");

            this.container = container;
            this.v_container = sn.vdom.createVirtualContainer(container);

            // execute controller
            if(this.definition.controller)
            {
                // execute controller to set component data
                this.definition.controller.call(this.data);
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
                // generate the view with component data
                let node = this.definition.view.call(this.data, this.v_container);

                // if node is virtual, we must append it to a temporary container, otherwise
                // it will be replaced by its children
                if(sn.vdom.isVirtualNode(node))
                    node = sn.vdom.createVirtualContainer(node);

                // get changes
                let changes = sn.vdom.diff(this.container, node);

                // apply them
                sn.vdom.apply(changes);

                sn.log("Rendering component <" + this.definition.name + ">");
            }
        }
    }
}
