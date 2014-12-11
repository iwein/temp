define(function(require) {
  'use strict';
  var module = require('app-module');
  module.directive('hcBenefitsDisplay', function() {

    return {
      restrict: 'E',
      scope: {
        benefits: '=',
        otherBenefits: '=',
        colClass: '@',
        listClass: '@'
      },
      template: require('text!./partial-benefits-display.html'),
      link: function($scope) {

        $scope.benefitIcon = function(benefit){
          var CLASS_NAME_LOOKUP = {
            "Flexible Working Hours": "fa-history",
            "Home office acceptance": "fa-home",
            "Relocation expenses": "fa-truck",
            "Stock option program": "fa-pie-chart",
            "Contributions to capital formation": "fa-money",
            "Company pension scheme": "fa-smile-o",
            "Life and disability insurance": "fa-medkit",
            "Company Cars": "fa-car",
            "Public Transport Tickets": "fa-ticket",
            "Child Care Services": "fa-child",
            "Sport and health services": "fa-soccer-ball-o",
            "Free Beverages": "fa-coffee",
            "Free Fruits": "fa-lemon-o",
            "Staff restaurant or food subsidies": "fa-cutlery",


            "Breakfasts": "fa-cutlery",
            "Dogs Allowed": "fa-paw",
            "Coffee": "fa-coffee",
            "Massages": "fa-plus-square",
            "Company car": "fa-car",
            "Remote Work": "fa-laptop"
          };
          return CLASS_NAME_LOOKUP[benefit];
        }
      }
    };
  });
});
