var sn;
(function (sn) {
    sn.config = {
        logPrefix: "snapp: ",
        debug: true
    };
    sn.componentMethods = ["controller", "view", "dispose"];
    function element(tagName, attributes, childNodes) {
        if (!tagName || tagName === "")
            return null;
        if (typeof tagName === "object") {
            return {
                nodeType: sn.vdom.node.COMPONENT,
                tagName: tagName,
                attributes: attributes,
                virtual: true
            };
        }
        else {
            return sn.vdom.createVirtualNode(tagName, attributes, childNodes);
        }
    }
    sn.element = element;
    function log(message) {
        if (sn.config.debug === true)
            console.log(sn.config.logPrefix + message);
    }
    sn.log = log;
    function isInteger(value) {
        let x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }
    sn.isInteger = isInteger;
    function mount(container, component_definition) {
        let component = new sn.Component(component_definition);
        component.mount(container);
    }
    sn.mount = mount;
    class Component {
        constructor(definition) {
            this.activeRenderJob = null;
            this.mounted = false;
            this.definition = definition;
            this.observables = [];
            let $this = this;
            this.scope = new Proxy({}, {
                get: function (obj, prop) {
                    if (obj[prop] !== undefined && typeof obj[prop] !== "function" && $this.observables.indexOf(prop) < 0) {
                        sn.log("Observing property <" + $this.definition.name + "::" + prop.toString() + ">");
                        $this.observables.push(prop);
                    }
                    return obj[prop];
                },
                set: function (obj, prop, value) {
                    obj[prop] = value;
                    if (typeof value !== "function" && $this.observables.indexOf(prop) >= 0) {
                        sn.log("Rendering of <" + $this.definition.name + "> triggered by observable <" + $this.definition.name + "::" + prop.toString() + ">");
                        $this.render();
                    }
                    return true;
                }
            });
        }
        mount(container) {
            let oldComponent = sn.vdom.getAttribute(container, "data-sn-component");
            if (oldComponent)
                oldComponent.unmount();
            sn.log("Mounting component <" + this.definition.name + ">");
            sn.vdom.setAttribute(container, "data-sn-component", this);
            this.mounted = true;
            this.container = container;
            this.vContainer = sn.vdom.createContainerFromNode(container);
            for (let p in this.definition)
                if (typeof this.definition[p] == "function" && sn.componentMethods.indexOf(p) < 0)
                    this.scope[p] = this.definition[p];
            if (this.definition.controller) {
                this.definition.controller.call(this.scope);
            }
            this.render();
            sn.log("Component <" + this.definition.name + "> mounted");
        }
        unmount() {
            if (this.definition.dispose)
                this.definition.dispose.call(this.scope);
            this.mounted = false;
            sn.log("Component <" + this.definition.name + "> unmounted");
        }
        render() {
            if (this.mounted === true && this.definition.view) {
                if (this.activeRenderJob) {
                    sn.log("Rendering request for <" + this.definition.name + "> ignored");
                    clearTimeout(this.activeRenderJob);
                }
                let node = this.definition.view.call(this.scope, this.vContainer);
                if (sn.vdom.isVirtualNode(node))
                    node = sn.vdom.createContainerFromNode(node);
                let changes = sn.vdom.diff(this.container, node);
                sn.vdom.apply(changes);
                sn.log("Rendering component <" + this.definition.name + ">");
                this.activeRenderJob = null;
            }
            else {
                sn.log("Rendering request for <" + this.definition.name + "> ignored");
            }
        }
    }
    sn.Component = Component;
})(sn || (sn = {}));
var el = sn.element;
var sn;
(function (sn) {
    sn.router = {
        routes: {},
        params: [],
        named_params: {},
        enabled: false,
        getPath: function () {
            let match = window.location.href.match(/#(.*)$/);
            let path = match ? match[1] : '';
            return "/" + this.clearSlashes(path);
        },
        clearSlashes: function (path) {
            return path.toString().replace(/\/$/, '').replace(/^\//, '');
        },
        param: function (key, default_value) {
            if (sn.isInteger(key))
                return this.params[key] || default_value;
            else
                return this.named_params[key] || default_value;
        },
        update: function () {
            let path = this.getPath();
            let params = [];
            let named_params = {};
            path = path.replace(/[?&]+([^=&]+)=?([^&]*)?/gi, (m, key, value) => {
                named_params[key] = decodeURIComponent(value);
                return "";
            });
            for (let rule in this.routes) {
                let regex = "^" + rule.replace(/:[^/]+/g, '([^/]+)') + "$";
                let match = path.match(regex);
                if (match) {
                    match.shift();
                    let param_name_match = rule.match(/:([^/:]+)/g);
                    for (let p in param_name_match) {
                        let val = decodeURIComponent(match[p]);
                        params.push(val);
                        named_params[param_name_match[p].replace(":", "")] = val;
                    }
                    this.params = params;
                    this.named_params = named_params;
                    sn.log("Taking route " + rule);
                    this.routes[rule]();
                    break;
                }
            }
        },
        setEnabled: function (enabled) {
            if (enabled === true && !this.enabled) {
                setTimeout(() => {
                    window.addEventListener("hashchange", this.update.bind(this));
                    this.enabled = true;
                    this.update();
                }, 0);
            }
            else if (!enabled) {
                window.removeEventListener("hashchange", this.update.bind(this));
                this.enabled = false;
            }
        },
        setRoutes: function (routes) {
            this.routes = routes;
            this.setEnabled(true);
        },
        redirect: function (path, args) {
            if (args)
                for (let a in args)
                    path = path.replace(":" + a, encodeURIComponent(args[a]));
            window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
        }
    };
})(sn || (sn = {}));
var sn;
(function (sn) {
    sn.vdom = {
        operation: {
            APPEND_CHILD: "APPEND_CHILD",
            REPLACE_CHILD: "REPLACE_CHILD",
            REMOVE_CHILD: "REMOVE_CHILD",
            REMOVE_ATTRIBUTE: "REMOVE_ATTRIBUTE",
            SET_ATTRIBUTE: "SET_ATTRIBUTE",
            SET_EVENT: "SET_EVENT"
        },
        node: {
            COMMENT: 8,
            ELEMENT: 1,
            TEXT: 3,
            COMPONENT: 99
        },
        setAttribute: function (node, name, value) {
            if (name === 'class') {
                node.className = value;
            }
            else if (name === 'style') {
                node.style.cssText = value;
            }
            else if (name !== 'type' && name in node || typeof value !== 'string') {
                node[name] = value == null ? '' : value;
            }
            else if (node.setAttribute) {
                node.setAttribute(name, value);
            }
            else if (node.attributes) {
                node.attributes[name] = value;
            }
        },
        getAttribute: function (node, name) {
            if (name === 'class') {
                return node.className;
            }
            else if (name === 'style') {
                return node.style.cssText;
            }
            else if (name !== 'type' && name in node) {
                return node[name];
            }
            else if (node.getAttribute) {
                return node.getAttribute(name);
            }
            else if (node.attributes && node.attributes[name]) {
                return node.attributes[name].value;
            }
        },
        removeAttribute: function (node, name) {
            if (name === 'class') {
                node.className = '';
            }
            else if (name === 'style') {
                node.style.cssText = '';
            }
            else if (name !== 'type' && name in node) {
                node[name] = '';
            }
            else if (node.removeAttribute) {
                node.removeAttribute(name);
            }
            else if (node.attributes) {
                delete node.attributes[name];
            }
        },
        diffNode: function (srcNode, dstNode) {
            let operations = [];
            let srcAttributes = srcNode.attributes || [];
            let dstAttributes = dstNode.attributes || [];
            for (let a = 0; a < srcAttributes.length; a++) {
                let srcAttribute = srcAttributes[a];
                let dstAttribute = dstAttributes[srcAttribute.name];
                let srcAttrValue = this.getAttribute(srcNode, srcAttribute.name);
                let dstAttrValue = this.getAttribute(dstNode, srcAttribute.name);
                if (!dstAttribute) {
                    operations.push({
                        type: sn.vdom.operation.REMOVE_ATTRIBUTE,
                        source: srcNode,
                        attribute: { name: srcAttribute.name }
                    });
                }
                else if (srcAttrValue !== dstAttrValue) {
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        source: srcNode,
                        destination: dstNode,
                        attribute: { name: srcAttribute.name, value: dstAttrValue },
                    });
                }
            }
            for (let a = 0; a < dstAttributes.length; a++) {
                let dstAttribute = dstAttributes[a];
                let srcAttribute = srcAttributes[dstAttribute.name];
                if (!srcAttribute) {
                    let dstAttrValue = this.getAttribute(dstNode, dstAttribute.name);
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        source: srcNode,
                        destination: dstNode,
                        attribute: { name: dstAttribute.name, value: dstAttrValue }
                    });
                }
            }
            operations = operations.concat(this.diff(srcNode, dstNode));
            return operations;
        },
        diff: function (srcNode, dstNode) {
            let operations = [];
            let dstChildCount = (dstNode.childNodes) ? dstNode.childNodes.length : 0;
            let srcChildCount = (srcNode.childNodes) ? srcNode.childNodes.length : 0;
            for (let c = 0; c < dstChildCount; c++) {
                let dstChild = dstNode.childNodes[c];
                let srcChild = srcNode.childNodes[c];
                if (!srcChild) {
                    operations.push({
                        type: sn.vdom.operation.APPEND_CHILD,
                        source: srcNode,
                        node: dstChild
                    });
                }
                else if (srcChild.nodeType !== dstChild.nodeType || srcChild["tagName"] || (srcChild["tagName"] !== dstChild["tagName"])) {
                    operations.push({
                        type: sn.vdom.operation.REPLACE_CHILD,
                        source: srcNode,
                        destination: dstChild,
                        node: srcChild
                    });
                }
                else {
                    operations = operations.concat(this.diffNode(srcChild, dstChild));
                }
            }
            if (dstChildCount < srcChildCount) {
                for (let c = dstChildCount; c < srcChildCount; c++) {
                    operations.push({
                        type: sn.vdom.operation.REMOVE_CHILD,
                        source: srcNode,
                        node: srcNode.childNodes[c],
                    });
                }
            }
            return operations;
        },
        apply: function (operations) {
            for (let o in operations) {
                let operation = operations[o];
                switch (operation.type) {
                    case sn.vdom.operation.APPEND_CHILD:
                        let clone = this.cloneNode(operation.node);
                        operation.source.appendChild(clone);
                        break;
                    case sn.vdom.operation.REPLACE_CHILD:
                        let new_child = (this.isVirtualNode(operation.destination))
                            ? this.createRealNode(operation.destination)
                            : operation.destination;
                        operation.source.replaceChild(new_child, operation.node);
                        break;
                    case sn.vdom.operation.REMOVE_CHILD:
                        operation.source.removeChild(operation.node);
                        break;
                    case sn.vdom.operation.REMOVE_ATTRIBUTE:
                        this.removeAttribute(operation.source, operation.attribute.name);
                        break;
                    case sn.vdom.operation.SET_ATTRIBUTE:
                        this.setAttribute(operation.source, operation.attribute.name, operation.attribute.value);
                        break;
                    case sn.vdom.operation.SET_EVENT:
                        break;
                }
            }
        },
        cloneNode: function (node) {
            if (!node.cloneNode) {
                return this.createRealNode(node);
            }
            else {
                return node.cloneNode(true);
            }
        },
        createRealNode: function (node) {
            let realNode;
            if (node.nodeType === sn.vdom.node.TEXT) {
                realNode = document.createTextNode(node.textContent);
            }
            else if (node.nodeType === sn.vdom.node.ELEMENT) {
                realNode = document.createElement(node.tagName);
                if (node.attributes) {
                    for (var a = 0; a < node.attributes.length; a++) {
                        var attr = node.attributes[a];
                        this.setAttribute(realNode, attr.name, attr.value);
                    }
                }
                if (node.childNodes) {
                    var virtualContainer = document.createDocumentFragment();
                    for (var a = 0; a < node.childNodes.length; a++) {
                        let child = node.childNodes[a];
                        if (child)
                            virtualContainer.appendChild(this.createRealNode(child));
                    }
                    if (realNode.appendChild) {
                        realNode.appendChild(virtualContainer);
                    }
                }
            }
            else if (node.nodeType === sn.vdom.node.COMPONENT) {
                realNode = document.createElement("DIV");
                sn.mount(realNode, node.tagName);
            }
            return realNode;
        },
        createVirtualNode: function (tagName, attributes, childNodes) {
            var node;
            if (typeof tagName === "object") {
            }
            else {
                node = {
                    tagName: tagName.toUpperCase(),
                    nodeType: sn.vdom.node.ELEMENT,
                    attributes: attributes,
                    virtual: true
                };
                if (Array.isArray(childNodes)) {
                    node.childNodes = childNodes;
                }
                else if (typeof childNodes === "object") {
                    node.childNodes = [childNodes];
                }
                else {
                    node.childNodes = [{
                            nodeType: sn.vdom.node.TEXT,
                            textContent: childNodes,
                            virtual: true
                        }];
                }
            }
            return node;
        },
        createContainerFromNode: function (node) {
            let container;
            let isVirtual = this.isVirtualNode(node);
            if (!isVirtual) {
                container = document.createDocumentFragment();
                if (node)
                    for (let c in node.childNodes) {
                        let child = node.childNodes[c];
                        if (child.cloneNode) {
                            let clone = child.cloneNode(true);
                            container.appendChild(clone);
                        }
                    }
            }
            else {
                container = {
                    nodeType: sn.vdom.node.ELEMENT,
                    tagName: "DIV",
                    childNodes: node ? [node] : [],
                    virtual: true
                };
            }
            return container;
        },
        isVirtualNode: function (node) {
            return (node && node["virtual"] === true);
        }
    };
})(sn || (sn = {}));
//# sourceMappingURL=snapp.js.map