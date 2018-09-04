(function(angular){
    'use strict';

    // Load module social login
    var module = angular.module('ngSocialLogin', []);

    module.provider("$socialLogin", [function(){

    	var fbKey, fbApiV, googleKey, linkedInKey;

		return {
			setFbKey: function(obj){
				fbKey = obj.appId;
				fbApiV = obj.apiVersion;
				var d = document, fbJs, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
				fbJs = d.createElement('script');
				fbJs.id = id;
				fbJs.async = true;
				fbJs.src = "//connect.facebook.net/en_US/sdk.js";

				fbJs.onload = function() {
					FB.init({
						appId: fbKey,
						status: true,
						cookie: true,
						xfbml: true,
						version: fbApiV
					});
				};

				ref.parentNode.insertBefore(fbJs, ref);
			},
			setGoogleKey: function(value){
				googleKey = value;
				var d = document, gJs, ref = d.getElementsByTagName('script')[0];
				gJs = d.createElement('script');
				gJs.async = true;
				gJs.src = "//apis.google.com/js/platform.js";

				gJs.onload = function() {
					var params ={
						client_id: value,
						scope: 'email'
					};
					gapi.load('auth2', function() {
						gapi.auth2.init(params);
					});
				};

				ref.parentNode.insertBefore(gJs, ref);
			},
			setLinkedInKey: function(value){
				linkedInKey = value;
				var lIN, d = document, ref = d.getElementsByTagName('script')[0];
				lIN = d.createElement('script');
				lIN.async = false;
				lIN.src = "//platform.linkedin.com/in.js";
				lIN.text = ("api_key: " + linkedInKey).replace("\"", "");
				ref.parentNode.insertBefore(lIN, ref);
			},
			$get: function(){
				return{
					fbKey: fbKey,
					googleKey: googleKey,
					linkedInKey: linkedInKey,
					fbApiV: fbApiV
				}
			}
		}
	}]);

    module.factory("$socialLoginService", ['$window', '$rootScope', '$q', '$log', function($window, $rootScope, $q, $log){

		var gAuth;


		function _set_provider (provider){

			if (provider) {
				$window.localStorage.setItem('_sociallogin_provider', provider);
			}
			else {
				$window.localStorage.removeItem('_sociallogin_provider');
			}
		}

		function _get_provider () {
			return $window.localStorage.getItem('_sociallogin_provider');
		}

		function _get_google_auth () {

			_set_provider("google");

			var currentUser = gAuth.currentUser.get();
			var profile = currentUser.getBasicProfile();
			var idToken = currentUser.getAuthResponse().id_token;
			var accessToken = currentUser.getAuthResponse().access_token;

			return {
				token: accessToken,
				idToken: idToken,
				name: profile.getName(),
				email: profile.getEmail(),
				uid: profile.getId(),
				provider: "google",
				imageUrl: profile.getImageUrl()
			};
		}

		function _get_fb_auth (){
			var deferred = $q.defer();

			FB.api('/me?fields=name,email,picture', function(res){
				if(!res || res.error){
					deferred.reject('Error occured while fetching user details.');
				}else{
					deferred.resolve({
						name: res.name,
						email: res.email,
						uid: res.id,
						provider: "facebook",
						imageUrl: res.picture.data.url
					});
				}
			});

			return deferred.promise;
		}

		return {
			getAuth: function(provider) {
				switch(provider) {
					case "google":
						return gAuth;
					case "linkedIn":
						return IN.User;
					case "facebook":
						return FB;
				}
			},
			login: function(provider, options) {
				var defer = $q.defer();
				var result = null;
				var sign_in_force = false;

				switch(provider) {
					case "google":

						//Default options
                        options = angular.isObject(options) ? options : {prompt: 'select_account consent'};

						sign_in_force = (options.prompt && options.prompt.indexOf('select_account') !== -1) ? true : false;

						if (!gAuth) {
							gAuth = gapi.auth2.getAuthInstance();
						}

						if(!gAuth.isSignedIn.get() || sign_in_force === true){

							gAuth.signIn(options).then(
								function(googleUser){
									result = _get_google_auth();
									defer.resolve(result);
								}, function(err){
									$log.error(err);
									result = null;
									defer.reject(result);
								}
							);
						}
						else {
							result = _get_google_auth();
							defer.resolve(result);
						}
						break;
					case 'linkedIn':

                        //Default options
                        options = angular.isObject(options) ? options : {};

						IN.User.authorize(function(){
							IN.API.Raw("/people/~:(id,first-name,last-name,email-address,picture-url)").result(function(res){
								result = {name: res.firstName + " " + res.lastName, email: res.emailAddress, uid: res.id, provider: "linkedIN", imageUrl: res.pictureUrl};

								defer.resolve(result);
							});
						});

						break;
					case "facebook":

                        //Default options
                        options = angular.isObject(options) ? options : {};
						angular.extend(options, {scope: 'email', auth_type: 'reauthenticate'});


                        sign_in_force = options.auth_type.indexOf('reauthenticate') !== -1 ? true : false;

						FB.getLoginStatus(function(response) {

							if(response.status === "connected" && !sign_in_force){
								_get_fb_auth().then(
									function(userDetails){

										result = userDetails;
										result["token"] = response.authResponse.accessToken;

										defer.resolve(result);
									},
									function (err) {
										$log.error(err);
										result = null;
										defer.reject(result);
									}
								);
							}else{
								FB.login(function(response) {
									if(response.status === "connected"){
										_get_fb_auth().then(
											function(userDetails){

												result = userDetails;
												result["token"] = response.authResponse.accessToken;

												defer.resolve(result);
											},
											function (err) {
												$log.error(err);
												result = null;
												defer.reject(result);
											}
										);
									}
								}, options);
							}
						});

						break;
				}

				if (result && angular.isObject(result)) {
					_set_provider(provider);
					$rootScope.$broadcast('event:social-sign-in-success', result);
				}
				else {
					_set_provider();
				}

				return defer.promise;
			},
			logout: function(){

				switch(_get_provider()) {
					case "google":
                        if (gAuth) {

                            gAuth.signOut().then(function () {
                                $rootScope.$broadcast('event:social-sign-out-success', "success");
                            });
                        }
						break;
					case "linkedIn":
						IN.User.logout(function(){
							$rootScope.$broadcast('event:social-sign-out-success', "success");
						}, {});
						break;
					case "facebook":
						FB.logout(function(res){
							$rootScope.$broadcast('event:social-sign-out-success', "success");
						});
						break;
				}

                _set_provider();
			},
			setProvider: _set_provider,
			getProvider: _get_provider
		}
	}]);


    module.directive("ngSocialLogin", ['$socialLoginService',
		function($socialLoginService){
		return {
			restrict: 'A',
            scope : {
                loginOptions : '&?',
                onSuccess: "&",
                onError: "&"
            },
			link: function(scope, elem, attrs){

                scope.loginOptions = angular.isDefined(scope.loginOptions) ? scope.loginOptions() : null;

				if ( attrs.ngSocialLogin.length > 0 ) {
                    elem.on("click", function(){
                        $socialLoginService.login(attrs.ngSocialLogin, scope.loginOptions).then(
                        	function (success) {
                                scope.onSuccess({$success: success});
                            },
							function (error) {
                                scope.onError({$error: error});
							}
						);
                    });
				}
			}
		}
	}]);


    module.directive("ngSocialLogout", ['$socialLoginService',
        function($socialLoginService){
            return {
                restrict: 'A',
                link: function(scope, elem, attrs){

					elem.on("click", function(){
                        $socialLoginService.logout();
					});

                }
            }
        }]);

})(angular);