var chrome = (navigator.userAgent.match(/Chrome/)!=null)?true:false;
var ff = (navigator.userAgent.match(/Firefox/))?true:false;

String.prototype.format = function() {
	var newText = this;
    for (var i = 0; i < arguments.length; i++) {
        newText = newText.replace(/%s/, arguments[i]);
    }
    return newText;
};

if (typeof CSSRule.KEYFRAMES_RULE == 'undefined') {
	CSSRule.KEYFRAMES_RULE = 7;
	CSSRule.KEYFRAME_RULE = 8;
}

/**
 * css animation manager (only find)
 */
var CSSAnimManager = {};
CSSAnimManager.find = function(a) { 
    var result = null;
    var sheet = document.styleSheets;
    // omitting first one with font
    for (var i = 1; i < sheet.length; i++) { 
    	var rules = (typeof sheet[i].cssRules != 'undefined')?sheet[i].cssRules : sheet[i];
    	for (var j in rules) {
    		if (typeof(rules[j])!='undefined' && (rules[j].type === CSSRule.KEYFRAMES_RULE || rules[j].type === CSSRule.KEYFRAME_RULE) && rules[j].name == a )
    			return {index:j, stylesheet:i, rule: rules[j]};
    	}
    } 
    return false; 
};

/**
 * css class manager (adding, checking, removing)
 */

CSSClass = {};
CSSClass.addClass = function(el, className) {
	var re = new RegExp("\\b"+className+"\\b", 'ig');
	if (!((el.className+'').match(re))) {
		el.className += ' '+className;
	}
}

CSSClass.hasClass = function(el, className) {
	var re = new RegExp("\\b"+className+"\\b", 'ig');
	return (el.className+'').match(re);
}

CSSClass.removeClass = function(el, className) {
	var re = new RegExp("\\b"+className+"\\b", 'ig');
	el.className = el.className.replace(re,'').trim();
}

CSSClass.addRemoveClass = function(el, classNameToAdd, classNameToRemove) {
	var remove = new RegExp("\\b"+classNameToRemove+"\\b", 'ig');
	var className = el.className;
	className = className.replace(remove,'').trim();
	if (!className.match(classNameToAdd))
		className += ' '+classNameToAdd;
	el.className = className;
}

// special templates to creating new css rules for animations
if (ff) {
	var templates = {
			marginAnim: "@-moz-keyframes resize-%s {\n"+
					"0% { margin-left:%spx; }\n"+
					"100% { margin-left:%spx;}\n"+
				"}",
			paddingAnim: "@-moz-keyframes correct-resize-%s {\n"+
					"0% { padding-left:%s%; }\n" +
					"100% { padding-left:%s%; }\n" +
				"}"
			}
}

//mutex for setpos function
var working = false;

/**
 * saving default values for css animations
 */

var defMargin ={},  defPadding = {};
var marginStyle = CSSAnimManager.find('resize-left');
var paddingStyle = CSSAnimManager.find('correct-resize-left');

defMargin.from = parseInt(marginStyle.rule.cssRules[0].style.marginLeft);
defMargin.to = parseInt(marginStyle.rule.cssRules[1].style.marginLeft);

defPadding.from = parseInt(paddingStyle.rule.cssRules[0].style.paddingLeft);
defPadding.to = parseInt(paddingStyle.rule.cssRules[1].style.paddingLeft);

marginStyle = null;
paddingStyle = null;

 
/**
 * setting position for animation
 */

function setpos(prefix) {
	if (working) {
		// waiting for previous one
		setTimeout(function(){setpos(prefix)}, 100);
		return;
	}
	working = true;
	var el = document.getElementById('move');
	var css = window.getComputedStyle(el,null);
	var layer = document.getElementById('layer');
	
	var values = {
			right: {margin: defMargin.from, padding:defPadding.from},
			left: {margin:defMargin.to, padding:defPadding.to}
	};
	
	var ml = parseFloat(css.getPropertyValue('margin-left'));
	var p = ml/defMargin.from;
	var pl = window.getComputedStyle(layer,null).getPropertyValue('padding-left');
	
	var anim1, anim2;
	
	if (chrome) {
		anim1 = CSSAnimManager.find('resize-'+prefix);
		anim2 = CSSAnimManager.find('correct-resize-'+prefix);
		anim1.rule.cssRules[0].style.marginLeft = Math.round(ml)+'px';
		anim2.rule.cssRules[0].style.paddingLeft = Math.round(p*100)+'%';
	}
	
	// different event handling for ff due to bug during changing styles in css rules in animations, which causes crash of browser
	if (ff) {
		
		anim1 = CSSAnimManager.find('resize-'+prefix);
		document.styleSheets[anim1.stylesheet].deleteRule(anim1.index);
		document.styleSheets[anim1.stylesheet].insertRule(templates.marginAnim.format(prefix, Math.round(ml), values[prefix].margin),0);
		
		anim2 = CSSAnimManager.find('correct-resize-'+prefix);
		document.styleSheets[anim2.stylesheet].deleteRule(anim2.index);
		document.styleSheets[anim2.stylesheet].insertRule(templates.paddingAnim.format(prefix, Math.round(p*100), values[prefix].padding),0);
		
	}
	working = false;
}

