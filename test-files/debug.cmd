pushd "%~dp0..\lib"
java -cp ..\test-files\js.jar org.mozilla.javascript.tools.debugger.Main ..\test-files\test.js
popd