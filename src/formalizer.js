

// ********************************************************************************************************************


class Formalizer {
    form = null ;
    invalidClass = 'is-invalid' ;
    validClass = 'is-valid' ;
    focusOnError = true ;
    onValidate = null ;
    onInvalidElement = null ;
    language = 'en' ;
    errorReporting = 'element' ;  // valid values = none ; hint ; element
    errorTemplate = null ;
    handleSubmitButton = false ;
    validateOn = 'submit' ;  // valid values = manual ; submit ; input ; focus

    _translations;
    _firstInvalidElement;
    _silent_errors = false;

    // ----------------------------------------------------------------------------------------------------------------

    constructor(options) {
        Object.assign(this, options);

        // disable browser validation
        this.form.setAttribute('novalidate', 'novalidate');

        // load translations
        this._translations = require('./i18n/' + this.language).translations;

        // set default errorTemplate, if not set:
        if (this.errorTemplate === null) {
            this.errorTemplate = '<small class="form-text text-danger" id="%id">%message</small>';
        }

        if (this.handleSubmitButton) {
            // it shouldn't be set handleSubmitButton and validation on submit.
            // if it's the case, fallback validation on input
            if (this.validateOn === 'submit') {
                this.validateOn = 'input';
            }
            this._silent_errors = true;
            this.validate();
            this._silent_errors = false;
        }

        switch (this.validateOn) {
            case 'submit':
                // hook to submit event
                this.form.addEventListener('submit', (event) => {
                    if (!this.validate()) {
                        event.preventDefault();
                    }
                });
                break;
            case 'input':
                // hook to keyup event
                this.getElementsForValidation().forEach((element) => {
                    element.addEventListener('keyup', (event) => {
                        this.validate();
                    });
                });
                break;
            case 'focus':
                this.getElementsForValidation().forEach((element) => {
                    element.addEventListener('blur', (event) => {
                        this.validate();
                    });
                });
                break;
            default:
                // default - no handling
                break;
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    getElementsForValidation() {
        const queries = [
            'input[type="text"],input[type="number"],input[type="email"],input[type="password"]',
            'textarea'
        ];
        const res = [];

        queries.forEach((elementType) => {
            const elements = this.form.querySelectorAll(elementType);
            elements.forEach((element) => {
                if (element.dataset.validate !== 'off') {
                    res.push(element);
                }
            });
        });

        return res;
    }

    // ----------------------------------------------------------------------------------------------------------------

    validate() {
        this.reset();

        let formValid = true;

        // enumerate all elements of type
        this.getElementsForValidation().forEach((element) => {
            let elementValid = true;

            if (element.hasAttribute('required')) {
                if (element.value.length === 0) {
                    this.raiseError(element, 'missing_value');
                    elementValid = false;
                }
            }

            if (elementValid) {
                // check other levels of validity only if not missing value
                switch (element.tagName.toLowerCase()) {
                    case 'input':
                        switch (element.getAttribute('type')) {
                            case 'text':
                            case 'password':
                                elementValid &= this.validateTextElement(element);
                                break;
                            case 'number':
                                elementValid &= this.validateNumberElement(element);
                                break;
                            case 'email':
                                elementValid &= this.validateEmailElement(element);
                                break;
                        }
                        break;

                    case 'textarea':
                        elementValid &= this.validateTextElement(element);
                        break;
                }
            }

            // if all type specific tests pass, go for additional checks
            if (elementValid) {
                // check data-validity-equalto
                const equalTo = element.dataset.validateEqualto;
                if (equalTo) {
                    const otherElement = document.querySelector(equalTo);
                    elementValid &= otherElement && otherElement.value === element.value;
                    if (!elementValid) {
                        this.raiseError(element, 'equalto_fail');
                    }
                }
            }

            if (!this._silent_errors) {
                this.setElementValidity(element, elementValid);
            }

            formValid &= elementValid;
        });

        // focus on first input element with error, if errors found
        if (this.validateOn === 'submit' && this.focusOnError && !formValid && this._firstInvalidElement) {
            this._firstInvalidElement.focus();
        }

        // enable / disable submit button
        if (this.handleSubmitButton) {
            const submitBtn = this.form.querySelectorAll('button[type="submit"]');
            submitBtn.forEach((element) => {
                if (formValid) {
                    element.removeAttribute('disabled');
                } else {
                    element.setAttribute('disabled', 'disabled');
                }
            });
        }

        // call onValidate callback, if defined
        if (this.onValidate) {
            this.onValidate({
                formalizer: this,
                form: this.form,
                valid: formValid,
            });
        }

        return formValid;
    }

    // ----------------------------------------------------------------------------------------------------------------

    reset() {
        this._firstInvalidElement = null;

        // enumerate all elements of type
        this.getElementsForValidation().forEach((element) => {
            this.setElementValidity(element, null);

            // reset error messages
            switch (this.errorReporting) {
                case 'none':
                    break;

                case 'hint':
                    element.setAttribute('title', '');
                    break;

                case 'element':
                    // get error element id from element dataset
                    const elementId = element.dataset['errElementId'];
                    // remove error element from dom
                    const errElement = document.getElementById(elementId);
                    if (errElement) {
                        errElement.remove();
                        // reset dataset
                        element.dataset['errElementId'] = '';
                        }
                    break;
            }
        });
    }

    // ----------------------------------------------------------------------------------------------------------------

    raiseError(element, errorCode, params) {
        let errMessage = this.getTranslationString(errorCode);

        // replace value placeholders with provided params
        if (params) {
            params.forEach((param) => {
                errMessage = errMessage.replace(/%s/, param);
            })
        }

        if (this._firstInvalidElement === null) {
            this._firstInvalidElement = element;
        }
        if (this.onInvalidElement) {
            this.onInvalidElement({
                formalizer: this,
                form: this.form,
                errMessage: errMessage,
            });
        }

        if (!this._silent_errors) {
            switch (this.errorReporting) {
                case 'none':
                    break;

                case 'hint':
                    element.setAttribute('title', errMessage);
                    break;

                case 'element':
                    // create random id for a new error element
                    const elementId = this.randomStr(10);

                    // create error element html
                    const errElement = this.errorTemplate.replace(/%id/, elementId).replace(/%message/, errMessage);

                    // set data attribute to element, pointing to error element
                    element.dataset['errElementId'] = elementId;

                    // finally, add error element html right after element
                    element.insertAdjacentHTML('afterend', errElement);
                    break;

                case 'tooltip':
                    element.setAttribute('title', errMessage);
                    break;
            }
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    validateTextElement(element) {
        let result = true;
        const minlength = parseInt(element.getAttribute('minlength'));
        const maxlength = parseInt(element.getAttribute('maxlength'));

        if (!isNaN(minlength) && element.value.length < minlength) {
            this.raiseError(element, 'value_too_short', [minlength]);
            result = false;
        }
        if (!isNaN(maxlength) && element.value.length > maxlength) {
            this.raiseError(element, 'value_too_long', [maxlength]);
            result = false;
        }

        return result;
    }

    // ----------------------------------------------------------------------------------------------------------------

    validateNumberElement(element) {
        let result = true;

        // check if valid numeric format
        if (isNaN(element.value)) {
            this.raiseError(element, 'invalid_number');
            result = false;
        } else {
            const min = parseInt(element.getAttribute('min'));
            const max = parseInt(element.getAttribute('max'));
            if (!isNaN(min) && element.value < min) {
                this.raiseError(element, 'number_less_than', [min]);
                result = false;
            }
            if (!isNaN(max) && element.value > max) {
                this.raiseError(element, 'number_greater_than', [max]);
                result = false;
            }
        }

        return result;
    }

    // ----------------------------------------------------------------------------------------------------------------

    validateEmailElement(element) {
        let result = true;

        if (element.hasAttribute('required') || element.value.length > 0) {
            // this regex apparently checks if email address format is valid
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (!re.test(element.value.toLowerCase())) {
                this.raiseError(element, 'invalid_email');
                result = false;
            }
        }

        return result;
    }

    // ----------------------------------------------------------------------------------------------------------------

    setElementValidity(element, value) {
        // value: possible values: true / false / null
        const cls = element.classList;

        // if null, just reset elements and remove all validity classes
        if (value === null) {
            cls.remove(this.validClass);
            cls.remove(this.invalidClass);
        } else {
            if (value) {
                // set element valid
                cls.add(this.validClass);
                cls.remove(this.invalidClass);
            } else {
                // set element invalid
                cls.remove(this.validClass);
                cls.add(this.invalidClass);
            }
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    getTranslationString(id) {
        return this._translations && this._translations.hasOwnProperty(id) ?
        this._translations[id] :
            'Unknown translation id ' + id;
    }

    // ----------------------------------------------------------------------------------------------------------------

    randomStr(len) {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';

        for (let i = 0; i < len; i++) {
           result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
     }

    // ----------------------------------------------------------------------------------------------------------------

}


// ********************************************************************************************************************

export { Formalizer };