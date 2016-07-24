namespace sn
{
    export function form(fieldsOptions, initialData?)
    {
        return new sn.FormObject(fieldsOptions, initialData);
    }

    export var FormField = {

        name: "FormField",

        init: function(form, name, attributes?, options?)
        {
            // set initial value if any
            this.value = form[name] || "";

            // observe form data changes
            sn.component.observe(name, form, (newValue, oldValue) => {

                // make sure we apply the display format if a mask was set
                if(form.$fields[name].mask)
                    newValue = sn.mask.applyMask(form.$fields[name].mask, newValue, "display");

                // set field value
                this.value = newValue;

            });
        },

        update: function(form, name, attributes?, options?)
        {
            // save reference to parent form
            this.$form = form;

            // set options
            this.$options = sn.extend({

                updateEvent: "onchange",
                updateDebounce: 0,
                choices: null,
                multiline: false

            }, options || {});

            // set attributes
            this.$attributes = sn.extend({

                // name of the field
                name: name,

            }, attributes || {});

            // set update handler
            let updateHandler = (event) => {
                // get value
                let value = event.target.value;
                // save value to form scope
                this.$form.setFieldValue(name, value);
                // form is no longer considered pristine
                this.$form.setPristine(false);
            }
            let timer;
            this.$attributes[this.$options.updateEvent] = (this.$options.updateDebounce) ? (event) => {
                clearTimeout(timer);
                timer = setTimeout(updateHandler.bind(this, event), this.$options.updateDebounce);
            } : updateHandler;

            // mask
            if(this.$options.mask && sn.mask.parser[this.$options.mask])
            {
                this.$attributes.onkeypress = sn.mask.applyInputMask.bind(sn.mask, this.$options.mask);
                // since applyInputMask() prevents "onkeypress", "onchange" is never triggered so fall back on "onblur"
                this.$attributes.onblur = updateHandler;
            }
        },

        render: function() {

            // make a copy of the base attributes
            var attributes = sn.copy(this.$attributes);

            // set css class attribute
            let css_classes = (!sn.isEmpty(attributes["class"] || "")) ? attributes["class"] + " " : "";
            if(!sn.isEmpty(this.$form.$errors[attributes.name]))
            {
                css_classes += sn.config.form.invalidPrefix;
                this.$form.$errors[attributes.name].map((item) => {
                    css_classes += " " + sn.config.form.invalidPrefix + "-" + item.replace("_", "-");
                });
            } else {
                css_classes += sn.config.form.validPrefix;
            }
            attributes["class"] = css_classes;

            // set tag name
            let tagName = (this.$options.choices)
                ? "SELECT" : (this.$options.multiline === true) ? "TEXTAREA" : "INPUT";

            // tagName-based adjustments
            let children = [];
            if(tagName === "SELECT")
            {
                for(let key in this.$options.choices)
                {
                    let selected = (key == this.value);
                    children.push(el("option", { value: key, selected: selected }, this.$options.choices[key]));
                }
            } else {

                if(tagName === "INPUT")
                {
                    // make sure we have a type attr
                    if(!attributes.type)
                        attributes.type = "text";

                    // checkbox
                    if(attributes.type === "checkbox") {
                        attributes.checked = (this.$options.value == this.value);
                        attributes.value = this.$options.value;
                    } else if(attributes.type === "radio") {
                        // radio button
                        attributes.checked = (attributes.value == this.value);
                    } else {
                        // make sure the value attribute is synched with the field model
                        attributes.value = this.value;
                    }
                } else {
                    // make sure the value attribute is synched with the field model
                    attributes.value = this.value;
                }
            }

            // return element
            return el(tagName, attributes, children);
        }
    }

    export class FormObject
    {
        private $fields;
        private $errors;
        private $pristine;

        constructor(fieldsOptions, initialData?)
        {
            this.$fields = fieldsOptions || {};
            this.$errors = {};
            this.$pristine = true;

            if(sn.isDefined(initialData))
                this.setFieldsValue(initialData);
        }

        serialize()
        {
            let data = {};
            for(let key in this.$fields)
            {
                data[key] = this[key];
            }
            return data;
        }

        setPristine(value)
        {
            this.$pristine = (value === true);
        }

        setFieldValue(name, value)
        {
            // make sure we apply the data format if a mask was set
            if(this.$fields[name].mask)
                value = sn.mask.applyMask(this.$fields[name].mask, value, "data");

            // save value
            this[name] = value;

            // validate it
            this.validateField(name, value);
        }

        setFieldsValue(data)
        {
            for(let key in data)
                this.setFieldValue(key, data[key]);
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
        validateField(fieldName, fieldValue)
        {
            let errors = [];
            if(this.$fields[fieldName])
            {
                let rules = this.$fields[fieldName].validation;
                if(!sn.isEmpty(rules))
                {
                    // make sure validation rules are iterable
                    if(!sn.isArray(rules)) rules = [rules];
                    // apply validation
                    for(let r in rules)
                    {
                        let validator = rules[r].toString().toLowerCase();
                        let args = null;
                        let argsIndex = validator.indexOf(":");
                        if(argsIndex > 0)
                        {
                            args = validator.substring(argsIndex + 1).split(",");
                            validator = validator.substring(0, argsIndex);
                        }
                        if(sn.validation[validator])
                        {
                            let assertion = sn.validation[validator](fieldValue, args, fieldName, this);
                            if(assertion !== true)
                                errors.push(validator);
                        }
                    }
                }
            }
            this.$errors[fieldName] = errors;
            return (errors.length < 0);
        }

        // return a field component
        field(name, attributes?)
        {
            return el(sn.FormField, { form: this, name: name, attributes: attributes, options: this.$fields[name] });
        }
    }
}