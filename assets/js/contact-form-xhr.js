// v1.0.1
'use strict';
/** @module contact-form-xhr */
/**
 * default function
 * @param {string} formId - ID of form to collect inputs from
 * @param {string} formAction - URL to post form to
 * @param {String} account - account for endpoint, appended to form data as field
 * @param {integer} formTimeout - Time to wait before timeout (milliseconds)
 * @param {string} submitId - ID of the form's submit button
 * @param {string} statusId - ID of status message div
 * @param {string} spinnerId - ID of spinner div
 * @param {string} alertClass - CSS class used to display an alert box
 * @param {string} successClass - CSS modifier class for success alert
 * @param {string} errorClass - CSS class used to modify alert into a error alert
 * @param {string} hiddenClass - CSS class used to hide a div (non BS)
 * @param {string} grecaptchaKey - Google recaptcha public/site key
 * @param {string} grecaptchaLocation - Recaptcha location (bottomright, bottomleft, or inline)
 */

export default (
  formId,
  {
    formAction = '',
    grecaptchaKey = '',
    account = '',
    formTimeout = 8000,
    submitId = 'js-submit',

    alertClass = 'alert', // BS5
    successClass = 'alert-success', // BS5
    errorClass = 'alert-danger', // BS5
    spinnerClass = 'spinner-border', // BS5
    hiddenClass = 'd-none', // BS5
    grecaptchaLocation = 'bottomright', // defaults to bottom right as most contact forms are on the right

    //don't modify - these elements are dynamically generated by this script
    spinnerId = 'js-load', // generated by JS
    statusId = 'js-statusMessage', // generated by JS

    debug = false,
  } = {}
) => {
  if (debug === true) {
    console.log('script loaded');
  }
  // get form
  // var form = document.getElementsByTagName("form")[0];
  const form = document.getElementById(formId);
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

  //add event listener to load grecaptcha
  firstInput.addEventListener(
    'focus',
    function gLoad() {
      const head = document.getElementsByTagName('head')[0];
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src =
        'https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit';
      // grecaptcha calls onloadCallback() when loaded
      head.appendChild(script);
      // removed so script only loads once.
      this.removeEventListener('focus', gLoad);
      if (debug === true) {
        console.log('google recaptcha lazy loaded and event listener removed');
      }
    },
    false
  );

  //google recaptcha 2 invisible
  /*global grecaptcha */
  /*eslint no-undef: "error"*/
  window.onloadCallback = () => {
    grecaptcha.render(submit, {
      sitekey: grecaptchaKey,
      badge: grecaptchaLocation,
      callback: formSubmit,
      // when grecaptcha is triggered by click on submitId, it calls onSubmit
    });
    document.getElementById(submitId).disabled = false;
  };

  // on submit event, called by recaptcha
  // performs js validation of form.
  /*global formSubmit */
  /*eslint no-undef: "error"*/
  window.formSubmit = () => {
    const form = document.getElementById(formId);
    if (!form.checkValidity()) {
      //if not valid
      form.classList.add('was-validated'); //shows errors on failed fields
      grecaptcha.reset(); //reset grecaptcha as it only allows 1 click before being disabled
    } else {
      //if valid
      //hide button
      console.log('hide button');
      document.getElementById(submitId).classList.add(hiddenClass);
      //show spinner
      console.log('show spinner');
      document.getElementById(spinnerId).classList.remove(hiddenClass);
      //submit form and print status and response
      // msg(postData(formData));
      // gather data from form
      postData(formId, formAction, xhrCallback);
    }
  };

  /**
   * postData function - posts all data from form 
   * @param {String} form - ID of form to pull data from
   * @param {String} action - form action url
   * @param {String} callback - callback function
   */
  const postData = (form, action, callback) => {
    const data = new FormData(document.getElementById(form));
    data.set('account', account);
    if (debug === true) {
      // Display the key/value pairs
      console.log('form entries:');
      for (var pair of data.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
      }
    }
    const xhr = new XMLHttpRequest();
    xhr.timeout = formTimeout;
    // xhr.responseType = 'json';
    xhr.responseType = 'text';
    xhr.onload = () => {
      if (xhr.status === 200) {
        // if (xhr.response) {
        //   if (debug === true) {
        //     console.log(`xhr response is ${JSON.stringify(xhr.response)}`);
        //     console.log(`xhr status is ${xhr.status}`);
        //   }
        //   callback(xhr.response);
        // } else {
        //   // if data other than JSON is received, this.response returns 'undefined'
        //   if (debug === true) {
        //     console.log(`xhr response is ${JSON.stringify(xhr.response)}`);
        //     console.log(`xhr responseText is ${xhr.responseText}`);
        //     console.log(`xhr status is ${xhr.status}`)
        //   }
        //   const data = {
        //     status: false,
        //     message: 'A server error has occured, please try again later NON JSON RESPONSE',
        //   }
        //   callback(data)
        // }
        function parseJSON (text){
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
        // const text = parseJSON(xhr.responseText);
        // callback(text);
        if (parseJSON(xhr.responseText)) {
          callback(JSON.parse(xhr.responseText))
        } else {
          const data = {
            status: false,
            message: xhr.responseText,
          }
          callback(data);
        }

      } else {
        const data = {
          status: false,
          message: 'Connection error, please try again later',
        }
        callback(data);
      }
    };
    xhr.onerror = () => {
      const data = {
        status: false,
        message: 'An error has occured, please try again later',
      }
      callback(data);
    };
    xhr.ontimeout = () => {
      const data = {
        status: false,
        timeout: true,
        message: 'Error: There is a network connection issue',
      }
      callback(data);
    };
    xhr.open('POST', action);
    xhr.send(data);
  };

  function gReset() {
    //reset grecaptcha as it only allows 1 click before being disabled
    grecaptcha.reset();
    // hide alert
    document.getElementById(statusId).classList.add(hiddenClass);
    // remove alert type class on alert
    document.getElementById(statusId).classList.remove(errorClass);
    // show button
    document.getElementById(submitId).classList.remove(hiddenClass);

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
    document.getElementById(spinnerId).classList.add(hiddenClass);
    // add text to status div
    //fallback for uncaught errors
    if (!data) {
      data = {
        status: false,
        message: 'A connection error has occured, please try again later',
      };
    }
    document.getElementById(statusId).innerHTML = data.message;
    // add alert class to status div
    // this is done when the script initialises
    //document.getElementById(statusId).classList.add(alertClass);

    if (data.success === true && data.message) {
      // success
      //hide form
      //document.getElementById(formId).classList.add(hiddenClass);
      // add success alert classes to status div
      document.getElementById(statusId).classList.add(successClass);
      // remove hidden class on status div
      document.getElementById(statusId).classList.remove(hiddenClass);
    } else {
      // error
      // add error alert classes to status div
      document.getElementById(statusId).classList.add(errorClass);
      // remove hidden class on status div
      document.getElementById(statusId).classList.remove(hiddenClass);
      if (data.timeout == true) {
        // reset recaptcha and show submit form on timeout
        gReset();
        document.getElementById(submitId).classList.remove(hiddenClass);
      } else {
        // reset form (non-timeout error)
        document.getElementById(formId).classList.remove('was-validated');
        document.getElementById(formId).reset();
        // only reset alert/button when user focuses on name input
        firstInput.addEventListener('focus', function resetGoogle() {
          gReset()
          this.removeEventListener('focus', resetGoogle);
        }, false);
      }
    }
  };
};
