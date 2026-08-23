<?php namespace ProcessWire;

/**
 * Font Awesome Pro — stylesheet container
 * =======================================
 * Drop-in replacement for $config->styles that either removes the core Font
 * Awesome stylesheets, or demotes them to the front of the queue so the Pro
 * stylesheets appended by FontAwesomePro still win the cascade.
 *
 * Why a container subclass rather than a hook: the admin themes append their
 * Font Awesome <link> at render time and echo it in the same file, with no
 * hook in between. AdminThemeUikit's _main.php even calls renderExtraMarkup()
 * *before* including _head.php, so AdminTheme::getExtraMarkup fires too early
 * to remove anything. Filtering at the container is the only point that sees
 * every append, on every admin theme, without touching rendered output.
 *
 * @author Macrura
 * @copyright Copyright (c) 2017-2026 outflux3
 * @license MIT License, see LICENSE
 *
 */

class FontAwesomeProStyles extends FilenameArray {

	/**
	 * Path fragment identifying a core Font Awesome stylesheet
	 *
	 * Matches both the legacy 4.x directory (styles/font-awesome/) and the
	 * versioned 6.x+ directories (styles/font-awesome-6.7.2/) added in 3.0.265.
	 *
	 */
	const corePath = 'templates-admin/styles/font-awesome';

	/**
	 * Drop core Font Awesome entirely
	 *
	 */
	const modeRemove = 'remove';

	/**
	 * Keep core Font Awesome, but move it ahead of everything already queued
	 *
	 */
	const modeDemote = 'demote';

	/**
	 * @var string One of the mode constants
	 *
	 */
	protected $mode = self::modeRemove;

	/**
	 * Core Font Awesome URLs this container intercepted, for diagnostics
	 *
	 * @var array
	 *
	 */
	protected $intercepted = array();

	/**
	 * Set the handling mode for core Font Awesome
	 *
	 * @param string $mode
	 * @return $this
	 *
	 */
	public function setMode($mode) {
		$this->mode = $mode === self::modeDemote ? self::modeDemote : self::modeRemove;
		return $this;
	}

	/**
	 * Is this a core Font Awesome stylesheet?
	 *
	 * @param string $filename
	 * @return bool
	 *
	 */
	protected function isCoreFontAwesome($filename) {
		return strpos((string) $filename, self::corePath) !== false;
	}

	/**
	 * Add a file
	 *
	 * @param string $filename
	 * @return $this
	 *
	 */
	public function add($filename) {
		if($this->isCoreFontAwesome($filename)) {
			$this->intercepted[] = $filename;
			if($this->mode === self::modeRemove) return $this;
			return parent::prepend($filename);
		}
		return parent::add($filename);
	}

	/**
	 * Prepend a file
	 *
	 * @param string $filename
	 * @return $this
	 *
	 */
	public function prepend($filename) {
		if($this->isCoreFontAwesome($filename)) {
			$this->intercepted[] = $filename;
			if($this->mode === self::modeRemove) return $this;
		}
		return parent::prepend($filename);
	}

	/**
	 * Get the core Font Awesome URLs this container intercepted
	 *
	 * @return array
	 *
	 */
	public function getIntercepted() {
		return $this->intercepted;
	}

}
