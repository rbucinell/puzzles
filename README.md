# WORDLE Solver
Just a simple solver for wordle. The js file is a user script that can be run on page load. It will insert a solve button after the header.
![Screenshot of the button](screenshot.jpg "The solve button")

### Determining Guesses
This will be an iterative approach in future updates. Currently the solver is dumb and will just pick a random word from the remaining viable choices, this logic is donoted by `guess_naive()` in the `getNextGuess()` function.

1. First step is to create a test function to automate evaluation of a a solver on some given word 
2. explore different components to algorithm to determine 
    1. the frequency of characters in the english language
    2. most common words.
    3. distinct character sets from previous guesses