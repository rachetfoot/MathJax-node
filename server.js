var jackrabbit = require('jackrabbit');
var messageServer = process.env.RABBITMQ_BIGWIG_TX_URL || 'amqp://localhost';
var queue = jackrabbit(messageServer);

var mjAPI = require("./lib/mj-single.js");

var options = {
  linebreaks: true,
  dpi: 0,
  font: "STIX",
  ex: 8,
  width: 100,
  extensions: "color.js"
};

if (options.font === "STIX") options.font = "STIX-Web";
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
typeset('$x$', function() {});

queue.on('connected', function() {
  queue.create('jobs.generatesvg', { prefetch: 0, messageTtl: 1000}, onReady);

  function onReady() {
    queue.handle('jobs.generatesvg', onJob);
    console.log('Ready for jobs');
  }

  function onJob(job, ack) {
    console.log('Received job: ' + job.math);

    function onTypeset(data) {
      if (!data.errors) {
        ack({svg: data.svg})
      } else {
        ack({error: data.errors.join(', ')});
      }
    }

    typeset(job.math, onTypeset);
  }
});