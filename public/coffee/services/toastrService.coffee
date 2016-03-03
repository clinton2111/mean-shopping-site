angular.module 'meanShoppingApp.toastr',['ngAnimate', 'toastr']
.factory 'toastrService',['toastr', (toastr)->
	return(
		createToast : (type,message,title)->
			options={}

			if type is 'success'
				toastr.success message, title,options
			else if type is 'warning'
				toastr.warning message, title,options
			else if type is 'info'
				toastr.info message, title,options
			else if type is 'error' 
				toastr.error message, title,options
		)
]