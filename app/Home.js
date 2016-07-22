var Home = {

    name: "Home",

    init: function()
    {
        let fields = {
            kw: {
                validation: "required",
                updateEvent: "onkeyup",
                updateDebounce: 150
            },
            domain: {
                choices: {a: "Choice #1", b: "Choice #2", c: "Choice #3"}
            },
            notes: {
                multiline: true
            },
            active: {
                value: "1"
            }
        };
        let initialData = {
            kw: "Test",
            domain: "b",
            notes: "Hello World\nOk",
            active: true,
            gender: "men"
        };
        this.loginForm = sn.form(fields, initialData);

        let test = setTimeout(() => {
            this.loginForm.kw = "Nope";
        }, 2000);
    },

    test: function()
    {
        console.log(this.loginForm.serialize());
    },

    render: function() {
        return [
            el("div", "Hello there : " + this.loginForm.kw),
            this.loginForm.field("kw"),
            this.loginForm.field("domain"),
            this.loginForm.field("gender", { type:"radio", value: "women" }),
            this.loginForm.field("gender", { type:"radio", value: "men" }),
            this.loginForm.field("active", { type: "checkbox" }),
            this.loginForm.field("notes", { cols: 50, rows: 10 }),
            el("button", { onclick: this.test, disabled: !this.loginForm.isValid() }, "Submit")
        ];
    }
};