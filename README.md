# PDF Slideshow([live webpage](https://iftakharpy.github.io/pdf-slideshow/))

This repository implements the MVP to play PDF pages in loop with custom interval.

## Keyboard shortcuts

-   `KeyH` - Show/Hide shortcut keys
-   `KeyO` - Open file dialogue to choose pdf file
-   `ArrowUp` - Increase page change interval by 100ms and start slideshow
-   `ArrowDown` - Decrease page change interval by 100ms and start slideshow
-   `ArrowLeft` - Show previous page
-   `ArrowRight` - Show next page
-   `KeyR` - Reload current page
-   `Space` - Start/Stop slideshow
-   `KeyF` or `F11` - Toggle full screen mode
-   `KeyO` - Open file dialogue to select PDF file
-   `KeyH` - Show/Hide keyboard shortcuts
-   `KeyT` - Toggle dark/light theme


## Why?
Before the open doors day of `WIMMA LAB 2023`, a member of the team `Overflow` created two PowerPoint files with two different themes for our projects. The purpose of the slides was to present during our team and project introduction and also to play these in the background in loop in our room for visitors to see. When she tried to merge the slides from two different files into a single PowerPoint file Microsoft PowerPoint was messing up the themes of the slides. We could not find a way to merge all the PowerPoint slides keeping the original designs of the two PowerPoint files. To address this issue we had the idea to convert the slides into pdf files and then merge those pdf files. But then the problem was, we could not find a tool to play pdf pages in loop. And that's why I created this simple project.

> Note: It uses [PDF.js](https://github.com/mozilla/pdf.js) to render pages.
