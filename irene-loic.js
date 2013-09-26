$(function() {
    var cues = {
	'#inquisition': 1,
	'#pendules': 30,
	'#simplicio': 74,
	'#observation': -1,
	'#decollage': 226,
	'#planetes': -1,
	'#satellites': -1,
	'#cometes': -1,
	'#rock': -1,
	'#supernovae': -1,
	'#retour': -1
    };

    var bookmarks = {
	'#inquisition': 0,
	'#pendules': 40,
	'#simplicio': 49,
	'#observation': 56,
	'#decollage': 76,
	'#planetes': 95,
	'#satellites': 107,
	'#cometes': 112,
	'#rock': 114,
	'#supernovae': 134,
	'#retour': 134
    };

    var pop = Popcorn('#video');

    function play(cue) {
	pop.play(cue);
    }

    // Seek at a cue in playlist
    function seek(hash) {
	if (!hash) 
            hash = window.location.hash;
        if (hash in cues && cues[hash] >= 0)
            play(cues[hash]);
    }
    // On hash change or click
    $(window).on('hashchange', seek);
    $('a').on('click', function() {
	seek($(this).attr('href'));
	$(this).blur();
    });

    // Play/pause
    function toggle() {
	if (pop.paused()) play();
	else pop.pause();
    }
    // on button click or space/enter
    $('button').on('click', function() {
	$(this).blur();
	toggle();
    });
    $(document).on('keydown', function(e) {
	if (e.which == 13) {
	    toggle();
	    e.preventDefault();
	}
    });

    // Pause before any cue
    for (hash in cues) {
        if (cues[hash] >= 0) {
            pop.cue(cues[hash]-1, function() {
		pop.pause();
            });
        }
    }

    function currentHash() {
        var t = pop.currentTime();
        cue = 0;
        hash = null;
        for (h in cues) {
	    if (cues[h] > 0 && cues[h]-1 <= t && cues[h] > cue) {
		cue = cues[h];
		hash = h;
	    }
        }
	return hash;
    }
    
    pop
    // Modify playlist on play/pause
	.on('playing', function(e) {
	    $('body').addClass('playing');
	    // scroll text
	    var hash = currentHash();
	    $($('#text>p')
	      .removeClass('current')
	      .get(bookmarks[hash]))
		.addClass('current')
		.get(0).scrollIntoView();
	})
	.on('pause', function() {
	    $('body').removeClass('playing');		
	    $('#text>p').removeClass('current');
	})
    // On time change, look for the closest cue update playlist
	.on('timeupdate', function() {
	    var hash = currentHash();
	    if (hash) {
		$('ol a').removeClass('current');
		$('a[href="' + hash + '"]').addClass('current');
	    }
	});

    var conv = new Markdown.Converter();

    $.ajax({
	url: 'Galilée-proces-dialogue.md',
	dataType: 'text',
	success: function (data) {
	    $('#text').html(conv.makeHtml(data));
	}
    });
});
