var options = {
  linebreaks: true,
  dpi: 0,
  font: "STIX",
  ex: 8,
  width: 130,
  extensions: "color.js"
};

if (options.font === "STIX") options.font = "STIX-Web";

var start = process.hrtime();
var mjAPI = require("./lib/mj-single.js");
mjAPI.config({MathJax: {SVG: {font: options.font, blacker: 0}}, extensions: options.extensions});
mjAPI.start();

if (options.dpi === 0) {options.dpi = options.ex * 16} // pixels properly sized

function typeset(math, callback) {
  mjAPI.typeset({
    math: math,
    format: "NoDelims",
    svg: true, dpi: options.dpi,
    ex: options.ex, width: options.width,
    linebreaks: options.linebreaks
  }, callback);
}

// Make sure we are fully initialized:
typeset('$x$', onReady);

function onReady()
{
  var end = process.hrtime(start);
  start = process.hrtime();
  console.info("Initialization time: %dms", end[0] * 1000 + end[1] / 1000000);

  var max = 5;
  var done = 0;
  var total = 0;

  for (i = 0; i < max; i++) {
    typeset("$ 9087aweufiohasoiæfuas9udf09asudf09asjdf9åausdf90jas9dfj09asjdf09sjfoiasjdfklsjdflkæsjdlfækjsdlkfjlskdf $", onDone);

    function onDone() {
      done++;
      var end = process.hrtime(start);
      start = process.hrtime();
      var ms = Math.round(end[0] * 1000 + end[1] / 1000000);
      total += ms;
      console.info("Rendered %d, this one took %dms, average so far %dms", done, ms, Math.round(total / done));

      //if (done==max) process.exit()
    }
  }
}