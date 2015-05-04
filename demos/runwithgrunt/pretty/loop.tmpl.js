"use strict";var espHTML = this._escapeHTML,initTmpl = this._template,_out='';_out+='<span>'+(it.name)+'</span><span>'+ espHTML(it.name)+'</span>
<br />
<br />';if(it.isMale=='Male') {_out+='aspx';} _out+='
<ul class="">';var arr1=it.goods;if(arr1) {var $val,$idx;for(var i1=0; i1
  <arr1.length; i1++){$idx=i1,$val=arr1[i1];_out+=' <li>' + espHTML($val)+ '@ idx'+ espHTML($idx)+ ' <ul> ';var arr2=it.week;if(arr2) {var $val,$idx;for(var i2=0; i2<arr2.length; i2++){$idx=i2,$val=arr2[i2];_out+=' <li>' + espHTML($val)+ '@ idx'+ espHTML($idx)+ ' </li> ';} } _out+=' </ul> </li>' ;} } _out+='</ul>' ;if(it.isMale) {_out+='<br /><span>I\' m a guy!</span>';if(it.isOld) {_out+='
    <br /><span>I\'m old!</span>';} } return _out;