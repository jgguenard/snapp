var sn;
(function (sn) {
    sn.vdom = {
        operation: {
            APPEND_CHILD: "APPEND_CHILD",
            REPLACE_CHILD: "REPLACE_CHILD",
            REMOVE_CHILD: "REMOVE_CHILD",
            REMOVE_ATTRIBUTE: "REMOVE_ATTRIBUTE",
            SET_ATTRIBUTE: "SET_ATTRIBUTE",
            SET_TEXT_CONTENT: "SET_TEXT_CONTENT",
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
            return null;
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
        patch: function (operations) {
            for (let o in operations) {
                let operation = operations[o];
                switch (operation.type) {
                    case sn.vdom.operation.APPEND_CHILD:
                        operation.target.appendChild(this.createRealNode(operation.child));
                        break;
                    case sn.vdom.operation.REPLACE_CHILD:
                        operation.target.replaceChild(this.createRealNode(operation.child), operation.oldChild);
                        break;
                    case sn.vdom.operation.REMOVE_CHILD:
                        operation.target.removeChild(operation.child);
                        break;
                    case sn.vdom.operation.REMOVE_ATTRIBUTE:
                        this.removeAttribute(operation.target, operation.name);
                        break;
                    case sn.vdom.operation.SET_ATTRIBUTE:
                        this.setAttribute(operation.target, operation.name, operation.value);
                        break;
                    case sn.vdom.operation.SET_TEXT_CONTENT:
                        operation.target.textContent = operation.value;
                        break;
                }
            }
        },
        diff: function (currentNode, desiredNode, ignoreAttribute) {
            let operations = [];
            let currentAttrs = currentNode.attributes || [];
            let desiredAttrs = desiredNode.attributes || [];
            if (!ignoreAttribute) {
                for (let a = 0; a < currentAttrs.length; a++) {
                    let currentAttr = currentAttrs[a];
                    let desiredAttr = desiredAttrs[currentAttr.name];
                    let currentAttrValue = this.getAttribute(currentNode, currentAttr.name);
                    let desiredAttrValue = this.getAttribute(desiredNode, currentAttr.name);
                    if (!desiredAttr) {
                        operations.push({
                            type: sn.vdom.operation.REMOVE_ATTRIBUTE,
                            target: currentNode,
                            name: currentAttr.name
                        });
                    }
                    else if (currentAttrValue !== desiredAttrValue) {
                        operations.push({
                            type: sn.vdom.operation.SET_ATTRIBUTE,
                            target: currentNode,
                            name: currentAttr.name,
                            value: desiredAttrValue
                        });
                    }
                }
                for (let a = 0; a < desiredAttrs.length; a++) {
                    let desiredAttr = desiredAttrs[a];
                    let currentAttr = currentAttrs[desiredAttr.name];
                    if (!currentAttr) {
                        let desiredAttrValue = this.getAttribute(desiredNode, desiredAttr.name);
                        operations.push({
                            type: sn.vdom.operation.SET_ATTRIBUTE,
                            target: currentNode,
                            name: desiredAttr.name,
                            value: desiredAttrValue
                        });
                    }
                }
            }
            if (desiredNode.nodeType === sn.vdom.node.TEXT) {
                if (desiredNode.textContent != currentNode.textContent) {
                    operations.push({
                        type: sn.vdom.operation.SET_TEXT_CONTENT,
                        target: currentNode,
                        value: desiredNode.textContent
                    });
                }
            }
            let desiredChildCount = (desiredNode.childNodes) ? desiredNode.childNodes.length : 0;
            let currentChildCount = (currentNode.childNodes) ? currentNode.childNodes.length : 0;
            for (let c = 0; c < desiredChildCount; c++) {
                let desiredChild = desiredNode.childNodes[c];
                let currentChild = (currentNode.childNodes) ? currentNode.childNodes[c] : null;
                if (!currentChild) {
                    operations.push({
                        type: sn.vdom.operation.APPEND_CHILD,
                        target: currentNode,
                        child: desiredChild
                    });
                }
                else if (currentChild.nodeType !== desiredChild.nodeType || currentChild["tagName"] !== desiredChild["tagName"]) {
                    operations.push({
                        type: sn.vdom.operation.REPLACE_CHILD,
                        target: currentNode,
                        child: desiredChild,
                        oldChild: currentChild
                    });
                }
                else {
                    operations = operations.concat(this.diff(currentChild, desiredChild));
                }
            }
            if (desiredChildCount < currentChildCount) {
                for (let c = desiredChildCount; c < currentChildCount; c++) {
                    operations.push({
                        type: sn.vdom.operation.REMOVE_CHILD,
                        target: currentNode,
                        child: currentNode.childNodes[c],
                    });
                }
            }
            return operations;
        },
        createRealNode: function (node) {
            let realNode;
            if (node.nodeType === sn.vdom.node.TEXT) {
                realNode = document.createTextNode(node.textContent);
            }
            else if (node.nodeType === sn.vdom.node.ELEMENT) {
                realNode = document.createElement(node.tagName);
                if (node.attributes) {
                    for (let attrName in node.attributes) {
                        let attrValue = node.attributes[attrName];
                        this.setAttribute(realNode, attrName, attrValue);
                    }
                }
                if (node.childNodes) {
                    var virtualContainer = document.createDocumentFragment();
                    for (var a = 0; a < node.childNodes.length; a++) {
                        let child = node.childNodes[a];
                        if (child)
                            virtualContainer.appendChild(this.createRealNode(child, realNode));
                    }
                    if (realNode.appendChild) {
                        realNode.appendChild(virtualContainer);
                    }
                }
            }
            else if (node.nodeType === sn.vdom.node.COMPONENT) {
                realNode = document.createElement("DIV");
                sn.mount(realNode, node.tagName, node.attributes);
            }
            return realNode;
        },
        createVirtualNode: function (tagName, attributes, childrenOrValue) {
            let node = null;
            if (!sn.isDefined(childrenOrValue) && !sn.isObject(attributes)) {
                childrenOrValue = attributes;
                attributes = null;
            }
            if (sn.isObject(tagName)) {
                node = {
                    nodeType: sn.vdom.node.COMPONENT,
                    tagName: tagName,
                    attributes: attributes
                };
            }
            else {
                node = {
                    tagName: tagName.toUpperCase(),
                    nodeType: sn.vdom.node.ELEMENT,
                    attributes: attributes
                };
                if (sn.isArray(childrenOrValue)) {
                    node.childNodes = childrenOrValue;
                }
                else if (sn.isObject(childrenOrValue)) {
                    node.childNodes = [childrenOrValue];
                }
                else if (!sn.isEmpty(childrenOrValue)) {
                    node.childNodes = [{
                            nodeType: sn.vdom.node.TEXT,
                            textContent: childrenOrValue
                        }];
                }
            }
            return node;
        }
    };
})(sn || (sn = {}));
var el = sn.vdom.createVirtualNode;
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
                    setTimeout(() => {
                        sn.log("Taking route " + rule);
                        this.routes[rule]();
                    }, 0);
                    break;
                }
            }
        },
        setEnabled: function (enabled) {
            if (enabled === true && !this.enabled) {
                window.addEventListener("hashchange", this.update.bind(this));
                this.enabled = true;
                this.update();
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
    sn.componentLifeCycle = ["init", "render", "dispose"];
    class Component {
        constructor(definition) {
            this.definition = definition;
            this.observables = [];
            this.scope = new Proxy({}, {
                get: function (obj, prop) {
                    return obj[prop];
                },
                set: function (obj, prop, value) {
                    obj[prop] = value;
                    return true;
                }
            });
        }
        mount(container, initArguments) {
            sn.log("Mounting component <" + this.definition.name + ">");
            this.container = container;
            for (let p in this.definition)
                if (typeof this.definition[p] == "function" && sn.componentLifeCycle.indexOf(p) < 0)
                    this.scope[p] = this.definition[p];
            if (this.definition.init) {
                if (initArguments) {
                    let args = [];
                    for (let key in initArguments)
                        args.push(initArguments[key]);
                    this.definition.init.apply(this.scope, args);
                }
                else {
                    this.definition.init.call(this.scope);
                }
            }
            this.render();
            sn.log("Component <" + this.definition.name + "> mounted");
        }
        render() {
            if (this.definition.render) {
                let desiredContent = this.definition.render.call(this.scope);
                let desiredView = sn.vdom.createVirtualNode(this.container.tagName, null, desiredContent);
                let operations = sn.vdom.diff(this.container, desiredView, true);
                sn.vdom.patch(operations);
                sn.log("Component <" + this.definition.name + "> rendered");
            }
        }
        dispose() {
            if (this.definition.dispose)
                this.definition.dispose.call(this.scope);
            sn.log("Component <" + this.definition.name + "> unmounted");
        }
    }
    sn.Component = Component;
})(sn || (sn = {}));
var sn;
(function (sn) {
    sn.config = {
        logPrefix: "sn: ",
        debug: true
    };
    function log(message) {
        if (sn.config.debug === true)
            console.log(sn.config.logPrefix + message);
    }
    sn.log = log;
    function isObject(value) {
        return (typeof value === "object");
    }
    sn.isObject = isObject;
    function isArray(value) {
        return Array.isArray(value);
    }
    sn.isArray = isArray;
    function isDefined(value) {
        return value !== undefined && value !== null;
    }
    sn.isDefined = isDefined;
    function isInteger(value) {
        let x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }
    sn.isInteger = isInteger;
    function isEmpty(value) {
        return !sn.isDefined(value) || value === "" || (sn.isObject(value) && Object.keys(value).length === 0);
    }
    sn.isEmpty = isEmpty;
    function mount(container, componentDefinition, initArguments) {
        let component = new sn.Component(componentDefinition);
        component.mount(container, initArguments);
    }
    sn.mount = mount;
})(sn || (sn = {}));
//# sourceMappingURL=snapp.js.map