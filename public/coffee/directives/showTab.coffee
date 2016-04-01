angular.module 'meanShoppingApp.directives',[]

.directive('showtab',[->
	return{
		link:(scope,element,attrs)->
			element.click (e)->
				e.preventDefault()
				$(element).tab('show')
	}
])