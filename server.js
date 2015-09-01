#!/usr/bin/env node

var threadCount = process.env.MATHJAXTHREADCOUNT || 1;

function mathjaxThread(id) {
  console.log('Starting MathJax server (thread '+id+')');
  var jackrabbit = require('jackrabbit');
  var messageServer = process.env.CLOUDAMQP_URL || 'amqp://localhost';
  var queue = jackrabbit(messageServer);

  var mjAPI = require("./lib/mj-single.js").create(0);

  var options = {
    linebreaks: true,
    dpi: 0,
    font: "STIX",
    ex: 8,
    width: 130,
    extensions: "color.js"
  };

  if (options.font === "STIX") options.font = "STIX-Web";
  mjAPI.config({MathJax: {SVG: {font: options.font, blacker: 0}}, extensions: options.extensions});
  mjAPI.start();

  if (options.dpi === 0) {
    options.dpi = options.ex * 16
  } // pixels properly sized

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
  typeset('$x$', function (data) {
    console.log('Done initializing MathJax (thread '+id+')');
  });

  queue.on('connected', function () {
    queue.create('jobs.generatesvg', {prefetch: 0, messageTtl: 1000}, onReady);

    function onReady() {
      queue.handle('jobs.generatesvg', onJob);
      console.log('Connected to messaging server and ready for jobs (thread '+id+')');
    }

    function onJob(job, ack) {
      console.log('Received MathJax job (thread '+id+'): ' + job.math);
      var start = process.hrtime();

      function onTypeset(data) {
        if (!data.errors) {
          ack({svg: data.svg})
        } else {
          ack({error: data.errors.join(', ')});
        }
        var end = process.hrtime(start);
        console.info("Processed MathJax job in %dms (thread "+id+")", Math.round(end[0] * 1000 + end[1] / 1000000));
      }

      typeset(job.math, onTypeset);
    }
  });
}

for (i = 0; i < threadCount; i++) {
  mathjaxThread(i+1);
}