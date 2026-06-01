import type { SpriteData } from '../types';

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  if (a === 0) return '';
  if (a < 255) {
    return '#' + [r, g, b, a].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function loadImageAsSpriteData(url: string, tileWidth?: number, tileHeight?: number): Promise<SpriteData | SpriteData[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      const isTileset = tileWidth && tileHeight;
      const w = isTileset ? tileWidth : img.width;
      const h = isTileset ? tileHeight : img.height;
      
      const cols = isTileset ? Math.floor(img.width / w) : 1;
      const rows = isTileset ? Math.floor(img.height / h) : 1;
      
      if (!isTileset) {
        const data = ctx.getImageData(0, 0, w, h).data;
        const sprite: SpriteData = [];
        for (let y = 0; y < h; y++) {
          const row: string[] = [];
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            row.push(rgbaToHex(data[i], data[i+1], data[i+2], data[i+3]));
          }
          sprite.push(row);
        }
        resolve(sprite);
        return;
      }

      const frames: SpriteData[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const data = ctx.getImageData(c * w, r * h, w, h).data;
          const sprite: SpriteData = [];
          for (let y = 0; y < h; y++) {
            const row: string[] = [];
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              row.push(rgbaToHex(data[i], data[i+1], data[i+2], data[i+3]));
            }
            sprite.push(row);
          }
          frames.push(sprite);
        }
      }
      resolve(frames);
    };
    img.onerror = () => reject(new Error('Failed to load image: ' + url));
    img.src = url;
  });
}

const FURNITURE_LIST = [
  'BIG_SOFA', 'BIN', 'BOOKSHELF', 'BRICK_WALL', 'CACTUS', 'CLOCK', 'COFFEE', 'COFFEE_TABLE', 'CUSHIONED_BENCH', 'CUSHIONED_CHAIR',
  'DESK', 'DOUBLE_BOOKSHELF', 'DRESSER', 'HANGING_PLANT', 'LARGE_PAINTING', 'LARGE_PLANT', 'PC', 'PLANT', 'PLANT_2',
  'POT', 'PRINTER', 'RETRO_PC', 'SMALL_PAINTING', 'SMALL_PAINTING_2', 'SMALL_TABLE', 'SOFA', 'TABLE_FRONT', 'WHITEBOARD',
  'WINDOW', 'WOODEN_BENCH', 'WOODEN_CHAIR'
];

export async function loadPixelOfficeAssets() {
  const [
    setFloorSprites,
    setWallSprites,
    setCharacterTemplates,
    buildDynamicCatalog
  ] = await Promise.all([
    import('../floorTiles').then(m => m.setFloorSprites),
    import('../wallTiles').then(m => m.setWallSprites),
    import('../sprites/spriteData').then(m => m.setCharacterTemplates),
    import('../layout/furnitureCatalog').then(m => m.buildDynamicCatalog)
  ]);

  const floors: SpriteData[] = [];
  for (let i = 0; i <= 8; i++) {
    try {
      const s = await loadImageAsSpriteData('/assets/pixel-office/floors/floor_' + i + '.png');
      floors.push(s as SpriteData);
    } catch(e) { console.warn(e); }
  }
  setFloorSprites(floors);

  const walls: SpriteData[][] = [];
  try {
    const wallTiles = await loadImageAsSpriteData('/assets/pixel-office/walls/wall_0.png', 16, 24) as SpriteData[];
    walls.push(wallTiles);
    setWallSprites(walls);
  } catch(e) { console.warn(e); }

  const chars = [];
  for (let i = 0; i <= 5; i++) {
    try {
      const frames = await loadImageAsSpriteData('/assets/pixel-office/characters/char_' + i + '.png', 16, 32) as SpriteData[];
      if (frames.length >= 21) {
        chars.push({
          down: frames.slice(0, 7),
          up: frames.slice(7, 14),
          right: frames.slice(14, 21)
        });
      }
    } catch(e) { console.warn(e); }
  }
  setCharacterTemplates(chars);

  const catalog: any[] = [];
  const sprites: Record<string, SpriteData> = {};

  for (const f of FURNITURE_LIST) {
    try {
      const res = await fetch('/assets/pixel-office/furniture/' + f + '/manifest.json');
      const manifest = await res.json();
      
      const members = manifest.members || [manifest];
      
      const extractAssets = async (membersArr: any[]) => {
        for (const member of membersArr) {
          if (member.type === 'asset') {
             const fileName = member.file || (member.id + '.png');
             const spriteData = await loadImageAsSpriteData('/assets/pixel-office/furniture/' + f + '/' + fileName) as SpriteData;
             sprites[member.id] = spriteData;
             
             catalog.push({
               id: member.id,
               name: manifest.name,
               label: manifest.name + (member.orientation ? ' - ' + member.orientation : ''),
               category: manifest.category,
               file: fileName,
               width: member.width,
               height: member.height,
               footprintW: member.footprintW,
               footprintH: member.footprintH,
               orientation: member.orientation,
               mirrorSide: member.mirrorSide,
               groupId: manifest.type === 'group' ? manifest.id : undefined,
               animationGroup: member.animationGroup || manifest.animationGroup,
               frame: member.frame,
               state: member.state
             });
          } else if (member.type === 'group' && member.members) {
            await extractAssets(member.members);
          }
        }
      };
      
      await extractAssets(members);
    } catch(e) {
      console.warn("Failed to load furniture", f, e);
    }
  }

  buildDynamicCatalog({ catalog, sprites });
}
