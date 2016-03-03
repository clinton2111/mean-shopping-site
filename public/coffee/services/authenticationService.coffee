angular.module 'meanShoppingApp.authentication'
.factory 'authenticationService',['$http', '$q', 'apiPrefix', ($http, $q, apiPrefix)->
	return(
		recoverPassword: (emailData)->
			emailData.type = 'recoverPassword'
			q = $q.defer()
			$http
				url: apiPrefix+ '/recoverPassword'
				method: 'POST'
				data: emailData
				skipAuthorization: true
			.then (data)->
				q.resolve data
			, (error)->
				q.reject(error)

			q.promise

		)
]