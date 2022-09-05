const submitForm = (formData, formAction, formTimeout) => {
  // // form param must be an element
  // const data = new FormData(form);
  // if (debug === true) {
    // Display the key/value pairs
    console.log('form entries:');
    for (var pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
  //}
  const xhr = new XMLHttpRequest();
  console.log('xhr open')
  xhr.open('POST', formAction);
  xhr.send(formData);
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
        console.log(JSON.parse(xhr.responseText));
        return JSON.parse(xhr.responseText);
      } else {
        // otherwise send text to callback (for server debug messages)
        const response = {
          success: false,
          message: xhr.responseText,
        };
        console.log(response)
        return response;
    
      }
    } else {
      // non 200 status, no message will be generated from this endpoint
      const response = {
        success: false,
        connectionError: true,
        message: 'Connection error, please try again',
      };
      console.log(response);
      return response;
    }
  };
};

export default submitForm;
