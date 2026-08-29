### Sail Race Timer

A little timer app that tracks the countdown to the horn during your sailboat race start sequence.  

#### At idle

The screen shows the expected amount of time that the race committee has given you for the start sequence.  Button 3 cycles between 
- 5 minutes (standard start sequence)
- 6 minutes (standard, plus extra warning minute)
- 4 minutes (oops, forgot to start at 5 minutes)

Button 1 starts the countdown.

#### During countdown 

The seconds count down to zero.  This activity is delegated to a widget so that it keeps running if you need to background the app for a bit.  
Five short buzzes mark each minute signal, with a beep over each of the final three seconds before it.  

Button 1: pause countdown
Button 3 (short press): round to nearest minute.  This allows you to correct the countdown at the signals if you were a little early or late when you started.  

#### While paused 

Button 1: resume countdown
Button 3 (short press): reset timer, go idle

#### At zero 

A long buzz is issued, and the timer remains at zero.

Button 3 (short press): reset timer, go idle

#### At Any Time

Button 2 (short press): return to the clock
Button 3 (long press): open the app launcher
