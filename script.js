const boardSize = 5;
let board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
let currentPlayer = 'A';
let moveHistory = { A: [], B: [] };
let selectedCell = null;
let gameCompleted = false; // Track if the game has ended

function initBoard() {
    board[0] = ['A-P1', 'A-H1', 'A-H2', 'A-P1', 'A-H1'];
    board[4] = ['B-P1', 'B-H1', 'B-H2', 'B-P1', 'B-H1'];
    renderBoard();
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            cellElement.innerText = cell || '';
            cellElement.onclick = () => handleCellClick(rowIndex, colIndex);
            boardElement.appendChild(cellElement);
        });
    });

    if (gameCompleted) {
        document.getElementById('status').innerText = `Player ${currentPlayer === 'A' ? 'A' : 'B'} wins!`;
    } else {
        document.getElementById('status').innerText = `Current Player: ${currentPlayer}`;
    }

    updateMoveHistory();
}

function handleCellClick(row, col) {
    if (gameCompleted) return; // Prevent further moves if the game is complete

    const cell = document.querySelector(`#board .cell:nth-child(${row * boardSize + col + 1})`);

    if (selectedCell) {
        const [selectedRow, selectedCol] = selectedCell;
        const piece = board[selectedRow][selectedCol];

        if (piece && piece.startsWith(currentPlayer)) {
            const moveResult = validateMove(selectedRow, selectedCol, row, col, piece);

            if (moveResult.valid) {
                const captures = executeMove(selectedRow, selectedCol, row, col, piece);
                moveHistory[currentPlayer].push({ from: [selectedRow, selectedCol], to: [row, col], piece, captures });

                if (checkWinCondition()) {
                    gameCompleted = true; // Mark game as completed
                } else {
                    currentPlayer = currentPlayer === 'A' ? 'B' : 'A'; // Switch players after valid move
                }

                renderBoard();
            } else {
                document.getElementById('status').innerText = moveResult.message;
            }
        }
        selectedCell = null; // Reset selected cell after a move attempt
    } else if (board[row][col] && board[row][col].startsWith(currentPlayer)) {
        selectedCell = [row, col];
        cell.classList.add('selected'); // Highlight selected cell
        document.getElementById('status').innerText = 'Piece selected. Click on a destination to move.';
    } else {
        document.getElementById('status').innerText = 'Select a valid piece.';
    }
}

function validateMove(fromRow, fromCol, toRow, toCol, piece) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    const pieceType = piece.split('-')[1];

    if (pieceType === 'P1') {
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            return isValidPosition(toRow, toCol, piece) ? { valid: true } : { valid: false, message: 'Invalid move.' };
        }
    } else if (pieceType === 'H1') {
        if ((rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2)) {
            return isValidPosition(toRow, toCol, piece) ? { valid: true } : { valid: false, message: 'Invalid move.' };
        }
    } else if (pieceType === 'H2') {
        if (rowDiff === 2 && colDiff === 2) {
            return isValidPosition(toRow, toCol, piece) ? { valid: true } : { valid: false, message: 'Invalid move.' };
        }
    }

    return { valid: false, message: 'Invalid move.' };
}

function isValidPosition(row, col, piece) {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize &&
           (board[row][col] === null || !board[row][col].startsWith(piece[0]));
}

function executeMove(fromRow, fromCol, toRow, toCol, piece) {
    const opponent = currentPlayer === 'A' ? 'B' : 'A';
    const captures = [];

    // Determine the movement type and capture pieces accordingly
    if (fromRow === toRow) { // Horizontal move
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (board[fromRow][col] && board[fromRow][col].startsWith(opponent)) {
                captures.push({ row: fromRow, col, piece: board[fromRow][col] }); // Capture opponent piece
                board[fromRow][col] = null;
            }
        }
    } else if (fromCol === toCol) { // Vertical move
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (board[row][fromCol] && board[row][fromCol].startsWith(opponent)) {
                captures.push({ row, col: fromCol, piece: board[row][fromCol] }); // Capture opponent piece
                board[row][fromCol] = null;
            }
        }
    } else if (Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) { // Diagonal move
        const rowIncrement = toRow > fromRow ? 1 : -1;
        const colIncrement = toCol > fromCol ? 1 : -1;
        let row = fromRow + rowIncrement;
        let col = fromCol + colIncrement;
        while (row !== toRow && col !== toCol) {
            if (board[row][col] && board[row][col].startsWith(opponent)) {
                captures.push({ row, col, piece: board[row][col] }); // Capture opponent piece
                board[row][col] = null;
            }
            row += rowIncrement;
            col += colIncrement;
        }
    }

    // Move the piece to the new position
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;

    return captures; // Return the list of captured pieces
}

function checkWinCondition() {
    const opponentPieces = board.flat().filter(cell => cell && cell.startsWith(currentPlayer === 'A' ? 'B' : 'A'));
    return opponentPieces.length === 0;
}

function updateMoveHistory() {
    const moveHistoryTable = document.getElementById('moveHistoryTable');
    moveHistoryTable.innerHTML = '';

    const maxMoves = Math.max(moveHistory.A.length, moveHistory.B.length);

    for (let i = 0; i < maxMoves; i++) {
        const row = document.createElement('tr');
        const cellA = document.createElement('td');
        const cellB = document.createElement('td');

        // Player A's move
        if (moveHistory.A[i]) {
            const { from, to, piece, captures } = moveHistory.A[i];
            const captureInfo = captures.length > 0 ? `, captures: ${captures.map(c => `${c.piece} at ${c.row},${c.col}`).join(', ')}` : '';
            cellA.innerText = `${piece} from ${from[0]},${from[1]} to ${to[0]},${to[1]}${captureInfo}`;
        } else {
            cellA.innerText = '';
        }

        // Player B's move
        if (moveHistory.B[i]) {
            const { from, to, piece, captures } = moveHistory.B[i];
            const captureInfo = captures.length > 0 ? `, captures: ${captures.map(c => `${c.piece} at ${c.row},${c.col}`).join(', ')}` : '';
            cellB.innerText = `${piece} from ${from[0]},${from[1]} to ${to[0]},${to[1]}${captureInfo}`;
        } else {
            cellB.innerText = '';
        }

        row.appendChild(cellA);
        row.appendChild(cellB);
        moveHistoryTable.appendChild(row);
    }
}

document.getElementById('resetButton').addEventListener('click', () => {
    board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    moveHistory = { A: [], B: [] };
    currentPlayer = 'A';
    selectedCell = null;
    gameCompleted = false; // Reset game status
    initBoard();
    document.getElementById('status').innerText = 'Game reset. Waiting for moves...';
});

// Initialize the game
initBoard();
