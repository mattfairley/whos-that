(function() {
  var app = angular.module('whosthat', []);

  app.controller('MovieController', ['$scope', '$http',function($scope, $http){
    var movie = this;
    movie.cast = [];
    movie.credits = [];
    movie.title = '';
    movie.seasons = [];
    movie.episodes = [];
    movie.actor = {};
    movie.showID = 0;
    movie.step = 1;
    $scope.date = new Date();
    $scope.date = $scope.date.toISOString();

    this.setStep = function(stepNum){
      movie.step = stepNum;
    };

    this.isStep = function(checkStep) {
      return this.step === checkStep;
    };

    this.findMovie = function(title){
      //goddamn se7en
      if (title.toLowerCase() === 'seven'){
        title = 'se7en';
      }
      $http.get('http://api.themoviedb.org/3/search/movie', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce', query: title }}).
        success(function(data){
          movie.movieID = data.results[0].id;
          movie.title = data.results[0].title;
          movie.getCast(movie.movieID);
          movie.search = false;
        }).
        error(function(){
          console.log('whoops');
        });
    };

    this.findShow = function(title){
      $http.get('http://api.themoviedb.org/3/search/tv', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce', query: title }}).
        success(function(data){
          console.log(data);
          movie.showID = data.results[0].id;
          movie.title = data.results[0].name;
          console.log(movie.title);
          console.log(movie.showID);

          movie.getSeasonInfo(movie.showID);
        }).
        error(function(){
          console.log('whoops');
        });
    };

    this.getSeasonInfo = function(id){
      $http.get('http://api.themoviedb.org/3/tv/'+id, { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.seasons = movie.count(data.number_of_seasons);
        }).error(function(){
          console.log('whoops');
        });
    };

    this.count = function(num){
      var array = [];
      for (i = 1; i <= num; i++){
        array.push(i);
      }
      return array;
    };

    this.getEpisodes = function(id, season){
      $http.get('http://api.themoviedb.org/3/tv/'+id+'/season/'+season, { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.episodes = movie.count(data.episodes.length);
        }).error(function(){
          console.log('whoops');
        });
    };

    this.getEpisodeCredits = function(id, season, episode){
      $http.get('http://api.themoviedb.org/3/tv/'+id+'/season/'+season+'/episode/'+episode+'/credits', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.cast = [];
          console.log(data);
          movie.parseCast(movie.episodeCastParse(data));
          movie.setStep(2);
        }).
        error(function(){
          console.log('whoops');
        });
    };

    this.episodeCastParse = function(data){
      console.log('guest stars' + data.guest_stars);
      var cast = data.cast;
      data.guest_stars.forEach(function(guest){
        if (cast.indexOf(guest) < 0){
          cast.push(guest);
        }
      });
      return cast;
    };

    this.getCast = function(id) {
      movie.cast = [];
      $http.get('http://api.themoviedb.org/3/movie/'+id+'/credits', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.parseCast(data.cast);
          movie.setStep(2);
        }).
        error(function(){
          console.log('whoops');
        });
    };

    this.parseCast = function(data) {
      console.log(data);
      data.forEach(function(cast){
        var pic = '';
        if (cast.profile_path) {
          pic = "http://image.tmdb.org/t/p/w185/" + cast.profile_path;
        } else {
          pic = 'img/not-found.png';
        }
        if (cast.name && cast.id){
          movie.cast.push({
            actor: cast.name,
            id: cast.id,
            character: cast.character || ' ',
            imgsrc: pic
          });
        }
      });
    };

    this.getCredits = function(id, name, imgsrc){
      movie.credits = [];
      movie.actor.name = name;
      movie.actor.pic = imgsrc;
      $http.get('http://api.themoviedb.org/3/person/'+id+'/combined_credits', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.parseCredits(data.cast);
          console.log(movie.credits);
          movie.setStep(3);
        }).
        error(function(){
          console.log('whoops');
        });
    };

    this.parseCredits = function(data){
      data.forEach(function(credit, i){
        // set poster path
        var poster = '';
        if (credit.poster_path) {
          poster = "http://image.tmdb.org/t/p/w185/" + credit.poster_path;
        } else {
          poster = 'img/not-found.png';
        }
        //eliminate future releases
        var released = true;
        if (credit.release_date > $scope.date || credit.first_air_date > $scope.date){
          released = false;
        } else {
          released = true;
        }
        //create valid year
        // var releaseYear = 0
        // if (credit.release_date) {
        //   releaseYear = Number(credit.release_date.substring(0,4))
        // } else if (credit.first_air_date) {
        //   releaseYear = Number(credit.first_air_date.substring(0,4))
        // }

        // check for valid data
        if (credit.id && released && credit.character && (credit.title || credit.name)) {
          movie.credits.push({
            title: credit.title || credit.name,
            id: credit.id,
            character: credit.character || ' ',
            postersrc: poster,
            year: credit.release_date || credit.first_air_date
          });
        }
        //check latest title against previous titles - pop if the same TO DO FIX
        // if (i < movie.credits.length){
        //   for (var j = 0; j < movie.credits.length; j++) {
        //     if (movie.credits[i].title === movie.credits[j].title && i != j) {
        //       movie.credits.slice(i, 1);
        //       break;
        //     }
        //   };
        // };
      });
    };
  }]);

  app.directive('typeTabs', function() {
    return {
      restrict: 'E',
      templateUrl: 'type-tabs.html',
      controller: function() {
        this.tab = 1;

        this.isSet = function(checkTab) {
          return this.tab === checkTab;
        };

        this.setTab = function(activeTab) {
          this.tab = activeTab;
        };
      },
      controllerAs: 'tab'
    };
  });

})();