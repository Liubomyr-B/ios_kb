//window.location.reload(true);
var iosKeyboard = (function() {
    var keyboardMode = 'letters';
    var keyboardCaseMode = 'lowercase';
    var keyboardLangMode = 'en';
    var availableLangs = [];
    var keyboardData;
    var keyboardObject;
    var activeTextBox;
    var caretPosition;
    var content = '';

    var tapTimeout;
    var lastTap = 0;

    //cache DOM
    var textFields = document.querySelectorAll("textarea, input[type=text], input[type=password]");
    var keys, shiftKeys, numbersModeKeys, backspacesKeys, returnKeys, langKeys;

    _init();

    function _init() {
        loadKeyboardData(function(response) {
            keyboardData = JSON.parse(response);
            createKeyboardObject();
            bindEvents()
        });
    }

    function bindEvents() {
        textFields.forEach(function(elem) {
            elem.setAttribute('readonly', 'readonly');
            elem.addEventListener("touchstart", function (e) {
                e.preventDefault();
            });
            elem.addEventListener("touchend", showKeyboard);
        });

        keys = keyboardObject.querySelectorAll(".key.white");
        keys.forEach(function(elem) {
            elem.addEventListener("touchstart", typeCharacter);
            elem.addEventListener("touchend", showLabel);
            elem.addEventListener("touchend", function() {
                setCaretPosition(caretPosition+1);
            });
        });

        shiftKeys = keyboardObject.querySelectorAll(".shift");
        shiftKeys.forEach(function(elem) {
            elem.addEventListener("touchend", function(event) {
                var currentTime = new Date().getTime();
                var tapLength = currentTime - lastTap;
                clearTimeout(tapTimeout);
                if (tapLength < 500 && tapLength > 0) {
                    console.log('Double Tap');
                    enableCapsLock();
                    event.preventDefault();
                } else {
                    if(keyboardCaseMode == "lowercase") {
                        enableUppercase(event);
                    } else {
                        disableUppercase(event);
                    }

                    tapTimeout = setTimeout(function() {
                        console.log('Single Tap (timeout)');
                        clearTimeout(tapTimeout);
                    }, 500);
                }
                lastTap = currentTime;
            });

        });


        numbersModeKeys = keyboardObject.querySelectorAll(".numbers-mode, .letters-mode, .symbols-mode");
        numbersModeKeys.forEach(function(elem) {
            elem.addEventListener("touchend", switchMode);
        });

        backspacesKeys = keyboardObject.querySelectorAll(".backspace");
        backspacesKeys.forEach(function(elem) {
            elem.addEventListener("touchend", function(e) {
                removeCharacter(e);
                setCaretPosition(caretPosition-1);
            });

        });

        returnKeys = keyboardObject.querySelectorAll(".return");
        returnKeys.forEach(function(elem) {
            elem.addEventListener("touchend", newLine);

        });

        langKeys = keyboardObject.querySelectorAll(".lang-mode");
        langKeys.forEach(function(elem) {

            var pressTimer;
            elem.addEventListener("touchstart", function (e) {
                elem = this;
                pressTimer = window.setTimeout(function () {
                    showLangsList(elem);
                    e.preventDefault();
                }, 1000);
            });

            elem.addEventListener("touchend",function (e) {
                if(pressTimer != null && e.target.className != 'langs-menu') {
                    switchLangMode();
                }

                clearTimeout(pressTimer);
            });
        });

    }

    function _render() {
        if(activeTextBox != null) activeTextBox.value = content;
    }

    function createKeyboardObject() {
        var container = document.createElement("div");
        container.setAttribute("id", "keyboard");

        var lettersMode = document.createElement("div");
        lettersMode.setAttribute("class", 'letters kb-mode');
        for(var k in keyboardData.letters) {
            availableLangs.push(k);

            var keyboardLang = document.createElement("div");
            keyboardLang.setAttribute("id", k);
            keyboardLang.setAttribute("class", 'kb-mode');
            if(keyboardLang != k) keyboardLang.style.display = 'none';

            keyboardLang.appendChild(generateKeyboardMode('keyboardCaseMode', 'lowercase', keyboardData.letters[k].lowercase));
            keyboardLang.appendChild(generateKeyboardMode('keyboardCaseMode', 'uppercase', keyboardData.letters[k].uppercase));
            lettersMode.appendChild(keyboardLang);
        }
        container.appendChild(lettersMode);

        container.appendChild(generateKeyboardMode('keyboardMode', 'numbers', keyboardData.numbers));
        container.appendChild(generateKeyboardMode('keyboardMode', 'symbols', keyboardData.symbols));

        keyboardObject = container;
    }

    function generateKeyboardMode(modeType, modeName, data) {

        var keyboardNewMode = document.createElement("div");
        keyboardNewMode.setAttribute("class", modeName + ' kb-mode');

        if(modeName != eval(modeType)) keyboardNewMode.style.display = 'none';

        for(var k in data) {
            var row = document.createElement("div");
            row.setAttribute("class", "row");

            for (var l in data[k]) {
                var keyClass, keyChar, keyLabel;
                if(typeof data[k][l] === 'object') {
                    keyClass = data[k][l].class;
                    keyChar = (data[k][l].char != null) ? data[k][l].char : data[k][l].label;
                    keyLabel = (data[k][l].label != null) ? data[k][l].label : data[k][l].char;
                } else {
                    keyClass = "key white";
                    keyChar = data[k][l];
                    keyLabel = data[k][l];
                }

                var key = document.createElement("div");
                key.setAttribute("class", keyClass);
                key.setAttribute('data-key', keyChar);
                var character = document.createElement("span");
                var textNode = document.createTextNode(keyLabel.replace(/&#(\d+);/g, function(fullStr, str) { return String.fromCharCode(str); }));

                character.appendChild(textNode);

                key.appendChild(character);

                row.appendChild(key);
            }

            keyboardNewMode.appendChild(row);
        }

        return keyboardNewMode;
    }

    function showKeyboard() {
        activeTextBox = this;
        content = this.value;
        document.body.appendChild(keyboardObject);
        document.getElementById(keyboardLangMode).style.display = 'block';
    }

    function typeCharacter(e) {

        caretPosition = getCaretPosition();

        if (window.getSelection) {
            var start = caretPosition;
            var finish = activeTextBox.selectionEnd;

            var selectedText = content.substring(start, finish);

            content = content.substring(0, start) + "" + content.substring(finish, content.length);
        }

        var preText = content.substring(0, caretPosition);
        var postText = content.substring(caretPosition, activeTextBox.value.length);

        var character = this.getAttribute('data-key').replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });

        content = preText + character + postText;

        _render();

    }

    function removeCharacter(e) {

        caretPosition = getCaretPosition();

        if (window.getSelection) {
            var start = caretPosition;
            var finish = activeTextBox.selectionEnd;

            var selectedText = content.substring(start, finish);

            content = content.substring(0, start) + "" + content.substring(finish, content.length);
        }

        var preText = content.substring(0, caretPosition);
        var postText = content.substring(caretPosition, activeTextBox.value.length);

        content = preText.slice(0, -1) + postText;

        _render();

    }

    function newLine() {
        content = content + '\n';
        _render();
    }

    function showLabel() {

    }

    function showLangsList(elem) {
        var langsMenuCon = document.createElement("div");
        langsMenuCon.setAttribute("class", "langs-menu");

        var langsMenu = document.createElement("ul");

        for (var l in availableLangs) {
            var langItem = document.createElement("li");
            langItem.setAttribute('data-lang', availableLangs[l]);
            if(keyboardLangMode == availableLangs[l]) langItem.setAttribute('class', 'active');
            langItem.addEventListener('touchstart', function (e) {
                e.stopImmediatePropagation();
                setLangMode(e);
                langsMenu.parentNode.removeChild( langsMenu );
            });
            var langName = document.createTextNode(keyboardData.languages[availableLangs[l]]);
            langItem.appendChild(langName)
            langsMenu.appendChild(langItem);
        }

        langsMenuCon.appendChild(langsMenu);

        //var svg = '';
        //langsMenuCon.innerHTML += svg;

        elem.appendChild(langsMenuCon);


    }

    function getCaretPosition() {

        var caretPosition = 0;

        // Firefox, Chrome, IE9~ Support
        if(activeTextBox.selectionStart || activeTextBox.selectionStart == '0') {
            caretPosition = activeTextBox.selectionStart;
        }
        // ~IE9 Support
        else if(document.selection) {
            activeTextBox.focus();
            var sel = document.selection.createRange();
            sel.moveStart('character', -activeTextBox.value.length);
            caretPosition = sel.text.length;
        }

        return caretPosition;
    }

    function setCaretPosition(caretPos) {

        // IE Support
        if (document.selection) {

            // Set focus on the element
            activeTextBox.focus ();
            // Create empty selection range
            var oSel = document.selection.createRange ();

            // Move selection start and end to 0 position
            oSel.moveStart ('character', -activeTextBox.value.length);

            // Move selection start and end to desired position
            oSel.moveStart ('character', caretPos);
            oSel.moveEnd ('character', 0);
            oSel.select ();
        }

        // Firefox support
        else if (activeTextBox.selectionStart || activeTextBox.selectionStart == '0') {
            activeTextBox.selectionStart = caretPos;
            activeTextBox.selectionEnd = caretPos;
            activeTextBox.focus ();
        }
    }

    function loadKeyboardData(callback) {

        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', 'ios.json', true);
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }

    function enableUppercase(e) {
        keyboardObject.querySelector('#' + keyboardLangMode).querySelector('.' + keyboardCaseMode).style.display = 'none';
        keyboardCaseMode = 'uppercase';
        keyboardObject.querySelector('#' + keyboardLangMode).querySelector('.' + keyboardCaseMode).style.display = 'block';

        e.preventDefault()
        shiftKeys.forEach(function(elem) {
            elem.className += ' caps-lock';
        });

        keys.forEach(function(elem) {
            elem.addEventListener("touchend", disableUppercase);
        });
    }

    function disableUppercase() {
        keyboardObject.querySelector('#' + keyboardLangMode).querySelector('.' + keyboardCaseMode).style.display = 'none';
        keyboardCaseMode = 'lowercase';
        keyboardObject.querySelector('#' + keyboardLangMode).querySelector('.' + keyboardCaseMode).style.display = 'block';

        keys.forEach(function(elem) {
           elem.removeEventListener("touchend", disableUppercase);
        });

        shiftKeys.forEach(function(elem) {
            elem.className =  elem.className.replace(' caps-lock', '');
        });

    }

    function enableCapsLock() {
        shiftKeys.forEach(function(elem) {
            elem.className =  elem.className.concat(" caps-lock");
            elem.addEventListener("touchend", disableCapsLock);
        });

        keys.forEach(function(elem) {
            elem.removeEventListener("touchend", disableUppercase);
        });
    }

    function disableCapsLock() {
        keyboardObject.querySelector('#' + keyboardLangMode).querySelector('.' + keyboardCaseMode).style.display = 'none';
        keyboardCaseMode == 'lowercase';
        keyboardObject.querySelector('#' + keyboardLangMode).querySelector('.' + keyboardCaseMode).style.display = 'block';

        shiftKeys.forEach(function(elem) {
            elem.className =  elem.className.replace(' caps-lock', '');
            elem.removeEventListener("touchend", disableCapsLock);
        });
    }

    function switchLangMode() {
        keyboardObject.querySelector('#' + keyboardLangMode).style.display = 'none';

        var activeLang = availableLangs.indexOf(keyboardLangMode);

        if(activeLang == -1) return false;

        if((activeLang + 1) != (availableLangs.length)) {
            keyboardLangMode = availableLangs[(activeLang + 1)];
        } else {
            keyboardLangMode = availableLangs[0];
        }

        keyboardObject.querySelector('#' + keyboardLangMode).style.display = 'block';
    }

    function setLangMode(e) {
        var selectedlang = e.target.getAttribute('data-lang');
        console.log(selectedlang, keyboardLangMode);

        if(keyboardLangMode == selectedlang) return false;

        console.log('lang change')
        keyboardObject.querySelector('#' + keyboardLangMode).style.display = 'none';

        keyboardLangMode = selectedlang;

        keyboardObject.querySelector('#' + keyboardLangMode).style.display = 'block';
    }

    function switchMode() {
        keyboardObject.querySelector('.' + keyboardMode + '.kb-mode').style.display = 'none';

        if(this.className.indexOf("numbers-mode") !== -1){
            keyboardMode = "numbers";
        } else if(this.className.indexOf("letters-mode") !== -1) {
            keyboardMode = "letters";
        } else if(this.className.indexOf("symbols-mode") !== -1) {
            keyboardMode = "symbols";
        }

        keyboardObject.querySelector('.' + keyboardMode + '.kb-mode').style.display = 'block';
    }

    return {

    }
})();

