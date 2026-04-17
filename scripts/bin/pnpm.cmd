@echo off
setlocal

if not defined AIGCFOX_NODE_EXE (
  echo AIGCFOX_NODE_EXE is not defined.
  exit /b 1
)

if not defined AIGCFOX_PNPM_SCRIPT (
  echo AIGCFOX_PNPM_SCRIPT is not defined.
  exit /b 1
)

"%AIGCFOX_NODE_EXE%" "%AIGCFOX_PNPM_SCRIPT%" %*
