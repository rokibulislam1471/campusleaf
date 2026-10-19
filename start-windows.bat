@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
    start "" "http://localhost:8000"
    py -m http.server 8000
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        start "" "http://localhost:8000"
        python -m http.server 8000
    ) else (
        echo Python is not installed. Install Python from https://www.python.org/downloads/
        echo Then run this file again.
        pause
    )
)
