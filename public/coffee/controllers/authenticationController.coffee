angular.module 'meanShoppingApp.authentication',['angularValidator']
.controller 'authenticationController',['$scope','$auth','$localStorage','md5','$stateParams','authenticationService',($scope,$auth,$localStorage,md5,$stateParams,authenticationService)->
	# $scope.$on '$viewContentLoaded', ->
	if $stateParams.type is 'recovery' and !_.isUndefined($stateParams.value) and !_.isUndefined($stateParams.email)
		$scope.recovery_screen = true
		$scope.header = 'Reset Password'
	else
		$scope.recovery_screen = false
		$scope.header = 'Login'

	$scope.loginError = null
	$scope.signUpError = null
	$scope.username = null
	$scope.recoverStatus = null
	
	$scope.signUp=(data)->
		payload=
			username:data.username
			phone_number:data.phone_number
			email_id:data.email_id
			password:md5.createHash data.password || ''

		$auth.signup payload,[skipAuthorization: true]
		.then (data)->
			$scope.signup.username = ''
			$scope.signup.phone_number = ''
			$scope.signup.email_id = ''
			$scope.signup.password = ''
			$scope.signup.confirmPassword = ''
			$auth.setToken data
			$scope.isAuthenticated()
			$('#SignUp').modal('hide')
		, (error)->
			$scope.signUpError = error.data

	$scope.logIn=(data)->
		payload=
			email_id:data.email_id
			password:md5.createHash data.password || ''

		$auth.login payload,[skipAuthorization: true]
		.then (data)->
			$localStorage.resetDate = moment().format('DD-MM-YYYY')
			$scope.isAuthenticated()
			$('#Login').modal('hide')
		, (error)->
			$scope.loginError = error.data

	$scope.authenticate = (provider)-> 
		$auth.authenticate(provider)
		.then (data)->
			console.log 'You have logged in with '+provider
			if $('#Login').is(':visible') then $('#Login').modal('hide')
		, (error)->
			console.log error
    
	$scope.toggleForgotPass = ->
		if($scope.forgotPassword is false)
			$scope.forgotPassword = true
			$scope.header = 'Recover Password'
		else
			$scope.forgotPassword = false
			$scope.header = 'Login'

	$scope.recoverPassword = (recovery)->
		authenticationService.recoverPassword recovery
		.then (data)->
			console.log data.data.message
			$scope.recoverStatus=
				status : data.data.message
				flag : 'success'
		, (error)->
			console.log data
			$scope.recoverStatus = 
				status : data
				flag : 'error'

	$scope.isAuthenticated =->
		authFlag = $auth.isAuthenticated();
		if !authFlag then return authFlag
		else
			payload = $auth.getPayload();
			$scope.username = payload.username
			return authFlag

	$scope.passwordValidator = (password) ->
		if !password
			return
		if password.length < 6
			return 'Password must be at least ' + 6 + ' characters long'
		if !password.match(/[A-Z]/)
			return 'Password must have at least one capital letter'
		if !password.match(/[0-9]/)
			return 'Password must have at least one number'
		true	

	$scope.logout=->
		$auth.logout();
		$scope.username = null

	$scope.$watch ['username'], ()->
		$scope.$apply
	,true
]