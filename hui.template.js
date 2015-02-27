﻿(function (global) {

    //comments for commit3 from mac
    var skip = /$^/,  //for skip match
    _cache;

    /**
     * @param tmpl {String}    template ID or template content.
     * @param [data] {Object}    data object.
     */
    var tmplEngine = function (tmpl, data) {
        return tmplEngine[
            typeof data === 'undefined' ? 'compile' : 'render'
        ].apply(tmplEngine, arguments);
    };

    tmplEngine.ver = "0.0.1";

    tmplEngine.cache = _cache = {};

    tmplEngine.tags = {
        beginTag:       '<!--',
        endTag:         '-->',
        varBeginTag:       '#{',
        varEndTag:         '}'
    };

    tmplEngine.syntaxRules = {
        evaluate:       '$bt([\\s\\S]+?(\\}?)+)$et',
        interpolate:    '$bt(\s*[^!][\\s\\S]*?)$et',
        unescape:       '$bt!([\\s\\S]+?)$et',
        conditional:    '$bt\\s*\\/?(?:if|(elif|else))\\:?\\s*([\\s\\S]*?)\\s*$et',
        iterate:        '$bt\\s*\\/?for\\:?(?:\\s*([\\w$]+)\\s*(?:\\,\\s*([\\w$]+))?\\s*in)?(\\s*[\\s\\S]*?)\\s*$et',
        include:        '$bt\\s*include:\\s*([^}]*?)\\s*,\\s*([^}]*?)$et'
    };

    //utils
    var extend = function( target, source ) {
        for ( var key in source ) {
            if ( source.hasOwnProperty( key ) ) {
                target[ key ] = source[ key ];
            }
        }
        return target;
    };

    var escapeRules = {
        "<": '&#60;',
        ">": '&#62;',
        '"': '&#34;',
        "'": '&#39;',
        "&": '&#38;',
        "/": '&#47;'
    };

    var escapeHTML = function (content) {
        if(typeof content !== 'string') {
            return content;
        }
        return content
        .replace(/&(?![\w#]+;)|[<>"'\/]/g, function (s) {
            return escapeRules[s];
        });
    };

    var isArray = function (obj) {
        return ({}).toString.call(obj) === '[object Array]';
    };

    var parseCode = function(code) {
        return code
            .replace(/\\('|\\)/g, "$1")
            .replace(/[\r\t\n]/g, ' ');
    };
    //endutil

    var regEscape = function (raw) {
        return raw.replace(/([\/()[\]?{}|*+-.$^])/g, '\\$1');
    };

    var genRegExps = function (bt, et, rule) {
        
        rule = rule.replace(/\$bt/g, regEscape(bt))
            .replace(/\$et/g, regEscape(et))

        return new RegExp(rule,"ig");
    };

    var initRules = function () {
        var rules   = tmplEngine.syntaxRules,
            bt      = tmplEngine.tags.beginTag,
            et      = tmplEngine.tags.endTag,
            vbt     = tmplEngine.tags.varBeginTag,
            vet     = tmplEngine.tags.varEndTag;
        return {
            conditional    : genRegExps(bt, et, rules.conditional),
            interpolate    : genRegExps(vbt, vet, rules.interpolate),
            unescape       : genRegExps(vbt, vet, rules.unescape),
            iterate        : genRegExps(bt, et, rules.iterate),
            evaluate       : genRegExps(bt, et, rules.evaluate),
            include        : genRegExps(bt, et, rules.include)
        };
    };

    var genTmplFn = function (tmpl) {
        
        var r = initRules(), 
            funStr = '', 
            increment = 0,
            valVar,
            arrName, 
            idxVar;

        funStr  += '"use strict";'
                + 'var espHTML = this._escapeHTML,'
                + 'initTmpl = this._template,'
                + "_out='';_out+='";

        funStr += tmpl
        .replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g, ' ') //join all lines with space(and remove all tab)
        .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, '') // remove whitespace and comments
		.replace(/'|\\/g, '\\$&')  //escape ',\
        .replace(r.interpolate || skip, function (match, code) {
            return '\'+ espHTML(' + parseCode(code) + ')+\'';
        })
        .replace(r.unescape || skip, function (match, code) {
            return '\'+(' + parseCode(code) + ')+\'';
        })
        .replace(r.conditional || skip, function (match, elsecase, code) {
            return elsecase ?
                (code ? 
                    "';} else if(" + parseCode(code) + "){_out+='" : 
                    "';} else {_out+='") :
                (code ? 
                    "';if(" + parseCode(code) + ") {_out+='" : 
                    "';} _out+='");
        })
        .replace(r.iterate || skip, function (match, valName, idxName, iterate) {
            if (!iterate) return "';} } _out+='";
            increment ++; 
            valVar = valName|| '$val';
            idxVar = idxName || '$idx'; 
            loopI = 'i' + increment;
            arrName = 'arr' + increment;
            iterate = parseCode(iterate);
            return "';var " + arrName + '=' + iterate
                    + ';if(' + arrName + ') {var '
                    + valVar + ',' + idxVar 
                    + ';for(var '+loopI+'=0; '
                    + loopI+'<' + arrName + '.length; '
                    + loopI+'++){'
                    + idxVar + '=' + loopI + ','
                    + valVar + '=' + arrName 
                    + '[' + loopI + "];_out+='";
        })
        .replace(r.include || skip, function (match, tmplId, data) { 
            return "'; _out+=initTmpl('" + tmplId + "',"+ data +"); _out+='";
        })
        .replace(r.evaluate || skip, function (match, code) { 
            return "';" + parseCode(code) + "_out+='";
        })

        //escape \n,\t,\r to ensure compile success.
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r');

        funStr += "';return _out;";

        funStr = funStr
            .replace(/(\s|;|\}|^|\{)_out\+='';/g, '$1'); //remove empty _out=''

        if (!!tmplEngine.debug) {
            code = "try{" + funStr + "}catch(e){"
            + "throw {"
            + "id:$id,"
            + "name:'Render Error',"
            + "message:e.message,"
            + "line:$line,"
            + "};"
            + "}";
        }

        try {
            var Render = new Function('it', funStr);
            return Render;
        }
        catch (e) {
            if (typeof console !== 'undefined') {
                console.log("Can't create tmpl function: " + funStr);
            }
            throw e;
        }
    };

    tmplEngine.Engine = function(tmpl) {
        this._escapeHTML = escapeHTML;
        this._template = tmplEngine;
        this.render = genTmplFn(tmpl);
    };

    tmplEngine.get = function (id) {
        if (_cache.hasOwnProperty(id)) {
            return _cache[id];
        }  
        return null;
    };

    tmplEngine.compile = function (tmpl) {
        //todo cache the tmpl fn
        var args = [].slice.call(arguments), 
            cache, id , 
            match = args[0].match(/^\s*#([\w:\-\.]+)\s*$/i);

        if(match) {
            id = match[1];
            if ('document' in global) {
                var elem = document.getElementById(id);
                
                if (elem) {
                    var source = elem.value || elem.innerHTML;
                    tmpl = source.replace(/^\s*|\s*$/g, '');
                }
                else {
                    throw "Can't get template!";
                }
            }
        }

        var renderer = new tmplEngine.Engine(tmpl);

        if(id){
            _cache[id] = renderer;
        }
        return renderer;
    };

    tmplEngine.render = function (tmpl, data) {
        var engine = tmplEngine.get(tmpl) || tmplEngine.compile(tmpl);
        return engine.render(data);
    };

    //attach to jq
    var $ = global.jQuery;
    if ($ && !$.prototype.tmplify) {
        $.fn.tmplify = function (data) {
            var engine = tmplEngine.compile(this.html());
            return engine.render(data);
        };
    }

    // define for hui
    if (typeof define === 'function') {
        define(function () {
            return tmplEngine;
        });
    // attach to nodejs
    } else if (typeof exports !== 'undefined') {
        module.exports = tmplEngine;
    }

    // attach to window&g obj
    global.tmplEngine = tmplEngine;

})(this);
