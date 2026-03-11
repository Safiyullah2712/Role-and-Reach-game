const GRID_SIZE = 10;
const TOTAL_CELLS = 100;

const LADDERS = {
    2: 57,
    7: 34,

    28: 84,
    72: 91,
    85: 98
};

const SNAKES = {
    25: 4,
    43: 12,
    74: 53,
    61: 19,
    97: 13
};

let players = [];
let turn = 0;
let isRolling = false;
let gameOver = false;

window.onload = () => {
    setupWelcomePage();
};

function setupWelcomePage() {
    const numPlayersSelect = document.getElementById('numPlayers');
    const playerInputsDiv = document.getElementById('playerInputs');

    numPlayersSelect.addEventListener('change', (e) => {
        const num = parseInt(e.target.value);
        playerInputsDiv.innerHTML = '';
        for (let i = 1; i <= num; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `player${i}Input`;
            input.placeholder = `Enter Player ${i} name`;
            input.maxLength = 15;
            playerInputsDiv.appendChild(input);
        }
    });

    document.getElementById('startBtn').addEventListener('click', () => {
        const num = parseInt(numPlayersSelect.value);
        players = [];
        for (let i = 1; i <= num; i++) {
            const inputEl = document.getElementById(`player${i}Input`);
            const nameInput = inputEl ? inputEl.value.trim() : '';
            const playerName = nameInput || `Player ${i}`;
            players.push({ id: i, name: playerName, pos: 0, started: false, history: [] });
        }

        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';

        startGame();
    });
}

function startGame() {
    createBoard();
    const leftSide = document.getElementById('leftSide');
    const rightSide = document.getElementById('rightSide');
    leftSide.innerHTML = '';
    rightSide.innerHTML = '';

    players.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = `player-card p${p.id}-card`;
        card.id = `p${p.id}-card`;
        card.innerHTML = `
            <div class="player-header">
                <span class="player-name">${p.name}</span>
            </div>
            <div class="history-container">
                <button class="history-toggle-btn" id="p${p.id}-history-btn">MOVE HISTORY</button>
                <div id="p${p.id}-history" class="history-list"></div>
            </div>
        `;

        const historyBtn = card.querySelector(`#p${p.id}-history-btn`);
        const historyList = card.querySelector(`#p${p.id}-history`);
        historyBtn.addEventListener('click', () => {
            historyList.classList.toggle('visible');
            historyBtn.innerText = historyList.classList.contains('visible') ? 'HIDE HISTORY' : 'MOVE HISTORY';
        });

        if (index % 2 === 0) {
            leftSide.appendChild(card);
        } else {
            rightSide.appendChild(card);
        }
    });

    updateUI();

    const restartBtn = document.getElementById('restartBtn');
    const diceContainer = document.getElementById('diceContainer');

    restartBtn.replaceWith(restartBtn.cloneNode(true));
    diceContainer.replaceWith(diceContainer.cloneNode(true));

    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('diceContainer').addEventListener('click', () => {
        if (!isRolling && !gameOver) rollDice();
    });
    setupModalListeners();
}

function restartGame() {
    if (!gameOver) {
        const confirmed = confirm("Are you sure you want to restart the game?");
        if (!confirmed) return;
    }

    players.forEach(p => {
        p.pos = 0;
        p.started = false;
        p.history = [];
        const historyEl = document.getElementById(`p${p.id}-history`);
        if (historyEl) historyEl.innerHTML = '';
    });
    turn = 0;
    gameOver = false;
    isRolling = false;
    document.getElementById('diceImage').src = 'images/one.png';
    updateUI();
}

function setupModalListeners() {
    const modal = document.getElementById('victoryModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const restartBtn = document.getElementById('modalRestartBtn');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    restartBtn.onclick = () => {
        modal.style.display = 'none';
        restartGame();
    };
}

function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    for (let row = 9; row >= 0; row--) {
        let rowCells = [];
        for (let col = 0; col < 10; col++) {
            if (row % 2 === 0) rowCells.push((row * 10) + col + 1);
            else rowCells.push((row * 10) + (10 - col));
        }
        rowCells.forEach(num => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = 'cell-' + num;
            cell.innerText = num;

            if (LADDERS[num] || SNAKES[num]) {
                const dest = LADDERS[num] || SNAKES[num];
                const destSpan = document.createElement('span');
                destSpan.className = 'dest-num';
                destSpan.innerText = dest;
                cell.appendChild(destSpan);

                if (LADDERS[num]) cell.classList.add('ladder');
                if (SNAKES[num]) cell.classList.add('snake');
            }
            board.appendChild(cell);
        });
    }
}

