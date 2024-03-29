'use strict';
/** @module hugo-contact-form-xhr */
/**
 * default function
 * @param {string} formId - ID of form to collect inputs from (defaults to first form on page)
 * @param {string} formAction - URL to post form to
 * @param {String} account - account for endpoint, appended to form data as field
 * @param {integer} formTimeout - Time to wait before timeout (milliseconds) defaults to 8000
 * @param {string} grecaptchaKey - Google recaptcha public/site key
 * @param {string} grecaptchaLocation - Recaptcha location (bottomright (Default), bottomleft, or inline)
 // * @param {string} alertClass - CSS class used to display an alert box
 * @param {string} alertSuccessClass - CSS modifier class for success alert
 * @param {string} alertErrorClass - CSS class used to modify alert into a error alert
 * @param {string} hiddenClass - CSS class used to hide a div 
 * @param {string} dBlockClass - Display: block class 
 * @param {bool} - debug - true to turn on debug messages
 */



const contactForm = ({
  formId = '',
  formAction = '',
  grecaptchaKey = '',
  account = '',
  formTimeout = 8000,
  grecaptchaLocation = 'bottomright', // defaults to bottom right as most contact forms are on the right
  alertSuccessClass = 'alert alert-success', // BS5
  alertErrorClass = 'alert alert-danger', // BS5
  spinnerClass = 'spinner-border', // BS5
  hiddenClass = 'd-none', // BS5
  dBlockClass = 'd-block', //bs5
  submitId = 'js-submit',
  // turn on for console.log messages
  debug = false,
} = {}) => {
  if (debug === true) {
    console.log('script loaded');
  }

  // get form from config, otherwise choose first form on page
  // should the auto id be removed?
  let form;
  if (formId) {
    form = document.getElementById(formId);
    if (!form) {
      console.error(`${form} is not a valid form id`);
    }
  } else {
    form = document.getElementsByTagName('form')[0];
  }

  // add div for recaptcha
  const recaptchaDiv = document.createElement('div');
  recaptchaDiv.className = 'g-recaptcha';
  // is this required?
  recaptchaDiv.ariaHidden = true;
  form.appendChild(recaptchaDiv);

  // add input for account for endpoint v2
  const accountInput = document.createElement('input');
  accountInput.name = 'account';
  accountInput.value = account;
  accountInput.ariaHidden = true;
  accountInput.className = hiddenClass;
  form.appendChild(accountInput);

  // target forms submit button for recapcha v2 and to enable/disable/hide submit button
  // may not be needed in v3
  const submit = document.getElementById(submitId);
  if (!submit) {
    console.error(`${submitId} is not a valid id of a submit button`);
  }

  // first input in the form
  const firstInput = form.querySelector('input');

  // create spinner div, add class, hide
  const spinner = document.createElement('div');
  spinner.classList.add(spinnerClass, hiddenClass, dBlockClass);
  // spinnerWrapper.appendChild(spinner)
  // create status div
  const status = document.createElement('div');
  //status.id = statusId;
  status.className = hiddenClass;
  status.setAttribute('role', 'alert');
  submit.insertAdjacentElement('afterend', spinner);
  submit.insertAdjacentElement('afterend', status);

  // recaptcha script lazy load
  function gLoad(event) {
    event.stopPropagation();
    this.removeEventListener('focus', gLoad);
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src =
      'https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit';
    // grecaptcha calls onloadCallback() when loaded
    head.appendChild(script);
    // removed so script only loads once.
    if (debug === true) {
      console.log(
        'google recaptcha script lazy loaded and event listener removed'
      );
    }
  }
  //add event listener to load grecaptcha
  firstInput.addEventListener('focus', gLoad, false);

  //google recaptcha 2 invisible
  /*global grecaptcha */
  onloadCallback = () => {
    grecaptcha.render(recaptchaDiv, {
      sitekey: grecaptchaKey,
      badge: grecaptchaLocation,
      callback: formSubmit,
      size: 'invisible',
      // when grecaptcha is triggered by click on submitId, it calls onSubmit
    });
    if (debug === true) {
      console.log('google recaptcha rendered and submit btn enabled/listening');
    }

    // clicking submit calls grecaptcha
    form.addEventListener('submit', (event) => {
      console.log('form submitted');
      // prevent form submit defaults
      event.preventDefault();
      event.stopPropagation();
      // calls formSubmit()
      grecaptcha.execute();
    });
    submit.disabled = false;
  };
  // export to global context
  window.onloadCallback = onloadCallback;

  // on submit event, called by recaptcha
  // performs js validation of form.
  /*global formSubmit */
  /*eslint no-undef: "error"*/
  const formSubmit = (token) => {
    if (!form.checkValidity()) {
      //if not valid
      form.classList.add('was-validated'); //shows errors on failed fields
      grecaptcha.reset(); //reset grecaptcha as it only allows 1 click before being disabled
    } else {
      //if valid
      if (debug === true) {
        console.log('formSubmit - disable button');
      }
      //hide button
      submit.disabled = true;
      //show spinner
      if (debug === true) {
        console.log('formSubmit - show spinner');
      }
      spinner.classList.remove(hiddenClass);
      //submit form and print status and response

      if (debug === true) {
        console.log('postData called no dropzone');
      }
      postData(form, formAction, xhrCallback);
      
    }
  };

  /**
   * postData function - posts all data from form
   * @param {String} form - ID of form to pull data from
   * @param {String} action - form action url
   * @param {String} callback - callback function
   */
  const postData = (form, action, callback) => {
    // // form param must be an element
    const data = new FormData(form);
    // data.set('account', account);
    if (debug === true) {
      // Display the key/value pairs
      console.log('form entries:');
      for (var pair of data.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', action);
    xhr.send(data);
    xhr.timeout = formTimeout;
    // xhr.responseType = 'json';
    // text type used so that is response isnt json, its passed through as text (for php and server error debugging)
    // xhr.responseType = 'text'; // default
    xhr.onloadend = () => {
      if (xhr.status === 200) {
        // check for JSON, returns true if JSON
        function checkJSON(text) {
          try {
            var o = JSON.parse(text);
            if (o && typeof o === 'object') {
              // return o;
              return true;
            }
          } catch (e) {
            return false;
          }
        }
        // if JSON, parse and send text to callback,
        if (checkJSON(xhr.responseText)) {
          callback(JSON.parse(xhr.responseText));
        } else {
          // otherwise send text to callback (for server debug messages)
          const data = {
            success: false,
            message: xhr.responseText,
          };
          callback(data);
        }
      } else {
        // non 200 status, no message will be generated from this endpoint
        const data = {
          success: false,
          connectionError: true,
          message: 'Connection error, please try again',
        };
        callback(data);
      }
    };
  };

  function gReset() {
    //reset grecaptcha as it only allows 1 click before being disabled
    grecaptcha.reset();
    // hide alert
    hideAlert();
    // enable button
    submit.disabled = false;
  }

  /**
   * callback function - takes response returned from server and displays status message
   * @param {Object} data - Response from form or XHR event handlers
   * @param {Boolean} data.success - True for successful message submission
   * @param {String} data.message - The status message to display under the form
   */
  const xhrCallback = (data) => {
    if (debug == true) {
      console.log(`callback initiated, data is ${JSON.stringify(data)}`);
      console.log('hide spinner');
    }
    // hide spinner
    spinner.classList.add(hiddenClass);
    // fallback for uncaught errors
    // should not be needed
    if (!data) {
      data = {
        success: false,
        message: 'A connection error has occured, please try again later',
      };
    }
    // if data is passed but no message
    // should not be needed
    if ((!data.message, false)) {
      data.message = 'A server error has occured, please try again later';
    }
    // show alert. if not data.success, defaults to false
    // fall backs above will kick in also if needed
    showAlert(data.message, data.success);
    if (data.connectionError === true) {
      // reset recaptcha and enable submit form on timeout or connection issue
      // dont reset form
      gReset();
      submit.disabled = false;
    } else {
      // reset form (user error generated from endpoint, or success)
      form.classList.remove('was-validated');
      form.reset();
      //FIX
      //reset dropzone also here!!
      //
      // only reset alert/button when user focuses on name input
      // allows more time before recaptcha times out
      firstInput.addEventListener(
        'focus',
        function resetGoogle() {
          gReset();
          this.removeEventListener('focus', resetGoogle);
        },
        false
      );
    }
  };

  const showAlert = (msgStr, success = false) => {
    status.innerHTML = msgStr;
    if (success === true) {
      // add success alert classes to status div (removes hidden class)
      status.className = alertSuccessClass;
    } else if (success === false) {
      status.className = alertErrorClass;
    }
  };

  const hideAlert = () => {
    status.className = hiddenClass;
  };

};

export default contactForm;
