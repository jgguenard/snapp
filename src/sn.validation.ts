namespace sn
{
    export var validation = {

        // required
        required: function(value)
        {
            return !sn.isEmpty(value);
        },

        // exact length
        length: function(value, args)
        {
            return value.length == args[0];
        },

        // min length
        minlength: function(value, args)
        {
            return value.length >= args[0];
        },

        // max length
        maxlength: function(value, args)
        {
            return value.length <= args[0];
        },

        // min
        min: function(value, args)
        {
            return !isNaN(value) && parseFloat(value) >= args[0];
        },

        // max
        max: function(value, args)
        {
            return !isNaN(value) && parseFloat(value) <= args[0];
        },

        // between min and max
        between: function(value, args)
        {
            if(isNaN(value))
                return false;
            let v = parseFloat(value);
            return (v >= args[0] && v <= args[1]);
        },

        // email address
        email: function(value)
        {
            let regex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
            return regex.test(value);
        },

        // url
        url: function(value)
        {
            let regex = new RegExp("^" +
                // protocol identifier
                "(?:(?:https?|ftp)://)?" + // ** mod: make scheme optional
                // user:pass authentication
                "(?:\\S+(?::\\S*)?@)?" + "(?:" +
                // IP address exclusion
                // private & local networks
                // "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +   // ** mod: allow local networks
                // "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +  // ** mod: allow local networks
                // "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +  // ** mod: allow local networks
                // IP address dotted notation octets
                // excludes loopback network 0.0.0.0
                // excludes reserved space >= 224.0.0.0
                // excludes network & broacast addresses
                // (first & last IP address of each class)
                "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" + "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" + "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" + "|" +
                // host name
                '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
                // domain name
                '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
                // TLD identifier
                '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' + ")" +
                // port number
                "(?::\\d{2,5})?" +
                // resource path
                "(?:/\\S*)?" + "$", 'i')
            return regex.test(value);
        },

        // alphanumerical chars
        alphanum: function(value)
        {
            let regex = /^\w+$/i;
            return regex.test(value);
        },

        // digits only
        digits: function(value)
        {
            let regex = /^\d+$/;
            return regex.test(value);
        },

        // integer or float
        number: function(value)
        {
            let regex = /^-?(\d*\.)?\d+(e[-+]?\d+)?$/i;
            return regex.test(value);
        },

        // digits with support for minus values
        integer: function(value)
        {
            let regex = /^-?\d+$/;
            return regex.test(value);
        }

    }
}