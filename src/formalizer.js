

// ********************************************************************************************************************


export default class Formalizer {
    form;
    invalidClass;
    validClass;
    focusOnError;
    onValidate;
    onInvalidElement;
    language;
    errorReporting;
    validateOn;
    handleSubmitButton;
    translations;

    _firstInvalidElement;

    // ----------------------------------------------------------------------------------------------------------------

    constructor(options) {
        this.form = options.form;
        this.invalidClass = options.hasOwnProperty('invalidClass') ? options.invalidClass : 'is-invalid';
        this.validClass = options.hasOwnProperty('validClass') ? options.validClass : 'is-valid';
        this.focusOnError = options.hasOwnProperty('focusOnError') ? options.focusOnError : true;
        this.onValidate = options.hasOwnProperty('onValidate') ? options.onValidate : null;
        this.onInvalidElement = options.hasOwnProperty('onInvalidElement') ? options.onInvalidElement : null;
        this.language = options.hasOwnProperty('language') ? options.language : 'en';
        // valid values: none, hint, tooltip, errelement
        this.errorReporting = options.hasOwnProperty('errorReporting') ? options.errorReporting : 'hint';
        this.handleSubmitButton = options.hasOwnProperty('handleSubmitButton') ? options.handleSubmitButton : false;
        // valid values: manual, submit, input, focus
        this.validateOn = options.hasOwnProperty('validateOn') ? options.validateOn : 'submit';

        // disable browser validation
        this.form.setAttribute('novalidate', 'novalidate');

        switch (this.validateOn) {
            case 'submit':
                // hook to submit event
                this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
                break;
            case 'input':
                // hook to keyup event
                const handler = this.onKeypressHandler.bind(this);
                this.getElementsForValidation().forEach((element) => {
                    element.addEventListener('keyup', handler);
                });
                break;
            case 'focus':
                break;
            default:
                // default - no handling
                break;
        }

        if (this.handleSubmitButton) {
            this.validate();
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    onSubmitHandler(event) {
        if (!this.validate()) {
            event.preventDefault();
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    onKeypressHandler(event) {
        this.validate();
    }

    // ----------------------------------------------------------------------------------------------------------------

    getElementsForValidation() {
        const queries = ['input:not([type="hidden"])', 'textarea'];
        const res = [];

        queries.forEach((elementType) => {
            const elements = this.form.querySelectorAll(elementType);
            elements.forEach((element) => {
                res.push(element);
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

            this.setElementValidity(element, elementValid);

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

                case 'errelement':
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

                case 'tooltip':
                    element.setAttribute('title', '');
                    break;
            }
        });
    }

    // ----------------------------------------------------------------------------------------------------------------

    raiseError(element, errorCode) {
        const errorMessage = this.getTranslationString(errorCode);

        if (this._firstInvalidElement === null) {
            this._firstInvalidElement = element;
        }
        if (this.onInvalidElement) {
            this.onInvalidElement(element, errorCode);
        }

        switch (this.errorReporting) {
            case 'none':
                break;

            case 'hint':
                element.setAttribute('title', errorMessage);
                break;

            case 'errelement':
                // create random id for a new error element
                const elementId = this.randomStr(10);
                // create error element html
                const errElement = `<small class="form-text text-danger" id=${elementId}>${errorMessage}</small>`;
                // set data attribute to element, pointing to error element
                element.dataset['errElementId'] = elementId;
                // finally, add error element html right after element
                element.insertAdjacentHTML('afterend', errElement);
                break;

            case 'tooltip':
                element.setAttribute('title', errorMessage);
                break;
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    validateTextElement(element) {
        let result = true;
        const minlength = parseInt(element.getAttribute('minlength'));
        const maxlength = parseInt(element.getAttribute('maxlength'));

        if (!isNaN(minlength) && element.value.length < minlength) {
            this.raiseError(element, 'value_too_short');
            result = false;
        }
        if (!isNaN(maxlength) && element.value.length > maxlength) {
            this.raiseError(element, 'value_too_long');
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
                this.raiseError(element, 'number_less_than');
                result = false;
            }
            if (!isNaN(max) && element.value > max) {
                this.raiseError(element, 'number_greater_than');
                result = false;
            }
        }

        return result;
    }

    // ----------------------------------------------------------------------------------------------------------------

    validateEmailElement(element) {
        let result = true;

        // this regex apparently checks if email address format is valid
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!re.test(element.value.toLowerCase())) {
            this.raiseError(element, 'invalid_email');
            result = false;
        }

        return result;
    }

    // ----------------------------------------------------------------------------------------------------------------

    setElementValidity(element, value) {
        // value: possible values: true / false / null

        // if null, just reset elements and remove all validity classes
        if (value === null) {
            element.classList.remove(this.validClass);
            element.classList.remove(this.invalidClass);
        } else {
            if (value) {
                // set element valid
                element.classList.add(this.validClass);
                element.classList.remove(this.invalidClass);
            } else {
                // set element invalid
                element.classList.remove(this.validClass);
                element.classList.add(this.invalidClass);
            }
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    getTranslationString(id) {
        if (Formalizer.translations.hasOwnProperty(id)) {
            return Formalizer.translations[id];
        } else {
            return 'Unknown translation id ' + id;
        }
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
