import Dropzone from 'dropzone';
import submitForm from './utils/submit-form';
('use strict');
/** @module hugo-contact-form-xhr */
/**
 * default function
 * @param {string} formId - ID of form to collect inputs from (defaults to first form on page)
 * @param {string} formAction - URL to post form to
 * @param {String} account - account for endpoint, appended to form data as field
 * @param {integer} formTimeout - Time to wait before timeout (milliseconds) defaults to 8000
 * @param {string} grecaptchaKey - Google recaptcha public/site key
 * @param {string} grecaptchaLocation - Recaptcha location (bottomright (Default), bottomleft, or inline)
 * @param {string} alertSuccessClass - CSS modifier class for success alert
 * @param {string} alertErrorClass - CSS class used to modify alert into a error alert
 * @param {string} hiddenClass - CSS class used to hide a div
 * @param {string} dBlockClass - Display: block class
 * @param {String} dropzoneMaxFiles = 6,
 * @param {int} dropzoneParallelUploads = 6,
 * @param {string} dropzoneAcceptedFiles = 'image/*', glog
 * @param {int} dropzoneResizeWidth = 800, in px
 * @param {bool} - debug - true to turn on debug messages
 */

// import Dropzone from 'dropzone';

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
  dropzoneMaxFiles = 6,
  dropzoneParallelUploads = 6,
  dropzoneAcceptedFiles = 'image/*',
  dropzoneResizeWidth = 800,
  // turn on for console.log messages
  debug = false,
} = {}) => {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`${formId} is not a valid id of the form`);
  }
  if (debug === true) {
    console.log('script loaded');
  }

  // target forms submit button for recapcha v2 and to enable/disable/hide submit button
  // may not be needed in v3
  const submit = document.getElementById(submitId);
  if (!submit) {
    console.error(`${submitId} is not a valid id of a submit button`);
  }
  const dropzoneOptions = {
    // method and paramName defaults have been commented
    url: formAction,
    // method: 'POST',
    // paramName: 'file', // The name that will be used to transfer the file
    paramName: 'photo', // end point looks for file name
    uploadMultiple: true,
    autoProcessQueue: false,
    maxFiles: dropzoneMaxFiles,
    parallelUploads: dropzoneParallelUploads,
    acceptedFiles: dropzoneAcceptedFiles,
    resizeWidth: dropzoneResizeWidth,
    maxThumbnailFilesize: 15,
    addRemoveLinks: true,
    autoQueue: true,
    timeout: formTimeout,
  };
  // disable autodiscover so dropzone doesnt attach to the form
  Dropzone.autoDiscover = false;
  // initialize and attach
  const dropzoneSelector = `#${formId}`;
  const myDropzone = new Dropzone(dropzoneSelector, dropzoneOptions);

  // Listen to the sendingmultiple event. In this case, it's the sendingmultiple event instead
  // of the sending event because uploadMultiple is set to true.
  myDropzone.on('sendingmultiple', function (file, xhr, formData) {
    // Gets triggered when the form is actually being sent.
    // Hide the success button or the complete form.
    // disable submit button
    submit.disabled = true;
    // hide spinner
    spinner.classList.remove(hiddenClass);
  });

  myDropzone.on('successmultiple', function (files, response) {
    // Gets triggered when the files have successfully been sent.
    // Redirect user or notify of success.
    // xhrCallback({ success: true, message: response.message });
    showAlert(response.message, true);
    formReset();
  });
  myDropzone.on('errormultiple', function (files, response) {
    // Gets triggered when there was an error sending the files.
    // Maybe show form again, and notify user of error
    if (debug == true) {
      console.log(response);
    }
    // should be able to remove this - TEST
    if (typeof response.message === 'undefined' || response.message === null) {
      // only show this generic error is there is no response,
      // as dropzone also assigns error messages to response
      // this overrides dropzone errors to avoid issues as response will be defined
      showAlert(
        'Sorry there is a connection error, please try again later.',
        false
      );
    } else {
      // KEEP THIS
      showAlert(response.message, false);
    }
    formReset();
  });
  myDropzone.on('maxfilesexceeded', function (file) {
    this.removeFile(file);
    alert(`Only ${dropzoneMaxFiles} files can be uploaded!`);
  });

  // add div for recaptcha
  const recaptchaDiv = document.createElement('div');
  recaptchaDiv.className = 'g-recaptcha';
  // is this required?
  recaptchaDiv.ariaHidden = true;
  form.appendChild(recaptchaDiv);

  // add input for account for endpoint v2
  
  const addFormElements = () => {
    const accountInput = document.createElement('input');
    accountInput.name = 'account';
    accountInput.value = account;
    accountInput.ariaHidden = true;
    accountInput.className = hiddenClass;
    form.appendChild(accountInput);
  };
  addFormElements();

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
  // append both to lower form
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
    head.appendChild(script);
    // removed so script only loads once.
  }
  //add event listener to load grecaptcha
  firstInput.addEventListener('focus', gLoad, false);

  /*global grecaptcha */
  onloadCallback = () => {
    grecaptcha.render(recaptchaDiv, {
      sitekey: grecaptchaKey,
      badge: grecaptchaLocation,
      callback: formSubmit,
      size: 'invisible',
    });
    submit.addEventListener('click', () => {
      grecaptcha.execute();
    });
    submit.disabled = false;
  };
  // export to global context
  window.onloadCallback = onloadCallback;

  // on submit event, called by recaptcha
  // performs js validation of form.
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
      //submit form
      if (myDropzone.getQueuedFiles().length > 0) {
        console.log('dropzone submission');
        myDropzone.processQueue();
      } else {
        console.log('standard submission');

        const formData = new FormData(form);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', formAction);
        xhr.send(formData);
        xhr.timeout = formTimeout;
        xhr.onloadend = () => {
          if (xhr.status === 200) {
            // check for JSON, returns true if JSON
            function checkJSON(text) {
              try {
                var o = JSON.parse(text);
                if (o && typeof o === 'object') {
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
            const data = {
              success: false,
              connectionError: true,
              message: 'Connection error, please try again',
            };
            callback(data);
          }
        };
        const callback = (data) => {
          showAlert(data.message, data.success);
          formReset();
        };
      }
    }
  };

  const formReset = () => {
    //reset grecaptcha as it only allows 1 click before being disabled
    grecaptcha.reset();
    // spinner.classList.add(hiddenClass);
    submit.disabled = false;
    form.classList.remove('was-validated');
    form.reset();
    // add elements again after reset
    addFormElements();
    if (myDropzone) {
      myDropzone.removeAllFiles(true);
    }
    firstInput.addEventListener('focus', function (event) {
      event.stopPropagation();
      hideAlert();
      this.removeEventListener('focus', gLoad);
    });
  };

  const showAlert = (msgStr, success = false) => {
    spinner.classList.add(hiddenClass);
    if (msgStr == null) {
      msgStr = 'A server error has occured, please try again later.';
    }
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
