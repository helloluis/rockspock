Game = {

  wait        : 1500,
  scores      : [0,0],
  paused      : true,
  blue_active : true,
  challenge   : false,
  challenges  : {
    rock      : { stronger_than : [ 'lizard', 'scissors' ],   weaker_than : [ 'paper', 'spock' ],       strong_verbs : [ 'crushes', 'crushes' ],    weak_verbs : [ 'is covered by', 'is vaporized by' ] },
    paper     : { stronger_than : [ 'rock', 'spock' ],        weaker_than : [ 'lizard', 'scissors' ],   strong_verbs : [ 'covers', 'disproves' ],   weak_verbs : [ 'is eaten by', 'is cut by' ] },
    scissors  : { stronger_than : [ 'paper', 'lizard' ],      weaker_than : [ 'rock', 'spock' ],        strong_verbs : [ 'cuts', 'decapitates' ],   weak_verbs : [ 'is crushed by', 'is smashed by' ] },
    lizard    : { stronger_than : [ 'paper', 'spock' ],       weaker_than : [ 'rock', 'scissors' ],     strong_verbs : [ 'eats', 'poisons' ],       weak_verbs : [ 'is crushed by', 'is decapitated by' ] },
    spock     : { stronger_than : [ 'rock', 'scissors' ],     weaker_than : [ 'lizard', 'paper' ],      strong_verbs : [ 'vaporizes', 'smashes' ],  weak_verbs : [ 'is poisoned by', 'is disproved by' ] }
  },
  history     : [ [], [] ],
  sounds      : {},

  initialize : function(auto_start){
    
    jQuery.fx.interval = 42;

    Game.initialize_containers();
    
    Game.initialize_behaviours();

    Game.initialize_buttons();

    Game.initialize_sounds();
    
    if (auto_start===true) {
      Game.start();
    }

    $('body').oneTime(500, function(){
      $(window).scroll(0,1);
    });
  },

  initialize_containers : function(){
    Game.intro        = $("#intro");
    Game.main         = $("#game");
    Game.credits      = $("#credits");
    Game.countdown    = $("#countdown");
    Game.messages     = $(".messages");
    Game.history_blue = $(".history .blue");
    Game.history_red  = $(".history .red");
  },

  initialize_behaviours : function() {
    
    Game.intro.show();
    Game.main.hide();
    Game.credits.hide();
    Game.hide_message();
    Game.scores = [0,0];
    Game.history = [ [], [] ];
    Game.history_blue.empty();
    Game.history_red.empty();
    Game.refresh_scores();
    Game.countdown.empty();

    Game.prevent_portrait_mode();

    $(".pause, .quit, .buttons li").addClass('disabled');

  },

  initialize_sounds : function() {
    Game.sounds.click  = new Audio("sounds/clook.mp3");
    Game.sounds.tick   = new Audio("sounds/tock.mp3");
    Game.sounds.buzzer = new Audio("sounds/beep_long.mp3");
  },

  initialize_buttons : function(){
    
    $(".start_game").click(function(){
      Game.start();
    });
    
    $(".pause").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.pause();  
      }
    });
    
    $("#player_blue .quit").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.quit(true);
      }
    });

    $("#player_red .quit").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.quit(false);
      }
    });
    
    $("#player_blue .buttons li").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.pick(true, $(this).attr('data-value'), $(this));
        $(this).addClass('clicked').oneTime(500,function(){
          $(this).removeClass('clicked');
        });
      }
    });

    $("#player_red .buttons li").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.pick(false, $(this).attr('data-value'), $(this));
        $(this).addClass('clicked').oneTime(500,function(){
          $(this).removeClass('clicked');
        });
      }
    });

  },

  start : function(){
    Game.intro.hide();
    Game.main.show();
    Game.credits.hide();
    Game.start_countdown();
  },

  activate_player : function(blue) {
    
    var player = $("#player_" + (blue ? 'blue' : 'red')),
      opponent = $("#player_" + (blue ? 'red' : 'blue'));

    $(".timer .bar", player).css('height', '100%');

    $(".buttons li", player).removeClass('disabled');
    
    if (Game.challenge) {
      $(".buttons li." + Game.challenge, player).addClass('disabled');  
    }
    
    $(".buttons li", opponent).addClass('disabled');
    
    Game.blue_active = blue;

    if (Game.challenge) {
      $("#player_" + (blue ? 'blue' : 'red') + " .timer .bar").animate({ height : 0, bottom : 0 }, {
        duration : Game.wait,
        complete : function(){

            // console.log('completed animating timer bar');
            Game.deactivate_player(blue);
            Game.sounds.buzzer.play();
            $(".challenge_container", opponent).animate({ opacity : 0 },{ duration : 100, complete : function(){ $(this).remove(); }});
            Game.increment_score(!blue);
            Game.show_challenge_description(blue, undefined, function(new_player){ 
              Game.challenge = false; 
              Game.activate_player(new_player); 
            });
            //Game.challenge = false;

          }
        });  
    }
    
  },

  deactivate_player : function(blue) {
    
    $("#player_" + (blue ? 'blue' : 'red') + " .buttons li").addClass('disabled');

  },

  pick : function(blue, value, bttn) {

    Game.sounds.tick.play();
    Game.send_challenge(!blue, value, bttn);
    Game.save_to_history(blue, value);

  },

  // send challenge to a player
  send_challenge : function(blue, value, bttn) {

    var challenged     = $("#player_" + (blue ? 'blue' : 'red')),
        challenger     = $("#player_" + (blue ? 'red' : 'blue')),
        old_challenge  = $(".challenge_container", challenged),
        origin         = $(".buttons ." + value, challenger);

    // kill all timer animations
    $("#player_blue .timer .bar, #player_red .timer .bar").stop(false,false).css('height','100%');
    
    if (Game.is_stronger_than(value)) {

      var div = $("<div></div>").
        append("<div class='challenge " + value + "'></div>").
        append("<div class='challenge_countdown'></div>").
        addClass("challenge_container").
        appendTo("#player_" + (blue ? 'red' : 'blue')).
        css({ 
          top  : 300, 
          left : 250 
        }).
        animate({ 
          width   : 160, 
          height  : 160, 
          top     : -40, 
          left    : 250, 
          opacity : 1 },
        {
          duration : 250,
          complete : function(){

            var self = $(this);

            Game.show_challenge_description(blue, value, function(){ 
              Game.challenge = value;
              Game.activate_player(blue); 
            });

            old_challenge.animate(
              { opacity  : 0, top : 100 },
              { duration : 300, 
                complete : function(){ 
                  $(this).remove(); 
              }}); 
          }
        });

    } else {

      Game.sounds.buzzer.play();

      var div = $("<div></div>").
        append("<div class='challenge " + value + "'></div>").
        append("<div class='challenge_countdown'></div>").
        addClass("challenge_container").
        appendTo("#player_" + (blue ? 'red' : 'blue')).
        css({ 
          top  : 300, 
          left : 250 
        }).
        animate({ 
          width   : 120, 
          height  : 120, 
          top     : -40, 
          left    : 250, 
          opacity : 1 },
        300).
        animate({
          top     : 300,
          left    : 600,
          opacity : 0
        }, { 
          duration : 300, 
          complete : function(){

            Game.show_challenge_description(!blue, value, function(){ 
              Game.increment_score(blue);
              Game.challenge = false; 
              Game.activate_player(!blue); 
            });
            
            old_challenge.animate({ opacity : 0, top : 100 }, { 
              duration : 300, 
              complete : function(){
                $(this).remove();
              }
            });
          }
        });
    }
    
  },

  // TODO: This should flash the description of the challenge, i.e., 'Spock vaporizes Rock',
  // then run the callback once it's all done
  show_challenge_description: function(blue, new_challenge, callback){
    
    // challenged player ran out of time
    if (new_challenge===undefined) {

      console.log('out of time');
      // if (blue) {
      //   var str = "<span class='blue'>:)</span> <span class='red'>:(</span>";
      // } else {
      //   var str = "<span class='blue'>:(</span> <span class='red'>:)</span>";
      // }
      
      Game.show_message((blue ? "Blue" : "Red") + " is out of time!", true);

      _.delay(function(){
        Game.hide_message();
        if (callback!==undefined) {
          callback.call(this, blue);
        }
      }, 1000);

    // this is a new challenge
    } else if (!Game.challenge || Game.challenge==new_challenge) {
      
      console.log('new challenge');

      if (callback!==undefined) {
        callback.call(this, blue);
      }

    // challenged player picked stronger item
    } else if (Game.is_stronger_than(new_challenge)) {
      
      var subject   = new_challenge,
          verb      = Game.challenges[new_challenge].strong_verbs[ Game.challenges[new_challenge].stronger_than.indexOf(Game.challenge) ],
          predicate = Game.challenge;

      var str = [ subject, verb, predicate ].join(" ");

      console.log('stronger', str);

      Game.show_message(str, true);

      _.delay(function(){
        Game.hide_message();
      }, 1000);

      if (callback!==undefined) {
        callback.call(this, blue);
      }

    // challenged player picked weaker item
    } else if (!Game.is_stronger_than(new_challenge)) {
      
      var subject   = new_challenge,
          verb      = Game.challenges[new_challenge].weak_verbs[ Game.challenges[new_challenge].weaker_than.indexOf(Game.challenge) ],
          predicate = Game.challenge;

      var str = [ subject, verb, predicate ].join(" ");

      console.log('weaker', str);

      Game.show_message(str, true);

      _.delay(function(){
        Game.hide_message();
      }, 1000);

      if (callback!==undefined) {
        callback.call(this, blue);
      }

    }

  },

  is_stronger_than : function(new_challenge) {

    if (!Game.challenge) { return true; }

    return _.include(Game.challenges[new_challenge].stronger_than, Game.challenge);

  },

  save_to_history : function(blue, value) {
    
    if (value!==undefined) {
      Game.history[(blue ? 0 : 1)].push(value);

      if (blue===true) {
        var lists = $(".history .blue");
        $("#player_blue .history .blue, #player_red .history .blue").append("<li class='" + value + "'></li>");
        
      } else {
        var lists = $(".history .red");
        $("#player_blue .history .red, #player_red .history .red").append("<li class='" + value + "'></li>");
      }

      lists.each(function(){
        var list = $(this);
        if (list.height() > list.parent().height()) {
          $($("li",list).get(0)).remove();
        }
      });

    }
    
  },

  increment_score : function(blue) {
    if (blue) {
      Game.scores[0]+=1;
    } else {
      Game.scores[1]+=1;
    }
    Game.refresh_scores();
  },

  refresh_scores : function(){
    $(".scores .blue").text(Game.scores[0]);
    $(".scores .red").text(Game.scores[1]);
  },

  pause : function(){
    Game.paused = true;
  },

  quit : function(player_blue_quit) {
    
    $(".challenge_container").animate({ opacity : 0 }, { duration : 300, complete : function(){ $(this).remove(); } });

    if (player_blue_quit===true) {
      Game.show_message("Blue Player Resigned! <br /><span class='blue'>" + Game.scores[0] + "</span> : <span class='red'>" + Game.scores[1] + "</span>");
    } else {
      Game.show_message("Red Player Resigned! <br /><span class='blue'>" + Game.scores[0] + "</span> : <span class='red'>" + Game.scores[1] + "</span>");
    }

    Game.reset();
  },

  // if passed a callback, will delay for X seconds, then run it
  show_message : function(text, subtle) {
    
    Game.messages.html("<h2>" + text + "</h2>");
    if (subtle===true) {
      Game.messages.addClass("subtle");
    } else {
      Game.messages.removeClass("subtle");
    }
    Game.messages.animate({ opacity : 1 },200);
  },

  hide_message : function(){
    Game.messages.animate({ opacity : 0 });
  },

  start_countdown : function() {
    int = 3;
    Game.main.everyTime(1000,'countdown',function(){
      
      Game.countdown.html("<h1 class='countdown'>" + int + "<h1>");
      
      if (int==0){
        $(".countdown").text("GO!");
      }

      if (int==-1) {
        $(this).stopTime('countdown');
        Game.activate_player(true);
        $(".countdown").empty().addClass('blue_active');
        $(".pause, .quit").removeClass('disabled');
      } 

      int-=1;
      
    });
  },

  reset : function(return_to_intro){

    var home = $("<h1 class='bttn home'>Home</h1>").
      click(function(){
        Game.initialize_behaviours();
      });

    Game.countdown.empty().append(home);

    if (return_to_intro===true) {
      Game.initialize_behaviours();
    }
  },

  pause : function(aux_text) {
    
    var str = "<h2>PAUSED</h2>" + ( aux_text ? aux_text : "");

    $("<div id='overlay'></div>").html(str).appendTo('body');

  },

  resume : function() {
    $("#overlay").remove();
  },

  prevent_portrait_mode : function() {
    
    function reorient(e) {
      if (window.orientation % 180 == 0) {
        Game.pause("Please return your iPad to its horizontal orientation");
      } else {
        Game.resume(); 
      }
    }
    window.onorientationchange = reorient;
    window.setTimeout(reorient, 0);

  }
};