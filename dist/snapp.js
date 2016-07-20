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
            else if (node.attributes) {
                return node.attributes[name];
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
        patch: function (operations, scope) {
            for (let o in operations) {
                let operation = operations[o];
                switch (operation.type) {
                    case sn.vdom.operation.APPEND_CHILD:
                        operation.target.appendChild(this.createRealNode(operation.child, scope));
                        break;
                    case sn.vdom.operation.REPLACE_CHILD:
                        operation.target.replaceChild(this.createRealNode(operation.child, scope), operation.oldChild);
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
            let desiredAttrs = desiredNode.attributes || {};
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
                for (let desiredAttr in desiredAttrs) {
                    let found = false;
                    for (let a = 0; a < currentAttrs.length; a++) {
                        if (currentAttrs[a].name === desiredAttr) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        let desiredAttrValue = this.getAttribute(desiredNode, desiredAttr);
                        operations.push({
                            type: sn.vdom.operation.SET_ATTRIBUTE,
                            target: currentNode,
                            name: desiredAttr,
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
                    if (!sn.isEmpty(desiredChild)) {
                        operations.push({
                            type: sn.vdom.operation.APPEND_CHILD,
                            target: currentNode,
                            child: desiredChild
                        });
                    }
                }
                else if (sn.isEmpty(desiredChild)) {
                    operations.push({
                        type: sn.vdom.operation.REMOVE_CHILD,
                        target: currentNode,
                        child: currentNode.childNodes[c],
                    });
                }
                else if (currentChild.nodeType !== desiredChild.nodeType || currentChild["tagName"] !== desiredChild["tagName"]) {
                    if (desiredChild.nodeType !== sn.vdom.node.COMPONENT) {
                        operations.push({
                            type: sn.vdom.operation.REPLACE_CHILD,
                            target: currentNode,
                            child: desiredChild,
                            oldChild: currentChild
                        });
                    }
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
        createRealNode: function (node, scope) {
            let realNode;
            if (node.nodeType === sn.vdom.node.TEXT) {
                realNode = document.createTextNode(node.textContent);
            }
            else if (node.nodeType === sn.vdom.node.ELEMENT) {
                realNode = document.createElement(node.tagName);
                if (node.attributes) {
                    for (let attrName in node.attributes) {
                        let attrValue = node.attributes[attrName];
                        if (typeof attrValue === 'function')
                            attrValue = attrValue.bind(scope);
                        this.setAttribute(realNode, attrName, attrValue);
                    }
                }
                if (node.childNodes) {
                    var virtualContainer = document.createDocumentFragment();
                    for (var a = 0; a < node.childNodes.length; a++) {
                        let child = node.childNodes[a];
                        if (child)
                            virtualContainer.appendChild(this.createRealNode(child, scope));
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
        route: function (path, args) {
            if (args)
                for (let a in args)
                    path = path.replace(":" + a, encodeURIComponent(args[a]));
            window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
        }
    };
})(sn || (sn = {}));
var sn;
(function (sn) {
    sn.component = {
        lifeCycle: ["init", "update", "render", "dispose"],
        abortComponentRendering: function (component) {
            if (component.$pendingRendering) {
                sn.log("Ignoring rendering request of component <" + component.definition.name + ">");
                clearTimeout(component.$pendingRendering);
            }
        },
        requestComponentRendering: function (component) {
            this.abortComponentRendering(component);
            component.$pendingRendering = setTimeout(() => {
                component.render();
                component.$pendingRendering = null;
            }, 0);
        },
        propertyChanged: function (component, prop) {
            sn.log("Rendering component <" + component.definition.name + "> triggered by <" + prop.toString() + ">");
            this.requestComponentRendering(component);
        }
    };
    class Component {
        constructor(definition) {
            this.definition = definition;
            this.observables = [];
            let $component = this;
            this.scope = this.createScope();
        }
        createScope(initialData) {
            let component = this;
            let scopeID = sn.guid();
            return new Proxy(initialData || {}, {
                get: function (obj, prop) {
                    let propID = scopeID + prop.toString();
                    if (sn.isDefined(obj[prop]) &&
                        !sn.isFunction(obj[prop]) &&
                        prop !== "__proto__" &&
                        !prop.toString().startsWith("$") &&
                        !sn.inArray(component.observables, propID)) {
                        sn.log("Observing property <" + prop.toString() + "> of scope <" + scopeID + ">");
                        component.observables.push(propID);
                    }
                    return obj[prop];
                },
                set: function (obj, prop, value) {
                    let propID = scopeID + prop.toString();
                    if (typeof value === "object")
                        value = component.createScope(value);
                    obj[prop] = value;
                    if (!sn.isFunction(value) && sn.inArray(component.observables, propID))
                        sn.component.propertyChanged(component, propID);
                    return true;
                }
            });
        }
        mount(container, ctrlArguments) {
            sn.log("Mounting component <" + this.definition.name + ">");
            let mountedComponent = sn.vdom.getAttribute(container, "data-sn-component");
            if (sn.isDefined(mountedComponent))
                mountedComponent.dispose();
            sn.vdom.setAttribute(container, "data-sn-component", this);
            this.container = container;
            for (let p in this.definition)
                if (typeof this.definition[p] == "function" && sn.component.lifeCycle.indexOf(p) < 0)
                    this.scope[p] = this.definition[p];
            this.init(ctrlArguments);
            this.update(ctrlArguments);
            sn.log("Component <" + this.definition.name + "> mounted");
        }
        controller(ctrl, ctrlArgs) {
            if (this.definition[ctrl]) {
                if (arguments) {
                    let args = [];
                    for (let key in ctrlArgs)
                        args.push(ctrlArgs[key]);
                    this.definition[ctrl].apply(this.scope, args);
                }
                else {
                    this.definition[ctrl].call(this.scope);
                }
            }
        }
        init(ctrlArguments) {
            this.controller("init", ctrlArguments);
            sn.log("Component <" + this.definition.name + "> initialized");
        }
        update(ctrlArguments) {
            this.controller("update", ctrlArguments);
            sn.component.requestComponentRendering(this);
            sn.log("Component <" + this.definition.name + "> updated");
        }
        render() {
            if (this.definition.render) {
                let desiredContent = this.definition.render.call(this.scope);
                let desiredView = sn.vdom.createVirtualNode(this.container.tagName, null, desiredContent);
                let operations = sn.vdom.diff(this.container, desiredView, true);
                sn.vdom.patch(operations, this.scope);
                sn.log("Component <" + this.definition.name + "> rendered");
            }
        }
        dispose() {
            sn.component.abortComponentRendering(this);
            if (this.definition.dispose)
                this.definition.dispose.call(this.scope);
            sn.log("Component <" + this.definition.name + "> unmounted");
        }
    }
    sn.Component = Component;
})(sn || (sn = {}));
var sn;
(function (sn) {
    class RequestObject {
        constructor(method, url, data, options) {
            this.url = url;
            this.method = method;
            this.data = data;
            this.options = sn.extend({
                timeout: 5000,
                async: true,
                withCredentials: false,
                ct: 'application/x-www-form-urlencoded'
            }, options || {});
            this.init();
        }
        abort() {
            this.xhr.abort();
            if (this.failCallback)
                this.failCallback(this.xhr.status);
            if (this.alwaysCallback)
                this.alwaysCallback();
        }
        init() {
            try {
                this.xhr = new XMLHttpRequest();
            }
            catch (e) {
                try {
                    this.xhr = new ActiveXObject("Msxml2.XMLHTTP");
                }
                catch (e) {
                    sn.error("XMLHttpRequest not supported");
                    return null;
                }
            }
            if (this.xhr["withCredentials"])
                this.xhr.withCredentials = this.options.withCredentials;
            this.xhr.onreadystatechange = () => {
                if (this.xhr.readyState != 4)
                    return;
                clearTimeout(this.requestTimeout);
                if (this.xhr.status != 200) {
                    if (this.failCallback)
                        this.failCallback(this.xhr.responseText, this.xhr);
                }
                else {
                    if (this.successCallback)
                        this.successCallback(this.xhr.responseText, this.xhr);
                }
                if (this.alwaysCallback)
                    this.alwaysCallback(this.xhr.responseText, this.xhr);
            };
            this.requestTimeout = setTimeout(() => {
                this.abort();
            }, this.options.timeout);
            this.xhr.open(this.method.toUpperCase(), this.url, this.options.async);
            if (this.data) {
                this.xhr.setRequestHeader('Content-type', this.options.ct);
                this.xhr.send(this.data);
            }
            else {
                this.xhr.send(null);
            }
        }
        success(callback) {
            this.successCallback = callback;
            return this;
        }
        fail(callback) {
            this.failCallback = callback;
            return this;
        }
        always(callback) {
            this.alwaysCallback = callback;
            return this;
        }
    }
    sn.RequestObject = RequestObject;
    sn.request = {
        get: function (url, data, options) {
            return new sn.RequestObject("GET", url, data, options);
        },
        post: function (url, data, options) {
            return new sn.RequestObject("POST", url, data, options);
        }
    };
})(sn || (sn = {}));
var sn;
(function (sn) {
    sn.validation = {
        required: function (value) {
            return !sn.isEmpty(value);
        }
    };
})(sn || (sn = {}));
var sn;
(function (sn) {
    class Form {
        constructor(rules) {
            this.$rules = rules || {};
            this.$errors = {};
            this.$pristine = true;
        }
        isValid() {
            for (let e in this.$errors)
                if (!sn.isEmpty(this.$errors[e]))
                    return false;
            return true;
        }
        isPristine() {
            return this.$pristine;
        }
        validateField(fieldName) {
            let errors = [];
            let rules = this.$rules[fieldName];
            if (!sn.isEmpty(rules)) {
                if (!sn.isArray(rules))
                    rules = [rules];
                for (let r in rules) {
                    let validator = rules[r];
                    let assertion = sn.validation[validator](this[fieldName]);
                    if (assertion !== true)
                        errors.push(validator);
                }
            }
            return errors;
        }
        field(name, attributes, options) {
            attributes = sn.extend({
                name: name,
                value: this[name] || "",
                onchange: (event) => {
                    let value = event.target.value;
                    this[name] = value;
                    this.$errors[name] = this.validateField(name);
                    this.$pristine = false;
                }
            }, options || {});
            let tagName = (options) ? "select" : (attributes.multiline === true) ? "textarea" : "input";
            switch (tagName) {
                case "select":
                    break;
                case "input":
                    if (!attributes.type)
                        attributes.type = "text";
                    break;
                case "textarea":
                    delete attributes["multiline"];
                    break;
            }
            return {
                name: "FormField",
                render: function () {
                    return el(tagName, attributes);
                }
            };
        }
    }
    sn.Form = Form;
})(sn || (sn = {}));
var sn;
(function (sn) {
    sn.config = {
        logPrefix: "sn: ",
        debug: true
    };
    function error(message) {
        if (sn.config.debug === true)
            throw new Error(sn.config.logPrefix + message);
    }
    sn.error = error;
    function log(message) {
        if (sn.config.debug === true)
            console.log(sn.config.logPrefix + message);
    }
    sn.log = log;
    function extend(obj1, obj2) {
        if (Object.assign)
            return Object.assign(obj1, obj2);
        return obj1;
    }
    sn.extend = extend;
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
    function isFunction(value) {
        return (typeof value === "function");
    }
    sn.isFunction = isFunction;
    function inArray(arr, value) {
        return arr.indexOf(value) >= 0;
    }
    sn.inArray = inArray;
    function isInteger(value) {
        let x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }
    sn.isInteger = isInteger;
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    sn.guid = guid;
    function isEmpty(value) {
        return !sn.isDefined(value) || value === "" || (sn.isArray(value) && value.length < 1) || (sn.isObject(value) && Object.keys(value).length < 1);
    }
    sn.isEmpty = isEmpty;
    function mount(container, componentDefinition, initArguments) {
        let mountedComponent = sn.vdom.getAttribute(container, "data-sn-component");
        if (mountedComponent && mountedComponent.definition === componentDefinition) {
            mountedComponent.update(initArguments);
        }
        else {
            let component = new sn.Component(componentDefinition);
            component.mount(container, initArguments);
        }
    }
    sn.mount = mount;
    function bind(prop, scope) {
        return function (event) {
            scope[prop] = event.target.value;
        };
    }
    sn.bind = bind;
})(sn || (sn = {}));
//# sourceMappingURL=snapp.js.map