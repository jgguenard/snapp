var sn;
(function (sn) {
    sn.config = {
        logPrefix: "sn: ",
        debug: true
    };
    function element(tagName, attributes, childNodes) {
        if (!tagName || tagName === "")
            return null;
        return sn.vdom.createVirtualNode(tagName, attributes, childNodes);
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
    function mount(container, componentDefinition, parameters) {
        let component = new sn.Component(componentDefinition);
        component.mount(container, parameters);
    }
    sn.mount = mount;
    sn.version = "0.1";
})(sn || (sn = {}));
var el = sn.element;
var sn;
(function (sn) {
    sn.componentMethods = ["controller", "view", "dispose"];
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
        mount(container, controllerParameters) {
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
                if (controllerParameters) {
                    let controller_args = [];
                    for (let key in controllerParameters)
                        controller_args.push(controllerParameters[key]);
                    this.definition.controller.apply(this.scope, controller_args);
                }
                else {
                    this.definition.controller.call(this.scope);
                }
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
                    sn.log("Ignoring 1 rendering request for <" + this.definition.name + ">");
                    clearTimeout(this.activeRenderJob);
                }
                this.activeRenderJob = setTimeout(() => {
                    let node = this.definition.view.call(this.scope, this.vContainer);
                    if (sn.vdom.isVirtualNode(node))
                        node = sn.vdom.createContainerFromNode(node);
                    let changes = sn.vdom.diffChildren(this.container, node);
                    sn.vdom.apply(changes);
                    sn.log("Rendering component <" + this.definition.name + ">");
                    this.activeRenderJob = null;
                }, 0);
            }
            else {
                sn.log("Rendering request for <" + this.definition.name + "> ignored");
            }
        }
    }
    sn.Component = Component;
})(sn || (sn = {}));
(function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports)
        module.exports = definition();
    else if (typeof define == 'function' && define.amd)
        define(definition);
    else
        context[name] = definition();
    context[name] = definition();
}('reqwest', window, function () {
    var context = this;
    if ('document' in context) {
        var doc = document, byTag = 'getElementsByTagName', head = doc[byTag]('head')[0];
    }
    else {
        var XHR2;
        try {
            XHR2 = require('xhr2');
        }
        catch (ex) {
            throw new Error('Peer dependency `xhr2` required! Please npm install xhr2');
        }
    }
    var httpsRe = /^http/, protocolRe = /(^\w+):\/\//, twoHundo = /^(20\d|1223)$/, readyState = 'readyState', contentType = 'Content-Type', requestedWith = 'X-Requested-With', uniqid = 0, callbackPrefix = 'reqwest_' + (+new Date()), lastValue, xmlHttpRequest = 'XMLHttpRequest', xDomainRequest = 'XDomainRequest', noop = function () { }, isArray = typeof Array.isArray == 'function'
        ? Array.isArray
        : function (a) {
            return a instanceof Array;
        }, defaultHeaders = {
        'contentType': 'application/x-www-form-urlencoded',
        'requestedWith': xmlHttpRequest,
        'accept': {
            '*': 'text/javascript, text/html, application/xml, text/xml, */*',
            'xml': 'application/xml, text/xml',
            'html': 'text/html',
            'text': 'text/plain',
            'json': 'application/json, text/javascript',
            'js': 'application/javascript, text/javascript'
        }
    }, xhr = function (o) {
        if (o['crossOrigin'] === true) {
            var xhr = context[xmlHttpRequest] ? new XMLHttpRequest() : null;
            if (xhr && 'withCredentials' in xhr) {
                return xhr;
            }
            else if (context[xDomainRequest]) {
                var protocolRegExp = /^https?/;
                if (window.location.href.match(protocolRegExp)[0] !== o.url.match(protocolRegExp)[0]) {
                    throw new Error('XDomainRequest: requests must be targeted to the same scheme as the hosting page.');
                }
                return new XDomainRequest();
            }
            else {
                throw new Error('Browser does not support cross-origin requests');
            }
        }
        else if (context[xmlHttpRequest]) {
            return new XMLHttpRequest();
        }
        else if (XHR2) {
            return new XHR2();
        }
        else {
            return new ActiveXObject('Microsoft.XMLHTTP');
        }
    }, globalSetupOptions = {
        dataFilter: function (data) {
            return data;
        }
    };
    function succeed(r) {
        var protocol = protocolRe.exec(r.url);
        protocol = (protocol && protocol[1]) || context.location.protocol;
        return httpsRe.test(protocol) ? twoHundo.test(r.request.status) : !!r.request.response;
    }
    function handleReadyState(r, success, error) {
        return function () {
            if (r._aborted)
                return error(r.request);
            if (r._timedOut)
                return error(r.request, 'Request is aborted: timeout');
            if (r.request && r.request[readyState] == 4) {
                r.request.onreadystatechange = noop;
                if (succeed(r))
                    success(r.request);
                else
                    error(r.request);
            }
        };
    }
    function setHeaders(http, o) {
        var headers = o['headers'] || {}, h;
        headers['Accept'] = headers['Accept']
            || defaultHeaders['accept'][o['type']]
            || defaultHeaders['accept']['*'];
        var isAFormData = typeof FormData !== 'undefined' && (o['data'] instanceof FormData);
        if (!o['crossOrigin'] && !headers[requestedWith])
            headers[requestedWith] = defaultHeaders['requestedWith'];
        if (!headers[contentType] && !isAFormData)
            headers[contentType] = o['contentType'] || defaultHeaders['contentType'];
        for (h in headers)
            headers.hasOwnProperty(h) && 'setRequestHeader' in http && http.setRequestHeader(h, headers[h]);
    }
    function setCredentials(http, o) {
        if (typeof o['withCredentials'] !== 'undefined' && typeof http.withCredentials !== 'undefined') {
            http.withCredentials = !!o['withCredentials'];
        }
    }
    function generalCallback(data) {
        lastValue = data;
    }
    function urlappend(url, s) {
        return url + (/\?/.test(url) ? '&' : '?') + s;
    }
    function handleJsonp(o, fn, err, url) {
        var reqId = uniqid++, cbkey = o['jsonpCallback'] || 'callback', cbval = o['jsonpCallbackName'] || reqwest.getcallbackPrefix(reqId), cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)'), match = url.match(cbreg), script = doc.createElement('script'), loaded = 0, isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1;
        if (match) {
            if (match[3] === '?') {
                url = url.replace(cbreg, '$1=' + cbval);
            }
            else {
                cbval = match[3];
            }
        }
        else {
            url = urlappend(url, cbkey + '=' + cbval);
        }
        context[cbval] = generalCallback;
        script.type = 'text/javascript';
        script.src = url;
        script.async = true;
        if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
            script.htmlFor = script.id = '_reqwest_' + reqId;
        }
        script.onload = script.onreadystatechange = function () {
            if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
                return false;
            }
            script.onload = script.onreadystatechange = null;
            script.onclick && script.onclick();
            fn(lastValue);
            lastValue = undefined;
            head.removeChild(script);
            loaded = 1;
        };
        head.appendChild(script);
        return {
            abort: function () {
                script.onload = script.onreadystatechange = null;
                err({}, 'Request is aborted: timeout', {});
                lastValue = undefined;
                head.removeChild(script);
                loaded = 1;
            }
        };
    }
    function getRequest(fn, err) {
        var o = this.o, method = (o['method'] || 'GET').toUpperCase(), url = typeof o === 'string' ? o : o['url'], data = (o['processData'] !== false && o['data'] && typeof o['data'] !== 'string')
            ? reqwest.toQueryString(o['data'])
            : (o['data'] || null), http, sendWait = false;
        if ((o['type'] == 'jsonp' || method == 'GET') && data) {
            url = urlappend(url, data);
            data = null;
        }
        if (o['type'] == 'jsonp')
            return handleJsonp(o, fn, err, url);
        http = (o.xhr && o.xhr(o)) || xhr(o);
        http.open(method, url, o['async'] === false ? false : true);
        setHeaders(http, o);
        setCredentials(http, o);
        if (context[xDomainRequest] && http instanceof context[xDomainRequest]) {
            http.onload = fn;
            http.onerror = err;
            http.onprogress = function () { };
            sendWait = true;
        }
        else {
            http.onreadystatechange = handleReadyState(this, fn, err);
        }
        o['before'] && o['before'](http);
        if (sendWait) {
            setTimeout(function () {
                http.send(data);
            }, 200);
        }
        else {
            http.send(data);
        }
        return http;
    }
    function Reqwest(o, fn) {
        this.o = o;
        this.fn = fn;
        init.apply(this, arguments);
    }
    function setType(header) {
        if (header === null)
            return undefined;
        if (header.match('json'))
            return 'json';
        if (header.match('javascript'))
            return 'js';
        if (header.match('text'))
            return 'html';
        if (header.match('xml'))
            return 'xml';
    }
    function init(o, fn) {
        this.url = typeof o == 'string' ? o : o['url'];
        this.timeout = null;
        this._fulfilled = false;
        this._successHandler = function () { };
        this._fulfillmentHandlers = [];
        this._errorHandlers = [];
        this._completeHandlers = [];
        this._erred = false;
        this._responseArgs = {};
        var self = this;
        fn = fn || function () { };
        if (o['timeout']) {
            this.timeout = setTimeout(function () {
                timedOut();
            }, o['timeout']);
        }
        if (o['success']) {
            this._successHandler = function () {
                o['success'].apply(o, arguments);
            };
        }
        if (o['error']) {
            this._errorHandlers.push(function () {
                o['error'].apply(o, arguments);
            });
        }
        if (o['complete']) {
            this._completeHandlers.push(function () {
                o['complete'].apply(o, arguments);
            });
        }
        function complete(resp) {
            o['timeout'] && clearTimeout(self.timeout);
            self.timeout = null;
            while (self._completeHandlers.length > 0) {
                self._completeHandlers.shift()(resp);
            }
        }
        function success(resp) {
            var type = o['type'] || resp && setType(resp.getResponseHeader('Content-Type'));
            resp = (type !== 'jsonp') ? self.request : resp;
            var filteredResponse = globalSetupOptions.dataFilter(resp.responseText, type), r = filteredResponse;
            try {
                resp.responseText = r;
            }
            catch (e) {
            }
            if (r) {
                switch (type) {
                    case 'json':
                        try {
                            resp = context.JSON ? context.JSON.parse(r) : eval('(' + r + ')');
                        }
                        catch (err) {
                            return error(resp, 'Could not parse JSON in response', err);
                        }
                        break;
                    case 'js':
                        resp = eval(r);
                        break;
                    case 'html':
                        resp = r;
                        break;
                    case 'xml':
                        resp = resp.responseXML
                            && resp.responseXML.parseError
                            && resp.responseXML.parseError.errorCode
                            && resp.responseXML.parseError.reason
                            ? null
                            : resp.responseXML;
                        break;
                }
            }
            self._responseArgs.resp = resp;
            self._fulfilled = true;
            fn(resp);
            self._successHandler(resp);
            while (self._fulfillmentHandlers.length > 0) {
                resp = self._fulfillmentHandlers.shift()(resp);
            }
            complete(resp);
        }
        function timedOut() {
            self._timedOut = true;
            self.request.abort();
        }
        function error(resp, msg, t) {
            resp = self.request;
            self._responseArgs.resp = resp;
            self._responseArgs.msg = msg;
            self._responseArgs.t = t;
            self._erred = true;
            while (self._errorHandlers.length > 0) {
                self._errorHandlers.shift()(resp, msg, t);
            }
            complete(resp);
        }
        this.request = getRequest.call(this, success, error);
    }
    Reqwest.prototype = {
        abort: function () {
            this._aborted = true;
            this.request.abort();
        },
        retry: function () {
            init.call(this, this.o, this.fn);
        },
        then: function (success, fail) {
            success = success || function () { };
            fail = fail || function () { };
            if (this._fulfilled) {
                this._responseArgs.resp = success(this._responseArgs.resp);
            }
            else if (this._erred) {
                fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t);
            }
            else {
                this._fulfillmentHandlers.push(success);
                this._errorHandlers.push(fail);
            }
            return this;
        },
        always: function (fn) {
            if (this._fulfilled || this._erred) {
                fn(this._responseArgs.resp);
            }
            else {
                this._completeHandlers.push(fn);
            }
            return this;
        },
        fail: function (fn) {
            if (this._erred) {
                fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t);
            }
            else {
                this._errorHandlers.push(fn);
            }
            return this;
        },
        'catch': function (fn) {
            return this.fail(fn);
        }
    };
    function reqwest(o, fn) {
        return new Reqwest(o, fn);
    }
    function normalize(s) {
        return s ? s.replace(/\r?\n/g, '\r\n') : '';
    }
    function serial(el, cb) {
        var n = el.name, t = el.tagName.toLowerCase(), optCb = function (o) {
            if (o && !o['disabled'])
                cb(n, normalize(o['attributes']['value'] && o['attributes']['value']['specified'] ? o['value'] : o['text']));
        }, ch, ra, val, i;
        if (el.disabled || !n)
            return;
        switch (t) {
            case 'input':
                if (!/reset|button|image|file/i.test(el.type)) {
                    ch = /checkbox/i.test(el.type);
                    ra = /radio/i.test(el.type);
                    val = el.value;
                    (!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val));
                }
                break;
            case 'textarea':
                cb(n, normalize(el.value));
                break;
            case 'select':
                if (el.type.toLowerCase() === 'select-one') {
                    optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null);
                }
                else {
                    for (i = 0; el.length && i < el.length; i++) {
                        el.options[i].selected && optCb(el.options[i]);
                    }
                }
                break;
        }
    }
    function eachFormElement() {
        var cb = this, e, i, serializeSubtags = function (e, tags) {
            var i, j, fa;
            for (i = 0; i < tags.length; i++) {
                fa = e[byTag](tags[i]);
                for (j = 0; j < fa.length; j++)
                    serial(fa[j], cb);
            }
        };
        for (i = 0; i < arguments.length; i++) {
            e = arguments[i];
            if (/input|select|textarea/i.test(e.tagName))
                serial(e, cb);
            serializeSubtags(e, ['input', 'select', 'textarea']);
        }
    }
    function serializeQueryString() {
        return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments));
    }
    function serializeHash() {
        var hash = {};
        eachFormElement.apply(function (name, value) {
            if (name in hash) {
                hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]]);
                hash[name].push(value);
            }
            else
                hash[name] = value;
        }, arguments);
        return hash;
    }
    reqwest.serializeArray = function () {
        var arr = [];
        eachFormElement.apply(function (name, value) {
            arr.push({ name: name, value: value });
        }, arguments);
        return arr;
    };
    reqwest.serialize = function () {
        if (arguments.length === 0)
            return '';
        var opt, fn, args = Array.prototype.slice.call(arguments, 0);
        opt = args.pop();
        opt && opt.nodeType && args.push(opt) && (opt = null);
        opt && (opt = opt.type);
        if (opt == 'map')
            fn = serializeHash;
        else if (opt == 'array')
            fn = reqwest.serializeArray;
        else
            fn = serializeQueryString;
        return fn.apply(null, args);
    };
    reqwest.toQueryString = function (o, trad) {
        var prefix, i, traditional = trad || false, s = [], enc = encodeURIComponent, add = function (key, value) {
            value = ('function' === typeof value) ? value() : (value == null ? '' : value);
            s[s.length] = enc(key) + '=' + enc(value);
        };
        if (isArray(o)) {
            for (i = 0; o && i < o.length; i++)
                add(o[i]['name'], o[i]['value']);
        }
        else {
            for (prefix in o) {
                if (o.hasOwnProperty(prefix))
                    buildParams(prefix, o[prefix], traditional, add);
            }
        }
        return s.join('&').replace(/%20/g, '+');
    };
    function buildParams(prefix, obj, traditional, add) {
        var name, i, v, rbracket = /\[\]$/;
        if (isArray(obj)) {
            for (i = 0; obj && i < obj.length; i++) {
                v = obj[i];
                if (traditional || rbracket.test(prefix)) {
                    add(prefix, v);
                }
                else {
                    buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add);
                }
            }
        }
        else if (obj && obj.toString() === '[object Object]') {
            for (name in obj) {
                buildParams(prefix + '[' + name + ']', obj[name], traditional, add);
            }
        }
        else {
            add(prefix, obj);
        }
    }
    reqwest.getcallbackPrefix = function () {
        return callbackPrefix;
    };
    reqwest.compat = function (o, fn) {
        if (o) {
            o['type'] && (o['method'] = o['type']) && delete o['type'];
            o['dataType'] && (o['type'] = o['dataType']);
            o['jsonpCallback'] && (o['jsonpCallbackName'] = o['jsonpCallback']) && delete o['jsonpCallback'];
            o['jsonp'] && (o['jsonpCallback'] = o['jsonp']);
        }
        return new Reqwest(o, fn);
    };
    reqwest.ajaxSetup = function (options) {
        options = options || {};
        for (var k in options) {
            globalSetupOptions[k] = options[k];
        }
    };
    return reqwest;
}));
var sn;
(function (sn) {
    sn.request = (function () {
        var context = this;
        if ('document' in context) {
            var doc = document, byTag = 'getElementsByTagName', head = doc[byTag]('head')[0];
        }
        else {
            throw new Error('Peer dependency `xhr2` required! Please npm install xhr2');
        }
        var httpsRe = /^http/, protocolRe = /(^\w+):\/\//, twoHundo = /^(20\d|1223)$/, readyState = 'readyState', contentType = 'Content-Type', requestedWith = 'X-Requested-With', uniqid = 0, callbackPrefix = 'reqwest_' + (+new Date()), lastValue, xmlHttpRequest = 'XMLHttpRequest', xDomainRequest = 'XDomainRequest', noop = function () { }, isArray = typeof Array.isArray == 'function'
            ? Array.isArray
            : function (a) {
                return a instanceof Array;
            }, defaultHeaders = {
            'contentType': 'application/x-www-form-urlencoded',
            'requestedWith': xmlHttpRequest,
            'accept': {
                '*': 'text/javascript, text/html, application/xml, text/xml, */*',
                'xml': 'application/xml, text/xml',
                'html': 'text/html',
                'text': 'text/plain',
                'json': 'application/json, text/javascript',
                'js': 'application/javascript, text/javascript'
            }
        }, xhr = function (o) {
            if (o['crossOrigin'] === true) {
                var xhr = context[xmlHttpRequest] ? new XMLHttpRequest() : null;
                if (xhr && 'withCredentials' in xhr) {
                    return xhr;
                }
                else if (context[xDomainRequest]) {
                    var protocolRegExp = /^https?/;
                    if (window.location.href.match(protocolRegExp)[0] !== o.url.match(protocolRegExp)[0]) {
                        throw new Error('XDomainRequest: requests must be targeted to the same scheme as the hosting page.');
                    }
                    return new XDomainRequest();
                }
                else {
                    throw new Error('Browser does not support cross-origin requests');
                }
            }
            else if (context[xmlHttpRequest]) {
                return new XMLHttpRequest();
            }
            else if (XHR2) {
                return new XHR2();
            }
            else {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        }, globalSetupOptions = {
            dataFilter: function (data) {
                return data;
            }
        };
        function succeed(r) {
            var protocol = protocolRe.exec(r.url);
            protocol = (protocol && protocol[1]) || context.location.protocol;
            return httpsRe.test(protocol) ? twoHundo.test(r.request.status) : !!r.request.response;
        }
        function handleReadyState(r, success, error) {
            return function () {
                if (r._aborted)
                    return error(r.request);
                if (r._timedOut)
                    return error(r.request, 'Request is aborted: timeout');
                if (r.request && r.request[readyState] == 4) {
                    r.request.onreadystatechange = noop;
                    if (succeed(r))
                        success(r.request);
                    else
                        error(r.request);
                }
            };
        }
        function setHeaders(http, o) {
            var headers = o['headers'] || {}, h;
            headers['Accept'] = headers['Accept']
                || defaultHeaders['accept'][o['type']]
                || defaultHeaders['accept']['*'];
            var isAFormData = typeof FormData !== 'undefined' && (o['data'] instanceof FormData);
            if (!o['crossOrigin'] && !headers[requestedWith])
                headers[requestedWith] = defaultHeaders['requestedWith'];
            if (!headers[contentType] && !isAFormData)
                headers[contentType] = o['contentType'] || defaultHeaders['contentType'];
            for (h in headers)
                headers.hasOwnProperty(h) && 'setRequestHeader' in http && http.setRequestHeader(h, headers[h]);
        }
        function setCredentials(http, o) {
            if (typeof o['withCredentials'] !== 'undefined' && typeof http.withCredentials !== 'undefined') {
                http.withCredentials = !!o['withCredentials'];
            }
        }
        function generalCallback(data) {
            lastValue = data;
        }
        function urlappend(url, s) {
            return url + (/\?/.test(url) ? '&' : '?') + s;
        }
        function handleJsonp(o, fn, err, url) {
            var reqId = uniqid++, cbkey = o['jsonpCallback'] || 'callback', cbval = o['jsonpCallbackName'] || reqwest.getcallbackPrefix(reqId), cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)'), match = url.match(cbreg), script = doc.createElement('script'), loaded = 0, isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1;
            if (match) {
                if (match[3] === '?') {
                    url = url.replace(cbreg, '$1=' + cbval);
                }
                else {
                    cbval = match[3];
                }
            }
            else {
                url = urlappend(url, cbkey + '=' + cbval);
            }
            context[cbval] = generalCallback;
            script.type = 'text/javascript';
            script.src = url;
            script.async = true;
            if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
                script.htmlFor = script.id = '_reqwest_' + reqId;
            }
            script.onload = script.onreadystatechange = function () {
                if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
                    return false;
                }
                script.onload = script.onreadystatechange = null;
                script.onclick && script.onclick();
                fn(lastValue);
                lastValue = undefined;
                head.removeChild(script);
                loaded = 1;
            };
            head.appendChild(script);
            return {
                abort: function () {
                    script.onload = script.onreadystatechange = null;
                    err({}, 'Request is aborted: timeout', {});
                    lastValue = undefined;
                    head.removeChild(script);
                    loaded = 1;
                }
            };
        }
        function getRequest(fn, err) {
            var o = this.o, method = (o['method'] || 'GET').toUpperCase(), url = typeof o === 'string' ? o : o['url'], data = (o['processData'] !== false && o['data'] && typeof o['data'] !== 'string')
                ? reqwest.toQueryString(o['data'])
                : (o['data'] || null), http, sendWait = false;
            if ((o['type'] == 'jsonp' || method == 'GET') && data) {
                url = urlappend(url, data);
                data = null;
            }
            if (o['type'] == 'jsonp')
                return handleJsonp(o, fn, err, url);
            http = (o.xhr && o.xhr(o)) || xhr(o);
            http.open(method, url, o['async'] === false ? false : true);
            setHeaders(http, o);
            setCredentials(http, o);
            if (context[xDomainRequest] && http instanceof context[xDomainRequest]) {
                http.onload = fn;
                http.onerror = err;
                http.onprogress = function () { };
                sendWait = true;
            }
            else {
                http.onreadystatechange = handleReadyState(this, fn, err);
            }
            o['before'] && o['before'](http);
            if (sendWait) {
                setTimeout(function () {
                    http.send(data);
                }, 200);
            }
            else {
                http.send(data);
            }
            return http;
        }
        function Reqwest(o, fn) {
            this.o = o;
            this.fn = fn;
            init.apply(this, arguments);
        }
        function setType(header) {
            if (header === null)
                return undefined;
            if (header.match('json'))
                return 'json';
            if (header.match('javascript'))
                return 'js';
            if (header.match('text'))
                return 'html';
            if (header.match('xml'))
                return 'xml';
        }
        function init(o, fn) {
            this.url = typeof o == 'string' ? o : o['url'];
            this.timeout = null;
            this._fulfilled = false;
            this._successHandler = function () { };
            this._fulfillmentHandlers = [];
            this._errorHandlers = [];
            this._completeHandlers = [];
            this._erred = false;
            this._responseArgs = {};
            var self = this;
            fn = fn || function () { };
            if (o['timeout']) {
                this.timeout = setTimeout(function () {
                    timedOut();
                }, o['timeout']);
            }
            if (o['success']) {
                this._successHandler = function () {
                    o['success'].apply(o, arguments);
                };
            }
            if (o['error']) {
                this._errorHandlers.push(function () {
                    o['error'].apply(o, arguments);
                });
            }
            if (o['complete']) {
                this._completeHandlers.push(function () {
                    o['complete'].apply(o, arguments);
                });
            }
            function complete(resp) {
                o['timeout'] && clearTimeout(self.timeout);
                self.timeout = null;
                while (self._completeHandlers.length > 0) {
                    self._completeHandlers.shift()(resp);
                }
            }
            function success(resp) {
                var type = o['type'] || resp && setType(resp.getResponseHeader('Content-Type'));
                resp = (type !== 'jsonp') ? self.request : resp;
                var filteredResponse = globalSetupOptions.dataFilter(resp.responseText, type), r = filteredResponse;
                try {
                    resp.responseText = r;
                }
                catch (e) {
                }
                if (r) {
                    switch (type) {
                        case 'json':
                            try {
                                resp = context.JSON ? context.JSON.parse(r) : eval('(' + r + ')');
                            }
                            catch (err) {
                                return error(resp, 'Could not parse JSON in response', err);
                            }
                            break;
                        case 'js':
                            resp = eval(r);
                            break;
                        case 'html':
                            resp = r;
                            break;
                        case 'xml':
                            resp = resp.responseXML
                                && resp.responseXML.parseError
                                && resp.responseXML.parseError.errorCode
                                && resp.responseXML.parseError.reason
                                ? null
                                : resp.responseXML;
                            break;
                    }
                }
                self._responseArgs.resp = resp;
                self._fulfilled = true;
                fn(resp);
                self._successHandler(resp);
                while (self._fulfillmentHandlers.length > 0) {
                    resp = self._fulfillmentHandlers.shift()(resp);
                }
                complete(resp);
            }
            function timedOut() {
                self._timedOut = true;
                self.request.abort();
            }
            function error(resp, msg, t) {
                resp = self.request;
                self._responseArgs.resp = resp;
                self._responseArgs.msg = msg;
                self._responseArgs.t = t;
                self._erred = true;
                while (self._errorHandlers.length > 0) {
                    self._errorHandlers.shift()(resp, msg, t);
                }
                complete(resp);
            }
            this.request = getRequest.call(this, success, error);
        }
        Reqwest.prototype = {
            abort: function () {
                this._aborted = true;
                this.request.abort();
            },
            retry: function () {
                init.call(this, this.o, this.fn);
            },
            then: function (success, fail) {
                success = success || function () { };
                fail = fail || function () { };
                if (this._fulfilled) {
                    this._responseArgs.resp = success(this._responseArgs.resp);
                }
                else if (this._erred) {
                    fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t);
                }
                else {
                    this._fulfillmentHandlers.push(success);
                    this._errorHandlers.push(fail);
                }
                return this;
            },
            always: function (fn) {
                if (this._fulfilled || this._erred) {
                    fn(this._responseArgs.resp);
                }
                else {
                    this._completeHandlers.push(fn);
                }
                return this;
            },
            fail: function (fn) {
                if (this._erred) {
                    fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t);
                }
                else {
                    this._errorHandlers.push(fn);
                }
                return this;
            },
            'catch': function (fn) {
                return this.fail(fn);
            }
        };
        function reqwest(o, fn) {
            return new Reqwest(o, fn);
        }
        function normalize(s) {
            return s ? s.replace(/\r?\n/g, '\r\n') : '';
        }
        function serial(el, cb) {
            var n = el.name, t = el.tagName.toLowerCase(), optCb = function (o) {
                if (o && !o['disabled'])
                    cb(n, normalize(o['attributes']['value'] && o['attributes']['value']['specified'] ? o['value'] : o['text']));
            }, ch, ra, val, i;
            if (el.disabled || !n)
                return;
            switch (t) {
                case 'input':
                    if (!/reset|button|image|file/i.test(el.type)) {
                        ch = /checkbox/i.test(el.type);
                        ra = /radio/i.test(el.type);
                        val = el.value;
                        (!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val));
                    }
                    break;
                case 'textarea':
                    cb(n, normalize(el.value));
                    break;
                case 'select':
                    if (el.type.toLowerCase() === 'select-one') {
                        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null);
                    }
                    else {
                        for (i = 0; el.length && i < el.length; i++) {
                            el.options[i].selected && optCb(el.options[i]);
                        }
                    }
                    break;
            }
        }
        function eachFormElement() {
            var cb = this, e, i, serializeSubtags = function (e, tags) {
                var i, j, fa;
                for (i = 0; i < tags.length; i++) {
                    fa = e[byTag](tags[i]);
                    for (j = 0; j < fa.length; j++)
                        serial(fa[j], cb);
                }
            };
            for (i = 0; i < arguments.length; i++) {
                e = arguments[i];
                if (/input|select|textarea/i.test(e.tagName))
                    serial(e, cb);
                serializeSubtags(e, ['input', 'select', 'textarea']);
            }
        }
        function serializeQueryString() {
            return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments));
        }
        function serializeHash() {
            var hash = {};
            eachFormElement.apply(function (name, value) {
                if (name in hash) {
                    hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]]);
                    hash[name].push(value);
                }
                else
                    hash[name] = value;
            }, arguments);
            return hash;
        }
        reqwest.serializeArray = function () {
            var arr = [];
            eachFormElement.apply(function (name, value) {
                arr.push({ name: name, value: value });
            }, arguments);
            return arr;
        };
        reqwest.serialize = function () {
            if (arguments.length === 0)
                return '';
            var opt, fn, args = Array.prototype.slice.call(arguments, 0);
            opt = args.pop();
            opt && opt.nodeType && args.push(opt) && (opt = null);
            opt && (opt = opt.type);
            if (opt == 'map')
                fn = serializeHash;
            else if (opt == 'array')
                fn = reqwest.serializeArray;
            else
                fn = serializeQueryString;
            return fn.apply(null, args);
        };
        reqwest.toQueryString = function (o, trad) {
            var prefix, i, traditional = trad || false, s = [], enc = encodeURIComponent, add = function (key, value) {
                value = ('function' === typeof value) ? value() : (value == null ? '' : value);
                s[s.length] = enc(key) + '=' + enc(value);
            };
            if (isArray(o)) {
                for (i = 0; o && i < o.length; i++)
                    add(o[i]['name'], o[i]['value']);
            }
            else {
                for (prefix in o) {
                    if (o.hasOwnProperty(prefix))
                        buildParams(prefix, o[prefix], traditional, add);
                }
            }
            return s.join('&').replace(/%20/g, '+');
        };
        function buildParams(prefix, obj, traditional, add) {
            var name, i, v, rbracket = /\[\]$/;
            if (isArray(obj)) {
                for (i = 0; obj && i < obj.length; i++) {
                    v = obj[i];
                    if (traditional || rbracket.test(prefix)) {
                        add(prefix, v);
                    }
                    else {
                        buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add);
                    }
                }
            }
            else if (obj && obj.toString() === '[object Object]') {
                for (name in obj) {
                    buildParams(prefix + '[' + name + ']', obj[name], traditional, add);
                }
            }
            else {
                add(prefix, obj);
            }
        }
        reqwest.getcallbackPrefix = function () {
            return callbackPrefix;
        };
        reqwest.compat = function (o, fn) {
            if (o) {
                o['type'] && (o['method'] = o['type']) && delete o['type'];
                o['dataType'] && (o['type'] = o['dataType']);
                o['jsonpCallback'] && (o['jsonpCallbackName'] = o['jsonpCallback']) && delete o['jsonpCallback'];
                o['jsonp'] && (o['jsonpCallback'] = o['jsonp']);
            }
            return new Reqwest(o, fn);
        };
        reqwest.ajaxSetup = function (options) {
            options = options || {};
            for (var k in options) {
                globalSetupOptions[k] = options[k];
            }
        };
        return reqwest;
    })();
})(sn || (sn = {}));
var sn;
(function (sn) {
    sn.request = window["reqwest"];
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
            operations = operations.concat(this.diffChildren(srcNode, dstNode));
            return operations;
        },
        diffChildren: function (srcNode, dstNode) {
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
                    let isComponent = sn.vdom.getAttribute(srcChild, "data-sn-component");
                    if (!isComponent) {
                        operations.push({
                            type: sn.vdom.operation.REPLACE_CHILD,
                            source: srcNode,
                            destination: dstChild,
                            node: srcChild
                        });
                    }
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
                sn.mount(realNode, node.tagName, node.attributes);
            }
            return realNode;
        },
        createVirtualNode: function (tagName, attributes, childNodes) {
            var node;
            if (typeof tagName === "object") {
                node = {
                    nodeType: sn.vdom.node.COMPONENT,
                    tagName: tagName,
                    attributes: attributes,
                    virtual: true
                };
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
                container = this.createVirtualNode("DIV", null, node);
            }
            return container;
        },
        isVirtualNode: function (node) {
            return (node && node["virtual"] === true);
        }
    };
})(sn || (sn = {}));
//# sourceMappingURL=snapp.js.map