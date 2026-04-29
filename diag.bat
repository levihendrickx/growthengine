@echo off
REM ============================================================
REM OmegaClaw / PeTTa - Diagnostic
REM ------------------------------------------------------------
REM Prints the SWI-Prolog version and lists the predicates the
REM `janus` library actually exports on this machine, so we can
REM confirm whether py_call/3 is present.
REM ============================================================

setlocal enableextensions

echo === Where is swipl? ===
where swipl
echo.

echo === SWI-Prolog version ===
swipl --version
echo.

echo === Where is python? ===
where python
echo.
python --version
echo.

echo === Listing janus library exports (looking for py_call/3) ===
swipl -q -g "use_module(library(janus)), forall(predicate_property(janus:Head, exported), (functor(Head,Name,Arity), format('janus:~w/~w~n',[Name,Arity]))), halt." -t "halt"
echo.

echo === Searching for stray janus.pl files on D: ===
where /R D:\ janus.pl 2>nul
echo.

echo === Done ===
endlocal
