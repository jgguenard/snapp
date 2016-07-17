namespace sn
{
    export var vdom = {

        // node operation types
        operation: {
            APPEND_CHILD: 1,
            REPLACE_CHILD: 2,
            REMOVE_CHILD: 3,
            REMOVE_ATTRIBUTE: 4,
            SET_ATTRIBUTE: 5,
            SET_EVENT: 6
        },

        // dom node types
        node: {
            COMMENT: 8,
            ELEMENT: 1,
            TEXT: 3
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
            operations = operations.concat(this.diff(srcNode, dstNode));

            return operations;
        },

        // return operations to make children of a source node look like the ones of the destination
        diff: function(srcNode: Element, dstNode: Element)
        {
            let operations = [];

            let dstChildCount = (dstNode.childNodes) ? dstNode.childNodes.length : 0;

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
                } else if(srcChild.nodeType !== dstChild.nodeType) {
                    // replace child
                    console.log("TODO: replace child");
                } else {
                    // compare children
                    operations = operations.concat(this.diffNode(srcChild, dstChild));
                }
            }
            return operations;
        },

        // apply operations to nodes
        apply: function(operations: Array<any>)
        {
            console.log(operations);
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
                        operation.source.parentNode.replaceChild(operation.source, operation.destination);
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
                realNode = document.createTextNode(node.textContent);
            } else if(node.nodeType === sn.vdom.node.ELEMENT) {
                realNode = document.createElement(node.tagName);
                if (node.attributes) {
                    for (var a = 0; a < node.attributes.length; a++) {
                        var attr = node.attributes[a];
                        this.setAttribute(realNode, attr.name, attr.value);
                    }
                }

                if (node.childNodes) {
                    var virtualContainer = this.createVirtualContainer();
                    for (var a = 0; a < node.childNodes.length; a++) {
                        virtualContainer.appendChild(this.createRealNode(node.childNodes[a]));
                    }
                    if (realNode.appendChild) {
                        realNode.appendChild(virtualContainer);
                    }
                }
            }
            return realNode;
        },

        // create a virtual node from parameters
        createVirtualNode: function(tagName: string, attributes, childNodes)
        {
            var node;

            if(typeof tagName === "object")
            {
                // component
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
                        textContent: childNodes
                    }];
                }
            }
            return node;
        },

        createVirtualContainer: function(node?)
        {
            let container;
            let isVirtualNode = this.isVirtualNode(node);

            if(node || !isVirtualNode)
                container = document.createDocumentFragment();

            if(isVirtualNode === true){
                container = {
                    nodeType: sn.vdom.node.ELEMENT,
                    tagName: "DIV",
                    childNodes: [node]
                }
            } else if(node) {
                for(let c in node.childNodes)
                {
                    let child = node.childNodes[c];
                    if(child.cloneNode) {
                        let clone = child.cloneNode(true);
                        container.appendChild(clone);
                    }
                }
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

// shortcut to create an element
var el = sn.vdom.createVirtualNode;