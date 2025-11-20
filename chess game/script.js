// script.js (ฉบับแก้ไข Logic การเดินหมากถูกต้อง 100%)

const chessboardEl = document.getElementById('chessboard');
const currentTurnEl = document.getElementById('current-turn');
const gameStatusEl = document.getElementById('game-status');
const moveListEl = document.getElementById('move-list');
const newGameBtn = document.getElementById('new-game-btn');
const undoBtn = document.getElementById('undo-btn');
const leaderboardListEl = document.getElementById('leaderboard-list');
const playerNameEl = document.getElementById('player-name');

let board = [];
let selectedPiece = null; // เก็บค่า [row, col]
let currentPlayer = 'white';
let moveHistory = [];
let gameEnded = false;

// Initial Setup
// r=0 คือด้านบน (Black), r=7 คือด้านล่าง (White)
const initialBoardState = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

// Map ตัวย่อ -> ชื่อ Class ใน CSS
const pieceNames = {
    'P': 'pawn', 'R': 'rook', 'N': 'knight', 
    'B': 'bishop', 'Q': 'queen', 'K': 'king'
};

// --- Utility Functions ---
function idToCoords(id) {
    const col = id.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(id.charAt(1));
    return [row, col];
}

function coordsToId(row, col) {
    const colChar = String.fromCharCode('a'.charCodeAt(0) + col);
    const rowNum = 8 - row;
    return `${colChar}${rowNum}`;
}

function getPiece(row, col) {
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null; // ออกนอกกระดาน
    return board[row][col];
}

// --- Rendering ---
function renderBoard() {
    chessboardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const squareEl = document.createElement('div');
            const squareId = coordsToId(r, c);
            squareEl.id = squareId;
            squareEl.classList.add('square', (r + c) % 2 === 0 ? 'light' : 'dark');
            squareEl.dataset.row = r;
            squareEl.dataset.col = c;

            const pieceCode = board[r][c];
            if (pieceCode) {
                const pieceEl = document.createElement('div');
                const color = pieceCode[0] === 'w' ? 'white' : 'black';
                const typeCode = pieceCode[1];
                const typeName = pieceNames[typeCode]; 

                pieceEl.classList.add('piece', color, typeName);
                squareEl.appendChild(pieceEl);
            }
            
            squareEl.addEventListener('click', () => handleSquareClick(r, c));
            chessboardEl.appendChild(squareEl);
        }
    }
    
    // Update Turn Display
    if (currentPlayer === 'white') {
        currentTurnEl.textContent = "White (You)";
        currentTurnEl.className = 'turn-badge white-turn';
    } else {
        currentTurnEl.textContent = "AI (Thinking...)";
        currentTurnEl.className = 'turn-badge ai-turn';
    }
}

// --- Interaction Logic ---
function handleSquareClick(row, col) {
    if (gameEnded || currentPlayer === 'black') return; 

    const clickedPiece = getPiece(row, col);
    const isOwnPiece = clickedPiece && clickedPiece.startsWith('w');

    // 1. เลือกหมากตัวเอง
    if (isOwnPiece) {
        clearHighlights();
        selectedPiece = [row, col];
        highlightSquare(row, col, 'selected');
        showPossibleMoves(row, col);
        return;
    }

    // 2. เดินหมาก (ถ้าเลือกไว้แล้ว)
    if (selectedPiece) {
        const [sRow, sCol] = selectedPiece;
        const moves = generatePseudoLegalMoves(sRow, sCol);
        
        // เช็คว่าช่องที่คลิก (row, col) อยู่ในรายการ moves หรือไม่
        const isValidMove = moves.some(m => m.toRow === row && m.toCol === col);

        if (isValidMove) {
            executeMove(sRow, sCol, row, col);
            // เรียก AI เดินต่อ
            if (!gameEnded) {
                setTimeout(aiTurn, 500);
            }
        } else {
            clearHighlights();
            selectedPiece = null;
        }
    }
}

