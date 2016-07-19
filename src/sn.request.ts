namespace sn
{
    export class RequestObject
    {
        private options;
        private xhr;
        private method;
        private url;
        private data;
        private requestTimeout;
        private successCallback: Function;
        private failCallback: Function;
        private alwaysCallback: Function;

        constructor(method, url, data, options)
        {
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

        // abort request
        abort()
        {
            this.xhr.abort();
            // execute fail callback
            if(this.failCallback) this.failCallback(this.xhr.status);
            // execute always callback
            if(this.alwaysCallback) this.alwaysCallback();
        }

        // create and send request
        init()
        {
            try
            {
                this.xhr = new XMLHttpRequest();
            } catch(e){
                try{
                    this.xhr = new ActiveXObject("Msxml2.XMLHTTP");
                }catch (e){
                    sn.error("XMLHttpRequest not supported");
                    return null;
                }
            }

            // allow support for cookies
            if(this.xhr["withCredentials"])
                this.xhr.withCredentials = this.options.withCredentials;

            // response handler
            this.xhr.onreadystatechange = () =>
            {
                if (this.xhr.readyState != 4) return;

                clearTimeout(this.requestTimeout);

                if(this.xhr.status != 200)
                {
                    // execute fail callback
                    if(this.failCallback) this.failCallback(this.xhr.responseText, this.xhr);
                } else {
                    // execute success callback
                    if(this.successCallback) this.successCallback(this.xhr.responseText, this.xhr);
                }

                // execute always callback
                if(this.alwaysCallback) this.alwaysCallback(this.xhr.responseText, this.xhr);
            }

            // timeout
            this.requestTimeout = setTimeout(() => {
                // abort request
                this.abort();
            }, this.options.timeout);

            // connect
            this.xhr.open(this.method.toUpperCase(), this.url, this.options.async);

            // send the request
            if(this.data)
            {
                this.xhr.setRequestHeader('Content-type', this.options.ct);
                this.xhr.send(this.data);
            } else {
                this.xhr.send(null);
            }
        }

        // set onSucces callback
        success(callback: Function)
        {
            this.successCallback = callback;
            return this;
        }

        // set onError callback
        fail(callback: Function)
        {
            this.failCallback = callback;
            return this;
        }

        // set callback that will be executed no matter what happens
        always(callback: Function)
        {
            this.alwaysCallback = callback;
            return this;
        }
    }

    export var request = {

        // GET request
        get: function(url, data?, options?)
        {
            return new sn.RequestObject("GET", url, data, options);
        },

        // POST request
        post: function(url, data?, options?)
        {
            return new sn.RequestObject("POST", url, data, options);
        }
    }

}