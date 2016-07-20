namespace sn
{
    export var FormField = {

        name: "FormField",

        init: function(form, name, attributes?, options?)
        {
            // set initial value if any
            this.value = form[name] || "";

            sn.component.observe(name, form, (newValue, oldValue) => {
                this.value = newValue;
            });
        },

        update: function(form, name, attributes?, options?)
        {
            // save reference to parent form
            this.form = form;

            // set attributes
            this.attributes = sn.extend({

                // name of the field
                name: name,

                // when value change
                onchange: (event) => {
                    // get value
                    let value = event.target.value;
                    // validate it
                    this.form.$errors[name] = this.form.validateField(name, value);
                    // save value to current scope
                    this.value = value;
                    // save value to form scope
                    this.form.setFieldValue(name, value);
                    // form is no longer considered pristine
                    this.form.$pristine = false;
                }

            }, attributes || {});
        },

        render: function() {

            // make a copy of the base attributes
            var attributes = sn.extend({}, this.attributes);

            // set css class attribute
            let css_classes = (!sn.isEmpty(attributes["class"] || "")) ? " " : "";
            if(!sn.isEmpty(this.form.$errors[attributes.name]))
            {
                css_classes += "sn-invalid";
                this.form.$errors[attributes.name].map((item) => {
                    css_classes += " sn-invalid-" + item.replace("_", "-");
                });
            } else {
                css_classes += "sn-valid";
            }
            attributes["class"] = css_classes;

            // set tag name
            let tagName = (this.options) ? "select" : (attributes.multiline === true) ? "textarea" : "input";

            // tagName-based adjustments
            switch(tagName)
            {
                case "select":
                    // TODO ...
                    break;
                case "input":
                    if(!attributes.type)
                        attributes.type = "text";
                    break;
                case "textarea":
                    delete attributes["multiline"];
                    break;
            }

            // make sure the value attribute is synched with the field model
            attributes.value = this.value;

            // return element
            return el(tagName, attributes);
        }
    }

    export class Form
    {
        private $rules;
        private $errors;
        private $pristine;

        constructor(rules)
        {
            this.$rules = rules || {};
            this.$errors = {};
            this.$pristine = true;
        }

        // check if the form has validation errors or not
        isValid()
        {
            for(let e in this.$errors)
                if(!sn.isEmpty(this.$errors[e]))
                    return false;
            return true;
        }

        // has the form been modified
        isPristine()
        {
            return this.$pristine;
        }

        setFieldValue(name, value)
        {
            this[name] = value;
        }

        // validate a field
        validateField(fieldName, fieldValue)
        {
            let errors = [];
            let rules = this.$rules[fieldName];
            if(!sn.isEmpty(rules))
            {
                // make sure validation rules are iterable
                if(!sn.isArray(rules)) rules = [rules];
                // apply validation
                for(let r in rules)
                {
                    let validator = rules[r];
                    let assertion = sn.validation[validator](fieldValue);
                    if(assertion !== true)
                        errors.push(validator);
                }
            }
            return errors;
        }

        // return a field component
        field(name, attributes?, options?)
        {
            return el(sn.FormField, { form: this, name: name, attributes: attributes, options: options });
        }
    }
}