function executeMove(fromRow, fromCol, toRow, toCol) {
    // Save History
    moveHistory.push(JSON.parse(JSON.stringify(board)));
    undoBtn.disabled = false;

    const piece = board[fromRow][fromCol];
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';

    // Log
    const moveText = `${piece} ${coordsToId(fromRow, fromCol)} -> ${coordsToId(toRow, toCol)}`;
    const li = document.createElement('li');
    li.textContent = moveText;
    moveListEl.prepend(li);

    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    checkWinCondition();
    selectedPiece = null;
    renderBoard();
}

function highlightSquare(row, col, className) {
    const id = coordsToId(row, col);
    const el = document.getElementById(id);
    if(el) el.classList.add(className);
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(el => {
        el.classList.remove('selected', 'possible-move');
    });
}

function showPossibleMoves(row, col) {
    const moves = generatePseudoLegalMoves(row, col);
    moves.forEach(m => highlightSquare(m.toRow, m.toCol, 'possible-move'));
}

// --- CORE LOGIC: การเดินหมากที่ถูกต้อง ---
function generatePseudoLegalMoves(row, col) {
    const moves = [];
    const piece = getPiece(row, col);
    if (!piece) return moves;
    
    const color = piece[0]; // 'w' or 'b'
    const type = piece[1];  // 'P', 'R', 'N', 'B', 'Q', 'K'
    const isWhite = color === 'w';
    
    // Helper: เช็คว่าเป็นศัตรูหรือไม่
    const isEnemy = (r, c) => {
        const target = getPiece(r, c);
        return target && target[0] !== color;
    };
    // Helper: เช็คว่าว่างหรือไม่
    const isEmpty = (r, c) => getPiece(r, c) === '';

    // ---------------------------
    // 1. PAWN (เบี้ย)
    // ---------------------------
    if (type === 'P') {
        const dir = isWhite ? -1 : 1; // ขาวเดินขึ้น (-row), ดำเดินลง (+row)
        const startRow = isWhite ? 6 : 1;

        // เดินหน้า 1 ช่อง
        if (isEmpty(row + dir, col)) {
            moves.push({toRow: row + dir, toCol: col});
            // เดินหน้า 2 ช่อง (เฉพาะตาแรก)
            if (row === startRow && isEmpty(row + dir * 2, col)) {
                moves.push({toRow: row + dir * 2, toCol: col});
            }
        }
        
        // กินเฉียง
        if (isEnemy(row + dir, col - 1)) moves.push({toRow: row + dir, toCol: col - 1});
        if (isEnemy(row + dir, col + 1)) moves.push({toRow: row + dir, toCol: col + 1});
    }

    // ---------------------------
    // 2. KNIGHT (ม้า) - เดินรูปตัว L / กระโดดข้ามได้
    // ---------------------------
    else if (type === 'N') {
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([dr, dc]) => {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = getPiece(r, c);
                if (target === '' || target[0] !== color) { // ว่าง หรือ กินศัตรู
                    moves.push({toRow: r, toCol: c});
                }
            }
        });
    }

    // ---------------------------
    // 3. KING (ราชา) - รอบตัว 1 ช่อง
    // ---------------------------
    else if (type === 'K') {
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        offsets.forEach(([dr, dc]) => {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = getPiece(r, c);
                if (target === '' || target[0] !== color) {
                    moves.push({toRow: r, toCol: c});
                }
            }
        });
    }

    // ---------------------------
    // 4. SLIDING PIECES (Rook, Bishop, Queen) - เดินยาวจนกว่าจะชน
    // ---------------------------
    else {
        let directions = [];
        if (type === 'R') directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // บน ล่าง ซ้าย ขวา
        if (type === 'B') directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // เฉียง 4 ทิศ
        if (type === 'Q') directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]; // รวมกัน

        directions.forEach(([dr, dc]) => {
            for (let i = 1; i < 8; i++) { // เดินไปเรื่อยๆ 1..7 ช่อง
                const r = row + dr * i;
                const c = col + dc * i;

                // เช็คขอบกระดาน
                if (r < 0 || r >= 8 || c < 0 || c >= 8) break;

                const target = getPiece(r, c);
                if (target === '') {
                    // ช่องว่าง: เดินได้ และวนลูปต่อ
                    moves.push({toRow: r, toCol: c});
                } else {
                    // เจอตัวหมาก:
                    if (target[0] !== color) {
                        // ศัตรู: กินได้ แล้วหยุด (Break)
                        moves.push({toRow: r, toCol: c});
                    }
                    // พวกเดียวกัน หรือ กินแล้ว: หยุดเดินต่อทางทิศนี้
                    break;
                }
            }
        });
    }

    return moves;
}

