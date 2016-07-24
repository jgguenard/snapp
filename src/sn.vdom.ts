namespace sn
{
    export var vdom = {

        // node operation types
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

        // dom node types
        node: {
            COMMENT: 8,
            ELEMENT: 1,
            TEXT: 3,
            HTML: 98,
            COMPONENT: 99
        },

        // change value of a DOM attribute
        setAttribute: function(node, name, value)
        {
            if(node.$virtual === true)
            {
                node.attributes[name] = value;
            } else if (name === 'class') {
                node.className = value;
            } else if (name === 'style') {
                node.style.cssText = value;
            } else if (name !== 'type' && name in node || typeof value !== 'string') {
                node[name] = value == null ? '' : value;
            } else if (node.setAttribute) {
                node.setAttribute(name, value);
            } else if (node.attributes) {
                node.attributes[name].value = value;
            }
        },

        // get value of a DOM attribute
        getAttribute: function(node, name)
        {
            if(node.$virtual === true)
            {
                return node.attributes[name];
            } else if (name === 'class') {
                return node.className;
            } else if (name === 'style') {
                return node.style.cssText;
            } else if (name !== 'type' && name in node) {
                return node[name];
            } else if (node.getAttribute) {
                return node.getAttribute(name);
            } else if (node.attributes) {
                return node.attributes[name].value;
            }
            return null;
        },

        // remove/claer a DOM attribute
        removeAttribute: function(node, name)
        {
            if(node.$virtual === true)
            {
                delete node.attributes[name];
            } else if (name === 'class') {
                node.className = '';
            } else if (name === 'style') {
                node.style.cssText = '';
                // most things
            } else if (name !== 'type' && name in node) {
                node[name] = '';
                // real DOM elements
            } else if (node.removeAttribute) {
                node.removeAttribute(name);
            } else if (node.attributes) {
                delete node.attributes[name];
            }
        },

        // apply a series of operations
        patch: function(operations: Array<any>, scope?)
        {
            for(let o in operations)
            {
                let operation = operations[o];
                switch(operation.type)
                {
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
                        if(typeof operation.value === 'function')
                            operation.value = operation.value.bind(scope);
                        this.setAttribute(operation.target, operation.name, operation.value);
                        break;
                }
            }
        },

        // diff attributes
        diffAttributes: function(currentNode, desiredNode)
        {
            let operations = [];

            let currentAttrs = currentNode.attributes || [];
            let desiredAttrs = desiredNode.attributes || {};

            // check current attributes
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
                } else if (currentAttrValue !== desiredAttrValue) {
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        target: currentNode,
                        name: currentAttr.name,
                        value: desiredAttrValue
                    });
                }
            }

            // check desired attributes
            for (let desiredAttr in desiredAttrs) {

                let found = false;
                for (let a = 0; a < currentAttrs.length; a++) {
                    if(currentAttrs[a].name === desiredAttr)
                    {
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

        diffChildren: function(currentNode, desiredNode)
        {
            let operations = [];

            let desiredChildNodes = [];
            if(desiredNode.childNodes)
            {
                desiredNode.childNodes.map((item) => {
                    if(sn.isArray(item))
                        desiredChildNodes = desiredChildNodes.concat(item);
                    else
                        desiredChildNodes.push(item);
                });
            }

            let desiredChildCount = desiredChildNodes.length;
            let currentChildCount = (currentNode.childNodes) ? currentNode.childNodes.length : 0;

            // compare destination children with source
            for(let c = 0; c < desiredChildCount; c++) {

                let desiredChild = desiredChildNodes[c];
                let currentChild = (currentNode.childNodes) ? currentNode.childNodes[c] : null;

                // convert strings to text node
                if(!sn.isObject(desiredChild))
                {
                    desiredChild = {
                        nodeType: sn.vdom.node.TEXT,
                        textContent: desiredChild,
                        attributes: {},
                        childNodes: []
                    }
                }

                if (!currentChild) {
                    // add child
                    if (!sn.isEmpty(desiredChild)) {
                        operations.push({
                            type: sn.vdom.operation.APPEND_CHILD,
                            target: currentNode,
                            child: desiredChild
                        });
                    }
                } else if (sn.isEmpty(desiredChild)) {
                    // remove child
                    operations.push({
                        type: sn.vdom.operation.REMOVE_CHILD,
                        target: currentNode,
                        child: currentNode.childNodes[c],
                    });
                } else if (currentChild.nodeType !== desiredChild.nodeType || currentChild["tagName"] !== desiredChild["tagName"]) {

                    // detect mounted component to avoid diffing a nested component
                    let desiredChildIsComponent = desiredChild.nodeType === sn.vdom.node.COMPONENT;
                    let currentComponent = this.getAttribute(currentChild, "data-sn-component");
                    if (
                        !desiredChildIsComponent ||
                        (currentComponent && !sn.component.hasDefinition(currentComponent, desiredChild.definition))
                    ) {
                        // either 1 of the children is not a component or they are different components so
                        // let's replace child
                        if(desiredChild.nodeType !== sn.vdom.node.HTML)
                        {
                            // replacing node
                            operations.push({
                                type: sn.vdom.operation.REPLACE_CHILD,
                                target: currentNode,
                                child: desiredChild,
                                oldChild: currentChild
                            });
                        } else if(desiredChild.innerHTML != currentChild.outerHTML) {
                            // otherwise compare html content
                            operations.push({
                                type: sn.vdom.operation.SET_ATTRIBUTE,
                                target: currentNode,
                                name: "innerHTML",
                                value: desiredChild.innerHTML
                            });
                        }
                    } else if(currentComponent) {
                        // nested component might still need to be rendered
                        sn.component.requestComponentRendering(currentComponent);
                    }
                } else {
                    // compare children
                    operations = operations.concat(this.diff(currentChild, desiredChild));
                }
            }

            // check if we have nodes to remove
            if(desiredChildCount < currentChildCount)
            {
                for(let c = desiredChildCount; c < currentChildCount; c++) {
                    operations.push({
                        type: sn.vdom.operation.REMOVE_CHILD,
                        target: currentNode,
                        child: currentNode.childNodes[c],
                    });
                }
            }

            return operations;
        },

        // returns differences between 2 virtual nodes
        diff: function(currentNode, desiredNode, ignoreAttribute?: boolean)
        {
            let operations = [];

            // 1. compare attributes
            if(!ignoreAttribute)
                operations = operations.concat(this.diffAttributes(currentNode, desiredNode));

            // 2. compare content if desired node is not an element or a component
            if(desiredNode.nodeType === sn.vdom.node.TEXT)
            {
                let desiredTextContent = this.getAttribute(desiredNode, "textContent");
                if (desiredTextContent != this.getAttribute(currentNode, "textContent"))
                {
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        target: currentNode,
                        name: "textContent",
                        value: desiredTextContent
                    });
                }
            } else if(desiredNode.nodeType === sn.vdom.node.HTML) {
                let desiredInnerHTML = this.getAttribute(desiredNode, "innerHTML");
                if (desiredInnerHTML != this.getAttribute(currentNode, "innerHTML"))
                {
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        target: currentNode,
                        name: "innerHTML",
                        value: desiredInnerHTML
                    });
                }
            }

            // 3. compare children
            operations = operations.concat(this.diffChildren(currentNode, desiredNode));

            return operations;
        },

        // convert a virtual node to a real one
        createRealNode: function(node, scope?)
        {
            let realNode;
            if(node.nodeType === sn.vdom.node.TEXT || node.nodeType === sn.vdom.node.HTML)
            {
                // TEXT or HTML
                realNode = document.createTextNode(node.textContent);
            } else if(node.nodeType === sn.vdom.node.ELEMENT) {

                // DOM ELEMENT
                realNode = document.createElement(node.tagName);

                // create children
                if (node.childNodes.length > 0) {
                    var virtualContainer = document.createDocumentFragment();
                    var innerHTML = "";

                    // recursive child processor
                    let processChild = (child) => {
                        if(!sn.isEmpty(child))
                        {
                            if (sn.isArray(child)) {
                                // child is an array of node so let's unpack it
                                child.map((item) => {
                                    processChild(item);
                                });
                            } else if (!sn.isObject(child)) {
                                // child must be a string, so let's convert it to text
                                processChild({
                                    nodeType: sn.vdom.node.TEXT,
                                    textContent: child,
                                    attributes: {},
                                    childNodes: []
                                });
                            } else if (child.nodeType === sn.vdom.node.HTML) {
                                innerHTML += child.innerHTML;
                            } else {
                                // child is an element
                                virtualContainer.appendChild(this.createRealNode(child, scope));
                            }
                        }
                    }

                    // process all children
                    node.childNodes.map(processChild);

                    if(innerHTML !== "")
                    {
                        // innerHTML attribute should prevail over other child nodes
                        node.attributes.innerHTML = innerHTML;
                    } else if (realNode.appendChild) {
                        // regular case
                        realNode.appendChild(virtualContainer);
                    }
                }

                // set attributes and events
                for (let attrName in node.attributes) {
                    let attrValue = node.attributes[attrName];
                    if(typeof attrValue === 'function')
                        attrValue = attrValue.bind(scope);
                    this.setAttribute(realNode, attrName, attrValue);
                }

            } else if(node.nodeType === sn.vdom.node.COMPONENT) {
                // COMPONENT
                realNode = document.createElement("DIV");
                sn.mount(realNode, node.definition, node.attributes);
            }

            return realNode;
        },

        // create a virtual node from parameters
        createVirtualNode: function(tagNameOrContent, attributes?, childrenOrValue?)
        {
            let node = null;

            // reject bad values
            if(!sn.inArray(["string", "object"], typeof tagNameOrContent) || sn.isEmpty(tagNameOrContent))
                return sn.error("Expecting a non-empty string or Object as first argument of el()");

            // when 2nd argument is not a set of attributes
            if(
                !sn.isDefined(childrenOrValue) && sn.isDefined(attributes) &&
                (sn.isArray(attributes) || !sn.isObject(attributes) || attributes.$virtual === true)
            ) {
                childrenOrValue = sn.copy(attributes);
                attributes = {};
            } else {
                attributes = attributes || {};
            }

            // if 1st argument is an object, process it as a component
            if(sn.isObject(tagNameOrContent))
            {
                // make sure component has a unique id
                if(!tagNameOrContent.$cdid)
                    tagNameOrContent.$cdid = sn.guid("snc");
                // create node
                node = {
                    nodeType: sn.vdom.node.COMPONENT,
                    definition: tagNameOrContent
                };
            } else {

                let tagNameUC = tagNameOrContent.toString().toUpperCase();

                // if 1st arg is not a valid HTML tag name, treat it as content
                if(!sn.inArray(sn.vdom.allowedTagName, tagNameUC))
                {
                    if(attributes.html === true)
                    {
                        // html content
                        node = {
                            nodeType: sn.vdom.node.HTML,
                            innerHTML: tagNameOrContent
                        };
                        delete attributes.html;
                    } else {
                        // text content
                        node = {
                            nodeType: sn.vdom.node.TEXT,
                            textContent: tagNameOrContent
                        };
                    }
                } else {
                    // dom element
                    node = {
                        nodeType: sn.vdom.node.ELEMENT,
                        tagName: tagNameUC
                    };

                    // handle child nodes
                    if(sn.isArray(childrenOrValue))
                    {
                        // array of children
                        node.childNodes = childrenOrValue;
                    } else if(!sn.isEmpty(childrenOrValue)) {
                        // single child must be converted to an array
                        node.childNodes = [childrenOrValue];
                    } else {
                        node.childNodes = [];
                    }
                }
            }

            // mark it as virtual
            node.$virtual = true;

            // set attributes
            node.attributes = attributes;

            return node;
        }
    }
}

// shortcut for createVirtualNode
var el = sn.vdom.createVirtualNode;