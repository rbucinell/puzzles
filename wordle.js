// ==UserScript==
// @name         Wordle Solver
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Solve todays wordle
// @author       Ryan Bucinell
// @match        https://www.powerlanguage.co.uk/wordle/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=powerlanguage.co.uk
// @grant        none
// ==/UserScript==
let list = [];

//Check Answer
let game     = document.querySelector("game-app").shadowRoot.querySelector("game-theme-manager > #game");
let board    = game.querySelector("#board-container #board");
let keyboard = game.querySelector('game-keyboard').shadowRoot.querySelector('#keyboard');

function evaluateTiles(tiles )
{
    tiles.forEach( (tile,index) =>
    {
        if( tile.evaluation === 'correct' )
		{
			//remove any word that doesn't have the character at that location
			list = list.filter( word => word.charAt(index) === tile.letter );
		}
		else if( tile.evaluation === 'absent')
		{
            let guess = tiles.map( t => t.letter).join('');
			let letterCountInGuess = guess.split(tile.letter).length -1;
			if( letterCountInGuess === 1)
			{
				//simple case where guess only contains 1 instance of letter, remove from list if a word contains that letter.
				list = list.filter( word => !word.includes( tile.letter ));
			}
			else
            {
                list = list.filter( word => Object.entries(word.split('').reduce((prev, curr) => prev + curr === tile.letter)) < letterCountInGuess);
			}
        }
		else if( tile.evaluation === 'present')
		{
            list = list.filter( word => word.includes(tile.letter) && word.charAt(index) !== tile.letter);
		}
	});
}

function getNextGuess()
{
    return guess_naive();
}

function guess_naive()
{
    //Pick a random word
    let randomIndex = Math.floor(Math.random()*list.length);
    return list[ randomIndex ];
}

async function resetList()
{
    list = await (async ()=> fetch('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/5d752e5f0702da315298a6bb5a771586d6ff445c/wordle-answers-alphabetical.txt').then(r=>r.text()))();
    list = list.split('\n');
}

async function wait( milliseconds )
{
    await new Promise(r => setTimeout(r, milliseconds ));
}

async function main()
{
    await resetList();
    for( let guessCount = 1; guessCount <= 6; guessCount++ )
    {
        //get the tiles for the current guess we are on
        let row = board.querySelector(`game-row:nth-child(${guessCount})`).shadowRoot;
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
            guess = getNextGuess();
            //Type in Guess
            guess.split('').forEach( l => keyboard.querySelector(`button[data-key="${l}"]`).click() );
            //Hit Submit
            keyboard.querySelector('button[data-key="↵"]').click(); //enter
            //Animation on tiles
            await wait( 2000 );
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
        evaluateTiles(tiles);
    }
}
(function() {
    'use strict';
    main();
})();