#!/usr/bin/env bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
pushd "$DIR/../lib"
java -cp "../test-files/js.jar" org.mozilla.javascript.tools.debugger.Main ../test-files/test.js
popd