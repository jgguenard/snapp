namespace sn
{
    export var mask =
    {
        add: function(maskName, mask)
        {
            // register mask
            this.masks[maskName] = mask;
        },

        getMask: function(mask, args?)
        {
            if(sn.isObject(mask))
                return mask;
            if(sn.isFunction(mask))
                return mask.apply({}, args);
            if(this.masks[mask])
                return this.masks[mask].apply({}, args);
            return null;
        },

        isPrintable: function(key) {
            return key >= 32 && key < 127;
        },

        getKey: function(e) {
            return window.event ? window.event["keyCode"] : e ? e.which : 0;
        },

        getRegexAt: function(regex, position)
        {
            if(sn.isArray(regex))
                return regex[position];
            return regex;
        },

        applyInputMask: function(mask, event) {
            let key = this.getKey(event);
            if (this.isPrintable(key)) {
                mask = this.getMask(mask);

                let chr = String.fromCharCode(key);
                let inputValue = event.target.value;
                let unmaskedValue = this.getUnmaskedValue(mask, inputValue);
                let slot = unmaskedValue.length;

                // get regex for the current slot
                let regex = (mask.reverse === true)
                    ? this.getRegexAt(mask.regex, mask.slots - slot - 1)
                    : this.getRegexAt(mask.regex, slot);

                // apply mask to new value
                if(slot < mask.slots && regex.test(chr))
                    event.target.value = this.applyMask(mask, event.target.value + chr, unmaskedValue + chr);

                sn.event.stopNativeEvent(event);
            }
        },

        applyMask: function(mask, value, unmaskedValue?)
        {
            // make sure we have a good value
            if(!value) return value;
            else value = value.toString();

            // get mask
            mask = this.getMask(mask);
            if(!mask)
                return value;

            // get unmasked value
            if(!unmaskedValue)
                unmaskedValue = this.getUnmaskedValue(mask, value);

            // build masked value
            let maskedValue = "";
            if(mask.reverse === true)
            {
                // in reverse mode, we start from the last character of the value
                for(let c = 0; c < unmaskedValue.length; c++)
                {
                    let chr = unmaskedValue.charAt(unmaskedValue.length - c - 1);
                    let pos = (mask.format.length - maskedValue.length - 1);
                    let filler = "";
                    while(pos > 0 && mask.format.charAt(pos) != "#")
                    {
                        filler = mask.format.charAt(pos) + filler;
                        pos--;
                    }
                    maskedValue = chr + filler + maskedValue;
                }
            } else {
                // in normal mode, we start from the first character of the value
                for(let c = 0; c < unmaskedValue.length; c++)
                {
                    let chr = unmaskedValue.charAt(c);
                    let pos = maskedValue.length + 1;
                    let filler = "";
                    while(pos < mask.format.length && mask.format.charAt(pos-1) != "#")
                    {
                        filler += mask.format.charAt(pos-1);
                        pos++;
                    }
                    maskedValue += filler + chr;
                }
            }

            return maskedValue;
        },

        getUnmaskedValue: function(mask, value)
        {
            // check value integrity
            if(sn.isEmpty(value))
                return value;
            else
                value = value.toString();

            // get mask
            mask = this.getMask(mask);
            if(!mask)
                return value;

            // for all slots, try to match regex by removing characters
            for(let pos = 0; pos < mask.slots && pos < value.length; pos++)
            {
                let regex = this.getRegexAt(mask.regex, pos);
                while(!regex.test(value.charAt(pos)) && pos < value.length)
                    value = value.substring(0, pos) + value.substring(pos +1);
            }

            // if too long, cut it
            if(value.length > mask.slots)
                value = value.substring(0, mask.slots);

            return value;
        },

        masks: {

            // phone number
            phone: function() {
                return {
                    format: "(###) ###-####",
                    slots: 10,
                    regex: /\d/
                }
            },

            // amount
            amount: function(options) {

                options = sn.extend({
                    digits: 2,
                    digitSeparator: ".",
                    thousandSeparator: " "
                }, options || {});

                let format = "###" + options.thousandSeparator + "###"+ options.thousandSeparator + "###" +
                    options.thousandSeparator + "###"+ options.thousandSeparator + "###";

                if(options.digits > 0)
                    format += options.digitSeparator + "#".repeat(options.digits);

                let slots = 15 + options.digits;

                return {
                    format: format,
                    slots: slots,
                    reverse: true,
                    regex: /\d/
                }
            }
        }
    }
}