angular.module 'meanShoppingApp',[
	'ui.router',
	'meanShoppingApp.authentication',
	'meanShoppingApp.home',
]
.config ['$stateProvider', '$urlRouterProvider',($stateProvider, $urlRouterProvider)->
	$stateProvider
	.state 'home',
		url:'/home'
		templateUrl: 'html/home.html'
		controller:'homeController'
	
	$urlRouterProvider.otherwise '/home'
]