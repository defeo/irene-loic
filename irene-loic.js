$(function() {
    var hashes = [
	'#inquisition',
	'#pendules',
	'#simplicio',
	'#observation',
	'#decollage',
	'#planetes',
	'#satellites',
	'#cometes',
	'#rock',
	'#supernovae',
	'#retour'
    ];

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

    // If a hash is present, skip to it
    pop.on('loadeddata', function() {
	if (window.location.hash in cues) {
	    pop.pause(cues[window.location.hash]);
	}
    });

    // On click, seek at a cue in playlist
    $('a').on('click', function() {
	var hash = $(this).attr('href');
        if (hash in cues && cues[hash] >= 0) {
            pop.play(cues[hash]);
	    $(this).blur();
	}
    });

    // Play/pause
    function toggle() {
	if (pop.paused()) pop.play();
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
		pop.pause().emit('cueend');
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

    function scrollText(p) {
	$('#text').scrollTop(p.offset().top 
			     - $('#text>p').first().offset().top);
    }
    
    function updateText() {
	$('body').removeClass('playing');
	var tp = $('#text>p').removeClass('current');
	var hash = currentHash();

	if (!pop.paused()) {
	    $('body').addClass('playing');
	    if (hash) {
		tp.slice(bookmarks[hash], bookmarks[hash]+1)
		    .addClass('current');
	    }
	}

	// scroll text
	if (hash) {
	    scrollText(tp.slice(bookmarks[hash], bookmarks[hash]+1));
	}
    }
    
    // Speak dialogue
    function speak(start, end) {
	if (start < end && $('#dospeak').prop('checked') && pop.paused()) {
	    var sentence = $('#text>p').slice(start, start+1);
	    setTimeout(function () { scrollText(sentence) }, 0);
	    if ($('#char-' + sentence.data('voice')).prop('checked')) {
		Popcorn(sentence.children('audio').get(0))
		    .play()
		    .on('ended', function() {
			speak(start+1, end);
		    });
	    } else {
		setTimeout(function() {
		    speak(start+1, end);
		}, sentence.text().length * 50);
	    }
	} else if (start == end && $('#dospeak').prop('checked')) {
	    pop.emit('dialogend');
	}
    }

    pop
    // Modify playlist on play/pause
	.on('playing', updateText)
	.on('pause', updateText)
	.on('seeked', updateText)
    // Say dialogue
	.on('cueend', function() {
	    var hash = currentHash();
	    if (hash && hashes.indexOf(hash) > 0) {
		var prev = hashes[hashes.indexOf(hash)-1];
		speak(bookmarks[prev], bookmarks[hash]);
	    }
	})
	.on('dialogend', function() {
	    if (pop.paused()) pop.play();
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
    var characters = {
	"[comments]"     : "f1",
	"L'inquisiteur"  : "m1",
	"Galilée"        : "m2",
	"Kepler"         : "m3",
	"Simplicio"      : "m4",
	"Cyrano"         : "m5",
	"Jupiter"        : "f2",
	"_"              : "m6"
    };

    $.ajax({
	url: 'Galilée-proces-dialogue.md',
	dataType: 'text',
	success: function (data) {
	    $('#text')
		.html(conv.makeHtml(data))
		.find('p')
		.each(function(i, p) {
		    var $p = $(p);
		    $p
			.data('char', $p.find('strong').text() || "[comments]")
			.data('voice', $p.data('char') in characters ? characters[$p.data('char')] : characters['_'])
			.data('text', $p.text().replace(/;/g, ','));
		});
	}
    });

    for (c in characters) {
	$('#characters').append('<li><input type="checkbox" id="char-' + characters[c] + 
				'" disabled checked="checked"/> ' + c + '</li>');
    }

    $('#dospeak')
	.one('change', function() {
	    $('#text>p').each(function(i, p) {
		var $p = $(p);
		$p.append('<audio src="http://wa.eguidedog.net/cgi-bin/ekho.pl?cmd=SAVEOGG&voice=fr+'
			  + $p.data('voice') + '&speedDelta=0&pitchDelta=0&volumeDelta=0&text=' 
			  + encodeURI($p.data('text')) + '">');
	    });
	})
	.on('change', function() {
	    if (this.checked) {
		$('#characters')
		    .removeClass('notspeaking')
		    .find('input')
		    .prop('disabled', false);
	    } else {
		$('#characters')
		    .addClass('notspeaking')
		    .find('input')
		    .prop('disabled', true);
	    }
	});

    // Move video to a new window
    $('#video-container a').on('click', function() {
	if (!$('#video-container').hasClass('detached')) {
	    $('#video-container').addClass('detached');

	    // Move video to new window
	    var w = window.open(null, "_blank", 
				"menubar=0,toolbar=0,location=0,personalbar=0,status=0,scrollbars=0");
	    var media = $('#video')
	    $(w.document.body)
		.append(media)
		.css('background-color', 'black')
		.css('padding', '0')
		.css('margin', '0');
	    pop.controls(false);

	    // pass all keydown events to original page
	    $(w.document).on('keydown', function(e) {
		$(document).trigger(e);
	    });
	    // on popoup close, take video back
	    $(w).on('unload', function() {
		pop.controls(true);
		$('#video-container')
		    .prepend(media)
		    .removeClass('detached');
	    });
	}
	return false;
    });
});
