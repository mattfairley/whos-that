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
    movie.dbError = false;
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
          if (data.results.length > 0){
            movie.dbError = false;
            movie.movieID = data.results[0].id;
            movie.title = data.results[0].title;
            movie.getCast(movie.movieID);
            // movie.isTVshow = false;
          } else {
            //throw error message up if no matches
            movie.dbError = true;
          }
        }).
        error(function(){
          movie.setStep(4);
        });
    };

    this.findShow = function(title){
      $http.get('http://api.themoviedb.org/3/search/tv', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce', query: title }}).
        success(function(data){
          if (data.results.length > 0){
            movie.dbError = false;
            movie.showID = data.results[0].id;
            movie.title = data.results[0].name;  
            movie.getSeasonInfo(movie.showID);
            // movie.isTVshow = true;
          } else {
            //throw error message up if no matches
            movie.dbError = true;
          }
        }).
        error(function(){
          movie.setStep(4);
        });
    };

    this.getSeasonInfo = function(id){
      $http.get('http://api.themoviedb.org/3/tv/'+id, { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.seasons = movie.count(data.number_of_seasons);
        }).error(function(){
          movie.setStep(4);
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
          movie.setStep(4);
        });
    };

    this.getEpisodeCredits = function(id, season, episode){
      $http.get('http://api.themoviedb.org/3/tv/'+id+'/season/'+season+'/episode/'+episode+'/credits', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.cast = [];
          movie.parseCast(data.cast, data.guest_stars);
          movie.setStep(2);
          movie.scrollTop(300);
        }).
        error(function(){
          movie.setStep(4);
        });
    };

    this.getCast = function(id) {
      movie.cast = [];
      $http.get('http://api.themoviedb.org/3/movie/'+id+'/credits', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          movie.parseCast(data.cast);
          movie.setStep(2);
          movie.scrollTop(300);
        }).
        error(function(){
          movie.setStep(4);
        });
    };

    this.parseCast = function(data, guest) {
      guest = guest || 0;
      data.forEach(function(cast){
        var pic = '';
        if (cast.profile_path) {
          pic = "http://image.tmdb.org/t/p/w185/" + cast.profile_path;
        } else {
          pic = 'img/not-found.jpg';
        }
        if (cast.name && cast.id && (cast.character || cast.profile_path)){
          movie.cast.push({
            actor: cast.name,
            id: cast.id,
            character: cast.character || ' ',
            imgsrc: pic,
            guest: false
          });
        }
      });
      //add guest stars to the cast list (if they have a valid picture)
      if (guest) {
        guest.forEach(function(guestStar){
          var pic = '';
          if (guestStar.profile_path) {
            pic = "http://image.tmdb.org/t/p/w185/" + guestStar.profile_path;
          } else {
            pic = 'img/not-found.jpg';
          }
          if (guestStar.name && guestStar.id && (guestStar.profile_path || guestStar.character)){
            movie.cast.push({
              actor: guestStar.name,
              id: guestStar.id,
              character: guestStar.character || ' ',
              imgsrc: pic,
              guest: true
            });
          }
        });
      }
    };

    this.getCredits = function(id, name, imgsrc){
      movie.credits = [];
      movie.actor.name = name;
      movie.actor.pic = imgsrc;
      $http.get('http://api.themoviedb.org/3/person/'+id+'/combined_credits', { params: { api_key: '9314b8803e6b1e173d0c8a52303b82ce'}}).
        success(function(data){
          console.log(data.cast);
          movie.parseCredits(data.cast);
          movie.setStep(3);
          movie.scrollTop(300);
        }).
        error(function(){
          movie.setStep(4);
        });
    };

    this.parseCredits = function(data){
      data.forEach(function(credit, i){
        // set poster path
        var poster = '';
        if (credit.poster_path) {
          poster = "http://image.tmdb.org/t/p/w185/" + credit.poster_path;
        } else {
          poster = 'img/not-found.jpg';
        }
        //eliminate future releases
        var released = true;
        if (credit.release_date > $scope.date || credit.first_air_date > $scope.date){
          released = false;
        } else {
          released = true;
        }

        // check for valid data
        if (credit.id && released && (credit.title || credit.name)) {
          console.log(credit.name);
          movie.credits.push({
            title: credit.title || '\"'+credit.name+'\"',
            id: credit.id,
            character: credit.character || ' ',
            postersrc: poster,
            episodeCount: credit.episode_count || '',
            year: credit.release_date || credit.first_air_date
          });
        }
      });
      movie.removeDuplicates(movie.credits);
    };
    this.removeDuplicates = function(creditArray){
        creditArray.forEach(function(credit, i){
          for (var j = 0; j < creditArray.length; j++){
            if (credit.title === creditArray[j].title && i !=j){
              creditArray.splice(j, 1);
            }  
          }
        }); 
    };
    this.scrollTop = function(scrollDuration) {
        var scrollStep = -window.scrollY / (scrollDuration / 15),
            scrollInterval = setInterval(function(){
            if ( window.scrollY > 100 ) {
                window.scrollBy( 0, scrollStep );
            }
            else clearInterval(scrollInterval); 
        },15);
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