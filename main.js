enchant();

var scene, game, field, map;

gsettings = {                 
	width:320
		,height:320
		,fps:30
};

var FPS = 30; // フレームレート
var MAX_ROW = 14+1; // 縦のマス数
var MAX_COL = 6+2; // 横のマス数
var CELL_SIZE = 16; // マスのサイズ(ぷよのpxサイズ)
var PUYOS_IMG = "puyo.png"


window.onload = function(){

	game = new Game(gsettings.width,gsettings.height);
	game.preload(PUYOS_IMG);
	game.fps = gsettings.fps;
	game.keybind(32,'a'); 
	scene = game.rootScene;     

	game.onload=function(){
		initGame();
		scene.addChild(map);
		var pair = createPair(game, map, field);
		scene.addChild(pair);
		scene.addEventListener("enterframe", function() { // １フレームごとに呼び出される関数を登録
			if (!pair.isFall) {                  // 操作ぷよの着地判定
				scene.removeChild(pair); // 操作ぷよをシーンから削除
				freeFall(field);                 // 自由落下
				chain(field);                    // 連鎖処理
				map.loadData(field);     // マップの再読み込み
				if (field[2][3] != -1) { // ゲームオーバー判定
					game.stop();
					alert("Game Over");
				} else {
					/* 操作ぷよを更新、シーンに追加 */
					pair = createPair(game, map, field);
					scene.addChild(pair);
				}
			}
		});
	};
	game.start();
};

function initGame(){
	map = new Map(CELL_SIZE,CELL_SIZE);
	field = new Array(MAX_ROW);
	for (var i=0; i<field.length; i++) {
		var temp_array = [];
		for (var j=0; j<MAX_COL; j++) {
			if (j==0 || j==MAX_COL-1 || i==MAX_ROW-1) temp_array[j] = 0; // ブロック(壁)を配置
			else temp_array[j] = -1; // 空
		}
		field[i] = temp_array;
	}
	map.image = game.assets[PUYOS_IMG];     // mapにぷよ画像を読みこませる
	map.loadData(field);    // mapにフィールドを読みこませる
	scene.addChild(map);    // マップをシーンに追加
}

function createPuyo (game){
	var puyo = new Sprite(CELL_SIZE, CELL_SIZE);
	puyo.image = game.assets[PUYOS_IMG];
	puyo.frame = Math.floor(Math.random()*4+1); // ランダムに色を選択
	puyo.moveTo(0, 0);
	return puyo;
}

function countPuyos (row, col, field) {
	var c = field[row][col];    // ぷよの色
	var n = 1;                  // 1で初期化しているのは自分もカウントするため。
	field[row][col] = -1; // この場所をチェックした証として一時的に空白に
	if (row-1>=2 && field[row-1][col]==c) n += countPuyos(row-1, col, field);   
	if (row+1<=MAX_ROW-2 && field[row+1][col]==c) n += countPuyos(row+1, col, field);
	if (col-1>=1 && field[row][col-1]==c) n += countPuyos(row, col-1, field);
	if (col+1<=MAX_COL-2 && field[row][col+1]==c) n += countPuyos(row, col+1, field);
	field[row][col] = c;                // 色を戻す
	return n;
}

function deletePuyos (row, col, field) {
	var c = field[row][col];    // ぷよの色
	field[row][col] = -1;               // ぷよを空に
	if (row-1>=2 && field[row-1][col]==c) deletePuyos(row-1, col, field);
	if (row+1<=MAX_ROW-2 && field[row+1][col]==c) deletePuyos(row+1, col, field);
	if (col-1>=1 && field[row][col-1]==c) deletePuyos(row, col-1, field);
	if (col+1<=MAX_COL-2 && field[row][col+1]==c) deletePuyos(row, col+1, field);
}

function freeFall (field) {
	var c = 0;                                  // おちたぷよの数
	for (var i=0; i<MAX_COL; i++) {
		var spaces = 0;
		for (var j=MAX_ROW-1; j>=0; j--) {
			if (field[j][i] == -1) spaces ++;
			else if (spaces >= 1) {     // 落ちるべきぷよがあった場合
				field[j+spaces][i] = field[j][i];
				field[j][i] = -1;
				c ++;
			}
		}
	}
	return c;
}

