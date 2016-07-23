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
        allowedTagName: [
            'A', 'ABBR', 'ADDRESS', 'AREA', 'ARTICLE', 'ASIDE', 'AUDIO', 'B', 'BASE', 'BDI', 'BDO', 'BGSOUND',
            'BLOCKQUOTE', 'BODY', 'BR', 'BUTTON', 'CANVAS', 'CAPTION', 'CITE', 'CODE', 'COL', 'COLGROUP', 'COMMAND',
            'CONTENT', 'DATA', 'DATALIST', 'DD', 'DEL', 'DETAILS', 'DFN', 'DIALOG', 'DIV', 'DL', 'DT', 'ELEMENT', 'EM',
            'EMBED', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FONT', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
            'HEAD', 'HEADER', 'HGROUP', 'HR', 'HTML', 'I', 'IFRAME', 'IMAGE', 'IMG', 'INPUT', 'INS', 'KBD', 'KEYGEN',
            'LABEL', 'LEGEND', 'LI', 'LINK', 'MAIN', 'MAP', 'MARK', 'MARQUEE', 'MENU', 'MENUITEM', 'META', 'METER',
            'MULTICOL', 'NAV', 'NOBR', 'NOEMBED', 'NOFRAMES', 'NOSCRIPT', 'OBJECT', 'OL', 'OPTGROUP', 'OPTION',
            'OUTPUT', 'P', 'PARAM', 'PICTURE', 'PRE', 'PROGRESS', 'Q', 'RP', 'RT', 'RTC', 'RUBY', 'S', 'SAMP', 'SCRIPT',
            'SECTION', 'SELECT', 'SHADOW', 'SMALL', 'SOURCE', 'SPAN', 'STRONG', 'STYLE', 'SUB', 'SUMMARY', 'SUP', 'TABLE',
            'TBODY', 'TD', 'TEMPLATE', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TIME', 'TITLE', 'TR', 'TRACK', 'U', 'UL',
            'VAR', 'VIDEO', 'WBR'
        ],
        node: {
            COMMENT: 8,
            ELEMENT: 1,
            TEXT: 3,
            HTML: 98,
            COMPONENT: 99
        },
        setAttribute: function (node, name, value) {
            if (node.$virtual === true) {
                node.attributes[name] = value;
            }
            else if (name === 'class') {
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
                node.attributes[name].value = value;
            }
        },
        getAttribute: function (node, name) {
            if (node.$virtual === true) {
                return node.attributes[name];
            }
            else if (name === 'class') {
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
                return node.attributes[name].value;
            }
            return null;
        },
        removeAttribute: function (node, name) {
            if (node.$virtual === true) {
                delete node.attributes[name];
            }
            else if (name === 'class') {
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
                        if (typeof operation.value === 'function')
                            operation.value = operation.value.bind(scope);
                        this.setAttribute(operation.target, operation.name, operation.value);
                        break;
                }
            }
        },
        diffAttributes: function (currentNode, desiredNode) {
            let operations = [];
            let currentAttrs = currentNode.attributes || [];
            let desiredAttrs = desiredNode.attributes || {};
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
            return operations;
        },
        diffChildren: function (currentNode, desiredNode) {
            let operations = [];
            let desiredChildNodes = [];
            if (desiredNode.childNodes) {
                desiredNode.childNodes.map((item) => {
                    if (sn.isArray(item))
                        desiredChildNodes = desiredChildNodes.concat(item);
                    else
                        desiredChildNodes.push(item);
                });
            }
            let desiredChildCount = desiredChildNodes.length;
            let currentChildCount = (currentNode.childNodes) ? currentNode.childNodes.length : 0;
            for (let c = 0; c < desiredChildCount; c++) {
                let desiredChild = desiredChildNodes[c];
                let currentChild = (currentNode.childNodes) ? currentNode.childNodes[c] : null;
                if (!sn.isObject(desiredChild)) {
                    desiredChild = {
                        nodeType: sn.vdom.node.TEXT,
                        textContent: desiredChild,
                        attributes: {},
                        childNodes: []
                    };
                }
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
                    let desiredChildIsComponent = desiredChild.nodeType === sn.vdom.node.COMPONENT;
                    let currentComponent = this.getAttribute(currentChild, "data-sn-component");
                    if (!desiredChildIsComponent ||
                        (currentComponent && !sn.component.hasDefinition(currentComponent, desiredChild.definition))) {
                        if (desiredChild.nodeType !== sn.vdom.node.HTML) {
                            operations.push({
                                type: sn.vdom.operation.REPLACE_CHILD,
                                target: currentNode,
                                child: desiredChild,
                                oldChild: currentChild
                            });
                        }
                        else if (desiredChild.innerHTML != currentChild.outerHTML) {
                            operations.push({
                                type: sn.vdom.operation.SET_ATTRIBUTE,
                                target: currentNode,
                                name: "innerHTML",
                                value: desiredChild.innerHTML
                            });
                        }
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
        diff: function (currentNode, desiredNode, ignoreAttribute) {
            let operations = [];
            if (!ignoreAttribute)
                operations = operations.concat(this.diffAttributes(currentNode, desiredNode));
            if (desiredNode.nodeType === sn.vdom.node.TEXT) {
                let desiredTextContent = this.getAttribute(desiredNode, "textContent");
                if (desiredTextContent != this.getAttribute(currentNode, "textContent")) {
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        target: currentNode,
                        name: "textContent",
                        value: desiredTextContent
                    });
                }
            }
            else if (desiredNode.nodeType === sn.vdom.node.HTML) {
                let desiredInnerHTML = this.getAttribute(desiredNode, "innerHTML");
                if (desiredInnerHTML != this.getAttribute(currentNode, "innerHTML")) {
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        target: currentNode,
                        name: "innerHTML",
                        value: desiredInnerHTML
                    });
                }
            }
            operations = operations.concat(this.diffChildren(currentNode, desiredNode));
            return operations;
        },
        createRealNode: function (node, scope) {
            let realNode;
            if (node.nodeType === sn.vdom.node.TEXT || node.nodeType === sn.vdom.node.HTML) {
                realNode = document.createTextNode(node.textContent);
            }
            else if (node.nodeType === sn.vdom.node.ELEMENT) {
                realNode = document.createElement(node.tagName);
                if (node.childNodes.length > 0) {
                    var virtualContainer = document.createDocumentFragment();
                    var innerHTML = "";
                    let processChild = (child) => {
                        if (!sn.isEmpty(child)) {
                            if (sn.isArray(child)) {
                                child.map((item) => {
                                    processChild(item);
                                });
                            }
                            else if (!sn.isObject(child)) {
                                processChild({
                                    nodeType: sn.vdom.node.TEXT,
                                    textContent: child,
                                    attributes: {},
                                    childNodes: []
                                });
                            }
                            else if (child.nodeType === sn.vdom.node.HTML) {
                                innerHTML += child.innerHTML;
                            }
                            else {
                                virtualContainer.appendChild(this.createRealNode(child, scope));
                            }
                        }
                    };
                    node.childNodes.map(processChild);
                    if (innerHTML !== "") {
                        node.attributes.innerHTML = innerHTML;
                    }
                    else if (realNode.appendChild) {
                        realNode.appendChild(virtualContainer);
                    }
                }
                for (let attrName in node.attributes) {
                    let attrValue = node.attributes[attrName];
                    if (typeof attrValue === 'function')
                        attrValue = attrValue.bind(scope);
                    this.setAttribute(realNode, attrName, attrValue);
                }
            }
            else if (node.nodeType === sn.vdom.node.COMPONENT) {
                realNode = document.createElement("DIV");
                sn.mount(realNode, node.definition, node.attributes);
            }
            return realNode;
        },
        createVirtualNode: function (tagNameOrContent, attributes, childrenOrValue) {
            let node = null;
            if (!sn.inArray(["string", "object"], typeof tagNameOrContent) || sn.isEmpty(tagNameOrContent))
                return sn.error("Expecting a non-empty string or Object as first argument of el()");
            if (!sn.isDefined(childrenOrValue) && sn.isDefined(attributes) &&
                (sn.isArray(attributes) || !sn.isObject(attributes) || attributes.$virtual === true)) {
                childrenOrValue = sn.copy(attributes);
                attributes = {};
            }
            else {
                attributes = attributes || {};
            }
            if (sn.isObject(tagNameOrContent)) {
                if (!tagNameOrContent.$cdid)
                    tagNameOrContent.$cdid = sn.guid("snc");
                node = {
                    nodeType: sn.vdom.node.COMPONENT,
                    definition: tagNameOrContent
                };
            }
            else {
                let tagNameUC = tagNameOrContent.toString().toUpperCase();
                if (!sn.inArray(sn.vdom.allowedTagName, tagNameUC)) {
                    if (attributes.html === true) {
                        node = {
                            nodeType: sn.vdom.node.HTML,
                            innerHTML: tagNameOrContent
                        };
                        delete attributes.html;
                    }
                    else {
                        node = {
                            nodeType: sn.vdom.node.TEXT,
                            textContent: tagNameOrContent
                        };
                    }
                }
                else {
                    node = {
                        nodeType: sn.vdom.node.ELEMENT,
                        tagName: tagNameUC
                    };
                    if (sn.isArray(childrenOrValue)) {
                        node.childNodes = childrenOrValue;
                    }
                    else if (!sn.isEmpty(childrenOrValue)) {
                        node.childNodes = [childrenOrValue];
                    }
                    else {
                        node.childNodes = [];
                    }
                }
            }
            node.$virtual = true;
            node.attributes = attributes;
            return node;
        }
    };
})(sn || (sn = {}));
var el = sn.vdom.createVirtualNode;
var sn;
(function (sn) {
    sn.event = {
        observers: {},
        emit: function (eventName, data) {
            let eventObservers = this.observers[eventName];
            if (eventObservers)
                for (let o in eventObservers)
                    eventObservers[o].callback(data);
        },
        addListener: function (eventName, callback, priority) {
            if (!this.observers[eventName])
                this.observers[eventName] = [];
            let id = sn.guid();
            this.observers[eventName].push({
                id: id,
                priority: priority || 1000,
                callback: callback
            });
            this.observers[eventName].sort(function (a, b) {
                if (a.priority < b.priority)
                    return -1;
                if (a.priority > b.priority)
                    return 1;
                return 0;
            });
            return id;
        },
        removeListeners: function (eventName) {
            if (this.observers[eventName])
                this.observers[eventName] = null;
        },
        removeListener: function (eventName, listenerID) {
            if (this.observers[eventName]) {
                for (let o in this.observers[eventName]) {
                    if (this.observers[o].id === listenerID) {
                        delete this.observers[o];
                        break;
                    }
                }
            }
        }
    };
})(sn || (sn = {}));
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
                        sn.event.emit("sn.route.update", rule);
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
        hasDefinition: function (component, definition) {
            return (component.definition.$cdid === definition.$cdid);
        },
        getIdentifier(component) {
            return component.definition.name ? component.definition.name : component.definition.$cdid;
        },
        abortComponentRendering: function (component) {
            if (component.$pendingRendering) {
                sn.log("Ignoring rendering request of component <" + sn.component.getIdentifier(component) + ">");
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
        observablePropertyChanged: function (component, scopeID, scope, prop, newValue, oldValue) {
            sn.log("Rendering component <" + sn.component.getIdentifier(component) +
                "> triggered by <" + prop.toString() + "> of scope <!" + scopeID + ">");
            this.requestComponentRendering(component);
            let observers = (scope.$observers) ? scope.$observers[prop] : null;
            if (observers)
                for (let o in observers)
                    observers[o](newValue, oldValue);
        },
        observe: function (prop, scope, callback) {
            if (!scope.$observers)
                scope.$observers = {};
            if (!scope.$observers[prop])
                scope.$observers[prop] = [];
            scope.$observers[prop].push(callback);
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
                    let oldValue = obj[prop];
                    if (typeof value === "object" && !prop.toString().startsWith("$")) {
                        value = component.createScope(value);
                    }
                    obj[prop] = value;
                    if ((value !== oldValue) && !sn.isFunction(value) && sn.inArray(component.observables, propID))
                        sn.component.observablePropertyChanged(component, scopeID, obj, prop, value, oldValue);
                    return true;
                }
            });
        }
        mount(container, ctrlArguments) {
            sn.log("Mounting component <" + sn.component.getIdentifier(this) + ">");
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
            sn.log("Component <" + sn.component.getIdentifier(this) + "> mounted");
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
            sn.log("Component <" + sn.component.getIdentifier(this) + "> initialized");
        }
        update(ctrlArguments) {
            this.controller("update", ctrlArguments);
            sn.component.requestComponentRendering(this);
            sn.log("Component <" + sn.component.getIdentifier(this) + "> updated");
        }
        render() {
            if (this.definition.render) {
                let desiredContent = this.definition.render.call(this.scope);
                let desiredView = sn.vdom.createVirtualNode(this.container.tagName, null, desiredContent);
                let operations = sn.vdom.diff(this.container, desiredView, true);
                sn.vdom.patch(operations, this.scope);
                sn.log("Component <" + sn.component.getIdentifier(this) + "> rendered");
            }
        }
        dispose() {
            sn.component.abortComponentRendering(this);
            if (this.definition.dispose)
                this.definition.dispose.call(this.scope);
            sn.log("Component <" + sn.component.getIdentifier(this) + "> unmounted");
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
                dataType: "JSON",
                withCredentials: false,
                ct: 'application/x-www-form-urlencoded'
            }, options || {});
            this.init();
        }
        prepareParams(obj, prefix) {
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                    str.push(typeof v == "object"
                        ? this.prepareParams(v, k)
                        : encodeURIComponent(k) + "=" + encodeURIComponent(v));
                }
            }
            return str.join("&");
        }
        stringToJSON(data) {
            return JSON.parse(data);
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
                    let response = this.xhr.responseText;
                    if (this.options.dataType === "JSON")
                        response = this.stringToJSON(response);
                    if (this.successCallback)
                        this.successCallback(response, this.xhr);
                }
                if (this.alwaysCallback)
                    this.alwaysCallback(this.xhr.responseText, this.xhr);
            };
            this.requestTimeout = setTimeout(() => {
                this.abort();
            }, this.options.timeout);
            let method = this.method.toUpperCase();
            let url = this.url + ((this.data && method === "GET") ? "?" + this.prepareParams(this.data) : "");
            this.xhr.open(method, url, this.options.async);
            if (method === "POST" && this.data) {
                this.xhr.setRequestHeader('Content-type', this.options.ct);
                this.xhr.send(this.prepareParams(this.data));
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
        },
        length: function (value, args) {
            return value.length == args[0];
        },
        minlength: function (value, args) {
            return value.length >= args[0];
        },
        maxlength: function (value, args) {
            return value.length <= args[0];
        },
        min: function (value, args) {
            return !isNaN(value) && parseFloat(value) >= args[0];
        },
        max: function (value, args) {
            return !isNaN(value) && parseFloat(value) <= args[0];
        },
        between: function (value, args) {
            if (isNaN(value))
                return false;
            let v = parseFloat(value);
            return (v >= args[0] && v <= args[1]);
        },
        email: function (value) {
            let regex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
            return regex.test(value);
        },
        url: function (value) {
            let regex = new RegExp("^" +
                "(?:(?:https?|ftp)://)?" +
                "(?:\\S+(?::\\S*)?@)?" + "(?:" +
                "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" + "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" + "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" + "|" +
                '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
                '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
                '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' + ")" +
                "(?::\\d{2,5})?" +
                "(?:/\\S*)?" + "$", 'i');
            return regex.test(value);
        },
        alphanum: function (value) {
            let regex = /^\w+$/i;
            return regex.test(value);
        },
        digits: function (value) {
            let regex = /^\d+$/;
            return regex.test(value);
        },
        number: function (value) {
            let regex = /^-?(\d*\.)?\d+(e[-+]?\d+)?$/i;
            return regex.test(value);
        },
        integer: function (value) {
            let regex = /^-?\d+$/;
            return regex.test(value);
        }
    };
})(sn || (sn = {}));
var sn;
(function (sn) {
    {
    }
})(sn || (sn = {}));
var sn;
(function (sn) {
    function form(fieldsOptions, initialData) {
        return new sn.FormObject(fieldsOptions, initialData);
    }
    sn.form = form;
    sn.FormField = {
        name: "FormField",
        init: function (form, name, attributes, options) {
            this.value = form[name] || "";
            sn.component.observe(name, form, (newValue, oldValue) => {
                this.value = newValue;
            });
        },
        update: function (form, name, attributes, options) {
            this.$form = form;
            this.$options = sn.extend({
                updateEvent: "onchange",
                updateDebounce: 0,
                choices: null,
                multiline: false
            }, options || {});
            this.$attributes = sn.extend({
                name: name,
            }, attributes || {});
            let updateHandler = (event) => {
                let value = event.target.value;
                this.$form.setFieldValue(name, value);
                this.$form.setPristine(false);
            };
            let timer;
            this.$attributes[this.$options.updateEvent] = (this.$options.updateDebounce) ? (event) => {
                clearTimeout(timer);
                timer = setTimeout(updateHandler.bind(this, event), this.$options.updateDebounce);
            } : updateHandler;
        },
        render: function () {
            var attributes = sn.copy(this.$attributes);
            let css_classes = (!sn.isEmpty(attributes["class"] || "")) ? attributes["class"] + " " : "";
            if (!sn.isEmpty(this.$form.$errors[attributes.name])) {
                css_classes += sn.config.form.invalidPrefix;
                this.$form.$errors[attributes.name].map((item) => {
                    css_classes += " " + sn.config.form.invalidPrefix + "-" + item.replace("_", "-");
                });
            }
            else {
                css_classes += sn.config.form.validPrefix;
            }
            attributes["class"] = css_classes;
            let tagName = (this.$options.choices)
                ? "SELECT" : (this.$options.multiline === true) ? "TEXTAREA" : "INPUT";
            let children = [];
            if (tagName === "SELECT") {
                for (let key in this.$options.choices) {
                    let selected = (key == this.value);
                    children.push(el("option", { value: key, selected: selected }, this.$options.choices[key]));
                }
            }
            else {
                if (tagName === "INPUT") {
                    if (!attributes.type)
                        attributes.type = "text";
                    if (attributes.type === "checkbox") {
                        attributes.checked = (this.$options.value == this.value);
                        attributes.value = this.$options.value;
                    }
                    else if (attributes.type === "radio") {
                        attributes.checked = (attributes.value == this.value);
                    }
                    else {
                        attributes.value = this.value;
                    }
                }
                else {
                    attributes.value = this.value;
                }
            }
            return el(tagName, attributes, children);
        }
    };
    class FormObject {
        constructor(fieldsOptions, initialData) {
            this.$fields = fieldsOptions || {};
            this.$errors = {};
            this.$pristine = true;
            if (sn.isDefined(initialData))
                this.setFieldsValue(initialData);
        }
        serialize() {
            let data = {};
            for (let key in this.$fields) {
                data[key] = this[key];
            }
            return data;
        }
        setPristine(value) {
            this.$pristine = (value === true);
        }
        setFieldValue(name, value) {
            this[name] = value;
            this.validateField(name, value);
        }
        setFieldsValue(data) {
            for (let key in data)
                this.setFieldValue(key, data[key]);
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
        validateField(fieldName, fieldValue) {
            let errors = [];
            if (this.$fields[fieldName]) {
                let rules = this.$fields[fieldName].validation;
                if (!sn.isEmpty(rules)) {
                    if (!sn.isArray(rules))
                        rules = [rules];
                    for (let r in rules) {
                        let validator = rules[r].toString().toLowerCase();
                        let args = null;
                        let argsIndex = validator.indexOf(":");
                        if (argsIndex > 0) {
                            args = validator.substring(argsIndex + 1).split(",");
                            validator = validator.substring(0, argsIndex);
                        }
                        if (sn.validation[validator]) {
                            let assertion = sn.validation[validator](fieldValue, args, fieldName, this);
                            if (assertion !== true)
                                errors.push(validator);
                        }
                    }
                }
            }
            this.$errors[fieldName] = errors;
            return (errors.length < 0);
        }
        field(name, attributes) {
            return el(sn.FormField, { form: this, name: name, attributes: attributes, options: this.$fields[name] });
        }
    }
    sn.FormObject = FormObject;
})(sn || (sn = {}));
var sn;
(function (sn) {
    sn.version = "0.1";
    sn.config = {
        logPrefix: "sn: ",
        debug: true,
        form: {
            invalidPrefix: "sn-invalid",
            validPrefix: "sn-valid"
        }
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
    function extend(src, extra) {
        if (arguments.length <= 1)
            return src;
        if (Object.assign)
            return Object.assign(src, extra);
        for (var key in extra) {
            if (extra.hasOwnProperty(key)) {
                src[key] = extra[key];
            }
        }
        return src;
    }
    sn.extend = extend;
    function copy(src, _visited) {
        if (!sn.isDefined(src) || !sn.isObject(src)) {
            return src;
        }
        if (_visited == undefined) {
            _visited = [];
        }
        else {
            var i, len = _visited.length;
            for (i = 0; i < len; i++) {
                if (src === _visited[i]) {
                    return src;
                }
            }
        }
        _visited.push(src);
        if (typeof src.clone == 'function') {
            return src.clone(true);
        }
        if (Object.prototype.toString.call(src) == '[object Array]') {
            ret = src.slice();
            var i = ret.length;
            while (i--) {
                ret[i] = sn.copy(ret[i], _visited);
            }
            return ret;
        }
        if (src instanceof Date) {
            return new Date(src.getTime());
        }
        if (src instanceof RegExp) {
            return new RegExp(src);
        }
        if (src.nodeType && typeof src.cloneNode == 'function') {
            return src.cloneNode(true);
        }
        var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src) : src.__proto__);
        if (!proto) {
            proto = src.constructor.prototype;
        }
        var ret = sn.createObject(proto);
        for (var key in src) {
            ret[key] = sn.copy(src[key], _visited);
        }
        return ret;
    }
    sn.copy = copy;
    function createObject(prototype) {
        if (Object.create)
            return Object.create(prototype);
        function F() { }
        F.prototype = prototype;
        return new F();
    }
    sn.createObject = createObject;
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
    function isEmpty(value) {
        return !sn.isDefined(value) || value === "" || (sn.isArray(value) && value.length < 1) ||
            (sn.isObject(value) && Object.keys(value).length < 1);
    }
    sn.isEmpty = isEmpty;
    function guid(prefix) {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return (prefix || "") + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    sn.guid = guid;
    function mount(container, componentDefinition, initArguments) {
        let mountedComponent = sn.vdom.getAttribute(container, "data-sn-component");
        if (mountedComponent && sn.component.hasDefinition(mountedComponent, componentDefinition)) {
            mountedComponent.update(initArguments);
        }
        else {
            let component = new sn.Component(componentDefinition);
            component.mount(container, initArguments);
        }
    }
    sn.mount = mount;
})(sn || (sn = {}));
//# sourceMappingURL=snapp.js.map