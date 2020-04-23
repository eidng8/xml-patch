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
git commit -m "Release %VERSION%" || goto ERR
git tag --sign --file=RELEASE.md "Release-v%VERSION%"
rem Make sure the tag is pushed after the branch so Travis won't miss it
rem even when auto cancel build is enabled
git push || goto ERR
git push --tags || goto ERR

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
cd "%CWD%"
