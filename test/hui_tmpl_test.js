var assert = require("assert");
var tmpl = require("../src/hui.template.js");


describe('hui.template', function(){
	//evalute
	var tmplEscapeStr = '<div>#{it.foo}</div>',
		tmplUnEscapeStr =  '<div>#{!it.foo}</div>',
		tmplEscapeFn = tmpl.compile(tmplEscapeStr);
		tmplUnEscapeFn = tmpl.compile(tmplUnEscapeStr);

	describe('renderTmpl-evalute ', function(){
		it('should render the template as experted!', function(){
			assert.equal("<div>http</div>", tmplEscapeFn.render({foo:"http"}));
			assert.equal("<div>&#60;scrpt src=&#39;http:&#47;&#47;abc.com&#39; &#47;&#62;</div>", 
				tmplEscapeFn.render({foo:"<scrpt src='http://abc.com' />"}));
			assert.equal("<div><scrpt src='http://abc.com' /></div>", 
				tmplUnEscapeFn.render({foo:"<scrpt src='http://abc.com' />"}));
		});
	});

	var loopStr = '<ul>{{for:it.all}}<li>#{$val}#{$idx}</li>{{/for}}</ul>',
		loopFn = tmpl.compile(loopStr);
	describe('renderTmpl-loop ', function(){
		it('should render the template as experted!', function(){
			assert.equal('<ul><li>apple0</li><li>pear1</li><li>orange2</li><li>banana3</li></ul>', 
			loopFn.render({all:['apple','pear','orange','banana']}));
		});
	});

	var condStr = '{{ if:it.isMale }}Male'
					+'{{elif:it.isOld}}Old'
					+'{{else}}Young{{/if}}',
		condFn = tmpl.compile(condStr);
	describe('renderTmpl-condition ', function(){
		it('should render the template as experted!', function(){
		   assert.equal("Male", condFn.render({isMale:true, isOld:false}));
		   assert.equal("Old", condFn.render({isMale:false, isOld:true}));
		   assert.equal("Young", condFn.render({isMale:false, isOld:false}));
		});
	});

	//var inlineCodeStr = '<!-- var a="Daniel.He", b="@Hujiang"; for(var i=0; i<3; i++) {--><span>#{a+b}</span><!--}-->',
	var inlineCodeStr = '{{eval: var a="Daniel.He", b="@Hujiang"; for(var i=0; i<3; i++) {}}<span>#{a+b}</span>{{eval:}}}',
		inlineCodeFn = tmpl.compile(inlineCodeStr);
	describe('renderTmpl-inline-code ', function(){
		it('should render the template as experted!', function(){
		   assert.equal("<span>Daniel.He@Hujiang</span><span>Daniel.He@Hujiang</span><span>Daniel.He@Hujiang</span>", 
		   	inlineCodeFn.render());
		});
	});
})