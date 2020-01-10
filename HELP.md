# mamsc
*MIDI Schow Control over Ethernet for MA lighting*

This is an implementation of the MIDI Show Control protocol used by MA lighting.
While initially developed for the dot2 lineup it also works for grandMA with some slight differences which are documented below.

## Console/onPC configuration
You are required to set the MIDI Show Control mode to `Ethernet`, exec to `Exec.Page` and the command format to `All`.
The rest of the configuration depends on your needs.
In and out ports need to be between `6000` and `6100` as per the MA documentation and shouldn't be the same to prevent loops.
MIDI channels are ignored when mode is set to `Ethernet`.

## Companion configuration
| Option | Description |
| --- | --- |
| Transmitter Address | Destination IP address.<br>Defaults to the brodcast address `255.255.255.255`. |
| Transmitter Port | Destination port (needs to be between `6000` and `6100`).<br>This should be the same as the one set under `MSC In ⇒ Ethernet Port` on the console. |
| Transmitter Device ID | Set this to a value between `0` and `111` to restrict messages to a device and set Send To to `Device` |
| Transmitter Group ID | Set this to a value between `1` and `15` to restrict messages to a group and set Send To to `Group` |
| Transmitter Send To | If you want to restrict who should react on messages send you can set this to<br> either `Device` and set the Device ID or `Group` and set the Group ID accordingly.<br>By default it is set to `All` so everyone will react on messages. |
| Receiver Address | Address to listen for incoming messages on.<br>Defaults to the all interface address `0.0.0.0`. |
| Receiver Port | Port to listen for incoming messages on (needs to be between `6000` and `6100`).<br>This should be the same as the one set under `MSC Out ⇒ Ethernet Port` |
| Receiver Device ID | Set this to a value between `0` and `111` to only listen for messages received for this Device ID.<br>We'll still react on messages send to everyone. |
| Receiver Group ID | Set this to a value between `1` and `15` to only listen for messages received for this Group ID.<br>We'll still react on messages send to everyone. |
| Receiver Enabled | Check this to enable the Receiver.<br>Keep it disabled if you just want to execute actions but don't need feedback or dynamic variables. |
| Receiver Executor List | This is a list of executors in the format: `exec[.page]`, comma separated.<br>It's used to create dynamic variables containing the fader position of the listed executors. |

## Limitations
Generally executor numbers can be between `0` and `127`. This is a protocol limitation.
If you don't define an executor then the main executor is assumed on a dot2 or the first executor on a grandMA which makes executor numbering for the grandMA zero based.  
By default page `1` is assumed for all executors. The dot2 only supports control of page `1` via MSC while the grandMA does support different pages.  
Some actions support an optional fade time in seconds which can be between `0` and `3600`.  
Macro numbers can be between `1` and `255`.  
Be aware that feedbacks are dependent on MSC messages comming from the console and that fader positions or executor states are only known once they've been received.

## Actions
| Action | Parameters |
| --- | --- |
| Goto a specific cue | Cue Number, [Executor Number], [Page Number], [Fade Time] |
| Pause an executor | [Executor Number], [Page Number] |
| Resume an executor | [Executor Number], [Page Number] |
| Move a fader to a specific position | Percent, [Executor Number], [Page Number], [Fade Time] |
| Fire a macro | Macro Number |
| Switch an executor off | [Executor Number], [Page Number] |

## Feedbacks
| Feedback | Parameters |
| --- | --- |
| Executor running state feedback | Executor Number, [Page Number], Active, Foreground Color, Background Color |
| Executor paused state feedback | Executor Number, [Page Number], Paused, Foreground Color, Background Color |
| Cue list feedback | Cue Number, Executor Number, [Page Number], Foreground Color, Background Color |
| Fader position feedback | Percent, Operator, Executor Number, [Page Number], Foreground Color, Background Color |

* * *

&copy; 2020 Christian Volmering &lt;christian@volmering.name&gt;
