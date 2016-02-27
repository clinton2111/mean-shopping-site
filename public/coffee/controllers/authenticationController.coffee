angular.module 'meanShoppingApp.authentication',['angularValidator']
.controller 'authenticationController',['$scope','authenticationService',($scope,authenticationService)->
	$scope.$on '$viewContentLoaded', ->

	$scope.signUp=()->
		$('#SignUp').modal('hide')
		authenticationService.signUp($scope.signup)
		.then (data)->
			$scope.signup.username = ''
			$scope.signup.phone_number = ''
			$scope.signup.email_id = ''
			$scope.signup.password = ''
			$scope.signup.confirmPassword = ''
			console.log data
		, (error)->
			console.log error

	$scope.logIn=()->
		$('#Login').modal('hide')
		authenticationService.login($scope.login)
		.then (data)->
			$scope.login.email_id = ''
			$scope.login.password = ''
			console.log data
		, (error)->
			console.log error


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
]