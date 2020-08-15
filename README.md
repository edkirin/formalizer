# formalizer
Simple, but flexible and configurable form validity checker.

## Features

- Written in Vanilla JavaScript, doesn't require jQuery

- Zero runtime dependencies
- Compatible with Bootstrap CSS framework
- Very small footprint - less than 8k

## Building formalizer

### Requirements

- [nodejs](https://nodejs.org/)

### Build from source

```
$ git clone git@github.com:edkirin/formalizer.git
$ cd formalizer
$ npm install
$ npm run build
```

### Install from npm

```
$ npm install @edkirin/formalizer
```

## Basic usage

```javascript
import Formalizer from "@edkirin/formalizer";

const formalizer = new Formalizer({
    form: document.querySelector('#myform'),
    language: 'en',
    errorReporting: 'element',
    validateOn: 'input',
    handleSubmitButton: true
});
```

### Constructor options

Options are set when formalizer object is created.

```javascript
import Formalizer from "@edkirin/formalizer";

const formalizer = new Formalizer(options);
```

#### options.form : DOM element

Form element which will be handled by Formalizer. It could be provided by:

```javascript
options.form = document.querySelector('#myform');
```

or using jQuery:

```javascript
options.form = $('#myform')[0];
```

#### options.invalidClass : string

CSS class which will be applied to input field which fails to validate.

default: *is-invalid*

#### options.validClass : string

CSS class which will be applied to input field which validates correctly.

default: *is-valid*

#### options.focusOnError : bool

If true, first invalid input field will be focused on validation error.

default: *true*

#### options.onValidate : callback

Optional callback which is called after form validation occurs. Callback function is called with following parameters as object:

```javascript
callback(params);
```

​	params.formalizer: Formalizer object, as sender

​	params.form: current form

​	params.isValid: represents actual form validity

Callback function is optional.

default: *null*

#### options.onInvalidElement : callback

Optional callback which is called after input element is detected as invalid. Callback function is called with following parameters as object:

```javascript
callback(params);
```

​	params.formalizer: Formalizer object, as sender

​	params.form: current form

​	params.errMessage: error message with which validation failed

Callback function is optional.

default: *null*

#### options.language : string

Language code for error messages. For supported languages check [src/i18n](https://github.com/edkirin/formalizer/tree/master/src/i18n) directory.

#### options.errorReporting : string

Defines how validation errors appear. Possible values are:

- none - No error messages are reported, just CSS classes are set on elements
- hint - Title hint on input field with error message is set.
- element - DOM element with error message is created after input field.

default: *element*

#### options.errorTemplate : string

HTML template template which will be used for creating DOM element when *options.errorReporting* option is set to *element*. Example:

```javascript
options.errorTemplate = '<small class="form-text text-danger" id="%id">%message</small>';
```

Template must contain two template fields which will be in the run time substituted with actual values:

- %id
- %message

You don't need to set values for those fields, just provide their places in your template.

default: *template above*

#### options.validateOn : string

This option defines when validation function is triggered. Possible values are:

- manual
- submit
- input
- focus

##### manual

Form validation is triggered manually, by calling Formalizer method:

```javascript
formalizer.validate();
```

##### submit

Form validation is triggered uppon the form submit. If form contains errors, submit is cancelled.

##### input

Form validation is triggered when key is pressed.

##### focus

Form validation is triggered when input fields focus is changed.

#### options.handleSubmitButton : bool

If option is set to true, Formalizer will take control over form submit button and set his enabled state according to validation result.

default: *false*

### Markup

Formalizer will perform validation checks on:

- input fields of type *text*, *password*, *number* and *email*
- textarea

#### Check if value is entered

To set field as required, use *required* attribute on input field.

```html
<input type="text" name="myfield" required>
```

Used on:

- input fields
- textarea fields

#### Check length of entered text

To check length, use *minlength* and/or *maxlength* attributes on input field.

```html
<input type="text" name="myfield" minlength="5" maxlength="10">
```

Used on:

- input fields
- textarea fields

#### Check if value is valid email

Every email input field will be automatically test for email format validity.

Used on:

- input fields of type email

#### Check if number is valid

Input fields of type *number* will be validated for number validity. Optionally, *min* and *max* values can be also validated.

```html
<input type="number" name="myfield1" min="0" max="100">
<input type="number" name="myfield2" min="5">
```

#### Preventing validation on certain fields

To prevent validation on certain fields, use *data-validate="off"*.

```html
<input type="text" name="myfield" data-validate="off">
```