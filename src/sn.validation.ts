namespace sn
{
    export var validation = {

        // required
        required: function(value)
        {
            return !sn.isEmpty(value);
        }

    }
}