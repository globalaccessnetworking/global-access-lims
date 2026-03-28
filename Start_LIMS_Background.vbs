Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run chr(34) & "D:\Bacteriophage_LIMS\background_service.bat" & Chr(34), 0
Set WshShell = Nothing
MsgBox "LIMS Background Service has started." & vbCrLf & "You can verify at http://localhost:5173", 64, "Bacteriophage LIMS"
