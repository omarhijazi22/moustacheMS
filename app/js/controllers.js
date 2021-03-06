'use strict';

/* Controllers */

var angular = angular || {}; // To shut JSHint
var controllers = angular.module('mustacheApp.controllers', []);

controllers.controller('LoginCtrl', ["$scope", "$rootScope", "$http", "$location", function ($scope, $rootScope, $http, $location) {
    $scope.onNewAccount = function () {
        window.console.log("User is: ", JSON.stringify($scope.User));
        $rootScope.User = $scope.User;
        $location.path("/register/");
    };

    $scope.onLogin = function () {
        var promise = $http.post("/api/v0.1/sessions/", {
            employeeId: $rootScope.User.employeeId,
            password: $rootScope.User.password
        });

        promise.success(function (data, status) {
            window.console.log("Login success:", status);
            $rootScope.User.tokenName = data.tokenName;
            $rootScope.User.token = data.token;
            $location.path("/wards/");
        });

        promise.error(function (data, status) {
            window.console.log("Login error:", status);
        });
    };
}]);

controllers.controller('RegisterCtrl', ["$scope", "$rootScope", "$http", "$location", "Employee", function ($scope, $rootScope, $http, $location, Employee) {

    $scope.User = $rootScope.User;
    window.console.log("RegisterCtrl, User is: ", JSON.stringify($scope.User));

    $scope.onRegister = function() {
        window.console.log("User is: ", JSON.stringify($scope.User));
        $rootScope.User = $scope.User;
        Employee.save($scope.User, function() {
            var promise = $http.post("/api/v0.1/sessions/", {
                employeeId: $rootScope.User.employeeId,
                password: $rootScope.User.password
            });

            promise.success(function (data, status) {
                window.console.log("Login success:", status);
                $rootScope.User.tokenName = data.tokenName;
                $rootScope.User.token = data.token;
                $location.path("/wards/");
            });

            promise.error(function (data, status) {
                window.console.log("Login error:", status);
            });
        });
    };
}]);

controllers.controller('WardListCtrl', ["$scope", "$location", "Ward", "Employee",
    function ($scope, $location, Ward, Employee) {

        $scope.wards = [];
        Ward.query(function (wardIds) {
            wardIds.forEach(function (wardId) {
                Ward.get({wardId: wardId.id}, function (ward) {

                    Employee.get({employeeId: ward.doctorId}, function (doctor) {
                        ward.doctor = doctor;
                    });

                    Employee.get({employeeId: ward.chargeNurseId}, function (nurse) {
                        ward.chargeNurse = nurse;
                    });

                    $scope.wards.push(ward);
                });
            });
        });
    }]);


controllers.controller('WardDetailCtrl', ["$scope", "$location", "$routeParams", "Ward", "Patient", "Employee",
    function ($scope, $location, $routeParams, Ward, Patient, Employee) {

        $scope.go = function (path) {
            $location.path(path);
        };

        Ward.get({wardId: $routeParams.wardId}, function (ward) {
            $scope.ward = ward;
            $scope.patients = ward.patients;
            $scope.admissionsRequest = ward.admissionsRequest;
            $scope.admissionsResponse = ward.admissionsResponse;

            $scope.patients.forEach(function (patient) {
                Patient.get({patientId: patient.patientId}, function (patientDetails) {
                    patient.details = patientDetails;

                });
                ward.beds.forEach(function (bed) {
                    if (bed.bedId === patient.bedId) {
                        patient.roomId = bed.roomId;
                    }
                });
            });

            $scope.admissionsRequest.forEach(function (request) {
                Patient.get({patientId: request.patientId}, function (patientDetails) {
                    request.patientDetails = patientDetails;

                });

                Ward.get({wardId: request.fromWardId}, function (fromWard) {
                    request.fromWard = fromWard;
                    Employee.get({employeeId: fromWard.chargeNurseId}, function (nurse) {
                        request.chargeNurseName = nurse.firstName + " " + nurse.lastName;
                    });
                });
            });

            $scope.admissionsResponse.forEach(function (response) {
                Patient.get({patientId: response.patientId}, function (patientDetails) {
                    response.patientDetails = patientDetails;
                });
            });

            $scope.admissionsRequest.admit = function () {
                window.console.log("I AINT ADMITIN NOTHIN");
            };

            $scope.patients.discharge = function () {
                angular.forEach($scope.patients, function (patient) {
                    if (!patient.selected) {
                        // ignore those that aren't selected
                        return;
                    }
                    var index = $scope.patients.indexOf(patient);
                    $scope.patients.splice(index, 1);
                });
            };
        });
    }]);


controllers.controller('PatientCtrl', ["$scope", "$location", "$routeParams", "Ward", "Patient",
    function ($scope, $location, $routeParams, Ward, Patient) {

        $scope.go = function (path) {
            $location.path(path);
        };

        $scope.save = function (patient) {
            Patient.save(patient);
        };

        $scope.newPath = function () {
            if ($location.path() === '/patients/new') {
                return true;
            }
            return false;
        };

        if ($location.path() === '/patients/new') {

            // Test with Ward 1
            Ward.get({wardId: 1}, function (ward) {
                $scope.ward = ward;
                $scope.patients = ward.patients;
            });

            window.console.log($scope.patients);

            $scope.admit = function () {
                window.console.log($scope.patients);
                var patientPush = { patientId: 205, lastName: $scope.lastName, firstName: $scope.firstName,
                    healthInsNum: $scope.healthInsNum, address: $scope.address, phoneNum: $scope.phoneNum,
                    dateOfBirth: $scope.dateOfBirth, gender: $scope.gender, maritalStatus: $scope.maritalStatus,
                    nextOfKin: { name: $scope.nextOfKin.name, relationship: $scope.nextOfKin.relationship,
                        address: $scope.nextOfKin.address, phoneNum: $scope.nextOfKin.phoneNum }
                };

                $scope.patients.push(patientPush);

                $scope.go('/ward/1');

            };

        } else {
            Patient.get({patientId: $routeParams.patientId}, function (patient) {

                $scope.patient = patient;
                $scope.patientId = patient.patientId;
                $scope.lastName = patient.lastName;
                $scope.firstName = patient.firstName;
                $scope.healthInsNum = patient.healthInsNum;
                $scope.address = patient.address;
                $scope.phoneNum = patient.phoneNum;
                $scope.dateOfBirth = patient.dateOfBirth;
                $scope.gender = patient.gender;
                $scope.maritalStatus = patient.maritalStatus;

                $scope.nextOfKin = patient.nextOfKin;

                $scope.update = function () {
                    window.console.log('update');
                    /*
                     $scope.patients.patient({ patientId: $scope.patientId, lastName: $scope.lastName, firstName: $scope.firstName,
                     healthInsNum: $scope.healthInsNum, address: $scope.address, phoneNum: $scope.phoneNum,
                     dateOfBirth: $scope.dateOfBirth, gender: $scope.gender, maritalStatus: $scope.maritalStatus,
                     nextOfKin: { name: $scope.nextOfKin.name, relationship: $scope.nextOfKin.relationship,
                     address: $scope.nextOfKin.address, phoneNum: $scope.nextOfKin.phoneNum }});
                     */
                };

            });
        }
    }]);
