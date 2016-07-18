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
            if (name === 'class') {
                node.className = value;
            } else if (name === 'style') {
                node.style.cssText = value;
            } else if (name !== 'type' && name in node || typeof value !== 'string') {
                node[name] = value == null ? '' : value;
            } else if (node.setAttribute) {
                node.setAttribute(name, value);
            } else if (node.attributes) {
                node.attributes[name] = value;
            }
        },

        // get value of a DOM attribute
        getAttribute: function(node, name)
        {
            if (name === 'class') {
                return node.className;
            } else if (name === 'style') {
                return node.style.cssText;
            } else if (name !== 'type' && name in node) {
                return node[name];
            } else if (node.getAttribute) {
                return node.getAttribute(name);
            } else if (node.attributes && node.attributes[name]) {
                return node.attributes[name].value;
            }
        },

        // remove/claer a DOM attribute
        removeAttribute: function(node, name)
        {
            if (name === 'class') {
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

        // return operations to make source node equal to destination node
        diffNode: function(srcNode: Element, dstNode: Element)
        {
            let operations = [];

            // check source attributes
            let srcAttributes = srcNode.attributes || [];
            let dstAttributes = dstNode.attributes|| [];
            for (let a = 0; a < srcAttributes.length; a++) {
                let srcAttribute = srcAttributes[a];
                let dstAttribute = dstAttributes[srcAttribute.name];
                let srcAttrValue = this.getAttribute(srcNode, srcAttribute.name);
                let dstAttrValue = this.getAttribute(dstNode, srcAttribute.name);
                if(!dstAttribute)
                {
                    operations.push({
                        type: sn.vdom.operation.REMOVE_ATTRIBUTE,
                        source: srcNode,
                        attribute: { name: srcAttribute.name }
                    });
                } else if(srcAttrValue !== dstAttrValue) {
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        source: srcNode,
                        destination: dstNode,
                        attribute: { name: srcAttribute.name, value: dstAttrValue },
                    });
                }
            }

            // check destination attributes
            for (let a = 0; a < dstAttributes.length; a++) {
                let dstAttribute = dstAttributes[a];
                let srcAttribute = srcAttributes[dstAttribute.name];
                if(!srcAttribute)
                {
                    let dstAttrValue = this.getAttribute(dstNode, dstAttribute.name);
                    operations.push({
                        type: sn.vdom.operation.SET_ATTRIBUTE,
                        source: srcNode,
                        destination: dstNode,
                        attribute: { name: dstAttribute.name, value: dstAttrValue }
                    });
                }
            }

            // check child nodes
            operations = operations.concat(this.diffChildren(srcNode, dstNode));

            return operations;
        },

        // return operations to make children of a source node look like the ones of the destination
        diffChildren: function(srcNode: Element, dstNode: Element)
        {
            let operations = [];

            let dstChildCount = (dstNode.childNodes) ? dstNode.childNodes.length : 0;
            let srcChildCount = (srcNode.childNodes) ? srcNode.childNodes.length : 0;

            // compare destination children with source
            for(let c = 0; c < dstChildCount; c++) {

                let dstChild = dstNode.childNodes[c];
                let srcChild = srcNode.childNodes[c];

                if(!srcChild)
                {
                    // add child
                    operations.push({
                        type: sn.vdom.operation.APPEND_CHILD,
                        source: srcNode,
                        node: dstChild
                    });
                } else if(srcChild.nodeType !== dstChild.nodeType || srcChild["tagName"] || (srcChild["tagName"] !== dstChild["tagName"])) {
                    let isComponent = sn.vdom.getAttribute(srcChild, "data-sn-component");
                    if(!isComponent)
                    {
                        // replace child
                        operations.push({
                            type: sn.vdom.operation.REPLACE_CHILD,
                            source: srcNode,
                            destination: dstChild,
                            node: srcChild
                        });
                    }
                } else {
                    // compare children
                    operations = operations.concat(this.diffNode(srcChild, dstChild));
                }
            }

            // check if we have nodes to remove
            if(dstChildCount < srcChildCount)
            {
                for(let c = dstChildCount; c < srcChildCount; c++) {
                    operations.push({
                        type: sn.vdom.operation.REMOVE_CHILD,
                        source: srcNode,
                        node: srcNode.childNodes[c],
                    });
                }
            }

            return operations;
        },

        // apply operations to nodes
        apply: function(operations: Array<any>)
        {
            for(let o in operations)
            {
                let operation = operations[o];
                switch(operation.type)
                {
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
                        // todo ...
                        break;
                }
            }
        },

        // clone a node (virtual or real)
        cloneNode: function(node)
        {
            if(!node.cloneNode)
            {
                // virtual node
                return this.createRealNode(node);
            } else {
                // real node
                return node.cloneNode(true);
            }
        },

        // convert a virtual node to a real one
        createRealNode: function(node)
        {
            let realNode;
            if(node.nodeType === sn.vdom.node.TEXT)
            {
                // TEXT
                realNode = document.createTextNode(node.textContent);
            } else if(node.nodeType === sn.vdom.node.ELEMENT) {
                // DOM ELEMENT
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
                        if(child)
                            virtualContainer.appendChild(this.createRealNode(child));
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
        createVirtualNode: function(tagName: string, attributes?, childNodes?)
        {
            var node;

            if(typeof tagName === "object")
            {
                // component
                node = {
                    nodeType: sn.vdom.node.COMPONENT,
                    tagName: tagName,
                    attributes:  attributes,
                    virtual: true
                };
            } else {
                // element
                node = {
                    tagName: tagName.toUpperCase(),
                    nodeType: sn.vdom.node.ELEMENT,
                    attributes:  attributes,
                    virtual: true
                };
                // child nodes
                if(Array.isArray(childNodes))
                {
                    node.childNodes = childNodes;
                } else if(typeof childNodes === "object") {
                    node.childNodes = [childNodes];
                } else {
                    node.childNodes = [{
                        nodeType: sn.vdom.node.TEXT,
                        textContent: childNodes,
                        virtual: true
                    }];
                }
            }
            return node;
        },

        // create a container for a node and copy its children
        createContainerFromNode: function(node)
        {
            let container;
            let isVirtual = this.isVirtualNode(node);

            if(!isVirtual)
            {
                container = document.createDocumentFragment();
                if(node)
                    for(let c in node.childNodes)
                    {
                        let child = node.childNodes[c];
                        if(child.cloneNode) {
                            let clone = child.cloneNode(true);
                            container.appendChild(clone);
                        }
                    }
            } else {
                container = this.createVirtualNode("DIV", null, node);
            }

            return container;
        },

        // check if a node is virtual
        isVirtualNode: function(node)
        {
            return (node && node["virtual"] === true);
        }
    }
}