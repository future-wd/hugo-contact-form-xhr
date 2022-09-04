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
//  * @param {string} statusId - ID of status message div // internal use
//  * @param {string} spinnerId - ID of spinner div // internal use
 * @param {bool} dropzone - true to enable dropzone
 * @param {string} dropzoneFormSelector - selector of dropzone form e.g. #js-dropzoneForm
 * @param {string} dropzoneSubmitId - ID of submit button (if using dropzone)
 * @param {String} dropzoneMaxFiles = 6,
 * @param {int} dropzoneParallelUploads = 6,
 * @param {string} dropzoneAcceptedFiles = 'image/*', glog
 * @param {int} dropzoneResizeWidth = 800, in px
 * @param {int}  dropzoneTimeout = 8000, in miliseconds
 * @param {bool} - debug - true to turn on debug messages
 */

import Dropzone from 'dropzone';

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
  dBlockClass = 'd-block', // BS5
  dropzone = false,
  dropzoneFormSelector = '',
  dropzoneSubmitId = 'js-submit',
  dropzoneMaxFiles = 6,
  dropzoneParallelUploads = 6,
  dropzoneAcceptedFiles = 'image/*',
  dropzoneResizeWidth = 800,
  dropzoneTimeout = 8000,
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
  form.appendChild(recaptchaDiv);

  // target forms submit button for recapcha v2 and to enable/disable/hide submit button
  // may not be needed in v3
  let submit;
  if (dropzone) {
    submit = document.getElementById(dropzoneSubmitId);
    if (!submit) {
      console.error(`${dropzoneSubmitId} is not a valid id of a submit button`);
    }
  } else {
    submit = form.querySelector('button[type="submit"]');
  }

  // first input in the form
  const firstInput = form.elements[0];

  // create spinner div, add class, hide
  const spinnerWrapper = document.createElement('div');
  // spinnerWrapper.className = 'mt-3'
  const spinner = document.createElement('div');
  spinner.classList.add(spinnerClass, hiddenClass, dBlockClass);
  // spinnerWrapper.appendChild(spinner)
  // create status div
  const status = document.createElement('div');
  //status.id = statusId;
  status.className = hiddenClass;
  status.setAttribute('role', 'alert');
  // append both to lower form
  if (dropzone) {
    submit.insertAdjacentElement('afterend', spinner);
    submit.insertAdjacentElement('afterend', status);
  } else {
    form.appendChild(spinner);
    form.appendChild(status);
  }

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
  /*eslint no-undef: "error"*/
  // console.log(`grecaptchaKey is ${grecaptchaKey}`);
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
    submit.addEventListener('click', () => {
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

      if (dropzone) {
        if (myDropzone.getQueuedFiles().length > 0) {
          if (debug === true) {
            console.log(
              `${
                myDropzone.getQueuedFiles().length
              } images detected, dropzone to process queue`
            );
          }
          myDropzone.processQueue();
          return;
        }
      }
      // else ...
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
    // temp fix for old v1 endpoint
    // if (!data.success && data.status) {
    //   data.success = data.status
    // }
    // show alert. if not data.success, defaults to false
    // fall backs above will kick in also if needed
    showAlert(data.message, data.success);
    if (data.connectionError === true) {
      // reset recaptcha and enable submit form on timeout or connection issue
      // dont reset form
      gReset();
      submit.disabled = false;
    } else {
      // reset form (user error generated from endpoint, or success
      form.classList.remove('was-validated');
      form.reset();
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

  /**
   * only if dropzone = true
   *
   * fix this up!
   */

  // function for serializing all inputs in a form
  // const serializeArray = (form) => {
  //   let arr = [];
  //   Array.prototype.slice.call(form.elements).forEach(function (field) {
  //     if (
  //       !field.name ||
  //       field.disabled ||
  //       ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1
  //     )
  //       return;
  //     if (field.type === 'select-multiple') {
  //       Array.prototype.slice.call(field.options).forEach(function (option) {
  //         if (!option.selected) return;
  //         arr.push({
  //           name: field.name,
  //           value: option.value,
  //         });
  //       });
  //       return;
  //     }
  //     if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked)
  //       return;
  //     arr.push({
  //       name: field.name,
  //       value: field.value,
  //     });
  //   });
  //   return arr;
  // };

  // global Dropzone */
  const dropzoneOptions = {
    // method and paramName defaults have been commented
    url: formAction,
    // method: 'POST',
    // paramName: 'file', // The name that will be used to transfer the file
    paramName: "photo", // end point looks for file name
    uploadMultiple: true,
    autoProcessQueue: false,
    maxFiles: dropzoneMaxFiles,
    parallelUploads: dropzoneParallelUploads,
    acceptedFiles: dropzoneAcceptedFiles,
    resizeWidth: dropzoneResizeWidth,
    maxThumbnailFilesize: 15,
    addRemoveLinks: true,
    autoQueue: true,
    timeout: dropzoneTimeout,
  };
  // disable autodiscover so dropzone doesnt attach to the form
  Dropzone.autoDiscover = false;
  // initialize and attach
  let myDropzone = new Dropzone(dropzoneFormSelector, dropzoneOptions);

  // Listen to the sendingmultiple event. In this case, it's the sendingmultiple event instead
  // of the sending event because uploadMultiple is set to true.
  myDropzone.on('sendingmultiple', function (file, xhr, formData) {
    // Gets triggered when the form is actually being sent
    // initial event triggered by window.onSubmit
    // const formFields = serializeArray(form);
    // if (debug == true) {
    //   console.log(`serialised form fields: ${formFields}`);
    // }
    const contactFormData = new FormData(form);
    // add account field
    formData.append('account', account);
    // add all fields from top contact form
    for (const entry of contactFormData.entries()) {
      formData.append(entry[0], entry[1]);
      ('account', account);
      if (debug == true) {
        console.log(`appended field:${entry[0]}: ${entry[1]}`);
      }
    }

    // add each formField to formData (Which is currently just the image(s)
    // formFields.forEach(function (field) {
    //   formData.append(field.name, field.value);
    //   if (debug == true) {
    //     console.log(`appended field:: ${field.name}, ${field.value}`);
    //     // loop over formData for console.log
    //     console.log('dropzone FormData:');
    //     for (const value of formData.values()) {
    //       console.log(value);
    //     }
    //   }
    // });
  });

  myDropzone.on('successmultiple', function (files, response) {
    // Gets triggered when the files have successfully been sent.
    xhrCallback({ success: true, message: response.message });
  });
  myDropzone.on('errormultiple', function (files, response) {
    // Gets triggered when there was an error sending the files.
    if (debug == true) {
      console.log(response);
    }
    if (typeof response.message === 'undefined' || response.message === null) {
      // only show this generic error is there is no response,
      // as dropzone also assigns error messages to response
      // this overrides dropzone errors to avoid issues as response will be defined
      xhrCallback({
        success: false,
        message: 'Sorry there is a connection error, please try again later.',
      });
    }
    xhrCallback({ sucess: false, message: response.message });
  });
  myDropzone.on('maxfilesexceeded', function (file) {
    this.removeFile(file);
    alert(`Only ${dropzoneMaxFiles} files can be uploaded!`);
  });
};

export default contactForm;
