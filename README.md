# AngularJS Social Login (ngSocialLogin)
AngularJS Social Login Module is a simple client side authentication module which helps to authenticate your application using Google/Facebook/LinkedIN. 
It doesn't maintain any session, session between client application and server should be maintained by yourself after receiving user details from the provider.
By default force to reauthentification.

Based on source from "Heresy Infotech Private Limited" https://github.com/heresy/angularjs-social-login


Supported sites:
- Google
- Facebook
- LinkedIN

## Installation


### via bower

```shell
bower install ng-social-login --save
```

### configure installation

Include JS files:

```html
<script src="bower_components/ng-social-login/ng-social-login.js"></script>
```

Then include `socialLogin` as a dependency for your app:

```javascript
angular.module('myApp', ['ngSocialLogin']);
```

## Configuration

### Example

```javascript
app.config(function($socialLoginProvider){
  $socialLoginProvider.setGoogleKey("YOUR GOOGLE CLIENT ID");
  $socialLoginProvider.setLinkedInKey("YOUR LINKEDIN CLIENT ID");
  $socialLoginProvider.setFbKey({appId: "YOUR FACEBOOK APP ID", apiVersion: "API VERSION"});
});
```

## Usage
There are total three directives for handling Google, Facebook, LinkedIn authentication.
- ngSocialLogin (For all add provider on attribute value)
- ngSocialLogout

### Methods

- `$socialLoginProvider.setGoogleKey("YOUR GOOGLE CLIENT ID")`
- `$socialLoginProvider.setLinkedInKey("YOUR LINKEDIN CLIENT ID")`
- `$socialLoginProvider.setFbKey("YOUR FACEBOOK APP ID")`
- `$rootScope.$on('event:social-sign-in-success', function(event, userDetails){})` 
   Braodcast event which will be triggered after successful authentication. `userDetails` is an `Object` consists of `{name: <user_name>, email: <user_email>, imageUrl: <image_url>, uid: <UID by social vendor>, provider: <Google/Facebook/LinkedIN>, token: < accessToken for Facebook & google, no token for linkedIN>}, idToken: < google idToken >` 
- `$socialLoginService.logout()`
   For logout
- `$rootScope.$on('event:social-sign-out-success', function(event, logoutStatus){})`
   Braodcast event which will be triggered after successful logout.

### Example
```html
<button ng-social-login="google" login-options="{}" on-success="sendAuthServer($success)" on-error="display($error)" type="button">Google Login</button>
<button ng-social-login="linkedIn" type="button">LinkedIn Login</button>
<button ng-social-login="facebook" type="button">facebook Login</button>

<button ng-social-logout type="button">Logout</button>
```
