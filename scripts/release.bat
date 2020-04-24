@ECHO OFF
SETLOCAL EnableDelayedExpansion

set CWD=%cd%

cd /d "%~dp0"
cd ..

if exist release rd /s /q release
mkdir release
cd release
git clone --branch master "https://github.com/eidng8/xml-patch.git"
cd xml-patch
git config user.email "cheung.jackey@gmail.com"
git config user.name eidng8

set RELEASE=%1
if "%RELEASE%"=="" set RELEASE=patch
call npm --no-git-tag-version version "%RELEASE%" || goto ERR

bash.exe -lc github_changelog_generator || goto ERR
for /f "tokens=*" %%v in ('node scripts\make-release-note.js') do set VERSION=%%v

git add . || goto ERR
git commit --no-verify -m "Release %VERSION%" || goto ERR
git push --no-verify || goto ERR
git tag --sign -m "%date%" "Release-v%VERSION%"
git push --no-verify --tags || goto ERR

git checkout dev
git merge master
git push --no-verify


goto END


:ERR
echo Error occurred!
cd ..\..
rd /s /q release
cd "%CWD%"
pause
exit 1

:END
cd ..\..
rd /s /q release
git pull
cd "%CWD%"