function updateUI() {
    const diceContainer = document.getElementById('diceContainer');
    diceContainer.classList.remove('p0-turn', 'p1-turn', 'p2-turn', 'p3-turn');

    if (gameOver) {
        diceContainer.style.display = 'none';
    } else {
        diceContainer.style.display = 'flex';
        diceContainer.classList.add(`p${turn}-turn`);
        const currPlayer = players[turn];
        const activeHeader = document.querySelector(`#p${currPlayer.id}-card .player-header`);
        if (activeHeader) {
            const nameEl = activeHeader.querySelector('.player-name');
            nameEl.after(diceContainer);
        }
    }

    players.forEach((p, index) => {
        document.getElementById(`p${p.id}-card`).classList.toggle('active', turn === index);
    });

    document.querySelectorAll('.token').forEach(t => t.remove());

    players.forEach(p => {
        if (p.pos > 0) {
            const cell = document.getElementById('cell-' + p.pos);
            const token = document.createElement('div');
            token.className = 'token p' + p.id;
            cell.appendChild(token);
        }
    });

    if (!gameOver) {
        const currPlayer = players[turn];
        let statusText = "";
        if (!currPlayer.started) statusText = "Need a 1 to start!";
        document.getElementById('status').innerText = statusText;
    }
}

async function rollDice() {
    if (gameOver || isRolling) return;

    isRolling = true;
    const diceContainer = document.getElementById('diceContainer');
    const diceImage = document.getElementById('diceImage');

    diceContainer.classList.add('disabled');
    diceImage.classList.add('rolling');

    const diceIcons = ['one.png', 'two.png', 'three.png', 'four.png', 'five.png', 'six.png'];

    for (let i = 0; i < 10; i++) {
        const tempIndex = Math.floor(Math.random() * 6);
        diceImage.src = `images/${diceIcons[tempIndex]}`;
        await new Promise(resolve => setTimeout(resolve, 60));
    }

    const currPlayer = players[turn];
    const roll = Math.floor(Math.random() * 6) + 1;

    currPlayer.history.push(roll);
    const historyEl = document.getElementById(`p${currPlayer.id}-history`);
    const historyItem = document.createElement('img');
    historyItem.className = 'history-dice';
    historyItem.src = `images/${diceIcons[roll - 1]}`;
    historyItem.alt = roll;
    historyEl.appendChild(historyItem);
    historyEl.scrollTop = historyEl.scrollHeight;

    diceImage.src = `images/${diceIcons[roll - 1]}`;
    diceImage.classList.remove('rolling');

    let extraTurn = false;

    if (!currPlayer.started) {
        if (roll === 1) {
            currPlayer.started = true;
            currPlayer.pos = 1;
        }
    } else {
        const nextPos = currPlayer.pos + roll;
        if (nextPos <= TOTAL_CELLS) {
            currPlayer.pos = nextPos;
            if (LADDERS[currPlayer.pos]) {
                const startPos = currPlayer.pos;
                currPlayer.pos = LADDERS[startPos];
                document.getElementById('status').innerText = `${currPlayer.name} climbed a ladder from ${startPos} to ${currPlayer.pos}!`;
            } else if (SNAKES[currPlayer.pos]) {
                const startPos = currPlayer.pos;
                currPlayer.pos = SNAKES[startPos];
                document.getElementById('status').innerText = `${currPlayer.name} was bitten by a snake at ${startPos} and fell to ${currPlayer.pos}!`;
            }

            if (currPlayer.pos === TOTAL_CELLS) {
                gameOver = true;
                isRolling = false;
                updateUI();

                const modal = document.getElementById('victoryModal');
                document.getElementById('victoryMessage').innerText = currPlayer.name + " Wins!";
                modal.style.display = 'flex';

                document.getElementById('status').innerText = "The game ended! \n Click Restart to play again.";
                return;
            }
        }
    }

    if (roll === 6 && !gameOver) {
        extraTurn = true;
    }

    if (!extraTurn && !gameOver) {
        turn = (turn + 1) % players.length;
    }

    updateUI();

    if (!gameOver) {
        isRolling = false;
        document.getElementById('diceContainer').classList.remove('disabled');
    }
}
