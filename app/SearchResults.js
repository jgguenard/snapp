var SearchResults = {

    name: "SearchResults",

    init: function()
    {

    },

    update: function()
    {
        this.kw = sn.router.param("kw") || "";
        this.loading = true;

        this.task = sn.request.get("/2").success((response, req) => {
            console.log("success", response);
        }).fail((response, req) => {
            console.log("fail", req);
        }).always((response, req) => {
            this.loading = false;
        });
    },

    render: function() {
        return [
            el("Results for " + this.kw + " ..."),
            (this.loading) ? el(Loading, { message: "LOADING YOUR RESULTS ...." }) : ""
        ];
    },

    dispose: function()
    {
        this.task.abort();
    }
};