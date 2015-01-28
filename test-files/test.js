if (typeof console === 'undefined') {
    console = {log: function(msg) {print(msg)}};
}

load('jvm-npm.js');
var mj=require('mj-single');
mj.config({MathJax: {SVG: {font: "TeX"}}});
mj.start();

mj.typeset({math:"y^2",svg:true,img:true}, function (data) { if (!data.errors) { print(data.svg); quit(); }; });