/*!
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
(function () {
    'use strict';

    var querySelector = document.querySelector.bind(document);

    var navdrawerContainer = querySelector('.navdrawer-container');
    var body = document.body;
    var appbarElement = querySelector('.app-bar');
    var menuBtn = querySelector('.menu');
    var main = querySelector('main');

    function closeMenu() {
        body.classList.remove('open');
        appbarElement.classList.remove('open');
        navdrawerContainer.classList.remove('open');
    }

    function toggleMenu() {
        body.classList.toggle('open');
        appbarElement.classList.toggle('open');
        navdrawerContainer.classList.toggle('open');
        navdrawerContainer.classList.add('opened');
    }

    main.addEventListener('click', closeMenu);
    menuBtn.addEventListener('click', toggleMenu);
    navdrawerContainer.addEventListener('click', function (event) {
        if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
            closeMenu();
        }
    });

    angular.module('main', ['firebase', 'ngRoute'])
        .constant("FIREBASE_URL", "https://staychain.firebaseio.com")
        .run(['$rootScope', '$firebase', 'FIREBASE_URL', 'User',
            function ($rootScope, $firebase, FIREBASE_URL, User) {
                $rootScope.setCurrentUser = function (username) {
                    $rootScope.currentUser = User.findByUsername(username);
                };
                $rootScope.currentUser = 'test';
                $rootScope.$on('$firebaseSimpleLogin:login', function (e, user) {
                    $rootScope.currentUser = user;
                });
            }
        ])
        .config(['$routeProvider',
            function ($routeProvider) {
                $routeProvider
                    .when('/', {
                        templateUrl: '../partials/home.html',
                        controller: 'HomeCtrl'
                    })
                    .when('/:username', {
                        templateUrl: '../partials/profile.html',
                        controller: 'UserHomeCtrl'
                    })
                    .when('/:username/:chain', {
                        templateUrl: '../partials/chain.html',
                        controller: 'ChainDetailsCtrl'
                    })
                    .otherwise({
                        redirectTo: '/'
                    });

            }
        ])
        .controller('HomeCtrl', ['$rootScope', '$scope', 'Auth', 'Chain',

            function ($rootScope, $scope, Auth, Chain) {
                $scope.startChain = function (chainDescription) {
                    Chain.startChain(chainDescription);
                };
            }
        ])
        .controller('UserHomeCtrl', ['$scope', '$routeParams', 'User',
            function ($scope, $routeParams, User) {
                $scope.UserHomeData = User.findByUsername($routeParams.username);

                $scope.goals = [{
                    ID: '1234',
                    record: '31',
                    summary: 'Diet and Workout 3 days a week',
                    chains: [{
                        start: new Date('2014', '8', '19'),
                        end: new Date('2014', '9', '18'),
                        linkLength: 17,
                        reason: 'Indian food'
                    }, {
                        start: new Date('2014', '9', '19'),
                        end: new Date('2014', '9', '21'),
                        linkLength: 2,
                        reason: 'Birthday party'
                    }, {
                        start: new Date('2014', '9', '22'),
                        end: new Date('2014', '10', '22'),
                        linkLength: 31,
                        reason: 'Icecream'
                    }]
                }];

            }
        ])
        .controller('ChainDetailsCtrl', ['$scope',
            function ($scope) {

            }
        ])
        .factory('Auth',

            function ($firebaseSimpleLogin, $rootScope, FIREBASE_URL) {
                var ref = new Firebase(FIREBASE_URL),
                    auth = $firebaseSimpleLogin(ref),
                    Auth = {};

                Auth.register = function (user) {
                    return auth.$createUser(user.email, user.password);
                };
                Auth.signedIn = function () {
                    return auth.user !== null;
                };
                Auth.login = function (user) {
                    return auth.$login('password', user);
                };
                Auth.logout = function () {
                    return auth.$logout();
                };

                $rootScope.signIn = function () {
                    return Auth.signedIn();
                };
                return Auth;
            })
        .directive('chainLink', [

            function () {
                return {
                    restrict: 'E',
                    templateUrl: '../partials/chainLink.html',
                    scope: {
                        chains: '=data'
                    },
                    controller: function ($scope) {
                        $scope.getDiff = function (a, b) {
                            var days = 1000 * 60 * 60 * 24,
                                utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()),
                                utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

                            return Math.floor((utc2 - utc1) / days);
                        };

                        $scope.renderChainLinks = function (chain) {
                            var output = "",
                                length;
                            if (chain.end) {
                                length = $scope.getDiff(chain.start, chain.end);
                            } else {
                                length = $scope.getDiff(chain.start, new Date());
                                if (length === 0) {
                                    $rootScope.message = "You just started, checkback to see your chain grow!";
                                }
                            }
                            while (length--) {
                                output += "[====]";
                            }
                            if (chain.end) {
                                output += "[==z==]";
                            }

                            return output;

                        };

                    }
                };
            }
        ])
        .controller('mainCtrl', ['$scope', 'Auth', 'Chain',

            function ($scope, Auth, Chain) {

            }
        ])
        .controller('portalCtrl', ['$scope', 'Auth', '$rootScope', 'User', '$timeout',
            function ($scope, Auth, $rootScope, User, $timeout) {
                $scope.originalUser = {};
                $scope.user = {};
                $rootScope.currentUser;
                $rootScope.message;
                $rootScope.showModal = false;
                $rootScope.selectModal = {};
                $rootScope.selectModal.signUp = false;
                $rootScope.selectModal.login = false;
                $scope.checkPassword = function () {
                    $scope.signUp.repeatPassword.$error.dontMatch = $scope.user.password !== $scope.user.repeatPassword;
                };

                function registerSuccess(authUser) {
                    console.log(authUser);
                    User.create(authUser, $scope.user);
                    Auth.login($scope.user)
                        .then(function () {
                            console.log('signing in');
                            $location.path('/');
                        });
                }

                function errorHandler(error) {
                    console.dir(error);
                    $rootScope.message = error.code;
                }
                $rootScope.signUp = function () {
                    Auth.register($scope.user)
                        .then(registerSuccess, errorHandler)
                        .then(function (user) {
                            Auth.login(user);
                            $rootScope.toggleModal('resetModal');
                        }, errorHandler);
                };
                $rootScope.resetForm = function () {
                    $scope.user = angular.copy($scope.originalUser);
                };
                $rootScope.login = function (user) {
                    console.log('trying to login');
                    Auth.login(user)
                        .then(function (user) {
                            $rootScope.currentUser = user;
                            $rootScope.toggleModal('resetModal');
                        }, function (error) {
                            console.dir(error);
                            $rootScope.message = error.code;
                        });

                };
                $rootScope.logout = function () {
                    console.log('signing out');
                    $rootScope.currentUser = {};
                    Auth.logout();
                };
                $scope.checkPassword = function () {
                    $scope.registerForm.repeatPassword.$error.dontMatch = $scope.user.password !== $scope.user.repeatPassword;
                };
                $rootScope.toggleModal = function (selectedFunction) {
                    $rootScope.showModal = !$rootScope.showModal;
                    $rootScope[selectedFunction]();
                };
                $rootScope.showSignUp = function () {
                    $rootScope.selectModal.signUp = !$rootScope.selectModal.signUp;
                };
                $rootScope.showLogin = function () {
                    $rootScope.selectModal.login = !$rootScope.selectModal.login;
                };
                $rootScope.showLogOut = function () {
                    $rootScope.message = 'Succesfully logged out!';
                    $rootScope.logout();
                    $timeout(function () {
                        $rootScope.toggleModal('resetModal');
                    }, 1000);
                };
                $rootScope.resetModal = function () {
                    var property;
                    $rootScope.message = '';
                    for (property in $rootScope.selectModal) {
                        if ($rootScope.selectModal.hasOwnProperty(property)) {
                            $rootScope.selectModal[property] = false;
                        }
                    }
                };

            }
        ])
        .factory('Chain', ['$rootScope', 'User', 'Auth', 'FIREBASE_URL',

            function ($rootScope, User, Auth, FIREBASE_URL) {

                return {
                    getDiff: function (a, b) {
                        var _MS_PER_DAY = 1000 * 60 * 60 * 24,
                            utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()),
                            utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

                        return Math.floor((utc2 - utc1) / _MS_PER_DAY);

                    },
                    startChain: function (chainDescription) {
                        if ($rootScope.signIn()) {
                            this.addFirstChain(chainDescription, new Date());
                        } else {
                            $rootScope.message = 'Please create a account.';
                            $rootScope.toggleModal('showSignUp');
                        }

                    },
                    updateChain: function () {
                        // body...
                    },
                    addFirstChain: function (chainDescription, startDate) {
                        var username = $rootScope.currentUser.username,
                            goalRef = new Firebase(FIREBASE_URL + '/users/' + username + '/goals');

                        goalRef.set({
                            ID: '',
                            record: '',
                            summary: chainDescription,
                            chains: [{
                                start: startDate,
                                end: '',
                                linkLength: 0,
                                reason: ''
                            }]
                        });
                    }

                };
            }
        ])
        .factory('User', function ($firebase, FIREBASE_URL, Auth, $rootScope) {
            var ref = new Firebase(FIREBASE_URL + '/users'),
                User = {
                    create: function (authUser, user) {
                        var userSchema = $firebase(ref.child(authUser.uid))
                            .$asObject(),
                            userNameList = $firebase(ref.child('username'))
                            .$asObject();

                        userSchema.$loaded(function () {
                            userNameList[user.username] = authUser.uid;
                            userNameList.$save();
                        });

                        return userSchema.$loaded(function () {
                            userSchema.username = user.username;
                            userSchema.email = user.email;
                            userSchema.goals = [{
                                ID: '',
                                record: '',
                                summary: '',
                                chains: [{
                                    start: '',
                                    end: '',
                                    reason: ''
                                }]
                            }];
                            userSchema.md5_hash = authUser.md5_hash;
                            userSchema.$priority = authUser.uid;
                            userSchema.$save();
                        });
                    },
                    findByUsername: function (username) {
                        if (username) {
                            var ref = new Firebase(FIREBASE_URL + '/users/' + username);
                            console.log('Trying to find user by username');
                            return $firebase(ref)
                                .$asObject();
                        }
                    }
                };

            return User;
        });



})();
