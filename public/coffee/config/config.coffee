angular.module 'meanShoppingApp',['ui.router','meanShoppingApp.authentication','meanShoppingApp.home','meanShoppingApp.account','satellizer','ngStorage','angular-md5','meanShoppingApp.toastr','meanShoppingApp.directives']
.config ['$stateProvider','$urlRouterProvider','$authProvider','$locationProvider','apiPrefix','$httpProvider','toastrConfig',($stateProvider, $urlRouterProvider,$authProvider,$locationProvider,apiPrefix,$httpProvider,toastrConfig)->
	$stateProvider
	.state 'home',
		url:'/home'
		templateUrl: 'html/home.html'
		controller:'homeController'

	.state 'auth',
		url: '/auth/:type/:email/:value'
		templateUrl: 'html/auth.html'
		controller: 'authenticationController'

	.state 'account',
		url:'/account'
		abstract: true
		templateUrl:'html/account.html'
		data:
			requiresLogin: true

	.state 'account.settings',
		url:''
		templateUrl:'html/accountsettings.html'
		controller:'accountSettingsController'
		data:
			requiresLogin:true

	
	$urlRouterProvider.otherwise '/home'
	$urlRouterProvider.when 'account', 'account.settings'

	# $locationProvider.html5Mode
 #  		enabled: true
 #  		requireBase: false

	$authProvider.loginUrl=apiPrefix + '/authenticate'	
	$authProvider.signupUrl = apiPrefix + '/signUp'
	$authProvider.tokenPrefix = 'meanShoppingApp';
	$authProvider.authHeader = 'x-access-token';
	$authProvider.authToken = '';
	$authProvider.facebook
		url: apiPrefix + '/auth/facebook',
		clientId: '1532207213746557'
	$authProvider.google
		url: apiPrefix + '/auth/google',
		clientId: '448263483500-g0obrhdrt8v40j8tfgopb34sskhd876i.apps.googleusercontent.com'

	angular.extend toastrConfig,
		positionClass: 'toast-top-center'
		timeOut: 4000

	
]
.constant 'apiPrefix','/api'

.run ['$rootScope','$state','$http','apiPrefix','$q','$localStorage','$auth',($rootScope,$state,$http,apiPrefix,$q,$localStorage,$auth)->
	$rootScope.$on '$stateChangeStart', (e, to)->
		refreshToken=->
			q=$q.defer()
			$http.post apiPrefix+'/refresh',null
			.then (data)->
				q.resolve (data.data)
			, (error)->
				console.log 'Error'
				q.reject data
			q.promise


		if to.data && to.data.requiresLogin
			if $auth.isAuthenticated() is false
				e.preventDefault()
				$state.go 'auth',
					type:'login'
					email:null
					value:null
			else
				lastUpdate = null
				if _.isUndefined($localStorage.resetDate) is true
					lastUpdate = moment '21-11-1992','DD-MM-YYYY'
				else
					lastUpdate = moment $localStorage.resetDate,'DD-MM-YYYY'

				refreshTokenFlag = moment().isSame(moment(lastUpdate),'day')
				if !refreshTokenFlag
					refreshToken()
					.then (data)->
						tokenData = data
						if !(_.isNull(tokenData.token) and _.isUndefined(tokenData.token))
							$auth.setToken tokenData.token
							$localStorage.resetDate=moment().format 'DD-MM-YYYY'
						else
							e.preventDefault()
							$state.go 'auth',
								type:'login'
								email:null
								value:null
					, (error)->
						e.preventDefault()

		if (to.templateUrl is 'html/auth.html') and ($auth.isAuthenticated() is true)
			e.preventDefault()
			$state.go 'account.settings'

]

.factory 'authHttpResponseInterceptor',['$q','$location',($q,$location)->
	return{
		response: (response)->
			if response.status is 401
				console.log 'Response 401'
			response || $q.when response
		responseError: (rejection)->
			if rejection.status is 401
				$location
				.path '/auth/login//'
				.search 'returnTo',$location.path()
			$q.reject rejection
	}
]