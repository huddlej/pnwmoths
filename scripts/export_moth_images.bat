@echo off
REM Converts each TIFF file in the moth images directory into a JPEG
REM that is 800 pixels wide. Ignores files that have already been converted.
set /p destination= In which directory should processed images be placed? 
cd "C:\Images\Moths\"
for /D %%i in (*) do for %%j in ("%%i/Final/*-?-?.tif") do if not exist "%destination%\%%~nj.jpg" "C:\Program Files (x86)\ImageMagick\convert.exe" -quiet "%%i\Final\%%j" -resize 800 "%destination%\%%~nj.jpg"