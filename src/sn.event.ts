namespace sn
{
    export var event = {

        // active observers
        observers: {},

        // trigger a new event
        emit: function(eventName, data?)
        {
            let eventObservers = this.observers[eventName];
            if(eventObservers)
                for(let o in eventObservers)
                    eventObservers[o].callback(data);
        },

        // add event listener
        addListener: function(eventName, callback, priority?)
        {
            if(!this.observers[eventName])
                this.observers[eventName] = [];

            // generate an uid
            let id = sn.guid();

            // add observer to list
            this.observers[eventName].push({
                id: id,
                priority: priority || 1000,
                callback: callback
            });

            // sort by priority
            this.observers[eventName].sort(function(a, b) {
                if(a.priority < b.priority) return -1;
                if(a.priority > b.priority) return 1;
                return 0;
            });

            // return id
            return id;
        },

        // remove all listeners of an event
        removeListeners: function(eventName)
        {
            if(this.observers[eventName])
                this.observers[eventName] = null;
        },

        // remove an event listener
        removeListener: function(eventName, listenerID)
        {
            if(this.observers[eventName])
            {
                for(let o in this.observers[eventName])
                {
                    if(this.observers[o].id === listenerID)
                    {
                        delete this.observers[o];
                        break;
                    }
                }
            }
        },

        stopNativeEvent: function(event)
        {
            if(event.preventDefault){
                event.preventDefault();
                event.stopPropagation()
            } else {
                event.returnValue = false;
                event.cancelBubble = true;
            }
        }

    }
}