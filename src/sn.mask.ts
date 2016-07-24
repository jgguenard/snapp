namespace sn
{
    export var mask =
    {
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

        applyInputMask: function(maskName, event) {
            let key = this.getKey(event);
            if (this.isPrintable(key)) {
                var ch = String.fromCharCode(key);
                var value = event.target.value;
                var str = value + ch;
                var pos = str.length;
                var parser = this.parser[maskName];
                var regex = this.getRegexAt(parser.regex, pos - 1);
                if(regex.test(ch) && pos <= parser.format.display.length)
                {
                    let filler = "";
                    while(pos < parser.format.display.length && parser.format.display.charAt(pos-1) != "#")
                    {
                        filler += parser.format.display.charAt(pos-1);
                        pos++;
                    }
                    if(filler !== "")
                        str = value + filler + ch;
                    event.target.value = str;
                }
                sn.event.stopNativeEvent(event);
            }
        },

        applyMask: function(maskName, value, formatName?)
        {
            // default format
            if(!formatName)
                formatName = "display";

            // get mask
            let mask = this.parser[maskName];
            if(!mask)
                return value;

            // get format
            let format = mask.format[formatName];
            if(!format)
                return value;

            // get unmasked value
            value = this.getUnmaskedValue(maskName, value, formatName);

            let mValue = "";
            // apply mask
            for(let c = 0; c < value.length; c++)
            {
                let ch = value.charAt(c);
                let str = mValue + ch;
                let pos = str.length;
                let filler = "";
                while(pos < format.length && format.charAt(pos-1) != "#")
                {
                    filler += format.charAt(pos-1);
                    pos++;
                }
                mValue += filler + ch;
            }

            return mValue;
        },

        getUnmaskedValue: function(maskName, value, formatName)
        {
            // check value integrity
            if(sn.isEmpty(value))
                return value;
            else
                value = value.toString();

            // get mask
            let parser = this.parser[maskName];
            let format = parser.format[formatName];

            // get number of character slots
            let allowedCharCount = 0;
            for(let i=0;i<format.length;i++)
                if(format[i] === "#")
                    allowedCharCount++;

            // for all slots, try to match regex by removing characters
            for(let pos = 0; pos < allowedCharCount && pos < value.length; pos++)
            {
                let regex = this.getRegexAt(parser.regex, pos);
                while(!regex.test(value.charAt(pos)) && pos < value.length)
                    value = value.substring(0, pos) + value.substring(pos +1);
            }

            // if too long, cut it
            if(value.length > allowedCharCount)
                value = value.substring(0, allowedCharCount);

            return value;
        },

        parser: {

            // phone number
            phone: {
                format: {
                    display: "(###) ###-####",
                    data: "##########"
                },
                regex: /\d/
            },

            // money with 2 digits
            money: {
                format: {
                    display: "#########.##",
                    data:  "#########.##"
                },
                reverse: true, // TODO
                regex: /\d/
            }
        }
    }
}