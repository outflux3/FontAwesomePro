/**
 * Font Awesome Pro Icon inputfield
 *
 * The icon list is fetched once per page, on first use, and shared by every
 * field on it. Only matches are rendered — never the whole list — which is what
 * keeps this responsive where the core picker builds several thousand nodes on
 * its first keystroke.
 */
(function() {

	var cfg = null;
	var loading = null;   // shared promise, so several fields cause one fetch
	var icons = null;

	function config() {
		if(cfg === null) cfg = (window.ProcessWire && ProcessWire.config && ProcessWire.config.InputfieldFontAwesomePro) || {};
		return cfg;
	}

	function loadIcons() {
		if(icons) return Promise.resolve(icons);
		if(loading) return loading;
		var url = config().url;
		if(!url) return Promise.reject(new Error('no icon list url'));
		loading = fetch(url, { credentials: 'same-origin' })
			.then(function(r) { if(!r.ok) throw new Error(r.status); return r.json(); })
			.then(function(list) { icons = list; return icons; });
		return loading;
	}

	function el(tag, cls, text) {
		var n = document.createElement(tag);
		if(cls) n.className = cls;
		if(text != null) n.textContent = text;
		return n;
	}

	function Picker(root) {

		var input = root.querySelector('[data-fap-pick] > .fap-pick__input') || root.querySelector('.fap-pick__input');
		var preview = root.querySelector('[data-fap-preview]');
		var browse = root.querySelector('[data-fap-browse]');
		var labels = config().labels || {};
		var panel = null;
		var search = null;
		var results = null;
		var status = null;

		function setValue(name) {
			input.value = name;
			paint();
			input.dispatchEvent(new Event('change', { bubbles: true }));
		}

		function paint() {
			var v = (input.value || '').trim();
			preview.innerHTML = '';
			if(v) {
				var i = el('i');
				i.className = 'fa ' + v;
				preview.appendChild(i);
			}
		}

		function build() {
			panel = el('div', 'fap-pick__panel');
			search = el('input', 'fap-pick__search');
			search.type = 'search';
			search.placeholder = labels.search || 'Search icons…';
			status = el('div', 'fap-pick__status');
			results = el('div', 'fap-pick__results');
			panel.appendChild(search);
			panel.appendChild(status);
			panel.appendChild(results);
			root.appendChild(panel);

			search.addEventListener('input', function() { filter(search.value); });
			search.addEventListener('keydown', function(e) {
				if(e.key === 'Escape') { close(); browse.focus(); }
			});

			results.addEventListener('click', function(e) {
				var tile = e.target.closest('[data-icon]');
				if(!tile) return;
				setValue(tile.getAttribute('data-icon'));
				close();
			});
		}

		function filter(term) {
			term = (term || '').toLowerCase().replace(/^fa-/, '').trim();
			results.innerHTML = '';
			if(!icons) return;

			var max = config().max || 240;
			var shown = 0, total = 0, frag = document.createDocumentFragment();

			for(var i = 0; i < icons.length; i++) {
				var name = icons[i];
				if(term && name.indexOf(term) === -1) continue;
				total++;
				if(shown >= max) continue;
				var b = el('button', 'fap-pick__icon');
				b.type = 'button';
				b.title = name;
				b.setAttribute('data-icon', name);
				var ic = el('i');
				ic.className = 'fa ' + name;
				b.appendChild(ic);
				frag.appendChild(b);
				shown++;
			}

			results.appendChild(frag);

			if(!total) status.textContent = labels.none || 'No icons match';
			else if(total > shown) status.textContent = (labels.more || '%1$d of %2$d shown')
				.replace('%1$d', shown).replace('%2$d', total);
			else status.textContent = total + '';
		}

		function open() {
			if(!panel) build();
			root.classList.add('fap-pick--open');
			status.textContent = labels.loading || 'Loading icons…';
			loadIcons().then(function() {
				search.value = '';
				filter('');
				search.focus();
			}).catch(function() {
				status.textContent = labels.failed || 'Could not load the icon list';
			});
		}

		function close() { root.classList.remove('fap-pick--open'); }

		browse.addEventListener('click', function() {
			root.classList.contains('fap-pick--open') ? close() : open();
		});

		input.addEventListener('input', paint);

		document.addEventListener('click', function(e) {
			if(!root.contains(e.target)) close();
		});

		paint();
	}

	function init(scope) {
		var nodes = (scope || document).querySelectorAll('[data-fap-pick]');
		for(var i = 0; i < nodes.length; i++) {
			if(nodes[i].hasAttribute('data-fap-ready')) continue;
			nodes[i].setAttribute('data-fap-ready', '1');
			new Picker(nodes[i]);
		}
	}

	document.addEventListener('DOMContentLoaded', function() { init(document); });

	// fields arriving from an ajax-loaded tab or a repeater item
	if(window.jQuery) {
		jQuery(document).on('reloaded wiretabclick opened', function(e) { init(e.target); });
	}

})();
