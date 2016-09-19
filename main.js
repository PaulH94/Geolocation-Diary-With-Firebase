//Paul Huynh

//The friendly chat system is used as a basis for comment and sign in system
//https://github.com/firebase/friendlychat

var map;
var com = []
function initMap() {
	var myCenter=new google.maps.LatLng(45.5231,-122.6765);
        map = new google.maps.Map(document.getElementById('map'), {
          center: myCenter,//{lat: 0, lng: 0},
          zoom: 13
        });

        //var infoWindow = new google.maps.InfoWindow({map: map});

        // Try HTML5 geolocation.
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setCenter(pos);
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
        } else { 
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
//  infoWindow.setPosition(pos);
//  infoWindow.setContent(browserHasGeolocation ?
//                          'Error: The Geolocation service failed.' :
//                          'Error: Your browser doesn\'t support geolocation.');
  alert("Geolocation not working");
 }
'use strict';

// Initializes MapProject.
function MapProject() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.commentList = document.getElementById('comments');
  this.commentForm = document.getElementById('comment-form');
  this.commentInput = document.getElementById('comment');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  //this.signInSnackbar = document.getElementById('must-signin-snackbar');

  // Saves comment on form submit.
  this.commentForm.addEventListener('submit', this.saveMessage.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.commentInput.addEventListener('keyup', buttonTogglingHandler);
  this.commentInput.addEventListener('change', buttonTogglingHandler);
/*
  // Events for image upload.
  this.submitImageButton.addEventListener('click', function() {
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));
*/
  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
MapProject.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Loads chat comments history and listens for upcoming ones.
MapProject.prototype.loadMessages = function() {
  this.commentsRef = this.database.ref('comments');
  // Make sure we remove all previous listeners.
  this.commentsRef.off();

  // Loads the last 12 comments and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();
    this.displayMessage(data.key, val.name, val.text, val.time,val.location);
    this.markup(data.key,val.name, val.text, val.time,val.lat, val.lng);
  }.bind(this);
  this.commentsRef.limitToLast(12).on('child_added', setMessage);
  this.commentsRef.limitToLast(12).on('child_changed', setMessage);
};

// Saves a new comment on the Firebase DB.
MapProject.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a comment and is signed in.
  if (this.commentInput.value && this.checkSignedInWithMessage() && navigator.geolocation) {
      var currentUser = this.auth.currentUser;
      var d = new Date();
      var day = d.getTime();
      var jour = tstamp(day);
      navigator.geolocation.getCurrentPosition(function(position) {
	var curr = position.coords.latitude+','+position.coords.longitude;
        this.commentsRef.push({
          name: currentUser.displayName,
          text: this.commentInput.value,
          time: jour,
          lat: position.coords.latitude,//icilat,
	  lng: position.coords.longitude,
          location: curr
	  //loc: laba
        }).then(function() {
          // Clear comment text field and SEND button state.
          MapProject.resetMaterialTextfield(this.commentInput);	
          this.toggleButton();
        }.bind(this)).catch(function(error) {
          console.error('Error writing new comment to Firebase Database', error);
        });
      }.bind(this));
  }
};

function tstamp(epoch){
		var d = new Date(epoch)
		var y = d.getFullYear();
		var mo = d.getMonth()+1;
		var da = d.getDate();
		var h = d.getHours();
		var m = d.getMinutes();
		var s =d.getSeconds();
		return y+'.'+('00'+mo).slice(-2)+'.'+('00' + da).slice(-2)+' '
					+('00'+h).slice(-2)+':'+('00'+m).slice(-2);
}

// Signs-in Friendly Chat.
MapProject.prototype.signIn = function(googleUser) {
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);

};

// Signs-out of Friendly Chat.
MapProject.prototype.signOut = function() {
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
MapProject.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL; 
    var userName = user.displayName;      

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant comments.
    this.loadMessages();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a comment.
MapProject.prototype.checkSignedInWithMessage = function() {
    // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }
  // Display a comment to the user using a Toast.
  var data = {
    comment: 'You must sign-in first',
    timeout: 2000
  };
  alert("You must sign in!!!");
  //this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Resets the given MaterialTextField.
MapProject.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};


MapProject.prototype.displayMessage = function(key, name, text, time, location) {
  com.push("location: " + location +"<br>"+text+" at "+time+"<br>by "+name+"<br><hr>");
  var buf = '';
  for(var i = com.length-1; i>-1; --i){
    buf = buf +com[i];
  };
  $("#comments").html(com);
}

MapProject.prototype.markup = function(key, name, text, time, late, lnge) {
  var curr = {
    lat: late,
    lng: lnge
  };
  console.log(curr);
  var marker=new google.maps.Marker({
    position:curr,
    animation: google.maps.Animation.DROP
  });
  marker.setMap(map);
  var infowindow = new google.maps.InfoWindow({
    content:text
  });
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.open(map,marker);
  });
}

// Enables or disables the submit button depending on the values of the input
// fields.
MapProject.prototype.toggleButton = function() {
  if (this.commentInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
MapProject.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.');
  }
};

window.onload = function() {
  window.MapProject = new MapProject();
};
