// ==UserScript==
// @name         Wordle Solver!
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Solve todays wordle
// @author       Ryan Bucinell
// @match        https://www.powerlanguage.co.uk/wordle/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=powerlanguage.co.uk
// @grant        none
// ==/UserScript==

class Solver {

    squares = {
        absent:  '⬛',
        present: '🟨',
        correct: '🟩'
    };

    constructor() {
        this.game     = document.querySelector("game-app").shadowRoot.querySelector("game-theme-manager > #game");
        this.board    = this.game.querySelector("#board-container #board");
        this.keyboard = this.game.querySelector('game-keyboard').shadowRoot.querySelector('#keyboard');
        this.list = [];
        this.guesses = [];
        this.resetList();
        this.insertSolveButton();
    }

    async resetList()
    {
        let l = await (async ()=> fetch('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/5d752e5f0702da315298a6bb5a771586d6ff445c/wordle-answers-alphabetical.txt').then(r=>r.text()))();
        this.list = l.split('\n');
    };

    insertSolveButton() {
        if( this.game.querySelector('#solver') === null)
        {
            const btnStr = `<button id="solver" class="toast" style=" width: 100%; height: 2rem;"> Solve it</button>`;
            let template = document.createElement('template');
            template.innerHTML = btnStr;
            let header = this.game.querySelector('header');
            template.content.firstChild.solver = this;
            template.content.firstChild.addEventListener('click', this.solve );
            header.parentNode.insertBefore(template.content.firstChild, header.nextSibling);
        }
    }

    evaluateTiles(tiles )
    {
        tiles.forEach( (tile,index) =>
        {
            if( tile.evaluation === 'correct' )
            {
                //remove any word that doesn't have the character at that location
                this.list = this.list.filter( word => word.charAt(index) === tile.letter );
            }
            else if( tile.evaluation === 'absent')
            {
                let guess = tiles.map( t => t.letter).join('');
                let letterCountInGuess = guess.split(tile.letter).length -1;
                if( letterCountInGuess === 1)
                {
                    //simple case where guess only contains 1 instance of letter, remove from list if a word contains that letter.
                    this.list = this.list.filter( word => !word.includes( tile.letter ));
                }
                else
                {
                    this.list = this.list.filter( word => Object.entries(word.split('').reduce((prev, curr) => prev + curr === tile.letter)) < letterCountInGuess);
                }
            }
            else if( tile.evaluation === 'present')
            {
                this.list = this.list.filter( word => word.includes(tile.letter) && word.charAt(index) !== tile.letter);
            }
        });
    }

    getNextGuess( list )
    {
        let guess =  this.guess_preffered_start_naive( list );
        this.guesses.push( guess );
        return guess;
    }

    guess_naive( list )
    {
        //Pick a random word
        return list[ Math.floor(Math.random()* list.length)];
    }

    guess_preffered_start_naive( list )
    {
        const prefferedStartingWords = ['slate', 'sauce', 'adieu', 'rotate', 'slice', 'crane', 'raise', 'soare'];
        return this.guesses.length === 0 ? prefferedStartingWords[Math.floor(Math.random()*prefferedStartingWords.length)] : this.guess_naive( list );
    }

    async wait( milliseconds )
    {
        await new Promise(r => setTimeout(r, milliseconds ));
    }

    tryWord( guess, word )
    {
        let result = {
            guess: guess,
            hints: []
        }
        for( let i = 0; i < guess.length; i++ )
        {
            if( guess[i] === word[i] ){
                result.hints.push( this.squares.correct);
                continue;
            }
            if( !word.includes(guess[i]) )
            {
                result.hints.push(this.squares.absent)
            }
            else
            result.hints.push( this.squares.present);

        }
        return result;
    }

    test( word )
    {
        let remaining = JSON.parse(JSON.stringify(this.list));
        console.log( remaining);
        for( let g = 1; g <= 6; g++ )
        {
            let guess = this.getNextGuess( remaining );
            let result = this.tryWord( guess, word );
            console.log( guess, result );
        }

    }

    async solve()
    {
        let solver = this.solver;
        for( let guessCount = 1; guessCount <= 6; guessCount++ )
        {
            //get the tiles for the current guess we are on
            let row = solver.board.querySelector(`game-row:nth-child(${guessCount})`).shadowRoot;
            let tiles = [...row.querySelectorAll(".row game-tile")].map( tile => {
                return {
                    'tile': tile,
                    letter: tile.getAttribute('letter'),
                    evaluation: tile.getAttribute('evaluation')
            }});

            let isNewGuess = false;
            try{
                isNewGuess = row.querySelector('.row game-tile').shadowRoot.querySelector('.tile').getAttribute('data-state') === 'empty';
            }catch(e)
            {
                isNewGuess = false;
            }
            let guess = '';
            //determine if this is an existing guess or not
            if( !isNewGuess )
            {
                guess = tiles.map( t => t.letter).join('');
                console.log( `Existing guess found ${guess}`);
            }
            else
            {
                guess = solver.getNextGuess( solver.list );
                //Type in Guess
                guess.split('').forEach( l => solver.keyboard.querySelector(`button[data-key="${l}"]`).click() );
                //Hit Submit
                solver.keyboard.querySelector('button[data-key="↵"]').click(); //enter
                //Animation on tiles
                await solver.wait( 2000 );
            }

            //Update tiles with evaluation
            tiles = [...row.querySelectorAll(".row game-tile")].map( tile => {
                return {
                    'tile': tile,
                    letter: tile.getAttribute('letter'),
                    evaluation: tile.getAttribute('evaluation')
            }});

            if( tiles.every( t => t.evaluation === 'correct') )
            {
                console.log( 'Solved the puzzle!');
                break;
            }
            //Evaluate current guess
            solver.evaluateTiles(tiles);
        }
    }
};
//Check Answer
let solver;
(function() {
    'use strict';
    solver = new Solver();
})();