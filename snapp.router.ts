namespace sn
{
    export var router = {
        routes: {},
        params: [],
        named_params: {},
        enabled: false,

        getPath: function() {
            let match = window.location.href.match(/#(.*)$/);
            let path = match ? match[1] : '';
            return "/" + this.clearSlashes(path);
        },

        clearSlashes: function(path: string) {
            return path.toString().replace(/\/$/, '').replace(/^\//, '');
        },

        param: function(key: number | string, default_value?: any)
        {
            if(sn.isInteger(key))
                return this.params[key] || default_value;
            else
                return this.named_params[key] || default_value;
        },

        update: function()
        {
            let path = this.getPath();
            let params = [];
            let named_params = {};

            // process get params (?a=1)
            path = path.replace(/[?&]+([^=&]+)=?([^&]*)?/gi, ( m, key, value ) => {
                // register segment as named param
                named_params[key] = decodeURIComponent(value);
                // remove segment from path
                return "";
            });

            // find route
            for(let rule in this.routes) {
                let regex = "^" + rule.replace( /:[^/]+/g, '([^/]+)' ) + "$";
                let match = path.match(regex);
                if(match) {
                    match.shift();
                    let param_name_match = rule.match(/:([^/:]+)/g);
                    for(let p in param_name_match)
                    {
                        let val = decodeURIComponent(match[p]);
                        params.push(val);
                        named_params[param_name_match[p].replace(":", "")] = val;
                    }
                    this.params = params;
                    this.named_params = named_params;
                    // log
                    sn.log("Taking route " + rule);
                    // execute route
                    this.routes[rule]();
                    break;
                }
            }
        },

        setEnabled: function(enabled: boolean)
        {
            if(enabled === true && !this.enabled)
            {
                setTimeout(() => {
                    window.addEventListener("hashchange", this.update.bind(this));
                    this.enabled = true;
                    this.update();
                }, 0);
            } else if(!enabled) {
                window.removeEventListener("hashchange", this.update.bind(this));
                this.enabled = false;
            }
        },

        setRoutes: function(routes)
        {
            this.routes = routes;
            this.setEnabled(true);
        },

        redirect: function(path, args)
        {
            // apply arguments
            if(args)
                for(let a in args)
                    path = path.replace(":" + a, encodeURIComponent(args[a]));
            // change url
            window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
        }
    }
}
