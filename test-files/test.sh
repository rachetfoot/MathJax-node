#!/usr/bin/env bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
pushd "$DIR/../lib"
curDir=../test-files
java -cp "$curDir/js.jar" org.mozilla.javascript.tools.shell.Main ../test-files/test.js > "$curDir/svg.html"
diff "$curDir/svg.html" "$curDir/svg_.html"
popd