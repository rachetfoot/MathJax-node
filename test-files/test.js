if (typeof console === 'undefined') {
    console = {log: function(msg) {print(msg)}};
}

load('jvm-npm.js');
var mj=require('mj-single');
mj.config({MathJax: {SVG: {font: "TeX"}}});
mj.start();
mj.typeset({math:"\\frac{x}{y^2}",svg:true}, function (data) { if (!data.errors) { print("<html><head></head><body>\n"+data.svg+"\n</body></html>"); } });

/* mj.typeset({math:"\\frac{x}{y^2}",svg:true}, function (data) {
	if (!data.errors) {	
		// Create the file for the html
		var out = new java.io.FileWriter( "svg.html" );

		var html = "<html><head></head><body>\n"+data.svg+"\n</body></html>";
		// Write the html to the file
		out.write( html, 0, html.length );
		out.flush();
		out.close();
	}
}); */