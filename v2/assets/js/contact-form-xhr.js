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
 * @param {string} alertClass - CSS class used to display an alert box
 * @param {string} successClass - CSS modifier class for success alert
 * @param {string} errorClass - CSS class used to modify alert into a error alert
 * @param {string} hiddenClass - CSS class used to hide a div (non BS)
 * @param {string} statusId - ID of status message div
 * @param {string} spinnerId - ID of spinner div
 */

export default ({
  formId = '',
  formAction = '',
  grecaptchaKey = '',
  account = '',
  formTimeout = 8000,
  grecaptchaLocation = 'bottomright', // defaults to bottom right as most contact forms are on the right
  // if using bootstrap don't modify
  alertClass = 'alert', // BS5
  successClass = 'alert-success', // BS5
  errorClass = 'alert-danger', // BS5
  spinnerClass = 'spinner-border', // BS5
  hiddenClass = 'd-none', // BS5
  //don't need to modify - these elements are dynamically generated by this script
  spinnerId = 'js-spinner', // generated by JS
  statusId = 'js-statusMessage', // generated by JS
  // turn on for console.log messages
  debug = false,
} = {}
) => {
  if (debug === true) {
    console.log('script loaded');
  }
  // get form from config, otherwise choose first form on page
  var form;
  if (formId) {
    form = document.getElementById(formId);
  } else {
    form = document.getElementsByTagName("form")[0];
  }
  // target forms submit button for recapcha v2 and to enable/disable/hide submit button
  // may not be needed in v3
  const submit = form.querySelector('button[type="submit"]');

  // first input in the form
  const firstInput = form.elements[0];

  // create spinner div, add class, hide and append to form
  const spinner = document.createElement("div");
  spinner.id = spinnerId;
  spinner.classList.add(spinnerClass, hiddenClass);
  form.appendChild(spinner);

  // create status div and append to form
  const status = document.createElement("div");
  status.id = statusId;
  status.className = alertClass;
  status.setAttribute('role', 'alert');
  form.appendChild(status);

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
      console.log('google recaptcha lazy loaded and event listener removed');
    }
  }
  //add event listener to load grecaptcha
  firstInput.addEventListener('focus', gLoad, false);

  //google recaptcha 2 invisible
  /*global grecaptcha */
  /*eslint no-undef: "error"*/
  // console.log(`grecaptchaKey is ${grecaptchaKey}`);
  window.onloadCallback = () => {
    grecaptcha.render(submit, {
      sitekey: grecaptchaKey,
      badge: grecaptchaLocation,
      callback: formSubmit,
      // when grecaptcha is triggered by click on submitId, it calls onSubmit
    });
    submit.disabled = false;
  };

  // on submit event, called by recaptcha
  // performs js validation of form.
  /*global formSubmit */
  /*eslint no-undef: "error"*/
  window.formSubmit = () => {
    if (!form.checkValidity()) {
      //if not valid
      form.classList.add('was-validated'); //shows errors on failed fields
      grecaptcha.reset(); //reset grecaptcha as it only allows 1 click before being disabled
    } else {
      //if valid
      //hide button
      if (debug === true) {
        console.log('hide button');
      }
      submit.classList.add(hiddenClass);
      //show spinner
      if (debug === true) {
        console.log('show spinner');
      }
      spinner.classList.remove(hiddenClass);
      //submit form and print status and response
      if (debug === true) {
        console.log('postData');
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
    // form param must be an element
    const data = new FormData(form);
    data.set('account', account);
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
            if (o && typeof o === "object") {
              // return o;
              return true;
            }
          }
          catch (e) {
            return false;
          }
        }
        // if JSON, parse and send text to callback, 
        if (checkJSON(xhr.responseText)) {
          callback(JSON.parse(xhr.responseText))
        } else { // otherwise send text to callback (for server debug messages)
          const data = {
            status: false,
            message: xhr.responseText,
          }
          callback(data);
        }
      } else {     // non 200 status
        const data = {
          status: false,
          notUserError: true,
          message: 'Connection error, please try again',
        }
        callback(data);
      }
    };

  };

  function gReset() {
    //reset grecaptcha as it only allows 1 click before being disabled
    grecaptcha.reset();
    // hide alert
    status.classList.add(hiddenClass);
    // remove alert type class on alert
    status.classList.remove(errorClass);
    // show button
    submit.classList.remove(hiddenClass);
  }

  /**
   * callback function - takes response returned from server and displays status message
   * @param {Object} data - Response from form or XHR event handlers
   * @param {Boolean} data.status - True for successful message submission
   * @param {String} data.message - The status message to display under the form
   */
  const xhrCallback = (data) => {
    if (debug == true) {
      console.log(`callback initiated, data is ${JSON.stringify(data)}`);
      console.log('hide spinner');
    }
    // hide spinner
    spinner.classList.add(hiddenClass);
    // add text to status div
    // fallback for uncaught errors
    // should not be needed
    if (!data) {
      data = {
        status: false,
        message: 'A connection error has occured, please try again later',
      };
    }
    status.innerHTML = data.message;

    if (data.success === true && data.message) {
      // success
      //hide form
      //document.getElementById(formId).classList.add(hiddenClass);
      // add success alert classes to status div
      status.classList.add(successClass);
      // remove hidden class on status div
      status.classList.remove(hiddenClass);
    } else {
      // error
      // add error alert classes to status div
      status.classList.add(errorClass);
      // remove hidden class on status div
      status.classList.remove(hiddenClass);
      if (data.notUserError === true) {
        // reset recaptcha and show submit form on timeout
        gReset();
        submit.classList.remove(hiddenClass);
      } else {
        // reset form (user error generated from endpoint)
        form.classList.remove('was-validated');
        form.reset();
        // only reset alert/button when user focuses on name input
        firstInput.addEventListener('focus', function resetGoogle() {
          gReset()
          this.removeEventListener('focus', resetGoogle);
        }, false);
      }
    }
  };
};
