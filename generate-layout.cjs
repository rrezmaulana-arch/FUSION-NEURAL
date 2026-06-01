const fs = require('fs');

const cols = 44;
const rows = 26;

const tiles = new Array(cols * rows).fill(255);
const tileColors = new Array(cols * rows).fill(null);

function setTile(c, r, tileVal, colorVal) { 
    if (c >= 0 && c < cols && r >= 0 && r < rows) {
        let idx = r * cols + c;
        tiles[idx] = tileVal;
        tileColors[idx] = colorVal;
    }
}

function fillRect(c, r, w, h, tileVal, colorVal) { 
    for (let y = r; y < r + h; y++) {
        for (let x = c; x < c + w; x++) {
            setTile(x, y, tileVal, colorVal);
        }
    }
}

function fillCheckerboard(c, r, w, h, t1, c1, t2, c2) { 
    for (let y = r; y < r + h; y++) {
        for (let x = c; x < c + w; x++) {
            if ((x + y) % 2 === 0) setTile(x, y, t1, c1);
            else setTile(x, y, t2, c2);
        }
    }
}

function fillBorder(c, r, w, h, tc, cc, tb, cb) {
    for (let y = r; y < r + h; y++) {
        for (let x = c; x < c + w; x++) {
            if (x === c || x === c+w-1 || y === r || y === r+h-1) setTile(x, y, tb, cb);
            else setTile(x, y, tc, cc);
        }
    }
}

function drawRoom(c, r, w, h, fillType, ...args) {
    if (fillType === 'solid') fillRect(c, r, w, h, args[0], args[1]);
    else if (fillType === 'checker') fillCheckerboard(c, r, w, h, args[0], args[1], args[2], args[3]);
    else if (fillType === 'border') fillBorder(c, r, w, h, args[0], args[1], args[2], args[3]);
    
    for (let x = c; x < c + w; x++) { setTile(x, r, 0, null); setTile(x, r + h - 1, 0, null); }
    for (let y = r; y < r + h; y++) { setTile(c, y, 0, null); setTile(c + w - 1, y, 0, null); }
}

const woodLight = { h: 30, s: 50, b: 20, c: 10, colorize: true };
const woodDark = { h: 30, s: 50, b: 15, c: 10, colorize: true };
const woodWarmLight = { h: 20, s: 60, b: 20, c: 20, colorize: true };
const woodWarmDark = { h: 20, s: 60, b: 15, c: 20, colorize: true };
const carpetBlue1 = { h: 215, s: 50, b: 15, c: 10, colorize: true };
const carpetBlue2 = { h: 215, s: 50, b: 10, c: 10, colorize: true };
const carpetGreen1 = { h: 140, s: 30, b: 25, c: 0, colorize: true };
const carpetGreen2 = { h: 140, s: 30, b: 20, c: 0, colorize: true };
const tileGrey1 = { h: 0, s: 0, b: 50, c: 0, colorize: true };
const tileGrey2 = { h: 0, s: 0, b: 40, c: 0, colorize: true };
const wallColor = { h: 0, s: 0, b: 80, c: 0, colorize: true };

// Middle Hallway
fillRect(20, 2, 4, 23, 1, tileGrey1); 
fillCheckerboard(21, 2, 2, 23, 1, tileGrey1, 1, tileGrey2);

// Rooms Design
drawRoom(, , , , 'checker', 0, , 0, ); 
drawRoom(, , , , 'border', 0, , 0, ); 
drawRoom(, , , , 'border', 0, , 0, ); 
drawRoom(, , , , 'solid', 0, );
drawRoom(, , , , 'checker', 0, , 0, );

// DOORWAYS (Create 2-tile wide holes in both room walls AND hallway walls)
function makeDoorway(x1, x2, y) {
    setTile(x1, y, 1, tileGrey1); setTile(x1, y+1, 1, tileGrey1);
    setTile(x2, y, 1, tileGrey1); setTile(x2, y+1, 1, tileGrey1);
}

makeDoorway(19, 20, 8);  // Left Room 1
makeDoorway(19, 20, 20); // Left Room 2
makeDoorway(23, 24, 6);  // Right Room 1
makeDoorway(23, 24, 14); // Right Room 2
makeDoorway(23, 24, 21); // Right Room 3

for (let y = 2; y <= 24; y++) {
    if (tiles[y * cols + 20] !== 1) setTile(20, y, 0, wallColor);
    if (tiles[y * cols + 23] !== 1) setTile(23, y, 0, wallColor);
}
setTile(21, 2, 0, wallColor); setTile(22, 2, 0, wallColor);
setTile(21, 24, 0, wallColor); setTile(22, 24, 0, wallColor);

const furniture = [];
function addFurniture(type, col, row, mirrored=false) { furniture.push({ type, col, row, mirrored }); }

