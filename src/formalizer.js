

// ********************************************************************************************************************


export default class Formalizer {
    form;
    invalidClass;
    validClass;
    focusOnError;
    language;
    errorReporting;
    translations;

    _firstInvalidElement;

    // ----------------------------------------------------------------------------------------------------------------

    constructor(options) {
        this.form = options.form;
        this.invalidClass = options.hasOwnProperty('invalidClass') ? options.invalidClass : 'is-invalid';
        this.validClass = options.hasOwnProperty('validClass') ? options.validClass : 'is-valid';
        this.focusOnError = options.hasOwnProperty('focusOnError') ? options.focusOnError : true;
        this.onInvalidElement = options.hasOwnProperty('onInvalidElement') ? options.onInvalidElement : null;
        this.language = options.hasOwnProperty('language') ? options.language : 'en';
        // valid values: none, title, tooltip
        this.errorReporting = options.hasOwnProperty('errorReporting') ? options.errorReporting : 'title';

        // disable browser validation
        this.form.setAttribute('novalidate', 'novalidate');

        // hook to submit event
        const onSubmitHandler = this.onSubmit.bind(this);
        this.form.addEventListener('submit', onSubmitHandler);
    }

    // ----------------------------------------------------------------------------------------------------------------

    onSubmit(event) {
        if (!this.validate()) {
            event.preventDefault();
        }
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

            this.setElementValidity(element, elementValid);

            formValid &= elementValid;
        });

        if (this.focusOnError && !formValid && this._firstInvalidElement) {
            this._firstInvalidElement.focus();
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
                case 'title':
                    element.setAttribute('title', '');
                    break;
                case 'tooltip':
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
            case 'title':
                element.setAttribute('title', errorMessage);
                break;
            case 'tooltip':
                break;
        }

        console.log(element.getAttribute('name') + ': ' + errorMessage);
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

}


// ********************************************************************************************************************