function chain (field) {
	for (var i=0; i<MAX_ROW; i++) {
		for (var j=0; j<MAX_COL; j++) {
			var n = 0; // つながっているぷよをカウントする変数を初期化
			if (field[i][j]>=1 && countPuyos(i, j, field)>=4){ // 同じ色のぷよが４つながっていた場合
				deletePuyos(i, j, field); // ぷよを消去
			};
		}
	}
	if (freeFall(field) >= 1) chain(field); // 自由落下したぷよがあった場合は再帰
}

function createPair (game, map, field) {
	var pair = new Group();
	var p0 = createPuyo(game);  // 回る側の操作ぷよ
	var p1 = createPuyo(game);  // 軸側の操作ぷよ
	var forms = [[0, -CELL_SIZE], [CELL_SIZE, 0], [0, CELL_SIZE], [-CELL_SIZE, 0]]; // 操作ぷよの形
	var formNum = 0;                    // 操作ぷよの形の番号。フォームナンバ
	/* キー押下カウント */
	var inputRightCount = 0;    
	var inputLeftCount = 0;
	var inputAcount = 0;
	pair.isFall = true;            // 落下中、つまり操作出来る状態かどうか
	pair.addChild(p0);             // 操作ぷよをシーンに追加
	pair.addChild(p1);
	p0.y = -CELL_SIZE;     // 回る側のぷよの初期位置を軸ぷよの一つ上へ
	pair.moveTo(CELL_SIZE*3, CELL_SIZE); // グループの初期位置を操作ぷよ出現場所へ
	pair.addEventListener("enterframe", function() {
		// フレーム毎の処理
		// /* キー連続押下カウントの更新 */
		inputRightCount = game.input.right ? inputRightCount+1 : 0;
		inputLeftCount = game.input.left ? inputLeftCount+1 : 0;
		inputACount = game.input.a ? inputACount+1 : 0;
		/* 回転 */
		if (inputACount == 1) {
			var newFormNum = (formNum+1) % 4; // 回転した場合のフォームナンバ
			var newX = forms[newFormNum][0];  // 回転先のx
			var newY = forms[newFormNum][1];  // 回転先のy
			if (!map.hitTest(this.x+newX, this.y+newY)) { // 回転可能判定
				formNum = newFormNum;
				p0.moveTo(newX, newY);
			}
		}
		/* 横移動 */
		var newX = 0;                   // 横移動先のx
		if (inputRightCount == 1) {
			newX = formNum==1 ? p0.x+CELL_SIZE : p1.x+CELL_SIZE;
		}
		if (inputLeftCount == 1) {
			newX = formNum==3 ? p0.x-CELL_SIZE : p1.x-CELL_SIZE;
		}
		if (!map.hitTest(this.x+newX, this.y+p0.y) && !map.hitTest(this.x+newX, this.y+p1.y)) { // 移動可能判定
			this.x = this.x + (newX?newX>=0?1:-1:0)*CELL_SIZE;
		}
		/* 落下 */
		newY = formNum==2 ? p0.y+CELL_SIZE : p1.y+CELL_SIZE;
		var vy = Math.floor(game.input.down ? game.fps/10 : game.fps/1); // 落下速度の設定 (10や1などの数値は何マス毎秒か
		if (game.frame%vy == 0) {
			if (!map.hitTest(this.x+p0.x, this.y+newY) && !map.hitTest(this.x+p1.x, this.y+newY)) { // 移動可能判定
				this.y += CELL_SIZE;
			} else {                    // 着地した場合
				/* フィールドに操作ぷよを追加 */
				field[(this.y+p0.y)/CELL_SIZE][(this.x+p0.x)/CELL_SIZE] = p0.frame;
				field[(this.y+p1.y)/CELL_SIZE][(this.x+p1.x)/CELL_SIZE] = p1.frame;
				pair.isFall = false; // 着地したので落下中フラグをfalseに
			}
		}    });
	return pair;
}
