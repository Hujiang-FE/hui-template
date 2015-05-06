HUI.template.tags = {
        beginTag:       '{{',
        endTag:         '}}',
        varBeginTag:    '{{',
        varEndTag:      '}}'
    };

    HUI.template.syntaxRules = {
        evaluate:       '$bt([\\s\\S]+?(\\}?)+)$et',
        interpolate:    '$bt=([\\s\\S]+?)$et',
        unescape:       '$bt!([\\s\\S]+?)$et',
        conditional:    '$bt\\?(\\?)?\\s*([\\s\\S]*?)\\s*$et',
        //iterate:        '$bt~\\s*(?:$et|([\\s\\S]+?)\\s*\\:\\s*([\\w$]+)\\s*(?:\\:\\s*([\w$]+))?\\s*$et)',
        iterate:        '$bt~(?:\\s*([\\w$]+)\\s*(?:\\,\\s*([\\w$]+))?\\s*in)?(\\s*[\\s\\S]*?)\\s*$et',
        include:        '$bt@\\s*([^}]*?)\\s*,\\s*([^}]*?)$et'
    };
