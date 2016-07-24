# sn.app

A simple framework to build Web applications that run in modern browsers

## modules

### core

A series of helpers

### component

A module to work with components

### event

A module to handle native and custom events

### form

A module to render forms

### mask

A module to format the way values are displayed and stored

### request

A module to make AJAX requests 

### router

A module to manage application states with URL segments

### validation

A module to validate data, mainly used for form fields

#### How to add your own validator

```js
// your function must return a boolean value (true = valid)
sn.validation.isTom = function(value, args, fieldName, form)
{
  return value === "Tom";
}
```

### vdom

The virtual DOM engine (mainly used to diff and patch components)

## todo

* [request] File upload (http://stackoverflow.com/questions/6211145/upload-file-with-ajax-xmlhttprequest)
* [core] Support for Firefox