/**
 * back defaults parameters of animations
 */

function backDefaults() {
	var anim1, anim2;
	
	if (chrome) {
		anim1 = CSSAnimManager.find('resize-left');
		anim2 = CSSAnimManager.find('correct-resize-left');
		
		anim1.rule.cssRules[0].style.marginLeft = defMargin.from+'px';
		anim2.rule.cssRules[0].style.paddingLeft = defPadding.from+'%';
	}
	
	
	if (ff) {
		anim1 = CSSAnimManager.find('resize-left');
		document.styleSheets[anim1.stylesheet].deleteRule(anim1.index);
		document.styleSheets[anim1.stylesheet].insertRule(templates.marginAnim.format('left', defMargin.from, defMargin.to),0);
		
		anim2 = CSSAnimManager.find('correct-resize-left');
		document.styleSheets[anim2.stylesheet].deleteRule(anim2.index);
		document.styleSheets[anim2.stylesheet].insertRule(templates.paddingAnim.format('left', defPadding.from, defPadding.to),0);
	}	
	
	if (chrome) {
		anim1 = CSSAnimManager.find('resize-right');
		anim2 = CSSAnimManager.find('correct-resize-right');
		anim1.rule.cssRules[0].style.marginLeft = defMargin.to+'px';
		anim2.rule.cssRules[0].style.paddingLeft = defPadding.to+'%';
	}

	if (ff) {
		anim1 = CSSAnimManager.find('resize-right');
		document.styleSheets[anim1.stylesheet].deleteRule(anim1.index);
		document.styleSheets[anim1.stylesheet].insertRule(templates.marginAnim.format('right', defMargin.to, defMargin.from),0);
		
		anim2 = CSSAnimManager.find('correct-resize-right');
		document.styleSheets[anim2.stylesheet].deleteRule(anim2.index);
		document.styleSheets[anim2.stylesheet].insertRule(templates.paddingAnim.format('right', defPadding.to, defPadding.from),0);
	}
}

window.onload = function() {
	document.getElementById('layer').addEventListener('webkitAnimationEnd', function(e) {
		if (!CSSClass.hasClass(document.getElementById('layer'), 'finished')) {
			CSSClass.addClass(document.getElementById('layer'), 'finished');
			backDefaults();
		}
	}, false);
	
	
	document.getElementById('layer').addEventListener('animationend', function(e) {
		if (!CSSClass.hasClass(document.getElementById('layer'), 'finished')) {
			CSSClass.addClass(document.getElementById('layer'), 'finished');
			backDefaults();
		}
	}, false);
	
	var layer = document.getElementById('layer');
	
	document.getElementById('rightButton').addEventListener('mouseover', function(e) {
		if (CSSClass.hasClass(layer, 'anim-resize-left')) {
			if (!CSSClass.hasClass(layer, 'finished'))
				setpos('right');
			CSSClass.removeClass(layer, 'finished');
		}
		
		CSSClass.addRemoveClass(layer, 'anim-resize-right', 'anim-resize-left');
	}, false);
	
	document.getElementById('leftButton').addEventListener('mouseover', function(e) {
		if (CSSClass.hasClass(layer, 'anim-resize-right')) {
			if (!CSSClass.hasClass(layer, 'finished'))
				setpos('left');
			CSSClass.removeClass(layer, 'finished');
		}
		CSSClass.addRemoveClass(layer, 'anim-resize-left', 'anim-resize-right');
		
	}, false);
	
};

if (typeof console == 'undefined') {
	console = {
			log:function(){}
	};
}