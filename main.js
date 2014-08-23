enchant();

var scene, game, field, map;

gsettings = {                 
	width:320
		,height:320
		,fps:30
};

var FPS = 30; // �t���[�����[�g
var MAX_ROW = 14+1; // �c�̃}�X��
var MAX_COL = 6+2; // ���̃}�X��
var CELL_SIZE = 16; // �}�X�̃T�C�Y(�Ղ��px�T�C�Y)
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
		scene.addEventListener("enterframe", function() { // �P�t���[�����ƂɌĂяo�����֐���o�^
			if (!pair.isFall) {                  // ����Ղ�̒��n����
				scene.removeChild(pair); // ����Ղ���V�[������폜
				freeFall(field);                 // ���R����
				chain(field);                    // �A������
				map.loadData(field);     // �}�b�v�̍ēǂݍ���
				if (field[2][3] != -1) { // �Q�[���I�[�o�[����
					game.stop();
					alert("Game Over");
				} else {
					/* ����Ղ���X�V�A�V�[���ɒǉ� */
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
			if (j==0 || j==MAX_COL-1 || i==MAX_ROW-1) temp_array[j] = 0; // �u���b�N(��)��z�u
			else temp_array[j] = -1; // ��
		}
		field[i] = temp_array;
	}
	map.image = game.assets[PUYOS_IMG];     // map�ɂՂ�摜��ǂ݂��܂���
	map.loadData(field);    // map�Ƀt�B�[���h��ǂ݂��܂���
	scene.addChild(map);    // �}�b�v���V�[���ɒǉ�
}

function createPuyo (game){
	var puyo = new Sprite(CELL_SIZE, CELL_SIZE);
	puyo.image = game.assets[PUYOS_IMG];
	puyo.frame = Math.floor(Math.random()*4+1); // �����_���ɐF��I��
	puyo.moveTo(0, 0);
	return puyo;
}

function countPuyos (row, col, field) {
	var c = field[row][col];    // �Ղ�̐F
	var n = 1;                  // 1�ŏ��������Ă���͎̂������J�E���g���邽�߁B
	field[row][col] = -1; // ���̏ꏊ���`�F�b�N�����؂Ƃ��Ĉꎞ�I�ɋ󔒂�
	if (row-1>=2 && field[row-1][col]==c) n += countPuyos(row-1, col, field);   
	if (row+1<=MAX_ROW-2 && field[row+1][col]==c) n += countPuyos(row+1, col, field);
	if (col-1>=1 && field[row][col-1]==c) n += countPuyos(row, col-1, field);
	if (col+1<=MAX_COL-2 && field[row][col+1]==c) n += countPuyos(row, col+1, field);
	field[row][col] = c;                // �F��߂�
	return n;
}

function deletePuyos (row, col, field) {
	var c = field[row][col];    // �Ղ�̐F
	field[row][col] = -1;               // �Ղ�����
	if (row-1>=2 && field[row-1][col]==c) deletePuyos(row-1, col, field);
	if (row+1<=MAX_ROW-2 && field[row+1][col]==c) deletePuyos(row+1, col, field);
	if (col-1>=1 && field[row][col-1]==c) deletePuyos(row, col-1, field);
	if (col+1<=MAX_COL-2 && field[row][col+1]==c) deletePuyos(row, col+1, field);
}

function freeFall (field) {
	var c = 0;                                  // �������Ղ�̐�
	for (var i=0; i<MAX_COL; i++) {
		var spaces = 0;
		for (var j=MAX_ROW-1; j>=0; j--) {
			if (field[j][i] == -1) spaces ++;
			else if (spaces >= 1) {     // ������ׂ��Ղ悪�������ꍇ
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
			var n = 0; // �Ȃ����Ă���Ղ���J�E���g����ϐ���������
			if (field[i][j]>=1 && countPuyos(i, j, field)>=4){ // �����F�̂Ղ悪�S�Ȃ����Ă����ꍇ
				deletePuyos(i, j, field); // �Ղ������
			};
		}
	}
	if (freeFall(field) >= 1) chain(field); // ���R���������Ղ悪�������ꍇ�͍ċA
}

function createPair (game, map, field) {
	var pair = new Group();
	var p0 = createPuyo(game);  // ��鑤�̑���Ղ�
	var p1 = createPuyo(game);  // �����̑���Ղ�
	var forms = [[0, -CELL_SIZE], [CELL_SIZE, 0], [0, CELL_SIZE], [-CELL_SIZE, 0]]; // ����Ղ�̌`
	var formNum = 0;                    // ����Ղ�̌`�̔ԍ��B�t�H�[���i���o
	/* �L�[�����J�E���g */
	var inputRightCount = 0;    
	var inputLeftCount = 0;
	var inputAcount = 0;
	pair.isFall = true;            // �������A�܂葀��o�����Ԃ��ǂ���
	pair.addChild(p0);             // ����Ղ���V�[���ɒǉ�
	pair.addChild(p1);
	p0.y = -CELL_SIZE;     // ��鑤�̂Ղ�̏����ʒu�����Ղ�̈���
	pair.moveTo(CELL_SIZE*3, CELL_SIZE); // �O���[�v�̏����ʒu�𑀍�Ղ�o���ꏊ��
	pair.addEventListener("enterframe", function() {
		// �t���[�����̏���
		// /* �L�[�A�������J�E���g�̍X�V */
		inputRightCount = game.input.right ? inputRightCount+1 : 0;
		inputLeftCount = game.input.left ? inputLeftCount+1 : 0;
		inputACount = game.input.a ? inputACount+1 : 0;
		/* ��] */
		if (inputACount == 1) {
			var newFormNum = (formNum+1) % 4; // ��]�����ꍇ�̃t�H�[���i���o
			var newX = forms[newFormNum][0];  // ��]���x
			var newY = forms[newFormNum][1];  // ��]���y
			if (!map.hitTest(this.x+newX, this.y+newY)) { // ��]�\����
				formNum = newFormNum;
				p0.moveTo(newX, newY);
			}
		}
		/* ���ړ� */
		var newX = 0;                   // ���ړ����x
		if (inputRightCount == 1) {
			newX = formNum==1 ? p0.x+CELL_SIZE : p1.x+CELL_SIZE;
		}
		if (inputLeftCount == 1) {
			newX = formNum==3 ? p0.x-CELL_SIZE : p1.x-CELL_SIZE;
		}
		if (!map.hitTest(this.x+newX, this.y+p0.y) && !map.hitTest(this.x+newX, this.y+p1.y)) { // �ړ��\����
			this.x = this.x + (newX?newX>=0?1:-1:0)*CELL_SIZE;
		}
		/* ���� */
		newY = formNum==2 ? p0.y+CELL_SIZE : p1.y+CELL_SIZE;
		var vy = Math.floor(game.input.down ? game.fps/10 : game.fps/1); // �������x�̐ݒ� (10��1�Ȃǂ̐��l�͉��}�X���b��
		if (game.frame%vy == 0) {
			if (!map.hitTest(this.x+p0.x, this.y+newY) && !map.hitTest(this.x+p1.x, this.y+newY)) { // �ړ��\����
				this.y += CELL_SIZE;
			} else {                    // ���n�����ꍇ
				/* �t�B�[���h�ɑ���Ղ��ǉ� */
				field[(this.y+p0.y)/CELL_SIZE][(this.x+p0.x)/CELL_SIZE] = p0.frame;
				field[(this.y+p1.y)/CELL_SIZE][(this.x+p1.x)/CELL_SIZE] = p1.frame;
				pair.isFall = false; // ���n�����̂ŗ������t���O��false��
			}
		}    });
	return pair;
}
