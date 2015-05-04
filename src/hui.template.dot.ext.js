if(tmplEngine) {
    tmplEngine.tags = {
            beginTag:       '{{',
            endTag:         '}}',
            varBeginTag:       '{{',
            varEndTag:         '}}'
    };

    tmplEngine.syntaxRules = {
        evaluate:       '$bt([\\s\\S]+?(\\}?)+)$et',
        interpolate:    '$bt=([\\s\\S]+?)$et',
        unescape:       '$bt!([\\s\\S]+?)$et',
        conditional:    '$bt\\?(\\?)?\\s*([\\s\\S]*?)\\s*$et',
        iterate:        '$bt~\\s*(?:$et|([\\s\\S]+?)\\s*(?:\\:\\s*([\\w$]+))?\\s*(?:\\:\\s*([\\w$]+))?\\s*$et)',
        include:        '$bt@\\s*([^}]*?)\\s*,\\s*([^}]*?)$et'
    };
}