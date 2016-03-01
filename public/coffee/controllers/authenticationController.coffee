angular.module 'meanShoppingApp.authentication',['angularValidator']
.controller 'authenticationController',['$scope','$auth','$localStorage','md5','$stateParams',($scope,$auth,$localStorage,md5,$stateParams)->
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
	$scope.signUp=()->
		payload=
			username:$scope.signup.username
			phone_number:$scope.signup.phone_number
			email_id:$scope.signup.email_id
			password:md5.createHash $scope.signup.password || ''

		$auth.signup payload,[skipAuthorization: true]
		.then (data)->
			$scope.signup.username = ''
			$scope.signup.phone_number = ''
			$scope.signup.email_id = ''
			$scope.signup.password = ''
			$scope.signup.confirmPassword = ''
			payload = {}
			$('#SignUp').modal('hide')
		, (error)->
			$scope.signUpError = error.data

	$scope.logIn=()->
		payload=
			email_id:$scope.login.email_id
			password:md5.createHash $scope.login.password || ''

		$auth.login payload,[skipAuthorization: true]
		.then (data)->
			$localStorage.resetDate = moment().format('DD-MM-YYYY')
			$scope.login.email_id = ''
			$scope.login.password = ''
			payload = {}
			$scope.isAuthenticated()
			$('#Login').modal('hide')
		, (error)->
			$scope.loginError = error.data

	$scope.toggleForgotPass = ->
		if($scope.forgotPassword is false)
			$scope.forgotPassword = true
			$scope.header = 'Recover Password'
		else
			$scope.forgotPassword = false
			$scope.header = 'Login'

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