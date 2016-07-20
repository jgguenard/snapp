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
            SET_TEXT_CONTENT: "SET_TEXT_CONTENT",
            SET_EVENT: "SET_EVENT"
        },

        // dom node types
        node: {
            COMMENT: 8,
            ELEMENT: 1,
            TEXT: 3,
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
                        this.setAttribute(operation.target, operation.name, operation.value);
                        break;
                    case sn.vdom.operation.SET_TEXT_CONTENT:
                        operation.target.textContent = operation.value;
                        break;
                }
            }
        },

        // returns differences between 2 virtual nodes
        diff: function(currentNode, desiredNode, ignoreAttribute?: boolean)
        {
            let operations = [];

            // 1. check current attributes
            let currentAttrs = currentNode.attributes || [];
            let desiredAttrs = desiredNode.attributes || {};

            // 2. check desired attributes
            if(!ignoreAttribute) {

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
            }

            // 3. compare text content

            if(desiredNode.nodeType === sn.vdom.node.TEXT)
            {
                if (desiredNode.textContent != currentNode.textContent)
                {
                    operations.push({
                        type: sn.vdom.operation.SET_TEXT_CONTENT,
                        target: currentNode,
                        value: desiredNode.textContent
                    });
                }
            }

            // 4. compare children

            let desiredChildCount = (desiredNode.childNodes) ? desiredNode.childNodes.length : 0;
            let currentChildCount = (currentNode.childNodes) ? currentNode.childNodes.length : 0;

            // compare destination children with source
            for(let c = 0; c < desiredChildCount; c++) {

                let desiredChild = desiredNode.childNodes[c];
                let currentChild = (currentNode.childNodes) ? currentNode.childNodes[c] : null;

                if(!currentChild)
                {
                    // add child
                    if(!sn.isEmpty(desiredChild))
                    {
                        operations.push({
                            type: sn.vdom.operation.APPEND_CHILD,
                            target: currentNode,
                            child: desiredChild
                        });
                    }
                } else if(sn.isEmpty(desiredChild)) {
                    // remove child
                    operations.push({
                        type: sn.vdom.operation.REMOVE_CHILD,
                        target: currentNode,
                        child: currentNode.childNodes[c],
                    });
                } else if(currentChild.nodeType !== desiredChild.nodeType || currentChild["tagName"] !== desiredChild["tagName"]) {
                    if(desiredChild.nodeType !== sn.vdom.node.COMPONENT) // ignore nested components
                    {
                        // replace child
                        operations.push({
                            type: sn.vdom.operation.REPLACE_CHILD,
                            target: currentNode,
                            child: desiredChild,
                            oldChild: currentChild
                        });
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

        // convert a virtual node to a real one
        createRealNode: function(node, scope?)
        {
            let realNode;
            if(node.nodeType === sn.vdom.node.TEXT)
            {
                // TEXT
                realNode = document.createTextNode(node.textContent);
            } else if(node.nodeType === sn.vdom.node.ELEMENT) {
                // DOM ELEMENT
                realNode = document.createElement(node.tagName);

                // set attributes and events
                if (node.attributes) {
                    for (let attrName in node.attributes) {
                        let attrValue = node.attributes[attrName];
                        if(typeof attrValue === 'function')
                            attrValue = attrValue.bind(scope);
                        this.setAttribute(realNode, attrName, attrValue);
                    }
                }

                // create children
                if (node.childNodes) {
                    var virtualContainer = document.createDocumentFragment();
                    for (var a = 0; a < node.childNodes.length; a++) {
                        let child = node.childNodes[a];
                        if(child)
                            virtualContainer.appendChild(this.createRealNode(child, scope));
                    }
                    if (realNode.appendChild) {
                        realNode.appendChild(virtualContainer);
                    }
                }

            } else if(node.nodeType === sn.vdom.node.COMPONENT) {
                // COMPONENT
                realNode = document.createElement("DIV");
                sn.mount(realNode, node.tagName, node.attributes);
            }
            return realNode;
        },

        // create a virtual node from parameters
        createVirtualNode: function(tagName: string | Object, attributes?, childrenOrValue?)
        {
            let node = null;

            // handle case when we receive a string value as a 2nd argument
            if(!sn.isDefined(childrenOrValue) && !sn.isObject(attributes))
            {
                childrenOrValue = attributes;
                attributes = null;
            }

            if(sn.isObject(tagName))
            {
                // component
                node = {
                    nodeType: sn.vdom.node.COMPONENT,
                    tagName: tagName,
                    attributes:  attributes
                };
            } else {

                // dom element
                node = {
                    tagName: tagName.toString().toUpperCase(),
                    nodeType: sn.vdom.node.ELEMENT,
                    attributes:  attributes
                };

                // handle child nodes
                if(sn.isArray(childrenOrValue))
                {
                    node.childNodes = childrenOrValue;
                } else if(sn.isObject(childrenOrValue)) {
                    node.childNodes = [childrenOrValue];
                } else if(!sn.isEmpty(childrenOrValue)) {
                    node.childNodes = [{
                        nodeType: sn.vdom.node.TEXT,
                        textContent: childrenOrValue
                    }];
                }
            }

            node.$virtual = true;

            return node;
        }
    }
}

// shortcut for createVirtualNode
var el = sn.vdom.createVirtualNode;