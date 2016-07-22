var Loading = {

    name: "Loading",

    init: function(message)
    {
        this.message = message || "Default loading message";
    },

    render: function() {
        return el("div", this.message);
    }
};