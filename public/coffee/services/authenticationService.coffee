angular.module 'meanShoppingApp.authentication'
.factory 'authenticationService', ['$http', '$q', ($http, $q)->
	return(
		signUp:(credentials)->
			q = $q.defer();
			$http
				url: '/signUp'
				data:credentials
				method: 'post'
			.then (data)->
				q.resolve data
			, (error)->
				q.reject(error)
			q.promise

		login:(credentials)->
			q = $q.defer();
			$http
				url: '/login'
				data:credentials
				method: 'post'
			.then (data)->
				q.resolve data
			, (error)->
				q.reject(error)
			q.promise
	)
]