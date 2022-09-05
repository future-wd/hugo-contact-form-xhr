const handleResponse = (data) => {
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