// === LEFT 1: DEV WORKSTATION ===
for (let row = 4; row <= 10; row += 5) {
    for (let col = 3; col <= 13; col += 5) {
        addFurniture('DESK_FRONT', col, row);
        addFurniture('PC_FRONT_OFF', col+1, row);
        addFurniture('WOODEN_CHAIR_BACK', col+1, row+1); // Tuck into desk
        addFurniture('COFFEE', col, row); // Left side of desk
        addFurniture('BIN', col, row+1); // Left side, under desk
    }
}
addFurniture('WHITEBOARD', 3, 3);
addFurniture('PLANT', 18, 3);
addFurniture('PLANT_2', 18, 14);
addFurniture('BOOKSHELF', 16, 3);
addFurniture('CLOCK', 10, 3);
addFurniture('LARGE_PLANT', 3, 14);
addFurniture('LARGE_PAINTING', 6, 3);
addFurniture('HANGING_PLANT', 12, 3);
addFurniture('CACTUS', 8, 4);

// === LEFT 2: LOUNGE / RECEPTION ===
addFurniture('CUSHIONED_BENCH', 5, 19);
addFurniture('CUSHIONED_BENCH', 7, 19);
addFurniture('CUSHIONED_CHAIR_FRONT', 5, 23);
addFurniture('CUSHIONED_CHAIR_FRONT', 7, 23);
addFurniture('COFFEE_TABLE', 5, 21);
addFurniture('COFFEE_TABLE', 7, 21);
addFurniture('COFFEE', 5, 21);
addFurniture('COFFEE', 8, 21);
addFurniture('PLANT_2', 3, 18);
addFurniture('CACTUS', 8, 18);
addFurniture('LARGE_PLANT', 3, 23);
addFurniture('LARGE_PAINTING', 10, 17);
addFurniture('HANGING_PLANT', 16, 17);
addFurniture('DESK_FRONT', 14, 21); 
addFurniture('PC_FRONT_OFF', 15, 21);
addFurniture('WOODEN_CHAIR_BACK', 15, 22);
addFurniture('BIN', 14, 22);
addFurniture('COFFEE', 14, 21);

// === RIGHT 1: EXECUTIVE BOARDROOM ===
addFurniture('TABLE_FRONT', 31, 5); // Huge table is 3x4
addFurniture('WOODEN_CHAIR_FRONT', 31, 4);
addFurniture('WOODEN_CHAIR_FRONT', 33, 4);
addFurniture('WOODEN_CHAIR_BACK', 31, 8);
addFurniture('WOODEN_CHAIR_BACK', 33, 8);
addFurniture('PC_FRONT_OFF', 32, 6);
addFurniture('COFFEE', 31, 5);
addFurniture('LARGE_PAINTING', 28, 3);
addFurniture('DOUBLE_BOOKSHELF', 25, 3);
addFurniture('CLOCK', 35, 3);
addFurniture('LARGE_PLANT', 40, 3);
addFurniture('LARGE_PLANT', 40, 9);
addFurniture('CACTUS', 26, 9);

// === RIGHT 2: FINANCE & ACCOUNTS ===
addFurniture('DESK_FRONT', 35, 13);
addFurniture('PC_FRONT_OFF', 36, 13);
addFurniture('WOODEN_CHAIR_BACK', 36, 14);
addFurniture('BOOKSHELF', 25, 12);
addFurniture('DOUBLE_BOOKSHELF', 27, 12);
addFurniture('BIN', 35, 14);
addFurniture('SMALL_PAINTING', 30, 12);
addFurniture('COFFEE', 35, 13);
addFurniture('PLANT', 40, 12);
addFurniture('DESK_FRONT', 27, 14);
addFurniture('PC_FRONT_OFF', 28, 14);
addFurniture('WOODEN_CHAIR_BACK', 28, 15);

// === RIGHT 3: MARKETING & STAFF ROOM ===
addFurniture('TABLE_FRONT', 32, 20);
addFurniture('CUSHIONED_CHAIR_BACK', 32, 23);
addFurniture('CUSHIONED_CHAIR_FRONT', 32, 19);
addFurniture('DOUBLE_BOOKSHELF', 25, 19);
addFurniture('COFFEE', 32, 20);
addFurniture('PLANT', 40, 19);
addFurniture('WHITEBOARD', 29, 19);
addFurniture('BIN', 35, 23);
addFurniture('LARGE_PAINTING', 36, 19);
addFurniture('CACTUS', 26, 23);

const layout = {
    version: 1, cols, rows, layoutRevision: Date.now(), tiles, tileColors, furniture
};

fs.writeFileSync('frontend/public/assets/pixel-office/default-layout-1.json', JSON.stringify(layout, null, 2));
console.log('Layout generated successfully.');
