# sn.app

A simple framework to build single-page applications for modern browsers

## modules

### core

A series of helpers

### component

A module to manage components

### event

A module to manage event emitters and observers

### form

A module to render forms

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

* [component] Fix embedded form/scope not triggering parent scope rendering
* [request] File upload
* [form] Input masks
* [core] Support for Firefox