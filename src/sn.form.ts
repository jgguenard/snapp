namespace sn
{
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

        // validate a field
        validateField(fieldName)
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
                    let assertion = sn.validation[validator](this[fieldName]);
                    if(assertion !== true)
                        errors.push(validator);
                }
            }
            return errors;
        }

        // return a field component
        field(name, attributes?, options?)
        {
            // attributes
            attributes = sn.extend({

                // name of the field
                name: name,

                // initial value
                value: this[name] || "",

                // when value change
                onchange: (event) => {
                    // get value
                    let value = event.target.value;
                    // save value to scope
                    this[name] = value;
                    // validate it
                    this.$errors[name] = this.validateField(name);
                    // form is no longer considered pristine
                    this.$pristine = false;
                }

            }, options || {});

            // element type
            let tagName = (options) ? "select" : (attributes.multiline === true) ? "textarea" : "input";

            // tag name
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

            // a field is a dynamically generated component
            return {

                name: "FormField",

                render: function() {
                    return el(tagName, attributes);
                }
            }
        }
    }
}