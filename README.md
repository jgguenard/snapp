# snapp
A simple framework to build single-page applications for modern browsers

## modules

### core

A series of helpers

### component

A module to manage components

### form

A module to render forms

### request

A module to make AJAX requests 

### router

A module to manage application states with URL segments

### validation

A module to validate data, mainly used for form fields

#### How to add custom validators


```js
// your function must return a boolean value (true = valid)
sn.validation.isTom = function(value)
{
  return value === "Tom";
}
```

### vdom

The virtual DOM engine (mainly used to diff and patch components)
