@echo off
pushd "%~dp0..\lib"
set curDir=..\test-files
java -cp %curDir%\js.jar org.mozilla.javascript.tools.shell.Main ..\test-files\test.js > %curDir%\svg.html
fc %curDir%\svg.html %curDir%\svg_.html
popd