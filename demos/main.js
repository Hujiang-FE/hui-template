 require(['../src/hui.template'], function() {
    var obj = { 
        "name": "<button onclick='alert(0)'>Daniel</button>", 
        "age": 31, 
        "isMale": true, 
        "isOld": true, 
        'goods': ['apple', 'pear', 'peach', 'orange'], 
        week: ['Monday', 'tuesday', 'wedsday', 'turseday',' firday'] 
    }

    var engine = HUI.template('#tmpl1');
    var str = engine.render(obj);

    document.getElementById('content').innerHTML = str;
});