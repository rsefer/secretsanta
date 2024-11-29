let randomizingInterval;
let isRandomizing = false;
let entriesCleaned = [];
let toggleButton = $('#assignSanta');
let entriesWrap = $('.entries');
let messageWrap = $('.message');
const enterKeys = ['Enter', 'NumpadEnter'];

(function($) {

	setSizingVariables();

	let existingEntriesRaw = localStorage.getItem('secretSantaEntries');
	if (existingEntriesRaw?.length > 0) {
		let existingEntries = existingEntriesRaw.split(',');
		for (var existingEntry of existingEntries) {
			insertNewEntry(existingEntry);
		}
	} else {
		insertNewEntry();
	}

	$('body').on('click', '#assignSanta', function() {
		if (isRandomizing) {
			stop();
			$('#copyOrder').prop('disabled', false);
		} else {
			start();
		}
	});

	$('body').on('click', '#addEntry', function() {
		insertNewEntry();
	});

	$('body').on('click', '#clearEntries', function() {
		$('#copyOrder').prop('disabled', true);
		entriesWrap.empty();
		messageWrap.empty();
		saveEntries([]);
		insertNewEntry();
	});

	$('body').on('click', '#copyOrder', function() {
		let entriesCopyList = '';
		let i = 1;
		$('.entry').each(function() {
			entriesCopyList += i + '. ' + $(this).text() + ' giving to ' + $(this).next().attr('data-name') + "\n";
			i++;
		});

		jQuery('body').append('<textarea class="entries-list-copy">' + entriesCopyList + '</textarea>').promise().done(function() {
			navigator.clipboard.writeText(jQuery('.entries-list-copy').text()).then(function() {
				jQuery('.entries-list-copy').remove();
			});
		});
	});

	jQuery('body').on('keypress', '.entries .entry[contenteditable]', function(e) {
		$('#copyOrder').prop('disabled', true);
		$('.giftee').remove();
		if (!enterKeys.includes(e.key)) { return true; }
		if ($(this).is(':last-child')) {
			insertNewEntry();
		}
		$(this).next().trigger('focus');
		document.execCommand('selectAll', false, null);
		return false;
	});

	$.fn.randomize = function(childElem) {
		return this.each(function() {
			var $this = $(this);
			var elems = $this.children(childElem);
			elems.sort(function() { return (Math.round(Math.random()) - 0.5); });
			$this.detach(childElem);
			for (var i = 0; i < elems.length; i++) {
				$this.append(elems[i]);
			}
		});
	}

})(jQuery);

window.addEventListener('resize', function() {
	setSizingVariables();
});

function setSizingVariables() {
	document.documentElement.style.setProperty('--vh', (Math.ceil((window.innerHeight * 0.01) * 100) / 100) + 'px');
}

function start() {
	toggleButton.text('Stop');
	messageWrap.empty();
	if (cleanAndValidateEntries()) {
		randomizeEntriesSeries();
	} else {
		stop();
		if ($('.entries .entry').length == 0) {
			insertNewEntry();
		}
	}
}

function stop() {
	toggleButton.text('Shuffle');
	clearInterval(randomizingInterval);
	isRandomizing = false;
	$('body').removeClass('is-randomizing');
}

function cleanAndValidateEntries() {
	let entriesRaw = $('.entries .entry');
	entriesCleaned = [];
	entriesRaw.each(function() {
		let textContent = $(this).text().trim();
		if (textContent.length > 0) {
			$(this).text(textContent);
			entriesCleaned.push(textContent);
			$(this).attr('data-gifter', textContent);
		} else {
			$(this).remove();
		}
	});
	if (entriesCleaned.length <= 2) {
		messageWrap.text('Must have more than 2 entries');
		return false;
	} else if (entriesCleaned.length != $.unique(entriesCleaned).length) {
		messageWrap.text('Duplicate entries');
		return false;
	}

	saveEntries(entriesCleaned);
	return true;
}

function randomizeEntriesSeries() {
	$('body').addClass('is-randomizing');
	isRandomizing = true;
	randomizingInterval = setInterval(function() {
		randomizeEntries();
	}, 25);
}

function randomizeEntries() {
	let shuffled;
	let isValidAssignment = false;
	while (!isValidAssignment) {
		shuffled = [...entriesCleaned];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		isValidAssignment = !shuffled.some((name, index) => name === entriesCleaned[index]);
	}
	entriesCleaned.forEach((name, index) => {
		const recipient = shuffled[index];
		let thisEntry = $(`.entries .entry[data-gifter="${name}"]`);
		if (thisEntry.next().hasClass('giftee')) {
			thisEntry.next().remove();
		}
		thisEntry.after(`<div class="giftee" data-name="${recipient}">giving to ${recipient}</div>`);
	});
}

function saveEntries(entries) {
	localStorage.setItem('secretSantaEntries', entries);
}

function insertNewEntry(content) {
	entriesWrap.append('<div class="entry" contenteditable>' + (content && content.length > 0 ? content : '') + '</div>');
	$('.entries .entry').last().trigger('focus');

}