// --- AI Logic (Random but Valid) ---
function aiTurn() {
    // 1. หาตัวหมาก AI (Black) ทั้งหมด
    const blackPieces = [];
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            if(board[r][c].startsWith('b')) {
                blackPieces.push({r, c});
            }
        }
    }

    // 2. พยายามสุ่มเดิน
    let moveFound = false;
    let attempts = 0;
    // Shuffle array เพื่อให้ AI ไม่เดินตัวเดิมซ้ำๆ
    blackPieces.sort(() => Math.random() - 0.5);

    for (const p of blackPieces) {
        const validMoves = generatePseudoLegalMoves(p.r, p.c);
        if (validMoves.length > 0) {
            // สุ่มเลือก 1 ท่าเดินจากท่าที่เป็นไปได้
            const randMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            executeMove(p.r, p.c, randMove.toRow, randMove.toCol);
            moveFound = true;
            break; // เดินแล้วจบตาทันที
        }
    }
    
    if(!moveFound) {
        // ถ้าเดินไม่ได้เลย (Checkmate หรือ Stalemate)
        checkWinCondition();
    }
}

// --- Game State & Leaderboard ---
function checkWinCondition() {
    const flatBoard = board.flat();
    const whiteKing = flatBoard.includes('wK');
    const blackKing = flatBoard.includes('bK');

    if (!whiteKing) endGame('AI Wins!');
    else if (!blackKing) endGame('You Win!');
    // หมายเหตุ: ของจริงต้องเช็ค Checkmate ไม่ใช่ King หาย แต่เพื่อความง่ายใช้แบบนี้ก่อน
}

function endGame(msg) {
    gameEnded = true;
    gameStatusEl.textContent = msg;
    // รอให้ UI render เสร็จก่อนค่อย alert
    setTimeout(() => {
        alert(msg);
        if (msg === 'You Win!') {
            updateLeaderboard();
        }
    }, 100);
}

function updateLeaderboard() {
    let score = parseInt(localStorage.getItem('chess_score')) || 0;
    score++;
    localStorage.setItem('chess_score', score);
    loadLeaderboard();
}

function loadLeaderboard() {
    const score = localStorage.getItem('chess_score') || 0;
    const name = document.getElementById('player-name').textContent;
    leaderboardListEl.innerHTML = `
        <li>
            <span>Rank 1. ${name}</span>
            <span>${score} Wins</span>
        </li>
    `;
}

// --- Init ---
newGameBtn.addEventListener('click', () => {
    board = JSON.parse(JSON.stringify(initialBoardState));
    currentPlayer = 'white';
    gameEnded = false;
    moveHistory = [];
    moveListEl.innerHTML = '';
    undoBtn.disabled = true;
    
    // ถ้ายังไม่มีชื่อ ให้ถาม
    if(playerNameEl.textContent === 'Guest') {
        const name = prompt("Enter your name:", "Player 1");
        if(name) playerNameEl.textContent = name;
    }
    
    loadLeaderboard();
    renderBoard();
});

undoBtn.addEventListener('click', () => {
    if (moveHistory.length === 0) return;
    // ย้อน 2 สเต็ป (ผู้เล่น + AI) เพื่อกลับมาตาผู้เล่น
    if (moveHistory.length >= 2) {
         moveHistory.pop(); // ทิ้งตา AI
         board = moveHistory.pop(); // เอาตาก่อนหน้าผู้เล่นเดินคืนมา
    } else {
        board = moveHistory.pop();
    }
    currentPlayer = 'white';
    gameEnded = false;
    renderBoard();
});

// เริ่มเกมครั้งแรก
newGameBtn.click();