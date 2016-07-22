var SearchBox = {

    name: "SearchBox",

    init: function()
    {
        this.kw = sn.router.param("kw") || "";
    },

    render: function()
    {
        return el("div", [
            el("input", { value: this.kw, onchange: (event) => { this.kw = event.target.value }, onkeyup: this.submit })
        ])
    },

    submit: function(event)
    {
        let kw_len = event.target.value.length;
        if(event.which === 13 && kw_len > 2)
        {
            sn.router.route("/search/:kw", {kw: event.target.value});
            return;
        }
    }
}