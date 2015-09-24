var marketadsApp = angular.module("marketadsApp",[]);

marketadsApp.factory('marketadsFactory', function ($http) {
    return {
        getFormData: function (callback) {
            $http.get('http://mepa-store-api.herokuapp.com/marketads').success(callback);
        }
	}
 })
 
 marketadsApp.filter('centCurrency', function() {
    return function(input) {
		var currencyValue = parseFloat(input, 10) / 100;
		return currencyValue.toFixed(2);
    };
});

 marketadsApp.filter('getAdLocation', function($location) {
    return function(input) {
		return $location.$$absUrl;
    };
});

marketadsApp.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeHandler);
    }
  };
});

marketadsApp.directive('modalDialog', ['$location', function(location) {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    replace: true, 
    transclude: true, 
    link: function(scope, element, attrs) {
		scope.dialogStyle = {};
		if (attrs.width)
			scope.dialogStyle.width = attrs.width;
		if (attrs.height)
			scope.dialogStyle.height = attrs.height;		
		
		scope.hideModal = function() {
			scope.show = false;
			location.hash("*");
			adToken = "";
		};
    },
    template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><div class='ng-modal-close' ng-click='hideModal()'>X</div><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
  };
}]);

marketadsApp.controller("marketadsController", function ($scope, $http, $location, marketadsFactory) {
	
	$scope.adTable = true;
	
	$scope.singleAdData = {
		id:"",
		title:"",
		description:"",
		priceCents:"",
		imageUrl:"",
		thumbnailUrl:"",
		email:"",
		phone:""
	};
	
	$scope.newAdData = {
		//id:"",
		title:"",
		description:"",
		priceCents:"",
		imageUrl:"",
		thumbnailUrl:"",
		email:"",
		phone:""
	};
	
	var adToken = $location.hash();
	
    getFormData();
    function getFormData() {
        marketadsFactory.getFormData(function (results) {
			$scope.marketAdsList=results;
			
			if (adToken)
			{
				for (var i = 0, len = $scope.marketAdsList.length; i < len; i++) {
					if ($scope.marketAdsList[i].id === adToken) {
						$scope.go($scope.marketAdsList[i]);
						break;
					}
				}
			}			
			$scope.adTable = true;
		})
    }
	
	$scope.order = function(predicate) {
		$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
		$scope.predicate = predicate;
	};
	
	$scope.deleteAd = function(adToDelete)
	{
		if (confirm("Poistetaanko ilmoitus " + adToDelete.title + "?"))
		{
			$http.delete('http://mepa-store-api.herokuapp.com/marketads/' + adToDelete.id).success(function (data, status) {
				console.log(data);
				singleAdData = {
					id:"",
					title:"",
					description:"",
					priceCents:"",
					imageUrl:"",
					thumbnailUrl:"",
					email:"",
					phone:""
				};
				$scope.adModal = false;
				$location.hash("-");
				getFormData();
				adToken = "";
			});
		}		
	};
	
	$scope.refeshList = function()
	{
		getFormData();
	}
	
	$scope.newAdModal = false;
	$scope.showNew = function()
	{
		$scope.adModal = false;
		$scope.newAdModal = false;
		
		$scope.newAdData = {
			//id:"",
			title:"",
			description:"",
			priceCents:"",
			imageUrl:"",
			thumbnailUrl:"",
			email:"",
			phone:""
		};

		$scope.newAdModal = !$scope.newAdModal;
	}

	$scope.adModal = false;
	$scope.go = function(marketAd) 
	{
		$scope.adModal = false;
		$scope.newAdModal = false;
		
		singleAdData = {
			id:"",
			title:"",
			description:"",
			priceCents:"",
			imageUrl:"",
			thumbnailUrl:"",
			email:"",
			phone:""
		};
		
		$location.hash(marketAd.id);
        $scope.singleAdData = marketAd;
		$scope.adModal = !$scope.adModal;
	}
	
    $scope.uploadFile = function(event){
        var files = event.target.files;
		
		if (files[0].size > 300000)
		{
			alert("Tiedosto liian suuri, maksimikoko 300kb!");		
			document.getElementById('imageFile').value = null;			
		} else {
			var fd = new FormData();
			fd.append("file", files[0]);

			$http.post("http://mepa-store-api.herokuapp.com/images", fd, {
				headers: {'Content-Type': undefined },
				transformRequest: angular.identity
			}).
			success(function (data, status, headers, config) {
				if (data.success == true)
				{
					$scope.newAdData.imageUrl=data.imageUrl;
					$scope.newAdData.thumbnailUrl=data.thumbnailUrl;								
				} else {
					alert("Tiedoston lähettäminen epäonnistui.\n\nVirhe: " + data.error);
				}
			}).
			error(function (data, status, headers, config) {
				alert("Tiedoston lähetys epäonnistui.");
			});			
		}		
	};
			
	$scope.createNewAd = function()
	{
		var priceCentsTemp = $scope.newAdData.priceCents;
		$scope.newAdData.priceCents = $scope.newAdData.priceCents * 100;
		
		var adIsOk = true;
		
		if ($scope.newAdData.priceCents > 10000000)
		{
			alert("Syötetty hinta ylittää järjestelmän ylärajan: 100 000 €.");
			adIsOk = false;
		}
		
		if (!$scope.newAdData.email) 
		{
			alert("Sähköposti on pakollinen tieto.")
			adIsOk = false;
		}
		
		if (adIsOk)
		{
			var res = $http.post('http://mepa-store-api.herokuapp.com/marketads/', $scope.newAdData);
			res.success(function(data, status, headers, config) {			
				$scope.adModal = false;
				$scope.newAdModal = false;
				
				$scope.newAdData = {
					title:"",
					description:"",
					priceCents:"",
					imageUrl:"",
					thumbnailUrl:"",
					email:"",
					phone:""
				};
				
				// Clear file-input
				document.getElementById('imageFile').value = null
				
				getFormData();			
			});
			res.error(function(data, status, headers, config) {
				$scope.newAdData.priceCents = priceCentsTemp;
				alert( "Vire luodessa uutta ilmoitusta: " + JSON.stringify({data: data}));
			});	
		}
		else
		{
			$scope.newAdData.priceCents = priceCentsTemp;				
		}
	}
})